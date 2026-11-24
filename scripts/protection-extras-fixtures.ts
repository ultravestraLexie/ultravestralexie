// ============================================================================
// Protection extras + deliverables checklist — acceptance fixtures
// for the two demo features copied on 2026-11-23 (owner approval):
//
// (A) Kill fee + revision cap in Deal Protection. The checklist
//     is SEVEN items end to end: deal_protection gains kill_fee /
//     revision_cap (migration, file only — the parent applies
//     it), core's DealProtection / rowToProtection /
//     protectionGaps carry both, the protection API round-trips
//     them, the deal sheet shows both checks, and the Creator
//     Loop's PROTECT stage counts all seven and names the two
//     new gaps in the owner's demo phrases, verbatim:
//       Kill fee     — "Get paid if the brand cancels after
//                      you've started."
//       Revision cap — "Limit revision rounds so the scope
//                      can't creep."
//
// (B) The per-deal deliverables checklist in the deal sheet.
//     public.deal_deliverables already exists (Build 14) — the
//     demo's label/done maps onto its title/status, so NO second
//     table is created; the only migration is the additive
//     position column. The checklist header states are the
//     demo's: "Ready to deliver" (items, none done),
//     "Everything delivered" (all done), "N of M delivered"
//     (in between) — computed by core's deliverablesHeadline.
//
// Run (from the repo root):
//   npx tsx scripts/protection-extras-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "node:fs";
import {
  creatorLoop,
  deliverableDone,
  deliverablesHeadline,
  emptyProtection,
  protectionGaps,
  rowToProtection,
  type DealProtection,
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

const read = (p: string) => readFileSync(p, "utf8");

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

const ORIGINAL_FIVE = prot({
  contractReviewed: true,
  deliverablesAgreed: true,
  paymentTermsAgreed: true,
  usageRightsSet: true,
  exclusivityChecked: true,
});

// --- (A) core record shape ---------------------------------------------------

check(
  "extras: empty protection starts with kill fee and revision cap unchecked",
  [emptyProtection("d").killFee, emptyProtection("d").revisionCap],
  [false, false]
);
check(
  "extras: rowToProtection maps kill_fee and revision_cap",
  (() => {
    const p = rowToProtection({
      deal_id: "d",
      contract_reviewed: true,
      deliverables_agreed: true,
      payment_terms_agreed: true,
      usage_rights_set: true,
      exclusivity_checked: true,
      kill_fee: true,
      revision_cap: false,
      usage_rights_note: "",
      exclusivity_note: "",
      terms_note: "",
    });
    return [p.killFee, p.revisionCap];
  })(),
  [true, false]
);
check(
  "extras: a row without the new columns (pre-migration) maps both to false, never crashes",
  (() => {
    const p = rowToProtection({
      deal_id: "d",
      contract_reviewed: false,
      deliverables_agreed: false,
      payment_terms_agreed: false,
      usage_rights_set: false,
      exclusivity_checked: false,
      usage_rights_note: "",
      exclusivity_note: "",
      terms_note: "",
    });
    return [p.killFee, p.revisionCap];
  })(),
  [false, false]
);

// --- (A) gaps ----------------------------------------------------------------

check(
  "extras: original five done, extras open — exactly the two new gaps, in order",
  protectionGaps(deal({ stage: "contracted" }), ORIGINAL_FIVE).map((g) => [g.id, g.text]),
  [
    ["killfee", "Kill fee not agreed"],
    ["revisioncap", "Revision cap not agreed"],
  ]
);
check(
  "extras: all seven checked — zero gaps",
  protectionGaps(
    deal({ stage: "contracted" }),
    prot({ ...ORIGINAL_FIVE, killFee: true, revisionCap: true })
  ),
  []
);

// --- (A) the Loop counts seven and names the new gaps -------------------------

const loopInput = (
  over: Partial<Parameters<typeof creatorLoop>[0]>
): Parameters<typeof creatorLoop>[0] => ({
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

{
  const steps = creatorLoop(
    loopInput({
      deals: [deal({ id: "k1", brandName: "Demo Co", stage: "contracted" })],
      protectionByDeal: { k1: { ...ORIGINAL_FIVE, dealId: "k1" } },
    })
  );
  const protect = steps.find((s) => s.id === "protect")!;
  check(
    "extras: loop headline names a kill fee and a revision cap",
    [protect.status, protect.headline],
    ["action", "Demo Co is missing a kill fee and a revision cap"]
  );
  check(
    "extras: loop detail is the demo's kill-fee line, verbatim",
    protect.detail,
    "Get paid if the brand cancels after you've started."
  );
  check(
    "extras: loop item meta lists the two new protections by their demo labels",
    protect.items.map((i) => i.meta),
    ["Missing: Kill fee, Revision cap"]
  );
}
{
  const steps = creatorLoop(
    loopInput({
      deals: [deal({ id: "k2", brandName: "Full Co", stage: "delivering" })],
      protectionByDeal: {
        k2: { ...ORIGINAL_FIVE, dealId: "k2", killFee: true, revisionCap: true },
      },
    })
  );
  const protect = steps.find((s) => s.id === "protect")!;
  check(
    "extras: all seven checked — the loop calls the agreement protected",
    [protect.status, protect.headline],
    ["clear", "Your agreement is protected"]
  );
}

// --- (A) source pins: migration, API, server read, sheet ----------------------

const migrationA = read("supabase/migrations/2026-11-23-protection-extras.sql");
check(
  "extras: migration adds kill_fee to deal_protection",
  migrationA.includes("alter table public.deal_protection") &&
    migrationA.includes("kill_fee boolean not null default false"),
  true
);
check(
  "extras: migration adds revision_cap to deal_protection",
  migrationA.includes("revision_cap boolean not null default false"),
  true
);

const protectionRoute = read("app/api/deals/protection/route.ts");
check(
  "extras: protection API validates and writes both new fields",
  protectionRoute.includes("killFee: z.boolean()") &&
    protectionRoute.includes("revisionCap: z.boolean()") &&
    protectionRoute.includes("kill_fee: parsed.data.killFee") &&
    protectionRoute.includes("revision_cap: parsed.data.revisionCap"),
  true
);
check(
  "extras: server protection read selects both new columns",
  read("lib/galaxy/server.ts").includes("kill_fee, revision_cap"),
  true
);

const core = read("lib/galaxy/core.ts");
check(
  "extras: core carries the demo's kill-fee why-line verbatim",
  core.includes("Get paid if the brand cancels after you've started."),
  true
);
check(
  "extras: core carries the demo's revision-cap why-line verbatim",
  core.includes("Limit revision rounds so the scope can't creep."),
  true
);

const sheet = read("components/galaxy/DealSheet.tsx");
check(
  "extras: the deal sheet's checklist shows Kill fee and Revision cap",
  sheet.includes('{ key: "killFee", label: "Kill fee" }') &&
    sheet.includes('{ key: "revisionCap", label: "Revision cap" }'),
  true
);

// --- (B) deliverables headline math -------------------------------------------

check(
  "checklist: delivered and approved are done; pending is not",
  [deliverableDone("pending"), deliverableDone("delivered"), deliverableDone("approved")],
  [false, true, true]
);
check(
  "checklist: no items — no state line",
  deliverablesHeadline([]),
  { done: 0, total: 0, label: null }
);
check(
  "checklist: items, none done — Ready to deliver",
  deliverablesHeadline([{ status: "pending" }, { status: "pending" }]),
  { done: 0, total: 2, label: "Ready to deliver" }
);
check(
  "checklist: all done — Everything delivered",
  deliverablesHeadline([{ status: "delivered" }, { status: "approved" }]),
  { done: 2, total: 2, label: "Everything delivered" }
);
check(
  "checklist: in between — N of M delivered",
  deliverablesHeadline([{ status: "delivered" }, { status: "pending" }, { status: "pending" }]),
  { done: 1, total: 3, label: "1 of 3 delivered" }
);

// --- (B) source pins: migration, API, sheet -----------------------------------

const migrationB = read("supabase/migrations/2026-11-23-deliverable-position.sql");
check(
  "checklist: migration adds the position column to the existing table",
  migrationB.includes("alter table public.deal_deliverables") &&
    migrationB.includes("position int not null default 0"),
  true
);
check(
  "checklist: migration adds the (deal_id, position) index",
  migrationB.includes("deal_deliverables_deal_position_idx") &&
    migrationB.includes("(deal_id, position)"),
  true
);
check(
  "checklist: no second deal_deliverables table is created (Build 14's stands)",
  migrationB.includes("create table"),
  false
);

const deliverablesRoute = read("app/api/deals/deliverables/route.ts");
check(
  "checklist: API lists a deal's deliverables (GET by deal)",
  deliverablesRoute.includes("export async function GET") &&
    deliverablesRoute.includes('searchParams.get("dealId")'),
  true
);
check(
  "checklist: API assigns the next position on insert",
  deliverablesRoute.includes("position: lastPosition + 1"),
  true
);
check(
  "checklist: API reads items in position order",
  deliverablesRoute.includes('.order("position", { ascending: true })'),
  true
);
check(
  "checklist: the sheet renders the checklist section with its add input",
  sheet.includes("Deliverables checklist") &&
    sheet.includes("Add a deliverable"),
  true
);
check(
  "checklist: the sheet loads the deal's items from the deliverables API",
  sheet.includes("/api/deals/deliverables?dealId="),
  true
);
check(
  "checklist: checking an item is labelled Mark delivered",
  sheet.includes("Mark delivered: "),
  true
);
check(
  "checklist: the sheet's state line comes from core's deliverablesHeadline",
  sheet.includes("deliverablesHeadline(delivs)"),
  true
);

console.log(
  failures === 0 ? "\nALL PROTECTION EXTRAS FIXTURES PASS" : `\n${failures} FAILURES`
);
process.exit(failures === 0 ? 0 : 1);
