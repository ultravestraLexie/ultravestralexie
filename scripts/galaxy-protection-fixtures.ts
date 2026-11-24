// ============================================================================
// Galaxy Brand Deal Protection — acceptance fixtures for the pure
// protection logic added to lib/galaxy/core.ts for System #2
// (Brand Deal Protection, 2026-11-23): protectionGaps across the
// pipeline stages and the single Today protection insight.
//
// The owner's rules, asserted exactly: a missing record counts as
// nothing checked; pitched deals compute gaps (the board stays
// quiet — display is a UI rule, the math is the same); negotiating
// / contracted / delivering / invoiced deals warn; paid and lost
// deals NEVER warn; a complete record has zero gaps. Today surfaces
// at most ONE protection insight — the most urgent contracted /
// delivering deal with usage rights unrecorded.
//
// Run (from the repo root):
//   npx tsx scripts/galaxy-protection-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  computeInsights,
  emptyProtection,
  protectionGaps,
  type DealProtection,
  type GalaxyDeal,
  type GalaxyProfile,
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
  pitchedOn: "2026-11-20",
  lastContact: "2026-11-22",
  dueOn: null,
  invoiceSentOn: null,
  invoiceDue: null,
  paidOn: null,
  ...over,
});

const prot = (over: Partial<DealProtection>): DealProtection => ({
  ...emptyProtection("d"),
  ...over,
});

const COMPLETE = prot({
  contractReviewed: true,
  deliverablesAgreed: true,
  paymentTermsAgreed: true,
  usageRightsSet: true,
  exclusivityChecked: true,
  killFee: true,
  revisionCap: true,
});

const ALL_GAP_IDS = ["contract", "usage", "exclusivity", "deliverables", "payment", "killfee", "revisioncap"];
const gapIds = (d: GalaxyDeal, p?: DealProtection | null) =>
  protectionGaps(d, p).map((g) => g.id);

// --- protectionGaps across stages -------------------------------------------

check(
  "pitched + no record: all seven gaps compute (sheet-only display is a UI rule)",
  gapIds(deal({ stage: "pitched" }), null),
  ALL_GAP_IDS
);
check(
  "negotiating + empty record: all seven gaps warn",
  gapIds(deal({ stage: "negotiating" }), prot({})),
  ALL_GAP_IDS
);
check(
  "contracted + nothing checked: all seven gaps warn",
  gapIds(deal({ stage: "contracted" }), undefined),
  ALL_GAP_IDS
);
check(
  "delivering + contract/deliverables done: usage, exclusivity, payment, kill fee, revision cap remain",
  gapIds(
    deal({ stage: "delivering" }),
    prot({ contractReviewed: true, deliverablesAgreed: true })
  ),
  ["usage", "exclusivity", "payment", "killfee", "revisioncap"]
);
check(
  "invoiced + only usage recorded: six gaps remain",
  gapIds(deal({ stage: "invoiced" }), prot({ usageRightsSet: true })),
  ["contract", "exclusivity", "deliverables", "payment", "killfee", "revisioncap"]
);
check(
  "contracted + complete record: zero gaps",
  gapIds(deal({ stage: "contracted" }), COMPLETE),
  []
);
check(
  "paid + no record: never warns",
  gapIds(deal({ stage: "paid" }), null),
  []
);
check(
  "paid + empty record: never warns",
  gapIds(deal({ stage: "paid" }), prot({})),
  []
);
check(
  "lost + no record: never warns",
  gapIds(deal({ stage: "lost" }), null),
  []
);
check(
  "gap texts are the owner's exact warnings",
  protectionGaps(deal({ stage: "negotiating" }), null).map((g) => g.text),
  [
    "Contract not marked reviewed",
    "Usage rights not recorded",
    "Exclusivity not checked",
    "Deliverables not confirmed in writing",
    "Payment terms not confirmed",
    "Kill fee not agreed",
    "Revision cap not agreed",
  ]
);

// --- Today insight ------------------------------------------------------------

const profile: GalaxyProfile = {
  name: "Test Creator",
  niche: "",
  categories: [],
  platforms: [],
  audience: "",
  weeklyGoal: 5,
};

const baseInput = {
  brands: [],
  profile,
  postsThisWeek: 5, // goal met — no rhythm insight
  scriptCount: 1, // has scripts — no studio insight
  now: NOW,
};

const lockInsights = (deals: GalaxyDeal[], protectionByDeal: Record<string, DealProtection>) =>
  computeInsights({ ...baseInput, deals, protectionByDeal }).filter((i) =>
    i.title.startsWith("Lock the usage rights")
  );

// Two unprotected contracted/delivering deals: the one due sooner wins.
const sooner = deal({
  id: "soon",
  brandName: "Sooner Co",
  stage: "delivering",
  amountCents: 10000,
  dueOn: "2026-11-25",
});
const later = deal({
  id: "late",
  brandName: "Later Co",
  stage: "contracted",
  amountCents: 90000,
  dueOn: "2026-12-10",
});
const two = lockInsights([later, sooner], {});
check("two unprotected deals: exactly one protection insight", two.length, 1);
check(
  "the insight targets the soonest-due deal, at priority 65, opening the deal",
  two.map((i) => [i.title, i.priority, i.act, i.dealId, i.kind]),
  [["Lock the usage rights with Sooner Co", 65, "open-deal", "soon", "risk"]]
);

// Usage recorded on the soonest → the other deal surfaces instead.
const twoB = lockInsights([later, sooner], {
  soon: prot({ dealId: "soon", usageRightsSet: true }),
});
check(
  "usage recorded on the soonest: the later deal surfaces",
  twoB.map((i) => i.dealId),
  ["late"]
);

// Usage recorded on both → no protection insight at all.
check(
  "usage recorded on every contracted/delivering deal: no insight",
  lockInsights([later, sooner], {
    soon: prot({ dealId: "soon", usageRightsSet: true }),
    late: prot({ dealId: "late", usageRightsSet: true }),
  }).length,
  0
);

// Pitched and negotiating deals never trigger the Today insight.
check(
  "pitched + negotiating deals without usage: no Today insight",
  lockInsights(
    [
      deal({ id: "p1", brandName: "Pitch Co", stage: "pitched" }),
      deal({ id: "n1", brandName: "Talk Co", stage: "negotiating" }),
    ],
    {}
  ).length,
  0
);

// Undated deals rank after dated ones; larger amount breaks the tie.
const undatedSmall = deal({ id: "u1", brandName: "Small Co", stage: "contracted", amountCents: 10000, dueOn: null });
const undatedBig = deal({ id: "u2", brandName: "Big Co", stage: "contracted", amountCents: 80000, dueOn: null });
check(
  "two undated deals: the larger amount is the most urgent",
  lockInsights([undatedSmall, undatedBig], {}).map((i) => i.dealId),
  ["u2"]
);
check(
  "a dated deal outranks an undated bigger deal",
  lockInsights([undatedBig, sooner], {}).map((i) => i.dealId),
  ["soon"]
);

// No protection data loaded at all → the insight still fires for an
// unprotected contracted deal (missing record = nothing recorded).
check(
  "no protection map passed: contracted deal still surfaces",
  computeInsights({ ...baseInput, deals: [later] })
    .filter((i) => i.title.startsWith("Lock the usage rights"))
    .map((i) => i.dealId),
  ["late"]
);

console.log(
  failures === 0 ? "\nALL GALAXY PROTECTION FIXTURES PASS" : `\n${failures} FAILURES`
);
process.exit(failures === 0 ? 0 : 1);
