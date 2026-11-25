// ============================================================================
// Growth Engine — acceptance fixtures (owner direction 2026-11-24:
// the six stages as ONE connected engine + the ULTRA VESTRA BRAIN
// layer; order "Build everything").
//
// Pins lib/galaxy/engine.ts: customers derive from PAID deals only,
// repeat + follow-up rules, the six stage cards' metrics, and the
// Brain's money-first ordering. All expected values are computed by
// hand from the literal rows below. The empty account must read as
// honest zeros — no invented numbers anywhere.
//
// Run (from the repo root):
//   npx tsx scripts/engine-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "fs";
import type { GalaxyDeal } from "../lib/galaxy/core";
import { buildGrowthEngine, engineCustomers } from "../lib/galaxy/engine";

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

let seq = 0;
function deal(partial: Partial<GalaxyDeal>): GalaxyDeal {
  seq += 1;
  return {
    id: "d" + seq,
    brandName: "Brand",
    brandId: null,
    platform: null,
    stage: "paid",
    amountCents: null,
    receivedCents: null,
    deliverables: "",
    notes: "",
    pitchedOn: "2026-01-01",
    lastContact: "2026-01-01",
    dueOn: null,
    invoiceSentOn: null,
    invoiceDue: null,
    paidOn: null,
    ...partial,
  };
}

const NOW = new Date("2026-11-24T12:00:00");
const base = {
  income: [],
  publishedPosts: 0,
  postsThisWeek: 0,
  scriptCount: 0,
  savedCount: 0,
  directoryCount: 4083,
  neglectedCount: 0,
  now: NOW,
};

/* ------------------------- empty account ------------------------- */
{
  const e = buildGrowthEngine({ ...base, deals: [] });
  check("engine empty: no customers", e.customers, []);
  check("engine empty: repeat rate null (not invented)", e.repeatRatePct, null);
  check("engine empty: collected 0", e.collectedCents, 0);
  check("engine empty: discovery metric is the directory", e.stages[0].metric, "4,083 brands listed");
  check("engine empty: customers metric honest", e.stages[3].metric, "No customers yet");
  check("engine empty: brain says clear, one rec", e.brain.length, 1);
  check("engine empty: brain clear title", e.brain[0].title, "Your engine is clear");
  check("engine stages order", e.stages.map((s) => s.id), [
    "discovery",
    "collaboration",
    "marketing",
    "customers",
    "revenue",
    "retention",
  ]);
}

/* ------------------------- customers ------------------------- */
{
  const deals = [
    deal({ brandName: "Glow Co", amountCents: 50000, paidOn: "2026-08-01" }),
    deal({ brandName: "Glow Co", amountCents: 70000, paidOn: "2026-09-15" }),
    deal({ brandName: "Cafe Rio", amountCents: 30000, paidOn: "2026-11-20" }),
    deal({ brandName: "Unpaid Brand", stage: "invoiced", amountCents: 99900, invoiceDue: "2026-12-01" }),
  ];
  const cs = engineCustomers(deals, NOW);
  check("customers: paid brands only", cs.map((c) => c.brandName), ["Glow Co", "Cafe Rio"]);
  check("customers: totals + repeat", [cs[0].totalPaidCents, cs[0].deals, cs[0].repeat], [120000, 2, true]);
  check("customers: last paid wins", cs[0].lastPaidOn, "2026-09-15");
  check("customers: glow follow-up due (70d, no active deal)", cs[0].followUpDue, true);
  check("customers: cafe not due (4d)", cs[1].followUpDue, false);

  const withActive = engineCustomers(
    [...deals, deal({ brandName: "Glow Co", stage: "delivering", amountCents: 10000, paidOn: null })],
    NOW
  );
  check("customers: active deal clears the follow-up", withActive[0].followUpDue, false);
  check("customers: active flag set", withActive[0].activeNow, true);
}

/* ------------------------- brain ordering ------------------------- */
{
  const deals = [
    deal({ brandName: "Late LLC", stage: "invoiced", amountCents: 40000, invoiceDue: "2026-11-01", invoiceSentOn: "2026-10-01" }),
    deal({ brandName: "Glow Co", amountCents: 50000, paidOn: "2026-08-01" }),
    deal({ brandName: "Quiet Inc", stage: "negotiating", amountCents: 20000, lastContact: "2026-11-01", paidOn: null }),
  ];
  const e = buildGrowthEngine({ ...base, deals, neglectedCount: 3, savedCount: 5 });
  check("brain: money first", e.brain[0].stage, "revenue");
  check("brain: overdue title carries the amount", e.brain[0].title, "Collect $400 overdue");
  check("brain: win-back second", e.brain[1].stage, "retention");
  check("brain: quiet deal third", e.brain[2].stage, "collaboration");
  check("brain: neglected fourth", e.brain[3].stage, "discovery");
  check("brain: capped at four", e.brain.length, 4);
  check("engine: repeat rate 0 of 1 customers", e.repeatRatePct, 0);
  check("engine: retention metric counts follow-ups", e.stages[5].metric, "1 follow-up due");
  check("engine: revenue detail carries overdue", e.stages[4].detail.includes("$400 overdue"), true);
  check("engine: collab metric counts active only", e.stages[1].metric, "2 active partnerships");
}

/* ------------------------- surfaces (source) ------------------------- */
{
  const today = readFileSync("app/today/page.tsx", "utf8");
  check("surface: Home renders the engine section", today.includes("<EngineSection engine={engine} />"), true);
  check("surface: Home builds the engine from real rows", today.includes("buildGrowthEngine({"), true);
  const section = readFileSync("components/EngineSection.tsx", "utf8");
  check("surface: Brain panel leads the section", section.includes("Brain — next best actions"), true);
  check("surface: six stage cards render from the engine", section.includes("engine.stages.map"), true);
  const customers = readFileSync("app/customers/page.tsx", "utf8");
  check("surface: /customers is gated + derives from deals", customers.includes('requireSubscription("/customers")') && customers.includes("engineCustomers(deals)"), true);
  const retention = readFileSync("app/retention/page.tsx", "utf8");
  check("surface: /retention is gated + honest about automation", retention.includes('requireSubscription("/retention")') && retention.includes("Nothing is sent automatically"), true);
}

console.log(failures === 0 ? "ENGINE FIXTURES: ALL PASS" : `ENGINE FIXTURES: ${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
