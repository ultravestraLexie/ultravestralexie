// ============================================================================
// Creator DNA Card — acceptance fixtures (the owner's "Creator DNA Card"
// prototype ported into Studio › Content DNA, 2026-11-24).
//
// The prototype (~/workspace/user/files/creator-dna-card__1__23_3oiu.html)
// carries its OWN analysis core — parseCSV / normalize / inferHook /
// analyze plus a bundled QR implementation — separate from
// lib/galaxy/dna. The port (lib/galaxy/dna-card.ts) keeps that core
// as-is; the pins below were derived by running the prototype's own
// code on its bundled SAMPLE_CSV, so they lock the port to the
// prototype's exact results: the sample identity/pattern fields, the
// QR matrix for the live share link, the CSV edge cases, and the
// six tiers' unlock thresholds (analyzed videos + verified patterns,
// never followers or views).
//
// Run (from the repo root):
//   npx tsx scripts/dna-card-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  DNA_CARD_CONFIG,
  DNA_CARD_SAMPLE_CSV,
  DNA_CARD_STORE_KEY,
  DNA_CARD_TEMPLATE_CSV,
  DNA_CARD_TIERS,
  analyze,
  dnaCardCreatorId,
  dnaCardFileName,
  dnaCardLink,
  dnaCardMessage,
  dnaCardPickTier,
  dnaCardSlug,
  dnaCardTierById,
  dnaCardTierNeedText,
  dnaCardTierUnlocked,
  dnaDepth,
  inferHook,
  normalize,
  parseCSV,
  qr,
  type DnaCardAnalysis,
  type DnaCardShow,
} from "../lib/galaxy/dna-card";

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

const NOW = new Date(2026, 10, 24, 12, 0, 0); // Nov 24 2026, local noon
const round4 = (n: number) => Math.round(n * 10000) / 10000;

/* ---------- config + store pins ---------- */
check("config: shareBase is the live domain", DNA_CARD_CONFIG.shareBase, "https://ultra-vestra.vercel.app/dna");
check("config: displayLink is the live domain", DNA_CARD_CONFIG.displayLink, "ULTRA-VESTRA.VERCEL.APP");
check("config: sampleHandle kept from the prototype", DNA_CARD_CONFIG.sampleHandle, "@nova.creates");
check("config: tiers are earned", DNA_CARD_CONFIG.earnedTiers, true);
check("store: the prototype's localStorage key", DNA_CARD_STORE_KEY, "uv.dna.card.v1");
check("template: header row", DNA_CARD_TEMPLATE_CSV.split("\n")[0], "date,title,platform,topic,format,hook,length_sec,views,likes,comments,shares,saves");

/* ---------- parseCSV edge cases ---------- */
check(
  "csv: quotes, escaped quotes, CRLF, semicolon + tab delimiters, blank line, quoted newline",
  parseCSV('a,b\r\n"x,""y""",2\n;sep\trows\n\n"multi\nline",z'),
  [["a", "b"], ['x,"y"', "2"], ["", "sep", "rows"], ["multi\nline", "z"]],
);
check("csv: BOM is stripped", parseCSV("﻿a,b\n1,2"), [["a", "b"], ["1", "2"]]);
check("csv: empty text parses to no rows", parseCSV(""), []);
check("csv: trailing newline adds no row", parseCSV("a,b\n1,2\n"), [["a", "b"], ["1", "2"]]);
check("csv: sample parses to header + 24 rows", parseCSV(DNA_CARD_SAMPLE_CSV).length, 25);

/* ---------- normalize ---------- */
check("normalize: empty table", normalize([]), { rows: [], issues: ["The file is empty."] });
check("normalize: no views column is a hard stop", normalize([["title", "likes"], ["x", "3"]]), {
  rows: [],
  issues: ['No "views" column found. Use the template or an analytics export with a views column.'],
});
const minimal = normalize([
  ["title", "views"],
  ["Hello world", "100"],
  ["Zero views", "0"],
]);
check("normalize: rows under 1 view are dropped", minimal.rows.length, 1);
check("normalize: missing-column issues, in order", minimal.issues, [
  "No topic column, so topic insights are off. Add a \"topic\" column to unlock them.",
  "No format column, so format insights are off.",
  "Hooks were estimated from titles. Add a \"hook\" column for accuracy.",
  "No shares column, so the experiment uses engagement rate instead of share rate.",
]);
check("normalize: defaults + inferred hook", [minimal.rows[0].platform, minimal.rows[0].topic, minimal.rows[0].format, minimal.rows[0].hook], ["All", "Untagged", "Untagged", "Untagged"]);
const suffixed = normalize([
  ["title", "views", "likes"],
  ["Big one", "1.5k", "2m"],
]);
check("normalize: k/m suffixes parse as thousands/millions", [suffixed.rows[0].views, suffixed.rows[0].likes], [1500, 2000000]);

/* ---------- inferHook ---------- */
check(
  "inferHook: the prototype's seven shapes",
  ["Before & after: 2 weeks", "Is this worth it?", "5 Target finds", "POV: morning", "Stop buying these", "My 5am routine", "Hello world", ""].map(inferHook),
  ["Result first", "Question", "List", "POV", "Bold claim", "Story", "Untagged", "Untagged"],
);

/* ---------- analyze on the bundled SAMPLE_CSV (prototype-derived pins) ---------- */
const sampleNorm = normalize(parseCSV(DNA_CARD_SAMPLE_CSV));
check("sample: 24 rows, no issues", [sampleNorm.rows.length, sampleNorm.issues], [24, []]);
const res = analyze(sampleNorm.rows, NOW);
check("sample: analysis ok", res.ok, true);
if (!res.ok) throw new Error("sample analysis failed — cannot continue");
const a: DnaCardAnalysis = res;
check("sample: n + platforms + shares", [a.n, a.platforms, a.hasShares], [24, ["TikTok"], true]);
check("sample: main platform baseline", [round4(a.mainBase.er), round4(a.mainBase.sr), a.mainBase.n], [0.073, 3.871, 24]);
check(
  "sample: date range (local y/m/d)",
  [a.from && [a.from.getFullYear(), a.from.getMonth(), a.from.getDate()], a.to && [a.to.getFullYear(), a.to.getMonth(), a.to.getDate()]],
  [[2026, 7, 3], [2026, 10, 15]],
);
check("sample: group counts", [a.groups.topic.length, a.groups.format.length, a.groups.hook.length, a.groups.band.length], [5, 5, 5, 3]);
check(
  "sample: picks",
  [a.picks.topic, a.picks.format, a.picks.hook, a.picks.band].map((g) => g && [g.name, g.n, g.tier]),
  [["Skincare honest reviews", 7, "verified"], ["Honest review", 8, "verified"], ["Result first", 6, "verified"], ["20–40s", 12, "verified"]],
);
check("sample: identity", a.fields.identity && [a.fields.identity.label, a.fields.identity.value, a.fields.identity.tier], ["Creator identity", "The Result-First Reviewer", "verified"]);
check("sample: identity why", a.fields.identity?.why, "Named from your strongest opening (Result first) and your strongest format (Honest review). It updates when those patterns change.");
check("sample: trait", a.fields.trait && [a.fields.trait.value, a.fields.trait.tier], ["Shows the result in the first second", "verified"]);
check("sample: trait why", a.fields.trait?.why, "Result first openings: 6 of your 24 videos · median 1.5× your typical engagement · 5 of 6 beat your baseline.");
check("sample: topic", a.fields.topic && [a.fields.topic.label, a.fields.topic.value, a.fields.topic.tier], ["Strongest verified topic", "Skincare honest reviews", "verified"]);
check("sample: format", a.fields.format && [a.fields.format.value, a.fields.format.tier], ["Honest review · 20–40s", "verified"]);
check(
  "sample: format why (band folded in)",
  a.fields.format?.why,
  "Honest review: 8 of your 24 videos · median 1.3× your typical engagement · 7 of 8 beat your baseline. Separately, videos 20–40s long run 1.2× your typical engagement (12 videos).",
);
check("sample: opportunity", a.fields.opportunity && [a.fields.opportunity.value, a.fields.opportunity.tier], ["More Before & after videos", "observed"]);
check(
  "sample: opportunity why",
  a.fields.opportunity?.why,
  "Before & after is only 3 of 24 posts (13%) but runs 1.7× your typical engagement. Too few videos to verify — that is why it is the next experiment. Correlation, not proof.",
);
check("sample: opp pick", a.opp && [a.opp.kind, a.opp.name, a.opp.n, round4(a.opp.lift), a.opp.tier], ["format", "Before & after", 3, 1.6985, "observed"]);
check("sample: experiment", a.fields.experiment && [a.fields.experiment.value, a.fields.experiment.tier], ["4 Before & after videos, result-first openings", "testing"]);
check("sample: experiment change", a.fields.experiment?.change, "Make 4 Before & after videos about Skincare honest reviews with result-first openings.");
check("sample: experiment metric", a.fields.experiment?.metric, "Shares per 1,000 views vs your baseline of 3.9");
check("sample: stop pick", a.stop && [a.stop.kind, a.stop.name, a.stop.n, round4(a.stop.lift)], ["topic", "Day in my life", 4, 0.5758]);
check("sample: rethink", a.rethink, "Day in my life: 4 of your 24 videos · median 0.6× your typical engagement · 0 of 4 beat your baseline. Consider pausing or reworking it.");
check("analyze: under 8 rows refuses with the reason", analyze(sampleNorm.rows.slice(0, 3), NOW), {
  ok: false,
  n: 3,
  reason: "Content DNA needs at least 8 videos to find patterns. This file has 3.",
});
check("analyze: zero rows refuses", analyze([], NOW), {
  ok: false,
  n: 0,
  reason: "Content DNA needs at least 8 videos to find patterns. This file has 0.",
});

/* ---------- QR (the prototype's bundled implementation) ---------- */
const qH = qr("https://ultra-vestra.vercel.app/dna/nova.creates", "H");
check("qr: live link at ECC H — size/version/mask", [qH.size, qH.version, qH.mask], [41, 6, 4]);
check("qr: live link at ECC H — first module row", qH.modules[0].map((v) => (v ? 1 : 0)).join(""), "11111110000111010011011011111100001111111");
const qM = qr("https://ultravestra.com/dna/nova.creates", "M");
check("qr: ECC M — size/version/mask", [qM.size, qM.version, qM.mask], [29, 3, 3]);
check("qr: deterministic", JSON.stringify(qr("https://ultra-vestra.vercel.app/dna/nova.creates", "H").modules), JSON.stringify(qH.modules));
let qrThrew = "";
try {
  qr("x".repeat(300), "H");
} catch (e) {
  qrThrew = (e as Error).message;
}
check("qr: over-capacity link throws", qrThrew, "Link too long for QR");

/* ---------- slug / creator ID / link / message ---------- */
check("slug: sample handle", dnaCardSlug("@nova.creates"), "nova.creates");
check("slug: spaces and punctuation collapse", dnaCardSlug("@Nova Creates!"), "nova-creates");
check("slug: empty falls back to creator", dnaCardSlug(""), "creator");
check("creatorId: FNV pin for the sample handle", dnaCardCreatorId("@nova.creates"), "UV-DNA-293056");
check("link: handle shown", dnaCardLink("@nova.creates", true), "https://ultra-vestra.vercel.app/dna/nova.creates");
check("link: handle hidden uses the creator ID", dnaCardLink("@nova.creates", false), "https://ultra-vestra.vercel.app/dna/uv-dna-293056");
check("fileName: tier + slug", dnaCardFileName("diamond", "@nova.creates"), "content-dna-diamond-nova.creates.png");
check("fileName: no tier yet", dnaCardFileName(null, "@nova.creates"), "content-dna-card-nova.creates.png");
const ALL_SHOW: DnaCardShow = { handle: true, identity: true, trait: true, topic: true, format: true, opportunity: true, experiment: true };
check(
  "message: with identity shown",
  dnaCardMessage(a, ALL_SHOW, "@nova.creates"),
  "I don't just create content. I leave a fingerprint. This is my Content DNA: The Result-First Reviewer. What's yours? Discover yours: https://ultra-vestra.vercel.app/dna/nova.creates",
);
check(
  "message: identity hidden falls back to the generic line",
  dnaCardMessage(a, { ...ALL_SHOW, identity: false }, "@nova.creates"),
  "I don't just create content. I leave a fingerprint. This is my Content DNA: my style, my strengths, my creative identity. What's yours? Discover yours: https://ultra-vestra.vercel.app/dna/nova.creates",
);

/* ---------- tiers: thresholds + unlocking ---------- */
check(
  "tiers: the six, in rank order, with their needs",
  DNA_CARD_TIERS.map((t) => [t.id, t.name, t.rank, t.need.v, t.need.p]),
  [["quartz", "Quartz", 1, 8, 0], ["amethyst", "Amethyst", 2, 12, 0], ["sapphire", "Sapphire", 3, 16, 1], ["ruby", "Ruby", 4, 20, 2], ["gold", "Gold", 5, 22, 3], ["diamond", "Diamond", 6, 24, 4]],
);
check("tiers: Gold sits between Ruby and Diamond with its gem colours", (() => { const g = dnaCardTierById("gold"); return [g.rank, g.gemC, g.need]; })(), [5, ["#e8b94a", "#fff1c1"], { v: 22, p: 3 }]);
check("tiers: unknown id falls back to Amethyst (the prototype's tierById)", dnaCardTierById("nope").id, "amethyst");
check("depth: the sample earns v24 p4", dnaDepth(a), { v: 24, p: 4 });
const unlockedIds = (v: number, p: number) => DNA_CARD_TIERS.filter((t) => dnaCardTierUnlocked(t, { v, p })).map((t) => t.id);
check("unlock: 8 videos earns Quartz only", unlockedIds(8, 0), ["quartz"]);
check("unlock: 16 videos, no verified patterns — Sapphire stays locked", unlockedIds(16, 0), ["quartz", "amethyst"]);
check("unlock: 20 videos + 1 verified — Sapphire yes, Ruby no", unlockedIds(20, 1), ["quartz", "amethyst", "sapphire"]);
check("unlock: 22 videos + 3 verified — Gold yes, Diamond still needs the videos", unlockedIds(22, 3), ["quartz", "amethyst", "sapphire", "ruby", "gold"]);
check("unlock: 23 videos + 3 verified — Gold holds, Diamond locked", unlockedIds(23, 3), ["quartz", "amethyst", "sapphire", "ruby", "gold"]);
check("unlock: 24 videos + 2 verified — Gold and Diamond both still need patterns", unlockedIds(24, 2), ["quartz", "amethyst", "sapphire", "ruby"]);
check("unlock: 24 videos + 3 verified — Gold yes, Diamond needs one more pattern", unlockedIds(24, 3), ["quartz", "amethyst", "sapphire", "ruby", "gold"]);
check("unlock: the sample depth earns all six", unlockedIds(24, 4), ["quartz", "amethyst", "sapphire", "ruby", "gold", "diamond"]);
check("needText: plural gaps join with 'and'", dnaCardTierNeedText(dnaCardTierById("diamond"), { v: 20, p: 1 }), "4 more videos and 3 more verified patterns");
check("needText: Gold from scratch", dnaCardTierNeedText(dnaCardTierById("gold"), { v: 8, p: 0 }), "14 more videos and 3 more verified patterns");
check("needText: singular forms", dnaCardTierNeedText(dnaCardTierById("sapphire"), { v: 15, p: 0 }), "1 more video and 1 more verified pattern");
check("needText: unlocked tier needs nothing", dnaCardTierNeedText(dnaCardTierById("ruby"), { v: 20, p: 2 }), "");
const stubAnalysis = (n: number, verified: number): DnaCardAnalysis =>
  ({
    n,
    groups: {
      topic: Array.from({ length: verified }, () => ({ tier: "verified" })),
      format: [],
      hook: [],
      band: [],
    },
  }) as unknown as DnaCardAnalysis;
check("pickTier: no saved tier picks the highest unlocked", dnaCardPickTier(a, null), "diamond");
check("pickTier: a saved unlocked tier is kept", dnaCardPickTier(a, "quartz"), "quartz");
check("pickTier: a locked saved tier falls back", dnaCardPickTier(stubAnalysis(10, 0), "diamond"), "quartz");
check("pickTier: 13 videos lands on Amethyst", dnaCardPickTier(stubAnalysis(13, 0), null), "amethyst");
check("pickTier: 20 videos + 2 verified lands on Ruby", dnaCardPickTier(stubAnalysis(20, 2), null), "ruby");
check("pickTier: 22 videos + 3 verified lands on Gold", dnaCardPickTier(stubAnalysis(22, 3), null), "gold");
check("pickTier: 24 videos + 3 verified still lands on Gold (Diamond needs 4)", dnaCardPickTier(stubAnalysis(24, 3), null), "gold");
check("pickTier: 24 videos + 4 verified lands on Diamond", dnaCardPickTier(stubAnalysis(24, 4), null), "diamond");

if (failures > 0) {
  console.log(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll Creator DNA Card fixtures passed.");
