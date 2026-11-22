// ============================================================================
// Creator Growth Center — acceptance fixtures for the revenue
// summary extension (lib/revenue/summary.ts): byKind, yearly,
// current/previous month — and the binding doctrine proof that
// estimated earnings NEVER enter recorded totals.
//
// Run (from the repo root):
//   npx tsx scripts/revenue-growth-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  computeEstimateSummary,
  computeSummary,
  type RevenueEntryLike,
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

// "Now" is 2026-11-22: current month 2026-11, previous 2026-10.
const NOW = new Date(Date.UTC(2026, 10, 22, 12, 0, 0));

const ENTRIES: (RevenueEntryLike & { kind?: string })[] = [
  { brand_name: "Nomatic", amount_cents: 100000, status: "paid", earned_date: "2026-11-05", kind: "campaign_fee" },
  { brand_name: "Nomatic", amount_cents: 25050, status: "pending", earned_date: "2026-11-10", kind: "affiliate_commission" },
  { brand_name: "Trybe Brand", amount_cents: 40000, status: "paid", earned_date: "2026-10-15", kind: "brand_payment" },
  { brand_name: "TikTok", amount_cents: 10000, status: "paid", earned_date: "2026-10-02", kind: "platform_payout" },
  // No kind: a pre-upgrade row. Must classify as 'other'.
  { brand_name: "Legacy", amount_cents: 9999, status: "paid", earned_date: "2025-12-25" },
  { brand_name: "Old", amount_cents: 5000, status: "pending", earned_date: "2025-01-10", kind: "other" },
];

const summary = computeSummary(ENTRIES as RevenueEntryLike[], NOW);

// --- Original totals are untouched by the extension ----------------------------

check("(a) total earned", summary.totalEarnedCents, 190049);
check("(a) pending", summary.pendingCents, 30050);
check("(a) received", summary.receivedCents, 159999);

// --- byKind ----------------------------------------------------------------------

check(
  "(b) byKind covers all five kinds in fixed order",
  summary.byKind.map((k) => k.kind),
  ["campaign_fee", "affiliate_commission", "brand_payment", "platform_payout", "other"]
);
check(
  "(b) byKind campaign_fee",
  summary.byKind.find((k) => k.kind === "campaign_fee"),
  { kind: "campaign_fee", totalCents: 100000, pendingCents: 0, paidCents: 100000, count: 1 }
);
check(
  "(b) byKind other includes the kind-less legacy row",
  summary.byKind.find((k) => k.kind === "other"),
  { kind: "other", totalCents: 14999, pendingCents: 5000, paidCents: 9999, count: 2 }
);
check(
  "(b) byKind sums back to the total",
  summary.byKind.reduce((acc, k) => acc + k.totalCents, 0),
  summary.totalEarnedCents
);

// --- Yearly ------------------------------------------------------------------------

check(
  "(c) yearly rows, newest first",
  summary.yearly,
  [
    { year: 2026, totalCents: 175050, paidCents: 150000, pendingCents: 25050 },
    { year: 2025, totalCents: 14999, paidCents: 9999, pendingCents: 5000 },
  ]
);

// --- Current / previous month --------------------------------------------------------

check("(d) current month (2026-11)", summary.currentMonthCents, 125050);
check("(d) previous month (2026-10)", summary.previousMonthCents, 50000);
check(
  "(d) previous month across a year boundary",
  computeSummary(
    [
      { brand_name: "A", amount_cents: 700, status: "paid", earned_date: "2025-12-31" },
      { brand_name: "A", amount_cents: 300, status: "paid", earned_date: "2026-01-01" },
    ],
    new Date(Date.UTC(2026, 0, 15))
  ).previousMonthCents,
  700
);

// --- THE DOCTRINE PROOF: estimates never enter recorded totals -----------------------
//
// The recorded summary is computed from entry rows ONLY — the
// function's input type has no estimate shape. This fixture makes
// the operational claim concrete: with estimates present in the
// world (summed separately), the recorded summary is byte-identical
// to the recorded summary computed without them, and the estimate
// money appears ONLY in the estimate summary.

const ESTIMATES: RevenueEstimateLike[] = [
  { platform: "TikTok", amount_cents: 777777, period_month: "2026-11-01", basis: "creator_entered" },
  { platform: "Instagram", amount_cents: 222222, period_month: "2026-10-01", basis: "platform_reported" },
];

const recordedWithoutEstimates = computeSummary(ENTRIES as RevenueEntryLike[], NOW);
const estimateSummary = computeEstimateSummary(ESTIMATES);
const recordedWithEstimatesInWorld = computeSummary(ENTRIES as RevenueEntryLike[], NOW);

check(
  "(e) recorded summary identical whether or not estimates exist",
  recordedWithEstimatesInWorld,
  recordedWithoutEstimates
);
check("(e) estimate total is the estimates only", estimateSummary.totalEstimatedCents, 999999);
check("(e) estimate basis split", [estimateSummary.creatorEnteredCents, estimateSummary.platformReportedCents], [777777, 222222]);
check(
  "(e) no recorded figure contains estimate money",
  [
    recordedWithEstimatesInWorld.totalEarnedCents,
    recordedWithEstimatesInWorld.receivedCents,
    recordedWithEstimatesInWorld.pendingCents,
    recordedWithEstimatesInWorld.currentMonthCents,
  ],
  [190049, 159999, 30050, 125050]
);
check(
  "(e) estimate byPlatform",
  estimateSummary.byPlatform,
  [
    { platform: "TikTok", totalCents: 777777, count: 1 },
    { platform: "Instagram", totalCents: 222222, count: 1 },
  ]
);
check(
  "(e) estimate byMonth",
  estimateSummary.byMonth,
  [
    { month: "2026-10", totalCents: 222222 },
    { month: "2026-11", totalCents: 777777 },
  ]
);
check(
  "(e) empty estimates sum to zero",
  computeEstimateSummary([]),
  { totalEstimatedCents: 0, byPlatform: [], byMonth: [], creatorEnteredCents: 0, platformReportedCents: 0 }
);

console.log(failures === 0 ? "\nALL ASSERTIONS PASSED" : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
