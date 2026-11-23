// ============================================================================
// Galaxy Creator Business Advisor — acceptance fixtures for the pure
// System #5 logic added to lib/galaxy/core.ts (2026-11-23):
// income concentration over paid deals, neglected saved brands,
// the week-ahead read (the Money Center's incomeOutlook, reused),
// the two advisor insights inside computeInsights, and the
// "first move" selection.
//
// The owner's rule, asserted exactly: every recommendation uses
// the creator's actual business information. Concentration is
// figured from PAID DEALS only (payout entries carry no brand and
// are never blended in); the concentration insight fires only at
// a 60%+ top share with at least two paid deals in the last 6
// months (one paid deal is trivially 100% and proves no pattern);
// a neglected brand is saved + accepting + never pitched in ANY
// stage; the saved-neglected insight never duplicates a pitch
// action the matches already produced for the same brand; the
// week-ahead line exists only when the Money Center's history
// rule says there is enough history to read.
//
// Run (from the repo root):
//   npx tsx scripts/galaxy-advisor-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  computeAdvisor,
  computeInsights,
  firstMoveTitle,
  incomeConcentration,
  neglectedOpportunities,
  type GalaxyBrand,
  type GalaxyDeal,
  type GalaxyProfile,
  type InsightInput,
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

/* Fixed "now": Nov 23, 2026. The 6-month window is Jun–Nov 2026. */
const NOW = new Date(2026, 10, 23, 12, 0, 0);

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

const paid = (over: Partial<GalaxyDeal>): GalaxyDeal =>
  deal({ stage: "paid", ...over });

const profile: GalaxyProfile = {
  name: "Test Creator",
  niche: "Beauty",
  categories: [],
  platforms: [],
  audience: "",
  weeklyGoal: 5,
};

/* Quiet baseline input: goal met, a script exists — so only the
 * insights under test can fire. */
const input = (over: Partial<InsightInput>): InsightInput => ({
  deals: [],
  brands: [],
  profile,
  postsThisWeek: 5,
  scriptCount: 1,
  now: NOW,
  ...over,
});

/* ---------------- concentration: the math ---------------- */

check(
  "concentration: one brand, two paid deals -> 100% share",
  incomeConcentration(
    [
      paid({ id: "a", brandName: "GlowCo", amountCents: 50000, paidOn: "2026-06-10" }),
      paid({ id: "b", brandName: "GlowCo", amountCents: 50000, paidOn: "2026-10-10" }),
    ],
    NOW
  ),
  {
    topBrandName: "GlowCo",
    topSharePct: 100,
    topCents: 100000,
    totalCents: 100000,
    paidDealCount: 2,
    payingBrands: 1,
    monthsWithIncome: 2,
  }
);

check(
  "concentration: 72% top share is read exactly",
  incomeConcentration(
    [
      paid({ id: "a", brandName: "GlowCo", amountCents: 72000, paidOn: "2026-09-05" }),
      paid({ id: "b", brandName: "OtherCo", amountCents: 28000, paidOn: "2026-09-20" }),
    ],
    NOW
  )?.topSharePct,
  72
);

check(
  "concentration: 59% top share is read exactly",
  incomeConcentration(
    [
      paid({ id: "a", brandName: "GlowCo", amountCents: 59000, paidOn: "2026-09-05" }),
      paid({ id: "b", brandName: "OtherCo", amountCents: 41000, paidOn: "2026-09-20" }),
    ],
    NOW
  )?.topSharePct,
  59
);

check(
  "concentration: distinct paying brands and months with income are counted",
  incomeConcentration(
    [
      paid({ id: "a", brandName: "A", amountCents: 10000, paidOn: "2026-06-05" }),
      paid({ id: "b", brandName: "B", amountCents: 10000, paidOn: "2026-09-05" }),
      paid({ id: "c", brandName: "C", amountCents: 10000, paidOn: "2026-11-05" }),
    ],
    NOW
  ),
  {
    topBrandName: "A",
    topSharePct: 33,
    topCents: 10000,
    totalCents: 30000,
    paidDealCount: 3,
    payingBrands: 3,
    monthsWithIncome: 3,
  }
);

check(
  "concentration: no paid deals -> null (no pattern to read)",
  incomeConcentration([deal({ stage: "pitched" })], NOW),
  null
);

check(
  "concentration: a paid deal outside the 6-month window does not count",
  incomeConcentration(
    [paid({ id: "old", brandName: "OldCo", amountCents: 90000, paidOn: "2026-04-10" })],
    NOW
  ),
  null
);

check(
  "concentration: unpaid stages with a paid date filled in never count",
  incomeConcentration(
    [deal({ id: "x", stage: "invoiced", amountCents: 90000, paidOn: "2026-10-01" })],
    NOW
  ),
  null
);

/* ---------------- neglected opportunities ---------------- */

const neglectedBrands: GalaxyBrand[] = [
  brand({ id: "n1", name: "Neglected One", saved: true, cap: "capped", rate: 50 }),
  brand({ id: "n2", name: "Neglected Two", saved: true, cap: "uncapped", rate: 20 }),
  brand({ id: "n3", name: "Neglected Three", saved: true, cap: "unknown", rate: 40 }),
  brand({ id: "p1", name: "Pitched One", saved: true }),
  brand({ id: "l1", name: "Lost One", saved: true }),
  brand({ id: "x1", name: "Closed One", saved: true, accepting: false }),
  brand({ id: "u1", name: "Unsaved One", saved: false }),
];
const neglectedDeals: GalaxyDeal[] = [
  deal({ id: "dp", brandName: "Pitched One", brandId: "p1", stage: "pitched" }),
  deal({ id: "dl", brandName: "Lost One", brandId: null, stage: "lost" }),
];

check(
  "neglected: saved + accepting + never pitched, best first (uncapped, then rate)",
  neglectedOpportunities(neglectedDeals, neglectedBrands).map((b) => b.id),
  ["n2", "n1", "n3"]
);

check(
  "neglected: a brand pitched under a different name case still counts as pitched",
  neglectedOpportunities(
    [deal({ id: "dc", brandName: "neglected one", stage: "negotiating" })],
    neglectedBrands
  ).map((b) => b.id),
  /* "Neglected One" is excluded by the case-insensitive name
   * match; the other saved brands have no deal in THIS call, so
   * they are neglected here (uncapped first, then rate). */
  ["n2", "n3", "p1", "l1"]
);

check(
  "advisor report: neglected list is capped at 3 with the full count kept",
  (() => {
    const many = [1, 2, 3, 4, 5].map((i) =>
      brand({ id: `m${i}`, name: `Saved ${i}`, saved: true, rate: i * 10 })
    );
    const report = computeAdvisor({ deals: [], brands: many, income: [] }, NOW);
    return [report.neglected.length, report.neglectedCount];
  })(),
  [3, 5]
);

/* ---------------- the week ahead (Money Center math, reused) ---------------- */

const steadyDeals: GalaxyDeal[] = [
  paid({ id: "j", brandName: "A", amountCents: 90000, paidOn: "2026-06-15" }),
  paid({ id: "u", brandName: "B", amountCents: 90000, paidOn: "2026-07-15" }),
  paid({ id: "g", brandName: "C", amountCents: 90000, paidOn: "2026-08-15" }),
  paid({ id: "s", brandName: "A", amountCents: 90000, paidOn: "2026-09-15" }),
  paid({ id: "o", brandName: "B", amountCents: 90000, paidOn: "2026-10-15" }),
  paid({ id: "n", brandName: "C", amountCents: 90000, paidOn: "2026-11-15" }),
];

check(
  "week ahead: a light next month shows the real gap and deals to close",
  computeAdvisor({ deals: steadyDeals, brands: [], income: [] }, NOW).weekAhead,
  {
    key: "2026-12",
    label: "December",
    long: "December 2026",
    expectedCents: 0,
    gapCents: 90000,
    covered: false,
    dealsToClose: 1,
  }
);

check(
  "week ahead: the baseline is the 6-month average the Money Center uses",
  computeAdvisor({ deals: steadyDeals, brands: [], income: [] }, NOW).baselineCents,
  90000
);

check(
  "week ahead: contracted money due next month covers the month",
  computeAdvisor(
    {
      deals: [
        ...steadyDeals,
        deal({
          id: "c1",
          brandName: "NextCo",
          stage: "contracted",
          amountCents: 100000,
          invoiceDue: "2026-12-15",
        }),
      ],
      brands: [],
      income: [],
    },
    NOW
  ).weekAhead?.covered,
  true
);

check(
  "week ahead: paid history in a single month is not enough to read",
  computeAdvisor(
    {
      deals: [paid({ id: "only", brandName: "A", amountCents: 50000, paidOn: "2026-11-10" })],
      brands: [],
      income: [],
    },
    NOW
  ).weekAhead,
  null
);

/* ---------------- the two advisor insights ---------------- */

check(
  "insight: concentration fires at 72% with two paid deals",
  computeInsights(
    input({
      deals: [
        paid({ id: "a", brandName: "GlowCo", amountCents: 72000, paidOn: "2026-09-05" }),
        paid({ id: "b", brandName: "OtherCo", amountCents: 28000, paidOn: "2026-09-20" }),
      ],
    })
  ).filter((x) => x.title.includes("of your deal income")),
  [
    {
      kind: "risk",
      priority: 58,
      title: "GlowCo is 72% of your deal income",
      why: "One brand brings in most of your paid deal money — if they pause, the month breaks.",
      cta: "Pitch someone new",
      act: "go",
      to: "/brands",
    },
  ]
);

check(
  "insight: concentration does not fire at 59%",
  computeInsights(
    input({
      deals: [
        paid({ id: "a", brandName: "GlowCo", amountCents: 59000, paidOn: "2026-09-05" }),
        paid({ id: "b", brandName: "OtherCo", amountCents: 41000, paidOn: "2026-09-20" }),
      ],
    })
  ).some((x) => x.title.includes("of your deal income")),
  false
);

check(
  "insight: concentration does not fire on a single paid deal (trivially 100%)",
  computeInsights(
    input({
      deals: [paid({ id: "a", brandName: "GlowCo", amountCents: 72000, paidOn: "2026-09-05" })],
    })
  ).some((x) => x.title.includes("of your deal income")),
  false
);

check(
  "insight: a saved brand outside the niche gets the saved-neglected action",
  computeInsights(
    input({
      brands: [
        brand({ id: "t1", name: "TechGear", category: "Tech", categories: ["Tech"], saved: true, rate: 25, cap: "uncapped" }),
      ],
    })
  ).filter((x) => x.brandId === "t1"),
  [
    {
      kind: "pitch",
      priority: 34,
      brandId: "t1",
      title: "You saved TechGear — pitch them",
      why: "Saved by you, accepting now, 25% commission, uncapped. You have not pitched them yet.",
      cta: "Write pitch",
      act: "pitch",
    },
  ]
);

check(
  "insight: a saved brand the matches already pitch gets ONE action, not two",
  (() => {
    const list = computeInsights(
      input({
        brands: [
          brand({ id: "s1", name: "SavedFit", category: "Beauty", categories: ["Beauty"], saved: true, rate: 30 }),
        ],
      })
    );
    const forBrand = list.filter((x) => x.brandId === "s1");
    return [forBrand.length, forBrand[0]?.title];
  })(),
  [1, "Pitch SavedFit"]
);

check(
  "insight: an unsaved match still gets its ordinary pitch action",
  computeInsights(
    input({
      brands: [brand({ id: "m1", name: "MatchCo", saved: false, rate: 30 })],
    })
  ).filter((x) => x.brandId === "m1").length,
  1
);

/* ---------------- first move ---------------- */

check(
  "first move: the highest-priority insight's title wins",
  firstMoveTitle(
    computeInsights(
      input({
        deals: [
          deal({
            id: "od",
            brandName: "SlowPay",
            stage: "invoiced",
            amountCents: 50000,
            invoiceDue: "2026-11-20",
          }),
        ],
      })
    )
  ),
  "Chase $500 from SlowPay"
);

check("first move: an empty list has no first move", firstMoveTitle([]), null);

if (failures > 0) {
  console.log(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll galaxy-advisor assertions passed");
