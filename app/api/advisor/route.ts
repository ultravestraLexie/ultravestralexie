import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  computePostingSummary,
  publishedOnly,
  type PostLike,
} from "@/lib/posts/summary";
import {
  computeProgress,
  type GoalLike,
  type GoalRecords,
} from "@/lib/goals/progress";
import { postsInMonth } from "@/lib/posts/summary";
import { computeSummary, type RevenueEntryLike } from "@/lib/revenue/summary";
import { computeHealth, type DealLike } from "@/lib/business/health";
import {
  buildRecommendations,
  type AdvisorEntryLike,
  type AdvisorGoalInput,
} from "@/lib/advisor/recommendations";

export const runtime = "nodejs";

// AI Creator Advisor (evidence core) — read-only composition over
// the caller's own records. There is NO model call in this phase:
// every recommendation is a stated rule in
// lib/advisor/recommendations.ts running over figures the existing
// pure libs compute from the caller's own rows, and each one
// carries the numbers it read.
//
// ISOLATION (binding): session client (RLS own-row policies
// apply) and every query scoped to the caller's user_id in code.
// The caller's id comes from the session — never from the request.
//
// HONESTY RULES (binding):
// - public.revenue_estimates is NEVER queried by this route:
//   estimated earnings cannot produce, move, or soften a
//   recommendation.
// - Goal progress is computed by lib/goals/progress.ts from the
//   same records /api/goals uses, so the Advisor can never
//   disagree with the Goals page. Completion is NOT stamped here
//   — this route is read-only; /api/goals owns that write.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts).

const DEFAULT_WEEKLY_GOAL = 5;

type GoalRow = GoalLike & { id: string };

const GOAL_COLUMNS =
  "goal_type, target_value, unit, period, manual_current, completed_at";

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to see your Advisor."
              : "An active subscription is required to see your Advisor.",
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
        { error: "Please log in to see your Advisor." },
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
    const [postsRes, prefsRes, goalsRes, entriesRes, dealsRes] =
      await Promise.all([
        owner.supabase
          .from("creator_posts")
          .select("platform, posted_date, source, state")
          .eq("user_id", owner.userId),
        owner.supabase
          .from("growth_prefs")
          .select("weekly_post_goal")
          .eq("user_id", owner.userId)
          .maybeSingle(),
        owner.supabase
          .from("creator_goals")
          .select(GOAL_COLUMNS)
          .eq("user_id", owner.userId)
          .order("created_at", { ascending: true }),
        owner.supabase
          .from("revenue_entries")
          .select("brand_name, amount_cents, status, earned_date, due_date, kind")
          .eq("user_id", owner.userId),
        owner.supabase
          .from("creator_deals")
          .select("brand_name, platform, stage, compensation_cents, deadline")
          .eq("user_id", owner.userId),
      ]);

    const failed = [postsRes, goalsRes, entriesRes, dealsRes].find(
      (r) => r.error
    );
    if (failed?.error) throw failed.error;
    if (prefsRes.error) throw prefsRes.error;

    const now = new Date();
    const posts = (postsRes.data ?? []) as PostLike[];
    const weeklyGoal =
      (prefsRes.data as { weekly_post_goal: number } | null)
        ?.weekly_post_goal ?? DEFAULT_WEEKLY_GOAL;
    const entries = (entriesRes.data ?? []) as AdvisorEntryLike[];
    const deals = (dealsRes.data ?? []) as DealLike[];
    const goalRows = (goalsRes.data ?? []) as GoalRow[];

    // The same compositions the owning pages use — one set of
    // numbers, everywhere.
    const posting = computePostingSummary(posts, weeklyGoal, now);
    const revenue = computeSummary(entries as RevenueEntryLike[], now);
    const health = computeHealth(entries, deals, now);

    const records: GoalRecords = {
      publishedPostsThisMonth: postsInMonth(posts, now),
      recordedEarningsThisMonthCents: revenue.currentMonthCents,
      publishedPostsTotal: publishedOnly(posts).length,
      recordedEarningsTotalCents: revenue.totalEarnedCents,
    };
    const goals: AdvisorGoalInput[] = goalRows.map((goal) => ({
      goal,
      progress: computeProgress(goal, records),
    }));

    const published = publishedOnly(posts);
    const lastPostDate =
      published.length > 0
        ? published.map((p) => p.posted_date).sort().at(-1) ?? null
        : null;

    const recommendations = buildRecommendations(
      { posting, lastPostDate, goals, health, revenue, entries, deals },
      now
    );

    return Response.json({ success: true, recommendations });
  } catch (e) {
    console.error("Advisor load error:", e);
    return Response.json(
      { error: "Your recommendations could not be loaded. Please try again." },
      { status: 500 }
    );
  }
}
