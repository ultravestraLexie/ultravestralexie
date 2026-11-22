import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { computeEstimateSummary } from "@/lib/revenue/summary";

export const runtime = "nodejs";

// Estimated platform earnings — owner-only CRUD over
// public.revenue_estimates.
//
// DOCTRINE (binding): estimates are NOT recorded earnings. They
// live in their own table, are summed only by
// computeEstimateSummary, and are returned by this route only —
// the recorded-earnings route (/api/revenue) never sees them, so
// no total anywhere can mix the two. The page renders them in a
// separate block under a heading that says what they are.
//
// BASIS RULE: every estimate records where it came from. In
// Phase 1 the only honest basis is 'creator_entered' (the creator
// typed the figure), and this route FORCES it server-side — the
// create schema has no basis field. 'platform_reported' becomes
// writable only by a future platform integration, never by a
// client claiming a platform said so.
//
// ISOLATION (binding): session client (RLS own-row policies apply)
// and every query scoped to the caller's user_id in code.
//
// period_month is stored as the first of the month the estimate
// is about; the API accepts any date in that month and normalizes
// it to the first, so one month can never split into two buckets
// by an off-by-days typo.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts — the
// '/api/revenue' prefix covers this subroute).

const MAX_AMOUNT_CENTS = 100_000_000; // $1,000,000.00 per estimate

const DateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  });

const CreateSchema = z.object({
  platform: z.string().min(1).max(100),
  amountCents: z.number().int().min(1).max(MAX_AMOUNT_CENTS),
  periodMonth: DateString,
  note: z.string().max(500).default(""),
});

const IdSchema = z.object({
  id: z.string().uuid(),
});

type EstimateRow = {
  id: string;
  platform: string;
  amount_cents: number;
  period_month: string;
  note: string;
  basis: "creator_entered" | "platform_reported";
  created_at: string;
  updated_at: string;
};

const ESTIMATE_COLUMNS =
  "id, platform, amount_cents, period_month, note, basis, created_at, updated_at";

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use your estimated earnings."
              : "An active subscription is required to use your estimated earnings.",
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
        { error: "Please log in to use your estimated earnings." },
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
    .from("revenue_estimates")
    .select(ESTIMATE_COLUMNS)
    .eq("user_id", owner.userId)
    .order("period_month", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Estimates list error:", error);
    return Response.json(
      { error: "Your estimates could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  const estimates = (data ?? []) as EstimateRow[];

  return Response.json({
    success: true,
    estimates,
    // Estimates ONLY — computed from exactly these rows by the
    // estimates-only summary function.
    summary: computeEstimateSummary(estimates),
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
      { error: "Please check your estimate details." },
      { status: 400 }
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your estimate details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("revenue_estimates")
    .insert({
      user_id: owner.userId,
      platform: parsed.data.platform.trim(),
      amount_cents: parsed.data.amountCents,
      // Normalize to the first of the month.
      period_month: `${parsed.data.periodMonth.slice(0, 7)}-01`,
      note: parsed.data.note,
      // Phase 1: a client can only ever create a creator-entered
      // estimate. There is deliberately no way to send a basis.
      basis: "creator_entered",
    })
    .select(ESTIMATE_COLUMNS)
    .single();

  if (error) {
    console.error("Estimates create error:", error);
    return Response.json(
      { error: "Your estimate could not be saved. Please try again." },
      { status: 500 }
    );
  }

  return Response.json(
    { success: true, estimate: data as EstimateRow },
    { status: 201 }
  );
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = IdSchema.safeParse({ id: searchParams.get("id") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your estimate details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("revenue_estimates")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");

  if (error) {
    console.error("Estimates delete error:", error);
    return Response.json(
      { error: "Your estimate could not be deleted. Please try again." },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return Response.json({ error: "Estimate not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
