// ============================================================================
// Galaxy Pricing Intelligence — acceptance fixtures for the pure
// pricing math added to lib/galaxy/core.ts for System #4 (Creator
// Pricing Intelligence, 2026-11-23).
//
// Fixed inputs assert exact figures: the quote base is the HIGHER
// of the creator's view price and their time floor; usage and
// exclusivity are additive on the base (base × uplift% × months)
// and the itemised lines always sum to the total; profitability
// prices the creator's time at their own target rate; negotiation
// prep reads only their real paid deals. The honesty guards are
// pinned too: no paid history → null anchors (never invented),
// zero hours → no per-hour verdict (never a divide-by-zero rate),
// garbage inputs → zeros.
//
// Run (from the repo root):
//   npx tsx scripts/galaxy-pricing-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  averagePaidFeeCents,
  computeQuote,
  counterOfferText,
  dealProfitability,
  fmtMoneyExact,
  fmtNum,
  negotiationPrep,
  quoteLines,
  type GalaxyDeal,
  type GalaxyProfile,
  type PricingInputs,
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

const PROFILE: GalaxyProfile = {
  name: "Alex Creator",
  niche: "",
  categories: [],
  platforms: [],
  audience: "",
  weeklyGoal: 5,
};

/* ---------------- the quote: view price wins ----------------------- */
const VIEWS_INPUT: PricingInputs = {
  avgViews: 50000,
  pricePer1kCents: 2000, // $20 per 1,000 views
  videos: 2,
  hours: 10,
  hourlyRateCents: 3000, // $30/hr target
  usageMonths: 3,
  usageUpliftPct: 25,
  exclusivityMonths: 2,
  exclusivityUpliftPct: 30,
};
const vq = computeQuote(VIEWS_INPUT);
check("view price = 50k views × $20/1k × 2 videos", vq.viewPriceCents, 200000);
check("time floor = 10h × $30", vq.timeFloorCents, 30000);
check("base is the higher (view price)", vq.baseCents, 200000);
check("base source is views", vq.baseSource, "views");
check("usage fee = base × 25% × 3 months", vq.usageFeeCents, 150000);
check("exclusivity fee = base × 30% × 2 months", vq.exclusivityFeeCents, 120000);
check("quote total = base + usage + exclusivity", vq.totalCents, 470000);

const vLines = quoteLines(VIEWS_INPUT, vq);
check("quote line ids", vLines.map((l) => l.id), ["base", "usage", "exclusivity"]);
check("quote line cents", vLines.map((l) => l.cents), [200000, 150000, 120000]);
check(
  "itemised lines sum to the total",
  vLines.reduce((t, l) => t + l.cents, 0),
  vq.totalCents
);
check("base line label", vLines[0].label, "Content — 2 videos");
check(
  "base line shows the view arithmetic",
  vLines[0].detail,
  "50000 average views × $20.00 per 1,000 views × 2 videos — your view price, the higher of the two ways to price it"
);
check(
  "usage line shows the additive arithmetic",
  vLines[1].detail,
  "$2,000.00 base × 25% per month × 3 months of paid usage (ads, whitelisting)"
);
check(
  "exclusivity line shows the additive arithmetic",
  vLines[2].detail,
  "$2,000.00 base × 30% per month × 2 months of category exclusivity"
);

/* ---------------- the quote: time floor wins ----------------------- */
const TIME_INPUT: PricingInputs = {
  avgViews: 5000,
  pricePer1kCents: 1000,
  videos: 1,
  hours: 20,
  hourlyRateCents: 5000, // $50/hr target
  usageMonths: 0,
  usageUpliftPct: 25,
  exclusivityMonths: 0,
  exclusivityUpliftPct: 30,
};
const tq = computeQuote(TIME_INPUT);
check("small-reach view price", tq.viewPriceCents, 5000);
check("time floor = 20h × $50", tq.timeFloorCents, 100000);
check("base is the higher (time floor)", tq.baseCents, 100000);
check("base source is time", tq.baseSource, "time");
check("no usage months → no usage fee", tq.usageFeeCents, 0);
check("no exclusivity months → no exclusivity fee", tq.exclusivityFeeCents, 0);
check("total is the base alone", tq.totalCents, 100000);
const tLines = quoteLines(TIME_INPUT, tq);
check("zero-month rights produce no lines", tLines.map((l) => l.id), ["base"]);
check(
  "time-floor line shows the time arithmetic",
  tLines[0].detail,
  "20 hours × $50.00 an hour — your time floor, the higher of the two ways to price it"
);

/* ---------------- tie + zero + garbage guards ---------------------- */
const TIE_INPUT: PricingInputs = {
  avgViews: 10000,
  pricePer1kCents: 3000,
  videos: 1,
  hours: 10,
  hourlyRateCents: 3000,
  usageMonths: 0,
  usageUpliftPct: 25,
  exclusivityMonths: 0,
  exclusivityUpliftPct: 30,
};
check("equal prices → tie source", computeQuote(TIE_INPUT).baseSource, "tie");
check("tie base", computeQuote(TIE_INPUT).baseCents, 30000);

const ZERO_INPUT: PricingInputs = {
  avgViews: 0,
  pricePer1kCents: 0,
  videos: 0,
  hours: 0,
  hourlyRateCents: 0,
  usageMonths: 0,
  usageUpliftPct: 0,
  exclusivityMonths: 0,
  exclusivityUpliftPct: 0,
};
const zq = computeQuote(ZERO_INPUT);
check("zero inputs → zero quote", [zq.baseCents, zq.totalCents], [0, 0]);
check("zero inputs → no base source", zq.baseSource, "none");
check("zero base → no itemised lines", quoteLines(ZERO_INPUT, zq), []);

const GARBAGE_INPUT: PricingInputs = {
  avgViews: -5000,
  pricePer1kCents: Number.NaN,
  videos: -2,
  hours: -3,
  hourlyRateCents: -100,
  usageMonths: -1,
  usageUpliftPct: -25,
  exclusivityMonths: Number.POSITIVE_INFINITY,
  exclusivityUpliftPct: 30,
};
const gq = computeQuote(GARBAGE_INPUT);
check(
  "negative / NaN / infinite inputs clamp to a zero quote",
  [gq.viewPriceCents, gq.timeFloorCents, gq.baseCents, gq.totalCents],
  [0, 0, 0, 0]
);

/* ---------------- history anchor: average paid fee ----------------- */
const HISTORY: GalaxyDeal[] = [
  deal({ id: "p1", stage: "paid", amountCents: 300000, receivedCents: 300000, paidOn: "2026-09-15" }),
  deal({ id: "p2", stage: "paid", amountCents: 50000, receivedCents: null, paidOn: "2026-10-10" }),
  deal({ id: "x1", stage: "pitched", amountCents: 999999 }),
  deal({ id: "l1", stage: "lost", amountCents: 888888 }),
];
check("average paid fee uses received, falls back to amount", averagePaidFeeCents(HISTORY), 175000);
check("no paid deals → null anchor, never invented", averagePaidFeeCents([deal({})]), null);
check("no deals at all → null anchor", averagePaidFeeCents([]), null);

/* ---------------- deal profitability ------------------------------- */
check(
  "profitable deal: profit after time + costs",
  dealProfitability({ feeCents: 100000, hours: 10, hourlyRateCents: 3000, costsCents: 5000 }).profitCents,
  65000
);
check(
  "profitable deal: effective hourly",
  dealProfitability({ feeCents: 100000, hours: 10, hourlyRateCents: 3000, costsCents: 5000 }).effectiveHourlyCents,
  9500
);
check(
  "profitable deal: verdict above target",
  dealProfitability({ feeCents: 100000, hours: 10, hourlyRateCents: 3000, costsCents: 5000 }).verdict,
  "above"
);
const below = dealProfitability({ feeCents: 20000, hours: 10, hourlyRateCents: 3000, costsCents: 5000 });
check("underpriced deal: negative profit", below.profitCents, -15000);
check("underpriced deal: effective hourly", below.effectiveHourlyCents, 1500);
check("underpriced deal: verdict below target", below.verdict, "below");
check("underpriced deal: fee needed to hit target", below.feeNeededCents, 35000);
check(
  "exactly-on-target deal: verdict at",
  dealProfitability({ feeCents: 35000, hours: 10, hourlyRateCents: 3000, costsCents: 5000 }).verdict,
  "at"
);
const noHours = dealProfitability({ feeCents: 20000, hours: 0, hourlyRateCents: 3000, costsCents: 5000 });
check("zero hours → no effective hourly (no divide by zero)", noHours.effectiveHourlyCents, null);
check("zero hours → no fee-needed figure", noHours.feeNeededCents, null);
check("zero hours → verdict unknown", noHours.verdict, "unknown");
check("zero hours → profit still counts fee minus costs", noHours.profitCents, 15000);

/* ---------------- negotiation prep --------------------------------- */
const PREP_DEALS: GalaxyDeal[] = [
  deal({ id: "a", stage: "paid", amountCents: 60000, receivedCents: 60000, invoiceSentOn: "2026-10-01", paidOn: "2026-10-11" }),
  deal({ id: "b", stage: "paid", amountCents: 30000, receivedCents: 30000, invoiceSentOn: "2026-10-01", paidOn: "2026-10-31" }),
  deal({ id: "c", stage: "paid", amountCents: 90000, receivedCents: null, paidOn: "2026-11-05" }),
  deal({ id: "d", stage: "pitched", amountCents: 12345 }),
];
const prep = negotiationPrep(PREP_DEALS);
check("prep: paid deal count", prep.paidDealCount, 3);
check("prep: average paid fee", prep.avgPaidFeeCents, 60000);
check("prep: fastest days to pay", prep.fastestDaysToPay, 10);
check("prep: average days to pay (System #3 rule)", prep.avgDaysToPay, 20);
check("prep: only deals with both dates are timed", prep.timedDeals, 2);

const emptyPrep = negotiationPrep([]);
check(
  "prep: no history → every figure null/zero",
  [emptyPrep.avgPaidFeeCents, emptyPrep.fastestDaysToPay, emptyPrep.avgDaysToPay, emptyPrep.timedDeals, emptyPrep.paidDealCount],
  [null, null, null, 0, 0]
);
check(
  "prep: payment logged before its invoice counts as 0 days",
  negotiationPrep([
    deal({ id: "e", stage: "paid", amountCents: 10000, receivedCents: 10000, invoiceSentOn: "2026-10-10", paidOn: "2026-10-05" }),
  ]).fastestDaysToPay,
  0
);

/* ---------------- counter-offer text ------------------------------- */
const counter = counterOfferText(PROFILE, VIEWS_INPUT, vq, "GlowCo");
check("counter-offer greets the brand", counter.includes("Hi GlowCo team,"), true);
check("counter-offer states the real total", counter.includes("my rate is $4,700.00:"), true);
check("counter-offer itemises content", counter.includes("- $2,000.00 for the content (2 videos)"), true);
check("counter-offer itemises usage", counter.includes("- $1,500.00 for 3 months of paid usage rights (ads and whitelisting)"), true);
check("counter-offer itemises exclusivity", counter.includes("- $1,200.00 for 2 months of category exclusivity"), true);
check("counter-offer signs with the creator's name", counter.endsWith("Alex Creator"), true);

const counterNoRights = counterOfferText(PROFILE, TIME_INPUT, tq);
check("counter-offer without a brand greets the team", counterNoRights.includes("Hi team,"), true);
check("counter-offer omits rights lines when none are quoted", counterNoRights.includes("paid usage rights"), false);
check("counter-offer total for the time-floor quote", counterNoRights.includes("my rate is $1,000.00:"), true);

/* ---------------- formatting helpers ------------------------------- */
check("fmtMoneyExact keeps cents", fmtMoneyExact(470000), "$4,700.00");
check("fmtMoneyExact handles negatives", fmtMoneyExact(-15000), "−$150.00");
check("fmtMoneyExact zero", fmtMoneyExact(0), "$0.00");
check("fmtNum trims whole numbers", fmtNum(10), "10");
check("fmtNum keeps decimals", fmtNum(2.5), "2.5");

if (failures > 0) {
  console.log(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll pricing assertions passed.");
