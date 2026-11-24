/* Studio (Video Studio) — the owner's reference design ported
 * faithfully (2026-11-23): five stages (Idea / Script / Analyze /
 * Rehearse / Publish), an on-device script check with five scores
 * (Hook / Retention / Trust / Clarity / Conversion), a delivery
 * plan split into beats, and a publish checklist. Deterministic,
 * no model calls. The full Buyer Brain V3 read still comes from
 * /api/creator-lab and is layered on top in the Analyze stage —
 * never replaced by this. Pure functions only; the component
 * lives in app/studio/StudioClient.tsx. */

export const WORDS_PER_SECOND = 2.5; // average speaking pace
export const TARGET: [number, number] = [20, 45]; // seconds: sweet spot for a short video
export const MAX_SECONDS = 60; // longer than this gets flagged
export const MIN_WORDS = 20; // script needs this many words before checks run
export const STRONG = 70; // a check counts as strong at this score
export const STORAGE_KEY = "uv-studio-draft";

export type StudioVideo = {
  audience: string;
  feeling: string;
  product: string;
  price: string;
  script: string;
  caption: string;
  rehearsed: Record<string, boolean>;
  published: Record<string, boolean>;
};

export const EMPTY_VIDEO: StudioVideo = {
  audience: "",
  feeling: "",
  product: "",
  price: "",
  script: "",
  caption: "",
  rehearsed: {},
  published: {},
};

export const SAMPLE_VIDEO: StudioVideo = {
  ...EMPTY_VIDEO,
  audience: "Busy moms who skip skincare",
  feeling: "Relief that this takes 30 seconds",
  product: "Glow Serum",
  price: "28",
  script:
    "If you skip skincare because you don't have time, this is for you. I'm a mom of three and my routine used to be nothing. " +
    "Now it's one step. Glow Serum goes on in about 30 seconds while my coffee brews. " +
    "Two weeks in, my skin looks less tired and I actually remember to do it. " +
    "It's 28 dollars and one bottle lasts me over a month. Tap the link to grab yours.",
};

/* ---------- text helpers ---------- */
export const norm = (t: string): string =>
  (t || "").replace(/[’‘]/g, "'").trim();
export const wordsOf = (t: string): string[] =>
  norm(t).split(/\s+/).filter(Boolean);
export const sentencesOf = (t: string): string[] =>
  norm(t)
    .replace(/([.!?])\s+/g, "$1\n")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
const STOP = new Set(
  "that this with what they them their from your have will just about into than then when were been because really".split(" ")
);
export const keywords = (t: string): string[] =>
  (norm(t).toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => !STOP.has(w));
export const secondsFor = (n: number): number => Math.round(n / WORDS_PER_SECOND);
export const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));
export const plural = (n: number, one: string, many: string = one + "s"): string =>
  `${n} ${n === 1 ? one : many}`;
export const joinAnd = (a: string[]): string =>
  a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;
export const escapeRe = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ---------- the script check (5 scores, each with its top fix) ---------- */
export type StudioCheck = {
  key: string;
  label: string;
  score: number;
  fix?: string;
};

export type StudioReport = {
  words: number;
  secs: number;
  checks: StudioCheck[];
  weak: StudioCheck[];
  avg: number;
};

export function analyzeScript(v: StudioVideo): StudioReport {
  const text = norm(v.script);
  const lower = text.toLowerCase();
  const words = wordsOf(text);
  const sents = sentencesOf(text);
  const first = sents[0] || "";
  const firstLen = wordsOf(first).length;
  const lastTwo = sents.slice(-2).join(" ").toLowerCase();
  const avgLen = sents.length ? words.length / sents.length : 0;
  const secs = secondsFor(words.length);
  const fillers =
    lower.match(/\b(basically|literally|um|uh|you know|kind of|sort of)\b/g) || [];
  const checks: StudioCheck[] = [];

  // HOOK: does the first line stop the scroll?
  {
    let s = 40;
    const f: string[] = [];
    if (firstLen <= 12) s += 20;
    else
      f.push(
        `Your first line is ${firstLen} words. Get it to 12 or fewer so it lands in about 3 seconds.`
      );
    if (/\byou(r)?\b/i.test(first)) s += 15;
    else f.push(`Talk to the viewer: put "you" in the first line.`);
    if (/\?|\d/.test(first)) s += 15;
    if (keywords(v.audience).some((w) => first.toLowerCase().includes(w))) s += 10;
    else if (v.audience.trim())
      f.push(`Call out your viewer in line one (${v.audience.trim()}).`);
    if (/^(hi|hey|hello|so|okay|ok|today|welcome|in this video)\b/i.test(first)) {
      s -= 30;
      f.unshift("Cut the greeting. Open on the problem your viewer has.");
    }
    checks.push({ key: "hook", label: "Hook", score: clamp(s), fix: f[0] });
  }

  // RETENTION: will they stay to the end?
  {
    let s = 100;
    const f: string[] = [];
    if (secs < TARGET[0]) {
      s -= 30;
      f.push(
        `About ${secs}s is short. Aim for ${TARGET[0]}–${TARGET[1]}s so there's time to build trust.`
      );
    } else if (secs > MAX_SECONDS) {
      s -= 35;
      f.push(`About ${secs}s is long. Trim it to under ${TARGET[1]}s.`);
    } else if (secs > TARGET[1]) {
      s -= 15;
      f.push(`About ${secs}s. Trimming toward ${TARGET[1]}s helps people stay to the end.`);
    }
    if (avgLen > 18) {
      s -= 25;
      f.push(
        `Sentences average ${Math.round(avgLen)} words. Break them up so each line is one idea.`
      );
    }
    if (fillers.length >= 2) {
      s -= 15;
      f.push(`Cut filler words (${[...new Set(fillers)].join(", ")}.`);
    }
    checks.push({ key: "retention", label: "Retention", score: clamp(s), fix: f[0] });
  }

  // TRUST: does it sound like a real person?
  {
    let s = 30;
    const f: string[] = [];
    const hype =
      lower.match(/\b(miracle|guaranteed|best ever|life[- ]changing|cures?|instantly|100%)/g) ||
      [];
    if (/\b(i|i'm|i've|my|me)\b/i.test(text)) s += 30;
    else f.push(`Add your own experience, like "I tried this for 2 weeks…"`);
    if (/\d|\b(seconds?|minutes?|days?|weeks?|months?)\b/i.test(text)) s += 20;
    else f.push("Add one specific detail: a number, a timeframe or a result.");
    if (/\b(honestly|i tried|i've been|used to|before|weeks in|days in|i was)\b/i.test(text))
      s += 20;
    else f.push("Show a before and after: what changed for you?");
    if (hype.length) {
      s -= 25;
      f.unshift(`Drop "${hype[0]}". Hype claims read like an ad and can get flagged.`);
    }
    checks.push({ key: "trust", label: "Trust", score: clamp(s), fix: f[0] });
  }

  // CLARITY: is the product and the benefit obvious?
  {
    let s = 0;
    const f: string[] = [];
    const product = v.product.trim();
    if (!product) f.push("Add the product name in Idea so we can check you say it.");
    else if (lower.includes(product.toLowerCase())) s += 40;
    else f.push(`Say "${product}" out loud at least once.`);
    const benefit = keywords(v.feeling);
    if (!benefit.length)
      f.push("Fill in what viewers should feel or get (Idea) so we can check you deliver it.");
    else if (benefit.some((w) => lower.includes(w))) s += 30;
    else f.push(`Your goal is "${v.feeling.trim()}". Say that benefit plainly.`);
    if (avgLen && avgLen <= 15) s += 30;
    else f.push("Use shorter, plainer sentences.");
    checks.push({ key: "clarity", label: "Clarity", score: clamp(s), fix: f[0] });
  }

  // CONVERSION: is there one clear next step?
  {
    let s = 20;
    const f: string[] = [];
    const cta = /\b(link|tap|click|shop|cart|grab|get yours|buy|order|try it|check it out)\b/;
    if (cta.test(lower)) {
      s += 40;
      if (cta.test(lastTwo)) s += 20;
      else f.push("Move your call to action to the last line.");
    } else f.push(`End with one clear action, like "Tap the link to grab yours."`);
    const price = String(v.price).replace(/[^0-9.]/g, "").replace(/\.0+$/, "");
    if (!price || lower.includes(price) || /\b(under|only|less than|sale|deal|off)\b/.test(lower))
      s += 20;
    else
      f.push(
        `Mention the price ($${price}) or the deal. It answers the viewer's last question.`
      );
    checks.push({ key: "conversion", label: "Conversion", score: clamp(s), fix: f[0] });
  }

  const weak = checks.filter((c) => c.score < STRONG);
  const avg = Math.round(checks.reduce((t, c) => t + c.score, 0) / checks.length);
  return { words: words.length, secs, checks, weak, avg };
}

/* ---------- delivery plan for Rehearse ---------- */
export type DeliveryBeat = { label: string; time: string; line: string; tip: string };

export function deliveryPlan(v: StudioVideo): DeliveryBeat[] {
  const sents = sentencesOf(v.script);
  if (!sents.length) return [];
  const product = v.product.trim() || "the product";
  const hook = sents[0];
  const cta = sents.length > 2 ? sents[sents.length - 1] : "";
  const body = sents.slice(1, cta ? -1 : undefined).join(" ");
  const len = (t: string) => secondsFor(wordsOf(t).length);
  const t1 = len(hook);
  const t2 = t1 + len(body);
  const beats: DeliveryBeat[] = [
    {
      label: "Hook",
      time: `0–${t1}s`,
      line: hook,
      tip: "Look straight into the lens. Start mid-action, no greeting.",
    },
  ];
  if (body)
    beats.push({
      label: "Story",
      time: `${t1}–${t2}s`,
      line: body,
      tip: `Show ${product} in your hand while you talk. Slow down on the numbers.`,
    });
  if (cta)
    beats.push({
      label: "Call to action",
      time: `${t2}–${t2 + len(cta)}s`,
      line: cta,
      tip: "Hold the product up to the camera, then point to the link.",
    });
  return beats;
}

/** Split a beat line into plain / emphasised segments — the
 * product name and any numbers are the words to stress. */
export function emphasisParts(
  line: string,
  v: StudioVideo
): { text: string; em: boolean }[] {
  const parts = [
    v.product.trim() && escapeRe(v.product.trim()),
    "\\$?\\d+(?:[.,]\\d+)?%?",
  ].filter(Boolean) as string[];
  const re = new RegExp(`(${parts.join("|")})`, "gi");
  return line.split(re).map((text, i) => ({ text, em: i % 2 === 1 }));
}

/* ---------- checklists ---------- */
export const REHEARSE: { key: string; label: string }[] = [
  { key: "readAloud", label: "Read it out loud once" },
  { key: "testTake", label: "Record one test take" },
  { key: "watchBack", label: "Watch it back with the sound off" },
];

export const DISCLOSURE = /#(ad|sponsored|partner|affiliate|paidpartnership)\b/i;

export type PublishItem = {
  key: string;
  short: string;
  label: string;
  done: boolean;
  locked?: boolean;
  note?: string;
};

export function publishItems(v: StudioVideo): PublishItem[] {
  const found = DISCLOSURE.test(v.caption);
  return [
    {
      key: "caption",
      short: "caption",
      label: "Write a caption",
      done: v.caption.trim().length >= 10,
      locked: true,
      note: v.caption.trim().length >= 10 ? "Done" : "Fills in when you write one",
    },
    {
      key: "disclosure",
      short: "disclosure",
      label: "Disclose the partnership (#ad or the paid-partnership label)",
      done: found || !!v.published.disclosure,
      locked: found,
      note: found ? "Found in your caption" : "",
    },
    {
      key: "productLink",
      short: "product tag",
      label: `Tag the product${v.product.trim() ? ` (${v.product.trim()})` : ""}`,
      done: !!v.published.productLink,
    },
  ];
}

export function suggestCaption(v: StudioVideo): string {
  const hook = sentencesOf(v.script)[0] || "";
  const tag = v.product.trim()
    ? " #" + v.product.replace(/[^A-Za-z0-9]/g, "").toLowerCase()
    : "";
  return `${hook}${tag} #ad`.trim();
}

/* ---------- the 5 stages ---------- */
export type StudioStageState = "done" | "work" | "todo" | "wait";
export type StudioStageStatus = {
  state: StudioStageState;
  status: string;
  detail: string;
  cta: string;
};

export function ideaStage(v: StudioVideo): StudioStageStatus {
  const missing = [
    !v.audience.trim() && "who it's for",
    !v.feeling.trim() && "what they should feel",
    !v.product.trim() && "the product",
  ].filter(Boolean) as string[];
  if (missing.length === 3)
    return {
      state: "todo",
      status: "Start with who this video is for",
      detail: "Human first: who is this for, and what should they feel or get by the end?",
      cta: "Answer 3 quick questions",
    };
  if (missing.length)
    return {
      state: "work",
      status: `${3 - missing.length} of 3 answered`,
      detail: `Still needed: ${joinAnd(missing)}.`,
      cta: `Add ${missing[0]}`,
    };
  return { state: "done", status: `For: ${v.audience.trim()}`, detail: "", cta: "Edit idea" };
}

export function scriptStage(v: StudioVideo, a: StudioReport): StudioStageStatus {
  const range = `${Math.round(TARGET[0] * WORDS_PER_SECOND)}–${Math.round(
    TARGET[1] * WORDS_PER_SECOND
  )} words`;
  if (!a.words)
    return {
      state: "todo",
      status: "No script yet",
      detail: "Write it the way you'll say it on camera.",
      cta: "Write your script",
    };
  if (a.secs < TARGET[0])
    return {
      state: "work",
      status: `${plural(a.words, "word")} · about ${a.secs}s`,
      detail: `Keep going. ${TARGET[0]}–${TARGET[1]} seconds is about ${range}.`,
      cta: "Keep writing",
    };
  if (a.secs > MAX_SECONDS)
    return {
      state: "work",
      status: `${a.words} words · about ${a.secs}s`,
      detail: `That's long for a short video. Trim to ${range}.`,
      cta: "Trim your script",
    };
  return {
    state: "done",
    status: `${a.words} words · about ${a.secs}s on camera`,
    detail: "",
    cta: "Edit script",
  };
}

export function analyzeStage(v: StudioVideo, a: StudioReport): StudioStageStatus {
  if (a.words < MIN_WORDS)
    return { state: "wait", status: "Waiting on your script", detail: "", cta: "" };
  if (a.weak.length)
    return {
      state: "work",
      status: `${plural(a.weak.length, "weak spot")}: ${a.weak.map((c) => c.label).join(", ")}`,
      detail: a.weak[0].fix || "",
      cta: `Fix your ${a.weak[0].label.toLowerCase()}`,
    };
  return {
    state: "done",
    status: `Strong on all 5 checks · average ${a.avg}`,
    detail: "",
    cta: "See the scores",
  };
}

export function rehearseStage(v: StudioVideo, a: StudioReport): StudioStageStatus {
  if (a.words < MIN_WORDS)
    return { state: "wait", status: "Waiting on your script", detail: "", cta: "" };
  const n = REHEARSE.filter((r) => v.rehearsed[r.key]).length;
  if (n === REHEARSE.length)
    return { state: "done", status: "Rehearsed and ready to film", detail: "", cta: "See delivery plan" };
  return {
    state: n ? "work" : "todo",
    status: n
      ? `${n} of ${REHEARSE.length} rehearsal steps done`
      : `Delivery plan ready · about ${a.secs}s`,
    detail: "Your script is split into beats with filming directions.",
    cta: "Open delivery plan",
  };
}

export function publishStage(v: StudioVideo, a: StudioReport): StudioStageStatus {
  if (a.words < MIN_WORDS)
    return { state: "wait", status: "Waiting on your script", detail: "", cta: "" };
  const items = publishItems(v);
  const left = items.filter((i) => !i.done);
  if (!left.length)
    return { state: "done", status: "Ready to post", detail: "", cta: "Review checklist" };
  return {
    state: left.length === items.length ? "todo" : "work",
    status: `${items.length - left.length} of ${items.length} done · next: ${left[0].short}`,
    detail: `${left[0].label}.`,
    cta: "Finish publishing checklist",
  };
}

export const STAGE_STATE: Record<
  StudioStageState,
  { label: string; color: string }
> = {
  done: { label: "Ready", color: "#4ade80" },
  work: { label: "Needs work", color: "#facc15" },
  todo: { label: "To do", color: "#e879f9" },
  wait: { label: "Waiting", color: "#6b6385" },
};

export const STUDIO_STAGES: {
  key: "idea" | "script" | "analyze" | "rehearse" | "publish";
  n: string;
  name: string;
  color: string;
  build: (v: StudioVideo, a: StudioReport) => StudioStageStatus;
}[] = [
  { key: "idea", n: "01", name: "IDEA", color: "#e879f9", build: ideaStage },
  { key: "script", n: "02", name: "SCRIPT", color: "#a78bfa", build: scriptStage },
  { key: "analyze", n: "03", name: "ANALYZE", color: "#38bdf8", build: analyzeStage },
  { key: "rehearse", n: "04", name: "REHEARSE", color: "#34d399", build: rehearseStage },
  { key: "publish", n: "05", name: "PUBLISH", color: "#fbbf24", build: publishStage },
];
