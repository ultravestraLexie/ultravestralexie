// Creator Goals — the progress math, pure and isolated.
//
// HONESTY RULES (binding):
// - A goal's progress traces to exactly one source, and the result
//   NAMES it: 'records' (the creator's own stored rows — published
//   posts counted by lib/posts/summary.ts, recorded earnings summed
//   by lib/revenue/summary.ts) or 'creator_entered' (a number the
//   creator typed into manual_current for things the platform
//   cannot measure yet — followers and views until a real platform
//   sync arrives, and custom goals).
// - ESTIMATES NEVER FEED GOAL PROGRESS. There is deliberately no
//   estimates input anywhere in this module: an earnings goal reads
//   recorded cents only, so money that is merely estimated can
//   never move a goal bar. (Proven in scripts/goals-fixtures.ts.)
// - Milestones are the fixed quarters [25, 50, 75, 100]; a
//   milestone is "reached" only when the real ratio reaches it.
//   Nothing here rounds a creator up to a milestone they have not
//   hit, and pct is capped at 100 — over-achievement shows in the
//   current figure, not in a 140% bar.
//
// This module has no imports and no I/O on purpose: the API route
// feeds it the goal row plus record counts it computed from the
// caller's own rows, and the math is exercised in isolation by
// scripts/goals-fixtures.ts.

export type GoalType = "videos" | "earnings" | "followers" | "views" | "custom";

export type GoalPeriod = "monthly" | "total";

export type GoalLike = {
  goal_type: GoalType;
  /** The target, in the goal's own unit (posts, USD, followers…). */
  target_value: number;
  unit: string;
  period: GoalPeriod;
  /** Creator-entered progress for types records cannot measure.
   *  Null reads as 0 — never as a guess. */
  manual_current: number | null;
  completed_at: string | null;
};

/** Record figures the caller computed from the creator's OWN rows.
 *  Earnings are integer cents (recorded entries only — estimates
 *  live in a different table and are never passed here). The total
 *  fields serve period='total' goals; when a total field is absent
 *  a total-period goal reads 0 rather than borrowing the monthly
 *  figure — understating is the only honest failure direction. */
export type GoalRecords = {
  publishedPostsThisMonth: number;
  recordedEarningsThisMonthCents: number;
  publishedPostsTotal?: number;
  recordedEarningsTotalCents?: number;
};

export type GoalProgressSource = "records" | "creator_entered";

export type GoalMilestone = {
  pct: 25 | 50 | 75 | 100;
  reached: boolean;
};

export type GoalProgress = {
  /** Current progress in the goal's unit (posts; USD for earnings
   *  goals — recorded cents / 100). */
  current: number;
  target: number;
  /** floor(current / target * 100), capped at 100. */
  pct: number;
  milestones: GoalMilestone[];
  source: GoalProgressSource;
  /** True when the real ratio reaches the target. */
  complete: boolean;
};

const MILESTONE_PCTS = [25, 50, 75, 100] as const;

/** Types whose progress the platform can measure from records. */
function isRecordsType(goalType: GoalType): boolean {
  return goalType === "videos" || goalType === "earnings";
}

export function computeProgress(
  goal: GoalLike,
  records: GoalRecords
): GoalProgress {
  const source: GoalProgressSource = isRecordsType(goal.goal_type)
    ? "records"
    : "creator_entered";

  let current = 0;
  if (goal.goal_type === "videos") {
    current =
      goal.period === "total"
        ? records.publishedPostsTotal ?? 0
        : records.publishedPostsThisMonth;
  } else if (goal.goal_type === "earnings") {
    const cents =
      goal.period === "total"
        ? records.recordedEarningsTotalCents ?? 0
        : records.recordedEarningsThisMonthCents;
    current = cents / 100;
  } else {
    current = goal.manual_current ?? 0;
  }

  const target = goal.target_value;
  const ratio = target > 0 ? current / target : 0;
  const pct = Math.min(100, Math.floor(ratio * 100));

  return {
    current,
    target,
    pct,
    milestones: MILESTONE_PCTS.map((m) => ({
      pct: m,
      reached: ratio * 100 >= m,
    })),
    source,
    complete: target > 0 && current >= target,
  };
}
