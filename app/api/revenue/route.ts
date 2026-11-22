import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { computeSummary, type RevenueStatus } from "@/lib/revenue/summary";

export const runtime = "nodejs";

// Creator Revenue Tracker — owner-only CRUD over
// public.revenue_entries. Same gate pattern as the other member API
// routes (see app/api/growth-map/route.ts and lib/gate.ts): no
// session → 401, no active/trialing subscription → 403, enforced
// here AND by the middleware via lib/gate-paths.ts. All queries run
// through the session client (lib/supabase/server), so RLS applies
// as the signed-in user; every query is additionally scoped to the
// caller's own user_id in code.
//
// WHAT THIS STORES: the creator's own earnings records — brand name,
// amount, paid or still owed, dates — entered by the creator.
//
// HONESTY RULE (binding): every figure the API returns is computed
// deterministically in code from the creator's own rows (see
// lib/revenue/summary.ts). Entries are creator-reported: UltraVestra
// does not receive the creator's affiliate payouts and cannot verify
// them, nothing is estimated or projected, and no figure comes from
// any network. Money is integer cents (amount_cents) end to end, so
// every total is an exact sum that can be re-derived from the rows.
//
// No model/AI calls. No rate limiter: the shared limiter in
// lib/rate-limit.ts is frozen and untouched; authenticated,
// subscription-gated CRUD is the v1 scope (the Growth Map precedent).

const STATUSES = ["pending", "paid"] as const;

const MAX_AMOUNT_CENTS = 100_000_000; // $1,000,000.00 per entry

/** A real calendar date in 'YYYY-MM-DD' form — the regex pins the
 *  shape and the refine rejects impossibilities like 2026-02-30. */
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
  brandName: z.string().min(1).max(200),
  amountCents: z.number().int().min(1).max(MAX_AMOUNT_CENTS),
  status: z.enum(STATUSES).default("pending"),
  earnedDate: DateString,
  // '' (or absent) means "no expected date" and stores NULL; a
  // non-empty value must itself be a real date — checked below,
  // after the main parse, so the error stays the route's own 400.
  dueDate: z.string().max(10).default(""),
  note: z.string().max(500).default(""),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUSES),
});

const IdSchema = z.object({
  id: z.string().uuid(),
});

type RevenueEntryRow = {
  id: string;
  brand_name: string;
  amount_cents: number;
  status: RevenueStatus;
  earned_date: string;
  due_date: string | null;
  note: string;
  created_at: string;
  updated_at: string;
};

const ENTRY_COLUMNS =
  "id, brand_name, amount_cents, status, earned_date, due_date, note, created_at, updated_at";

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
              ? "Please log in to use your Revenue Tracker."
              : "An active subscription is required to use your Revenue Tracker.",
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
        { error: "Please log in to use your Revenue Tracker." },
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
    .from("revenue_entries")
    .select(ENTRY_COLUMNS)
    .eq("user_id", owner.userId)
    .order("earned_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Revenue list error:", error);
    return Response.json(
      { error: "Your revenue entries could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  const entries = (data ?? []) as RevenueEntryRow[];

  return Response.json({
    success: true,
    entries,
    // Computed here, from exactly these rows — the page renders the
    // summary it is given and never re-derives different numbers.
    summary: computeSummary(entries),
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
      { error: "Please check your entry details." },
      { status: 400 }
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your entry details." },
      { status: 400 }
    );
  }

  const dueDate = parsed.data.dueDate.trim();
  if (dueDate !== "" && !DateString.safeParse(dueDate).success) {
    return Response.json(
      { error: "Please check your entry details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("revenue_entries")
    .insert({
      user_id: owner.userId,
      brand_name: parsed.data.brandName,
      amount_cents: parsed.data.amountCents,
      status: parsed.data.status,
      earned_date: parsed.data.earnedDate,
      due_date: dueDate === "" ? null : dueDate,
      note: parsed.data.note,
    })
    .select(ENTRY_COLUMNS)
    .single();

  if (error) {
    console.error("Revenue create error:", error);
    return Response.json(
      { error: "Your entry could not be saved. Please try again." },
      { status: 500 }
    );
  }

  return Response.json(
    { success: true, entry: data as RevenueEntryRow },
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

  // Fetch the caller's own entry first: an id belonging to anyone
  // else matches nothing — the same 404 as a missing entry. In v1
  // the only patch is the pending ↔ paid flip.
  const { data: existing, error: fetchError } = await owner.supabase
    .from("revenue_entries")
    .select(ENTRY_COLUMNS)
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .single();

  if (fetchError || !existing) {
    return Response.json({ error: "Entry not found." }, { status: 404 });
  }

  const { data, error } = await owner.supabase
    .from("revenue_entries")
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select(ENTRY_COLUMNS)
    .single();

  if (error) {
    console.error("Revenue update error:", error);
    return Response.json(
      { error: "Your entry could not be updated. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({ success: true, entry: data as RevenueEntryRow });
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = IdSchema.safeParse({ id: searchParams.get("id") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your entry details." },
      { status: 400 }
    );
  }

  // Scoped to the caller's own rows in code as well as by RLS: an id
  // belonging to anyone else simply matches nothing.
  const { data, error } = await owner.supabase
    .from("revenue_entries")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");

  if (error) {
    console.error("Revenue delete error:", error);
    return Response.json(
      { error: "Your entry could not be deleted. Please try again." },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return Response.json({ error: "Entry not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
