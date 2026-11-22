import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";

export const runtime = "nodejs";

// Creator Growth Map — owner-only CRUD over public.growth_items.
// Same gate pattern as the other member API routes (see
// app/api/passport/route.ts and lib/gate.ts): no session → 401, no
// active/trialing subscription → 403, enforced here AND by the
// middleware via lib/gate-paths.ts. All queries run through the
// session client (lib/supabase/server), so RLS applies as the
// signed-in user; every query is additionally scoped to the caller's
// own user_id in code, the way app/saved/page.tsx scopes its reads.
//
// WHAT THIS STORES: the creator's own plan — objectives they set,
// experiments they are running, content gaps they noticed. Every row
// is creator-entered. Nothing here is platform analytics, a platform
// measurement, or a platform-detected finding, and the page presents
// it as exactly that.
//
// STATUS SETS differ per kind and are enforced here, next to the
// payload schemas (the database check is the simple union):
//   objective  → active | achieved | archived
//   experiment → planned | running | done
//   gap        → open | addressed
// progress_percent is the creator-set progress on an objective
// (integer 0–100), a column of its own because PATCH updates it
// independently; experiments and gaps always store NULL there.
//
// No model/AI calls. No rate limiter: the shared limiter in
// lib/rate-limit.ts is frozen and untouched; authenticated,
// subscription-gated CRUD is the v1 scope.

const KINDS = ["objective", "experiment", "gap"] as const;

type Kind = (typeof KINDS)[number];

const OBJECTIVE_STATUSES = ["active", "achieved", "archived"] as const;
const EXPERIMENT_STATUSES = ["planned", "running", "done"] as const;
const GAP_STATUSES = ["open", "addressed"] as const;

type ObjectiveStatus = (typeof OBJECTIVE_STATUSES)[number];
type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];
type GapStatus = (typeof GAP_STATUSES)[number];

type ItemStatus = ObjectiveStatus | ExperimentStatus | GapStatus;

// Per-kind payload shapes. All values are creator-entered text;
// bounds mirror the Passport payload discipline (every field
// length-capped, required fields non-empty).
const ObjectivePayload = z.object({
  title: z.string().min(1).max(200),
  metric: z.string().min(1).max(200),
  target: z.string().min(1).max(200),
  targetDate: z.string().max(120).default(""),
});

const ExperimentPayload = z.object({
  title: z.string().min(1).max(200),
  hypothesis: z.string().min(1).max(1000),
  measure: z.string().min(1).max(500),
  // The outcome, filled in when the experiment is done. Set at
  // creation to "" and written later through PATCH — never required
  // up front.
  result: z.string().max(1000).default(""),
});

const GapPayload = z.object({
  title: z.string().min(1).max(200),
  note: z.string().min(1).max(1000),
});

// A discriminated union on `kind`, so a payload can only ever be
// stored under the kind whose shape it matches, and a status can
// only ever be one of that kind's own values. progressPercent is
// objectives-only: the experiment and gap variants do not accept the
// field at all (unknown fields are stripped by zod, and the insert
// below writes NULL for those kinds regardless).
const CreateSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("objective"),
    payload: ObjectivePayload,
    status: z.enum(OBJECTIVE_STATUSES).default("active"),
    progressPercent: z.number().int().min(0).max(100).default(0),
  }),
  z.object({
    kind: z.literal("experiment"),
    payload: ExperimentPayload,
    status: z.enum(EXPERIMENT_STATUSES).default("planned"),
  }),
  z.object({
    kind: z.literal("gap"),
    payload: GapPayload,
    status: z.enum(GAP_STATUSES).default("open"),
  }),
]);

// Per-kind PATCH shapes. A patch is validated against the kind of
// the item it targets (fetched first), so an objective's status can
// never be set to an experiment value, an experiment can never gain
// a progress value, and a gap accepts nothing but its own statuses.
const ObjectivePatch = z.object({
  status: z.enum(OBJECTIVE_STATUSES).optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
});

const ExperimentPatch = z.object({
  status: z.enum(EXPERIMENT_STATUSES).optional(),
  result: z.string().max(1000).optional(),
});

const GapPatch = z.object({
  status: z.enum(GAP_STATUSES).optional(),
});

const IdSchema = z.object({
  id: z.string().uuid(),
});

type GrowthItemRow = {
  id: string;
  kind: Kind;
  payload: Record<string, string>;
  status: ItemStatus;
  progress_percent: number | null;
  created_at: string;
  updated_at: string;
};

const ITEM_COLUMNS =
  "id, kind, payload, status, progress_percent, created_at, updated_at";

/** Gate + identity for every handler: 401 when signed out, 403 when
 *  not subscribed, otherwise the session client and the caller's id. */
async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use your Growth Map."
              : "An active subscription is required to use your Growth Map.",
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
        { error: "Please log in to use your Growth Map." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { data, error } = await owner.supabase
    .from("growth_items")
    .select(ITEM_COLUMNS)
    .eq("user_id", owner.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Growth Map list error:", error);
    return Response.json(
      { error: "Your growth map could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    items: (data ?? []) as GrowthItemRow[],
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
      { error: "Please check your item details." },
      { status: 400 }
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your item details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("growth_items")
    .insert({
      user_id: owner.userId,
      kind: parsed.data.kind,
      payload: parsed.data.payload,
      status: parsed.data.status,
      // Only objectives carry a progress value; the other kinds'
      // schemas never accepted one, and their rows store NULL.
      progress_percent:
        parsed.data.kind === "objective" ? parsed.data.progressPercent : null,
    })
    .select(ITEM_COLUMNS)
    .single();

  if (error) {
    console.error("Growth Map create error:", error);
    return Response.json(
      { error: "Your item could not be saved. Please try again." },
      { status: 500 }
    );
  }

  return Response.json(
    { success: true, item: data as GrowthItemRow },
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

  const idParsed = IdSchema.safeParse(body);
  if (!idParsed.success) {
    return Response.json(
      { error: "Please check your update details." },
      { status: 400 }
    );
  }
  const { id, ...patchFields } = body as Record<string, unknown>;

  // Fetch the caller's own item first: the patch is validated
  // against the item's kind, and an id belonging to anyone else
  // matches nothing — the same 404 as a missing item.
  const { data: existing, error: fetchError } = await owner.supabase
    .from("growth_items")
    .select(ITEM_COLUMNS)
    .eq("id", idParsed.data.id)
    .eq("user_id", owner.userId)
    .single();

  if (fetchError || !existing) {
    return Response.json({ error: "Item not found." }, { status: 404 });
  }
  const item = existing as GrowthItemRow;

  const updates: {
    status?: ItemStatus;
    progress_percent?: number;
    payload?: Record<string, string>;
  } = {};

  if (item.kind === "objective") {
    const patch = ObjectivePatch.safeParse(patchFields);
    if (!patch.success) {
      return Response.json(
        { error: "Please check your update details." },
        { status: 400 }
      );
    }
    if (patch.data.status !== undefined) updates.status = patch.data.status;
    if (patch.data.progressPercent !== undefined) {
      updates.progress_percent = patch.data.progressPercent;
    }
  } else if (item.kind === "experiment") {
    const patch = ExperimentPatch.safeParse(patchFields);
    if (!patch.success) {
      return Response.json(
        { error: "Please check your update details." },
        { status: 400 }
      );
    }
    if (patch.data.status !== undefined) updates.status = patch.data.status;
    if (patch.data.result !== undefined) {
      // The result lives in the payload alongside the hypothesis it
      // answers; merge so the rest of the payload is untouched.
      updates.payload = { ...item.payload, result: patch.data.result };
    }
  } else {
    const patch = GapPatch.safeParse(patchFields);
    if (!patch.success) {
      return Response.json(
        { error: "Please check your update details." },
        { status: 400 }
      );
    }
    if (patch.data.status !== undefined) updates.status = patch.data.status;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json(
      { error: "Please check your update details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("growth_items")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", owner.userId)
    .select(ITEM_COLUMNS)
    .single();

  if (error) {
    console.error("Growth Map update error:", error);
    return Response.json(
      { error: "Your item could not be updated. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({ success: true, item: data as GrowthItemRow });
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = IdSchema.safeParse({ id: searchParams.get("id") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your item details." },
      { status: 400 }
    );
  }

  // Scoped to the caller's own rows in code as well as by RLS: an id
  // belonging to anyone else simply matches nothing.
  const { data, error } = await owner.supabase
    .from("growth_items")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");

  if (error) {
    console.error("Growth Map delete error:", error);
    return Response.json(
      { error: "Your item could not be deleted. Please try again." },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return Response.json({ error: "Item not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
