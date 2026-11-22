import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  computeHealth,
  type DealLike,
  type HealthEntryLike,
} from "@/lib/business/health";

export const runtime = "nodejs";

// Creator Business Health — read-only composition over the
// caller's own recorded revenue and deal pipeline.
//
// ISOLATION (binding): session client (RLS own-row policies
// apply) and every query scoped to the caller's user_id in code.
//
// HONESTY RULES (binding):
// - Money figures come from public.revenue_entries (RECORDED
//   earnings) via lib/revenue/summary.ts, reused inside
//   lib/business/health.ts — the same math as the Revenue
//   Tracker, so this page can never disagree with the ledger.
// - public.revenue_estimates is NEVER queried by this route:
//   estimated earnings are not business health.
// - Deal figures are the creator's own pipeline tracking; a deal
//   in stage 'paid' is not a verified payment, and the response
//   keeps pipeline money separate from recorded money.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts).

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to see your Business Health."
              : "An active subscription is required to see your Business Health.",
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
        { error: "Please log in to see your Business Health." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  try {
    const [entriesRes, dealsRes] = await Promise.all([
      owner.supabase
        .from("revenue_entries")
        .select("brand_name, amount_cents, status, earned_date, kind")
        .eq("user_id", owner.userId),
      owner.supabase
        .from("creator_deals")
        .select("brand_name, platform, stage, compensation_cents, deadline")
        .eq("user_id", owner.userId),
    ]);
    if (entriesRes.error) throw entriesRes.error;
    if (dealsRes.error) throw dealsRes.error;

    const entries = (entriesRes.data ?? []) as HealthEntryLike[];
    const deals = (dealsRes.data ?? []) as DealLike[];
    const health = computeHealth(entries, deals, new Date());
    return Response.json({ success: true, health });
  } catch (e) {
    console.error("Business health load error:", e);
    return Response.json(
      { error: "Your business health could not be loaded. Please try again." },
      { status: 500 }
    );
  }
}
