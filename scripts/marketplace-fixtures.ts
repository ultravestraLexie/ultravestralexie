// ============================================================================
// Local-gigs market (owner order 2026-11-24) — acceptance fixtures.
//
// Pins, in order:
//   1. Landing branding + content: the prototype start screen with
//      the product named UltraVestra — the prototype's product name
//      appears NOWHERE in the new code — and the four role cards
//      wired to their real routes.
//   2. Register ?type= preselect resolution (pure helper).
//   3. The seed data, verbatim from the prototype.
//   4. The payout math for all three pay models (flat / per-result /
//      product+fee), pay text, promo codes, builder budget totals.
//   5. The collab status machine's transitions.
//   6. Follow-up generation from the four automations + template
//      filling + mark-done, and the business-home strip numbers.
//   7. Placement/honesty wiring: the section lives on /brands, the
//      profile on /me/marketplace, the tools under /business, the
//      customers honesty line is present verbatim, and none of the
//      new client code touches Supabase (device-local store only).
//   8. The rate limiter is untouched (md5 pinned by the build spec).
//
// Run (from the repo root):
//   npx tsx scripts/marketplace-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { businessTypeFromParam } from "../lib/business-registration";
import {
  DAY,
  MARKET_STORAGE_KEY,
  STATUS,
  STEP,
  acceptCollab,
  applyToOpp,
  approveCollab,
  bizById,
  budgetTotal,
  counterCollab,
  creatorById,
  dashboardNumbers,
  declineCollab,
  demoStats,
  fillMsg,
  followUps,
  inviteCreator,
  markCollabPaid,
  markFollowUpDone,
  oppById,
  parseMarketState,
  payText,
  payout,
  postCollab,
  potentialOf,
  promoCode,
  requestChanges,
  seedMarketState,
  submitCollab,
  type MarketCollab,
  type MarketState,
} from "../lib/marketplace";

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

/** JSX source wraps long copy across lines; the rendered text is
 *  what the verbatim checks pin, so compare whitespace-collapsed. */
function flat(s: string): string {
  return s.replace(/\s+/g, " ");
}

const NOW = Date.UTC(2026, 10, 24, 15, 0, 0);
const fresh = (): MarketState => seedMarketState(NOW);
const clone = (s: MarketState): MarketState => JSON.parse(JSON.stringify(s));

// --- 1. Landing branding + content -----------------------------------------

const landing = read("app/page.tsx");
check("landing H1 first phrase", landing.includes("Where attention"), true);
check("landing H1 gradient phrase", landing.includes("becomes customers."), true);
check(
  "landing hero paragraph verbatim",
  flat(landing).includes(
    "Creators turn their talent for attention into income. Local businesses get real content, real customers and the tools to keep them coming back. You don’t need millions of followers to matter."
  ),
  true
);
check("landing gold label is UltraVestra", landing.includes(">UltraVestra<") || landing.includes("UltraVestra\n"), true);
check(
  "landing loop chips in order",
  ["Discovery", "Collaboration", "Marketing", "Customers", "Revenue", "Retention"].every((w) =>
    landing.includes(`"${w}"`)
  ),
  true
);
check("landing creator card route", landing.includes('href: "/roles/creator"'), true);
check("landing business card route", landing.includes('href: "/roles/business"'), true);
check("landing agency card route", landing.includes('href: "/roles/agency"'), true);
check("landing brand card route", landing.includes('href: "/roles/brand"'), true);
check(
  "landing role copy verbatim (creator)",
  landing.includes("Find paid local gigs, get paid on time, and prove the customers you bring."),
  true
);
check(
  "landing role copy verbatim (agency, no Phase 5)",
  landing.includes("Manage creators, campaigns and clients in one place.") && !landing.includes("Phase 5"),
  true
);
check(
  "landing note line",
  landing.includes("Creators join free with a plan. Brands and agencies register free"),
  true
);
check(
  "landing footer line",
  landing.includes("POWERED BY ULTRA VESTRA · CREATE. GROW. BUILD."),
  true
);
check("landing orbit nodes", ["CREATORS", "BUSINESSES", "BRANDS", "AGENCIES", "CONNECTS"].every((w) => landing.includes(w)), true);

const NEW_FILES = [
  "app/page.tsx",
  "lib/marketplace.ts",
  "lib/marketplace-css.ts",
  "components/marketplace/Mkt.tsx",
  "app/brands/LocalOpportunities.tsx",
  "app/me/marketplace/page.tsx",
  "app/me/marketplace/MarketProfileClient.tsx",
  "app/business/campaigns/page.tsx",
  "app/business/campaigns/CampaignsClient.tsx",
  "app/business/creators/page.tsx",
  "app/business/creators/CreatorsClient.tsx",
  "app/business/customers/page.tsx",
  "app/business/customers/CustomersClient.tsx",
  "app/business/home/MarketStrip.tsx",
  "app/business/home/page.tsx",
  "lib/business-guard.ts",
];
for (const f of NEW_FILES) {
  check(`no prototype product name in ${f}`, read(f).includes("Marketplace"), false);
}

// --- 2. Register preselect ---------------------------------------------------

check("preselect brand", businessTypeFromParam("brand"), "brand");
check("preselect agency", businessTypeFromParam("agency"), "agency");
check("preselect creator is none", businessTypeFromParam("creator"), null);
check("preselect absent is none", businessTypeFromParam(undefined), null);
check("preselect case-sensitive", businessTypeFromParam("BRAND"), null);
check("preselect repeated param is none", businessTypeFromParam(["brand", "agency"]), null);
check("preselect garbage is none", businessTypeFromParam("brand "), null);
const registerPage = read("app/business/register/page.tsx");
check("register page resolves the param", registerPage.includes("businessTypeFromParam"), true);
check("register form accepts initialType", read("app/business/register/register-form.tsx").includes("initialType"), true);

// --- 3. Seed data verbatim ---------------------------------------------------

const seed = fresh();
check("store key", MARKET_STORAGE_KEY, "uv-market.v1");
check("seed is labeled sample", seed.sample, true);
check("seed my business is Rosa's (b1)", seed.myBiz, "b1");
check(
  "seed businesses verbatim",
  seed.businesses.map((b) => b.name),
  ["Rosa’s Taqueria", "Fade Kings Barbershop", "Thread & Co. Boutique", "Iron Ridge Gym", "Glow Skin Studio", "Casa Verde Realty"]
);
check(
  "seed opportunities o1-o8 with the two closed ones closed",
  seed.opps.map((o) => `${o.id}:${o.status}`),
  ["o1:open", "o2:open", "o3:open", "o4:open", "o5:open", "o6:open", "o7:closed", "o8:closed"]
);
check(
  "seed creators verbatim",
  seed.creators.map((c) => c.handle),
  ["@maya.makes", "@jay.creates", "@lena.ugc", "@coco.films", "@dre.unboxes", "@sam.cooks", "@nia.reviews", "@tre.lifts"]
);
check(
  "seed collabs verbatim",
  seed.collabs.map((c) => `${c.id}:${c.status}`),
  ["c1:live", "c2:submitted", "c3:applied", "c4:live", "c5:accepted", "c6:live"]
);
check("seed me profile", [seed.me.handle, seed.me.area, seed.me.followers, seed.me.rate], ["@yourhandle", "Eastside", 2400, 120]);
check(
  "seed automation templates verbatim",
  [seed.automations.estimate.text, seed.automations.winback.text],
  [
    "Hi {first}, it’s {business}. Just checking in on your {what} quote. Any questions? Happy to help.",
    "Hi {first}, we miss you at {business}! Here’s {offer}. Just show this text when you come in.",
  ]
);
check("parse of garbage reseeds", parseMarketState({ nope: true }, NOW).businesses.length, 6);
check("parse of a stored state keeps it", parseMarketState(seed, NOW) === seed, true);
check("parse of null reseeds", parseMarketState(null, NOW).v, 1);

// --- 4. Payout math ------------------------------------------------------------

const o1 = oppById(seed, "o1");
const o2 = oppById(seed, "o2");
const o3 = oppById(seed, "o3");
const o4 = oppById(seed, "o4");
check("payText flat long", payText(o1), "$150 per video · 3 videos ($450)");
check("payText flat short", payText(o1, true), "$150 per video");
check("payText per-result", payText(o2), "$50 + $10 per booked cut");
check("payText product+fee", payText(o3), "$200 + $150 store credit");
check("payout flat = rate x videos", payout(seed, seed.collabs[0]), 450);
const perResultCollab: MarketCollab = {
  id: "cx",
  opp: "o4",
  cr: "p2",
  status: "live",
  rate: 100,
  stats: { views: 1, clicks: 1, leads: 1, customers: 10, revenue: 1 },
  ts: NOW,
};
check("payout per-result = base + per x customers", payout(seed, perResultCollab), 350);
const productCollab: MarketCollab = { id: "cy", opp: "o3", cr: "p3", status: "live", rate: 200, stats: { views: 9, clicks: 9, leads: 9, customers: 99, revenue: 9 }, ts: NOW };
check("payout product+fee = the fee only", payout(seed, productCollab), 200);
check("payout per-result with no stats yet = base", payout(seed, { id: "cz", opp: "o2", cr: "p1", status: "accepted", rate: 50, ts: NOW }), 50);
check("potential per-result counts 10 results", potentialOf(o2), 150);
check("budget flat = rate x videos x spots", budgetTotal({ model: "flat", rate: 120, videos: 2, spots: 3 }), 720);
check("budget per-result = rate x spots", budgetTotal({ model: "perResult", rate: 120, videos: 2, spots: 3 }), 360);
check("budget product+fee = fee x spots", budgetTotal({ model: "productFee", rate: 200, videos: 4, spots: 2 }), 400);
check("promo code for me on o4 (no digits -> VIP)", promoCode(creatorById(seed, "me"), o4), "YOURHVIP");
check("promo code for Coco on o1", promoCode(creatorById(seed, "p4"), o1), "COCOF15");
const ds1 = demoStats(seed, seed.collabs[0]);
const ds2 = demoStats(seed, seed.collabs[0]);
check("demo stats are deterministic", ds1, ds2);
check("demo stats revenue = customers x avg sale", ds1.revenue, ds1.customers * bizById(seed, "b1").avgSale);

// --- 5. Collab transitions -----------------------------------------------------

check("status labels", [STATUS.invited[0], STATUS.countered[0], STATUS.accepted[0], STATUS.live[0]], ["Invited", "Counter offer", "Creating", "Live"]);
check(
  "step order apply<agree<create<review<post",
  STEP.applied < STEP.countered && STEP.countered < STEP.accepted && STEP.accepted < STEP.submitted && STEP.submitted < STEP.approved && STEP.approved < STEP.live,
  true
);

{
  const s = fresh();
  const c = applyToOpp(s, "o2", { ask: 80, msg: "I can film this week.", passport: true }, NOW);
  check("apply creates an applied collab for me", [c.status, c.cr, c.rate, c.ask, c.by], ["applied", "me", 50, 80, "creator"]);
  check("apply assigns a promo code", typeof c.code === "string" && (c.code as string).length > 0, true);
  check("apply appends to the store", s.collabs.length, seed.collabs.length + 1);
}
{
  const s = fresh();
  const c3 = s.collabs.filter((x) => x.id === "c3")[0];
  acceptCollab(s, "c3", NOW);
  check("business accept takes the ask as the rate", [c3.status, c3.rate], ["accepted", 300]);
}
{
  const s = fresh();
  counterCollab(s, "c3", 225, "business", NOW);
  const c3 = s.collabs.filter((x) => x.id === "c3")[0];
  check("business counter -> countered with their ask", [c3.status, c3.ask, c3.by], ["countered", 225, "business"]);
  counterCollab(s, "c3", 260, "creator", NOW);
  check("creator counter -> back to applied with their ask", [c3.status, c3.ask, c3.by], ["applied", 260, "creator"]);
}
{
  const s = fresh();
  const inv = inviteCreator(s, "o1", "p7", { rate: 150, msg: "Want in?" }, NOW);
  check("invite creates an invited collab", [inv.status, inv.cr, inv.ask, inv.by], ["invited", "p7", 150, "business"]);
  acceptCollab(s, inv.id, NOW);
  check("invited accept -> accepted at the invited rate", [inv.status, inv.rate], ["accepted", 150]);
}
{
  const s = fresh();
  const c5 = s.collabs.filter((x) => x.id === "c5")[0];
  submitCollab(s, "c5", { video: "https://example.com/draft", caption: "My class at Iron Ridge" }, NOW);
  check("submit -> submitted with video + caption", [c5.status, c5.video, c5.caption], ["submitted", "https://example.com/draft", "My class at Iron Ridge"]);
  requestChanges(s, "c5", "Show the price on screen.", NOW);
  check("request changes -> changes with the note", [c5.status, c5.note], ["changes", "Show the price on screen."]);
  submitCollab(s, "c5", { video: "https://example.com/v2", caption: "v2" }, NOW);
  check("resubmit clears the note", [c5.status, c5.note], ["submitted", null]);
  approveCollab(s, "c5", NOW);
  check("approve -> approved", c5.status, "approved");
  postCollab(s, "c5", "https://example.com/post", NOW);
  check("post -> live with tracking stats", [c5.status, typeof c5.stats?.customers], ["live", "number"]);
  markCollabPaid(s, "c5", NOW);
  check("mark paid sets paid + paidAt", [c5.paid, c5.paidAt], [true, NOW]);
}
{
  const s = fresh();
  declineCollab(s, "c3", NOW);
  check("decline -> declined", s.collabs.filter((x) => x.id === "c3")[0].status, "declined");
}

// --- 6. Follow-up generation ---------------------------------------------------

{
  const s = fresh();
  const fus = followUps(s, NOW);
  const keys = fus.map((f) => `${f.customer.id}:${f.type}`);
  check("estimate due for the uncontacted 3-day-old lead (k3)", keys.includes("k3:estimate"), true);
  check("no estimate for the already-contacted lead (k7)", keys.includes("k7:estimate"), false);
  check("no estimate for the 1-day-old lead (k12)", keys.includes("k12:estimate"), false);
  check("winback due at 75 days away (k2)", keys.includes("k2:winback"), true);
  check("winback due at 95 days away (k8)", keys.includes("k8:winback"), true);
  check("no winback at 5 days away (k5)", keys.includes("k5:winback"), false);
  check("review due for yesterday's visit (k6)", keys.includes("k6:review"), true);
  check("no review when already asked (k11)", keys.includes("k11:review"), false);
  check(
    "estimate message fills {first} {business} {what}",
    fillMsg(s, s.automations.estimate.text, s.customers.filter((k) => k.id === "k3")[0]),
    "Hi Priya, it’s Rosa’s Taqueria. Just checking in on your catering for 40 people quote. Any questions? Happy to help."
  );
  check(
    "review message fills {review}",
    fillMsg(s, s.automations.review.text, s.customers.filter((k) => k.id === "k1")[0]),
    "Thanks for visiting Rosa’s Taqueria, Ana! If you enjoyed it, a quick review would mean a lot: [YOUR REVIEW LINK]"
  );
  check(
    "winback message fills {offer}",
    fillMsg(s, s.automations.winback.text, s.customers.filter((k) => k.id === "k2")[0]),
    "Hi Marcus, we miss you at Rosa’s Taqueria! Here’s 15% off your next order. Just show this text when you come in."
  );
  const est = fus.filter((f) => f.customer.id === "k3")[0];
  markFollowUpDone(s, est, NOW);
  check("marking an estimate done stamps the lead contacted", s.customers.filter((k) => k.id === "k3")[0].lead?.contacted, NOW);
  check(
    "a done follow-up leaves the due list",
    followUps(s, NOW).some((f) => f.customer.id === "k3" && f.type === "estimate"),
    false
  );
}
{
  // Precision boundaries on synthetic customers.
  const s = fresh();
  const base = {
    phone: "",
    email: "",
    consent: true,
    source: "Walk-in",
    visits: 1,
    spend: 10,
    created: NOW - 90 * DAY,
  };
  s.customers = [
    { ...base, id: "t1", name: "Soon Appt", nextAppt: NOW + 12 * 36e5, apptWhat: "cut" },
    { ...base, id: "t2", name: "Far Appt", nextAppt: NOW + 30 * 36e5, apptWhat: "cut" },
    { ...base, id: "t3", name: "Reminded", nextAppt: NOW + 12 * 36e5, reminded: true },
    { ...base, id: "t4", name: "Recent Winback", lastVisit: NOW - 90 * DAY, winbackAt: NOW - 10 * DAY },
  ];
  const keys = followUps(s, NOW).map((f) => `${f.customer.id}:${f.type}`);
  check("reminder due inside the 24h window", keys.includes("t1:reminder"), true);
  check("no reminder outside the 24h window", keys.includes("t2:reminder"), false);
  check("no reminder once reminded", keys.includes("t3:reminder"), false);
  check("no winback within 30 days of the last one", keys.includes("t4:winback"), false);
  s.automations.reminder.on = false;
  check(
    "a switched-off automation generates nothing",
    followUps(s, NOW).some((f) => f.type === "reminder"),
    false
  );
}
{
  const s = fresh();
  const n = dashboardNumbers(s, NOW);
  check("strip: active campaigns = open opps of myBiz (o1 only)", n.activeCampaigns, 1);
  check("strip: applicants waiting = applied + submitted for myBiz", n.applicantsWaiting, 2);
  check("strip: follow-ups due matches the generator", n.followUpsDue, followUps(s, NOW).length);
}

// --- 7. Placement + honesty wiring ----------------------------------------------

check("brands page renders Local opportunities below the directory", read("app/brands/page.tsx").includes("<LocalOpportunities />"), true);
check("me links the Local gigs profile card", read("app/me/page.tsx").includes('href: "/me/marketplace"') && read("app/me/page.tsx").includes("Local gigs profile"), true);
check("me profile sub-route is subscription-gated", read("app/me/marketplace/page.tsx").includes('requireSubscription("/me/marketplace")'), true);
check(
  "business sub-routes self-guard",
  ["campaigns", "creators", "customers"].every((r) =>
    read(`app/business/${r}/page.tsx`).includes(`requireBusinessAccount("/business/${r}")`)
  ),
  true
);
check(
  "customers honesty line verbatim",
  read("app/business/customers/CustomersClient.tsx").includes(
    "Preview — runs on this device. Templates only; no messages are sent."
  ),
  true
);
check(
  "business home carries the strip + truthful status copy",
  read("app/business/home/page.tsx").includes("<MarketStrip />") &&
    read("app/business/home/page.tsx").includes("on-device preview of the local-gigs tools") &&
    read("app/business/home/page.tsx").includes("no messages are sent"),
  true
);
const CLIENT_FILES = [
  "app/brands/LocalOpportunities.tsx",
  "app/me/marketplace/MarketProfileClient.tsx",
  "app/business/campaigns/CampaignsClient.tsx",
  "app/business/creators/CreatorsClient.tsx",
  "app/business/customers/CustomersClient.tsx",
  "app/business/home/MarketStrip.tsx",
  "components/marketplace/Mkt.tsx",
  "lib/marketplace.ts",
];
check(
  "no new market code touches Supabase (device-local only)",
  CLIENT_FILES.every((f) => !read(f).includes("supabase")),
  true
);
check(
  "sample banner text ships in the shared components",
  flat(read("components/marketplace/Mkt.tsx")).includes(
    "Sample data: every business, creator, customer and number here is made up to show how it works."
  ),
  true
);

// --- 8. Rate limiter untouched ----------------------------------------------------

check(
  "rate limiter md5 unchanged",
  createHash("md5").update(readFileSync("lib/rate-limit.ts")).digest("hex"),
  "17bac7184f8c9a015891e0287df539de"
);

if (failures > 0) {
  console.log(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll local-gigs market assertions passed.");
