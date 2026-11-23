import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";

export const runtime = "nodejs";

// Studio (Video Lab) — the creator's saved script checks over
// public.script_analyses (Galaxy redesign, 2026-11-23). Creator
// Lab never persisted its runs, so this table is the lab's
// history: every check the creator runs is stored as their own
// record — the instant in-browser checks plus, when run, the
// Buyer Brain read's score line is the creator's to keep.
//
// Gate pattern identical to the other member API routes: 401 /
// 403 here AND via the middleware (lib/gate-paths.ts). Session
// client (RLS own-row policies apply); every query scoped to the
// caller's user_id in code. No rate limiter: the shared limiter
// in lib/rate-limit.ts is frozen and untouched.

const CheckSchema = z.object({
  id: z.string().max(40),
  name: z.string().max(200),
  pass: z.boolean(),
  skip: z.boolean().optional(),
  note: z.string().max(500),
  fix: z.string().max(500),
});

const BuyerSchema = z.object({
  name: z.string().max(100),
  yes: z.boolean(),
  y: z.string().max(500),
  n: z.string().max(500),
});

const CreateSchema = z.object({
  audience: z.string().max(300).default(""),
  feel: z.string().max(300).default(""),
  product: z.string().max(200).default(""),
  price: z.string().max(50).default(""),
  script: z.string().min(1).max(8000),
  passed: z.number().int().min(0).max(50),
  total: z.number().int().min(0).max(50),
  checks: z.array(CheckSchema).max(20),
  buyers: z.array(BuyerSchema).max(10),
});

const IdSchema = z.object({ id: z.string().uuid() });

const COLUMNS =
  "id, audience, feel, product, price, script, passed, total, checks, buyers, created_at";

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use the Video Lab."
              : "An active subscription is required to use the Video Lab.",
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
        { error: "Please log in to use the Video Lab." },
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
    .from("script_analyses")
    .select(COLUMNS)
    .eq("user_id", owner.userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Studio history load error:", error);
    return Response.json(
      { error: "Your recent checks could not be loaded. Please try again." },
      { status: 500 }
    );
  }
  return Response.json({ success: true, analyses: data ?? [] });
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your script details." },
      { status: 400 }
    );
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your script details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("script_analyses")
    .insert({
      user_id: owner.userId,
      audience: parsed.data.audience,
      feel: parsed.data.feel,
      product: parsed.data.product,
      price: parsed.data.price,
      script: parsed.data.script,
      passed: parsed.data.passed,
      total: parsed.data.total,
      checks: parsed.data.checks,
      buyers: parsed.data.buyers,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    console.error("Studio check save error:", error);
    return Response.json(
      { error: "Your check could not be saved. Please try again." },
      { status: 500 }
    );
  }
  return Response.json({ success: true, analysis: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = IdSchema.safeParse({ id: searchParams.get("id") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your check details." },
      { status: 400 }
    );
  }
  const { data, error } = await owner.supabase
    .from("script_analyses")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");
  if (error) {
    console.error("Studio check delete error:", error);
    return Response.json(
      { error: "That check could not be removed. Please try again." },
      { status: 500 }
    );
  }
  if (!data || data.length === 0) {
    return Response.json({ error: "Check not found." }, { status: 404 });
  }
  return Response.json({ success: true });
}
