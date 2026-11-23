import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";

export const runtime = "nodejs";

// Build 15 — creator expense tracking: the cost side of "how
// much you actually kept." Owner-only CRUD over
// public.creator_expenses, the same gate + RLS + user-scoping
// pattern as /api/revenue.
//
// HONESTY RULES (binding):
// - Expenses are the creator's own recorded costs. They live in
//   their own table and are never stored as negative revenue.
// - A deal link is stored only when the deal is the caller's
//   own (validated below, the revenue route's pattern). The
//   link is how deal-level profitability is computed; an
//   unlinked expense is reported as untied, never allocated.
// - Money is integer cents end to end; totals are exact sums.

const CATEGORIES = [
  "equipment",
  "software",
  "props_products",
  "travel",
  "education",
  "advertising",
  "team_help",
  "other",
] as const;

const PLATFORMS = ["tiktok", "instagram", "youtube", "amazon", "other"] as const;

const MAX_AMOUNT_CENTS = 100_000_000; // $1,000,000.00 per expense

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
  description: z.string().trim().min(1).max(300),
  amountCents: z.number().int().min(1).max(MAX_AMOUNT_CENTS),
  category: z.enum(CATEGORIES).default("other"),
  spentDate: DateString,
  platform: z.enum(PLATFORMS).nullable().default(null),
  dealId: z.string().uuid().nullable().default(null),
  note: z.string().max(500).default(""),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  description: z.string().trim().min(1).max(300).optional(),
  amountCents: z.number().int().min(1).max(MAX_AMOUNT_CENTS).optional(),
  category: z.enum(CATEGORIES).optional(),
  spentDate: DateString.optional(),
  platform: z.enum(PLATFORMS).nullable().optional(),
  dealId: z.string().uuid().nullable().optional(),
  note: z.string().max(500).optional(),
});

const IdSchema = z.object({
  id: z.string().uuid(),
});

const EXPENSE_COLUMNS =
  "id, description, amount_cents, category, spent_date, platform, deal_id, note, created_at, updated_at";

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use your expense tracking."
              : "An active subscription is required to use your expense tracking.",
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
        { error: "Please log in to use your expense tracking." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** A deal link is accepted only when the deal is the caller's
 *  own — same pattern as the revenue route's deal validation. */
async function validateDealLink(
  supabase: Supabase,
  userId: string,
  dealId: string | null
): Promise<Response | null> {
  if (dealId === null) return null;
  const { data, error } = await supabase
    .from("creator_deals")
    .select("id")
    .eq("id", dealId)
    .eq("user_id", userId);
  if (error) throw error;
  if (!data || data.length === 0) {
    return Response.json(
      { error: "That deal could not be found among your deals." },
      { status: 400 }
    );
  }
  return null;
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { data, error } = await owner.supabase
    .from("creator_expenses")
    .select(EXPENSE_COLUMNS)
    .eq("user_id", owner.userId)
    .order("spent_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Expenses list error:", error);
    return Response.json(
      { error: "Your expenses could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  const expenses = data ?? [];
  const totalSpentCents = expenses.reduce(
    (sum: number, e: { amount_cents: number }) => sum + e.amount_cents,
    0
  );
  return Response.json({ success: true, expenses, totalSpentCents });
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your expense details." },
      { status: 400 }
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your expense details." },
      { status: 400 }
    );
  }

  try {
    const linkError = await validateDealLink(
      owner.supabase,
      owner.userId,
      parsed.data.dealId
    );
    if (linkError) return linkError;

    const { data, error } = await owner.supabase
      .from("creator_expenses")
      .insert({
        user_id: owner.userId,
        description: parsed.data.description,
        amount_cents: parsed.data.amountCents,
        category: parsed.data.category,
        spent_date: parsed.data.spentDate,
        platform: parsed.data.platform,
        deal_id: parsed.data.dealId,
        note: parsed.data.note,
      })
      .select(EXPENSE_COLUMNS)
      .single();
    if (error) throw error;

    return Response.json({ success: true, expense: data }, { status: 201 });
  } catch (e) {
    console.error("Expense create error:", e);
    return Response.json(
      { error: "Your expense could not be saved. Please try again." },
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
      { error: "Please check your expense details." },
      { status: 400 }
    );
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your expense details." },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.description !== undefined)
    update.description = parsed.data.description;
  if (parsed.data.amountCents !== undefined)
    update.amount_cents = parsed.data.amountCents;
  if (parsed.data.category !== undefined) update.category = parsed.data.category;
  if (parsed.data.spentDate !== undefined)
    update.spent_date = parsed.data.spentDate;
  if (parsed.data.platform !== undefined) update.platform = parsed.data.platform;
  if (parsed.data.dealId !== undefined) update.deal_id = parsed.data.dealId;
  if (parsed.data.note !== undefined) update.note = parsed.data.note;

  try {
    if (parsed.data.dealId !== undefined) {
      const linkError = await validateDealLink(
        owner.supabase,
        owner.userId,
        parsed.data.dealId
      );
      if (linkError) return linkError;
    }

    const { data, error } = await owner.supabase
      .from("creator_expenses")
      .update(update)
      .eq("id", parsed.data.id)
      .eq("user_id", owner.userId)
      .select(EXPENSE_COLUMNS);
    if (error) throw error;
    if (!data || data.length === 0) {
      return Response.json({ error: "Expense not found." }, { status: 404 });
    }
    return Response.json({ success: true, expense: data[0] });
  } catch (e) {
    console.error("Expense update error:", e);
    return Response.json(
      { error: "Your expense could not be updated. Please try again." },
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
      { error: "Please check your expense details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("creator_expenses")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");

  if (error) {
    console.error("Expense delete error:", error);
    return Response.json(
      { error: "Your expense could not be deleted. Please try again." },
      { status: 500 }
    );
  }
  if (!data || data.length === 0) {
    return Response.json({ error: "Expense not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
