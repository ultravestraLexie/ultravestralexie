// ============================================================================
// Marketplace v2 home pages (owner order 2026-11-24, the v2 prototype
// file) — acceptance fixtures.
//
// Pins, in order:
//   1. The v2 seed: counts, the brand + agency additions, and the
//      network's determinism (the prototype's own LCG, ported
//      line-for-line — two seeds at the same instant are identical,
//      and the first/last generated creators match pinned values).
//   2. calcStats determinism + the agency/brand collab sets, payouts,
//      dashboard totals (agency earned/commission, brand revenue/
//      spend) computed from the seed.
//   3. matchOpp v2: the local branch, the brand branch (cities/tiers)
//      and the follower warning.
//   4. The collab transitions on the v2 store (apply, pitch, accept,
//      counter) and parse/roundtrip.
//   5. Placement/honesty wiring: the creator home tabs, the business
//      home's three dashboard views, MarketStrip gone, the landing's
//      new role descriptions, and no Supabase anywhere in the new
//      code (device-local stores only). The product is never named
//      "Vestra Marketplace" in the new files.
//
// Run (from the repo root):
//   npx tsx scripts/marketplace2-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { existsSync, readFileSync } from "node:fs";
import {
  MARKET2_STORAGE_KEY,
  acceptCollab2,
  agencyCollabs2,
  applyToOpp2,
  brandCollabs2,
  calcStats,
  counterCollab2,
  creatorById2,
  matchOpp2,
  oppById2,
  parseMarket2State,
  payout2,
  pitchCollab2,
  seedMarket2State,
  spendOf2,
  sumStats2,
  type M2State,
} from "../lib/marketplace2";

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

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function flat(s: string): string {
  return s.replace(/\s+/g, " ");
}

const NOW = Date.UTC(2026, 10, 24, 15, 0, 0);
const fresh = (): M2State => seedMarket2State(NOW);
const clone = (s: M2State): M2State => JSON.parse(JSON.stringify(s));

// --- 1. Seed -----------------------------------------------------------------

const s = fresh();
check("storage key", MARKET2_STORAGE_KEY, "uv-market.v2");
check("seed counts [biz, opps, creators, network, customers, collabs, ambassadors]",
  [s.businesses.length, s.opps.length, s.creators.length, s.network.length, s.customers.length, s.collabs.length, s.ambassadors.length],
  [7, 10, 8, 36, 12, 38, 2]);
check("brand is r1 Aurelia Skin Co.", [s.businesses[6].id, s.businesses[6].name, s.businesses[6].type], ["r1", "Aurelia Skin Co.", "brand"]);
check("agency seed", [s.agency.name, s.agency.fee, s.agency.roster, s.agency.clients],
  ["Northstar Creator Co.", 15, ["p1", "p4", "p7", "p8"], ["b2", "b4"]]);
check("network deterministic across seeds", JSON.stringify(fresh().network), JSON.stringify(s.network));
check("network[0] pinned", s.network[0],
  { id: "n1", handle: "@ava.glow", name: "Ava", niches: ["Family"], area: "Chicago", followers: 1200, eng: 10.6, views: 1519, done: 3, onTime: 98, rate: 110 });
check("network[35] pinned", s.network[35],
  { id: "n36", handle: "@rory.tries", name: "Rory", niches: ["Family"], area: "Miami", followers: 213754, eng: 2, views: 53741, done: 57, onTime: 98, rate: 3410 });
check("ambassadors are the fall campaign's top two by return", s.ambassadors.map((a) => a.cr), ["n10", "n12"]);
check("ambassador terms", [s.ambassadors[0].retainer, s.ambassadors[0].posts, s.ambassadors[1].retainer, s.ambassadors[1].posts], [500, 4, 400, 3]);
check("winter applied pitch pinned (cw25)", (() => { const c = s.collabs.filter((x) => x.id === "cw25")[0]; return [c.status, c.ask, c.code, c.msg]; })(),
  ["applied", 810, "HUGOD20", "I’d love to do this! My winter routine videos average 47K views. My rate is $810 plus the set."]);

// --- 2. Stats, sets, totals ----------------------------------------------------

const p8 = s.creators[7];
check("calcStats pinned (c8)", calcStats(p8, 2, 49, "c8"), { views: 8029, clicks: 255, leads: 54, customers: 30, revenue: 1470 });
check("calcStats deterministic", calcStats(p8, 2, 49, "c8"), calcStats(p8, 2, 49, "c8"));
check("agency collab set", agencyCollabs2(s).map((c) => c.id), ["c7", "c8", "c9", "c10", "c11"]);
check("brand collab count", brandCollabs2(s).length, 26);
const c8 = s.collabs.filter((x) => x.id === "c8")[0];
check("per-result payout (c8: 140 + 25 × 30 customers)", payout2(s, c8), 890);
const ac = agencyCollabs2(s);
const earned = ac.filter((c) => c.paid).reduce((t, c) => t + payout2(s, c), 0);
check("agency earned + 15% commission", [earned, (earned * s.agency.fee) / 100], [890, 133.5]);
const bc = brandCollabs2(s);
check("brand live totals", sumStats2(bc.filter((c) => c.stats)), { views: 454172, clicks: 11174, leads: 2347, customers: 1292, revenue: 54264 });
check("brand spend", spendOf2(s, bc), 13100);

// --- 3. Matching (v2 branches) -------------------------------------------------

const me = creatorById2(s, "me");
const m1 = matchOpp2(s, oppById2(s, "o1"), me);
check("match local best case (o1)", [m1.score, m1.warn], [99, null]);
const m9 = matchOpp2(s, oppById2(s, "o9"), me);
check("match brand branch (o9: anywhere + tier fits)", [m9.score, m9.warn], [72, null]);
const m6 = matchOpp2(s, oppById2(s, "o6"), me);
check("match follower warning (o6)", [m6.score, m6.warn], [30, "Needs 5K+ followers"]);

// --- 4. Transitions + parse ------------------------------------------------------

const t1 = fresh();
const applied = applyToOpp2(t1, "o3", { ask: 200, msg: "Love the winter drop.", passport: true }, NOW);
check("apply creates an applied collab for me", [applied.cr, applied.status, applied.ask, applied.passport], ["me", "applied", 200, true]);
const t2 = fresh();
const pitched = pitchCollab2(t2, "o1", "p4", { ask: 90, msg: "Pitching Coco." }, NOW);
check("agency pitch routes via the agency", [pitched.via, pitched.status, pitched.cr], ["agency", "applied", "p4"]);
check("pitched collab joins the agency set", agencyCollabs2(t2).some((c) => c.id === pitched.id), true);
const t3 = fresh();
acceptCollab2(t3, "c10", NOW);
const c10 = t3.collabs.filter((x) => x.id === "c10")[0];
check("accept settles at the ask", [c10.status, c10.rate], ["accepted", 60]);
const t4 = fresh();
counterCollab2(t4, "c7", 70, "creator", NOW);
const c7 = t4.collabs.filter((x) => x.id === "c7")[0];
check("creator-side counter returns to applied with the ask", [c7.status, c7.ask, c7.by], ["applied", 70, "creator"]);
check("parse roundtrip", parseMarket2State(JSON.parse(JSON.stringify(s)), NOW).collabs.length, 38);
check("parse garbage reseeds", parseMarket2State({ nope: true }, NOW).v, 2);
check("parse v1 shape reseeds", parseMarket2State({ v: 1 }, NOW).network.length, 36);

// --- 5. Wiring -------------------------------------------------------------------

const creatorHome = read("app/me/marketplace/CreatorMarketHome.tsx");
check("creator home has the three tabs", ["Discover", "My collabs", "Profile"].every((w) => creatorHome.includes(w)), true);
check("creator home Discover head verbatim", flat(creatorHome).includes("Business opportunities") && flat(creatorHome).includes("Local businesses looking for creators like you. Small audiences welcome."), true);
check("creator home opp detail sections", ["Why you match", "The brief", "How you’re protected", "Apply for this opportunity"].every((w) => creatorHome.includes(w)), true);
check("me/marketplace page renders the creator home", read("app/me/marketplace/page.tsx").includes("<CreatorMarketHome />"), true);
check("profile editor embedded as the Profile tab", creatorHome.includes("<MarketProfileClient embedded />"), true);

const marketHome = read("app/business/home/MarketHome.tsx");
check("business home has the three views", ["BusinessDash", "AgencyDash", "BrandDash"].every((w) => marketHome.includes(w)), true);
check("business view sections", ["Creator campaigns, all time", "From attention to revenue", "Retention: do they come back?", "Top creators for you"].every((w) => marketHome.includes(w)), true);
check("agency view sections", ["Your agency, all time", "Needs your attention", "Top earners on your roster", "Pitch your roster"].every((w) => marketHome.includes(w)), true);
check("brand view sections", ["Running now", "Which creators pay off", "Revenue by city", "Top performers", "Make ambassador"].every((w) => marketHome.includes(w)), true);
check("MarketStrip is gone", existsSync("app/business/home/MarketStrip.tsx"), false);
check("business home page renders the dashboard", read("app/business/home/page.tsx").includes("<MarketHome accountType={accountType} />"), true);

const landing = read("app/page.tsx");
check("landing agency card takes the new prototype's words", flat(landing).includes("Represent creators, pitch them to opportunities, and run campaigns for your clients."), true);
check("landing brand card takes the new prototype's words", flat(landing).includes("Run campaigns with dozens of creators across cities, and keep your best as ambassadors."), true);

const NEW_FILES = [
  "lib/marketplace2.ts",
  "lib/marketplace2-css.ts",
  "components/marketplace2/Mkt2.tsx",
  "app/me/marketplace/CreatorMarketHome.tsx",
  "app/business/home/MarketHome.tsx",
];
check("no new v2 code touches Supabase (device-local only)", NEW_FILES.every((f) => !read(f).includes("supabase")), true);
check("product never named 'Vestra Marketplace' in new files", NEW_FILES.every((f) => !read(f).includes("Vestra Marketplace")), true);
check("sample collabs never write creator_deals", NEW_FILES.every((f) => !read(f).includes('from("creator_deals")') && !read(f).includes("from('creator_deals')")), true);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
