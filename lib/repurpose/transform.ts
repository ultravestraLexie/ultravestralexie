// Content Repurposing Studio — the reshape math, pure and isolated.
//
// HONESTY RULES (binding):
// - This module ONLY splits and rearranges the creator's own words.
//   It never paraphrases, never summarizes, never invents a claim, a
//   statistic, or a selling point. Every content line in an output
//   is a verbatim piece of the source (title, script, or caption),
//   or one of the labeled PLACEHOLDERS below — slots the source
//   does not fill (a call to action, hashtags, a discussion
//   prompt), marked as placeholders for the creator to write in
//   their own words.
// - The script is split into "beats" on paragraph breaks (blank
//   lines; single newlines when there are no blank-line breaks).
//   Beats are trimmed of surrounding whitespace only — the words
//   inside a beat are never touched.
// - Section labels ("Hook line", "Slide 2", …) are furniture, not
//   content: they name the slot, they assert nothing.
//
// This module has no imports and no I/O on purpose: the page feeds
// it the creator's text, and the no-invention property is exercised
// in isolation by scripts/repurpose-fixtures.ts.

export type RepurposeFormat =
  | "tiktok"
  | "instagram_caption"
  | "facebook_post"
  | "carousel"
  | "community_post";

export const REPURPOSE_FORMATS: { value: RepurposeFormat; label: string }[] = [
  { value: "tiktok", label: "TikTok script" },
  { value: "instagram_caption", label: "Instagram caption" },
  { value: "facebook_post", label: "Facebook post" },
  { value: "carousel", label: "Carousel outline" },
  { value: "community_post", label: "Community post" },
];

/** The creator's own words, as three fields. Any field may be
 *  empty — an empty field yields placeholders, never inventions. */
export type RepurposeSource = {
  title: string;
  /** The hook / script text. Split into beats on paragraph breaks. */
  script: string;
  caption: string;
};

export type RepurposeSection = {
  label: string;
  text: string;
};

export type RepurposeOutput = {
  format: RepurposeFormat;
  formatLabel: string;
  sections: RepurposeSection[];
};

/** Labeled slots the source does not fill. These strings are the
 *  ONLY non-source text a repurposed output may contain (besides
 *  section labels) — fixtures assert exactly that. */
export const PLACEHOLDERS = {
  cta: "[Placeholder — your call to action: write it in your own words]",
  hashtags: "[Placeholder — your hashtags: add only the tags that fit this post]",
  caption: "[Placeholder — your caption: write it in your own words]",
  body: "[Placeholder — your middle beats: add the steps or the story in your own words]",
  title: "[Placeholder — your title: write it in your own words]",
  discussion:
    "[Placeholder — your discussion prompt: ask your audience a question in your own words]",
} as const;

export const PLACEHOLDER_TEXTS: string[] = Object.values(PLACEHOLDERS);

/** Split script text into beats: paragraphs on blank lines, or
 *  lines when the text has no blank-line breaks. Each beat is
 *  trimmed; the words inside are untouched. */
export function splitBeats(script: string): string[] {
  const paragraphs = script
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p !== "");
  if (paragraphs.length > 1) return paragraphs;
  if (paragraphs.length === 1) {
    const lines = paragraphs[0]
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l !== "");
    return lines.length > 0 ? lines : paragraphs;
  }
  return [];
}

function formatLabel(format: RepurposeFormat): string {
  return REPURPOSE_FORMATS.find((f) => f.value === format)?.label ?? format;
}

/**
 * Reshape the creator's own words into one platform format.
 * Deterministic: the same source always yields the same output.
 */
export function repurpose(
  source: RepurposeSource,
  format: RepurposeFormat
): RepurposeOutput {
  const title = source.title.trim();
  const caption = source.caption.trim();
  const beats = splitBeats(source.script);
  const hook = beats[0] ?? "";
  const rest = beats.slice(1);
  const bodyJoined = rest.join("\n\n");
  const allBeatsJoined = beats.join("\n\n");

  const sections: RepurposeSection[] = [];

  switch (format) {
    case "tiktok": {
      sections.push({
        label: "Hook line",
        text: hook !== "" ? hook : title !== "" ? title : PLACEHOLDERS.title,
      });
      sections.push({
        label: "Body beats",
        text: bodyJoined !== "" ? bodyJoined : PLACEHOLDERS.body,
      });
      sections.push({ label: "Closing / call to action", text: PLACEHOLDERS.cta });
      sections.push({
        label: "Caption",
        text: caption !== "" ? caption : PLACEHOLDERS.caption,
      });
      break;
    }
    case "instagram_caption": {
      sections.push({
        label: "Caption — first line (the hook)",
        text: hook !== "" ? hook : title !== "" ? title : PLACEHOLDERS.title,
      });
      const bodyParts = [bodyJoined, caption].filter((p) => p !== "");
      sections.push({
        label: "Caption — body",
        text: bodyParts.length > 0 ? bodyParts.join("\n\n") : PLACEHOLDERS.body,
      });
      sections.push({ label: "Caption — call to action", text: PLACEHOLDERS.cta });
      sections.push({ label: "Hashtags", text: PLACEHOLDERS.hashtags });
      break;
    }
    case "facebook_post": {
      sections.push({
        label: "Headline",
        text: title !== "" ? title : hook !== "" ? hook : PLACEHOLDERS.title,
      });
      const bodyParts = [allBeatsJoined, caption].filter((p) => p !== "");
      sections.push({
        label: "Body",
        text: bodyParts.length > 0 ? bodyParts.join("\n\n") : PLACEHOLDERS.body,
      });
      sections.push({ label: "Call to action", text: PLACEHOLDERS.cta });
      break;
    }
    case "carousel": {
      sections.push({
        label: "Slide 1 — cover",
        text: title !== "" ? title : hook !== "" ? hook : PLACEHOLDERS.title,
      });
      beats.forEach((beat, i) => {
        sections.push({ label: `Slide ${i + 2}`, text: beat });
      });
      if (beats.length === 0) {
        sections.push({ label: "Slide 2", text: PLACEHOLDERS.body });
      }
      sections.push({
        label: `Slide ${sections.length + 1} — call to action`,
        text: PLACEHOLDERS.cta,
      });
      break;
    }
    case "community_post": {
      sections.push({
        label: "Opening line (your title)",
        text: title !== "" ? title : hook !== "" ? hook : PLACEHOLDERS.title,
      });
      const bodyParts = [allBeatsJoined, caption].filter((p) => p !== "");
      sections.push({
        label: "Body",
        text: bodyParts.length > 0 ? bodyParts.join("\n\n") : PLACEHOLDERS.body,
      });
      sections.push({ label: "Discussion prompt", text: PLACEHOLDERS.discussion });
      break;
    }
  }

  return { format, formatLabel: formatLabel(format), sections };
}

/** The whole output as one copyable block: each section's label on
 *  its own line, then its text. Labels are furniture (see header);
 *  every content line is source text or a labeled placeholder. */
export function toPlainText(output: RepurposeOutput): string {
  return output.sections.map((s) => `${s.label}\n${s.text}`).join("\n\n");
}
