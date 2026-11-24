/* Content DNA — the owner's "Ultra Vestra Content DNA" prototype
 * ported faithfully (2026-11-23): a pattern-finder that studies a
 * creator's real posts (hooks, topics, formats, length), scores each
 * post against the creator's own goal, and surfaces the patterns
 * that beat their baseline — with the evidence (Mann–Whitney p,
 * Benjamini–Hochberg q, confidence tier) shown, never hidden.
 * Opportunities rank by evidence; the Lab turns one into an
 * experiment; the 30-Day Challenge runs it; Share makes a
 * labels-only card. Deterministic, no model calls. Pure functions
 * only; the component lives in app/studio/dna/DnaClient.tsx.
 * State persists on this device only (localStorage
 * "uv-content-dna") — the prototype's own storage key. */

export const DNA_STORAGE_KEY = "uv-content-dna";
export const DNA_SHARE_URL = "ultravestra.app/dna";
export const DNA_UNLOCK_POSTS = 8; // "Patterns unlock at 8."

/* ---------- types ---------- */

export type DnaPost = {
  id: string;
  source: string; // sample | import | app | manual
  title: string;
  hook: string;
  date: string; // ISO
  platform: string;
  topic: string;
  format: string;
  length: number | null; // seconds
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number | null;
  watch: number | null; // avg watch seconds
  clicks?: number | null;
  sales?: number | null;
  hookStyle?: string;
  edited?: boolean;
};

export type EnrichedPost = DnaPost & {
  hookStyle: string;
  lengthBucket: string | null;
  m: Record<string, number | null>;
  age: number; // days
  fresh: boolean;
  score: number;
};

export type DnaLead = {
  key: string;
  ratio: number;
  signed: number;
  group: number;
  rest: number;
  n: number;
};

export type DnaPattern = {
  id: string;
  dim: string;
  value: string;
  name: string;
  n: number;
  restN: number;
  share: number;
  lift: number;
  p: number;
  q: number;
  conf: "strong" | "some" | "hypothesis";
  lead: DnaLead | null;
  beat: number;
  posts: EnrichedPost[];
  caveats: string[];
  overlap?: string;
};

export type DnaOpportunity = {
  id: string;
  kind: string;
  pattern: string;
  dim: string;
  value: string;
  title: string;
  why: string;
  whyNow: string;
  todo: string;
  format: string;
  effort: number;
  effortLabel: string;
  hook: string;
  need: string;
  metric: string;
  baseline: number | null;
  target: number | null;
  minPosts: number;
  conf: string;
  lift: number;
  evidence: EnrichedPost[];
  rank: number;
  lesson?: string;
  inLab?: string;
  status?: string | null;
};

export type DnaExperiment = {
  id: string;
  title: string;
  what?: string;
  hypothesis?: string;
  change?: string;
  metric: string;
  baseline: number | null;
  target: number | null;
  minPosts: number;
  startedAt: number;
  postIds: string[];
  status: "running" | "done";
  oppId?: string;
  pattern?: string;
  verdict?: string;
};

export type DnaSnapshot = {
  at: number;
  sig: string;
  reason: string;
  posts: number;
  top: string[];
};

export type DnaState = {
  v: 1;
  started: boolean;
  source: string | null;
  posts: DnaPost[];
  objective: string;
  snapshots: DnaSnapshot[];
  decisions: Record<string, string>;
  experiments: DnaExperiment[];
  challenge: { startedAt: number; experimentId: string; checkins: number[]; completedAt: number | null } | null;
  dismissed: Record<string, number>;
  seenOpps: string[];
  share: Record<string, boolean>;
};

export const EMPTY_DNA_STATE: DnaState = {
  v: 1,
  started: false,
  source: null,
  posts: [],
  objective: "grow",
  snapshots: [],
  decisions: {},
  experiments: [],
  challenge: null,
  dismissed: {},
  seenOpps: [],
  share: { name: true, identity: true, characteristic: true, topic: true, format: true, opportunity: true, experiment: true },
};

/* ---------- constants, verbatim from the prototype ---------- */

export const METRICS: Record<string, { label: string; title: string; fmt: (t: number) => string; need: string }> = {
  reach: { label: "reach", title: "Reach", fmt: (t) => `${t.toFixed(1)}× usual views`, need: "Stops the scroll: it reaches people beyond your usual audience." },
  shareRate: { label: "share rate", title: "Share rate", fmt: (t) => `${(t * 100).toFixed(2)}%`, need: "Worth passing on: viewers send it to someone they know." },
  saveRate: { label: "save rate", title: "Save rate", fmt: (t) => `${(t * 100).toFixed(2)}%`, need: "Useful enough to keep: viewers save it to come back to." },
  commentRate: { label: "comment rate", title: "Comment rate", fmt: (t) => `${(t * 100).toFixed(2)}%`, need: "Sparks conversation: viewers want to weigh in." },
  engagement: { label: "engagement", title: "Engagement", fmt: (t) => `${(t * 100).toFixed(1)}%`, need: "Strong overall reaction from the people who see it." },
  retention: { label: "retention", title: "Retention", fmt: (t) => `${(t * 100).toFixed(0)}%`, need: "Holds attention: viewers stay to the end." },
  conversion: { label: "conversion", title: "Conversion", fmt: (t) => `${(t * 100).toFixed(2)}%`, need: "Buying intent: viewers act on what you recommend." },
};

export const fmtMetric = (key: string, v: number | null | undefined): string =>
  v == null ? "n/a" : METRICS[key].fmt(v);

export const OBJECTIVES: Record<string, { label: string; short: string; w: Record<string, number> }> = {
  grow: { label: "Grow my audience", short: "growth", w: { reach: 0.35, shareRate: 0.25, retention: 0.2, engagement: 0.1, saveRate: 0.1 } },
  sales: { label: "Sell more products", short: "sales", w: { conversion: 0.45, reach: 0.15, retention: 0.15, saveRate: 0.15, engagement: 0.1 } },
  community: { label: "Build a loyal community", short: "community", w: { commentRate: 0.35, engagement: 0.25, saveRate: 0.15, retention: 0.15, reach: 0.1 } },
  deals: { label: "Land more brand deals", short: "brand appeal", w: { engagement: 0.3, retention: 0.25, reach: 0.2, saveRate: 0.15, shareRate: 0.1 } },
};

export const HOOK_STYLES: Record<string, { label: string; test: RegExp }> = {
  pov: { label: "POV", test: /^pov\b/i },
  number: { label: "Number / list", test: /^(\d+|one|two|three|four|five|six|seven|top \d+)\b/i },
  howto: { label: "How-to", test: /^(how (to|i)\b|here'?s how|the easiest way|watch me)/i },
  bold: { label: "Bold claim", test: /^(stop|don't|do not|never|quit|nobody|everyone|you'?re doing|this is why|the (only|real|biggest))\b/i },
  story: { label: "Story", test: /^(i |i'm|i've|i'd|my |when i|so i|last (week|night)|yesterday)/i },
  question: { label: "Question", test: /\?/ },
  other: { label: "Statement", test: /$^/ },
};

export const classifyHook = (t: string): string => {
  const e = (t || "").replace(/[’‘]/g, "'").trim();
  return ["pov", "number", "howto", "bold", "story", "question"].find((a) => HOOK_STYLES[a].test.test(e)) || "other";
};

export const LENGTH_LABELS: Record<string, string> = {
  under15: "Under 15s",
  "15to30": "15–30s",
  "30to60": "30–60s",
  over60: "60s+",
};

export const lengthBucketOf = (t: number | null | undefined): string | null =>
  t ? (t < 15 ? "under15" : t <= 30 ? "15to30" : t <= 60 ? "30to60" : "over60") : null;

const UNTAGGED = new Set(["", "other", "unknown", "untagged"]);
export const isTagged = (t: unknown): boolean => !!t && !UNTAGGED.has(String(t).toLowerCase());

export const DIMS: Record<string, { label: string; of: (t: EnrichedPost) => string | null; name: (v: string) => string }> = {
  topic: { label: "Topic", of: (t) => t.topic, name: (t) => `${t} videos` },
  format: { label: "Format", of: (t) => t.format, name: (t) => `${t} videos` },
  hookStyle: { label: "Hook", of: (t) => t.hookStyle, name: (t) => `${HOOK_STYLES[t] ? HOOK_STYLES[t].label : t} hooks` },
  lengthBucket: { label: "Length", of: (t) => t.lengthBucket, name: (t) => `${LENGTH_LABELS[t]} videos` },
};

export const otherPostsLabel = (dim: string): string =>
  dim === "hookStyle" ? "your other openings" : dim === "lengthBucket" ? "your other lengths" : "your other posts";

export const IDENTITY_BY_LEAD: Record<string, [string, string]> = {
  saveRate: ["The Teacher", "People save your videos to come back to them."],
  shareRate: ["The Connector", "People pass your videos on to someone they know."],
  commentRate: ["The Conversation Starter", "Your videos get people talking."],
  retention: ["The Storyteller", "You hold attention all the way to the end."],
  conversion: ["The Closer", "Your viewers act on what you recommend."],
  reach: ["The Scroll-Stopper", "Your best videos travel far past your usual reach."],
  engagement: ["The Crowd Favorite", "People react to your videos more than most."],
};

export const CONFIDENCE: Record<string, { label: string; color: string; explain: (t: { n: number; q: number }) => string }> = {
  strong: {
    label: "Strong evidence",
    color: "#4ade80",
    explain: (t) => `${t.n} posts, and a gap this size would show up by chance less than 5 times in 100, even after allowing for how many patterns we tested.`,
  },
  some: {
    label: "Some evidence",
    color: "#fbbf24",
    explain: (t) => `${t.n} posts. The gap is in your data, but it could partly be chance (about ${Math.max(1, Math.round(t.q * 100))} in 100, after allowing for how many patterns we tested).`,
  },
  hypothesis: {
    label: "Hypothesis",
    color: "#c4b5fd",
    explain: (t) => `Only ${t.n} posts, or a gap that could easily be chance. Worth testing, not trusting yet.`,
  },
};

/** Surfacing weight per confidence tier — a pattern's headline
 * score is Math.abs(lift) * CONF_WEIGHT[conf]. */
export const CONF_WEIGHT: Record<string, number> = { strong: 1, some: 0.65, hypothesis: 0.35 };

export const VERDICTS: Record<string, { label: string; color: string }> = {
  collecting: { label: "Collecting results", color: "#60a5fa" },
  promising: { label: "Promising", color: "#4ade80" },
  mixed: { label: "Inconclusive", color: "#fbbf24" },
  no: { label: "Didn't beat your usual", color: "#f87171" },
};

export const SOURCES: Record<string, string> = {
  sample: "Sample data",
  import: "Your imported analytics",
  app: "Your Ultra Vestra posts",
  manual: "Results you logged",
};

export const OPP_KIND_LABELS: Record<string, string> = { hook: "Hook", length: "Video length", combo: "Format", revive: "Topic" };
export const EXPERIMENT_IDEAS = ["Hook", "Opening length", "Presentation style", "Format", "Topic", "Video length", "Call to action", "Publishing approach"];
export const LEAD_PHRASES: Record<string, string> = {
  shareRate: "that people share",
  saveRate: "that people save",
  commentRate: "that start conversations",
  retention: "that hold attention",
  conversion: "that make people buy",
  reach: "that travel far",
  engagement: "that people react to",
};

export const HELIX_COLORS: Record<string, string> = { topic: "#a78bfa", format: "#e879f9", hookStyle: "#60a5fa", lengthBucket: "#22d3ee" };

/* ---------- small helpers (the prototype's own) ---------- */

export const plural = (t: number, e: string, a: string = e + "s"): string => `${t} ${t === 1 ? e : a}`;
export const clamp = (t: number, e: number, a: number): number => Math.max(e, Math.min(a, t));
export const median = (t: number[]): number => {
  if (!t.length) return 0;
  const e = [...t].sort((n, l) => n - l);
  const a = e.length >> 1;
  return e.length % 2 ? e[a] : (e[a - 1] + e[a]) / 2;
};
export const fmtCount = (t: number): string =>
  t >= 1e6 ? (t / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : t >= 1e3 ? (t / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(Math.round(t));
export const fmtDateShort = (t: string | number): string =>
  new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const fmtDateTime = (t: string | number): string =>
  new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** FNV-1a hash (the prototype's Ns) — seeds ids and the sample RNG. */
export function hashString(t: string): number {
  let e = 2166136261;
  for (let a = 0; a < t.length; a++) {
    e ^= t.charCodeAt(a);
    e = Math.imul(e, 16777619);
  }
  return e >>> 0;
}

/** Seeded RNG (the prototype's Mi — mulberry-style). */
export function seededRng(seed: number): () => number {
  let e = seed >>> 0;
  return () => {
    e = (e + 1831565813) >>> 0;
    let a = e;
    a = Math.imul(a ^ (a >>> 15), a | 1);
    a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- statistics ---------- */

function erfApprox(t: number): number {
  const e = 1 / (1 + 0.3275911 * Math.abs(t));
  const a = 1 - ((((1.061405429 * e - 1.453152027) * e + 1.421413741) * e - 0.284496736) * e + 0.254829592) * e * Math.exp(-t * t);
  return t >= 0 ? a : -a;
}
const normalCdf = (t: number): number => 0.5 * (1 + erfApprox(t / Math.SQRT2));

/** Mann–Whitney U two-sided p-value (the prototype's F1). */
export function mannWhitneyP(t: number[], e: number[]): number {
  const a: [number, number][] = [...t.map((h): [number, number] => [h, 0]), ...e.map((h): [number, number] => [h, 1])].sort((h, r) => h[0] - r[0]);
  const n = new Array(a.length);
  let l = 0;
  for (let h = 0; h < a.length; ) {
    let r = h;
    for (; r + 1 < a.length && a[r + 1][0] === a[h][0]; ) r++;
    const S = (h + r) / 2 + 1;
    for (let w = h; w <= r; w++) n[w] = S;
    const v = r - h + 1;
    l += v * v * v - v;
    h = r + 1;
  }
  let i = 0;
  a.forEach((h, r) => {
    if (h[1] === 0) i += n[r];
  });
  const o = t.length;
  const s = e.length;
  const u = o + s;
  if (!o || !s) return 1;
  const f = i - (o * (o + 1)) / 2;
  const m = Math.sqrt(((o * s) / 12) * (u + 1 - l / (u * (u - 1))));
  if (!m) return 1;
  const y = (Math.abs(f - (o * s) / 2) - 0.5) / m;
  return clamp(2 * (1 - normalCdf(Math.max(0, y))), 0, 1);
}

/** Percentile of e within t (the prototype's I1) — a post's score. */
export function percentileOf(t: number[], e: number): number {
  if (t.length < 2) return 50;
  let a = 0;
  let n = 0;
  t.forEach((l) => {
    if (l < e) a++;
    else if (l === e) n++;
  });
  return ((a + (n - 1) / 2) / (t.length - 1)) * 100;
}

/* ---------- enrichment + scoring ---------- */

/** Per-post metrics, normalized within platform (the prototype's eb). */
export function enrichPosts(posts: DnaPost[], now: number): EnrichedPost[] {
  const byPlatform: Record<string, number[]> = {};
  posts.forEach((l) => {
    (byPlatform[l.platform] = byPlatform[l.platform] || []).push(l.views || 0);
  });
  const med: Record<string, number> = {};
  Object.keys(byPlatform).forEach((l) => {
    med[l] = median(byPlatform[l]) || 1;
  });
  return posts.map((l) => {
    const i = Math.max(1, l.views || 0);
    const m: Record<string, number | null> = {
      reach: (l.views || 0) / med[l.platform],
      shareRate: (l.shares || 0) / i,
      saveRate: l.saves == null ? null : l.saves / i,
      commentRate: (l.comments || 0) / i,
      engagement: ((l.likes || 0) + (l.comments || 0) + (l.shares || 0) + (l.saves || 0)) / i,
      retention: l.watch != null && l.length ? clamp(l.watch / l.length, 0, 1) : null,
      conversion: l.sales != null ? l.sales / i : l.clicks != null ? l.clicks / i : null,
    };
    const age = (now - new Date(l.date).getTime()) / 864e5;
    return {
      ...l,
      hookStyle: l.hookStyle ?? classifyHook(l.hook || l.title),
      lengthBucket: lengthBucketOf(l.length),
      m,
      age,
      fresh: age < 3,
      score: 50,
    } as EnrichedPost;
  });
}

/** Goal-weighted percentile score per post (the prototype's ab). */
export function scorePosts(posts: EnrichedPost[], objective: string): void {
  const w = OBJECTIVES[objective].w;
  const pools: Record<string, number[]> = {};
  Object.keys(METRICS).forEach((l) => {
    pools[l] = posts.filter((i) => i.m[l] != null).map((i) => i.m[l] as number);
  });
  posts.forEach((l) => {
    let i = 0;
    let o = 0;
    Object.keys(w).forEach((s) => {
      if (l.m[s] != null && pools[s].length >= 3) {
        i += w[s] * percentileOf(pools[s], l.m[s] as number);
        o += w[s];
      }
    });
    l.score = o ? i / o : 50;
  });
}

const mostCommon = (t: string[]): string | undefined => {
  const e: Record<string, number> = {};
  t.forEach((a) => {
    e[a] = (e[a] || 0) + 1;
  });
  return Object.keys(e).sort((a, n) => e[n] - e[a])[0];
};

/* ---------- patterns ---------- */

/** Group posts by topic / format / hook / length and test each
 * group's score lift against the rest (the prototype's nb). */
export function findPatterns(posts: EnrichedPost[]): DnaPattern[] {
  const out: DnaPattern[] = [];
  Object.keys(DIMS).forEach((dim) => {
    const spec = DIMS[dim];
    const groups: Record<string, EnrichedPost[]> = {};
    posts.forEach((s) => {
      const v = spec.of(s);
      if (isTagged(v)) (groups[v as string] = groups[v as string] || []).push(s);
    });
    Object.keys(groups).forEach((value) => {
      const group = groups[value];
      const rest = posts.filter((b) => spec.of(b) !== value);
      if (group.length < 2 || rest.length < 3) return;
      const groupScores = group.map((b) => b.score);
      const restScores = rest.map((b) => b.score);
      const restMed = median(restScores);
      const lift = median(groupScores) - restMed;
      const p = mannWhitneyP(groupScores, restScores);
      let lead: DnaLead | null = null;
      Object.keys(METRICS).forEach((mk) => {
        const g = group.filter((M) => M.m[mk] != null).map((M) => M.m[mk] as number);
        const x = rest.filter((M) => M.m[mk] != null).map((M) => M.m[mk] as number);
        if (g.length < 2 || x.length < 3) return;
        const d = median(g);
        const N = median(x);
        if (!d || !N) return;
        const ratio = d / N;
        const signed = lift >= 0 ? ratio : 1 / ratio;
        if (!lead || signed > lead.signed) lead = { key: mk, ratio, signed, group: d, rest: N, n: g.length };
      });
      const beat = lift >= 0 ? groupScores.filter((b) => b > restMed).length : groupScores.filter((b) => b < restMed).length;
      out.push({
        id: `${dim}:${value}`,
        dim,
        value,
        name: spec.name(value),
        n: group.length,
        restN: rest.length,
        share: group.length / posts.length,
        lift,
        p,
        q: 1,
        conf: "hypothesis",
        lead,
        beat,
        posts: group,
        caveats: [],
      });
    });
  });
  // Benjamini–Hochberg q-values, then confidence tiers.
  const byP = [...out].sort((a, b) => a.p - b.p);
  let running = 1;
  for (let l = byP.length - 1; l >= 0; l--) {
    running = Math.min(running, (byP[l].p * byP.length) / (l + 1));
    byP[l].q = running;
  }
  out.forEach((l) => {
    l.conf = l.n >= 5 && l.restN >= 5 && l.q < 0.05 ? "strong" : l.n >= 3 && l.q < 0.2 ? "some" : "hypothesis";
  });
  // Honest caveats: platform concentration, age skew, overlap.
  out.forEach((l) => {
    const group = l.posts;
    const rest = posts.filter((r) => !group.includes(r));
    const topPlatform = mostCommon(group.map((r) => r.platform));
    if (topPlatform) {
      const inGroup = group.filter((r) => r.platform === topPlatform).length / group.length;
      const inAll = posts.filter((r) => r.platform === topPlatform).length / posts.length;
      if (inGroup >= 0.8 && inAll <= 0.65)
        l.caveats.push(`Most of these were posted on ${topPlatform}, so the platform may explain part of the gap.`);
    }
    const ageGroup = median(group.map((r) => r.age));
    const ageRest = median(rest.map((r) => r.age));
    if (Math.abs(ageGroup - ageRest) > 30)
      l.caveats.push(`These posts are mostly ${ageGroup > ageRest ? "older" : "newer"} than the rest, and your audience has changed since then.`);
    let overlap: { r: number; both: number; o: DnaPattern } | null = null;
    out.forEach((r) => {
      if (r.dim === l.dim) return;
      const both = group.filter((w) => r.posts.includes(w)).length;
      const v = both / group.length;
      if (v >= 0.6 && (!overlap || v > overlap.r)) overlap = { r: v, both, o: r };
    });
    if (overlap) {
      const o = (overlap as { both: number; o: DnaPattern }).o;
      l.overlap = o.id;
      l.caveats.push(
        `${(overlap as { both: number }).both} of these ${group.length} are also ${o.name.replace(/ videos$/, "")}${o.dim === "hookStyle" ? "" : " videos"}, so we can't yet tell which one is doing the work. Test one change at a time.`
      );
    }
  });
  return out;
}

/** Plain-language lead metric text (the prototype's Di). */
export function leadText(lead: DnaLead, restLabel: string): string {
  const a = METRICS[lead.key].label;
  if (lead.ratio >= 1.95) return `${lead.ratio.toFixed(1)}× the ${a} of ${restLabel}`;
  if (lead.ratio >= 1) return `${Math.round((lead.ratio - 1) * 100)}% higher ${a} than ${restLabel}`;
  if (lead.ratio <= 0.55) return `less than half the ${a} of ${restLabel}`;
  return `${Math.round((1 - lead.ratio) * 100)}% lower ${a} than ${restLabel}`;
}

/** Signature facts: dominant topic/format/hook, cadence (lb). */
export function signatureOf(posts: EnrichedPost[]) {
  const dominant = (dim: string) => {
    const counts: Record<string, number> = {};
    posts.forEach((u) => {
      const v = DIMS[dim].of(u);
      if (isTagged(v)) counts[v as string] = (counts[v as string] || 0) + 1;
    });
    const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    return top ? { value: top, name: DIMS[dim].name(top), n: counts[top], share: counts[top] / posts.length } : null;
  };
  const times = posts.map((i) => new Date(i.date).getTime());
  const weeks = Math.max(1, (Math.max(...times) - Math.min(...times)) / 864e5 / 7);
  const lengths = posts.filter((i) => i.length).map((i) => i.length as number);
  return {
    topic: dominant("topic"),
    format: dominant("format"),
    hook: dominant("hookStyle"),
    length: lengths.length ? median(lengths) : null,
    perWeek: posts.length / weeks,
    from: Math.min(...times),
    to: Math.max(...times),
  };
}

/** Repetition check: one hook style dominating recent posts (ib). */
export function repetitionOf(posts: EnrichedPost[]) {
  const recent = [...posts].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 8);
  if (recent.length < 6) return null;
  const style = mostCommon(recent.map((u) => u.hookStyle));
  if (!style) return null;
  const n = recent.filter((u) => u.hookStyle === style).length;
  if (n / recent.length < 0.6) return null;
  const all = posts.filter((u) => u.hookStyle === style).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const half = Math.floor(all.length / 2);
  const early = median(all.slice(0, half).map((u) => u.score));
  const late = median(all.slice(half).map((u) => u.score));
  return { style, n, of: recent.length, fading: all.length >= 4 && late < early - 8, early, late };
}

/* ---------- opportunities ---------- */

const FORMAT_EFFORT: Record<string, number> = { "Talking head": 1, "POV skit": 1, GRWM: 2, Tutorial: 2, "Voiceover + b-roll": 2, Vlog: 3, "Before & after": 3 };
export const EFFORT_LABELS = ["", "Low", "Medium", "High"];

/** Ranked next moves from the patterns (the prototype's sb).
 * rank = (0.45·liftTerm + 0.35·confidence + 0.20·effortTerm),
 * discounted for rejected kinds, past experiment outcomes and
 * anything already in the Lab. */
export function buildOpportunities(
  a: { patterns: DnaPattern[]; usable: EnrichedPost[]; sig: ReturnType<typeof signatureOf> | null; learned: Record<string, string> },
  state: DnaState,
  _now: number
): DnaOpportunity[] {
  const obj = OBJECTIVES[state.objective];
  const usable = a.usable;
  const sig = a.sig;
  const out: DnaOpportunity[] = [];
  const candidates = a.patterns.filter((d) => d.lift > 3 && !(state.dismissed || {})[d.id]);
  const bestOf = (posts: EnrichedPost[]) => [...posts].sort((x, y) => y.score - x.score)[0];
  const topHookPattern = candidates.filter((d) => d.dim === "hookStyle").sort((x, y) => y.lift - x.lift)[0];
  const minAge = (d: DnaPattern) => Math.min(...d.posts.map((p) => p.age));
  const leadKeyOf = (d: DnaPattern) => (d.lead ? d.lead.key : Object.keys(obj.w)[0]);
  const baselineOf = (mk: string) => median(usable.filter((p) => p.m[mk] != null).map((p) => p.m[mk] as number));
  const hookLineFor = (posts: EnrichedPost[]): string => {
    if (topHookPattern) {
      const best = bestOf(topHookPattern.posts);
      return `Open with a ${HOOK_STYLES[topHookPattern.value].label.toLowerCase()} hook, like your "${best.hook || best.title}"`;
    }
    const best = bestOf(posts);
    return `Model the opening on your best one: "${best.hook || best.title}"`;
  };
  const push = (
    kind: string,
    pattern: DnaPattern,
    title: string,
    why: string,
    whyNow: string,
    todo: string,
    format: string,
    effort: number
  ) => {
    const mk = leadKeyOf(pattern);
    const baseline = baselineOf(mk);
    const evidence = [...pattern.posts].sort((x, y) => y.score - x.score).slice(0, 3);
    out.push({
      id: `${kind}:${pattern.id}`,
      kind,
      pattern: pattern.id,
      dim: pattern.dim,
      value: pattern.value,
      title,
      why,
      whyNow,
      todo,
      format,
      effort,
      effortLabel: EFFORT_LABELS[effort],
      hook: kind === "hook" ? `Try it like your best one: "${bestOf(pattern.posts).hook || bestOf(pattern.posts).title}"` : hookLineFor(pattern.posts),
      need: METRICS[mk].need,
      metric: mk,
      baseline,
      target: baseline == null ? null : baseline * 1.2,
      minPosts: 3,
      conf: pattern.conf,
      lift: pattern.lift,
      evidence,
      rank: 0,
    });
  };
  const leadPhrase = (d: DnaPattern, restLabel: string) =>
    d.lead ? leadText(d.lead, restLabel) : `a score ${Math.round(d.lift)} points higher than ${restLabel}`;

  candidates.forEach((d) => {
    const shortName = d.name.replace(/ videos$/, "");
    if ((d.dim === "topic" || d.dim === "format") && d.share <= 0.4) {
      push(
        "more",
        d,
        `Make more ${d.name}`,
        `Your ${plural(d.n, shortName + " post")} get ${leadPhrase(d, "the rest")}, but they're only ${Math.round(d.share * 100)}% of what you make.`,
        `Your last one was ${Math.round(minAge(d))} days ago.`,
        d.dim === "topic" ? `Post ${shortName} once a week for the next 3 weeks.` : `Turn your next 3 ideas into ${shortName} videos.`,
        d.dim === "format" ? d.value : sig?.format?.value || "Talking head",
        d.dim === "format" ? FORMAT_EFFORT[d.value] || 2 : 1
      );
    }
    if (d.dim === "hookStyle") {
      const label = d.value === "pov" ? "POV" : HOOK_STYLES[d.value].label.toLowerCase();
      const recentCount = usable.filter((p) => p.age <= 30 && p.hookStyle === d.value).length;
      push(
        "hook",
        d,
        `Open more videos with ${label} hooks`,
        `Your ${plural(d.n, label + " hook")} get ${leadPhrase(d, "your other openings")}.`,
        recentCount === 0
          ? "You haven't used one in the last 30 days."
          : recentCount === 1
            ? "You've used one only once in the last 30 days."
            : `You've used one ${recentCount} times in the last 30 days.`,
        `Write the first line of your next 3 videos as a ${label} hook. Change nothing else.`,
        sig?.format?.value || "Talking head",
        1
      );
    }
    if (d.dim === "lengthBucket" && sig?.length && lengthBucketOf(sig.length) !== d.value) {
      push(
        "length",
        d,
        `Make your videos ${LENGTH_LABELS[d.value]}`,
        `Your ${LENGTH_LABELS[d.value]} videos get ${leadPhrase(d, "your other lengths")}.`,
        `Your typical video runs ${Math.round(sig.length)}s, so most of what you make is outside this range.`,
        `Cut your next 3 videos to ${LENGTH_LABELS[d.value]}. Keep the topic and format the same.`,
        sig?.format?.value || "Talking head",
        1
      );
    }
    if (d.dim === "topic" && d.share > 0.4 && minAge(d) > 21) {
      push(
        "revive",
        d,
        `Bring back ${d.name}`,
        `They're one of your strongest topics: ${leadPhrase(d, "the rest")}.`,
        `You haven't posted one in ${Math.round(minAge(d))} days.`,
        "Post one this week.",
        sig?.format?.value || "Talking head",
        1
      );
    }
  });

  // Combo: strongest topic × strongest format, never (or once) tried.
  const topTopic = candidates.filter((d) => d.dim === "topic").sort((x, y) => y.lift - x.lift)[0];
  const topFormat = candidates.filter((d) => d.dim === "format").sort((x, y) => y.lift - x.lift)[0];
  if (topTopic && topFormat) {
    const combined = usable.filter((p) => p.topic === topTopic.value && p.format === topFormat.value).length;
    if (combined < 2) {
      const merged: DnaPattern = {
        ...topTopic,
        posts: [...topTopic.posts, ...topFormat.posts.filter((z) => !topTopic.posts.includes(z))],
        conf: topTopic.conf === "strong" && topFormat.conf === "strong" ? "some" : "hypothesis",
        lift: (topTopic.lift + topFormat.lift) / 2,
        id: `combo:${topTopic.value}+${topFormat.value}`,
      };
      push(
        "combo",
        merged,
        `Try ${topTopic.value} as a ${topFormat.value} video`,
        `${topTopic.value} is your strongest topic and ${topFormat.value} is your strongest format, but you've ${combined ? "combined them only once" : "never combined them"}.`,
        "Nobody can tell you how it performs until you try it.",
        `Make one ${topTopic.value} video in the ${topFormat.value} format.`,
        topFormat.value,
        FORMAT_EFFORT[topFormat.value] || 2
      );
    }
  }

  out.forEach((d) => {
    const weight = 1 + (obj.w[d.metric] || 0);
    const liftTerm = clamp(d.lift / 25, 0, 1) * weight;
    const confTerm = CONF_WEIGHT[d.conf] ?? 0.35;
    const effortTerm = (4 - d.effort) / 3;
    let rank = 0.45 * liftTerm + 0.35 * confTerm + 0.2 * effortTerm;
    const rejectedKinds = Object.keys(state.decisions || {}).filter(
      (k) => state.decisions[k] === "rejected" && k.split(":")[0] === d.kind
    ).length;
    rank *= Math.pow(0.8, rejectedKinds);
    const learned = a.learned[`${d.dim}:${d.value}`];
    if (learned === "promising") {
      rank *= 1.2;
      d.lesson = "Your own experiment backed this up.";
    } else if (learned === "no") {
      rank *= 0.5;
      d.lesson = "You tested this before and it didn't beat your usual.";
    }
    const related = (state.experiments || []).filter((x) => x.oppId === d.id);
    if (related.some((x) => x.status === "running")) {
      d.inLab = "running";
      rank *= 0.35;
    } else if (related.length) {
      d.inLab = "done";
      rank *= 0.5;
    }
    d.rank = rank;
    d.status = (state.decisions || {})[d.id] || null;
  });
  return out.filter((d) => d.status !== "rejected").sort((x, y) => y.rank - x.rank);
}

/* ---------- experiments ---------- */

export type ExperimentResult = {
  n: number;
  waiting: number;
  posts: EnrichedPost[];
  values: { id: string; title: string; v: number }[];
  med?: number;
  ratio?: number;
  verdict: string;
  text: string;
};

/** Judge an experiment against its baseline (the prototype's ub):
 * promising at median ≥ 1.2× baseline with ≥ 2/3 of posts above it,
 * "no" at ≤ 0.9×, otherwise inconclusive. */
export function experimentResult(exp: DnaExperiment, all: EnrichedPost[]): ExperimentResult {
  const posts = all.filter((r) => exp.postIds.includes(r.id));
  const measured = posts.filter((r) => !r.fresh && r.m[exp.metric] != null);
  const waiting = posts.length - measured.length;
  const values = measured.map((r) => ({ id: r.id, title: r.title, v: r.m[exp.metric] as number }));
  const base: ExperimentResult = { n: measured.length, waiting, posts, values, verdict: "collecting", text: "" };
  const label = METRICS[exp.metric].label;
  if (measured.length < exp.minPosts) {
    return {
      ...base,
      text: `${measured.length} of ${exp.minPosts} test posts measured${waiting ? ` (${waiting} still collecting views)` : ""}. Not enough to judge yet.`,
    };
  }
  const vals = measured.map((r) => r.m[exp.metric] as number);
  const med = median(vals);
  const baseline = exp.baseline;
  const ratio = baseline ? med / baseline : 1;
  const above = vals.filter((v) => baseline != null && v > baseline).length;
  const out: ExperimentResult = { ...base, med, ratio };
  if (ratio >= 1.2 && above >= Math.ceil((measured.length * 2) / 3)) {
    return {
      ...out,
      verdict: "promising",
      text: `Your test posts got a median ${label} of ${fmtMetric(exp.metric, med)} vs your usual ${fmtMetric(exp.metric, baseline)}. ${above} of ${measured.length} beat your usual. Promising, but ${measured.length} posts isn't proof. Keep it in rotation and keep measuring.`,
    };
  }
  if (ratio <= 0.9) {
    return {
      ...out,
      verdict: "no",
      text: `Your test posts got a median ${label} of ${fmtMetric(exp.metric, med)}, below your usual ${fmtMetric(exp.metric, baseline)}. It didn't help this time.`,
    };
  }
  return {
    ...out,
    verdict: "mixed",
    text: `Your test posts landed close to your usual ${label} (${fmtMetric(exp.metric, med)} vs ${fmtMetric(exp.metric, baseline)}). Inconclusive. Try a bigger change or 2 more posts.`,
  };
}

/** Start an experiment from an opportunity (the prototype's lt). */
export function experimentFromOpportunity(o: DnaOpportunity): DnaExperiment {
  return {
    id: `exp-${Date.now()}`,
    oppId: o.id,
    pattern: o.pattern,
    title: o.title,
    what: OPP_KIND_LABELS[o.kind] || "Format",
    hypothesis: o.why,
    change: o.todo,
    metric: o.metric,
    baseline: o.baseline,
    target: o.target,
    minPosts: o.minPosts,
    startedAt: Date.now(),
    postIds: [],
    status: "running",
  };
}

/* ---------- the analysis (the prototype's zr) ---------- */

export type DnaAnalysis = {
  all: EnrichedPost[];
  usable: EnrichedPost[];
  fresh: EnrichedPost[];
  enough: boolean;
  patterns: DnaPattern[];
  strengths: DnaPattern[];
  weaknesses: DnaPattern[];
  sig: ReturnType<typeof signatureOf> | null;
  coverage: Record<string, number>;
  untagged: number;
  learned: Record<string, string>;
  results: Record<string, ExperimentResult>;
  rep: ReturnType<typeof repetitionOf>;
  opps: DnaOpportunity[];
  platforms: string[];
  bestPost: EnrichedPost | null;
  identity: { name: string; line: string; from: DnaPattern | null };
};

export function analyzeDna(state: DnaState, now: number = Date.now()): DnaAnalysis {
  const all = enrichPosts(state.posts || [], now);
  const usable = all.filter((g) => !g.fresh && (g.views || 0) > 0);
  scorePosts(usable, state.objective || "grow");
  const enough = usable.length >= DNA_UNLOCK_POSTS;
  const patterns = enough ? findPatterns(usable) : [];
  const visible = patterns.filter((g) => !(state.dismissed || {})[g.id]);
  const surfacing = (g: DnaPattern) => Math.abs(g.lift) * (CONF_WEIGHT[g.conf] ?? 0.35);
  const strengths = visible
    .filter((g) => g.lift >= 5 && g.conf !== "hypothesis")
    .sort((a, b) => surfacing(b) - surfacing(a));
  const weaknesses = visible
    .filter((g) => g.lift <= -5 && g.conf !== "hypothesis" && g.share >= 0.15)
    .sort((a, b) => surfacing(b) * b.share - surfacing(a) * a.share);
  const learned: Record<string, string> = {};
  const results: Record<string, ExperimentResult> = {};
  (state.experiments || []).forEach((g) => {
    results[g.id] = experimentResult(g, all);
    if (g.status === "done" && g.pattern) learned[g.pattern] = g.verdict || results[g.id].verdict;
  });
  const coverage: Record<string, number> = {};
  ["saveRate", "retention", "conversion"].forEach((k) => {
    coverage[k] = usable.length ? usable.filter((x) => x.m[k] != null).length / usable.length : 0;
  });
  const partial: Omit<DnaAnalysis, "opps" | "rep" | "identity" | "sig"> & {
    sig: ReturnType<typeof signatureOf> | null;
    learned: Record<string, string>;
  } = {
    all,
    usable,
    fresh: all.filter((g) => g.fresh),
    enough,
    patterns,
    strengths,
    weaknesses,
    sig: usable.length ? signatureOf(usable) : null,
    coverage,
    untagged: usable.filter((g) => !isTagged(g.topic) || !isTagged(g.format)).length,
    learned,
    results,
    platforms: [...new Set(usable.map((g) => g.platform))],
    bestPost: usable.length ? [...usable].sort((a, b) => b.score - a.score)[0] : null,
  };
  const opps = enough ? buildOpportunities({ patterns, usable, sig: partial.sig, learned }, state, now) : [];
  const leadKey = strengths[0] && strengths[0].lead ? strengths[0].lead!.key : null;
  const identityPair = (leadKey && IDENTITY_BY_LEAD[leadKey]) || ["The Explorer", "Still mapping what makes your content work."];
  return {
    ...partial,
    opps,
    rep: enough ? repetitionOf(usable) : null,
    identity: { name: identityPair[0], line: identityPair[1], from: strengths[0] || null },
  };
}

/** The Today-style home state for DNA (the prototype's rb/Ph). */
export function dnaHomeState(state: DnaState | null, now: number = Date.now()) {
  const base = ((): { kind: string; title: string; detail: string; cta: string } => {
    if (!state || !state.started || !(state.posts || []).length) {
      return {
        kind: "invite",
        title: "Discover your Content DNA",
        detail: "Find the evidence-backed pattern behind your best videos.",
        cta: "Find my pattern",
      };
    }
    const a = analyzeDna(state, now);
    const running = (state.experiments || []).find((i) => i.status === "running");
    if (running) {
      return { kind: "experiment", title: `Experiment: ${running.title}`, detail: a.results[running.id].text, cta: "Open the Lab" };
    }
    if (!a.enough) {
      return {
        kind: "more",
        title: "Content DNA needs a few more posts",
        detail: `${plural(a.usable.length, "post")} analyzed. Patterns unlock at 8.`,
        cta: "Add posts",
      };
    }
    const top = a.opps[0];
    if (top) return { kind: "opportunity", title: top.title, detail: top.why, cta: "See why" };
    const s = a.strengths[0];
    return s
      ? {
          kind: "pattern",
          title: `Your strongest pattern: ${s.name}`,
          detail: s.lead ? `They get ${leadText(s.lead, "your other posts")}.` : "",
          cta: "Open Content DNA",
        }
      : {
          kind: "pattern",
          title: "No clear pattern yet",
          detail: "Your posts perform about the same. Run an experiment to find one.",
          cta: "Open Content DNA",
        };
  })();
  return { ...base, sample: !!state && state.source === "sample" && base.kind !== "invite" };
}

/** Helix rung data for the share card visual (the prototype's ws):
 * deterministic from the usable post ids; top patterns become rungs. */
export function helixData(a: DnaAnalysis): { phase: number; twist: number; rungs: { color: string; strength: number }[] } {
  const seedKey = a.usable.map((o) => o.id).join("|") || "empty";
  const rnd = seededRng(hashString(seedKey));
  const top = [...a.patterns].sort((x, y) => Math.abs(y.lift) - Math.abs(x.lift)).slice(0, 14);
  const max = Math.max(10, ...top.map((o) => Math.abs(o.lift)));
  const rungs: { color: string; strength: number }[] = [];
  for (let i = 0; i < 18; i++) {
    const p = top.length ? top[i % top.length] : null;
    rungs.push(
      p
        ? { color: p.lift >= 0 ? HELIX_COLORS[p.dim] : "#4b4570", strength: 0.35 + 0.65 * (Math.abs(p.lift) / max) }
        : { color: "#4b4570", strength: 0.3 + rnd() * 0.3 }
    );
  }
  return { phase: rnd() * Math.PI * 2, twist: 0.5 + rnd() * 0.25, rungs };
}

/* ---------- sample data (the prototype's tg) ----------
 * 31 example posts from a sample creator, generated by the
 * prototype's own seeded generator (seed 20261123): fixed titles,
 * topics, formats, lengths and per-dimension effect multipliers,
 * with seeded noise. Deterministic — the same posts every time.
 * Always labeled sample data in the UI, never the user's own. */

const SAMPLE_ROWS: [number, string, string, string, number, string][] = [
  [88, "TikTok", "Day in my life", "Voiceover + b-roll", 58, "Come spend a Tuesday with me"],
  [85, "TikTok", "Skincare", "Talking head", 34, "Do you double cleanse at night?"],
  [82, "Instagram", "Day in my life", "Voiceover + b-roll", 62, "A slow Sunday reset with my kids"],
  [79, "TikTok", "Product reviews", "Talking head", 41, "I tried the viral lip oil so you don't have to"],
  [76, "TikTok", "Skincare", "Before & after", 24, "Stop skipping sunscreen, here's 30 days of proof"],
  [73, "TikTok", "Mom hacks", "Talking head", 28, "3 things that saved my mornings as a mom of three"],
  [70, "YouTube", "Day in my life", "Voiceover + b-roll", 71, "My real morning routine (not the aesthetic one)"],
  [67, "TikTok", "Day in my life", "Voiceover + b-roll", 55, "Come run errands with me"],
  [64, "TikTok", "Budget finds", "Talking head", 22, "5 Target finds under $10 that actually work"],
  [61, "Instagram", "Skincare", "GRWM", 45, "Get ready with me for school pickup"],
  [58, "TikTok", "Product reviews", "Talking head", 38, "Stop buying $40 serums until you see this"],
  [55, "TikTok", "Day in my life", "Voiceover + b-roll", 64, "A day in my life as a stay-at-home mom"],
  [52, "TikTok", "Skincare", "Before & after", 27, "Stop using hot water on your face"],
  [49, "TikTok", "Mom hacks", "Talking head", 19, "POV: you finally found a lunchbox that doesn't leak"],
  [46, "Instagram", "Day in my life", "Talking head", 35, "Farmers market haul and what I got"],
  [43, "TikTok", "Product reviews", "GRWM", 44, "Do these drugstore dupes hold up?"],
  [40, "TikTok", "Skincare", "Voiceover + b-roll", 31, "How I fixed my dry patches in a week"],
  [37, "TikTok", "Day in my life", "Voiceover + b-roll", 66, "Spend a rainy Thursday with us"],
  [34, "YouTube", "Skincare", "Before & after", 26, "Stop picking, here's what 6 weeks did"],
  [31, "TikTok", "Mom hacks", "Talking head", 24, "Stop packing lunches the night before"],
  [28, "TikTok", "Budget finds", "Talking head", 21, "4 Amazon finds that are worth every penny"],
  [25, "TikTok", "Day in my life", "Talking head", 29, "Weekend reset, but make it 10 minutes"],
  [22, "Instagram", "Product reviews", "Talking head", 39, "Do you really need a vitamin C serum?"],
  [19, "TikTok", "Skincare", "Before & after", 23, "Stop over-exfoliating, my skin 2 weeks later"],
  [16, "TikTok", "Day in my life", "Voiceover + b-roll", 57, "Come to Costco with me"],
  [13, "TikTok", "Skincare", "GRWM", 42, "Get ready with me: 5-minute mom makeup"],
  [12, "Instagram", "Budget finds", "Talking head", 23, "3 Walmart finds I'd buy again"],
  [10, "TikTok", "Mom hacks", "Talking head", 26, "POV: bedtime finally takes 10 minutes"],
  [7, "TikTok", "Product reviews", "Before & after", 29, "I used the viral pimple patches for 7 days"],
  [5, "TikTok", "Day in my life", "Voiceover + b-roll", 63, "Come spend a Monday with me"],
  [2, "TikTok", "Skincare", "Talking head", 33, "Do you need toner? Honest answer"],
];

const SAMPLE_EFFECTS: {
  topic: Record<string, Record<string, number>>;
  format: Record<string, Record<string, number>>;
  hook: Record<string, Record<string, number>>;
} = {
  topic: {
    "Day in my life": { views: 0.55, shares: 0.6, saves: 0.6, comments: 1.1 },
    "Budget finds": { sales: 2.4, saves: 1.6, views: 1.15 },
    "Product reviews": { sales: 1.5 },
    "Mom hacks": { shares: 1.6, comments: 1.4 },
  },
  format: {
    "Before & after": { shares: 2.1, saves: 1.7, views: 1.45, ret: 0.09 },
    GRWM: { comments: 1.5, ret: -0.02 },
    "Voiceover + b-roll": { ret: -0.06 },
  },
  hook: {
    bold: { views: 1.25, ret: 0.07 },
    question: { comments: 1.3 },
    pov: { shares: 1.2 },
    number: { saves: 1.4 },
    story: { comments: 1.2 },
  },
};

export function samplePosts(now: number = Date.now()): DnaPost[] {
  const rnd = seededRng(20261123);
  const noise = () => Math.exp((rnd() + rnd() + rnd() - 1.5) * 0.45);
  const base: Record<string, number> = { TikTok: 16000, Instagram: 5200, YouTube: 3800 };
  return SAMPLE_ROWS.map(([daysAgo, platform, topic, format, length, title], idx) => {
    const hookStyle = classifyHook(title);
    const mult = (k: string) =>
      ((SAMPLE_EFFECTS.topic[topic] || {})[k] || 1) *
      ((SAMPLE_EFFECTS.format[format] || {})[k] || 1) *
      ((SAMPLE_EFFECTS.hook[hookStyle] || {})[k] || 1);
    const retBase =
      (length < 15 ? 0.78 : length <= 30 ? 0.62 : length <= 60 ? 0.48 : 0.34) +
      ((SAMPLE_EFFECTS.format[format] || {}).ret || 0) +
      ((SAMPLE_EFFECTS.hook[hookStyle] || {}).ret || 0);
    const views = Math.round(base[platform] * (1 + ((90 - daysAgo) / 90) * 0.35) * mult("views") * noise());
    const sellable = platform === "TikTok" && ["Budget finds", "Product reviews", "Skincare"].includes(topic);
    return {
      id: `sample-${idx}`,
      source: "sample",
      title,
      hook: title,
      date: new Date(now - daysAgo * 864e5).toISOString(),
      platform,
      topic,
      format,
      length,
      views,
      likes: Math.round(views * 0.06 * noise()),
      comments: Math.round(views * 0.004 * mult("comments") * noise()),
      shares: Math.round(views * 0.005 * mult("shares") * noise()),
      saves: Math.round(views * 0.006 * mult("saves") * noise()),
      watch: platform === "Instagram" ? null : Math.round(clamp(retBase * (0.85 + rnd() * 0.3), 0.1, 0.95) * length * 10) / 10,
      sales: sellable ? Math.round(views * 0.0008 * mult("sales") * noise()) : null,
    };
  });
}

/* ---------- CSV import (the prototype's Dr/pb/fa) ---------- */

const CSV_HEADERS: Record<string, string[]> = {
  title: ["title", "caption", "description", "video title", "post", "name", "video description"],
  hook: ["hook", "opening line", "first line"],
  date: ["date", "posted", "post date", "publish date", "published", "create time", "post time", "time"],
  platform: ["platform", "network", "app", "channel"],
  topic: ["topic", "category", "pillar", "theme"],
  format: ["format", "style", "type", "content type"],
  length: ["length", "length_seconds", "duration", "video duration", "duration (s)", "seconds", "length (s)"],
  views: ["views", "video views", "plays", "total views", "impressions"],
  likes: ["likes", "hearts", "reactions"],
  comments: ["comments"],
  shares: ["shares", "reposts", "sends"],
  saves: ["saves", "favorites", "bookmarks", "saved"],
  watch: ["avg_watch_seconds", "average watch time", "avg watch time", "avg. watch time", "average view duration", "avg watch seconds"],
  clicks: ["clicks", "link clicks", "product clicks"],
  sales: ["sales", "orders", "units sold", "purchases"],
};

const TOPIC_RULES: [RegExp, string][] = [
  [/day in (my|the) life|come (with|run|to)|spend (a|the) .* with|weekend reset|vlog/i, "Day in my life"],
  [/budget|under \$|finds|dupe|deal|worth every penny|cheap/i, "Budget finds"],
  [/review|tried|worth it|honest|vs\.?|tested/i, "Product reviews"],
  [/skin|serum|sunscreen|spf|acne|pimple|moistur|cleanse|makeup|lip|beauty/i, "Beauty & skincare"],
  [/recipe|cook|meal|dinner|lunch|snack|bake/i, "Food"],
  [/workout|gym|fitness|protein|run |pilates|yoga/i, "Fitness"],
  [/outfit|fashion|haul|try.?on|style|dress/i, "Fashion"],
  [/clean|organi[sz]|home|decor|kitchen/i, "Home"],
  [/mom|kid|baby|toddler|parent|school/i, "Parenting"],
  [/money|budgeting|save money|side hustle|finance/i, "Money"],
  [/travel|trip|hotel|flight/i, "Travel"],
];

const FORMAT_RULES: [RegExp, string][] = [
  [/grwm|get ready with me/i, "GRWM"],
  [/before|after|results|weeks later|days later|transformation/i, "Before & after"],
  [/how to|tutorial|step|here'?s how/i, "Tutorial"],
  [/storytime|story time/i, "Storytime"],
  [/pov/i, "POV skit"],
  [/day in|come with me|vlog|spend a/i, "Vlog"],
  [/haul|unbox/i, "Haul"],
];

export const guessTopic = (t: string): string => (TOPIC_RULES.find(([re]) => re.test(t || "")) || [null, "Other"])[1];
export const guessFormat = (t: string): string => (FORMAT_RULES.find(([re]) => re.test(t || "")) || [null, "Other"])[1];

/** CSV cell parser (quotes, commas, tabs, semicolons). */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === "," || ch === "\t" || ch === ";") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

/** Number parser: "12.5k", "1:23", "45s", "$1,200" (the prototype's fa). */
export function parseCsvNumber(t: string | null | undefined): number | null {
  if (t == null) return null;
  const e = String(t).trim().toLowerCase().replace(/[,$\s]/g, "");
  if (!e || e === "-" || e === "n/a") return null;
  const a = e.match(/^(-?\d*\.?\d+)([km]?)$/);
  if (a) return parseFloat(a[1]) * (a[2] === "k" ? 1e3 : a[2] === "m" ? 1e6 : 1);
  const n = e.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (n) return n[3] ? +n[1] * 3600 + +n[2] * 60 + +n[3] : +n[1] * 60 + +n[2];
  const l = e.match(/^(\d*\.?\d+)s$/);
  return l ? parseFloat(l[1]) : null;
}

export function parsePostsCsv(text: string): { posts: DnaPost[]; skipped: number; error: string | null } {
  const rows = parseCsvRows(text.replace(/^﻿/, ""));
  if (rows.length < 2)
    return { posts: [], skipped: 0, error: "That file has no rows. Use the template or a TikTok, Instagram or YouTube analytics export." };
  const header = rows[0].map((c) => c.trim().toLowerCase().replace(/\s+/g, " "));
  const col: Record<string, number> = {};
  Object.keys(CSV_HEADERS).forEach((k) => {
    const idx = header.findIndex((h) => CSV_HEADERS[k].includes(h));
    if (idx >= 0) col[k] = idx;
  });
  if (col.views == null)
    return { posts: [], skipped: rows.length - 1, error: `We couldn't find a views column. Add one called "views" (see the template).` };
  const posts: DnaPost[] = [];
  let skipped = 0;
  rows.slice(1).forEach((row, idx) => {
    const get = (k: string) => (col[k] != null ? (row[col[k]] || "").trim() : "");
    const views = parseCsvNumber(get("views"));
    const date = new Date(get("date"));
    if (!views || isNaN(date.getTime())) {
      skipped++;
      return;
    }
    const title = get("title") || get("hook") || `Post ${idx + 1}`;
    const hook = get("hook") || title.split(/[.!?]\s/)[0];
    posts.push({
      id: `csv-${hashString(title + date.toISOString() + idx)}`,
      source: "import",
      title,
      hook,
      date: date.toISOString(),
      platform: get("platform") || "TikTok",
      topic: get("topic") || guessTopic(title),
      format: get("format") || guessFormat(title),
      length: parseCsvNumber(get("length")),
      views,
      likes: parseCsvNumber(get("likes")) || 0,
      comments: parseCsvNumber(get("comments")) || 0,
      shares: parseCsvNumber(get("shares")) || 0,
      saves: parseCsvNumber(get("saves")),
      watch: parseCsvNumber(get("watch")),
      clicks: parseCsvNumber(get("clicks")),
      sales: parseCsvNumber(get("sales")),
    });
  });
  return { posts, skipped, error: posts.length ? null : "No usable rows. Each row needs a date and views." };
}

export const CSV_TEMPLATE = [
  "title,hook,date,platform,topic,format,length_seconds,views,likes,comments,shares,saves,avg_watch_seconds,clicks,sales",
  `"30 days of sunscreen","Stop skipping sunscreen, here's 30 days of proof",2026-10-01,TikTok,Skincare,Before & after,24,32000,2400,120,310,280,17,,24`,
  `"Target finds under $10","5 Target finds under $10 that actually work",2026-10-04,TikTok,Budget finds,Talking head,22,18500,1300,95,140,260,13,410,38`,
].join("\n");
