// ============================================================================
// VESTRA BRAIN + Feed — acceptance fixtures for the REBUILD Phase 1
// (owner-confirmed 2026-11-24: build the platform from scratch
// around the Brain; his law — every feature must work, nothing is
// there just to be there, if it's there it leads to something).
//
// Pins:
//  - The command router: the Brain's own documented example
//    commands each resolve to the expected intent, agent and REAL
//    destination; every suggestion chip routes somewhere (no dead
//    chips); an unknown command resolves to null so the UI answers
//    honestly instead of faking it.
//  - Specialist-agent tagging on the Growth Engine's Brain recs:
//    money recs are the Financial Agent's, win-backs the Retention
//    Agent's, the all-clear the Brain's own.
//  - Source pins: the /brain, /feed and /market pages exist behind
//    the subscription gate; the feed + brain API routes write the
//    real tables (posts, post_likes, brain_actions).
//
// Run (from the repo root):
//   npx tsx scripts/brain-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "fs";
import type { GalaxyDeal } from "../lib/galaxy/core";
import { buildGrowthEngine } from "../lib/galaxy/engine";
import { routeBrainCommand, BRAIN_SUGGESTIONS } from "../lib/brain/commands";

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

/* ------------------------- command routing ------------------------ */

const cases: [string, string, string, string][] = [
  // [command, intent key, agent, href]
  ["Find brands that fit my audience", "find-brands", "Brand Agent", "/brands"],
  ["find me brands for skincare", "find-brands", "Brand Agent", "/brands"],
  ["Follow up with customers who haven't booked", "follow-ups", "Retention Agent", "/retention"],
  ["Who owes me money?", "collect", "Financial Agent", "/deals"],
  ["Show me which content performs best", "best-content", "Creator Agent", "/studio"],
  ["Prepare my video for publication", "prepare-video", "Creator Agent", "/studio"],
  ["Find creators for my business", "find-creators", "Business Agent", "/market"],
  ["Analyze my campaign", "campaigns", "Marketing Agent", "/deals"],
  ["Show my customers", "customers", "Business Agent", "/customers"],
  ["How much revenue have I earned?", "money", "Financial Agent", "/me"],
  ["Show my opportunities", "opportunities", "Brand Agent", "/me/opportunities"],
];
for (const [cmd, key, agent, href] of cases) {
  const r = routeBrainCommand(cmd);
  check(`route "${cmd}": intent`, r?.intent.key, key);
  check(`route "${cmd}": agent`, r?.intent.agent, agent);
  check(`route "${cmd}": href`, r?.intent.href, href);
}
check(
  "route: brand query is extracted",
  routeBrainCommand("find me brands for skincare")?.query,
  "skincare"
);
check("route: plain brand ask has no query", routeBrainCommand("Find brands that fit my audience")?.query, null);
check("route: unknown command is an honest null", routeBrainCommand("Book me a flight to Miami"), null);
check("route: empty command is null", routeBrainCommand("   "), null);
check(
  "suggestions: every chip routes somewhere real",
  BRAIN_SUGGESTIONS.every((s) => routeBrainCommand(s) !== null),
  true
);
check(
  "suggestions: every destination is a real route in the app",
  BRAIN_SUGGESTIONS.map((s) => routeBrainCommand(s)?.intent.href).every((h) =>
    ["/brands", "/retention", "/studio", "/market", "/deals", "/customers", "/me", "/me/opportunities"].includes(h ?? "")
  ),
  true
);

/* --------------------- specialist agent tagging ------------------- */

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
{
  const e = buildGrowthEngine({ ...base, deals: [] });
  check("agents: the all-clear is the Brain's own", e.brain[0].agent, "VESTRA BRAIN");
}
{
  const overdue = deal({
    brandName: "Late Co",
    stage: "invoiced",
    amountCents: 40000,
    invoiceSentOn: "2026-10-01",
    invoiceDue: "2026-10-15",
  });
  const old = deal({
    brandName: "Old Customer",
    stage: "paid",
    amountCents: 10000,
    receivedCents: 10000,
    paidOn: "2026-09-01",
  });
  const e = buildGrowthEngine({ ...base, deals: [overdue, old] });
  check("agents: money first is the Financial Agent", e.brain[0].agent, "Financial Agent");
  check("agents: win-back is the Retention Agent", e.brain[1].agent, "Retention Agent");
}

/* --------------------------- source pins -------------------------- */

const brainPage = read("app/brain/page.tsx");
check("brain page: behind the subscription gate", brainPage.includes('requireSubscription("/brain")'), true);
check("brain page: renders the command center", brainPage.includes("BrainClient"), true);
check("brain page: reads the action log table", brainPage.includes('from("brain_actions")'), true);

const feedPage = read("app/feed/page.tsx");
check("feed page: behind the subscription gate", feedPage.includes('requireSubscription("/feed")'), true);
check("feed page: reads the posts table", feedPage.includes('from("posts")'), true);
check("feed page: reads likes", feedPage.includes('from("post_likes")'), true);

const postRoute = read("app/api/feed/posts/route.ts");
check("feed posts api: inserts into posts for the signed-in user", postRoute.includes('from("posts")') && postRoute.includes("user_id: user.id"), true);
const likeRoute = read("app/api/feed/like/route.ts");
check("feed like api: toggles post_likes", likeRoute.includes('from("post_likes")'), true);
const actionRoute = read("app/api/brain/actions/route.ts");
check("brain actions api: writes brain_actions", actionRoute.includes('from("brain_actions")'), true);

const marketPage = read("app/market/page.tsx");
check("market page: behind the subscription gate", marketPage.includes('requireSubscription("/market")'), true);
check("market page: directory count is read live", marketPage.includes('from("brands")'), true);
check("market page: doors are role-aware", marketPage.includes("isBusiness"), true);

console.log(failures === 0 ? "\nBRAIN FIXTURES: ALL PASS" : `\nBRAIN FIXTURES: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
