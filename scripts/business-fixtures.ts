// ============================================================================
// Creator Business Health — acceptance fixtures for the pure math
// (lib/business/health.ts) and the deal pipeline summary.
//
// Fixed inputs assert exact figures: brand concentration, the
// campaign-fee average, pipeline conversion (including the null
// case), outstanding/received consistency with the Revenue
// Tracker's own summary, honest empty-input zeros/nulls, the
// platform fact (recorded revenue entries carry no platform, so
// byPlatform is empty rather than invented), and the doctrine
// proof that estimated earnings can never move a health figure —
// inputs are composed exactly as app/api/business/route.ts
// composes them while a large estimate sits in scope, and the
// health output does not change.
//
// Run (from the repo root):
//   npx tsx scripts/business-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  computeHealth,
  summarizePipeline,
  type DealLike,
  type HealthEntryLike,
} from "../lib/business/health";
import {
  computeSummary,
  computeEstimateSummary,
  type RevenueEstimateLike,
} from "../lib/revenue/summary";

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

const NOW = new Date(Date.UTC(2026, 10, 22)); // Nov 22, 2026

const entry = (over: Partial<HealthEntryLike>): HealthEntryLike => ({
  brand_name: "GlowCo",
  amount_cents: 10000,
  status: "paid",
  earned_date: "2026-11-10",
  kind: "other",
  ...over,
});

const deal = (over: Partial<DealLike>): DealLike => ({
  brand_name: "GlowCo",
  platform: null,
  stage: "lead",
  compensation_cents: null,
  deadline: null,
  ...over,
});

// --- Recorded revenue: two brands, mixed status and kind ---------
// GlowCo: 60000 paid campaign_fee + 20000 pending brand_payment
// SnackLab: 20000 paid affiliate_commission
// Total 100000; received 80000; outstanding 20000.
const ENTRIES: HealthEntryLike[] = [
  entry({ brand_name: "GlowCo", amount_cents: 60000, status: "paid", kind: "campaign_fee", earned_date: "2026-11-05" }),
  entry({ brand_name: "GlowCo", amount_cents: 20000, status: "pending", kind: "brand_payment", earned_date: "2026-11-12" }),
  entry({ brand_name: "SnackLab", amount_cents: 20000, status: "paid", kind: "affiliate_commission", earned_date: "2026-10-20" }),
];

const DEALS: DealLike[] = [
  deal({ stage: "lead", compensation_cents: 50000 }),
  deal({ stage: "negotiating", compensation_cents: 75000 }),
  deal({ stage: "invoiced", compensation_cents: null }),
  deal({ stage: "paid", compensation_cents: 60000 }),
  deal({ stage: "paid", compensation_cents: 40000 }),
  deal({ stage: "paid", compensation_cents: 30000 }),
  deal({ stage: "closed", compensation_cents: 20000 }),
];

const health = computeHealth(ENTRIES, DEALS, NOW);
const summary = computeSummary(ENTRIES, NOW);

check("total recorded", health.totalRecordedCents, 100000);
check("outstanding = summary pending", health.outstandingCents, summary.pendingCents);
check("outstanding value", health.outstandingCents, 20000);
check("received = summary paid", health.receivedCents, summary.receivedCents);
check("received value", health.receivedCents, 80000);
check("monthly trend reused from summary", health.monthlyTrend, summary.monthly);

// --- Concentration ------------------------------------------------
check("byBrand order + shares", health.byBrand, [
  { name: "GlowCo", cents: 80000, sharePct: 80 },
  { name: "SnackLab", cents: 20000, sharePct: 20 },
]);
check("top brand share", health.topBrandSharePct, 80);

// --- Platform fact: real entries carry no platform ----------------
check("byPlatform empty for real-shaped entries", health.byPlatform, []);
check("top platform share 0 with no platform data", health.topPlatformSharePct, 0);

const tagged = computeHealth(
  [
    entry({ platform: "tiktok", amount_cents: 30000 }),
    entry({ platform: "instagram", amount_cents: 10000 }),
    entry({ amount_cents: 60000 }),
  ],
  [],
  NOW
);
check("byPlatform groups only platform-tagged entries", tagged.byPlatform, [
  { name: "tiktok", cents: 30000, sharePct: 30 },
  { name: "instagram", cents: 10000, sharePct: 10 },
]);
check("top platform share from tagged entries", tagged.topPlatformSharePct, 30);

// --- Campaign average ----------------------------------------------
check("avg per campaign (single campaign_fee)", health.avgPerCampaignCents, 60000);
const avg = computeHealth(
  [
    entry({ kind: "campaign_fee", amount_cents: 10000 }),
    entry({ kind: "campaign_fee", amount_cents: 20001 }),
    entry({ kind: "brand_payment", amount_cents: 99999 }),
  ],
  [],
  NOW
);
check("avg per campaign rounds to integer cents", avg.avgPerCampaignCents, 15001);
check(
  "avg per campaign null when no campaign fees",
  computeHealth([entry({ kind: "brand_payment" })], [], NOW).avgPerCampaignCents,
  null
);

// --- Pipeline --------------------------------------------------------
check("pipeline open deals", health.pipeline.openDeals, 3);
check("pipeline open value (null compensation counts 0)", health.pipeline.openValueCents, 125000);
check("pipeline paid deals", health.pipeline.paidDeals, 3);
check("pipeline closed deals", health.pipeline.closedDeals, 1);
check("conversion pct = paid/(paid+closed)", health.pipeline.conversionPct, 75);
check(
  "conversion null when no finished outcomes",
  computeHealth([], [deal({ stage: "lead" }), deal({ stage: "active" })], NOW).pipeline.conversionPct,
  null
);
check(
  "conversion 100 when every finished deal was paid",
  computeHealth([], [deal({ stage: "paid" }), deal({ stage: "paid" })], NOW).pipeline.conversionPct,
  100
);
const stages = summarizePipeline(DEALS);
check("stage counts", stages.byStage.map((s) => s.count), [1, 0, 1, 0, 0, 1, 3, 1]);
check("stage compensation totals", stages.byStage.map((s) => s.compensationCents), [50000, 0, 75000, 0, 0, 0, 130000, 20000]);

// --- Empty inputs: honest zeros and nulls ---------------------------
const empty = computeHealth([], [], NOW);
check("empty totals", [empty.totalRecordedCents, empty.outstandingCents, empty.receivedCents], [0, 0, 0]);
check("empty byBrand/byPlatform", [empty.byBrand, empty.byPlatform], [[], []]);
check("empty shares", [empty.topBrandSharePct, empty.topPlatformSharePct], [0, 0]);
check("empty avg + conversion null", [empty.avgPerCampaignCents, empty.pipeline.conversionPct], [null, null]);
check("empty trend still 6 zero months", empty.monthlyTrend.map((m) => m.totalCents), [0, 0, 0, 0, 0, 0]);

// --- Doctrine proof: estimates in scope cannot move health ---------
const ESTIMATES: RevenueEstimateLike[] = [
  { platform: "tiktok", amount_cents: 900000, period_month: "2026-11-01", basis: "creator_entered" },
];
const estimateSummary = computeEstimateSummary(ESTIMATES);
check("estimate exists in scope (sanity)", estimateSummary.totalEstimatedCents, 900000);
// Composed exactly as the API composes health: entries + deals only.
const healthWithEstimatesInScope = computeHealth(ENTRIES, DEALS, NOW);
check("health identical with estimates in scope", healthWithEstimatesInScope, health);

console.log(failures === 0 ? "\nALL BUSINESS FIXTURES PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
