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
// ledger's figures; a fully healthy account has no step in
// priority or gap.
//
// Run (from the repo root):
//   npx tsx scripts/galaxy-trust-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "node:fs";
import {
  AUDIENCE_METHODOLOGY,
  RESERVED_PASSPORT_SLUGS,
  creatorLoop,
  emptyProtection,
  fmtMoney,
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
  snapshots: [],
  passportPublic: false,
  passportShareHistory: false,
  passportSlug: null,
  now: NOW,
  ...over,
});

const step = (steps: ReturnType<typeof creatorLoop>, id: string) =>
  steps.find((s) => s.id === id) as ReturnType<typeof creatorLoop>[number];

/* Empty account: Find carries Start-here priority, Grow names its
 * first remaining step, everything else is honestly calm. */
{
  const steps = creatorLoop(loopInput({}));
  check("loop: order never re-sorts", steps.map((s) => s.id), ["find", "negotiate", "protect", "collect", "grow"]);
  check("loop: labels are the owner's words", steps.map((s) => s.label), ["FIND", "NEGOTIATE", "PROTECT", "COLLECT", "GROW"]);
  check(
    "loop: short lines are the mock's",
    steps.map((s) => s.line),
    [
      "Discover brand opportunities",
      "Turn opportunities into deals",
      "Secure your agreements",
      "Turn completed work into collected money",
      "Build credibility and audience independence",
    ]
  );
  check("loop: empty find is priority", step(steps, "find").status, "priority");
  check(
    "loop: empty find line",
    step(steps, "find").progress,
    "No brands saved yet — 2,005 are accepting pitches"
  );
  check("loop: empty negotiate is calm", [step(steps, "negotiate").status, step(steps, "negotiate").progress], ["calm", "No pitches out yet"]);
  check("loop: empty protect is calm", [step(steps, "protect").status, step(steps, "protect").progress], ["calm", "No agreements yet"]);
  check("loop: empty collect is calm", [step(steps, "collect").status, step(steps, "collect").progress], ["calm", "Nothing awaiting payment"]);
  check(
    "loop: empty grow is a gap naming the public step",
    [step(steps, "grow").status, step(steps, "grow").progress],
    ["gap", "Not public yet — turn on public Passport to share it"]
  );
}

/* Collect: awaiting payment is priority, with the ledger's own
 * figures; overdue is named in the same line. */
{
  const awaiting = [
    deal({ id: "v1", stage: "invoiced", amountCents: 40000, receivedCents: 10000, invoiceDue: "2026-11-28" }),
    deal({ id: "v2", stage: "invoiced", amountCents: 20000, invoiceDue: "2026-12-05" }),
  ];
  const steps = creatorLoop(loopInput({ deals: awaiting }));
  const led = moneyLedger(awaiting, [], NOW);
  check("loop: collect priority when invoices await", step(steps, "collect").status, "priority");
  check(
    "loop: collect line carries the ledger figures",
    step(steps, "collect").progress,
    `2 deals awaiting payment — ${fmtMoney(led.invoiced.cents)}`
  );
  const withOverdue = [
    ...awaiting,
    deal({ id: "v3", stage: "invoiced", amountCents: 10000, invoiceDue: "2026-11-01" }),
  ];
  const steps2 = creatorLoop(loopInput({ deals: withOverdue }));
  check(
    "loop: overdue named in the collect line",
    step(steps2, "collect").progress,
    "3 deals awaiting payment — $600 · 1 deal overdue"
  );
  check("loop: overdue keeps collect at priority", step(steps2, "collect").status, "priority");
}

/* Protect: the gap line names the most common missing item. */
{
  const full = (id: string): DealProtection => ({ ...emptyProtection(id) });
  const noUsage = (id: string): DealProtection => ({
    ...emptyProtection(id),
    contractReviewed: true,
    deliverablesAgreed: true,
    paymentTermsAgreed: true,
    exclusivityChecked: true,
    usageRightsSet: false,
  });
  const two = [
    deal({ id: "c1", stage: "contracted", amountCents: 10000 }),
    deal({ id: "c2", stage: "delivering", amountCents: 20000 }),
  ];
  const steps = creatorLoop(
    loopInput({ deals: two, protectionByDeal: { c1: noUsage("c1"), c2: noUsage("c2") } })
  );
  check("loop: protect gap names the missing item", step(steps, "protect").progress, "2 deals missing usage rights");
  check("loop: protect gap status", step(steps, "protect").status, "gap");
  const done = creatorLoop(
    loopInput({
      deals: two,
      protectionByDeal: {
        c1: { ...full("c1"), contractReviewed: true, deliverablesAgreed: true, paymentTermsAgreed: true, usageRightsSet: true, exclusivityChecked: true },
        c2: { ...full("c2"), contractReviewed: true, deliverablesAgreed: true, paymentTermsAgreed: true, usageRightsSet: true, exclusivityChecked: true },
      },
    })
  );
  check("loop: all protected is calm", [step(done, "protect").status, step(done, "protect").progress], ["calm", "All active deals protected"]);
}

/* Negotiate: stale talks and never-pitched saved brands are gaps. */
{
  const stale = creatorLoop(
    loopInput({ deals: [deal({ id: "n1", stage: "pitched", lastContact: "2026-11-10" })] })
  );
  check("loop: stale pitch is a gap", [step(stale, "negotiate").status, step(stale, "negotiate").progress], ["gap", "1 deal gone quiet — follow up"]);
  const fresh = creatorLoop(
    loopInput({ deals: [deal({ id: "n1", stage: "pitched", lastContact: "2026-11-22" })] })
  );
  check("loop: fresh pitch is calm", step(fresh, "negotiate").status, "calm");
  const neglected = creatorLoop(
    loopInput({ brands: [brand({ id: "b1", name: "Saved Co", saved: true })], savedCount: 1 })
  );
  check(
    "loop: saved-never-pitched is a negotiate gap",
    [step(neglected, "negotiate").status, step(neglected, "negotiate").progress],
    ["gap", "1 saved brand never pitched"]
  );
}

/* Grow: each completed checklist item removes itself. */
{
  const pub = creatorLoop(loopInput({ passportPublic: true, passportSlug: "x-1" }));
  check("loop: grow after public names sharing next", step(pub, "grow").progress, "2 steps left: turn on track-record sharing");
  const shared = creatorLoop(
    loopInput({ passportPublic: true, passportShareHistory: true, passportSlug: "x-1" })
  );
  check("loop: grow after sharing names audience next", step(shared, "grow").progress, "1 step left: add your audience numbers");
  const done = creatorLoop(
    loopInput({
      passportPublic: true,
      passportShareHistory: true,
      passportSlug: "x-1",
      snapshots: [snap({ id: "s1", platform: "tiktok", followers: 10000 }), snap({ id: "s2", platform: "email", followers: 500 })],
    })
  );
  check("loop: grow complete is calm", step(done, "grow").status, "calm");
  check("loop: grow complete shows the owned share", step(done, "grow").progress, "Public · 5% audience owned");
}

/* A fully healthy account: no step in priority or gap. */
{
  const healthyDeals = [
    deal({ id: "p1", brandName: "Alpha", stage: "paid", amountCents: 50000, receivedCents: 50000, invoiceSentOn: "2026-09-01", paidOn: "2026-09-15" }),
    deal({ id: "c1", brandName: "Beta", stage: "contracted", amountCents: 25000, invoiceDue: "2026-12-01" }),
  ];
  const prot: DealProtection = {
    ...emptyProtection("c1"),
    contractReviewed: true,
    deliverablesAgreed: true,
    paymentTermsAgreed: true,
    usageRightsSet: true,
    exclusivityChecked: true,
  };
  const steps = creatorLoop(
    loopInput({
      deals: healthyDeals,
      savedCount: 3,
      protectionByDeal: { c1: prot },
      snapshots: [snap({ id: "s1", platform: "tiktok", followers: 8000 })],
      passportPublic: true,
      passportShareHistory: true,
      passportSlug: "x-1",
    })
  );
  check("loop: healthy account — every step calm", steps.map((s) => s.status), ["calm", "calm", "calm", "calm", "calm"]);
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
}

if (failures > 0) {
  console.log(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll galaxy trust assertions passed.");
