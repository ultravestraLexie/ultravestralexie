// ============================================================================
// Galaxy live deal sync — acceptance fixtures for the pure merge /
// prune logic in lib/galaxy/core.ts (mergeDealUpdates /
// pruneDealUpdates), added 2026-11-23 for the board-refresh defect.
//
// The defect: the Deals board renders purely from server props, and
// the only post-write update channel was router.refresh() — a
// fire-and-forget RSC refetch whose payload can reflect a read that
// predates the latest committed write when advances happen in rapid
// succession. The deals API already returns the committed row in
// every write response; hosts now apply that row locally (via
// useDealSync) using these functions. These fixtures pin the rules:
//
//   - an applied write beats a stale server row, immediately;
//   - a write for a deal the server list lacks yet (just created)
//     appears, appended where created_at order will put it;
//   - server order is otherwise preserved;
//   - once the server rows catch up (same fingerprint, or a
//     strictly later updated_at from a newer write elsewhere), the
//     applied write is pruned and server truth owns the row again;
//   - a raced, older server snapshot never prunes a live write.
//
// Run (from the repo root):
//   npx tsx scripts/galaxy-deal-sync-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  mergeDealUpdates,
  pruneDealUpdates,
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

const deal = (over: Partial<GalaxyDeal>): GalaxyDeal => ({
  id: "d1",
  brandName: "Brand",
  brandId: null,
  platform: null,
  stage: "negotiating",
  amountCents: 50000,
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

/* --- merge ------------------------------------------------------------ */

const server = [deal({ id: "d1" }), deal({ id: "d2", brandName: "Two" })];

check(
  "merge with no applied writes returns the server rows untouched",
  mergeDealUpdates(server, {}) === server,
  true
);

check(
  "an applied write replaces its stale server row in place",
  mergeDealUpdates(server, { d1: deal({ id: "d1", stage: "contracted" }) }).map(
    (d) => `${d.id}:${d.stage}`
  ),
  ["d1:contracted", "d2:negotiating"]
);

check(
  "a write for a deal the server list lacks yet appends it at the end",
  mergeDealUpdates(server, {
    d3: deal({ id: "d3", brandName: "Three", stage: "pitched" }),
  }).map((d) => d.id),
  ["d1", "d2", "d3"]
);

check(
  "rapid consecutive advances: the latest applied write is what renders",
  mergeDealUpdates([deal({ id: "d1", stage: "negotiating" })], {
    d1: deal({
      id: "d1",
      stage: "paid",
      receivedCents: 50000,
      paidOn: "2026-11-23",
      lastContact: "2026-11-23",
    }),
  }).map((d) => `${d.stage}:${d.paidOn}`),
  ["paid:2026-11-23"]
);

/* --- prune ------------------------------------------------------------ */

const write = deal({ id: "d1", stage: "contracted", lastContact: "2026-11-23" });

check(
  "prune drops a write once the server row matches it exactly",
  pruneDealUpdates([write], { d1: write }),
  {}
);

check(
  "prune keeps a write when the server row is a stale pre-write snapshot",
  Object.keys(
    pruneDealUpdates(
      [deal({ id: "d1", stage: "negotiating", lastContact: "2026-11-22" })],
      { d1: write }
    )
  ),
  ["d1"]
);

check(
  "prune drops a write when the server row carries a strictly later updated_at",
  pruneDealUpdates(
    [deal({ id: "d1", stage: "delivering", lastContact: "2026-11-24" })],
    { d1: write }
  ),
  {}
);

check(
  "prune keeps a write whose deal is not in the server list yet",
  Object.keys(pruneDealUpdates(server, { d9: deal({ id: "d9" }) })),
  ["d9"]
);

check(
  "prune returns the same reference when nothing was pruned",
  (() => {
    const updates = { d1: write };
    return pruneDealUpdates(server, updates) === updates;
  })(),
  true
);

console.log(
  failures === 0
    ? "\nALL GALAXY DEAL SYNC FIXTURES PASS"
    : `\n${failures} FAILURES`
);
process.exit(failures === 0 ? 0 : 1);
