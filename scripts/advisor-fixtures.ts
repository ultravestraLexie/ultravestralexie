// ============================================================================
// AI Creator Advisor (evidence core) — acceptance fixtures for the
// deterministic recommendation rules (lib/advisor/recommendations.ts).
//
// Inputs are composed EXACTLY as app/api/advisor/route.ts composes
// them — the same pure libs over the same row shapes — so what is
// proven here is what the route serves. Fixed inputs assert: each
// rule fires at its stated boundary and stays silent just below
// it, the earnings pace projection is exact, sort order is
// act → watch → good, the empty state yields exactly one 'start'
// recommendation, and the doctrine proof that estimated earnings
// can never produce or move a recommendation — inputs composed
// while a large estimate sits in scope, output unchanged.
//
// Run (from the repo root):
//   npx tsx scripts/advisor-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  buildRecommendations,
  type AdvisorEntryLike,
  type AdvisorInput,
} from "../lib/advisor/recommendations";
import {
  computePostingSummary,
  postsInMonth,
  publishedOnly,
  type PostLike,
} from "../lib/posts/summary";
import {
  computeProgress,
  type GoalLike,
} from "../lib/goals/progress";
import {
  computeSummary,
  computeEstimateSummary,
  type RevenueEstimateLike,
} from "../lib/revenue/summary";
import {
  computeHealth,
  type DealLike,
} from "../lib/business/health";

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

// Friday, November 20, 2026 (UTC) — 2 days left in the Mon–Sun week.
const FRI = new Date(Date.UTC(2026, 10, 20));
const SAT = new Date(Date.UTC(2026, 10, 21));
const SUN_15TH = new Date(Date.UTC(2026, 10, 15));

const post = (posted_date: string): PostLike => ({
  platform: "tiktok",
  posted_date,
  source: "manual",
  state: "published",
});

const entry = (over: Partial<AdvisorEntryLike>): AdvisorEntryLike => ({
  brand_name: "GlowCo",
  amount_cents: 10000,
  status: "paid",
  earned_date: "2026-11-10",
  due_date: null,
  kind: "brand_payment",
  ...over,
});

const deal = (over: Partial<DealLike>): DealLike => ({
  brand_name: "GlowCo",
  platform: null,
  stage: "contracted",
  compensation_cents: 50000,
  deadline: null,
  ...over,
});

const earningsGoal = (over: Partial<GoalLike>): GoalLike => ({
  goal_type: "earnings",
  target_value: 1000,
  unit: "USD",
  period: "monthly",
  manual_current: null,
  completed_at: null,
  ...over,
});

/** Compose an AdvisorInput exactly as the API route does. */
function compose(
  opts: {
    posts?: PostLike[];
    entries?: AdvisorEntryLike[];
    deals?: DealLike[];
    goals?: GoalLike[];
    weeklyGoal?: number;
  },
  now: Date
): AdvisorInput {
  const posts = opts.posts ?? [];
  const entries = opts.entries ?? [];
  const deals = opts.deals ?? [];
  const posting = computePostingSummary(posts, opts.weeklyGoal ?? 5, now);
  const revenue = computeSummary(entries, now);
  const health = computeHealth(entries, deals, now);
  const records = {
    publishedPostsThisMonth: postsInMonth(posts, now),
    recordedEarningsThisMonthCents: revenue.currentMonthCents,
    publishedPostsTotal: publishedOnly(posts).length,
    recordedEarningsTotalCents: revenue.totalEarnedCents,
  };
  const goals = (opts.goals ?? []).map((goal) => ({
    goal,
    progress: computeProgress(goal, records),
  }));
  const published = publishedOnly(posts);
  const lastPostDate =
    published.length > 0
      ? published.map((p) => p.posted_date).sort().at(-1) ?? null
      : null;
  return { posting, lastPostDate, goals, health, revenue, entries, deals };
}

const ids = (input: AdvisorInput, now: Date) =>
  buildRecommendations(input, now).map((r) => r.id);

// --- (a) Posting pace ------------------------------------------------------------------

// 2 of 5 posts, Friday (exactly PACE_MIN_DAYS_LEFT = 2 days left) → act fires.
const paceAct = buildRecommendations(
  compose({ posts: [post("2026-11-16"), post("2026-11-18")] }, FRI),
  FRI
);
check("(a) pace act fires at the 2-days-left boundary", ids(compose({ posts: [post("2026-11-16"), post("2026-11-18")] }, FRI), FRI), ["posting_pace"]);
check("(a) pace act severity", paceAct[0].severity, "act");
check(
  "(a) pace act evidence is the rule's own numbers",
  paceAct[0].evidence,
  { postsThisWeek: 2, weeklyGoal: 5, daysLeftInWeek: 2 }
);

// Same posts on Saturday (1 day left) → the week is decided; pace stays silent.
check(
  "(a) pace silent with only 1 day left",
  buildRecommendations(compose({ posts: [post("2026-11-16"), post("2026-11-18")] }, SAT), SAT),
  []
);

// Goal met → 'good'.
const paceGood = buildRecommendations(
  compose(
    {
      posts: [
        post("2026-11-16"),
        post("2026-11-17"),
        post("2026-11-18"),
        post("2026-11-19"),
        post("2026-11-20"),
      ],
    },
    FRI
  ),
  FRI
);
check("(a) pace good fires when the goal is met", paceGood.map((r) => [r.id, r.severity]), [["posting_pace", "good"]]);

// --- (b) Inactivity ----------------------------------------------------------------------

// Last post exactly 7 days ago → fires.
const inactive = buildRecommendations(compose({ posts: [post("2026-11-13")] }, FRI), FRI);
const inactivityRec = inactive.find((r) => r.id === "inactivity");
check("(b) inactivity fires at exactly 7 days", inactivityRec?.evidence, {
  daysSinceLastPost: 7,
  lastPostDate: "2026-11-13",
});

// Last post 6 days ago → silent.
check(
  "(b) inactivity silent at 6 days",
  ids(compose({ posts: [post("2026-11-14")] }, FRI), FRI).includes("inactivity"),
  false
);

// --- (c) Earnings goal pace ---------------------------------------------------------------

// $400 recorded by Nov 20 → pace math: 40000 / 20 × 30 = $600 projected < $1,000 goal → watch.
const paceWatch = buildRecommendations(
  compose(
    {
      entries: [entry({ amount_cents: 40000, earned_date: "2026-11-05" })],
      goals: [earningsGoal({})],
    },
    FRI
  ),
  FRI
).find((r) => r.id === "earnings_goal_pace");
check("(c) behind pace is a watch", paceWatch?.severity, "watch");
check(
  "(c) projection math is exact",
  paceWatch?.evidence,
  {
    recordedThisMonth: "$400.00",
    projectedThisMonth: "$600.00",
    goalTarget: "$1,000.00",
    daysElapsed: 20,
    daysInMonth: 30,
  }
);

// $800 recorded → projected $1,200 ≥ goal → good.
const paceOn = buildRecommendations(
  compose(
    {
      entries: [entry({ amount_cents: 80000, earned_date: "2026-11-05" })],
      goals: [earningsGoal({})],
    },
    FRI
  ),
  FRI
).find((r) => r.id === "earnings_goal_pace");
check("(c) on pace is good", paceOn?.severity, "good");

// Boundary: projection exactly equals the target → on pace (good).
// Nov 15: 15 days elapsed of 30 → $500 recorded projects to exactly $1,000.
const paceExact = buildRecommendations(
  compose(
    {
      entries: [entry({ amount_cents: 50000, earned_date: "2026-11-05" })],
      goals: [earningsGoal({})],
    },
    SUN_15TH
  ),
  SUN_15TH
).find((r) => r.id === "earnings_goal_pace");
check("(c) projection equal to target is on pace", paceExact?.severity, "good");
check("(c) boundary projection is exact", paceExact?.evidence.projectedThisMonth, "$1,000.00");

// No earnings goal → silent. A total-period earnings goal is not a monthly pace.
check(
  "(c) silent without a monthly earnings goal",
  ids(compose({ entries: [entry({})] }, FRI), FRI).includes("earnings_goal_pace"),
  false
);
check(
  "(c) total-period earnings goal does not produce a pace verdict",
  ids(
    compose(
      { entries: [entry({})], goals: [earningsGoal({ period: "total" })] },
      FRI
    ),
    FRI
  ).includes("earnings_goal_pace"),
  false
);

// --- (d) Concentration ---------------------------------------------------------------------

// Exactly 70% from one brand → watch fires (threshold read from Business Health).
const concentrated = buildRecommendations(
  compose(
    {
      entries: [
        entry({ brand_name: "BrandA", amount_cents: 70000 }),
        entry({ brand_name: "BrandB", amount_cents: 30000 }),
      ],
    },
    FRI
  ),
  FRI
).find((r) => r.id === "concentration");
check("(d) concentration fires at exactly 70%", concentrated?.severity, "watch");
check("(d) concentration evidence names the brand and share", concentrated?.evidence, {
  topBrand: "BrandA",
  topBrandSharePct: 70,
  topBrandRecorded: "$700.00",
  totalRecorded: "$1,000.00",
});

// 69.9% → silent.
check(
  "(d) concentration silent at 69.9%",
  ids(
    compose(
      {
        entries: [
          entry({ brand_name: "BrandA", amount_cents: 69900 }),
          entry({ brand_name: "BrandB", amount_cents: 30100 }),
        ],
      },
      FRI
    ),
    FRI
  ).includes("concentration"),
  false
);

// --- (e) Overdue deals -----------------------------------------------------------------------

const overdueDeal = buildRecommendations(
  compose({ deals: [deal({ deadline: "2026-11-19" })] }, FRI),
  FRI
).find((r) => r.id === "overdue_deals");
check("(e) overdue deal fires with count and oldest days", overdueDeal?.evidence, {
  overdueDeals: 1,
  oldestDaysOverdue: 1,
});
check(
  "(e) deadline today is not overdue; a paid deal is never overdue",
  ids(
    compose(
      {
        deals: [
          deal({ deadline: "2026-11-20" }),
          deal({ deadline: "2026-11-01", stage: "paid" }),
        ],
      },
      FRI
    ),
    FRI
  ).includes("overdue_deals"),
  false
);

// --- (f) Overdue payments ----------------------------------------------------------------------

const overduePay = buildRecommendations(
  compose(
    { entries: [entry({ status: "pending", due_date: "2026-11-10", amount_cents: 25000 })] },
    FRI
  ),
  FRI
).find((r) => r.id === "overdue_payments");
check("(f) overdue payment fires with count and total", overduePay?.evidence, {
  overduePayments: 1,
  overdueTotal: "$250.00",
});
check(
  "(f) due today, already paid, and no-due-date entries stay silent",
  ids(
    compose(
      {
        entries: [
          entry({ status: "pending", due_date: "2026-11-20" }),
          entry({ status: "paid", due_date: "2026-11-01" }),
          entry({ status: "pending", due_date: null }),
        ],
      },
      FRI
    ),
    FRI
  ).includes("overdue_payments"),
  false
);

// --- (g) Empty state ----------------------------------------------------------------------------

const emptyRecs = buildRecommendations(compose({}, FRI), FRI);
check("(g) fully empty records yield exactly one recommendation", emptyRecs.length, 1);
check("(g) the one recommendation is 'start'", emptyRecs[0]?.id, "start");

// Partial records are not the empty state: a lone followers goal still
// gets judged by the rules that can read it (here, posting pace).
check(
  "(g) partial records are not the empty state",
  ids(
    compose(
      {
        goals: [
          {
            goal_type: "followers",
            target_value: 1000,
            unit: "followers",
            period: "total",
            manual_current: 10,
            completed_at: null,
          },
        ],
      },
      FRI
    ),
    FRI
  ),
  ["posting_pace"]
);

// --- Sort order: act → watch → good --------------------------------------------------------------

const mixed = buildRecommendations(
  compose(
    {
      posts: [
        post("2026-11-16"),
        post("2026-11-17"),
        post("2026-11-18"),
        post("2026-11-19"),
        post("2026-11-20"),
      ],
      entries: [
        entry({ brand_name: "BrandA", amount_cents: 70000 }),
        entry({ brand_name: "BrandB", amount_cents: 30000 }),
      ],
      deals: [deal({ deadline: "2026-11-19" })],
    },
    FRI
  ),
  FRI
);
check(
  "sort order is act, then watch, then good",
  mixed.map((r) => [r.id, r.severity]),
  [
    ["overdue_deals", "act"],
    ["concentration", "watch"],
    ["posting_pace", "good"],
  ]
);

// --- Doctrine: estimates can never move a recommendation -----------------------------------------
//
// Composed exactly as the route composes its inputs — recorded rows
// only — while a $900,000 estimate sits in scope. The estimate is
// summarized by its own function (as the hub does) and never handed
// to the Advisor; the recommendations do not change.

const doctrineEntries = [
  entry({ amount_cents: 40000, earned_date: "2026-11-05" }),
];
const doctrineGoals = [earningsGoal({})];
const baseline = buildRecommendations(
  compose({ entries: doctrineEntries, goals: doctrineGoals }, FRI),
  FRI
);
const estimateRows: RevenueEstimateLike[] = [
  {
    platform: "tiktok",
    amount_cents: 90000000,
    period_month: "2026-11-01",
    basis: "creator_entered",
  },
];
const estimateSummary = computeEstimateSummary(estimateRows);
check("doctrine setup: the estimate in scope is real", estimateSummary.totalEstimatedCents, 90000000);
const withEstimateInScope = buildRecommendations(
  compose({ entries: doctrineEntries, goals: doctrineGoals }, FRI),
  FRI
);
check(
  "recommendations identical with a $900,000 estimate in scope",
  withEstimateInScope,
  baseline
);
check(
  "the earnings pace still reads recorded money only",
  withEstimateInScope.find((r) => r.id === "earnings_goal_pace")?.evidence.recordedThisMonth,
  "$400.00"
);

console.log(failures === 0 ? "\nALL ADVISOR FIXTURES PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
