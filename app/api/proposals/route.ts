import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import type { ProposalProofPoint } from "@/lib/proposals/compose";
import { logCreatorEvent } from "@/lib/events";

export const runtime = "nodejs";

// Proposal Builder — owner-only CRUD over public.proposals, plus a
// read of the caller's own Reputation Passport entries offered as
// selectable proof points. Same gate pattern as the other member
// API routes (see app/api/alerts/route.ts and lib/gate.ts): no
// session → 401, no active/trialing subscription → 403, enforced
// here AND by the middleware via lib/gate-paths.ts. All queries run
// through the session client (lib/supabase/server), so RLS applies
// as the signed-in user; every query is additionally scoped to the
// caller's own user_id in code.
//
// HONESTY RULE (binding): the platform ASSEMBLES the creator's own
// words and numbers — it does not write the pitch, invent claims,
// or estimate results. Every field of a proposal is creator-entered,
// except proof points, which are snapshotted at creation time from
// the creator's own passport_entries rows (never from anyone else's:
// each submitted proofPointId is checked against the caller's own
// entries and the create is rejected if any id is not theirs). The
// document the creator copies out is composed by the pure function
// in lib/proposals/compose.ts from exactly these stored pieces.
//
// PASSPORT SHAPE: passport_entries stores a `section` plus a
// per-section `payload` (jsonb) — there are no flat title/platform
// columns. toProofPoint() below is the one deterministic mapping
// from a stored entry to the {title, platform, metric, timeframe}
// shape the composer uses, applied identically in GET (what the
// page offers) and POST (what gets snapshotted).
//
// Money is integer cents (priceCents per deliverable) end to end,
// so every total is an exact sum (see lib/proposals/compose.ts).
//
// No model/AI calls. No rate limiter: the shared limiter in
// lib/rate-limit.ts is frozen and untouched; authenticated,
// subscription-gated CRUD is the v1 scope (the Revenue precedent).

const STATUSES = ["draft", "sent", "accepted", "declined"] as const;

type ProposalStatus = (typeof STATUSES)[number];

const MAX_PRICE_CENTS = 100_000_000; // $1,000,000.00 per deliverable unit

const DeliverableSchema = z.object({
  item: z.string().min(1).max(120),
  quantity: z.number().int().min(1).max(999),
  priceCents: z.number().int().min(0).max(MAX_PRICE_CENTS),
});

const CreateSchema = z.object({
  brandName: z.string().min(1).max(120),
  brandId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(160),
  deliverables: z.array(DeliverableSchema).max(20).default([]),
  audienceSummary: z.string().max(2000).default(""),
  campaignIdeas: z.array(z.string().max(300)).max(10).default([]),
  proofPointIds: z.array(z.string().uuid()).max(10).default([]),
  notes: z.string().max(2000).default(""),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUSES),
});

const IdSchema = z.object({
  id: z.string().uuid(),
});

type ProposalRow = {
  id: string;
  brand_id: string | null;
  brand_name: string;
  title: string;
  deliverables: { item: string; quantity: number; priceCents: number }[];
  audience_summary: string;
  campaign_ideas: string[];
  proof_points: ProposalProofPoint[];
  notes: string;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
};

const PROPOSAL_COLUMNS =
  "id, brand_id, brand_name, title, deliverables, audience_summary, campaign_ideas, proof_points, notes, status, created_at, updated_at";

type PassportEntryRow = {
  id: string;
  section: string;
  payload: Record<string, string>;
  verification_status: "platform_verified" | "self_reported";
  created_at: string;
};

const PASSPORT_COLUMNS =
  "id, section, payload, verification_status, created_at";

/** The one mapping from a stored Passport entry to a proof point.
 *  Each section's payload has its own fields (see
 *  app/api/passport/route.ts); the mapping uses only what the
 *  creator entered for that entry — nothing is derived or invented. */
function toProofPoint(entry: PassportEntryRow): ProposalProofPoint {
  const p = entry.payload ?? {};
  switch (entry.section) {
    case "performance":
      return {
        title: p.metricLabel ?? "",
        platform: p.platform ?? "",
        metric: p.value ?? "",
        timeframe: p.period ?? "",
      };
    case "collaborations":
      return {
        title: p.brandName ?? "",
        platform: "",
        metric: p.campaignDescription ?? "",
        timeframe: p.dateRange ?? "",
      };
    case "portfolio":
      return {
        title: p.title ?? "",
        platform: p.platform ?? "",
        metric: p.link ?? "",
        timeframe: "",
      };
    case "testimonials":
      return {
        title: p.quote ?? "",
        platform: "",
        metric: [p.authorName, p.authorRole].filter(Boolean).join(", "),
        timeframe: "",
      };
    case "credentials":
      return {
        title: p.name ?? "",
        platform: "",
        metric: p.issuer ?? "",
        timeframe: p.date ?? "",
      };
    default:
      return { title: "", platform: "", metric: "", timeframe: "" };
  }
}

type PassportEntryView = ProposalProofPoint & {
  id: string;
  section: string;
  verification_status: "platform_verified" | "self_reported";
};

function toPassportEntryView(entry: PassportEntryRow): PassportEntryView {
  return {
    id: entry.id,
    section: entry.section,
    verification_status: entry.verification_status,
    ...toProofPoint(entry),
  };
}

/** Gate + identity for every handler: 401 when signed out, 403 when
 *  not subscribed, otherwise the session client and the caller's id. */
async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        { error: gate === "login" ? "Not authenticated" : "Subscription required" },
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
        { error: "Not authenticated" },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

type Owner = Extract<Awaited<ReturnType<typeof requireOwner>>, { ok: true }>;

/** The caller's own Passport entries, in the normalized proof-point
 *  shape the page offers as checkboxes. */
async function listPassportEntries(owner: Owner) {
  const { data, error } = await owner.supabase
    .from("passport_entries")
    .select(PASSPORT_COLUMNS)
    .eq("user_id", owner.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Proposals passport load error:", error);
    return { ok: false as const };
  }
  return {
    ok: true as const,
    entries: ((data ?? []) as PassportEntryRow[]).map(toPassportEntryView),
  };
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { data, error } = await owner.supabase
    .from("proposals")
    .select(PROPOSAL_COLUMNS)
    .eq("user_id", owner.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Proposals list error:", error);
    return Response.json(
      { error: "Your proposals could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  const passport = await listPassportEntries(owner);
  if (!passport.ok) {
    return Response.json(
      { error: "Your proposals could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    proposals: (data ?? []) as ProposalRow[],
    passportEntries: passport.entries,
  });
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your proposal details." },
      { status: 400 }
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your proposal details." },
      { status: 400 }
    );
  }

  // Proof points: every submitted id must be one of the CALLER's own
  // Passport entries. The chosen entries' fields are snapshotted
  // into the proposal (in the order the creator picked them), so the
  // stored proposal keeps the wording as it was when it was built.
  const proofPointIds = [...new Set(parsed.data.proofPointIds)];
  let proofPoints: ProposalProofPoint[] = [];
  if (proofPointIds.length > 0) {
    const { data, error } = await owner.supabase
      .from("passport_entries")
      .select(PASSPORT_COLUMNS)
      .eq("user_id", owner.userId)
      .in("id", proofPointIds);

    if (error) {
      console.error("Proposals proof point load error:", error);
      return Response.json(
        { error: "Your proposal could not be saved. Please try again." },
        { status: 500 }
      );
    }

    const byId = new Map(
      ((data ?? []) as PassportEntryRow[]).map((entry) => [entry.id, entry])
    );
    if (proofPointIds.some((id) => !byId.has(id))) {
      return Response.json(
        { error: "Please check your proposal details." },
        { status: 400 }
      );
    }
    proofPoints = proofPointIds.map((id) => toProofPoint(byId.get(id)!));
  }

  const { data, error } = await owner.supabase
    .from("proposals")
    .insert({
      user_id: owner.userId,
      brand_id: parsed.data.brandId ?? null,
      brand_name: parsed.data.brandName,
      title: parsed.data.title,
      deliverables: parsed.data.deliverables,
      audience_summary: parsed.data.audienceSummary,
      campaign_ideas: parsed.data.campaignIdeas,
      proof_points: proofPoints,
      notes: parsed.data.notes,
      status: "draft",
    })
    .select(PROPOSAL_COLUMNS)
    .single();

  if (error) {
    console.error("Proposals create error:", error);
    return Response.json(
      { error: "Your proposal could not be saved. Please try again." },
      { status: 500 }
    );
  }

  await logCreatorEvent(
    owner.supabase,
    owner.userId,
    "proposal_created",
    "proposal",
    (data as ProposalRow).id,
    { brand_name: parsed.data.brandName }
  );

  return Response.json(
    { success: true, proposal: data as ProposalRow },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your update details." },
      { status: 400 }
    );
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your update details." },
      { status: 400 }
    );
  }

  // Fetch the caller's own proposal first: an id belonging to
  // anyone else matches nothing — the same 404 as a missing one.
  // In v1 the only patch is the status the creator controls.
  const { data: existing, error: fetchError } = await owner.supabase
    .from("proposals")
    .select(PROPOSAL_COLUMNS)
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .single();

  if (fetchError || !existing) {
    return Response.json({ error: "Proposal not found." }, { status: 404 });
  }

  const { data, error } = await owner.supabase
    .from("proposals")
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select(PROPOSAL_COLUMNS)
    .single();

  if (error) {
    console.error("Proposals update error:", error);
    return Response.json(
      { error: "Your proposal could not be updated. Please try again." },
      { status: 500 }
    );
  }

  const existingRow = existing as ProposalRow;
  if (existingRow.status !== parsed.data.status) {
    await logCreatorEvent(
      owner.supabase,
      owner.userId,
      "proposal_status_changed",
      "proposal",
      parsed.data.id,
      { from: existingRow.status, to: parsed.data.status }
    );
  }

  return Response.json({ success: true, proposal: data as ProposalRow });
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = IdSchema.safeParse({ id: searchParams.get("id") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your proposal details." },
      { status: 400 }
    );
  }

  // Scoped to the caller's own rows in code as well as by RLS: an id
  // belonging to anyone else simply matches nothing.
  const { data, error } = await owner.supabase
    .from("proposals")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");

  if (error) {
    console.error("Proposals delete error:", error);
    return Response.json(
      { error: "Your proposal could not be deleted. Please try again." },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return Response.json({ error: "Proposal not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
