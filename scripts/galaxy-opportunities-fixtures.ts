// ============================================================================
// Galaxy Verified Brand Opportunities — acceptance fixtures for the
// pure System #3 logic added to lib/galaxy/core.ts (2026-11-23):
// the verified-identity rule, the niche predicate shared with
// Today's matchesToPitch, application-state mapping from the
// creator's own deals, and payment history computed from the
// creator's OWN paid deals only.
//
// The owner's rules, asserted exactly: a brand is verified only
// with at least one brand_evidence row on file (0 → false, ≥1 →
// true); days-to-pay averages only the paid deals that carry BOTH
// the invoice-sent and payment-received dates — a paid deal
// missing either date counts toward totals but never toward the
// average; no paid deals means no history at all (null), so
// surfaces show nothing rather than an invented reputation.
//
// Run (from the repo root):
//   npx tsx scripts/galaxy-opportunities-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  applicationLabel,
  brandIsVerified,
  brandMatchesNiche,
  brandPaymentHistory,
  currentApplication,
  dealsForBrand,
  type GalaxyBrand,
  type GalaxyDeal,
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

const brand = (over: Partial<GalaxyBrand>): GalaxyBrand => ({
  id: "b1",
  name: "Brand",
  category: "Beauty",
  categories: ["Beauty"],
  program: null,
  rate: null,
  cap: "unknown",
  accepting: true,
  checked: null,
  added: "2026-11-01",
  saved: false,
  verified: false,
  ...over,
});

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
  pitchedOn: "2026-11-20",
  lastContact: "2026-11-22",
  dueOn: null,
  invoiceSentOn: null,
  invoiceDue: null,
  paidOn: null,
  ...over,
});

/* ---------------- verified rule ---------------- */

check("verified: 0 evidence rows -> false", brandIsVerified(0), false);
check("verified: 1 evidence row -> true", brandIsVerified(1), true);
check("verified: many evidence rows -> true", brandIsVerified(7), true);

/* ---------------- niche predicate (matchesToPitch's rule) ---------------- */

check("niche: no niche set matches everything", brandMatchesNiche(brand({}), ""), true);
check(
  "niche: primary category equals niche",
  brandMatchesNiche(brand({ category: "Fitness", categories: ["Fitness"] }), "Fitness"),
  true
);
check(
  "niche: any category equals niche",
  brandMatchesNiche(brand({ category: "Beauty", categories: ["Beauty", "Fitness"] }), "Fitness"),
  true
);
check(
  "niche: no category matches -> false",
  brandMatchesNiche(brand({ category: "Beauty", categories: ["Beauty"] }), "Fitness"),
  false
);

/* ---------------- application-state mapping ---------------- */

check("application: pitched shows the pitch date", applicationLabel(deal({ stage: "pitched" })), "Pitched Nov 20");
check("application: negotiating", applicationLabel(deal({ stage: "negotiating" })), "Negotiating");
check("application: contracted", applicationLabel(deal({ stage: "contracted" })), "Contracted");
check("application: delivering", applicationLabel(deal({ stage: "delivering" })), "Delivering");
check("application: invoiced", applicationLabel(deal({ stage: "invoiced" })), "Invoiced");
check("application: paid", applicationLabel(deal({ stage: "paid" })), "Paid ✓");
check("application: lost reads Closed", applicationLabel(deal({ stage: "lost" })), "Closed");

/* ---------------- deals-for-brand matching ---------------- */

const mixed: GalaxyDeal[] = [
  deal({ id: "by-name", brandName: "GlowCo", brandId: null }),
  deal({ id: "by-id", brandName: "Renamed Co", brandId: "b9" }),
  deal({ id: "other", brandName: "Other", brandId: null }),
];
check(
  "matching: name match when the deal carries no brand id",
  dealsForBrand(mixed, { id: "b1", name: "GlowCo" }).map((d) => d.id),
  ["by-name"]
);
check(
  "matching: id match when the deal carries a brand id",
  dealsForBrand(mixed, { id: "b9", name: "Whoever" }).map((d) => d.id),
  ["by-id"]
);
check(
  "matching: an id-carrying deal never falls back to name matching",
  dealsForBrand(mixed, { id: "bX", name: "Renamed Co" }),
  []
);
check(
  "matching: a brand with no deals gets an empty set",
  dealsForBrand(mixed, { id: "zz", name: "Nope" }),
  []
);

/* ---------------- current application ---------------- */

check("current application: no deals -> null", currentApplication([]), null);
check(
  "current application: most recently updated deal wins",
  currentApplication([
    deal({ id: "old", updatedAt: "2026-11-20T10:00:00Z", lastContact: "2026-11-20" }),
    deal({ id: "new", updatedAt: "2026-11-22T09:00:00Z", lastContact: "2026-11-22" }),
  ])?.id,
  "new"
);
check(
  "current application: falls back to last-contact date without timestamps",
  currentApplication([
    deal({ id: "a", lastContact: "2026-11-21", pitchedOn: "2026-11-19" }),
    deal({ id: "b", lastContact: "2026-11-18", pitchedOn: "2026-11-18" }),
  ])?.id,
  "a"
);

/* ---------------- payment history (own paid deals only) ---------------- */

check("history: no deals -> null", brandPaymentHistory([]), null);
check(
  "history: deals but none paid -> null",
  brandPaymentHistory([deal({ stage: "contracted", amountCents: 50000 })]),
  null
);
check(
  "history: single paid deal, 12 days invoice-sent to received",
  brandPaymentHistory([
    deal({
      stage: "paid",
      amountCents: 50000,
      invoiceSentOn: "2026-11-01",
      paidOn: "2026-11-13",
    }),
  ]),
  { totalPaidCents: 50000, paidDeals: 1, avgDaysToPay: 12 }
);
check(
  "history: average across deals (12 and 20 days -> 16)",
  brandPaymentHistory([
    deal({ id: "p1", stage: "paid", amountCents: 10000, invoiceSentOn: "2026-11-01", paidOn: "2026-11-13" }),
    deal({ id: "p2", stage: "paid", amountCents: 30000, invoiceSentOn: "2026-10-01", paidOn: "2026-10-21" }),
  ]),
  { totalPaidCents: 40000, paidDeals: 2, avgDaysToPay: 16 }
);
check(
  "history: paid deal missing the invoice date is excluded from the average only",
  brandPaymentHistory([
    deal({ id: "timed", stage: "paid", amountCents: 10000, invoiceSentOn: "2026-11-01", paidOn: "2026-11-11" }),
    deal({ id: "untimed", stage: "paid", amountCents: 20000, invoiceSentOn: null, paidOn: "2026-11-15" }),
  ]),
  { totalPaidCents: 30000, paidDeals: 2, avgDaysToPay: 10 }
);
check(
  "history: no paid deal carries both dates -> average is null, totals still real",
  brandPaymentHistory([
    deal({ stage: "paid", amountCents: 20000, invoiceSentOn: null, paidOn: "2026-11-15" }),
  ]),
  { totalPaidCents: 20000, paidDeals: 1, avgDaysToPay: null }
);
check(
  "history: received amount wins over the agreed amount",
  brandPaymentHistory([
    deal({ stage: "paid", amountCents: 50000, receivedCents: 45000, invoiceSentOn: "2026-11-01", paidOn: "2026-11-06" }),
  ]),
  { totalPaidCents: 45000, paidDeals: 1, avgDaysToPay: 5 }
);
check(
  "history: unpaid stages never count, even with dates filled in",
  brandPaymentHistory([
    deal({ stage: "invoiced", amountCents: 90000, invoiceSentOn: "2026-11-01", paidOn: null }),
    deal({ stage: "paid", amountCents: 10000, invoiceSentOn: "2026-11-02", paidOn: "2026-11-05" }),
  ]),
  { totalPaidCents: 10000, paidDeals: 1, avgDaysToPay: 3 }
);

if (failures > 0) {
  console.log(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll galaxy-opportunities assertions passed");
