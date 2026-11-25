// ============================================================================
// Creator Economy — acceptance fixtures (the owner's "Ultra Vestra
// Creator Economy" prototype ported into Me, 2026-11-24).
//
// Two frames were skipped as duplicates (Passport, Creator DNA card);
// six were built behind Me on sub-routes. Their pure logic lives in
// lib/galaxy/economy and is pinned here:
//
//  - WHAT IF: the prototype's decision simulator, ported line-for-line.
//    Every expected value below was derived by RUNNING the prototype's
//    own code on its default inputs (all four scenarios, all three
//    outcome variants), so the pins lock the port to the prototype's
//    exact math and wording — including its summary sentences.
//  - LEVELS + YEAR IN REVIEW: computed from real deals (paid stage,
//    core's dealPaidCents). Pins cover the empty account (honest
//    zeros), the both-requirements tier rule, and milestone months.
//  - INVITE / CHALLENGES / HALL OF FAME: the prototype's modeled
//    state — reward statuses derive from the joined count exactly as
//    the prototype presents them; the Hall boards are its sample
//    rows, verbatim.
//
// Run (from the repo root):
//   npx tsx scripts/economy-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import type { GalaxyDeal } from "../lib/galaxy/core";
import {
  CHALLENGE_FRIENDS,
  CHALLENGE_WEEK,
  HOF,
  HOF_ORDER,
  INVITE_GOAL,
  INVITE_MODEL_JOINED,
  INVITE_REWARDS,
  LEVEL_TIERS,
  MORE_CHALLENGES,
  WI_DISCLAIMER,
  WI_SCENARIOS,
  computeLevel,
  hofInitials,
  inviteProgress,
  inviteRewardStatus,
  levelFacts,
  levelMilestones,
  levelNextText,
  weekEndsIn,
  wiCatchUp,
  wiCatchUpText,
  wiDefaults,
  wiFmt,
  wiMoney,
  wiMoneyShort,
} from "../lib/galaxy/economy";

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

const round2 = (n: number) => Math.round(n * 100) / 100;
const endOf = (arr: number[]) => round2(arr[arr.length - 1]);

/* ------------------------------ What If ------------------------------ */

check("wi money: thousands", wiMoney(6480), "$6,480");
check("wi money: hundred-thousands", wiMoney(713000), "$713,000");
check("wi money: negative", wiMoney(-610750), "-$610,750");
check("wi money: millions, 1dp", wiMoney(1234567), "$1.2M");
check("wi money: millions, 0dp at 10M+", wiMoney(10000000), "$10M");
check("wi money: zero", wiMoney(0), "$0");
check("wi moneyShort: 102250", wiMoneyShort(102250), "$102K");
check("wi moneyShort: 713000", wiMoneyShort(713000), "$713K");
check("wi moneyShort: negative rounds", wiMoneyShort(-610750), "-$611K");
check("wi moneyShort: under 1K", wiMoneyShort(950), "$950");
check("wi moneyShort: 1.5K", wiMoneyShort(1500), "$1.5K");
check("wi moneyShort: millions", wiMoneyShort(2500000), "$2.5M");
check("wi fmt: $", wiFmt(300, "$"), "$300");
check("wi fmt: $/yr", wiFmt(50000, "$/yr"), "$50,000/yr");
check("wi fmt: $/mo", wiFmt(800, "$/mo"), "$800/mo");
check("wi fmt: years plural", wiFmt(5, "yr"), "5 years");
check("wi fmt: year singular", wiFmt(1, "yr"), "1 year");
check("wi fmt: months", wiFmt(6, "mo"), "6 months");
check("wi fmt: %/yr", wiFmt(5, "%/yr"), "5% a year");
check("wi fmt: %/mo", wiFmt(4, "%/mo"), "4% a month");
check("wi catchUp: crosses after behind", wiCatchUp([0, 10, 20, 30], [0, 5, 15, 35]), 4);
check("wi catchUp: never behind", wiCatchUp([0, 10], [0, 20]), 0);
check("wi catchUp: never catches", wiCatchUp([0, 10, 20], [0, 5, 15]), -1);
check("wi catchUpText: month 16", wiCatchUpText(16, 5), "You’d catch up in month 16 (year 2).");
check("wi catchUpText: ahead", wiCatchUpText(0, 5), "This path is ahead from the start.");
check("wi catchUpText: never", wiCatchUpText(-1, 5), "You wouldn’t catch up within 5 years at these numbers.");
check(
  "wi disclaimer: verbatim",
  WI_DISCLAIMER,
  "Estimates from the numbers you enter, not predictions or financial advice. Growth rates are your own assumptions."
);
check("wi defaults: creator", wiDefaults("creator"), { job: 55000, side: 800, growth: 4, years: 5 });

{
  const sc = WI_SCENARIOS.save;
  const v = wiDefaults("save");
  check("wi save: question", sc.q(v), "What if I save $300 every month?");
  const mid = sc.run(v, sc.variants[1]);
  check("wi save: stay stays at the start balance", mid.stay, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  check("wi save: expected end", endOf(mid.what), 46584.68);
  check("wi save: year 1", round2(mid.what[1]), 3683.66);
  check(
    "wi save: summary",
    mid.summary,
    "You’d put in $36,000, and growth adds about $10,585 at 5% a year."
  );
  check("wi save: extra", mid.extra, "You’d have $300 less to spend each month ($3,600 a year).");
  check("wi save: cautious end", endOf(sc.run(v, sc.variants[0]).what), 41922.43);
  check("wi save: optimistic end", endOf(sc.run(v, sc.variants[2]).what), 51925.44);
  check("wi save: variant labels", WI_SCENARIOS.save.variants.map((k) => sc.variantLabel(v, k)), [
    "3% a year",
    "5% a year",
    "7% a year",
  ]);
}

{
  const sc = WI_SCENARIOS.career;
  const v = wiDefaults("career");
  const mid = sc.run(v, sc.variants[1]);
  check("wi career: stay end", endOf(mid.stay), 250000);
  check("wi career: expected end", endOf(mid.what), 324500);
  check("wi career: starts at minus training", mid.what[0], -3000);
  check(
    "wi career: summary",
    mid.summary,
    "Switching costs about $15,500 up front: training plus 6 months at 50% pay."
  );
  check("wi career: extra", mid.extra, "You’d catch up in month 16 (year 2).");
  check("wi career: cautious end", endOf(sc.run(v, sc.variants[0]).what), 277250);
  check("wi career: optimistic end", endOf(sc.run(v, sc.variants[2]).what), 371750);
  check("wi career: variant labels", sc.variants.map((k) => sc.variantLabel(v, k)), [
    "Pays 15% less",
    "As expected",
    "Pays 15% more",
  ]);
}

{
  const sc = WI_SCENARIOS.move;
  const v = wiDefaults("move");
  const mid = sc.run(v, sc.variants[1]);
  check("wi move: stay end", endOf(mid.stay), 60000);
  check("wi move: expected end", endOf(mid.what), 84000);
  check(
    "wi move: summary",
    mid.summary,
    "Each month you’d keep $500 more after living costs, after paying $6,000 to move."
  );
  check("wi move: extra", mid.extra, "You’d catch up in month 12 (year 1).");
  check("wi move: higher-costs end", endOf(sc.run(v, sc.variants[0]).what), 72000);
  check("wi move: lower-costs end", endOf(sc.run(v, sc.variants[2]).what), 96000);
  check("wi move: variant labels", sc.variants.map((k) => sc.variantLabel(v, k)), [
    "Costs 10% higher",
    "As expected",
    "Costs 10% lower",
  ]);
}

{
  const sc = WI_SCENARIOS.creator;
  const v = wiDefaults("creator");
  check("wi creator: question", sc.q(v), "What if I go full-time as a creator?");
  const mid = sc.run(v, sc.variants[1]);
  check("wi creator: stay end", endOf(mid.stay), 323000);
  check("wi creator: expected end", endOf(mid.what), 102249.89);
  check(
    "wi creator: summary",
    mid.summary,
    "Keeping your job counts your current creator income as a side income. Full-time, it would reach about $1,972/mo by month 24 at 4% monthly growth, then hold steady."
  );
  check("wi creator: extra", mid.extra, "You wouldn’t catch up within 5 years at these numbers.");
  check("wi creator: cautious end", endOf(sc.run(v, sc.variants[0]).what), 69752.19);
  check("wi creator: optimistic end", endOf(sc.run(v, sc.variants[2]).what), 150661.25);
  check("wi creator: variant labels", sc.variants.map((k) => sc.variantLabel(v, k)), [
    "Half the growth",
    "As expected",
    "1.5× growth",
  ]);
  check("wi creator: trade-offs", sc.trade, [
    "No steady paycheck while you grow",
    "All your time goes into content, pitching and brand deals",
    "Income has no ceiling, but it also has no floor",
  ]);
}

/* ------------------------- deals test factory ------------------------- */

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

/* ------------------------------ Levels ------------------------------ */

check("levels: no deals, no facts", levelFacts([]), { campaigns: 0, collectedCents: 0, brands: 0 });
check(
  "levels: facts count paid only, received wins over amount",
  levelFacts([
    deal({ brandName: "X", amountCents: 60000, paidOn: "2026-03-01" }),
    deal({ brandName: "X", amountCents: 40000, paidOn: "2026-04-01" }),
    deal({ brandName: "Y", amountCents: 100000, receivedCents: 25000, paidOn: "2026-05-01" }),
    deal({ brandName: "Z", stage: "invoiced", amountCents: 99900 }),
    deal({ brandName: "W", stage: "lost", amountCents: 99900 }),
  ]),
  { campaigns: 3, collectedCents: 125000, brands: 2 }
);
check("levels: tier ladder", LEVEL_TIERS.map((t) => t.id), ["bronze", "silver", "gold", "diamond"]);

{
  const s = computeLevel({ campaigns: 0, collectedCents: 0, brands: 0 });
  check("levels: empty account is Bronze", [s.tier.id, s.tierIndex, s.percent, s.progress], ["bronze", 0, 0, 0]);
  check("levels: Bronze next is Silver", s.next?.id, "silver");
  check("levels: Bronze next text", levelNextText(s), "Finish 1 campaign and collect $500 to reach Silver.");
}
{
  const s = computeLevel({ campaigns: 1, collectedCents: 50000, brands: 1 });
  check("levels: first deal + $500 is Silver", s.tier.id, "silver");
  check("levels: Silver progress to Gold", [s.progress, s.percent], [0.2, 20]);
}
{
  const s = computeLevel({ campaigns: 6, collectedCents: 300000, brands: 4 });
  check("levels: 6 campaigns + $3,000 is Gold", s.tier.id, "gold");
  check("levels: Gold progress to Diamond", [s.progress, s.percent], [0.6, 60]);
  check("levels: Gold next text", levelNextText(s), "Finish 10 campaigns and collect $5,000 to reach Diamond.");
}
{
  const s = computeLevel({ campaigns: 3, collectedCents: 900000, brands: 3 });
  check("levels: money alone cannot skip the campaign requirement", s.tier.id, "silver");
  check("levels: blocked progress averages both ratios", s.percent, 80);
}
{
  const s = computeLevel({ campaigns: 10, collectedCents: 500000, brands: 6 });
  check("levels: Diamond state", [s.tier.id, s.next, s.progress, s.percent], ["diamond", null, 1, 100]);
  check("levels: Diamond has no next text", levelNextText(s), null);
}

{
  const rows = levelMilestones([]);
  check(
    "milestones: empty account rows",
    rows.map((r) => [r.id, r.status]),
    [
      ["first-collab", "todo"],
      ["first-500", "todo"],
      ["campaigns-10", "progress"],
      ["brands-5", "progress"],
      ["revenue-5000", "progress"],
    ]
  );
  check("milestones: first collab invites the first deal", rows[0].sub, "Land your first paid deal");
}
{
  const rows = levelMilestones([
    deal({ brandName: "A", amountCents: 60000, paidOn: "2026-03-15" }),
    deal({ brandName: "B", amountCents: 70000, paidOn: "2026-05-20" }),
  ]);
  check("milestones: first collab done with its month", [rows[0].status, rows[0].sub], ["done", "Done · March"]);
  check("milestones: first $500 verified", [rows[1].status, rows[1].sub], ["done", "Done · Verified"]);
  check("milestones: campaigns progress", [rows[2].current, rows[2].target], [2, 10]);
  check("milestones: brands progress", [rows[3].current, rows[3].target], [2, 5]);
  check("milestones: revenue progress in cents", [rows[4].current, rows[4].target], [130000, 500000]);
}

/* ------------------------------- Invite ------------------------------- */

check("invite: the prototype models 2 joined of a 3 goal", [INVITE_MODEL_JOINED, INVITE_GOAL], [2, 3]);
check("invite: reward ladder needs", INVITE_REWARDS.map((r) => r.need), [1, 3, 5, 10]);
check("invite: reached reward unlocks", inviteRewardStatus(2, 1), { state: "unlocked", label: "Unlocked" });
check("invite: one short reads 1 to go", inviteRewardStatus(2, 3), { state: "todo", label: "1 to go" });
check("invite: far reward stays locked", inviteRewardStatus(2, 5), { state: "locked", label: "Locked" });
check("invite: farthest reward stays locked", inviteRewardStatus(2, 10), { state: "locked", label: "Locked" });
check("invite: exact reach unlocks", inviteRewardStatus(3, 3), { state: "unlocked", label: "Unlocked" });
check("invite: progress at the modeled state", inviteProgress(2), {
  headline: "2 of 3 friends joined",
  right: "1 more to Premium",
  pct: 67,
});
check("invite: progress at goal", inviteProgress(3), {
  headline: "3 of 3 friends joined",
  right: "Premium unlocked",
  pct: 100,
});
check("invite: progress at zero", inviteProgress(0), {
  headline: "0 of 3 friends joined",
  right: "3 more to Premium",
  pct: 0,
});

/* ----------------------------- Challenges ----------------------------- */

check("challenges: week meta is the prototype's", CHALLENGE_WEEK.meta, "Day 4 of 7 · 38 creators in · 3 friends");
check("challenges: three friends race, you in the middle", CHALLENGE_FRIENDS.map((f) => f.done), [5, 4, 3]);
check("challenges: joinable list", MORE_CHALLENGES.map((c) => c.id), ["first-deal", "hooks", "media-kit"]);
check("challenges: countdown from Monday noon", weekEndsIn(new Date(2026, 10, 23, 12, 0, 0)), "Ends in 6d 12h");
check("challenges: countdown on Sunday night", weekEndsIn(new Date(2026, 10, 29, 23, 0, 0)), "Ends in 0d 1h");

/* ---------------------------- Hall of Fame ---------------------------- */

check("hall: four boards", HOF_ORDER.map((k) => HOF[k].label), [
  "Best consistency",
  "Campaign performance",
  "Biggest improvement",
  "Community favorite",
]);
check("hall: every board has 7 rows", HOF_ORDER.map((k) => HOF[k].rows.length), [7, 7, 7, 7]);
check("hall: consistency winner", HOF.consistency.rows[0], ["@maya.makes", "61-day streak"]);
check("hall: your consistency strip", HOF.consistency.you, "#23 · 12-day streak · Top 15%");
check("hall: initials from dotted handles", hofInitials("@maya.makes"), "MM");
check("hall: initials from underscored handles", hofInitials("@dre.unboxes"), "DU");
check("hall: initials, single part", hofInitials("@sam"), "S");

/* ------------------------------ verdict ------------------------------ */

if (failures > 0) {
  console.log(`\n${failures} FAILURES`);
  process.exit(1);
}
console.log("\nALL PASS");
