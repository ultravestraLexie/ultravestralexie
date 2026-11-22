import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  DEAL_STAGES,
  summarizePipeline,
  type DealLike,
  type DealStage,
} from "@/lib/business/health";

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
const FINISHED_STAGES: DealStage[] = ["paid", "closed"];

const CreateSchema = z.object({
  brandName: z.string().trim().min(1).max(200),
  platform: z.enum(PLATFORMS).nullable().default(null),
  stage: z.enum(DEAL_STAGES).default("lead"),
  compensationCents: z.number().int().min(0).max(1_000_000_000).nullable().default(null),
  deliverables: z.string().trim().max(2000).default(""),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  proposalId: z.string().uuid().nullable().default(null),
  notes: z.string().trim().max(2000).default(""),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  brandName: z.string().trim().min(1).max(200).optional(),
  platform: z.enum(PLATFORMS).nullable().optional(),
  stage: z.enum(DEAL_STAGES).optional(),
  compensationCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  deliverables: z.string().trim().max(2000).optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  proposalId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(2000).optional(),
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
  created_at: string;
  updated_at: string;
};

const DEAL_COLUMNS =
  "id, brand_name, platform, stage, compensation_cents, deliverables, deadline, proposal_id, notes, created_at, updated_at";

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

    const deals = ((data ?? []) as DealRow[]).map(withOverdue);
    const pipeline = summarizePipeline(deals as DealLike[]);
    return Response.json({ success: true, deals, pipeline });
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
      })
      .select(DEAL_COLUMNS)
      .single();
    if (error) throw error;

    return Response.json(
      { success: true, deal: withOverdue(data as DealRow) },
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

  try {
    if (parsed.data.proposalId !== undefined) {
      const linkError = await validateProposalLink(
        owner.supabase,
        owner.userId,
        parsed.data.proposalId
      );
      if (linkError) return linkError;
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

    return Response.json({
      success: true,
      deal: withOverdue(data[0] as DealRow),
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
