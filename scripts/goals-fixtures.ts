// ============================================================================
// Creator Goals — acceptance fixtures for the pure progress math
// (lib/goals/progress.ts).
//
// Fixed inputs assert exact progress: records-based goals (videos
// from published-post counts, earnings from RECORDED cents),
// creator-entered goals (followers/views/custom until platform
// sync), milestone boundaries with no rounding up, the 100% cap,
// and the doctrine proof that estimated earnings can never feed
// goal progress — the records handed to computeProgress are built
// from lib/revenue/summary.ts's recorded summary while a large
// estimate sits in scope, and the bar does not move.
//
// Run (from the repo root):
//   npx tsx scripts/goals-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  computeProgress,
  type GoalLike,
  type GoalRecords,
} from "../lib/goals/progress";
import {
  computeSummary,
  computeEstimateSummary,
  type RevenueEntryLike,
  type RevenueEstimateLike,
} from "../lib/revenue/summary";
import { postsInMonth, type PostLike } from "../lib/posts/summary";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`PASS ${label}`);
  } else {
    failures += 1;
    console.log(`FAIL ${label}\n  expected: ${e}\n  actual:   ${a}`);
  }
}

const goal = (over: Partial<GoalLike>): GoalLike => ({
  goal_type: "videos",
  target_value: 30,
  unit: "posts",
  period: "monthly",
  manual_current: null,
  completed_at: null,
  ...over,
});

const NO_RECORDS: GoalRecords = {
  publishedPostsThisMonth: 0,
  recordedEarningsThisMonthCents: 0,
  publishedPostsTotal: 0,
  recordedEarningsTotalCents: 0,
};

// --- Videos goals read published-post records -----------------------------------

const videos = computeProgress(goal({}), {
  ...NO_RECORDS,
  publishedPostsThisMonth: 12,
});
check("(a) videos monthly current", videos.current, 12);
check("(a) videos monthly pct", videos.pct, 40);
check("(a) videos source is records", videos.source, "records");
check("(a) videos milestones at 40%", videos.milestones, [
  { pct: 25, reached: true },
  { pct: 50, reached: false },
  { pct: 75, reached: false },
  { pct: 100, reached: false },
]);
check("(a) videos not complete at 40%", videos.complete, false);

const videosTotal = computeProgress(
  goal({ period: "total", target_value: 200 }),
  { ...NO_RECORDS, publishedPostsTotal: 186, publishedPostsThisMonth: 12 }
);
check("(a) videos total reads the total, not the month", videosTotal.current, 186);
check("(a) videos total pct", videosTotal.pct, 93);

check(
  "(a) a total goal without totals reads 0 — it never borrows the month",
  computeProgress(goal({ period: "total", target_value: 200 }), {
    publishedPostsThisMonth: 12,
    recordedEarningsThisMonthCents: 0,
  }).current,
  0
);

// --- Earnings goals read RECORDED cents ------------------------------------------

const earnings = computeProgress(
  goal({ goal_type: "earnings", target_value: 200, unit: "USD" }),
  { ...NO_RECORDS, recordedEarningsThisMonthCents: 10000 }
);
check("(b) earnings current is recorded cents / 100", earnings.current, 100);
check("(b) earnings pct", earnings.pct, 50);
check("(b) earnings source is records", earnings.source, "records");

check(
  "(b) fractional recorded dollars stay exact",
  computeProgress(goal({ goal_type: "earnings", target_value: 200, unit: "USD" }), {
    ...NO_RECORDS,
    recordedEarningsThisMonthCents: 12345,
  }).current,
  123.45
);

// --- The cap: over-achievement shows in current, never in pct ---------------------

const over = computeProgress(goal({ target_value: 30 }), {
  ...NO_RECORDS,
  publishedPostsThisMonth: 60,
});
check("(c) pct caps at 100", over.pct, 100);
check("(c) current keeps the real figure", over.current, 60);
check("(c) complete at/over target", over.complete, true);
check(
  "(c) complete at exactly the target",
  computeProgress(goal({ target_value: 30 }), {
    ...NO_RECORDS,
    publishedPostsThisMonth: 30,
  }).complete,
  true
);

// --- Milestones: reached means reached ---------------------------------------------

check(
  "(d) exactly 25% reaches only the 25 milestone",
  computeProgress(goal({ target_value: 40 }), {
    ...NO_RECORDS,
    publishedPostsThisMonth: 10,
  }).milestones,
  [
    { pct: 25, reached: true },
    { pct: 50, reached: false },
    { pct: 75, reached: false },
    { pct: 100, reached: false },
  ]
);
const justUnder = computeProgress(
  goal({ goal_type: "views", target_value: 1000, unit: "views", manual_current: 249 }),
  NO_RECORDS
);
check("(d) 24.9% floors to 24, not 25", justUnder.pct, 24);
check(
  "(d) 24.9% does NOT reach the 25 milestone (no rounding up)",
  justUnder.milestones[0],
  { pct: 25, reached: false }
);
check(
  "(d) 99.9% does NOT reach the 100 milestone",
  computeProgress(
    goal({ goal_type: "views", target_value: 1000, unit: "views", manual_current: 999 }),
    NO_RECORDS
  ).milestones[3],
  { pct: 100, reached: false }
);

// --- Creator-entered goals: followers / views / custom ------------------------------

const followers = computeProgress(
  goal({ goal_type: "followers", target_value: 10000, unit: "followers", manual_current: 8500 }),
  NO_RECORDS
);
check("(e) followers current is the creator-entered figure", followers.current, 8500);
check("(e) followers pct", followers.pct, 85);
check("(e) followers source is creator_entered", followers.source, "creator_entered");

check(
  "(e) a null manual_current reads as 0, never a guess",
  computeProgress(goal({ goal_type: "followers", target_value: 10000, unit: "followers" }), NO_RECORDS).current,
  0
);

const custom = computeProgress(
  goal({ goal_type: "custom", target_value: 4, unit: "brand deals", manual_current: 3 }),
  NO_RECORDS
);
check("(e) custom goal pct + source", [custom.pct, custom.source], [75, "creator_entered"]);
check("(e) custom goal 75 milestone reached exactly", custom.milestones[2], {
  pct: 75,
  reached: true,
});

// --- DOCTRINE PROOF: estimates can never feed goal progress -------------------------
//
// The records below are composed exactly the way app/api/goals
// composes them: post counts from lib/posts/summary.ts and
// recorded cents from lib/revenue/summary.ts's computeSummary.
// A $900 estimate exists in the same scope (computeEstimateSummary
// sees it) — and the earnings goal still reads only the $100
// actually recorded. computeProgress has no estimates input; this
// fixture proves the composition keeps it that way.

const NOW = new Date(Date.UTC(2026, 10, 18, 12, 0, 0));
const entries: RevenueEntryLike[] = [
  { brand_name: "Acme", amount_cents: 10000, status: "paid", earned_date: "2026-11-10" },
  { brand_name: "Old Co", amount_cents: 5000, status: "paid", earned_date: "2026-09-01" },
];
const estimates: RevenueEstimateLike[] = [
  { platform: "tiktok", amount_cents: 90000, period_month: "2026-11-01", basis: "creator_entered" },
];
const posts: PostLike[] = [
  { platform: "tiktok", posted_date: "2026-11-03", source: "manual", state: "published" },
  { platform: "tiktok", posted_date: "2026-11-04", source: "manual", state: "planned" },
];

const recorded = computeSummary(entries, NOW);
const estimateSummary = computeEstimateSummary(estimates);
check("(f) the estimate really is in scope", estimateSummary.totalEstimatedCents, 90000);
check("(f) recorded this-month cents exclude other months", recorded.currentMonthCents, 10000);

const records: GoalRecords = {
  publishedPostsThisMonth: postsInMonth(posts, NOW),
  recordedEarningsThisMonthCents: recorded.currentMonthCents,
  publishedPostsTotal: 1,
  recordedEarningsTotalCents: recorded.totalEarnedCents,
};
const earningsGoal = computeProgress(
  goal({ goal_type: "earnings", target_value: 200, unit: "USD" }),
  records
);
check("(f) earnings goal reads ONLY the recorded $100 — the $900 estimate does not move it", earningsGoal.current, 100);
check("(f) earnings goal pct is 50, not 500", earningsGoal.pct, 50);
check(
  "(f) videos goal counts the published post only — the planned one is invisible",
  computeProgress(goal({ target_value: 30 }), records).current,
  1
);

console.log(failures === 0 ? "\nALL ASSERTIONS PASSED" : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
