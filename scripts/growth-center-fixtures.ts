// ============================================================================
// Creator Growth Center — acceptance fixtures for the overview
// shaping (lib/growth-center/aggregate.ts).
//
// Asserts: account passthrough (identity is the caller's own rows,
// never derived), month-over-month math incl. the no-baseline
// case, connection defaults and status labels, the not-connected
// social state, estimates carried separately, and the seven
// sections in the owner's order with truthful states.
//
// Run (from the repo root):
//   npx tsx scripts/growth-center-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  buildOverview,
  type GrowthCenterInput,
} from "../lib/growth-center/aggregate";

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

const NOW = new Date(Date.UTC(2026, 10, 22, 12, 0, 0));

const INPUT: GrowthCenterInput = {
  account: {
    name: "Test Creator",
    email: "creator@example.com",
    username: "testcreator",
    memberStatus: "active",
    planName: "Pro",
  },
  revenueEntries: [
    { brand_name: "Nomatic", amount_cents: 150000, status: "paid", earned_date: "2026-11-05", kind: "campaign_fee" },
    { brand_name: "Nomatic", amount_cents: 50000, status: "pending", earned_date: "2026-11-10", kind: "affiliate_commission" },
    { brand_name: "Old", amount_cents: 100000, status: "paid", earned_date: "2026-10-10", kind: "brand_payment" },
  ],
  estimates: [
    { platform: "TikTok", amount_cents: 12345, period_month: "2026-11-01", basis: "creator_entered" },
  ],
  posts: [
    { platform: "tiktok", posted_date: "2026-11-22", source: "manual" },
    { platform: "instagram", posted_date: "2026-11-21", source: "manual" },
  ],
  weeklyGoal: 5,
  connections: [
    { platform: "tiktok", handle: "@testcreator", status: "link_only" },
  ],
};

const overview = buildOverview(INPUT, NOW);

// --- Account: passthrough, never derived -----------------------------------------

check("(a) account passes through exactly", overview.account, INPUT.account);

// --- Earnings ----------------------------------------------------------------------

check("(b) lifetime", overview.earnings.lifetimeCents, 300000);
check("(b) this month", overview.earnings.thisMonthCents, 200000);
check("(b) last month", overview.earnings.lastMonthCents, 100000);
check("(b) change pct is +100.0", overview.earnings.changePct, 100);
check("(b) pending / received", [overview.earnings.pendingCents, overview.earnings.receivedCents], [50000, 250000]);

// No baseline (last month zero) → change is null, never a fake percentage.
const noBaseline = buildOverview({ ...INPUT, revenueEntries: INPUT.revenueEntries.slice(0, 2) }, NOW);
check("(b) change pct is null with no last-month baseline", noBaseline.earnings.changePct, null);

// A decline renders as a negative number.
const decline = buildOverview(
  {
    ...INPUT,
    revenueEntries: [
      { brand_name: "A", amount_cents: 50000, status: "paid", earned_date: "2026-11-05" },
      { brand_name: "A", amount_cents: 100000, status: "paid", earned_date: "2026-10-05" },
    ],
  },
  NOW
);
check("(b) decline is -50", decline.earnings.changePct, -50);

// --- Estimates ride separately --------------------------------------------------------

check(
  "(c) estimates are their own figure",
  overview.estimates,
  { totalEstimatedCents: 12345, creatorEnteredCents: 12345, platformReportedCents: 0 }
);
check(
  "(c) lifetime recorded excludes the estimate",
  overview.earnings.lifetimeCents,
  300000
);

// --- Posting ---------------------------------------------------------------------------

check("(d) posting streak", overview.posting.currentStreak, 2);
check("(d) posting this month", overview.posting.postsThisMonth, 2);

// --- Connections -------------------------------------------------------------------------

check(
  "(e) all four platforms present in order",
  overview.connections.map((c) => c.platform),
  ["tiktok", "instagram", "facebook", "trybe"]
);
check(
  "(e) saved link shows its true label",
  overview.connections[0],
  { platform: "tiktok", label: "TikTok", status: "link_only", statusLabel: "Link added — not a data connection", handle: "@testcreator" }
);
check(
  "(e) missing row defaults to not_connected",
  overview.connections[3],
  { platform: "trybe", label: "Trybe", status: "not_connected", statusLabel: "Not linked", handle: null }
);

// --- Social metrics: state, not numbers ----------------------------------------------------

check("(f) social metrics state is not_connected", overview.socialMetrics.state, "not_connected");
check("(f) social metrics carries no numeric fields", Object.keys(overview.socialMetrics).sort(), ["note", "state"]);

// --- The seven sections, in the owner's order, with truthful states ---------------------------

check(
  "(g) seven sections in order",
  overview.sections.map((s) => s.title),
  ["Overview", "Analytics & Intelligence", "Content Studio", "Earnings & Business", "Goals & Growth", "Creator Rankings", "AI Creator Advisor"]
);
check(
  "(g) section states",
  overview.sections.map((s) => s.state),
  ["live", "partial", "live", "live", "live", "later_phase", "later_phase"]
);
check(
  "(g) rankings section has NO links (nothing real to link to)",
  overview.sections.find((s) => s.id === "rankings")?.links,
  []
);
check(
  "(g) advisor links to the Creator Lab as today's tool",
  overview.sections.find((s) => s.id === "advisor")?.links,
  [{ label: "Creator Lab", href: "/creator-lab" }]
);
check(
  "(g) goals section contains Growth Map + Posting Tracker",
  overview.sections.find((s) => s.id === "goals")?.links,
  [
    { label: "Growth Map", href: "/growth-map" },
    { label: "Posting Tracker", href: "/growth-center/posting" },
  ]
);

// --- Empty input: true zeros, honest states ------------------------------------------------------

const empty = buildOverview(
  {
    account: { name: null, email: "new@example.com", username: null, memberStatus: "active", planName: null },
    revenueEntries: [],
    estimates: [],
    posts: [],
    weeklyGoal: 5,
    connections: [],
  },
  NOW
);
check("(h) empty earnings are zero", [empty.earnings.lifetimeCents, empty.earnings.thisMonthCents, empty.earnings.changePct], [0, 0, null]);
check("(h) empty username stays null (never invented)", empty.account.username, null);
check("(h) empty connections all not linked", empty.connections.every((c) => c.status === "not_connected"), true);

console.log(failures === 0 ? "\nALL ASSERTIONS PASSED" : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
