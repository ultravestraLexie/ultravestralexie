// ============================================================================
// UltraVestra Command Center — acceptance fixtures for the pure card
// shaping (lib/command-center/aggregate.ts).
//
// Fixed inputs assert the EXACT expected card array: every string
// verbatim, the honest empty state, revenue strings tied to
// lib/revenue/summary.ts's own math, the fixed card order, and
// determinism.
//
// Run (from the repo root):
//   npx tsx scripts/command-center-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  buildCards,
  type CommandCenterCard,
  type CommandCenterInput,
} from "../lib/command-center/aggregate";
import { computeSummary } from "../lib/revenue/summary";
import { formatMoney } from "../lib/proposals/compose";

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

// --- (a) Fully populated input → the exact card array -------------------------

const POPULATED: CommandCenterInput = {
  revenueEntries: [
    { brand_name: "Nomatic", amount_cents: 125050, status: "pending", earned_date: "2026-11-10" },
    { brand_name: "Nomatic", amount_cents: 50000, status: "paid", earned_date: "2026-11-02" },
    // Out-of-window (years before the summary's 6-month trend): it
    // still counts in the totals — that is the summary's contract.
    { brand_name: "Old Brand", amount_cents: 9999, status: "paid", earned_date: "2020-01-15" },
  ],
  alertTotalMatched: 7,
  alertWatermark: "2026-11-20T14:30:50.892+00:00",
  growthItems: [
    { kind: "objective", status: "active" },
    { kind: "objective", status: "active" },
    { kind: "objective", status: "achieved" },
    { kind: "experiment", status: "running" },
    { kind: "experiment", status: "planned" },
    { kind: "experiment", status: "done" },
    { kind: "experiment", status: "done" },
    { kind: "gap", status: "open" },
  ],
  proposals: [
    { status: "sent" },
    { status: "sent" },
    { status: "draft" },
    { status: "accepted" },
  ],
  passportCount: 5,
  briefsCount: 3,
  directoryBrandCount: 2348,
};

const EXPECTED_POPULATED: CommandCenterCard[] = [
  { key: "revenue", title: "Revenue Tracker", href: "/revenue", primary: "$1,250.50", secondary: "received $599.99" },
  { key: "alerts", title: "Opportunity Alerts", href: "/alerts", primary: "7 new", secondary: "since November 20, 2026" },
  { key: "growth", title: "Creator Growth Map", href: "/growth-map", primary: "2 active objectives", secondary: "1 experiments running · 2 completed" },
  { key: "proposals", title: "Proposal Builder", href: "/proposals", primary: "2 sent", secondary: "1 draft · 1 accepted · 0 declined" },
  { key: "passport", title: "Reputation Passport", href: "/me#passport", primary: "5 entries", secondary: "your proof library" },
  { key: "matches", title: "Campaign Match", href: "/campaign-match", primary: "3 briefs", secondary: "partnership briefs generated" },
  { key: "lab", title: "Creator Lab", href: "/creator-lab", primary: "Diagnose a video", secondary: "the Lab keeps no history — every run is fresh" },
  { key: "directory", title: "Brand Directory", href: "/brands", primary: "2348 brands", secondary: "in the directory" },
];

check("(a) populated input produces the exact card array", buildCards(POPULATED), EXPECTED_POPULATED);

// --- (b) All-empty input → true zeros and the honest Lab card -----------------

const EMPTY: CommandCenterInput = {
  revenueEntries: [],
  alertTotalMatched: 0,
  alertWatermark: null,
  growthItems: [],
  proposals: [],
  passportCount: 0,
  briefsCount: 0,
  directoryBrandCount: 0,
};

const EXPECTED_EMPTY: CommandCenterCard[] = [
  { key: "revenue", title: "Revenue Tracker", href: "/revenue", primary: "$0.00", secondary: "received $0.00" },
  { key: "alerts", title: "Opportunity Alerts", href: "/alerts", primary: "0 new", secondary: "not set up yet" },
  { key: "growth", title: "Creator Growth Map", href: "/growth-map", primary: "0 active objectives", secondary: "0 experiments running · 0 completed" },
  { key: "proposals", title: "Proposal Builder", href: "/proposals", primary: "0 sent", secondary: "0 draft · 0 accepted · 0 declined" },
  { key: "passport", title: "Reputation Passport", href: "/me#passport", primary: "0 entries", secondary: "your proof library" },
  { key: "matches", title: "Campaign Match", href: "/campaign-match", primary: "0 briefs", secondary: "partnership briefs generated" },
  { key: "lab", title: "Creator Lab", href: "/creator-lab", primary: "Diagnose a video", secondary: "the Lab keeps no history — every run is fresh" },
  { key: "directory", title: "Brand Directory", href: "/brands", primary: "0 brands", secondary: "in the directory" },
];

check("(b) empty input produces true zeros", buildCards(EMPTY), EXPECTED_EMPTY);

const labCard = buildCards(EMPTY).find((c) => c.key === "lab");
check("(b) Lab card primary carries no number", /\d/.test(labCard?.primary ?? ""), false);
check("(b) Lab card secondary carries no number", /\d/.test(labCard?.secondary ?? ""), false);

// A watermark with zero matches is still "set up": the date shows.
const idleAlerts = buildCards({ ...EMPTY, alertWatermark: "2026-11-22T08:14:00.000Z" }).find(
  (c) => c.key === "alerts"
);
check("(b) set-up alerts with zero new show the watermark date", idleAlerts, {
  key: "alerts",
  title: "Opportunity Alerts",
  href: "/alerts",
  primary: "0 new",
  secondary: "since November 22, 2026",
});

// --- (c) Revenue strings are the summary's own math ---------------------------

const summary = computeSummary(POPULATED.revenueEntries);
check("(c) summary pending on the fixture set", summary.pendingCents, 125050);
check("(c) summary received includes the out-of-window entry", summary.receivedCents, 59999);

const revenueCard = buildCards(POPULATED).find((c) => c.key === "revenue");
check("(c) card primary is the summary's pending, formatted", revenueCard?.primary, formatMoney(summary.pendingCents));
check("(c) card secondary is the summary's received, formatted", revenueCard?.secondary, `received ${formatMoney(summary.receivedCents)}`);

// --- (d) Fixed card order -----------------------------------------------------

check(
  "(d) card order is the fixed order",
  buildCards(POPULATED).map((c) => c.key),
  ["revenue", "alerts", "growth", "proposals", "passport", "matches", "lab", "directory"]
);
check(
  "(d) card order holds for the empty input too",
  buildCards(EMPTY).map((c) => c.key),
  ["revenue", "alerts", "growth", "proposals", "passport", "matches", "lab", "directory"]
);

// --- (e) Determinism ----------------------------------------------------------

check("(e) same populated input shapes identically twice", buildCards(POPULATED), buildCards(POPULATED));
check("(e) same empty input shapes identically twice", buildCards(EMPTY), buildCards(EMPTY));

console.log(failures === 0 ? "\nALL ASSERTIONS PASSED" : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
