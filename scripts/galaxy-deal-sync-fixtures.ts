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
// Round 2 (battAH, 2026-11-23): the strict first-look bar failed
// once — the invoice step rendered in its old column at first look
// after the sheet closed, then self-corrected seconds later. The
// invoice path applies its returned row through the same run() as
// every other advance, and no server payload can outvote an
// applied write that is present in the overlay — so the stale
// render meant the overlay itself was gone: round 1 kept it in
// the host component's useState, and a remount/state reset while
// a raced refresh payload applied wiped it. Round 2 pins:
//   - prune compares FULL updated_at timestamps, never the
//     calendar date: a same-day raced snapshot (equal lastContact,
//     earlier time) keeps the write; an EQUAL timestamp from a
//     different write never prunes; only a fingerprint match or a
//     strictly later timestamp may prune;
//   - applied writes live in a module-level DealWriteStore that
//     outlives any host: a "remounted" host (a fresh merge
//     derivation over the same store) shows the write at first
//     render, before any prune or refresh runs.
//
// Run (from the repo root):
//   npx tsx scripts/galaxy-deal-sync-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  createDealWriteStore,
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
  updatedAt: "2026-11-22T12:00:00.000+00:00",
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

const write = deal({
  id: "d1",
  stage: "contracted",
  lastContact: "2026-11-23",
  updatedAt: "2026-11-23T12:00:00.000+00:00",
});

check(
  "prune drops a write once the server row matches it exactly",
  pruneDealUpdates([write], { d1: write }),
  {}
);

check(
  "prune keeps a write when the server row is a stale pre-write snapshot",
  Object.keys(
    pruneDealUpdates(
      [
        deal({
          id: "d1",
          stage: "negotiating",
          lastContact: "2026-11-22",
          updatedAt: "2026-11-22T12:00:00.000+00:00",
        }),
      ],
      { d1: write }
    )
  ),
  ["d1"]
);

check(
  "prune drops a write when the server row carries a strictly later updated_at",
  pruneDealUpdates(
    [
      deal({
        id: "d1",
        stage: "delivering",
        lastContact: "2026-11-24",
        updatedAt: "2026-11-24T12:00:00.000+00:00",
      }),
    ],
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

/* --- prune: round-2 time basis -----------------------------------------
 * The battAH invoice write and the step-1 write it followed share
 * a calendar date, so any date-granularity comparison is blind to
 * their order. Prune must reason from the full timestamp plus the
 * fingerprint — never from the date, and never from time alone. */

const invoiceWrite = deal({
  id: "d1",
  stage: "invoiced",
  amountCents: 30000,
  invoiceSentOn: "2026-11-23",
  invoiceDue: "2026-12-07",
  lastContact: "2026-11-23",
  updatedAt: "2026-11-23T22:02:31.000+00:00",
});

/* The step-1 server snapshot: same calendar date as the invoice
 * write (lastContact equal), earlier time, pre-write stage. */
const step1Snapshot = [
  deal({
    id: "d1",
    stage: "delivering",
    lastContact: "2026-11-23",
    updatedAt: "2026-11-23T22:00:41.000+00:00",
  }),
];

check(
  "prune keeps the invoice write against a same-day raced snapshot (battAH shape)",
  Object.keys(pruneDealUpdates(step1Snapshot, { d1: invoiceWrite })),
  ["d1"]
);

check(
  "an equal updated_at from a different write never prunes (time alone proves nothing)",
  Object.keys(
    pruneDealUpdates(
      [
        deal({
          id: "d1",
          stage: "delivering",
          lastContact: "2026-11-23",
          updatedAt: "2026-11-23T22:02:31.000+00:00",
        }),
      ],
      { d1: invoiceWrite }
    )
  ),
  ["d1"]
);

check(
  "prune drops a write when the server row carries it, timestamp format aside",
  pruneDealUpdates(
    [{ ...invoiceWrite, updatedAt: "2026-11-23T22:02:31.000Z" }],
    { d1: invoiceWrite }
  ),
  {}
);

check(
  "a write with no timestamp is never pruned by time, only by fingerprint",
  Object.keys(
    pruneDealUpdates(
      [
        deal({
          id: "d1",
          stage: "delivering",
          lastContact: "2026-11-24",
          updatedAt: "2026-11-24T12:00:00.000+00:00",
        }),
      ],
      { d1: deal({ id: "d1", stage: "contracted", updatedAt: undefined }) }
    )
  ),
  ["d1"]
);

/* --- the write store: remount survival ----------------------------------
 * A host remount is simulated the way it actually presents: the
 * component's local state is gone, and the board is re-derived
 * from (server props, store snapshot) in a fresh merge. The store
 * is the only thing that carries the write across. */

const store = createDealWriteStore();
store.apply(invoiceWrite);

check(
  "remount: a fresh host derivation over the store shows the write at first render",
  mergeDealUpdates(step1Snapshot, store.snapshot()).map(
    (d) => `${d.id}:${d.stage}`
  ),
  ["d1:invoiced"]
);

store.prune(step1Snapshot);

check(
  "remount: the raced payload's prune cannot remove the write from the store",
  mergeDealUpdates(step1Snapshot, store.snapshot()).map((d) => d.stage),
  ["invoiced"]
);

const caughtUp = [{ ...invoiceWrite }];
store.prune(caughtUp);

check(
  "once the server rows carry the write, the store hands the row back to server truth",
  store.snapshot(),
  {}
);

check(
  "after catch-up the board renders the server row itself",
  mergeDealUpdates(caughtUp, store.snapshot()).map((d) => d.stage),
  ["invoiced"]
);

/* The full battAH sequence at the pure level: step 1's write is
 * applied and pruned when its refresh lands; step 2's write is
 * applied; step 1's SECOND refresh (rendered pre-write, delivered
 * late) must not move the deal back; step 2's refresh settles it. */
const seq = createDealWriteStore();
const w1 = deal({
  id: "d1",
  stage: "delivering",
  lastContact: "2026-11-23",
  updatedAt: "2026-11-23T22:00:41.000+00:00",
});
const s1 = [{ ...w1 }];
seq.apply(w1);
seq.prune(s1);
seq.apply(invoiceWrite);
seq.prune(s1);

check(
  "battAH sequence: the late step-1 payload never moves an invoiced deal back",
  mergeDealUpdates(s1, seq.snapshot()).map((d) => d.stage),
  ["invoiced"]
);

seq.prune(caughtUp);

check(
  "battAH sequence: the store is empty once the server carries both writes",
  seq.snapshot(),
  {}
);

/* Subscribers hear about real changes only — a no-op prune stays
 * silent and the snapshot reference is stable, so subscribed
 * hosts do not re-render on every refresh landing. */
check(
  "store notifies on apply and on a pruning change, not on a no-op prune",
  (() => {
    const s = createDealWriteStore();
    let heard = 0;
    const off = s.subscribe(() => {
      heard += 1;
    });
    const before = s.snapshot();
    s.prune(step1Snapshot);
    const silentAndStable = heard === 0 && s.snapshot() === before;
    s.apply(invoiceWrite);
    const afterApply = heard;
    s.prune(caughtUp);
    off();
    return [silentAndStable, afterApply, heard];
  })(),
  [true, 1, 2]
);

console.log(
  failures === 0
    ? "\nALL GALAXY DEAL SYNC FIXTURES PASS"
    : `\n${failures} FAILURES`
);
process.exit(failures === 0 ? 0 : 1);
