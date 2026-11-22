// ============================================================================
// Proposal Builder — acceptance fixtures for the pure composition
// (lib/proposals/compose.ts).
//
// Fixed proposal records assert the EXACT expected outputs: totals
// math, money formatting, a full-document snapshot, section omission,
// and determinism.
//
// Run (from the repo root):
//   npx tsx scripts/proposals-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  composeProposal,
  formatMoney,
  proposalTotals,
  type ProposalRecord,
} from "../lib/proposals/compose";

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

// --- (a) Totals math ----------------------------------------------------------

const TOTALS_INPUT = [
  { item: "TikTok video", quantity: 2, priceCents: 50000 },
  { item: "Instagram Story set", quantity: 1, priceCents: 25000 },
  { item: "Bonus live mention", quantity: 1, priceCents: 0 },
  { item: "Whitelisting rights", quantity: 3, priceCents: 3333 },
];

check("(a) line totals multiply quantity × unit price", proposalTotals(TOTALS_INPUT).lineTotalsCents, [100000, 25000, 0, 9999]);
check("(a) grand total is the exact sum of line totals", proposalTotals(TOTALS_INPUT).totalCents, 134999);
check("(a) zero-price line contributes zero", proposalTotals([{ item: "Free sample post", quantity: 5, priceCents: 0 }]), { lineTotalsCents: [0], totalCents: 0 });
check("(a) no deliverables → no lines, zero total", proposalTotals([]), { lineTotalsCents: [], totalCents: 0 });

// --- (b) Money formatting -----------------------------------------------------

check("(b) five cents", formatMoney(5), "$0.05");
check("(b) thousands separator", formatMoney(125000), "$1,250.00");
check("(b) millions", formatMoney(100000000), "$1,000,000.00");
check("(b) zero", formatMoney(0), "$0.00");
check("(b) exact dollar", formatMoney(700), "$7.00");

// --- (c) Full-document snapshot ----------------------------------------------

const FULL: ProposalRecord = {
  brandName: "Nomatic",
  title: "Holiday Gift Guide Partnership",
  creatorName: "Alex Rivers",
  deliverables: [
    { item: "TikTok video", quantity: 2, priceCents: 50000 },
    { item: "Instagram Story set", quantity: 1, priceCents: 25000 },
    { item: "Bonus live mention", quantity: 1, priceCents: 0 },
  ],
  audienceSummary:
    "120k followers across TikTok and Instagram, mostly US women 25–34 who buy travel gear.",
  campaignIdeas: ["Gift guide carousel", "Pack-with-me travel series"],
  proofPoints: [
    {
      title: "Engagement rate",
      platform: "TikTok",
      metric: "8.4%",
      timeframe: "Last 90 days",
    },
    {
      title: "Nomatic",
      platform: "",
      metric: "Holiday gift guide campaign",
      timeframe: "Nov–Dec 2025",
    },
  ],
  notes: "Open to a 30-day exclusivity window in the travel category.",
};

const EXPECTED_FULL = [
  "Holiday Gift Guide Partnership",
  "Prepared for Nomatic",
  "Prepared by Alex Rivers",
  "",
  "ABOUT MY AUDIENCE",
  "120k followers across TikTok and Instagram, mostly US women 25–34 who buy travel gear.",
  "",
  "WHAT I PROPOSE",
  "- TikTok video — 2 × $500.00 = $1,000.00",
  "- Instagram Story set — 1 × $250.00 = $250.00",
  "- Bonus live mention — 1 × $0.00 = $0.00",
  "",
  "INVESTMENT",
  "Total: $1,250.00",
  "",
  "CAMPAIGN IDEAS",
  "- Gift guide carousel",
  "- Pack-with-me travel series",
  "",
  "PROOF POINTS",
  "- Engagement rate — 8.4% (TikTok, Last 90 days)",
  "- Nomatic — Holiday gift guide campaign (Nov–Dec 2025)",
  "",
  "NOTES",
  "Open to a 30-day exclusivity window in the travel category.",
].join("\n");

check("(c) complete proposal composes to the exact document", composeProposal(FULL), EXPECTED_FULL);

// --- (d) Section omission -----------------------------------------------------

const EMPTY: ProposalRecord = {
  brandName: "Nomatic",
  title: "Partnership Proposal",
  deliverables: [],
  audienceSummary: "",
  campaignIdeas: [],
  proofPoints: [],
  notes: "",
};

check(
  "(d) empty proposal is the headline only",
  composeProposal(EMPTY),
  "Partnership Proposal\nPrepared for Nomatic"
);

const NOTES_ONLY: ProposalRecord = {
  ...EMPTY,
  notes: "Rates are firm for Q1.",
};

check(
  "(d) notes-only proposal has no other section headings",
  composeProposal(NOTES_ONLY),
  "Partnership Proposal\nPrepared for Nomatic\n\nNOTES\nRates are firm for Q1."
);

const NO_IDEAS = composeProposal({ ...FULL, campaignIdeas: [] });
check("(d) no CAMPAIGN IDEAS heading when the list is empty", noIdeasHasHeading(NO_IDEAS), false);
check("(d) blank-string ideas do not resurrect the section", composeProposal({ ...FULL, campaignIdeas: ["", "   "] }).includes("CAMPAIGN IDEAS"), false);
check("(d) no PROOF POINTS heading when none selected", composeProposal({ ...FULL, proofPoints: [] }).includes("PROOF POINTS"), false);
check("(d) no INVESTMENT heading without deliverables", composeProposal({ ...FULL, deliverables: [] }).includes("INVESTMENT"), false);
check("(d) no Prepared-by line without a creator name", composeProposal({ ...FULL, creatorName: undefined }).includes("Prepared by"), false);

function noIdeasHasHeading(doc: string): boolean {
  return doc.includes("CAMPAIGN IDEAS");
}

// --- (e) Determinism ----------------------------------------------------------

check("(e) same input composes identically twice", composeProposal(FULL) === composeProposal(FULL), true);
check("(e) totals are identical across calls", proposalTotals(TOTALS_INPUT), proposalTotals(TOTALS_INPUT));

console.log(failures === 0 ? "\nALL ASSERTIONS PASSED" : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
