// ============================================================================
// Galaxy Money Center — acceptance fixtures for the pure money math
// added to lib/galaxy/core.ts for System #1 (Creator Money Center,
// 2026-11-23): contracted forecast, income gaps, month-by-month
// detail.
//
// Fixed inputs assert exact figures: the forecast counts ONLY
// contracted/delivering value (an invoiced deal's balance can never
// be double-counted as forecast), bucketing is by the real payment
// due date (payment_due_date) with dateless deals honestly in the
// "no date set" bucket, the gap baseline is the 6-month average of
// paid income, and thin or stale payment history produces NO gap
// figures at all.
//
// Run (from the repo root):
//   npx tsx scripts/galaxy-money-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  contractedForecast,
  fmtMoney,
  incomeOutlook,
  invoicedOutstandingDueInMonth,
  monthsBackDetail,
  monthsBackMoney,
  type GalaxyDeal,
  type GalaxyExpense,
  type GalaxyIncome,
} from "../lib/galaxy/core";

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

const NOW = new Date(2026, 10, 23); // Nov 23, 2026 (local calendar)

const deal = (over: Partial<GalaxyDeal>): GalaxyDeal => ({
  id: "d",
  brandName: "Brand",
  brandId: null,
  platform: null,
  stage: "pitched",
  amountCents: null,
  receivedCents: null,
  deliverables: "",
  notes: "",
  pitchedOn: "2026-11-01",
  lastContact: "2026-11-01",
  dueOn: null,
  invoiceSentOn: null,
  invoiceDue: null,
  paidOn: null,
  ...over,
});

const DEALS: GalaxyDeal[] = [
  // Paid history: Sep $3,000 · Oct $500 · Nov $300 (deal fall-back amount)
  deal({ id: "p1", brandName: "Paid Sep", stage: "paid", amountCents: 300000, receivedCents: 300000, paidOn: "2026-09-15" }),
  deal({ id: "p2", brandName: "Paid Oct", stage: "paid", amountCents: 50000, receivedCents: 50000, paidOn: "2026-10-10" }),
  deal({ id: "p3", brandName: "Paid Nov", stage: "paid", amountCents: 30000, receivedCents: null, paidOn: "2026-11-05" }),
  // Invoiced: $300 still owed due Nov · $200 due Dec · $999 with NO due date
  deal({ id: "v1", brandName: "Invoiced Nov", stage: "invoiced", amountCents: 40000, receivedCents: 10000, invoiceSentOn: "2026-11-01", invoiceDue: "2026-11-28" }),
  deal({ id: "v2", brandName: "Invoiced Dec", stage: "invoiced", amountCents: 20000, receivedCents: null, invoiceDue: "2026-12-05" }),
  deal({ id: "v3", brandName: "Invoiced NoDate", stage: "invoiced", amountCents: 99900, receivedCents: null, invoiceDue: null }),
  // Contracted / delivering: the forecast population
  deal({ id: "c1", brandName: "Contracted Nov", stage: "contracted", amountCents: 25000, invoiceDue: "2026-11-30" }),
  deal({ id: "c5", brandName: "Contracted PastDue", stage: "contracted", amountCents: 7000, invoiceDue: "2026-10-01" }),
  deal({ id: "c2", brandName: "Delivering Dec", stage: "delivering", amountCents: 15000, invoiceDue: "2026-12-15" }),
  deal({ id: "c3", brandName: "Contracted Later", stage: "contracted", amountCents: 50000, invoiceDue: "2027-02-01" }),
  deal({ id: "c4", brandName: "Contracted NoDate", stage: "contracted", amountCents: 10000, invoiceDue: null }),
  // Never money yet / never money at all: excluded everywhere
  deal({ id: "x1", brandName: "Pitched Big", stage: "pitched", amountCents: 999999 }),
  deal({ id: "l1", brandName: "Lost Big", stage: "lost", amountCents: 888888 }),
];

const INCOME: GalaxyIncome[] = [{ id: "i1", source: "TikTok Shop", amountCents: 10000, date: "2026-10-20" }];
const EXPENSES: GalaxyExpense[] = [
  { id: "e1", label: "Ring light", amountCents: 5000, date: "2026-11-03" },
  { id: "e2", label: "Camera", amountCents: 20000, date: "2026-09-01" },
];

// --- Paid window (chart source of truth) ------------------------------------
check(
  "paid totals Jun..Nov",
  monthsBackMoney(DEALS, INCOME, 6, NOW).map((m) => m.totalCents),
  [0, 0, 0, 300000, 60000, 30000]
);

// --- Invoiced outstanding by due month --------------------------------------
check("invoiced outstanding due Nov", invoicedOutstandingDueInMonth(DEALS, "2026-11"), 30000);
check("invoiced outstanding due Dec", invoicedOutstandingDueInMonth(DEALS, "2026-12"), 20000);
check("invoiced outstanding due Oct (dateless invoice counts nowhere)", invoicedOutstandingDueInMonth(DEALS, "2026-10"), 0);

// --- Contracted forecast ------------------------------------------------------
const fc = contractedForecast(DEALS, NOW);
check("forecast bucket labels", fc.buckets.map((b) => b.label), [
  "Expected this month",
  "Expected next month",
  "Later",
  "Contracted — no date set",
]);
check("forecast bucket cents", fc.buckets.map((b) => b.cents), [32000, 15000, 50000, 10000]);
check("forecast total excludes invoiced balances (no double count)", fc.totalCents, 107000);
check("forecast deal count (contracted + delivering only)", fc.dealCount, 5);
check(
  "forecast this-month bucket holds this-month + past-due deals",
  fc.buckets[0].deals.map((d) => d.brandName),
  ["Contracted Nov", "Contracted PastDue"]
);

// --- Income outlook -----------------------------------------------------------
// Baseline = (0+0+0+300000+60000+30000)/6 = 65000. Avg paid deal = 380000/3.
const outlook = incomeOutlook(DEALS, INCOME, NOW);
check("outlook has enough history", outlook.enoughHistory, true);
check("outlook baseline = 6-month average paid", outlook.baselineCents, 65000);
check("outlook average paid deal size", outlook.avgPaidDealCents, 126667);
check(
  "outlook November: paid 30000 + invoiced 30000 + contracted 32000 = covered",
  outlook.months.map((m) => [m.key, m.expectedCents, m.gapCents, m.covered, m.dealsToClose])[0],
  ["2026-11", 92000, 0, true, null]
);
check(
  "outlook December: 35000 expected, 30000 light, 1 average deal closes it",
  outlook.months.map((m) => [m.key, m.expectedCents, m.gapCents, m.covered, m.dealsToClose])[1],
  ["2026-12", 35000, 30000, false, 1]
);

// --- Month-by-month detail ----------------------------------------------------
const detail = monthsBackDetail(DEALS, INCOME, EXPENSES, 6, NOW);
check(
  "detail paid matches the chart totals exactly",
  detail.map((m) => m.totalCents),
  monthsBackMoney(DEALS, INCOME, 6, NOW).map((m) => m.totalCents)
);
check(
  "detail September row",
  detail.filter((m) => m.key === "2026-09").map((m) => [m.totalCents, m.invoicedOutstandingCents, m.expensesCents, m.keptCents]),
  [[300000, 0, 20000, 280000]]
);
check(
  "detail November row",
  detail.filter((m) => m.key === "2026-11").map((m) => [m.totalCents, m.invoicedOutstandingCents, m.expensesCents, m.keptCents]),
  [[30000, 30000, 5000, 25000]]
);

// --- Honest no-history behaviour ----------------------------------------------
const oneMonth = incomeOutlook([DEALS[2]], [], NOW);
check("one paid month only: no gap figures", [oneMonth.enoughHistory, oneMonth.months], [false, []]);
const empty = incomeOutlook([], [], NOW);
check("no records at all: no gap figures", [empty.enoughHistory, empty.months], [false, []]);
const stale = incomeOutlook(
  [
    deal({ id: "o1", stage: "paid", amountCents: 50000, receivedCents: 50000, paidOn: "2026-01-10" }),
    deal({ id: "o2", stage: "paid", amountCents: 50000, receivedCents: 50000, paidOn: "2026-02-10" }),
  ],
  [],
  NOW
);
check("paid history only outside the 6-month window: baseline is zero, no gap figures", [stale.enoughHistory, stale.months], [false, []]);
check("empty forecast", [contractedForecast([], NOW).totalCents, contractedForecast([], NOW).dealCount], [0, 0]);

// --- Money formatting -----------------------------------------------------------
check("fmtMoney incl. negatives", [fmtMoney(123456), fmtMoney(-5000), fmtMoney(0), fmtMoney(null)], ["$1,235", "−$50", "$0", "$0"]);

console.log(failures === 0 ? "\nALL GALAXY MONEY FIXTURES PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
