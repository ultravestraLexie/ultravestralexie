import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  DEAL_STAGES,
  computeDealPayment,
  daysBetweenDates,
  summarizeBrandPayments,
  summarizePipeline,
  type DealLike,
  type DealPayment,
  type DealStage,
} from "@/lib/business/health";
import { logCreatorEvent, logDealStageChange } from "@/lib/events";

export const runtime = "nodejs";

// Brand Deal & Partnership Manager — owner-only CRUD over
// public.creator_deals, the creator's own deal pipeline.
//
// ISOLATION (binding): session client (RLS own-row policies
// apply) and every query scoped to the caller's user_id in code.
// The caller's id comes from the session — never from the request.
//
// HONESTY RULE (binding): a deal's stage is the creator's own
// workflow label. Moving a deal to 'paid' records the creator's
// tracking, NOT a verified payment — UltraVestra did not receive
// or confirm the money. Money truth lives only in the Revenue
// Tracker (public.revenue_entries). The page and this API say so.
//
// INTEGRATION, NOT DUPLICATION: a deal may link to one of the
// creator's own proposals (proposal_id, validated against the
// caller's own proposals before it is stored). The proposal
// itself stays in the Proposal Builder; Campaign Match briefs
// stay in Campaign Match. This route manages the pipeline only.
//
// OVERDUE is computed here, never stored: deadline before today
// (UTC date) and the stage is not a finished one ('paid'/'closed').
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts).

const PLATFORMS = ["tiktok", "instagram", "facebook", "trybe", "other"] as const;
const FINISHED_STAGES: DealStage[] = ["paid", "lost"];

const DateOrNull = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();

const CreateSchema = z.object({
  brandName: z.string().trim().min(1).max(200),
  platform: z.enum(PLATFORMS).nullable().default(null),
  stage: z.enum(DEAL_STAGES).default("pitched"),
  compensationCents: z.number().int().min(0).max(1_000_000_000).nullable().default(null),
  deliverables: z.string().trim().max(2000).default(""),
  deadline: DateOrNull.default(null),
  proposalId: z.string().uuid().nullable().default(null),
  notes: z.string().trim().max(2000).default(""),
  // Build 12 — deal payment intelligence (owner's full spec):
  // invoice date, payment terms, due date, received date, and the
  // amount actually received. Remaining balance is computed.
  invoiceSentDate: DateOrNull.default(null),
  paymentTerms: z
    .enum(["due_on_receipt", "net_7", "net_14", "net_30", "net_45", "net_60", "other"])
    .nullable()
    .default(null),
  paymentDueDate: DateOrNull.default(null),
  paymentReceivedDate: DateOrNull.default(null),
  amountReceivedCents: z.number().int().min(0).max(1_000_000_000).nullable().default(null),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  brandName: z.string().trim().min(1).max(200).optional(),
  platform: z.enum(PLATFORMS).nullable().optional(),
  stage: z.enum(DEAL_STAGES).optional(),
  compensationCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  deliverables: z.string().trim().max(2000).optional(),
  deadline: DateOrNull.optional(),
  proposalId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(2000).optional(),
  invoiceSentDate: DateOrNull.optional(),
  paymentTerms: z
    .enum(["due_on_receipt", "net_7", "net_14", "net_30", "net_45", "net_60", "other"])
    .nullable()
    .optional(),
  paymentDueDate: DateOrNull.optional(),
  paymentReceivedDate: DateOrNull.optional(),
  amountReceivedCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
});

const IdSchema = z.object({
  id: z.string().uuid(),
});

type DealRow = {
  id: string;
  brand_name: string;
  platform: string | null;
  stage: DealStage;
  compensation_cents: number | null;
  deliverables: string;
  deadline: string | null;
  proposal_id: string | null;
  notes: string;
  invoice_sent_date: string | null;
  payment_terms: string | null;
  payment_due_date: string | null;
  payment_received_date: string | null;
  amount_received_cents: number | null;
  created_at: string;
  updated_at: string;
};

const DEAL_COLUMNS =
  "id, brand_name, platform, stage, compensation_cents, deliverables, deadline, proposal_id, notes, invoice_sent_date, payment_terms, payment_due_date, payment_received_date, amount_received_cents, created_at, updated_at";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function withOverdue(deal: DealRow) {
  const overdue =
    deal.deadline !== null &&
    deal.deadline < todayUtc() &&
    !FINISHED_STAGES.includes(deal.stage);
  return { ...deal, overdue };
}

/* Build 12 — payment intelligence comes from the shared pure
 * computation in lib/business/health (computeDealPayment), so the
 * Deals page, the follow-up queue, brand history, and Business
 * Health can never disagree about who owes what. */
function withPayment(deal: DealRow): DealRow & { payment: DealPayment } {
  return { ...deal, payment: computeDealPayment(deal as DealLike) };
}

/* Build 12 — the follow-up queue, computed from the creator's own
 * deals and proposals: payments to chase, proposals waiting on a
 * brand, and deals gone quiet. Ages come from real timestamps; the
 * 3-day threshold keeps fresh items out of the creator's face. */
export type FollowUp = {
  type: "payment" | "proposal" | "quiet";
  brandName: string;
  dealId: string | null;
  proposalId: string | null;
  cents: number | null;
  days: number;
  overdue: boolean;
  stage: string | null;
};

function buildFollowUps(
  deals: (DealRow & { payment: DealPayment })[],
  proposals: {
    id: string;
    brand_name: string;
    status: string;
    created_at: string;
    updated_at: string;
  }[]
): FollowUp[] {
  const today = todayUtc();
  const items: FollowUp[] = [];

  for (const d of deals) {
    if (d.payment.outstanding) {
      items.push({
        type: "payment",
        brandName: d.brand_name,
        dealId: d.id,
        proposalId: null,
        // The queue chases the REMAINING balance — a partial
        // payment shrinks the chase, full payment removes it.
        cents: d.payment.remainingCents ?? d.compensation_cents,
        days: d.payment.daysOutstanding ?? 0,
        overdue: d.payment.overdue,
        stage: d.stage,
      });
    } else if (
      (d.stage === "pitched" || d.stage === "negotiating") &&
      !FINISHED_STAGES.includes(d.stage)
    ) {
      const days = Math.max(0, daysBetweenDates(d.updated_at.slice(0, 10), today));
      if (days >= 3) {
        items.push({
          type: "quiet",
          brandName: d.brand_name,
          dealId: d.id,
          proposalId: null,
          cents: d.compensation_cents,
          days,
          overdue: false,
          stage: d.stage,
        });
      }
    }
  }

  for (const p of proposals) {
    if (p.status !== "sent") continue;
    const stamp = (p.updated_at ?? p.created_at).slice(0, 10);
    const days = Math.max(0, daysBetweenDates(stamp, today));
    if (days >= 3) {
      items.push({
        type: "proposal",
        brandName: p.brand_name,
        dealId: null,
        proposalId: p.id,
        cents: null,
        days,
        overdue: false,
        stage: null,
      });
    }
  }

  const rank = { payment: 0, proposal: 1, quiet: 2 } as const;
  items.sort(
    (a, b) =>
      rank[a.type] - rank[b.type] ||
      Number(b.overdue) - Number(a.overdue) ||
      b.days - a.days
  );
  return items.slice(0, 12);
}

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use your Brand Deals."
              : "An active subscription is required to use your Brand Deals.",
        },
        { status: gate === "login" ? 401 : 403 }
      ),
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "Please log in to use your Brand Deals." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** A proposal link is stored only if the proposal is the
 *  caller's own — a deal can never point at another creator's
 *  proposal. Returns an error response, or null when clear. */
async function validateProposalLink(
  supabase: Supabase,
  userId: string,
  proposalId: string | null
): Promise<Response | null> {
  if (proposalId === null) return null;
  const { data, error } = await supabase
    .from("proposals")
    .select("id")
    .eq("id", proposalId)
    .eq("user_id", userId);
  if (error) throw error;
  if (!data || data.length === 0) {
    return Response.json(
      { error: "That proposal could not be found among your proposals." },
      { status: 400 }
    );
  }
  return null;
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  try {
    const { data, error } = await owner.supabase
      .from("creator_deals")
      .select(DEAL_COLUMNS)
      .eq("user_id", owner.userId)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const baseDeals = ((data ?? []) as DealRow[]).map((d) =>
      withPayment(withOverdue(d))
    );

    // Build 14 — deliverables tracked under each deal (content
    // deadlines + revision rounds). A failure here degrades the
    // deliverable lists, never the deals themselves. Overdue is
    // computed, never stored: due date passed and the item is
    // not yet approved by the brand.
    const { data: itemRows } = await owner.supabase
      .from("deal_deliverables")
      .select(
        "id, deal_id, title, due_date, status, revisions, post_id, created_at, updated_at"
      )
      .eq("user_id", owner.userId)
      .order("created_at", { ascending: true });
    const today = todayUtc();
    const itemsByDeal = new Map<string, Record<string, unknown>[]>();
    for (const row of (itemRows ?? []) as Record<string, unknown>[]) {
      const dealId = row.deal_id as string;
      const item = {
        ...row,
        overdue:
          typeof row.due_date === "string" &&
          (row.due_date as string) < today &&
          row.status !== "approved",
      };
      const list = itemsByDeal.get(dealId) ?? [];
      list.push(item);
      itemsByDeal.set(dealId, list);
    }
    // Build 16b — the attribution audit trail per deal: who
    // changed a deliverable's post link, when, from what to
    // what (titles frozen at the moment of change). A failure
    // degrades the history, never the deals.
    const historyByDeal = new Map<string, Record<string, unknown>[]>();
    const { data: eventRows } = await owner.supabase
      .from("attribution_events")
      .select(
        "id, deal_id, deliverable_title, action, from_post_title, to_post_title, created_at"
      )
      .eq("user_id", owner.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    for (const row of (eventRows ?? []) as Record<string, unknown>[]) {
      const dealId = row.deal_id as string;
      const list = historyByDeal.get(dealId) ?? [];
      if (list.length < 10) list.push(row);
      historyByDeal.set(dealId, list);
    }

    const deals = baseDeals.map((d) => ({
      ...d,
      deliverable_items: itemsByDeal.get(d.id) ?? [],
      attribution_history: historyByDeal.get(d.id) ?? [],
    }));
    const pipeline = summarizePipeline(deals as DealLike[]);

    // Follow-up queue inputs: the creator's own sent proposals.
    // A failure here degrades the queue, never the deals list.
    const { data: proposalRows } = await owner.supabase
      .from("proposals")
      .select("id, brand_name, status, created_at, updated_at")
      .eq("user_id", owner.userId)
      .eq("status", "sent");
    const followUps = buildFollowUps(
      deals,
      (proposalRows ?? []) as {
        id: string;
        brand_name: string;
        status: string;
        created_at: string;
        updated_at: string;
      }[]
    );
    const brandHistory = summarizeBrandPayments(deals as DealLike[]);
    return Response.json({ success: true, deals, pipeline, followUps, brandHistory });
  } catch (e) {
    console.error("Deals load error:", e);
    return Response.json(
      { error: "Your deals could not be loaded. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your deal details." },
      { status: 400 }
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your deal details." },
      { status: 400 }
    );
  }

  try {
    const linkError = await validateProposalLink(
      owner.supabase,
      owner.userId,
      parsed.data.proposalId
    );
    if (linkError) return linkError;

    const { data, error } = await owner.supabase
      .from("creator_deals")
      .insert({
        user_id: owner.userId,
        brand_name: parsed.data.brandName,
        platform: parsed.data.platform,
        stage: parsed.data.stage,
        compensation_cents: parsed.data.compensationCents,
        deliverables: parsed.data.deliverables,
        deadline: parsed.data.deadline,
        proposal_id: parsed.data.proposalId,
        notes: parsed.data.notes,
        invoice_sent_date: parsed.data.invoiceSentDate,
        payment_terms: parsed.data.paymentTerms,
        payment_due_date: parsed.data.paymentDueDate,
        payment_received_date: parsed.data.paymentReceivedDate,
        amount_received_cents: parsed.data.amountReceivedCents,
      })
      .select(DEAL_COLUMNS)
      .single();
    if (error) throw error;

    const created = data as DealRow;
    await logCreatorEvent(
      owner.supabase,
      owner.userId,
      "deal_created",
      "deal",
      created.id,
      { brand_name: created.brand_name, stage: created.stage }
    );
    await logDealStageChange(
      owner.supabase,
      owner.userId,
      created.id,
      null,
      created.stage
    );

    return Response.json(
      { success: true, deal: withPayment(withOverdue(data as DealRow)) },
      { status: 201 }
    );
  } catch (e) {
    console.error("Deals create error:", e);
    return Response.json(
      { error: "Your deal could not be saved. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your deal details." },
      { status: 400 }
    );
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your deal details." },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.brandName !== undefined) update.brand_name = parsed.data.brandName;
  if (parsed.data.platform !== undefined) update.platform = parsed.data.platform;
  if (parsed.data.stage !== undefined) update.stage = parsed.data.stage;
  if (parsed.data.compensationCents !== undefined)
    update.compensation_cents = parsed.data.compensationCents;
  if (parsed.data.deliverables !== undefined)
    update.deliverables = parsed.data.deliverables;
  if (parsed.data.deadline !== undefined) update.deadline = parsed.data.deadline;
  if (parsed.data.proposalId !== undefined)
    update.proposal_id = parsed.data.proposalId;
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;
  if (parsed.data.invoiceSentDate !== undefined)
    update.invoice_sent_date = parsed.data.invoiceSentDate;
  if (parsed.data.paymentTerms !== undefined)
    update.payment_terms = parsed.data.paymentTerms;
  if (parsed.data.paymentDueDate !== undefined)
    update.payment_due_date = parsed.data.paymentDueDate;
  if (parsed.data.paymentReceivedDate !== undefined)
    update.payment_received_date = parsed.data.paymentReceivedDate;
  if (parsed.data.amountReceivedCents !== undefined)
    update.amount_received_cents = parsed.data.amountReceivedCents;

  try {
    if (parsed.data.proposalId !== undefined) {
      const linkError = await validateProposalLink(
        owner.supabase,
        owner.userId,
        parsed.data.proposalId
      );
      if (linkError) return linkError;
    }

    // Build 4: capture the stage BEFORE the update so a stage
    // change can be recorded honestly (from → to) in the history
    // table instead of being overwritten without a trace.
    let priorStage: string | null = null;
    if (parsed.data.stage !== undefined) {
      const { data: current } = await owner.supabase
        .from("creator_deals")
        .select("stage")
        .eq("id", parsed.data.id)
        .eq("user_id", owner.userId)
        .maybeSingle();
      priorStage = (current as { stage: string } | null)?.stage ?? null;
    }

    const { data, error } = await owner.supabase
      .from("creator_deals")
      .update(update)
      .eq("id", parsed.data.id)
      .eq("user_id", owner.userId)
      .select(DEAL_COLUMNS);
    if (error) throw error;
    if (!data || data.length === 0) {
      return Response.json({ error: "Deal not found." }, { status: 404 });
    }

    if (
      parsed.data.stage !== undefined &&
      priorStage !== null &&
      priorStage !== parsed.data.stage
    ) {
      await logDealStageChange(
        owner.supabase,
        owner.userId,
        parsed.data.id,
        priorStage,
        parsed.data.stage
      );
      await logCreatorEvent(
        owner.supabase,
        owner.userId,
        "deal_stage_changed",
        "deal",
        parsed.data.id,
        { from: priorStage, to: parsed.data.stage }
      );
    }

    return Response.json({
      success: true,
      deal: withPayment(withOverdue(data[0] as DealRow)),
    });
  } catch (e) {
    console.error("Deals update error:", e);
    return Response.json(
      { error: "Your deal could not be updated. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = IdSchema.safeParse({ id: searchParams.get("id") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your deal details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("creator_deals")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");

  if (error) {
    console.error("Deals delete error:", error);
    return Response.json(
      { error: "Your deal could not be deleted. Please try again." },
      { status: 500 }
    );
  }
  if (!data || data.length === 0) {
    return Response.json({ error: "Deal not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
