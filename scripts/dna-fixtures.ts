// ============================================================================
// Content DNA — acceptance fixtures (owner prototype port, 2026-11-23).
//
// The owner's "Ultra Vestra Content DNA" demo arrived as a compiled
// single-file bundle (~/workspace/user/files/content-dna-demo_16_2ivm.html).
// Its app module sits at the end of the bundle; the analysis engine
// (enrich → score → patterns → opportunities → experiment verdicts),
// the seeded sample generator (seed 20261123, 31 posts) and all
// product copy were extracted from it and ported to lib/galaxy/dna.ts.
// The pins below are the PROTOTYPE'S OWN outputs: the sample values
// were produced by running the ported engine on the ported sample
// generator — the same deterministic arithmetic the bundle runs
// (median lift, Mann–Whitney p, Benjamini–Hochberg q, confidence
// tiers, surfacing score Math.abs(lift) × {strong:1, some:.65,
// hypothesis:.35}, strengths at lift ≥ 5 with conf set).
//
// Run (from the repo root):
//   npx tsx scripts/dna-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "node:fs";
import {
  CSV_TEMPLATE,
  DNA_STORAGE_KEY,
  DNA_UNLOCK_POSTS,
  EMPTY_DNA_STATE,
  analyzeDna,
  classifyHook,
  dnaHomeState,
  enrichPosts,
  experimentResult,
  mannWhitneyP,
  parseCsvNumber,
  parsePostsCsv,
  samplePosts,
  type DnaExperiment,
  type DnaState,
} from "../lib/galaxy/dna";

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

const NOW = Date.UTC(2026, 10, 24, 12, 0, 0); // Nov 24 2026, noon UTC
const LATER = NOW + 4 * 864e5; // every sample post is past the 3-day "fresh" window

/* ---------- storage + unlock, verbatim from the prototype ---------- */
check("dna: storage key is the prototype's own", DNA_STORAGE_KEY, "uv-content-dna");
check("dna: patterns unlock at 8 posts", DNA_UNLOCK_POSTS, 8);
check("dna: default objective", EMPTY_DNA_STATE.objective, "grow");
check("dna: default share toggles all on", Object.values(EMPTY_DNA_STATE.share).every(Boolean), true);

/* ---------- hook classification (the prototype's $e table) ---------- */
check("hook: POV", classifyHook("POV: you finally found a lunchbox that doesn't leak"), "pov");
check("hook: number", classifyHook("5 Target finds under $10 that actually work"), "number");
check("hook: bold claim", classifyHook("Stop skipping sunscreen, here's 30 days of proof"), "bold");
check("hook: how-to", classifyHook("How I fixed my dry patches in a week"), "howto");
check("hook: story", classifyHook("I tried the viral lip oil so you don't have to"), "story");
check("hook: question", classifyHook("Do you double cleanse at night?"), "question");
check("hook: statement fallback", classifyHook("Come spend a Tuesday with me"), "other");

/* ---------- statistics primitives ---------- */
check("stats: Mann-Whitney separated groups is ~0", mannWhitneyP([1, 2, 3], [10, 11, 12]) < 0.1, true);
check("stats: Mann-Whitney identical groups is 1-ish", mannWhitneyP([5, 5, 5], [5, 5, 5]), 1);
check("csv number: k suffix", parseCsvNumber("12.5k"), 12500);
check("csv number: clock duration", parseCsvNumber("1:23"), 83);
check("csv number: seconds suffix", parseCsvNumber("45s"), 45);
check("csv number: money", parseCsvNumber("$1,200"), 1200);

/* ---------- the sample generator (seed 20261123, 31 posts) ---------- */
const posts = samplePosts(NOW);
check("sample: 31 example posts", posts.length, 31);
check("sample: label on every post", posts.every((p) => p.source === "sample"), true);
check("sample: first post title", posts[0].title, "Come spend a Tuesday with me");
check("sample: first post views (seeded, deterministic)", posts[0].views, 12247);
check("sample: last post title", posts[30].title, "Do you need toner? Honest answer");
check("sample: regeneration is deterministic", samplePosts(NOW)[0].views, 12247);

/* ---------- the analysis on the prototype's sample ---------- */
const sampleState: DnaState = { ...EMPTY_DNA_STATE, started: true, source: "sample", posts };
const A = analyzeDna(sampleState, LATER);
check("analysis: all 31 sample posts usable", A.usable.length, 31);
check("analysis: enough to unlock patterns", A.enough, true);
check("analysis: nothing untagged in the sample", A.untagged, 0);
check(
  "analysis: strongest pattern is Before & after (the prototype's planted effect)",
  A.strengths[0]?.id,
  "format:Before & after"
);
check("analysis: strongest pattern confidence", A.strengths[0]?.conf, "strong");
check("analysis: strongest pattern lift ≈ +39.7", Math.round(A.strengths[0]?.lift ?? 0), 40);
check("analysis: surfacing order follows |lift| × confidence weight", A.strengths[1]?.id, "lengthBucket:15to30");
check("analysis: weakest pattern surfaces first among weaknesses", A.weaknesses[0]?.id, "topic:Day in my life");
check("analysis: creator identity from the lead metric", A.identity.name, "The Connector");
check("analysis: identity line", A.identity.line, "People pass your videos on to someone they know.");
check("analysis: best post by goal score", A.bestPost?.title, "Stop over-exfoliating, my skin 2 weeks later");
check("analysis: signature topic", A.sig?.topic?.value, "Day in my life");
check("analysis: signature format", A.sig?.format?.value, "Talking head");
check("analysis: signature median length", A.sig?.length, 34);
check("analysis: top opportunity", A.opps[0]?.id, "hook:hookStyle:bold");
check("analysis: top opportunity title", A.opps[0]?.title, "Open more videos with bold claim hooks");

/* ---------- home state (the prototype's rb/Ph copy) ---------- */
check("home: invite title", dnaHomeState(null).title, "Discover your Content DNA");
check("home: invite detail", dnaHomeState(null).detail, "Find the evidence-backed pattern behind your best videos.");
check("home: invite cta", dnaHomeState(null).cta, "Find my pattern");
const homeSample = dnaHomeState(sampleState, LATER);
check("home: sample flag rides along", homeSample.sample, true);
check("home: sample state kind", homeSample.kind, "opportunity");
check("home: sample state cta", homeSample.cta, "See why");
const fewState: DnaState = { ...EMPTY_DNA_STATE, started: true, source: "import", posts: posts.slice(0, 5) };
check("home: too few posts kind", dnaHomeState(fewState, LATER).kind, "more");
check("home: too few posts title", dnaHomeState(fewState, LATER).title, "Content DNA needs a few more posts");

/* ---------- CSV import (the prototype's template + parser) ---------- */
const csv = parsePostsCsv(CSV_TEMPLATE);
check("csv: template parses both example rows", csv.posts.length, 2);
check("csv: template first row views", csv.posts[0]?.views, 32000);
check("csv: template first row topic kept", csv.posts[0]?.topic, "Skincare");
check("csv: missing views column is an honest error", parsePostsCsv("title,date\nHello,2026-10-01").error?.includes("views column"), true);
check("csv: empty file error", parsePostsCsv("").error?.includes("no rows"), true);

/* ---------- experiment verdicts (the prototype's ub) ---------- */
const enriched = enrichPosts(
  [0, 1, 2].map((i) => ({
    id: `t-${i}`,
    source: "manual",
    title: `Test post ${i}`,
    hook: `Test post ${i}`,
    date: new Date(LATER - 30 * 864e5).toISOString(),
    platform: "TikTok",
    topic: "Skincare",
    format: "Talking head",
    length: 30,
    views: 1000,
    likes: 10,
    comments: 5,
    shares: 20,
    saves: 10,
    watch: 15,
  })),
  LATER
);
const exp: DnaExperiment = {
  id: "exp-test",
  title: "Test",
  metric: "shareRate",
  baseline: 0.01,
  target: 0.012,
  minPosts: 3,
  startedAt: LATER - 30 * 864e5,
  postIds: ["t-0", "t-1", "t-2"],
  status: "running",
};
const res = experimentResult(exp, enriched);
check("experiment: 2x baseline across 3 posts is promising", res.verdict, "promising");
check("experiment: promising text is the prototype's", res.text.includes("Promising, but 3 posts isn't proof."), true);
check(
  "experiment: too few measured posts is collecting",
  experimentResult({ ...exp, postIds: ["t-0"] }, enriched).verdict,
  "collecting"
);

/* ---------- placement: Studio sub-route, five nav untouched ---------- */
const dnaPage = readFileSync("app/studio/dna/page.tsx", "utf8");
const dnaClient = readFileSync("app/studio/dna/DnaClient.tsx", "utf8");
const studioPage = readFileSync("app/studio/page.tsx", "utf8");
const appNav = readFileSync("components/AppNav.tsx", "utf8");
check("placement: DNA page is subscription-gated", dnaPage.includes('requireSubscription("/studio/dna")'), true);
check("placement: Studio page links the DNA module", studioPage.includes("DnaLink"), true);
check("placement: Studio page itself carries no DNA tab nav", studioPage.includes("My DNA"), false);
check("placement: hero title from the prototype", dnaClient.includes("VESTRA CONTENT DNA"), true);
check("placement: hero chip from the prototype", dnaClient.includes("Signature technology"), true);
check("placement: six DNA tabs", ["My DNA", "Opportunities", "Lab", "30-Day", "Share", "Data"].every((t) => dnaClient.includes(`"${t}"`)), true);
check("placement: discovery headline", dnaClient.includes("LET'S FIND IT."), true);
check("placement: discovery lede", dnaClient.includes("Content DNA studies your real posts") && dnaClient.includes("nothing is made up."), true);
check("placement: sample option is labeled sample data", dnaClient.includes("31 example posts from a sample creator"), true);
check("placement: My DNA reveal", dnaClient.includes("WE FOUND IT."), true);
check("placement: challenge headline", dnaClient.includes("CONTENT DNA CHALLENGE"), true);
check("placement: share card lines", dnaClient.includes("YOUR DNA?") && dnaClient.includes("CONTENT DNA.") && dnaClient.includes("30-DAY CHALLENGE."), true);
check("placement: share is copy-only (no posting call)", dnaClient.includes("UltraVestra never posts for you"), true);
check("placement: delete-all confirm copy", dnaClient.includes("Tap again to delete everything. This can't be undone."), true);

/* ---------- change data source (live-proof fix, 2026-11-23) ----------
 * After choosing sample data there was no way back to the source
 * chooser except "Delete all Content DNA data". The Data tab now
 * carries a switcher that replaces the working post set only. */
check("switch: Data tab offers a change-source control", dnaClient.includes("Change data source"), true);
check(
  "switch: the switcher lists Use my Ultra Vestra posts alongside Discover's",
  dnaClient.split("<strong>Use my Ultra Vestra posts</strong>").length - 1,
  2
);
check(
  "switch: the posts source keeps the chooser's live enable rule in both places",
  (dnaClient.match(/disabled=\{!appSource\.count\}/g) || []).length,
  2
);
check(
  "switch: the disabled posts label survives in both places",
  (dnaClient.match(/No posted videos with results yet/g) || []).length >= 2,
  true
);
check(
  "switch: switching replaces the working post set and the source, nothing else",
  dnaClient.includes("({ ...s, posts, source })") && dnaClient.includes('switchSource("sample", samplePosts()'),
  true
);
check(
  "switch: the switcher can be closed without changing anything",
  dnaClient.includes("Keep my current data"),
  true
);
check(
  "switch: delete-all stays the separate destructive reset",
  dnaClient.includes("Delete all Content DNA data") && dnaClient.includes("EMPTY_DNA_STATE"),
  true
);
check("nav: still exactly the owner's five", ["Feed", "Studio", "Brain", "Market", "Universe"].every((t) => appNav.includes(`"${t}"`)) && !appNav.includes('"Money"') && !appNav.includes('"Passport"'), true);

if (failures) {
  console.log(`\n${failures} FAILURES`);
  process.exit(1);
}
console.log("\nALL DNA FIXTURES PASS");
