// ============================================================================
// Content Repurposing Studio — acceptance fixtures for the reshape
// math (lib/repurpose/transform.ts).
//
// The central proof is NO INVENTION: for every format, every line
// of every output section must be either a labeled placeholder or
// a verbatim substring of the creator's source text (title, script,
// or caption). The transform may split and rearrange — it may
// never write. Fixed inputs also assert each format's structure,
// the fallbacks when a source field is empty, and beat splitting.
//
// Run (from the repo root):
//   npx tsx scripts/repurpose-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  repurpose,
  splitBeats,
  toPlainText,
  PLACEHOLDERS,
  PLACEHOLDER_TEXTS,
  REPURPOSE_FORMATS,
  type RepurposeFormat,
  type RepurposeSource,
} from "../lib/repurpose/transform";

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

const SOURCE: RepurposeSource = {
  title: "My Morning Routine",
  script: "Hook line one.\n\nBeat two here.\n\nBeat three closes it.",
  caption: "My caption text.",
};

const section = (format: RepurposeFormat, label: string) =>
  repurpose(SOURCE, format).sections.find((s) => s.label === label)?.text;

// --- Beat splitting ------------------------------------------------------------------------

check("beats split on paragraph breaks", splitBeats(SOURCE.script), [
  "Hook line one.",
  "Beat two here.",
  "Beat three closes it.",
]);
check(
  "beats split on single lines when there are no paragraph breaks",
  splitBeats("Line one\nLine two\nLine three"),
  ["Line one", "Line two", "Line three"]
);
check("empty script yields no beats", splitBeats(""), []);
check(
  "beats are trimmed but never rewritten",
  splitBeats("  Padded beat.  \n\n\tSecond beat. "),
  ["Padded beat.", "Second beat."]
);

// --- TikTok ----------------------------------------------------------------------------------

check("tiktok hook is the first beat, verbatim", section("tiktok", "Hook line"), "Hook line one.");
check(
  "tiktok body is the remaining beats, verbatim and in order",
  section("tiktok", "Body beats"),
  "Beat two here.\n\nBeat three closes it."
);
check("tiktok CTA is a labeled placeholder", section("tiktok", "Closing / call to action"), PLACEHOLDERS.cta);
check("tiktok caption is the source caption", section("tiktok", "Caption"), "My caption text.");

// --- Instagram caption -------------------------------------------------------------------------

check(
  "instagram first line is the hook",
  section("instagram_caption", "Caption — first line (the hook)"),
  "Hook line one."
);
check(
  "instagram body is the remaining beats plus the caption",
  section("instagram_caption", "Caption — body"),
  "Beat two here.\n\nBeat three closes it.\n\nMy caption text."
);
check("instagram hashtags are a labeled placeholder", section("instagram_caption", "Hashtags"), PLACEHOLDERS.hashtags);

// --- Facebook post ------------------------------------------------------------------------------

check("facebook headline is the title", section("facebook_post", "Headline"), "My Morning Routine");
check(
  "facebook body is every beat plus the caption",
  section("facebook_post", "Body"),
  "Hook line one.\n\nBeat two here.\n\nBeat three closes it.\n\nMy caption text."
);

// --- Carousel -------------------------------------------------------------------------------------

const carousel = repurpose(SOURCE, "carousel");
check(
  "carousel is cover + one slide per beat + a CTA slide",
  carousel.sections.map((s) => s.label),
  ["Slide 1 — cover", "Slide 2", "Slide 3", "Slide 4", "Slide 5 — call to action"]
);
check(
  "carousel slides carry the title then the beats, verbatim",
  carousel.sections.map((s) => s.text),
  [
    "My Morning Routine",
    "Hook line one.",
    "Beat two here.",
    "Beat three closes it.",
    PLACEHOLDERS.cta,
  ]
);

// --- Community post ---------------------------------------------------------------------------------

check("community opening is the title", section("community_post", "Opening line (your title)"), "My Morning Routine");
check(
  "community discussion prompt is a labeled placeholder",
  section("community_post", "Discussion prompt"),
  PLACEHOLDERS.discussion
);

// --- NO INVENTION: the doctrine proof -----------------------------------------------------------------
//
// For every format: split every section's text into lines. Each
// line must be a labeled placeholder or a verbatim substring of
// the combined source. If the transform ever paraphrases, adds a
// claim, or invents a statistic, a line appears that is in neither
// set and this fails.

const combinedSource = [SOURCE.title, SOURCE.script, SOURCE.caption].join("\n");
for (const { value } of REPURPOSE_FORMATS) {
  const output = repurpose(SOURCE, value);
  const invented: string[] = [];
  for (const s of output.sections) {
    for (const line of s.text.split("\n")) {
      if (line === "") continue;
      if (PLACEHOLDER_TEXTS.includes(line)) continue;
      if (!combinedSource.includes(line)) invented.push(line);
    }
  }
  check(`no invented content in ${value}`, invented, []);
}

// --- Fallbacks: empty fields yield placeholders, never inventions --------------------------------------

const empty = repurpose({ title: "", script: "", caption: "" }, "tiktok");
check("empty source: hook falls back to the title placeholder", empty.sections[0].text, PLACEHOLDERS.title);
check("empty source: body falls back to the body placeholder", empty.sections[1].text, PLACEHOLDERS.body);
check("empty source: caption falls back to the caption placeholder", empty.sections[3].text, PLACEHOLDERS.caption);

const noTitle = repurpose({ title: "", script: SOURCE.script, caption: "" }, "facebook_post");
check(
  "facebook headline falls back to the first beat when there is no title",
  noTitle.sections[0].text,
  "Hook line one."
);

const oneBeat = repurpose(
  { title: "T", script: "Only one beat.", caption: "" },
  "tiktok"
);
check("single-beat script: body is the placeholder, not a rewrite", oneBeat.sections[1].text, PLACEHOLDERS.body);
check("single-beat script: hook is the beat", oneBeat.sections[0].text, "Only one beat.");

const emptyCarousel = repurpose({ title: "", script: "", caption: "" }, "carousel");
check(
  "empty carousel still has cover, a body slide, and a CTA slide — all placeholders",
  emptyCarousel.sections.map((s) => s.text),
  [PLACEHOLDERS.title, PLACEHOLDERS.body, PLACEHOLDERS.cta]
);

// --- Plain text -------------------------------------------------------------------------------------------

const plain = toPlainText(repurpose(SOURCE, "tiktok"));
check(
  "plain text carries labels and source text for the copy button",
  plain.startsWith("Hook line\nHook line one.") && plain.includes("My caption text."),
  true
);

console.log(failures === 0 ? "\nALL REPURPOSE FIXTURES PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
