// ============================================================================
// Studio replacement + one-today fix — acceptance fixtures (owner orders
// 2026-11-23).
//
// Part A: the owner's VideoStudio design ported to lib/galaxy/studio.ts.
// The five scores for his SAMPLE are pinned to values computed BY HAND
// from his rules (see the arithmetic in the section comments), plus the
// individual rule pins: greeting −30 on Hook, hype penalty on Trust,
// the CTA last-two-sentences bonus, and the MIN_WORDS wait state. The
// Buyer Brain V3 wiring is pinned by source checks: the /api/creator-lab
// call, its payload shape and the /api/studio history save must still
// be in the Studio client, unchanged.
//
// Part B: the one-today fix (battAO caught "Overdue 5 days" on the
// Deals board vs "6 days overdue" on Today). Server pages now pass a
// single todayKey into the client components; the client deal surfaces
// must consume it and must NOT derive days from the local clock. The
// removed patterns are pinned as absent, the passed-key consumption as
// present, and the anchor mechanism (parseKey of the server key) is
// pinned functionally.
//
// Run (from the repo root):
//   npx tsx scripts/studio-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "node:fs";
import {
  EMPTY_VIDEO,
  MAX_SECONDS,
  MIN_WORDS,
  SAMPLE_VIDEO,
  STRONG,
  STORAGE_KEY,
  TARGET,
  WORDS_PER_SECOND,
  analyzeScript,
  analyzeStage,
  deliveryPlan,
  ideaStage,
  publishItems,
  publishStage,
  rehearseStage,
  scriptStage,
  suggestCaption,
  type StudioVideo,
} from "../lib/galaxy/studio";
import { daysAgo, daysUntil, parseKey } from "../lib/galaxy/core";

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

const V = (script: string, extra: Partial<StudioVideo> = {}): StudioVideo => ({
  ...EMPTY_VIDEO,
  script,
  ...extra,
});
const scoreOf = (v: StudioVideo, key: string) =>
  analyzeScript(v).checks.find((c) => c.key === key)?.score;
const fixOf = (v: StudioVideo, key: string) =>
  analyzeScript(v).checks.find((c) => c.key === key)?.fix;

/* ---------- settings, verbatim from his component ---------- */
check("settings: words per second", WORDS_PER_SECOND, 2.5);
check("settings: target seconds", TARGET, [20, 45]);
check("settings: max seconds", MAX_SECONDS, 60);
check("settings: min words", MIN_WORDS, 20);
check("settings: strong threshold", STRONG, 70);
check("settings: draft storage key", STORAGE_KEY, "uv-studio-draft");

/* ---------- his SAMPLE, scored by hand ----------
 * Script sentences (7): 13 + 12 + 4 + 12 + 15 + 11 + 6 = 73 words;
 * secs = round(73 / 2.5) = 29; avgLen = 73 / 7 ≈ 10.4.
 * HOOK = 40 + 15 ("you" in line one) + 10 (audience keyword "skip" /
 * "skincare" in line one) = 65. First line is 13 words (> 12, no +20)
 * and carries no digit/question (no +15); no greeting.
 * RETENTION = 100: 29s inside 20–45, avgLen ≤ 18, no fillers.
 * TRUST = 30 + 30 (first person) + 20 (numbers/timeframes) + 20
 * ("used to") = 100; no hype words.
 * CLARITY = 40 (product named) + 30 ("seconds", a feeling keyword,
 * appears) + 30 (avgLen ≤ 15) = 100.
 * CONVERSION = 20 + 40 (CTA present) + 20 (CTA in the last two
 * sentences) + 20 (price "28" spoken) = 100.
 * avg = round((65+100+100+100+100)/5) = 93; weak = [hook]. */
const sample = analyzeScript(SAMPLE_VIDEO);
check("sample: word count", sample.words, 73);
check("sample: seconds", sample.secs, 29);
check("sample: average", sample.avg, 93);
check("sample: hook score", scoreOf(SAMPLE_VIDEO, "hook"), 65);
check("sample: retention score", scoreOf(SAMPLE_VIDEO, "retention"), 100);
check("sample: trust score", scoreOf(SAMPLE_VIDEO, "trust"), 100);
check("sample: clarity score", scoreOf(SAMPLE_VIDEO, "clarity"), 100);
check("sample: conversion score", scoreOf(SAMPLE_VIDEO, "conversion"), 100);
check(
  "sample: hook fix",
  fixOf(SAMPLE_VIDEO, "hook"),
  "Your first line is 13 words. Get it to 12 or fewer so it lands in about 3 seconds."
);
check("sample: weak checks", sample.weak.map((c) => c.key), ["hook"]);

/* ---------- SAMPLE stage states ---------- */
check("sample stage: idea done", ideaStage(SAMPLE_VIDEO), {
  state: "done",
  status: "For: Busy moms who skip skincare",
  detail: "",
  cta: "Edit idea",
});
check("sample stage: script done", scriptStage(SAMPLE_VIDEO, sample), {
  state: "done",
  status: "73 words · about 29s on camera",
  detail: "",
  cta: "Edit script",
});
check("sample stage: analyze flags the hook", analyzeStage(SAMPLE_VIDEO, sample), {
  state: "work",
  status: "1 weak spot: Hook",
  detail:
    "Your first line is 13 words. Get it to 12 or fewer so it lands in about 3 seconds.",
  cta: "Fix your hook",
});
check("sample stage: publish untouched", publishStage(SAMPLE_VIDEO, sample), {
  state: "todo",
  status: "0 of 3 done · next: caption",
  detail: "Write a caption.",
  cta: "Finish publishing checklist",
});

/* ---------- rule pin: the greeting costs Hook exactly 30 ---------- */
const plainScript =
  "This is my video about stuff and things for everyone watching at home today ok.";
const greetScript = `Hello friends, ${plainScript.charAt(0).toLowerCase()}${plainScript.slice(1)}`;
check("greeting: plain hook", scoreOf(V(plainScript), "hook"), 40);
check("greeting: greeted hook", scoreOf(V(greetScript), "hook"), 10);
check(
  "greeting: the penalty is exactly 30",
  (scoreOf(V(plainScript), "hook") ?? 0) - (scoreOf(V(greetScript), "hook") ?? 0),
  30
);
check(
  "greeting: fix leads",
  fixOf(V(greetScript), "hook"),
  "Cut the greeting. Open on the problem your viewer has."
);

/* ---------- rule pin: a hype word drops Trust ---------- */
check(
  "hype: trust with a hype word",
  scoreOf(V("I use this miracle cream every morning."), "trust"),
  35
);
check(
  "hype: fix names the word",
  fixOf(V("I use this miracle cream every morning."), "trust"),
  'Drop "miracle". Hype claims read like an ad and can get flagged.'
);
check(
  "hype: trust without the hype word",
  scoreOf(V("I use this cream every morning."), "trust"),
  60
);

/* ---------- rule pin: CTA only mid-script loses the last-two bonus ----------
 * CTA in sentence 1 of 3, none in the last two: 20 + 40 (present) +
 * 0 (not at the end) + 20 (no price given) = 80. */
const midCta = V(
  "Tap the link now if your skin feels dry after long days at work. I used this cream for three weeks at home. My skin feels soft now and I smile more."
);
check("cta: mid-script conversion", scoreOf(midCta, "conversion"), 80);
check(
  "cta: mid-script fix",
  fixOf(midCta, "conversion"),
  "Move your call to action to the last line."
);

/* ---------- rule pin: under MIN_WORDS the later stages wait ---------- */
const nineteen = V(
  "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen."
);
const a19 = analyzeScript(nineteen);
check("wait: 19 words counted", a19.words, 19);
check("wait: analyze waits", analyzeStage(nineteen, a19), {
  state: "wait",
  status: "Waiting on your script",
  detail: "",
  cta: "",
});
check("wait: rehearse waits", rehearseStage(nineteen, a19).state, "wait");
check("wait: publish waits", publishStage(nineteen, a19).state, "wait");

/* ---------- delivery plan: beat split for a 3-sentence script ----------
 * Each sentence is 4 words → round(4 / 2.5) = 2s per beat. */
const plan = deliveryPlan(
  V("Hook line here now. Body sentence one here. Final call to action.")
);
check("plan: beat labels", plan.map((b) => b.label), ["Hook", "Story", "Call to action"]);
check("plan: beat times", plan.map((b) => b.time), ["0–2s", "2–4s", "4–6s"]);
check("plan: beat lines", plan.map((b) => b.line), [
  "Hook line here now.",
  "Body sentence one here.",
  "Final call to action.",
]);
check(
  "plan: story tip falls back to 'the product'",
  plan[1]?.tip,
  "Show the product in your hand while you talk. Slow down on the numbers."
);

/* ---------- publish checklist: disclosure detection ---------- */
const withTag = publishItems(V("", { caption: "Love this one #ad" }));
check("publish: caption done at 10+ chars", withTag[0]?.done, true);
check("publish: #ad in caption auto-dones disclosure", withTag[1]?.done, true);
check("publish: auto-detected disclosure is locked", withTag[1]?.locked, true);
check(
  "publish: auto-detected disclosure note",
  withTag[1]?.note,
  "Found in your caption"
);
const manual = publishItems(V("", { caption: "short", published: { disclosure: true } }));
check("publish: short caption not done", manual[0]?.done, false);
check("publish: manual disclosure tick counts", manual[1]?.done, true);
check("publish: manual disclosure stays unlocked", manual[1]?.locked, false);
const none = publishItems(V(""));
check("publish: no caption, no tick — disclosure open", none[1]?.done, false);

/* ---------- suggested caption shape ---------- */
check(
  "caption: hook + product tag + #ad",
  suggestCaption(
    V("Stop scrolling if your skin looks tired. More here.", { product: "Glow Serum" })
  ),
  "Stop scrolling if your skin looks tired. #glowserum #ad"
);

/* ---------- Buyer Brain V3 wiring: source checks ----------
 * The full read's request/response path in the Studio client must
 * be the one that was there before the redesign — same endpoint,
 * same payload keys and fallbacks, same button copy — and the
 * script_analyses history save must still fire via /api/studio. */
const studioClient = readFileSync("app/studio/StudioClient.tsx", "utf8");
check(
  "buyer brain: still POSTs /api/creator-lab",
  studioClient.includes('fetch("/api/creator-lab"'),
  true
);
check(
  "buyer brain: payload fallbacks unchanged",
  studioClient.includes('"the product in this video"') &&
    studioClient.includes('"the viewer this video is for"') &&
    studioClient.includes('"Not provided"') &&
    studioClient.includes('stage: "curious"'),
  true
);
check(
  "buyer brain: button copy unchanged",
  studioClient.includes("Get the full Buyer Brain read") &&
    studioClient.includes("Running the full Buyer Brain read…"),
  true
);
check(
  "history: the check still saves via /api/studio (script_analyses)",
  studioClient.includes('fetch("/api/studio"'),
  true
);
check(
  "draft: autosave wired to his storage key",
  studioClient.includes("STORAGE_KEY") &&
    studioClient.includes("localStorage.setItem(STORAGE_KEY"),
  true
);
check(
  "publish honesty: no posting is claimed",
  studioClient.includes("Copy caption") && studioClient.includes("post for you"),
  true
);

/* ---------- Part B: one today, anchored on the server key ---------- */
check(
  "anchor: daysAgo counts from the passed key, not the clock",
  daysAgo("2026-11-18", parseKey("2026-11-24")),
  6
);
check(
  "anchor: daysUntil counts from the passed key, not the clock",
  daysUntil("2026-11-18", parseKey("2026-11-24")),
  -6
);

const dealsClient = readFileSync("app/deals/DealsClient.tsx", "utf8");
const dealsPage = readFileSync("app/deals/page.tsx", "utf8");
check("one-today: deals page passes the server key", dealsPage.includes("today={todayKey()}"), true);
check(
  "one-today: deals board anchors its day math",
  dealsClient.includes("daysAgo(d.lastContact, now)") &&
    dealsClient.includes("isOverdue(d, now)") &&
    dealsClient.includes("dealFlag(d, now)") &&
    dealsClient.includes("const now = parseKey(today)"),
  true
);
check(
  "one-today: deals board has no unanchored day math left",
  !dealsClient.includes("isOverdue(d)") &&
    !dealsClient.includes("daysAgo(d.lastContact)") &&
    !dealsClient.includes("new Date()"),
  true
);

const moneyClient = readFileSync("app/money/MoneyClient.tsx", "utf8");
const moneyPage = readFileSync("app/money/page.tsx", "utf8");
check("one-today: money page passes the server key", moneyPage.includes("today={todayKey()}"), true);
check(
  "one-today: money anchors its clock and its month",
  moneyClient.includes("const now = parseKey(today)") &&
    moneyClient.includes("monthKeyOf(today)") &&
    moneyClient.includes("paymentReceivedDate: today,"),
  true
);
check(
  "one-today: money has no local todayKey derivation left",
  !moneyClient.includes("todayKey"),
  true
);

const todayClient = readFileSync("app/today/TodayClient.tsx", "utf8");
const todayPage = readFileSync("app/today/page.tsx", "utf8");
check(
  "one-today: today page passes its server key",
  todayPage.includes("today={todayKey(now)}"),
  true
);
check(
  "one-today: today client anchors overdue and post dates",
  todayClient.includes("isOverdue(d, now)") &&
    todayClient.includes("postedDate: p.today"),
  true
);
check(
  "one-today: today client has no UTC-slice today left",
  !todayClient.includes("new Date().toISOString().slice(0, 10)"),
  true
);

const dealSheet = readFileSync("components/galaxy/DealSheet.tsx", "utf8");
check(
  "one-today: deal sheet anchors every derivation",
  dealSheet.includes("const now = parseKey(today)") &&
    dealSheet.includes("paymentReceivedDate: today,") &&
    dealSheet.includes("invoiceSentDate: today,") &&
    dealSheet.includes("daysAgo(deal.lastContact, now)") &&
    dealSheet.includes("daysAgo(deal.invoiceDue, now)") &&
    dealSheet.includes("addDaysKey(14, now)"),
  true
);
check(
  "one-today: deal sheet has no local clock left",
  !dealSheet.includes("Date.now()") && !dealSheet.includes("todayKey()"),
  true
);
check(
  "one-today: every deal sheet host passes the key",
  dealsClient.includes("today={today}") &&
    moneyClient.includes("today={today}") &&
    todayClient.includes("today={p.today}"),
  true
);

const brandsClient = readFileSync("app/brands/BrandsClient.tsx", "utf8");
check(
  "one-today: brands 'New' badge anchors to the server key too",
  brandsClient.includes("daysAgo(b.added, now)"),
  true
);

if (failures > 0) {
  console.log(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll studio assertions passed.");
