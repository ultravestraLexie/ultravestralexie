// ============================================================================
// Galaxy Trust build — acceptance fixtures for the 2026-11-23 owner
// orders: (1) Money trust — moneyLedger's separated buckets and
// reconciliation; (2) Passport — passportTrackRecord, the
// passport_share_history migration, the public page's dual-flag
// gate, the methodology text; (3) the Creator Loop — creatorLoop's
// status model (priority / gap / calm) and progress lines;
// (4) the chosen Passport address — validatePassportSlug's format
// and reserved-word rules, passportSlugTaken's conflict check, and
// the slug-editor wiring.
//
// The hard rules pinned here: an invoice NEVER enters collected;
// kept is collected minus expenses no matter how large projected
// or invoiced grow; pitched/negotiating money sits in NO bucket;
// the reconciliation boolean comes from set math and detects a
// double-counted deal; the loop's Collect figures ARE the
// ledger's figures; a fully healthy account has every loop step
// clear and no next move.
//
// The Creator Loop section pins the V2 severity model (owner's
// reference design, 2026-11-23): critical / action / attention /
// clear with the money-first next-move tie-break, the 3-day
// follow-up line, the pipeline target of 3, Protect's phrases
// over the five real deal_protection items, and Grow's checklist
// of five real fields.
//
// Run (from the repo root):
//   npx tsx scripts/galaxy-trust-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "node:fs";
import {
  AUDIENCE_METHODOLOGY,
  LOOP_ACCENT,
  LOOP_SEVERITY_LABEL,
  LOOP_SEVERITY_TONE,
  RESERVED_PASSPORT_SLUGS,
  creatorLoop,
  emptyProtection,
  fmtMoney,
  loopClearCount,
  loopNextMove,
  moneyLedger,
  passportSlugTaken,
  passportTrackRecord,
  validatePassportSlug,
  type AudienceSnapshot,
  type DealProtection,
  type GalaxyBrand,
  type GalaxyDeal,
  type GalaxyExpense,
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

const expense = (over: Partial<GalaxyExpense>): GalaxyExpense => ({
  id: "e",
  label: "Cost",
  amountCents: 0,
  date: "2026-11-01",
  ...over,
});

/* ---------------- Part 1: the separated ledger -------------------- */

const DEALS: GalaxyDeal[] = [
  deal({ id: "c1", brandName: "Contracted", stage: "contracted", amountCents: 25000, invoiceDue: "2026-11-30" }),
  deal({ id: "d1", brandName: "Delivering", stage: "delivering", amountCents: 15000, receivedCents: 5000, invoiceDue: "2026-12-15" }),
  deal({ id: "v1", brandName: "Invoiced A", stage: "invoiced", amountCents: 40000, receivedCents: 10000, invoiceSentOn: "2026-11-01", invoiceDue: "2026-11-28" }),
  deal({ id: "v2", brandName: "Invoiced B", stage: "invoiced", amountCents: 20000, receivedCents: null, invoiceDue: "2026-12-05" }),
  deal({ id: "p1", brandName: "Alpha", stage: "paid", amountCents: 300000, receivedCents: 300000, invoiceSentOn: "2026-09-01", paidOn: "2026-09-15" }),
  deal({ id: "p2", brandName: "Beta", stage: "paid", amountCents: 30000, receivedCents: null, paidOn: "2026-11-05" }),
  deal({ id: "p3", brandName: "Alpha", stage: "paid", amountCents: 50000, receivedCents: 50000, invoiceSentOn: "2026-11-10", paidOn: "2026-11-20" }),
  deal({ id: "n1", brandName: "Pitched", stage: "pitched", amountCents: 99900 }),
  deal({ id: "n2", brandName: "Negotiating", stage: "negotiating", amountCents: 88800 }),
  deal({ id: "l1", brandName: "Lost", stage: "lost", amountCents: 77700 }),
];
const EXPENSES: GalaxyExpense[] = [
  expense({ id: "e1", amountCents: 12000, date: "2026-11-02" }),
  expense({ id: "e2", amountCents: 3000, date: "2026-08-01" }),
];

const ledger = moneyLedger(DEALS, EXPENSES, NOW);

check("ledger: projected is contracted+delivering remaining", ledger.projected.cents, 35000);
check("ledger: invoiced is outstanding balances only", ledger.invoiced.cents, 50000);
check(
  "ledger: collected is paid receipts + partial receipts",
  ledger.collected.cents,
  395000
);
check("ledger: collected this month by paid-on date", ledger.collected.thisMonthCents, 80000);
check("ledger: expenses all time", ledger.expensesCents, 15000);
check("ledger: expenses this month", ledger.expensesThisMonthCents, 12000);
check(
  "ledger: kept = collected − expenses even with large projected/invoiced",
  ledger.keptCents,
  380000
);
check("ledger: kept this month", ledger.keptThisMonthCents, 68000);
check("ledger: total across buckets", ledger.totalAcrossBucketsCents, 480000);
check("ledger: eligible count excludes pipeline and lost", ledger.eligibleCount, 7);
check("ledger: reconciles on a consistent book", ledger.reconciles, true);
check("ledger: pipeline counted but unbucketed", [ledger.pipelineCount, ledger.pipelineCents], [2, 188700]);

/* The partition itself: bucket home ids are disjoint and their
 * union is exactly the eligible set. */
{
  const sets = [ledger.projected.lines, ledger.invoiced.lines, ledger.collected.lines].map(
    (ls) => ls.map((l) => l.dealId)
  );
  const flat = sets.flat();
  check("ledger: bucket home ids are disjoint", new Set(flat).size, flat.length);
  check(
    "ledger: bucket union is the eligible set",
    [...new Set(flat)].sort(),
    ["c1", "d1", "p1", "p2", "p3", "v1", "v2"]
  );
}

/* An invoiced deal's money NEVER lands in collected home lines;
 * its partial receipt appears once, as a partial line. */
check(
  "ledger: invoiced deals are not collected home lines",
  ledger.collected.lines.map((l) => l.dealId),
  ["p1", "p2", "p3"]
);
check(
  "ledger: partial receipts listed once each",
  ledger.collected.partialLines.map((l) => [l.dealId, l.cents]),
  [
    ["d1", 5000],
    ["v1", 10000],
  ]
);
check(
  "ledger: invoiced bucket counts the balance after the partial",
  ledger.invoiced.lines.find((l) => l.dealId === "v1")?.cents,
  30000
);

/* A deliberately double-counted deal (same id in two buckets)
 * must break reconciliation — the boolean is computed, not fixed. */
{
  const dup = moneyLedger(
    [
      deal({ id: "dup", stage: "contracted", amountCents: 10000 }),
      deal({ id: "dup", stage: "paid", amountCents: 10000, receivedCents: 10000, paidOn: "2026-11-01" }),
    ],
    [],
    NOW
  );
  check("ledger: double-counted deal fails reconciliation", dup.reconciles, false);
}

{
  const empty = moneyLedger([], [], NOW);
  check(
    "ledger: empty book is all zeros and reconciles",
    [empty.projected.cents, empty.invoiced.cents, empty.collected.cents, empty.keptCents, empty.eligibleCount, empty.reconciles],
    [0, 0, 0, 0, 0, true]
  );
}

/* ---------------- Part 2: Passport track record ------------------- */

{
  const rec = passportTrackRecord(DEALS);
  check("passport: paid deal count", rec.paidDealCount, 3);
  check("passport: total collected from paid deals", rec.totalCollectedCents, 380000);
  check("passport: distinct brands, alphabetical", rec.brandNames, ["Alpha", "Beta"]);
  check("passport: brands paid count", rec.brandsPaidCount, 2);
  check("passport: avg days to pay over deals with both dates", rec.avgDaysToPay, 12);
}
{
  const rec = passportTrackRecord([deal({ id: "x", stage: "contracted", amountCents: 100 })]);
  check(
    "passport: no paid deals → zeros and null average",
    [rec.paidDealCount, rec.totalCollectedCents, rec.brandsPaidCount, rec.avgDaysToPay],
    [0, 0, 0, null]
  );
}
{
  const sql = readFileSync("supabase/migrations/2026-11-23-passport-share-history.sql", "utf8");
  check(
    "migration: share-history column defaults false, not null",
    sql.includes("passport_share_history boolean not null default false"),
    true
  );
  check(
    "migration: snapshot public read requires the share flag too",
    sql.includes("pr.passport_share_history is true"),
    true
  );
  const pub = readFileSync("app/p/[slug]/page.tsx", "utf8");
  check(
    "public page: track record gated on share_history in source",
    pub.includes("passport_share_history") && pub.includes("if (shareHistory)"),
    true
  );
  check(
    "public page: profile read still requires passport_public",
    pub.includes('.eq("passport_public", true)'),
    true
  );
  check(
    "methodology: states the dependency rule and the entered-by-creator rule",
    AUDIENCE_METHODOLOGY.includes("email list not counted") &&
      AUDIENCE_METHODOLOGY.includes("entered by the creator"),
    true
  );
}

/* ---------------- Part 3: the Creator Loop ------------------------ */

const brand = (over: Partial<GalaxyBrand>): GalaxyBrand => ({
  id: "b",
  name: "Brand",
  category: null,
  categories: [],
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

const snap = (over: Partial<AudienceSnapshot>): AudienceSnapshot => ({
  id: "s",
  platform: "tiktok",
  followers: 0,
  engagementPct: null,
  capturedOn: "2026-11-20",
  createdAt: "2026-11-20T00:00:00Z",
  ...over,
});

const loopInput = (over: Partial<Parameters<typeof creatorLoop>[0]>): Parameters<typeof creatorLoop>[0] => ({
  deals: [],
  expenses: [],
  savedCount: 0,
  acceptingCount: 2005,
  brands: [],
  protectionByDeal: {},
  lastActivityByDeal: {},
  snapshots: [],
  passportPublic: false,
  passportShareHistory: false,
  passportSlug: null,
  profileBio: false,
  profileNiches: false,
  now: NOW,
  ...over,
});

const step = (steps: ReturnType<typeof creatorLoop>, id: string) =>
  steps.find((s) => s.id === id) as ReturnType<typeof creatorLoop>[number];

const fullProtection = (id: string): DealProtection => ({
  ...emptyProtection(id),
  contractReviewed: true,
  deliverablesAgreed: true,
  paymentTermsAgreed: true,
  usageRightsSet: true,
  exclusivityChecked: true,
});

/* The severity model itself: labels, tones, accents are the
 * owner's design tokens, pinned so they cannot drift. */
{
  check("loop: severity labels", LOOP_SEVERITY_LABEL, {
    critical: "Act now",
    action: "To do",
    attention: "Heads up",
    clear: "On track",
  });
  check("loop: severity tones", LOOP_SEVERITY_TONE, {
    critical: "#f87171",
    action: "#fb923c",
    attention: "#facc15",
    clear: "#4ade80",
  });
  check("loop: stage accents", LOOP_ACCENT, {
    find: "#60a5fa",
    negotiate: "#a78bfa",
    protect: "#2dd4bf",
    collect: "#fbbf24",
    grow: "#f472b6",
  });
  const steps = creatorLoop(loopInput({}));
  check("loop: order never re-sorts", steps.map((s) => s.id), ["find", "negotiate", "protect", "collect", "grow"]);
  check("loop: labels are the owner's words", steps.map((s) => s.label), ["FIND", "NEGOTIATE", "PROTECT", "COLLECT", "GROW"]);
}

/* Empty account: Find and Grow ask for attention, the rest is
 * honestly clear, and Find wins the next move (it outranks Grow
 * on the tie-break). */
{
  const steps = creatorLoop(loopInput({}));
  check("loop: empty find is attention, pipeline thin", [step(steps, "find").status, step(steps, "find").headline], ["attention", "Pipeline is thin: 0 active deals"]);
  check("loop: empty find detail", step(steps, "find").detail, "Line up 3 more brands to stay booked.");
  check("loop: empty negotiate is clear", [step(steps, "negotiate").status, step(steps, "negotiate").headline], ["clear", "No open negotiations"]);
  check("loop: empty protect is clear", [step(steps, "protect").status, step(steps, "protect").headline], ["clear", "No active agreements yet"]);
  check("loop: empty collect is clear", [step(steps, "collect").status, step(steps, "collect").headline], ["clear", "Nothing awaiting payment"]);
  check("loop: empty collect detail", step(steps, "collect").detail, "Finished deals will show up here until they're paid.");
  check("loop: empty grow headline", step(steps, "grow").headline, "Passport 0/5 done · 5 steps to go public");
  check(
    "loop: empty grow detail lists every missing step",
    step(steps, "grow").detail,
    "Still needed: write your bio, choose your niches, make your Passport public, turn on track-record sharing and add your audience numbers."
  );
  check("loop: empty grow next step", step(steps, "grow").ctaLabel, "Next: Write your bio");
  check("loop: empty next move is find (tie-break over grow)", loopNextMove(steps)?.id ?? null, "find");
  check("loop: empty clear count", loopClearCount(steps), 3);
}

/* Find: saved brands never pitched are the review items, and
 * they outrank the thin-pipeline branch. */
{
  const steps = creatorLoop(
    loopInput({ brands: [brand({ id: "b1", name: "Saved Co", saved: true, rate: 20, cap: "uncapped" })], savedCount: 1 })
  );
  const find = step(steps, "find");
  check("loop: saved-never-pitched headline", [find.status, find.headline], ["attention", "1 saved brand to review"]);
  check(
    "loop: review item carries the real commission",
    find.items.map((i) => [i.title, i.meta, i.actionLabel, i.href]),
    [["Saved Co", "20% commission, uncapped", "Review", "/brands/b1"]]
  );
  check("loop: find CTA opens the top brand", [find.ctaLabel, find.ctaHref], ["Review Saved Co", "/brands/b1"]);
}

/* Find: the pipeline target is 3 active deals. */
{
  const two = [
    deal({ id: "a1", stage: "contracted" }),
    deal({ id: "a2", stage: "delivering" }),
  ];
  const thin = creatorLoop(loopInput({ deals: two }));
  check("loop: two active deals is thin", [step(thin, "find").status, step(thin, "find").headline, step(thin, "find").detail], ["attention", "Pipeline is thin: 2 active deals", "Line up 1 more brand to stay booked."]);
  const three = creatorLoop(loopInput({ deals: [...two, deal({ id: "a3", stage: "invoiced" })] }));
  check("loop: three active deals is healthy", [step(three, "find").status, step(three, "find").headline], ["clear", "Pipeline healthy · 3 active deals"]);
  const paidOnly = creatorLoop(loopInput({ deals: [deal({ id: "a1", stage: "paid" }), deal({ id: "a2", stage: "lost" })] }));
  check("loop: paid and lost do not count as active", step(paidOnly, "find").headline, "Pipeline is thin: 0 active deals");
}

/* Negotiate: the follow-up line is exactly 3 idle days — 2 days
 * is not flagged. Idle reads stage history first, then the
 * deal's updated_at. */
{
  const talk = deal({ id: "n1", brandName: "Quiet Co", stage: "negotiating", amountCents: 50000 });
  const threeDays = creatorLoop(
    loopInput({ deals: [talk], lastActivityByDeal: { n1: "2026-11-20T12:00:00Z" } })
  );
  check(
    "loop: 3 idle days is a follow-up",
    [step(threeDays, "negotiate").status, step(threeDays, "negotiate").headline, step(threeDays, "negotiate").detail],
    ["attention", "Follow up with Quiet Co", "No reply in 3 days. A short nudge keeps the deal moving."]
  );
  check(
    "loop: quiet item meta and action",
    step(threeDays, "negotiate").items.map((i) => [i.meta, i.actionLabel, i.tone]),
    [["$500 · no reply in 3 days", "Follow up", "attention"]]
  );
  const twoDays = creatorLoop(
    loopInput({ deals: [talk], lastActivityByDeal: { n1: "2026-11-21T12:00:00Z" } })
  );
  check(
    "loop: 2 idle days is not flagged",
    [step(twoDays, "negotiate").status, step(twoDays, "negotiate").headline],
    ["clear", "1 deal in talks · $500"]
  );
  const fallback = creatorLoop(
    loopInput({ deals: [deal({ id: "n2", stage: "pitched", lastContact: "2026-11-20" })] })
  );
  check("loop: idle falls back to updated_at without history", step(fallback, "negotiate").status, "attention");
  const historyWins = creatorLoop(
    loopInput({
      deals: [deal({ id: "n3", stage: "pitched", lastContact: "2026-11-22" })],
      lastActivityByDeal: { n3: "2026-11-18T09:00:00Z" },
    })
  );
  check("loop: stage history outranks a fresher updated_at", step(historyWins, "negotiate").headline, "Follow up with Brand");
}

/* Protect: the five real deal_protection items. A missing
 * contract is critical; other gaps are action, named in the
 * owner's phrases. */
{
  const unsigned = creatorLoop(
    loopInput({ deals: [deal({ id: "c1", brandName: "Unsigned Co", stage: "contracted" })] })
  );
  const protect = step(unsigned, "protect");
  check(
    "loop: unsigned contract is critical",
    [protect.status, protect.headline, protect.detail, protect.ctaLabel],
    ["critical", "Unsigned Co has no signed contract", "Nothing is enforceable until both sides sign.", "Get Unsigned Co signed"]
  );
  check(
    "loop: unsigned item lists every missing protection",
    protect.items.map((i) => [i.meta, i.tone, i.actionLabel]),
    [["Missing: Signed contract, Usage-rights limit, Exclusivity check, Deliverables in writing, Payment terms", "critical", "Fix"]]
  );
  const partial: DealProtection = {
    ...fullProtection("c2"),
    usageRightsSet: false,
    deliverablesAgreed: false,
  };
  const gapsOnly = creatorLoop(
    loopInput({
      deals: [deal({ id: "c2", brandName: "Gap Co", stage: "delivering" })],
      protectionByDeal: { c2: partial },
    })
  );
  check(
    "loop: gap headline names the missing phrases",
    [step(gapsOnly, "protect").status, step(gapsOnly, "protect").headline, step(gapsOnly, "protect").detail],
    ["action", "Gap Co is missing a usage-rights limit and deliverables in writing", "Cap how long and where the brand can run your content."]
  );
  const twoDeals = creatorLoop(
    loopInput({
      deals: [
        deal({ id: "c3", brandName: "A Co", stage: "contracted" }),
        deal({ id: "c4", brandName: "B Co", stage: "invoiced" }),
      ],
      protectionByDeal: {
        c3: { ...fullProtection("c3"), usageRightsSet: false },
        c4: { ...fullProtection("c4"), usageRightsSet: false, paymentTermsAgreed: false },
      },
    })
  );
  check(
    "loop: gaps across agreements are counted",
    step(twoDeals, "protect").headline,
    "3 protection gaps across 2 agreements"
  );
  const oneDone = creatorLoop(
    loopInput({
      deals: [deal({ id: "c5", stage: "contracted" })],
      protectionByDeal: { c5: fullProtection("c5") },
    })
  );
  check("loop: one protected agreement", step(oneDone, "protect").headline, "Your agreement is protected");
  const threeDone = creatorLoop(
    loopInput({
      deals: [deal({ id: "c6", stage: "contracted" }), deal({ id: "c7", stage: "delivering" }), deal({ id: "c8", stage: "invoiced" })],
      protectionByDeal: { c6: fullProtection("c6"), c7: fullProtection("c7"), c8: fullProtection("c8") },
    })
  );
  check("loop: all protected is clear", [step(threeDone, "protect").status, step(threeDone, "protect").headline], ["clear", "All 3 agreements are protected"]);
}

/* Collect: the headline total IS the ledger's invoiced bucket,
 * partial payments included; overdue is critical. */
{
  const deals = [
    deal({ id: "v1", stage: "invoiced", amountCents: 40000, receivedCents: 10000, invoiceDue: "2026-11-28" }),
  ];
  const steps = creatorLoop(loopInput({ deals }));
  const led = moneyLedger(deals, [], NOW);
  check("loop: collect headline equals the ledger invoiced bucket", step(steps, "collect").headline, `1 deal awaiting payment · ${fmtMoney(led.invoiced.cents)}`);
  check("loop: partially paid invoice is action, not critical", step(steps, "collect").status, "action");
  check(
    "loop: invoiced item counts down to the due date",
    step(steps, "collect").items.map((i) => [i.meta, i.actionLabel, i.tone]),
    [["$300 · due in 5 days", "View", "attention"]]
  );
  check("loop: collect CTA tracks payments when nothing is overdue", [step(steps, "collect").ctaLabel, step(steps, "collect").ctaHref], ["Track payments", "/money"]);

  const overdue = creatorLoop(
    loopInput({ deals: [deal({ id: "v2", brandName: "Late Co", stage: "invoiced", amountCents: 30000, invoiceDue: "2026-11-17" })] })
  );
  check(
    "loop: overdue invoice is critical",
    [step(overdue, "collect").status, step(overdue, "collect").detail, step(overdue, "collect").ctaLabel, step(overdue, "collect").ctaHref],
    ["critical", "Late Co is 6 days overdue.", "Send a reminder to Late Co", "/deals"]
  );
  check(
    "loop: overdue item meta",
    step(overdue, "collect").items.map((i) => [i.meta, i.actionLabel, i.tone]),
    [["$300 · 6 days overdue", "Remind", "critical"]]
  );
  const dueToday = creatorLoop(
    loopInput({ deals: [deal({ id: "v3", stage: "invoiced", amountCents: 10000, invoiceDue: "2026-11-23" })] })
  );
  check("loop: due today reads today", step(dueToday, "collect").items[0].meta, "$100 · due today");
  const onReceipt = creatorLoop(
    loopInput({ deals: [deal({ id: "v4", stage: "invoiced", amountCents: 10000, invoiceDue: null })] })
  );
  check("loop: no due date reads on receipt", step(onReceipt, "collect").items[0].meta, "$100 · due on receipt");
  const paid = creatorLoop(
    loopInput({ deals: [deal({ id: "v5", stage: "paid", amountCents: 50000, receivedCents: 50000, paidOn: "2026-11-01" })] })
  );
  check("loop: collected so far from the ledger", [step(paid, "collect").status, step(paid, "collect").detail], ["clear", "$500 collected so far."]);
}

/* Next move: severity first, then money-first tie-breaks. */
{
  const both = creatorLoop(
    loopInput({
      deals: [
        deal({ id: "m1", brandName: "Late Co", stage: "invoiced", amountCents: 30000, invoiceDue: "2026-11-17" }),
        deal({ id: "m2", brandName: "Unsigned Co", stage: "contracted" }),
      ],
    })
  );
  check("loop: collect critical beats protect critical", loopNextMove(both)?.id ?? null, "collect");
  const unsignedOnly = creatorLoop(
    loopInput({ deals: [deal({ id: "m3", brandName: "Unsigned Co", stage: "contracted" })] })
  );
  check("loop: unsigned contract alone is the next move", [loopNextMove(unsignedOnly)?.id ?? null, loopNextMove(unsignedOnly)?.status ?? null], ["protect", "critical"]);
  const actionVsAttention = creatorLoop(
    loopInput({
      deals: [
        deal({ id: "m4", brandName: "Gap Co", stage: "delivering" }),
        deal({ id: "m5", brandName: "Quiet Co", stage: "negotiating", amountCents: 10000 }),
      ],
      protectionByDeal: { m4: { ...fullProtection("m4"), usageRightsSet: false } },
      lastActivityByDeal: { m5: "2026-11-19T12:00:00Z" },
    })
  );
  check("loop: action beats attention in the next move", loopNextMove(actionVsAttention)?.id ?? null, "protect");
}

/* Grow: the five checklist items are real fields; the count
 * math and the remaining-steps line are pinned. */
{
  const partial = creatorLoop(loopInput({ profileBio: true, profileNiches: true }));
  const grow = step(partial, "grow");
  check("loop: grow counts completed items", grow.headline, "Passport 2/5 done · 3 steps to go public");
  check(
    "loop: grow names what is still needed",
    grow.detail,
    "Still needed: make your Passport public, turn on track-record sharing and add your audience numbers."
  );
  check("loop: grow next step is the first missing item", grow.ctaLabel, "Next: Make your Passport public");
  check(
    "loop: grow items list unfinished first",
    grow.items.map((i) => [i.id, i.done]),
    [["public", false], ["share", false], ["audience", false], ["bio", true], ["niches", true]]
  );
  const ready = creatorLoop(
    loopInput({
      profileBio: true,
      profileNiches: true,
      passportShareHistory: true,
      snapshots: [snap({ id: "s1" })],
    })
  );
  check(
    "loop: complete but private is action",
    [step(ready, "grow").status, step(ready, "grow").headline, step(ready, "grow").ctaLabel],
    ["action", "Passport is ready to go public", "Publish Passport"]
  );
  const publicOnly = creatorLoop(loopInput({ passportPublic: true, passportSlug: "x-1" }));
  check(
    "loop: public alone is not finished",
    [step(publicOnly, "grow").status, step(publicOnly, "grow").headline],
    ["attention", "Passport 1/5 done · 4 steps to go public"]
  );
}

/* A fully healthy account: every step clear, no next move. */
{
  const healthyDeals = [
    deal({ id: "p1", brandName: "Alpha", stage: "paid", amountCents: 50000, receivedCents: 50000, invoiceSentOn: "2026-09-01", paidOn: "2026-09-15" }),
    deal({ id: "c1", brandName: "Beta", stage: "contracted", amountCents: 25000, invoiceDue: "2026-12-01" }),
    deal({ id: "c2", brandName: "Gamma", stage: "contracted", amountCents: 25000 }),
    deal({ id: "c3", brandName: "Delta", stage: "contracted", amountCents: 25000 }),
  ];
  const steps = creatorLoop(
    loopInput({
      deals: healthyDeals,
      savedCount: 3,
      protectionByDeal: { c1: fullProtection("c1"), c2: fullProtection("c2"), c3: fullProtection("c3") },
      snapshots: [snap({ id: "s1", platform: "tiktok", followers: 8000 })],
      passportPublic: true,
      passportShareHistory: true,
      passportSlug: "x-1",
      profileBio: true,
      profileNiches: true,
    })
  );
  check("loop: healthy account — every step clear", steps.map((s) => s.status), ["clear", "clear", "clear", "clear", "clear"]);
  check("loop: healthy account has no next move", loopNextMove(steps)?.id ?? null, null);
  check("loop: healthy clear count", loopClearCount(steps), 5);
  check("loop: healthy grow is live", step(steps, "grow").headline, "Your Passport is live");
  check("loop: healthy collect reports what was collected", step(steps, "collect").detail, "$500 collected so far.");
}

/* Wiring: the panel renders the V2 pieces and the idle clock is
 * fed from real stage history through the server path. */
{
  const today = readFileSync("app/today/TodayClient.tsx", "utf8");
  check(
    "loop wiring: Today renders health, next move and the loop footer",
    today.includes("Loop health") && today.includes("YOUR NEXT MOVE") && today.includes("Every stage is clear") && today.includes("GROW → FIND AGAIN"),
    true
  );
  const page = readFileSync("app/today/page.tsx", "utf8");
  check(
    "loop wiring: Today page feeds stage history and profile flags",
    page.includes("fetchDealLastActivity") && page.includes("lastActivityByDeal") && page.includes("profileBio") && page.includes("profileNiches"),
    true
  );
  const server = readFileSync("lib/galaxy/server.ts", "utf8");
  check(
    "loop wiring: stage history fetch is user-scoped",
    server.includes('from("deal_stage_history")') && server.includes('.eq("user_id", userId)'),
    true
  );
}

/* ---------------- Part 4: the chosen Passport address ------------
 * A Passport "worth sharing" needs an address the creator picks.
 * The rules are pinned here: format (3–30, lowercase letters /
 * numbers / hyphens, no leading or trailing hyphen), the reserved
 * words the app routes on, and uniqueness as a pure check over
 * slug holders — another creator's address conflicts, your own
 * current address never does. Source assertions pin the wiring:
 * the public page resolves by passport_slug (so a changed slug
 * resolves and the old one 404s), the Passport page carries the
 * editor, and Settings no longer claims its in-app username names
 * the public profile. */

{
  check(
    "slug: a chosen address passes, normalized",
    validatePassportSlug("  My-Name-1 "),
    { ok: true, slug: "my-name-1" }
  );
  check("slug: too short rejected", validatePassportSlug("ab").ok, false);
  check("slug: exactly 3 passes", validatePassportSlug("a-1").ok, true);
  check("slug: exactly 30 passes", validatePassportSlug("a".repeat(30)).ok, true);
  check("slug: too long rejected", validatePassportSlug("a".repeat(31)).ok, false);
  check("slug: blank rejected", validatePassportSlug("   ").ok, false);
  check("slug: space rejected", validatePassportSlug("bad slug").ok, false);
  check("slug: underscore rejected", validatePassportSlug("bad_slug").ok, false);
  check("slug: symbol rejected", validatePassportSlug("bad!slug").ok, false);
  check("slug: leading hyphen rejected", validatePassportSlug("-abc").ok, false);
  check("slug: trailing hyphen rejected", validatePassportSlug("abc-").ok, false);
  check("slug: interior hyphens pass", validatePassportSlug("my--name").ok, true);

  const RESERVED = [
    "login", "signup", "welcome", "get-started", "pricing", "api", "p",
    "today", "brands", "deals", "studio", "money", "passport",
    "settings", "admin", "support", "terms", "privacy",
  ];
  for (const w of RESERVED) {
    check(`slug: reserved word "${w}" rejected`, validatePassportSlug(w).ok, false);
  }
  check("slug: reserved set is exactly the routed words", [...RESERVED_PASSPORT_SLUGS].sort(), [...RESERVED].sort());

  const holders = [
    { id: "u1", passport_slug: "taken-name" },
    { id: "u2", passport_slug: "other-name" },
    { id: "u3", passport_slug: null },
  ];
  check("slug: another creator's address conflicts", passportSlugTaken("taken-name", holders, "u9"), true);
  check("slug: own current address is not a conflict", passportSlugTaken("taken-name", holders, "u1"), false);
  check("slug: a free address does not conflict", passportSlugTaken("free-name", holders, "u9"), false);
  check("slug: no holders, no conflict", passportSlugTaken("any-name", [], "u9"), false);

  const pub = readFileSync("app/p/[slug]/page.tsx", "utf8");
  check(
    "public page: profile resolved by passport_slug",
    pub.includes('.eq("passport_slug", slug)'),
    true
  );
  const client = readFileSync("app/passport/PassportClient.tsx", "utf8");
  check(
    "passport UI: slug editor carries the break-link warning",
    client.includes("This is your public address. Changing it breaks your old link."),
    true
  );
  check(
    "passport UI: editor saves through the share route",
    client.includes("JSON.stringify({ slug: slugDraft })"),
    true
  );
  const share = readFileSync("app/api/passport/share/route.ts", "utf8");
  check(
    "share route: slug writes validate + check uniqueness server-side",
    share.includes("validatePassportSlug") && share.includes("passportSlugTaken"),
    true
  );
  check(
    "share route: taken address returns the plain taken error",
    share.includes("That address is taken — try another"),
    true
  );
  const prefs = readFileSync("components/SettingsPrefs.tsx", "utf8");
  check(
    "settings: username copy points at the Passport editor",
    prefs.includes("Your public Passport address is set on your Passport page"),
    true
  );
  check(
    "settings: username copy no longer claims the profile address",
    prefs.includes("answers to"),
    false
  );
  const globalsCss = readFileSync("app/globals.css", "utf8");
  check(
    "today phone: ask chips are never forced into a nowrap scroll row (owner: chips cut off at the right edge)",
    globalsCss.includes(".gx-ask-chips { flex-wrap: nowrap; }"),
    false
  );
  check(
    "today: ask chips wrap (base rule)",
    globalsCss.includes(".gx-ask-chips { flex-wrap: wrap; }"),
    true
  );
}

if (failures > 0) {
  console.log(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll galaxy trust assertions passed.");
