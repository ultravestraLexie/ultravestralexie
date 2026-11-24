// ============================================================================
// Content pipeline — acceptance fixtures (demo "Content plan" board
// copied into the Studio, 2026-11-23).
//
// The owner's Content DNA demo (~/workspace/user/files/
// content-dna-demo_16_2ivm.html) also carried a content board: items
// {id, title, dealId, platform, status, dueAt} moving through its
// status chain ["idea","scripting","filming","scheduled","posted"],
// posted items carrying {postedAt, stats:{views, likes, comments,
// shares, sales}}, and a converter (its Vb) feeding Content DNA:
// filter status==="posted" && stats && postedAt, map to DNA posts
// with source "app". The port (lib/galaxy/pipeline.ts) follows the
// owner's brief for this build: the four working statuses
// scripting → filming → scheduled → posted (no "idea"), results
// with views required, and the demo's Discover rule — the "Use my
// Ultra Vestra posts" source is enabled only when ≥1 posted item
// has results, with "No posted videos with results yet" kept as
// its disabled label. The pins below lock the chain, the results
// test, the conversion field-for-field, the store's corruption
// tolerance, and the Studio/DNA wiring.
//
// Run (from the repo root):
//   npx tsx scripts/pipeline-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "node:fs";
import {
  PIPELINE_STATUSES,
  PIPELINE_STATUS_LABELS,
  PIPELINE_STORAGE_KEY,
  countsByStatus,
  createPipelineItem,
  dnaSourceFromPipeline,
  hasResults,
  nextStatus,
  parsePipelineState,
  pipelineToDnaPosts,
  prevStatus,
  statusIndex,
  type PipelineItem,
} from "../lib/galaxy/pipeline";
import { EMPTY_DNA_STATE, SOURCES, analyzeDna } from "../lib/galaxy/dna";

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

/* ---------- store key + status chain ---------- */
check("pipeline: storage key", PIPELINE_STORAGE_KEY, "uv-content-pipeline");
check("chain: order is the brief's four", PIPELINE_STATUSES, ["scripting", "filming", "scheduled", "posted"]);
check("chain: labels", PIPELINE_STATUS_LABELS, {
  scripting: "Scripting",
  filming: "Filming",
  scheduled: "Scheduled",
  posted: "Posted",
});
check("chain: next scripting", nextStatus("scripting"), "filming");
check("chain: next filming", nextStatus("filming"), "scheduled");
check("chain: next scheduled", nextStatus("scheduled"), "posted");
check("chain: next posted is the end", nextStatus("posted"), null);
check("chain: prev posted", prevStatus("posted"), "scheduled");
check("chain: prev scripting is the start", prevStatus("scripting"), null);
check("chain: indexes", PIPELINE_STATUSES.map(statusIndex), [0, 1, 2, 3]);

/* ---------- items ---------- */
const fresh = createPipelineItem("  Morning routine  ", "scripting");
check("item: title is trimmed", fresh.title, "Morning routine");
check("item: defaults untagged on the default platform", [fresh.topic, fresh.format, fresh.platform], ["", "", "TikTok"]);
check("item: default status is scripting", createPipelineItem("X").status, "scripting");

const full: PipelineItem = {
  id: "c3",
  title: "Lip oil try-on",
  status: "posted",
  topic: "Beauty & skincare",
  format: "Talking head",
  platform: "TikTok",
  hookStyle: "bold",
  lengthSec: 34,
  postedDate: "2026-11-19",
  dealId: "d4",
  dealLabel: "Mira Beauty",
  results: { views: 48200, shares: 140, saves: 920, comments: 212, likes: 3900, watchSec: 21.5, clicks: 640, sales: 37 },
};
const bare: PipelineItem = {
  id: "c9",
  title: "Quiet post",
  status: "posted",
  topic: "",
  format: "",
  platform: "Instagram",
  postedDate: "2026-11-20",
  results: { views: 900 },
};
const noViews: PipelineItem = {
  id: "c10",
  title: "Posted, no numbers yet",
  status: "posted",
  topic: "",
  format: "",
  platform: "TikTok",
  postedDate: "2026-11-21",
};
const working: PipelineItem = { id: "c1", title: "Lumen video 2", status: "scripting", topic: "", format: "", platform: "TikTok" };
const filming: PipelineItem = {
  id: "c2",
  title: "Has numbers but not posted",
  status: "filming",
  topic: "",
  format: "",
  platform: "TikTok",
  results: { views: 100 },
};

/* ---------- hasResults ---------- */
check("results: posted with full results", hasResults(full), true);
check("results: posted with views only", hasResults(bare), true);
check("results: posted without results", hasResults(noViews), false);
check("results: results on an unposted item do not count", hasResults(filming), false);
check("results: scripting item", hasResults(working), false);
check(
  "results: a recorded zero is a present value",
  hasResults({ ...bare, id: "z", results: { views: 0 } }),
  true
);

/* ---------- counts ---------- */
check("counts: by status", countsByStatus([full, bare, noViews, working, filming]), {
  scripting: 1,
  filming: 1,
  scheduled: 0,
  posted: 3,
});
check("counts: empty board", countsByStatus([]), { scripting: 0, filming: 0, scheduled: 0, posted: 0 });

/* ---------- the DNA conversion (the demo's Vb, field for field) ---------- */
const converted = pipelineToDnaPosts([full], NOW);
check("convert: one qualifying item converts", converted.length, 1);
check("convert: full item, every field", converted[0], {
  id: "uv-c3",
  source: "app",
  title: "Lip oil try-on",
  hook: "Lip oil try-on",
  date: "2026-11-19",
  platform: "TikTok",
  topic: "Beauty & skincare",
  format: "Talking head",
  length: 34,
  views: 48200,
  likes: 3900,
  comments: 212,
  shares: 140,
  saves: 920,
  watch: 21.5,
  clicks: 640,
  sales: 37,
  hookStyle: "bold",
});
check("convert: unrecorded counts read 0, unrecorded rates stay null", pipelineToDnaPosts([bare], NOW)[0], {
  id: "uv-c9",
  source: "app",
  title: "Quiet post",
  hook: "Quiet post",
  date: "2026-11-20",
  platform: "Instagram",
  topic: "",
  format: "",
  length: null,
  views: 900,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: null,
  watch: null,
  clicks: null,
  sales: null,
});
check(
  "convert: scripting and posted-without-views items are excluded",
  pipelineToDnaPosts([working, filming, noViews, full], NOW).map((p) => p.id),
  ["uv-c3"]
);
check(
  "convert: a missing posted date falls back to the day it is read",
  pipelineToDnaPosts([{ ...bare, postedDate: undefined }], NOW)[0]?.date,
  "2026-11-24"
);

/* ---------- the DNA source decision ---------- */
check("dna source: empty pipeline is disabled", dnaSourceFromPipeline([], NOW), { enabled: false, count: 0, posts: [] });
check(
  "dna source: pipeline without results stays disabled",
  dnaSourceFromPipeline([working, noViews], NOW).enabled,
  false
);
const src = dnaSourceFromPipeline([working, full, bare], NOW);
check("dna source: enabled at one posted item with results", src.enabled, true);
check("dna source: count is the converted posts", src.count, 2);
check("dna source: posts carry the app source label", src.posts.every((p) => p.source === "app"), true);
check("dna source: SOURCES names it the prototype's way", SOURCES.app, "Your Ultra Vestra posts");

/* ---------- end to end: converted posts are readable by the engine ---------- */
const ten: PipelineItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `e${i}`,
  title: `Post number ${i + 1}`,
  status: "posted" as const,
  topic: i % 2 ? "Product reviews" : "Skincare",
  format: "Talking head",
  platform: "TikTok",
  lengthSec: 30,
  postedDate: "2026-10-20",
  results: { views: 1000 * (i + 1), likes: 90 * (i + 1), comments: 12 * (i + 1), shares: 8 * (i + 1), saves: 40 * (i + 1) },
}));
const A = analyzeDna({ ...EMPTY_DNA_STATE, started: true, source: "app", posts: pipelineToDnaPosts(ten, NOW) }, NOW);
check("e2e: all 10 converted posts are usable by DNA", A.usable.length, 10);
check("e2e: 10 posts unlock patterns", A.enough, true);

/* ---------- the store tolerates corrupt data ---------- */
check("store: null is the empty state", parsePipelineState(null), { v: 1, items: [] });
check("store: a foreign string is the empty state", parsePipelineState("uv-app-data"), { v: 1, items: [] });
check("store: items of the wrong shape is the empty state", parsePipelineState({ items: "nope" }), { v: 1, items: [] });
const mixed = parsePipelineState({
  v: 1,
  items: [
    { id: "ok", title: "Kept", status: "filming", topic: "Skincare", format: "", platform: "YouTube" },
    { id: "bad-status", title: "Dropped", status: "idea" },
    { title: "No id", status: "posted" },
    "junk",
    { id: "ok2", title: "Kept too", status: "posted", results: { views: "many", shares: 5 } },
    { id: "ok3", title: "Results kept", status: "posted", results: { views: 700, saves: 3 } },
  ],
});
check("store: malformed items drop, valid items stay", mixed.items.map((i) => i.id), ["ok", "ok2", "ok3"]);
check("store: results without a numeric views are dropped, item stays", mixed.items[1]?.results, undefined);
check("store: valid results survive sanitized", mixed.items[2]?.results, { views: 700, saves: 3 });
check("store: missing platform defaults", mixed.items[1]?.platform, "TikTok");

/* ---------- placement + wiring (source pins) ---------- */
const studioPage = readFileSync("app/studio/page.tsx", "utf8");
const section = readFileSync("app/studio/PipelineSection.tsx", "utf8");
const dnaClient = readFileSync("app/studio/dna/DnaClient.tsx", "utf8");
check("placement: Studio page renders the pipeline", studioPage.includes("<PipelineSection"), true);
check(
  "placement: pipeline sits below the flow, above the DNA card",
  studioPage.indexOf("<StudioClient") < studioPage.indexOf("<PipelineSection") &&
    studioPage.indexOf("<PipelineSection") < studioPage.indexOf("<DnaLink"),
  true
);
check("placement: page passes the user's deals for the link select", studioPage.includes("fetchDeals"), true);
check("section: heading", section.includes("Content pipeline"), true);
check("section: board groups by the four statuses in order", section.includes("PIPELINE_STATUSES.map"), true);
check("section: status labels come from the chain", section.includes("PIPELINE_STATUS_LABELS"), true);
check("section: move controls walk the chain", section.includes("Move to") && section.includes("nextStatus") && section.includes("prevStatus"), true);
check("section: add-a-video form", section.includes("Add a video") && section.includes("Add video"), true);
check(
  "section: results form fields",
  ["Views (required)", "Shares", "Saves", "Comments", "Likes", "Average watch (seconds)", "Clicks", "Sales"].every((f) =>
    section.includes(f)
  ),
  true
);
check(
  "section: posted-group empty copy is the demo's",
  section.includes("No posts in the last 30 days yet. Posted videos show their results here."),
  true
);
check("section: overall empty state invites the first video", section.includes("Nothing planned."), true);
check("section: device-local honesty in the footer", section.includes("Saved on this device."), true);
check("section: reads and writes the pipeline store", section.includes("loadPipelineState") && section.includes("savePipelineState"), true);
check("section: deal link is a select of the user's deals", section.includes("Brand deal (optional)"), true);
check("dna wire: Discover reads the pipeline store", dnaClient.includes("loadPipelineState") && dnaClient.includes("dnaSourceFromPipeline"), true);
check("dna wire: app source disabled only when the pipeline has no results", dnaClient.includes("disabled={!appSource.count}"), true);
check(
  "dna wire: disabled label kept, enabled label counts results",
  dnaClient.includes("No posted videos with results yet") && dnaClient.includes("with results"),
  true
);
check("dna wire: choosing it picks the app source", dnaClient.includes('setPicked({ source: "app"'), true);
check("dna wire: picked label is the demo's", dnaClient.includes('from Ultra Vestra'), true);

if (failures) {
  console.log(`\n${failures} FAILURES`);
  process.exit(1);
}
console.log("\nALL PIPELINE FIXTURES PASS");
