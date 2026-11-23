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
    const [entriesRes, dealsRes, postsRes, expensesRes] = await Promise.all([
      owner.supabase
        .from("revenue_entries")
        .select("brand_name, amount_cents, status, earned_date, kind, platform, post_id, deal_id")
        .eq("user_id", owner.userId),
      owner.supabase
        .from("creator_deals")
        .select(
          "id, brand_name, platform, stage, compensation_cents, deadline, invoice_sent_date, payment_terms, payment_due_date, payment_received_date, amount_received_cents"
        )
        .eq("user_id", owner.userId),
      owner.supabase
        .from("creator_posts")
        .select("id, title, platform, posted_date")
        .eq("user_id", owner.userId),
      // Build 15: recorded expenses for the Kept computation. A
      // failure here (e.g. before the migration runs) degrades
      // expenses to none — never the money figures above.
      owner.supabase
        .from("creator_expenses")
        .select("amount_cents, category, platform, deal_id, spent_date")
        .eq("user_id", owner.userId),
    ]);
    if (entriesRes.error) throw entriesRes.error;
    if (dealsRes.error) throw dealsRes.error;

    const entries = (entriesRes.data ?? []) as HealthEntryLike[];
    const deals = (dealsRes.data ?? []) as DealLike[];
    // Build 13: post identities for attribution display. A posts
    // read failure degrades titles, never the money figures.
    const postsById: Record<
      string,
      { title: string | null; platform: string; postedDate: string }
    > = {};
    for (const p of (postsRes.data ?? []) as {
      id: string;
      title: string | null;
      platform: string;
      posted_date: string;
    }[]) {
      postsById[p.id] = {
        title: p.title,
        platform: p.platform,
        postedDate: p.posted_date,
      };
    }
    const expenses = expensesRes.error
      ? []
      : ((expensesRes.data ?? []) as {
          amount_cents: number;
          category: string;
          platform: string | null;
          deal_id: string | null;
          spent_date: string;
        }[]);
    const health = computeHealth(entries, deals, new Date(), postsById, expenses);
    return Response.json({ success: true, health });
  } catch (e) {
    console.error("Business health load error:", e);
    return Response.json(
      { error: "Your business health could not be loaded. Please try again." },
      { status: 500 }
    );
  }
}
