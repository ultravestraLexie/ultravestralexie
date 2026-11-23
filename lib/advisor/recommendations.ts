// AI Creator Advisor (evidence core) — deterministic recommendations
// over the creator's own records, pure and isolated.
//
// HONESTY RULES (binding):
// - There is NO model call in this phase. Every recommendation is
//   produced by a stated rule over the creator's own stored rows,
//   and every recommendation carries its evidence — the exact
//   numbers the rule read — so the creator can check the math.
// - Inputs are composed by the API route from the EXISTING pure
//   libs (posting summary, goal progress, business health, revenue
//   summary). This module re-derives nothing those libs already
//   compute: concentration reads Business Health's output, money
//   totals read the Revenue Tracker's summary.
// - ESTIMATES NEVER APPEAR. There is deliberately no estimates
//   input: estimated earnings (public.revenue_estimates) cannot
//   produce, move, or soften a recommendation. (Proven in
//   scripts/advisor-fixtures.ts by composing inputs exactly as
//   the route composes them with a large estimate in scope.)
// - Rules stay silent on inputs they cannot judge rather than
//   firing vacuously: no monthly earnings goal → no pace verdict;
//   no recorded revenue → no concentration verdict. A creator with
//   no records at all gets exactly one 'start' recommendation.
//
// THRESHOLDS (stated here, asserted at their boundaries in the
// fixtures):
// - PACE_MIN_DAYS_LEFT = 2: the posting-pace 'act' fires only
//   while at least 2 days remain in the week after today — on the
//   last day or two the week is effectively decided.
// - INACTIVITY_DAYS = 7: a full week with no published post.
// - CONCENTRATION_THRESHOLD_PCT = 70: the same threshold Business
//   Health's plain-words callout uses, read from its output.
//
// Dates follow the house convention: 'YYYY-MM-DD' keys from UTC
// fields, weeks run Monday–Sunday (lib/posts/summary.ts).

import type { PostingSummary } from "../posts/summary";
import type { GoalLike, GoalProgress } from "../goals/progress";
import type { BusinessHealth } from "../business/health";
import type { RevenueEntryLike, RevenueSummary } from "../revenue/summary";
import type { DealLike } from "../business/health";

export const PACE_MIN_DAYS_LEFT = 2;
export const INACTIVITY_DAYS = 7;
export const CONCENTRATION_THRESHOLD_PCT = 70;

export type RecommendationSeverity = "act" | "watch" | "good";

export type Recommendation = {
  /** The rule key — stable across runs for the same situation. */
  id: string;
  severity: RecommendationSeverity;
  title: string;
  message: string;
  /** The exact numbers the rule read. The page renders these as
   *  the "Why" line — a recommendation never asks to be trusted
   *  without them. */
  evidence: Record<string, number | string>;
  href: string;
};

export type AdvisorGoalInput = {
  goal: GoalLike;
  progress: GoalProgress;
};

/** A recorded revenue entry with its due date — the one field the
 *  overdue-payments rule needs beyond the summary's shape. */
export type AdvisorEntryLike = RevenueEntryLike & {
  /** 'YYYY-MM-DD' or null when no due date was recorded. */
  due_date: string | null;
};

export type AdvisorInput = {
  /** Creator Business Profile completeness, when the route could
   *  read it. Optional so older callers and fixtures keep working;
   *  null/absent means "not read" and the profile rule stays silent
   *  rather than guessing. */
  profile?: { filled: number; total: number } | null;
  posting: PostingSummary;
  /** 'YYYY-MM-DD' of the most recent PUBLISHED post, or null. */
  lastPostDate: string | null;
  goals: AdvisorGoalInput[];
  health: BusinessHealth;
  revenue: RevenueSummary;
  entries: AdvisorEntryLike[];
  deals: DealLike[];
};

/** 'YYYY-MM-DD' for a Date's UTC fields. */
function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole days from key `a` to key `b` (b − a), UTC arithmetic. */
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000
  );
}

/** Days left in the current week AFTER today (weeks run
 *  Monday–Sunday): Friday → 2 (Sat, Sun), Sunday → 0. */
function daysLeftInWeek(today: Date): number {
  const dow = today.getUTCDay(); // 0 = Sunday
  const sinceMonday = (dow + 6) % 7; // Monday → 0, Sunday → 6
  return 6 - sinceMonday;
}

function money(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

const SEVERITY_ORDER: Record<RecommendationSeverity, number> = {
  act: 0,
  watch: 1,
  good: 2,
};

/**
 * Build the creator's recommendations from their composed records.
 * Deterministic: the same records always yield the same list, in
 * the same order — 'act' first, then 'watch', then 'good'.
 */
export function buildRecommendations(
  input: AdvisorInput,
  today: Date = new Date()
): Recommendation[] {
  const todayKey = dateKey(today);
  const recs: Recommendation[] = [];

  // (g) EMPTY STATE — no posts, no revenue, no deals, no goals:
  // one 'start' recommendation, and nothing else. Every other
  // rule would be firing on a vacuum.
  const isEmpty =
    input.posting.totalPosts === 0 &&
    input.entries.length === 0 &&
    input.deals.length === 0 &&
    input.goals.length === 0;
  if (isEmpty) {
    return [
      {
        id: "start",
        severity: "act",
        title: "Start with your first records",
        message:
          "Your Advisor reads your own records — there is nothing to read yet. Log your first published post in the Posting Tracker, record an earning in the Revenue Tracker, add a deal to your pipeline, or set a Creator Goal. The moment a record exists, recommendations appear here with their numbers attached.",
        evidence: { postsLogged: 0, earningsRecorded: 0, dealsTracked: 0, goalsSet: 0 },
        href: "/growth-center/posting",
      },
    ];
  }

  // (h) BUSINESS PROFILE — the profile Campaign Match and this
  // Advisor read so advice fits the creator's own audience and
  // goals. Fires only when the route actually read the profile
  // (input.profile present) and fields are still empty.
  if (input.profile && input.profile.filled < input.profile.total) {
    recs.push({
      id: "business_profile",
      severity: "watch",
      title: "Complete your Creator Business Profile",
      message: `Your business profile has ${input.profile.filled} of ${input.profile.total} fields filled. Campaign Match prefills from it and this Advisor reads it — the more complete it is, the better your matches and recommendations fit your audience, your categories and your goals.`,
      evidence: {
        fieldsCompleted: input.profile.filled,
        fieldsTotal: input.profile.total,
      },
      href: "/growth-center/profile",
    });
  }

  // (a) POSTING PACE — this week vs the creator's weekly goal.
  const daysLeft = daysLeftInWeek(today);
  if (input.posting.postsThisWeek >= input.posting.weeklyGoal) {
    recs.push({
      id: "posting_pace",
      severity: "good",
      title: "Weekly posting goal met",
      message: `You have published ${input.posting.postsThisWeek} of your ${input.posting.weeklyGoal} weekly posts — this week's goal is met. Your current streak is ${input.posting.currentStreak} day${input.posting.currentStreak === 1 ? "" : "s"}.`,
      evidence: {
        postsThisWeek: input.posting.postsThisWeek,
        weeklyGoal: input.posting.weeklyGoal,
        daysLeftInWeek: daysLeft,
        currentStreak: input.posting.currentStreak,
      },
      href: "/growth-center/posting",
    });
  } else if (daysLeft >= PACE_MIN_DAYS_LEFT) {
    recs.push({
      id: "posting_pace",
      severity: "act",
      title: "Posting pace is behind this week",
      message: `You have published ${input.posting.postsThisWeek} of your ${input.posting.weeklyGoal} weekly posts, with ${daysLeft} days left in the week. ${input.posting.weeklyGoal - input.posting.postsThisWeek} more post${input.posting.weeklyGoal - input.posting.postsThisWeek === 1 ? "" : "s"} reaches the goal you set.`,
      evidence: {
        postsThisWeek: input.posting.postsThisWeek,
        weeklyGoal: input.posting.weeklyGoal,
        daysLeftInWeek: daysLeft,
      },
      href: "/growth-center/posting",
    });
  }

  // (b) INACTIVITY — a full week since the last published post.
  if (input.lastPostDate !== null) {
    const daysSince = daysBetween(input.lastPostDate, todayKey);
    if (daysSince >= INACTIVITY_DAYS) {
      recs.push({
        id: "inactivity",
        severity: "act",
        title: "A quiet week",
        message: `Your last published post was ${daysSince} days ago (${input.lastPostDate}). A full quiet week breaks the rhythm your streak is built on — one post today restarts it.`,
        evidence: { daysSinceLastPost: daysSince, lastPostDate: input.lastPostDate },
        href: "/growth-center/posting",
      });
    }
  }

  // (c) EARNINGS GOAL PACE — the first monthly earnings goal, if
  // one exists. Simple pace math, labeled as such: what you have
  // recorded this month, spread evenly across the month's days.
  const earningsGoal = input.goals.find(
    (g) => g.goal.goal_type === "earnings" && g.goal.period === "monthly"
  );
  if (earningsGoal) {
    const daysElapsed = today.getUTCDate();
    const daysInMonth = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)
    ).getUTCDate();
    const monthToDateCents = input.revenue.currentMonthCents;
    const projectedCents = Math.round(
      (monthToDateCents / daysElapsed) * daysInMonth
    );
    const targetCents = Math.round(earningsGoal.goal.target_value * 100);
    const onPace = projectedCents >= targetCents;
    recs.push({
      id: "earnings_goal_pace",
      severity: onPace ? "good" : "watch",
      title: onPace
        ? "Earnings goal is on pace"
        : "Earnings goal is behind pace",
      message: onPace
        ? `You have recorded ${money(monthToDateCents)} this month. At this pace — simple pace math: month-to-date spread evenly over the month — you project to ${money(projectedCents)}, at or above your ${money(targetCents)} goal.`
        : `You have recorded ${money(monthToDateCents)} this month. At this pace — simple pace math: month-to-date spread evenly over the month — you project to ${money(projectedCents)}, below your ${money(targetCents)} goal. Recorded earnings only; estimates never count here.`,
      evidence: {
        recordedThisMonth: money(monthToDateCents),
        projectedThisMonth: money(projectedCents),
        goalTarget: money(targetCents),
        daysElapsed,
        daysInMonth,
      },
      href: "/growth-center/goals",
    });
  }

  // (d) CONCENTRATION — read from Business Health's output, never
  // re-derived. Silent when there is no recorded revenue.
  if (
    input.health.totalRecordedCents > 0 &&
    input.health.topBrandSharePct >= CONCENTRATION_THRESHOLD_PCT &&
    input.health.byBrand.length > 0
  ) {
    const top = input.health.byBrand[0];
    recs.push({
      id: "concentration",
      severity: "watch",
      title: "Income depends on one brand",
      message: `${top.name} is ${top.sharePct}% of your recorded revenue (${money(top.cents)} of ${money(input.health.totalRecordedCents)}). One brand pausing would move most of your income — a second active partnership spreads that risk.`,
      evidence: {
        topBrand: top.name,
        topBrandSharePct: top.sharePct,
        topBrandRecorded: money(top.cents),
        totalRecorded: money(input.health.totalRecordedCents),
      },
      href: "/growth-center/business",
    });
  }

  // (e) OVERDUE DEALS — deadline passed, stage not finished. The
  // same overdue definition as the deals API (Phase 4).
  const overdueDeals = input.deals.filter(
    (d) =>
      d.deadline !== null &&
      d.deadline < todayKey &&
      d.stage !== "paid" &&
      d.stage !== "closed"
  );
  if (overdueDeals.length > 0) {
    const oldestDays = Math.max(
      ...overdueDeals.map((d) => daysBetween(d.deadline as string, todayKey))
    );
    recs.push({
      id: "overdue_deals",
      severity: "act",
      title: "Deals past their deadline",
      message: `${overdueDeals.length} deal${overdueDeals.length === 1 ? " is" : "s are"} past the deadline you set — the oldest by ${oldestDays} day${oldestDays === 1 ? "" : "s"}. Move the stage, set a new deadline, or close the deal so your pipeline stays true.`,
      evidence: { overdueDeals: overdueDeals.length, oldestDaysOverdue: oldestDays },
      href: "/growth-center/deals",
    });
  }

  // (f) OVERDUE PAYMENTS — recorded earnings still pending past
  // the due date the creator recorded.
  const overduePayments = input.entries.filter(
    (e) => e.status === "pending" && e.due_date !== null && e.due_date < todayKey
  );
  if (overduePayments.length > 0) {
    const totalCents = overduePayments.reduce((s, e) => s + e.amount_cents, 0);
    recs.push({
      id: "overdue_payments",
      severity: "act",
      title: "Payments past their due date",
      message: `${overduePayments.length} recorded earning${overduePayments.length === 1 ? " is" : "s are"} still marked pending past the due date you recorded — ${money(totalCents)} outstanding. A follow-up to the brand, or marking it received if it landed, keeps the ledger honest.`,
      evidence: {
        overduePayments: overduePayments.length,
        overdueTotal: money(totalCents),
      },
      href: "/revenue",
    });
  }

  return recs.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
}
