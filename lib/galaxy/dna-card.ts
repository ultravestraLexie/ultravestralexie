/* ============================================================================
 * CREATOR DNA CARD — the owner's prototype ported (2026-11-24), mounted
 * inside Studio › Content DNA as its own section (DnaCardSection).
 *
 * This module is the prototype's analysis core + card renderer, ported
 * as-is: parseCSV / normalize (a creator's authorized content export),
 * analyze (platform-normalized scoring with evidence tiers — the
 * prototype's OWN analyze, separate from lib/galaxy/dna), the bundled
 * QR implementation (byte mode, ECC M/H, versions 1–10, Reed-Solomon),
 * the animated helix (videos as rungs), and renderCard with its six
 * tiers (Quartz → Diamond) and earned-tier unlocking.
 *
 * Data is the creator's own, kept on this device only (localStorage
 * "uv.dna.card.v1", the prototype's key and shape). No network, no
 * model calls, nothing is posted anywhere.
 * ========================================================================== */

export const DNA_CARD_CONFIG = {
  shareBase: "https://ultra-vestra.vercel.app/dna", // live domain; /dna/{handle} attributes sign-ups
  displayLink: "ULTRA-VESTRA.VERCEL.APP", // printed on the card next to "Discover yours"
  earnedTiers: true, // false = all six cards free to pick
};

export const DNA_CARD_STORE_KEY = "uv.dna.card.v1";

// The first shipped build (2026-11-24) pre-filled this sample handle on
// every card. The owner's rule: the card carries UltraVestra + the QR
// code only, until the creator makes it from their own data — so there
// is no default handle anymore. This value survives ONLY so stored
// state written by that first build can be recognised and cleared on
// load (see dnaCardSanitizeStoredHandle). It is never rendered on a
// card, never shared, and never used to build a link, message, QR
// payload, or filename.
export const DNA_CARD_LEGACY_SAMPLE_HANDLE = "@nova.creates";

// A stored handle from the first build (the legacy sample handle above)
// reads back as unset; anything the creator typed themselves passes
// through untouched.
export function dnaCardSanitizeStoredHandle(handle: string | null | undefined): string {
  return !handle || handle === DNA_CARD_LEGACY_SAMPLE_HANDLE ? "" : handle;
}

export const DNA_CARD_SAMPLE_CSV: string = "date,title,platform,topic,format,hook,length_sec,views,likes,comments,shares,saves\n2026-08-03,This $12 serum outperformed my $80 one,TikTok,Skincare honest reviews,Honest review,Result first,34,48200,3767,312,294,833\n2026-08-07,Morning routine for people who hate mornings,TikTok,Morning routine,GRWM,Question,52,12900,627,51,37,136\n2026-08-12,Day in my life as a full-time creator,TikTok,Day in my life,Vlog,Story,74,8600,266,21,10,56\n2026-08-17,5 Target finds under $10,TikTok,Budget beauty finds,Talking head,List,28,21400,1150,95,86,253\n2026-08-21,I tested the viral pimple patches for 7 days,TikTok,Skincare honest reviews,Honest review,Result first,41,39000,2855,236,218,630\n2026-08-25,Is this drugstore sunscreen worth it?,TikTok,Skincare honest reviews,Honest review,Question,38,17500,1197,99,86,263\n2026-08-30,Organize my bathroom drawer with me,TikTok,Home organization,Before & after,Result first,31,15800,1337,112,117,298\n2026-09-04,GRWM: 10-minute school-run makeup,TikTok,Morning routine,GRWM,Story,46,11200,522,42,29,113\n2026-09-08,Day in my life: brand shoot edition,TikTok,Day in my life,Vlog,Story,68,9400,324,26,13,69\n2026-09-12,Stop buying these 3 skincare products,TikTok,Skincare honest reviews,Talking head,Bold claim,26,30500,1935,161,159,429\n2026-09-17,3 dupes that beat the originals,TikTok,Budget beauty finds,Honest review,List,36,24300,1391,115,107,307\n2026-09-22,Before & after: 2 weeks of retinol,TikTok,Skincare honest reviews,Before & after,Result first,33,44100,4140,347,366,924\n2026-09-26,What I eat before filming,TikTok,Day in my life,Vlog,Question,61,7900,258,20,8,54\n2026-09-30,Dollar store makeup - worth it?,TikTok,Budget beauty finds,Honest review,Question,39,18800,986,81,70,217\n2026-10-05,\"My 5am routine, honestly\",TikTok,Morning routine,GRWM,Story,55,10100,456,37,24,99\n2026-10-10,Pantry reset in 60 seconds,TikTok,Home organization,Vlog,List,58,9700,374,30,19,81\n2026-10-14,The $8 moisturizer I keep repurchasing,TikTok,Skincare honest reviews,Honest review,Bold claim,37,36200,2543,211,195,562\n2026-10-18,GRWM + chatting about brand deals,TikTok,Morning routine,GRWM,Story,64,9900,426,34,22,92\n2026-10-23,Day in my life: editing day,TikTok,Day in my life,Vlog,Story,71,6800,201,16,6,42\n2026-10-28,Is the $40 hair tool a scam?,TikTok,Budget beauty finds,Honest review,Question,35,22600,1324,110,104,293\n2026-11-01,Under-sink before & after (no tools),TikTok,Home organization,Before & after,Result first,29,16900,1501,126,134,335\n2026-11-05,Skincare I'd repurchase vs never again,TikTok,Skincare honest reviews,Honest review,List,42,33400,2230,184,167,492\n2026-11-10,4 budget finds that look expensive,TikTok,Budget beauty finds,Talking head,List,27,19600,971,80,69,213\n2026-11-15,GRWM: 5-minute everyday face,TikTok,Budget beauty finds,GRWM,Result first,44,14500,755,62,48,165\n";
export const DNA_CARD_TEMPLATE_CSV: string = 'date,title,platform,topic,format,hook,length_sec,views,likes,comments,shares,saves\n2026-11-01,This $12 serum outperformed my $80 one,TikTok,Skincare reviews,Honest review,Result first,34,48200,3767,312,294,833\n';

/* ============================== CSV import ============================== */

export interface DnaCardRow {
  title: string;
  date: string;
  platform: string;
  topic: string;
  format: string;
  hook: string;
  length: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    q = false;
  text = String(text).replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === "," || c === ";" || c === "\t") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

const FIELDS: Record<string, string[]> = {
  title: ["title", "video title", "caption", "description", "name"],
  date: ["date", "post time", "posted", "publish date", "published", "create time", "post date"],
  platform: ["platform", "source", "channel"],
  topic: ["topic", "category", "pillar", "content pillar"],
  format: ["format", "content format", "style"],
  hook: ["hook", "hook type", "opening", "opener"],
  length: ["length_sec", "length", "duration", "duration (sec)", "video duration", "duration_sec", "seconds"],
  views: ["views", "video views", "plays", "total play", "view count"],
  likes: ["likes", "like count", "reactions"],
  comments: ["comments", "comment count"],
  shares: ["shares", "share count", "sends"],
  saves: ["saves", "favorites", "bookmarks", "save count", "add to favorites"],
};
const num = (v: unknown): number => {
  const n = parseFloat(String(v ?? "").replace(/[, ]/g, "").replace(/k$/i, "e3").replace(/m$/i, "e6"));
  return isFinite(n) ? n : 0;
};

export function inferHook(title: string): string {
  const t = String(title || "").trim(),
    l = t.toLowerCase();
  if (!t) return "Untagged";
  if (/^(before|after)|before\s*&\s*after|results? after/.test(l)) return "Result first";
  if (/\?$/.test(t) || /^(how|why|what|is|are|do|does|can|should|would)\b/.test(l)) return "Question";
  if (/^\d+\s/.test(t)) return "List";
  if (/\bpov\b/.test(l)) return "POV";
  if (/^(stop|never|don't|nobody|unpopular)/.test(l)) return "Bold claim";
  if (/^(i |my |when i|day in)/.test(l)) return "Story";
  return "Untagged";
}

export function normalize(table: string[][]): { rows: DnaCardRow[]; issues: string[] } {
  if (!table.length) return { rows: [], issues: ["The file is empty."] };
  const head = table[0].map((h) => h.trim().toLowerCase());
  const idx: Record<string, number> = {};
  for (const [k, names] of Object.entries(FIELDS)) idx[k] = head.findIndex((h) => names.includes(h));
  const issues: string[] = [];
  if (idx.views < 0)
    return { rows: [], issues: ['No "views" column found. Use the template or an analytics export with a views column.'] };
  const get = (r: string[], k: string) => (idx[k] >= 0 ? (r[idx[k]] ?? "").trim() : "");
  const rows: DnaCardRow[] = [];
  for (const r of table.slice(1)) {
    const views = num(get(r, "views"));
    if (views < 1) continue;
    const title = get(r, "title");
    rows.push({
      title,
      date: get(r, "date"),
      platform: get(r, "platform") || "All",
      topic: get(r, "topic") || "Untagged",
      format: get(r, "format") || "Untagged",
      hook: get(r, "hook") || inferHook(title),
      length: num(get(r, "length")),
      views,
      likes: num(get(r, "likes")),
      comments: num(get(r, "comments")),
      shares: num(get(r, "shares")),
      saves: num(get(r, "saves")),
    });
  }
  if (idx.topic < 0) issues.push("No topic column, so topic insights are off. Add a \"topic\" column to unlock them.");
  if (idx.format < 0) issues.push("No format column, so format insights are off.");
  if (idx.hook < 0) issues.push("Hooks were estimated from titles. Add a \"hook\" column for accuracy.");
  if (idx.shares < 0) issues.push("No shares column, so the experiment uses engagement rate instead of share rate.");
  return { rows, issues };
}

/* ============================== Scoring ============================== */

export type DnaCardTier = "verified" | "observed" | "testing";

export const median = (a: number[]): number => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y),
    m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const TIER_RANK: Record<DnaCardTier, number> = { verified: 3, observed: 2, testing: 1 };
const bandOf = (s: number): string =>
  !s ? "Unknown" : s < 20 ? "Under 20s" : s <= 40 ? "20–40s" : s <= 60 ? "40–60s" : "Over 60s";

const HOOK_TRAIT: Record<string, string> = {
  "result first": "Shows the result in the first second",
  question: "Opens with a question",
  "bold claim": "Leads with a bold claim",
  story: "Opens with a personal story",
  list: "Opens with a numbered list",
  pov: "Puts viewers inside the moment (POV)",
};
const HOOK_ADJ: Record<string, string> = {
  "result first": "Result-First",
  question: "Curious",
  "bold claim": "Straight-Talking",
  story: "Storytelling",
  list: "Curating",
  pov: "Immersive",
};
const HOOK_SHORT: Record<string, string> = {
  "result first": "result-first",
  question: "question",
  "bold claim": "bold-claim",
  story: "story",
  list: "list",
  pov: "POV",
};
const FORMAT_NOUN: Record<string, string> = {
  "honest review": "Reviewer",
  review: "Reviewer",
  grwm: "Companion",
  "get ready with me": "Companion",
  tutorial: "Teacher",
  "how-to": "Teacher",
  "before & after": "Transformer",
  "talking head": "Explainer",
  vlog: "Narrator",
  unboxing: "Discoverer",
  skit: "Entertainer",
  haul: "Curator",
  demo: "Demonstrator",
};
const lc = (s: string): string => String(s).toLowerCase();

export interface DnaCardGroup {
  kind: string;
  name: string;
  n: number;
  lift: number;
  beat: number;
  share: number;
  medER: number;
  tier: DnaCardTier;
  titles: string[];
  weak?: boolean;
}

export interface DnaCardField {
  label: string;
  value: string;
  tier: DnaCardTier;
  why: string;
  ref?: DnaCardGroup;
  change?: string;
  metric?: string;
}

export type DnaCardFieldKey = "identity" | "trait" | "topic" | "format" | "opportunity" | "experiment";

export interface DnaCardPlatformBase {
  er: number;
  sr: number;
  n: number;
}

export interface DnaCardAnalysis {
  ok: true;
  n: number;
  platforms: string[];
  base: Record<string, DnaCardPlatformBase>;
  mainBase: DnaCardPlatformBase;
  hasShares: boolean;
  from: Date | null;
  to: Date | null;
  analyzedAt: Date;
  groups: { topic: DnaCardGroup[]; format: DnaCardGroup[]; hook: DnaCardGroup[]; band: DnaCardGroup[] };
  picks: { topic: DnaCardGroup | null; format: DnaCardGroup | null; hook: DnaCardGroup | null; band: DnaCardGroup | null };
  opp: DnaCardGroup | null;
  stop: DnaCardGroup | null;
  fields: Record<DnaCardFieldKey, DnaCardField | null>;
  rethink: string | null;
  vids: { topic: string; rel: number; date: string }[];
}

export type DnaCardAnalysisResult = DnaCardAnalysis | { ok: false; n: number; reason: string };

export function analyze(rows: DnaCardRow[], now: Date = new Date()): DnaCardAnalysisResult {
  const N = rows.length;
  if (N < 8)
    return { ok: false, n: N, reason: `Content DNA needs at least 8 videos to find patterns. This file has ${N}.` };
  // per-platform baselines so a TikTok and a Reel are judged against their own norms
  const er = (r: DnaCardRow) => (r.likes + r.comments + r.shares + r.saves) / r.views;
  const sr = (r: DnaCardRow) => (r.shares / r.views) * 1000;
  const byPlat: Record<string, DnaCardRow[]> = {};
  rows.forEach((r) => (byPlat[r.platform] ||= []).push(r));
  const base: Record<string, DnaCardPlatformBase> = {};
  for (const [p, rs] of Object.entries(byPlat))
    base[p] = { er: median(rs.map(er)), sr: median(rs.map(sr)), n: rs.length };
  const vids = rows.map((r) => ({
    ...r,
    er: er(r),
    sr: sr(r),
    rel: base[r.platform].er ? er(r) / base[r.platform].er : 1,
    band: bandOf(r.length),
  }));
  const hasShares = rows.some((r) => r.shares > 0);

  const groupBy = (key: "topic" | "format" | "hook" | "band"): DnaCardGroup[] => {
    const m: Record<string, typeof vids> = {};
    vids.forEach((v) => (m[v[key]] ||= []).push(v));
    return Object.entries(m)
      .map(([name, vs]) => {
        const lift = median(vs.map((v) => v.rel)),
          beat = vs.filter((v) => v.rel > 1).length;
        const tier: DnaCardTier =
          vs.length >= 5 && lift >= 1.2 && beat / vs.length >= 0.7
            ? "verified"
            : vs.length >= 3 && lift >= 1.15
              ? "observed"
              : "testing";
        return {
          kind: key,
          name,
          n: vs.length,
          lift,
          beat,
          share: vs.length / N,
          medER: median(vs.map((v) => v.er)),
          tier,
          titles: vs.map((v) => v.title).filter(Boolean),
        };
      })
      .filter((g) => g.name !== "Untagged" && g.name !== "Unknown");
  };
  const G = { topic: groupBy("topic"), format: groupBy("format"), hook: groupBy("hook"), band: groupBy("band") };
  const best = (gs: DnaCardGroup[]): DnaCardGroup | null => {
    const c = gs.filter((g) => g.n >= 2).sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier] || b.lift - a.lift)[0];
    if (!c) return null;
    return c.lift >= 1.05 ? c : { ...c, tier: "testing" as DnaCardTier, weak: true };
  };
  const P = { topic: best(G.topic), format: best(G.format), hook: best(G.hook), band: best(G.band) };
  const taken = new Set([P.topic, P.format, P.hook].filter(Boolean).map((g) => g!.kind + g!.name));
  const opp =
    [...G.topic, ...G.format, ...G.hook]
      .filter((g) => !taken.has(g.kind + g.name) && g.n >= 2 && g.lift >= 1.2 && g.share <= 0.25)
      .sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier] || b.lift - a.lift)[0] || null;
  const stop =
    [...G.topic, ...G.format, ...G.hook].filter((g) => g.n >= 3 && g.lift <= 0.85).sort((a, b) => a.lift - b.lift)[0] ||
    null;

  const pd = (s: string): number => {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : Date.parse(s);
  };
  const dates = rows.map((r) => pd(r.date)).filter(isFinite).sort((a, b) => a - b);
  const platforms = Object.keys(byPlat);
  const mainBase = base[platforms.sort((a, b) => byPlat[b].length - byPlat[a].length)[0]];
  const pct = (x: number) => (x * 100).toFixed(1) + "%";
  const x = (l: number) => l.toFixed(1) + "×";
  const ev = (g: DnaCardGroup | null): string =>
    g ? `${g.n} of your ${N} videos · median ${x(g.lift)} your typical engagement · ${g.beat} of ${g.n} beat your baseline` : "";

  // ---- card fields (public) + evidence (private, in-app only)
  const F = {} as Record<DnaCardFieldKey, DnaCardField | null>;
  const h = P.hook,
    f = P.format,
    t = P.topic;
  F.identity = {
    label: "Creator identity",
    value:
      h || f
        ? `The ${HOOK_ADJ[lc(h?.name ?? "")] || (h ? h.name : "Signature")} ${FORMAT_NOUN[lc(f?.name ?? "")] || "Creator"}`
        : "The Emerging Creator",
    tier: h && f ? (TIER_RANK[h.tier] <= TIER_RANK[f.tier] ? h.tier : f.tier) : "testing",
    why:
      h || f
        ? `Named from your strongest opening${h ? ` (${h.name})` : ""} and your strongest format${f ? ` (${f.name})` : ""}. It updates when those patterns change.`
        : "Not enough tagged hooks or formats yet.",
  };
  F.trait = h
    ? { label: "Signature trait", value: HOOK_TRAIT[lc(h.name)] || `Opens with “${h.name}”`, tier: h.tier, why: `${h.name} openings: ${ev(h)}.` }
    : null;
  F.topic = t
    ? {
        label: t.tier === "verified" ? "Strongest verified topic" : "Leading topic",
        value: t.name,
        tier: t.tier,
        why: `${t.name}: ${ev(t)}.${t.tier !== "verified" ? " Not verified yet: needs 5+ videos, 1.2×+ lift and 70% consistency." : ""}`,
      }
    : null;
  if (f) {
    const withBand = P.band && P.band.tier !== "testing" ? ` · ${P.band.name}` : "";
    F.format = {
      label: "Most effective format",
      value: f.name + withBand,
      tier: f.tier,
      why: `${f.name}: ${ev(f)}.${withBand ? ` Separately, videos ${P.band!.name} long run ${x(P.band!.lift)} your typical engagement (${P.band!.n} videos).` : ""}`,
    };
  } else F.format = null;
  if (opp) {
    F.opportunity = {
      label: "Biggest growth opportunity",
      value: `More ${opp.name} videos`,
      tier: opp.tier,
      why: `${opp.name} is only ${opp.n} of ${N} posts (${Math.round(opp.share * 100)}%) but runs ${x(opp.lift)} your typical engagement. ${opp.tier === "verified" ? "Verified pattern." : "Too few videos to verify — that is why it is the next experiment."} Correlation, not proof.`,
      ref: opp,
    };
    const hookS = h ? HOOK_SHORT[lc(h.name)] || lc(h.name) : null;
    let change: string, short: string;
    if (opp.kind === "format") {
      change = `Make 4 ${opp.name} videos${t ? ` about ${t.name}` : ""}${hookS ? ` with ${hookS} openings` : ""}.`;
      short = `4 ${opp.name} videos${hookS ? `, ${hookS} openings` : ""}`;
    } else if (opp.kind === "topic") {
      change = `Make 4 ${f ? f.name : ""} videos about ${opp.name}${hookS ? ` with ${hookS} openings` : ""}.`.replace("  ", " ");
      short = `4 videos on ${opp.name}`;
    } else {
      change = `Make 4 ${f ? f.name + " " : ""}videos${t ? ` about ${t.name}` : ""} that open with a ${lc(opp.name)} hook.`;
      short = `4 videos with ${lc(opp.name)} openings`;
    }
    const metric = hasShares
      ? `Shares per 1,000 views vs your baseline of ${mainBase.sr.toFixed(1)}`
      : `Engagement rate vs your baseline of ${pct(mainBase.er)}`;
    F.experiment = {
      label: "Next experiment",
      value: short,
      tier: "testing",
      why: `Hypothesis: ${opp.name} lifts results for you. Change: ${change} Success metric: ${metric}. Compare after all 4 are 7+ days old. 4 videos is a signal, not proof.`,
      change,
      metric,
    };
  } else {
    F.opportunity = null;
    F.experiment = null;
  }

  return {
    ok: true,
    n: N,
    platforms,
    base,
    mainBase,
    hasShares,
    from: dates[0] ? new Date(dates[0]) : null,
    to: dates.length ? new Date(dates[dates.length - 1]) : null,
    analyzedAt: now,
    groups: G,
    picks: P,
    opp,
    stop,
    fields: F,
    rethink: stop ? `${stop.name}: ${ev(stop)}. Consider pausing or reworking it.` : null,
    vids: vids.map((v) => ({ topic: v.topic, rel: v.rel, date: v.date })),
  };
}

/* ================= QR code (byte mode, ECC M or H, versions 1–10) ================= */

export interface DnaCardQr {
  size: number;
  modules: boolean[][];
  version: number;
  mask: number;
}

const ECCT: Record<string, number[]> = {
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28],
};
const BLKT: Record<string, number[]> = { M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5], H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8] };
const FMTB: Record<string, number> = { M: 0, H: 2 };
const rawModules = (v: number): number => {
  let r = (16 * v + 128) * v + 64;
  if (v >= 2) {
    const na = Math.floor(v / 7) + 2;
    r -= (25 * na - 10) * na - 55;
    if (v >= 7) r -= 36;
  }
  return r;
};
const dataCw = (v: number, e: string): number => Math.floor(rawModules(v) / 8) - ECCT[e][v] * BLKT[e][v];
const gmul = (x: number, y: number): number => {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 255;
};
function rsDiv(deg: number): number[] {
  const r = new Array(deg).fill(0);
  r[deg - 1] = 1;
  let root = 1;
  for (let i = 0; i < deg; i++) {
    for (let j = 0; j < deg; j++) {
      r[j] = gmul(r[j], root);
      if (j + 1 < deg) r[j] ^= r[j + 1];
    }
    root = gmul(root, 2);
  }
  return r;
}
function rsRem(data: number[], div: number[]): number[] {
  const r = div.map(() => 0);
  for (const b of data) {
    const f = b ^ (r.shift() as number);
    r.push(0);
    div.forEach((c, i) => (r[i] ^= gmul(c, f)));
  }
  return r;
}

export function qr(text: string, ecl: "M" | "H" = "M"): DnaCardQr {
  const bytes = Array.from(new TextEncoder().encode(text));
  let ver = 1;
  for (; ver <= 10; ver++) {
    const cb = ver < 10 ? 8 : 16;
    if (4 + cb + bytes.length * 8 <= dataCw(ver, ecl) * 8) break;
  }
  if (ver > 10) throw new Error("Link too long for QR");
  const bits: number[] = [];
  const push = (v: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1);
  };
  push(4, 4);
  push(bytes.length, ver < 10 ? 8 : 16);
  bytes.forEach((b) => push(b, 8));
  const cap = dataCw(ver, ecl) * 8;
  push(0, Math.min(4, cap - bits.length));
  while (bits.length % 8) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  for (let p = 0xec; data.length < cap / 8; p ^= 0xec ^ 0x11) data.push(p);
  // ECC + interleave
  const nb = BLKT[ecl][ver],
    el = ECCT[ecl][ver],
    raw = Math.floor(rawModules(ver) / 8),
    nShort = nb - (raw % nb),
    sLen = Math.floor(raw / nb),
    div = rsDiv(el),
    blocks: number[][] = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const d = data.slice(k, k + sLen - el + (i < nShort ? 0 : 1));
    k += d.length;
    const e = rsRem(d, div);
    if (i < nShort) d.push(0);
    blocks.push(d.concat(e));
  }
  const cw: number[] = [];
  for (let i = 0; i < blocks[0].length; i++)
    blocks.forEach((b, j) => {
      if (i !== sLen - el || j >= nShort) cw.push(b[i]);
    });
  // matrix
  const size = ver * 4 + 17,
    M: boolean[][] = [...Array(size)].map(() => Array(size).fill(false)),
    F: boolean[][] = [...Array(size)].map(() => Array(size).fill(false));
  const set = (x: number, y: number, d: boolean) => {
    M[y][x] = d;
    F[y][x] = true;
  };
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx,
          y = cy + dy,
          d = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);
  if (ver > 1) {
    const na = Math.floor(ver / 7) + 2,
      step = Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2,
      pos = [6];
    for (let p = size - 7; pos.length < na; p -= step) pos.splice(1, 0, p);
    for (let i = 0; i < na; i++)
      for (let j = 0; j < na; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) set(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
  }
  const fmt = (mask: number) => {
    const d = (FMTB[ecl] << 3) | mask;
    let r = d;
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412,
      g = (i: number) => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, g(i));
    set(8, 7, g(6));
    set(8, 8, g(7));
    set(7, 8, g(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, g(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, g(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, g(i));
    set(8, size - 8, true);
  };
  fmt(0);
  if (ver >= 7) {
    let r = ver;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const b = (ver << 12) | r;
    for (let i = 0; i < 18; i++) {
      const bit = ((b >>> i) & 1) === 1,
        a = size - 11 + (i % 3),
        c = Math.floor(i / 3);
      set(a, c, bit);
      set(c, a, bit);
    }
  }
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++)
      for (let j = 0; j < 2; j++) {
        const x = right - j,
          up = ((right + 1) & 2) === 0,
          y = up ? size - 1 - vert : vert;
        if (!F[y][x] && i < cw.length * 8) {
          M[y][x] = ((cw[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
  }
  const maskFn: ((x: number, y: number) => boolean)[] = [
    (x, y) => (x + y) % 2 === 0,
    (_x, y) => y % 2 === 0,
    (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
    (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const apply = (m: number) => {
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) if (!F[y][x] && maskFn[m](x, y)) M[y][x] = !M[y][x];
  };
  const penalty = (): number => {
    let p = 0,
      dark = 0;
    const lines: string[] = [];
    for (let y = 0; y < size; y++) {
      lines.push(M[y].map((v) => (v ? 1 : 0)).join(""));
      lines.push(M.map((r) => (r[y] ? 1 : 0)).join(""));
    }
    for (const s of lines) {
      for (const run of s.match(/0{5,}|1{5,}/g) || []) p += run.length - 2;
      p += 40 * ((s.match(/(?=10111010000)/g) || []).length + (s.match(/(?=00001011101)/g) || []).length);
    }
    for (let y = 0; y < size - 1; y++)
      for (let x = 0; x < size - 1; x++) {
        const c = M[y][x];
        if (c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3;
      }
    M.forEach((r) => r.forEach((v) => (dark += v ? 1 : 0)));
    return p + 10 * Math.floor(Math.abs((dark * 20) / (size * size) - 10));
  };
  let bestM = 0,
    bestP = Infinity;
  for (let m = 0; m < 8; m++) {
    apply(m);
    fmt(m);
    const p = penalty();
    if (p < bestP) {
      bestP = p;
      bestM = m;
    }
    apply(m);
  }
  apply(bestM);
  fmt(bestM);
  return { size, modules: M, version: ver, mask: bestM };
}

/* ================= Identity, link, message ================= */

export type DnaCardShowKey = "handle" | "identity" | "trait" | "topic" | "format" | "opportunity" | "experiment";
export type DnaCardShow = Record<DnaCardShowKey, boolean>;

export const DNA_CARD_SHOW_KEYS: DnaCardShowKey[] = [
  "handle",
  "identity",
  "trait",
  "topic",
  "format",
  "opportunity",
  "experiment",
];

export function dnaCardSlug(handle: string): string {
  return (
    handle
      .replace(/^@/, "")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "creator"
  );
}

export function dnaCardCreatorId(handle: string): string {
  let h = 2166136261;
  for (const ch of dnaCardSlug(handle)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return "UV-DNA-" + String((h >>> 0) % 1000000).padStart(6, "0");
}

// hidden handle → the link uses the creator ID, so an anonymous card doesn't reveal who shared it.
// No handle set at all → the creator ID form too: there is no handle to put in the link.
export function dnaCardLink(handle: string, showHandle: boolean): string {
  return `${DNA_CARD_CONFIG.shareBase}/${showHandle && handle.trim() ? dnaCardSlug(handle) : dnaCardCreatorId(handle).toLowerCase()}`;
}

export function dnaCardFileName(tierId: string | null, handle: string): string {
  return `content-dna-${tierId || "card"}-${dnaCardSlug(handle)}.png`;
}

export function dnaCardMessage(a: DnaCardAnalysis, show: DnaCardShow, handle: string): string {
  const id = show.identity && a.fields.identity ? ` ${a.fields.identity.value}.` : "";
  return `I don't just create content. I leave a fingerprint. This is my Content DNA:${id || " my style, my strengths, my creative identity."} What's yours? Discover yours: ${dnaCardLink(handle, show.handle)}`;
}

export function dnaCardFmtDate(d: Date | null, y?: boolean): string {
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(y ? { year: "numeric" as const } : {}) }) : "";
}

/* ---------- seeded randomness so each creator's card is uniquely theirs ---------- */
export function seeded(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/* ---------- the helix: every rung is one of the creator's videos ---------- */
export const DNA_CARD_PALETTE = ["#b794ff", "#7c8cff", "#e58cff", "#62b6ff", "#ff9ad5", "#9ef0ff", "#c9b8ff", "#8f7bff"];

export interface DnaCardHelixOpts {
  turns?: number;
  reveal?: number;
  scale?: number;
}

export function drawHelix(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  a: DnaCardAnalysis,
  phase: number,
  o: DnaCardHelixOpts = {},
) {
  const vids = a.vids,
    n = vids.length,
    cy = y + h / 2,
    amp = h * 0.36,
    turns = o.turns || 2.2,
    reveal = o.reveal ?? 1,
    k = o.scale || 1;
  const topics = [...new Set(vids.map((v) => v.topic))];
  const strong = a.picks.topic && a.picks.topic.tier !== "testing" ? a.picks.topic.name : null;
  const col = (t: string) => (t === strong ? "#f3ecff" : DNA_CARD_PALETTE[topics.indexOf(t) % DNA_CARD_PALETTE.length]);
  const ang = (t: number) => t * Math.PI * 2 * turns + phase;
  const edge = (t: number) => Math.max(0, Math.min(1, t * 7, (1 - t) * 7));
  const segs: { x0: number; y0: number; x1: number; y1: number; d: number; e: number }[] = [],
    STEPS = 180;
  for (let s = 0; s < 2; s++)
    for (let i = 0; i < STEPS; i++) {
      const t0 = i / STEPS,
        t1 = (i + 1) / STEPS;
      if (t0 > reveal) break;
      const off = s * Math.PI,
        d = Math.cos(ang(t0) + off);
      segs.push({ x0: x + w * t0, y0: cy + Math.sin(ang(t0) + off) * amp, x1: x + w * t1, y1: cy + Math.sin(ang(t1) + off) * amp, d, e: edge(t0) });
    }
  const strand = (front: boolean) => {
    for (const g of segs) {
      if ((g.d >= 0) !== front) continue;
      c.strokeStyle = `rgba(${front ? "214,198,255" : "139,92,246"},${(0.22 + (0.7 * (g.d + 1)) / 2) * g.e})`;
      c.lineWidth = (2 + (3 * (g.d + 1)) / 2) * k;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(g.x0, g.y0);
      c.lineTo(g.x1, g.y1);
      c.stroke();
    }
  };
  strand(false);
  vids.forEach((v, i) => {
    const t = 0.05 + 0.9 * (n === 1 ? 0.5 : i / (n - 1));
    if (t > reveal) return;
    const A = ang(t),
      y1 = cy + Math.sin(A) * amp,
      y2 = cy - Math.sin(A) * amp,
      px = x + w * t;
    const r = Math.max(0.4, Math.min(1.8, v.rel)),
      al = Math.min(1, 0.3 + 0.55 * (r - 0.4)) * edge(t),
      cl = col(v.topic);
    c.save();
    c.globalAlpha = al;
    if (r > 1.2) {
      c.shadowColor = cl;
      c.shadowBlur = 16 * k;
    }
    c.strokeStyle = cl;
    c.lineWidth = 3 * k;
    c.beginPath();
    c.moveTo(px, y1);
    c.lineTo(px, y2);
    c.stroke();
    c.fillStyle = cl;
    const rad = (2.5 + 4 * (r - 0.4)) * k;
    c.beginPath();
    c.arc(px, y1, rad, 0, 7);
    c.fill();
    c.beginPath();
    c.arc(px, y2, rad, 0, 7);
    c.fill();
    c.restore();
  });
  strand(true);
  if (reveal < 1) {
    const sx = x + w * reveal;
    const g = c.createLinearGradient(sx - 40 * k, 0, sx, 0);
    g.addColorStop(0, "rgba(183,148,255,0)");
    g.addColorStop(1, "rgba(183,148,255,.5)");
    c.fillStyle = g;
    c.fillRect(sx - 40 * k, y, 40 * k, h);
  }
}

/* ================= Card renderer: 1080 × 1920, six tiers ================= */

export interface DnaCardView {
  a: DnaCardAnalysis;
  handle: string;
  show: DnaCardShow;
  sample: boolean;
  tier: string | null;
  photoImg: HTMLImageElement | null;
}

type Ctx = CanvasRenderingContext2D;
type Rnd = () => number;

const CARD_W = 1080,
  CARD_H = 1920;
let KS = 1; // render scale, so glows stay the same size in thumbnails

function wrap(c: Ctx, text: string, max: number): string[] {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const wd of words) {
    const t = cur ? cur + " " + wd : wd;
    if (c.measureText(t).width > max && cur) {
      lines.push(cur);
      cur = wd;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
function fitLines(
  c: Ctx,
  text: string,
  max: number,
  font: (z: number) => string,
  sizes: number[],
  maxLines: number,
): { lines: string[]; size: number } {
  for (const s of sizes) {
    c.font = font(s);
    const l = wrap(c, text, max);
    if (l.length <= maxLines && l.every((x) => c.measureText(x).width <= max)) return { lines: l, size: s };
  }
  const s = sizes[sizes.length - 1];
  c.font = font(s);
  const l = wrap(c, text, max);
  return {
    lines: l.slice(0, maxLines).map((t, i) => (i === maxLines - 1 && l.length > maxLines ? t.replace(/\s*\S*$/, "…") : t)),
    size: s,
  };
}
function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function blob(c: Ctx, x: number, y: number, r: number, col: string) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, 7);
  c.fill();
}
const glowOn = (c: Ctx, col: string, b: number) => {
  c.shadowColor = col;
  c.shadowBlur = b * KS;
};
const ls = (c: Ctx, v: number) => {
  if ("letterSpacing" in c) (c as Ctx & { letterSpacing: string }).letterSpacing = v + "px";
};

function sparkle(c: Ctx, x: number, y: number, s: number, a: number, col = "#fff") {
  c.save();
  c.globalAlpha = a;
  c.strokeStyle = col;
  c.lineCap = "round";
  c.lineWidth = Math.max(1, s / 7);
  c.beginPath();
  c.moveTo(x - s, y);
  c.lineTo(x + s, y);
  c.moveTo(x, y - s);
  c.lineTo(x, y + s);
  c.stroke();
  blob(c, x, y, s * 0.7, "rgba(255,255,255,.9)");
  c.restore();
}
function stars(c: Ctx, rnd: Rnd, n: number, box: number[], cols: string[]) {
  const [x0, y0, w, h] = box;
  for (let i = 0; i < n; i++) {
    c.globalAlpha = 0.15 + rnd() * 0.65;
    c.fillStyle = cols[i % cols.length];
    const z = rnd() > 0.92 ? 2.6 : 1.3;
    c.fillRect(x0 + rnd() * w, y0 + rnd() * h, z, z);
  }
  c.globalAlpha = 1;
}
function band(c: Ctx, rnd: Rnd, n: number, from: number[], to: number[], spread: number, cols: string[], rmin: number, rmax: number) {
  for (let i = 0; i < n; i++) {
    const t = rnd();
    blob(c, from[0] + (to[0] - from[0]) * t + (rnd() - 0.5) * spread, from[1] + (to[1] - from[1]) * t + (rnd() - 0.5) * spread, rmin + rnd() * (rmax - rmin), cols[i % cols.length]);
  }
}
function gem(c: Ctx, x: number, y: number, s: number, fill: string, stroke: string) {
  // small faceted gem for the tier pill
  c.save();
  c.beginPath();
  c.moveTo(x - s, y - s * 0.35);
  c.lineTo(x - s * 0.55, y - s * 0.8);
  c.lineTo(x + s * 0.55, y - s * 0.8);
  c.lineTo(x + s, y - s * 0.35);
  c.lineTo(x, y + s * 0.85);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = stroke;
  c.lineWidth = 1.6;
  c.stroke();
  c.beginPath();
  c.moveTo(x - s, y - s * 0.35);
  c.lineTo(x + s, y - s * 0.35);
  c.moveTo(x - s * 0.3, y - s * 0.35);
  c.lineTo(x, y + s * 0.85);
  c.lineTo(x + s * 0.3, y - s * 0.35);
  c.stroke();
  c.restore();
}

/* the content fingerprint: one ridge per recent video, shaped by how each one performed */
function fingerprint(
  c: Ctx,
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a: DnaCardAnalysis,
  seed: string,
  alpha: number,
  cols: string[],
  o: { ell?: number; wob?: number; k?: number; lw?: number } = {},
) {
  const ell = o.ell ?? 0.09,
    wob = o.wob ?? 1;
  const rnd = seeded(seed),
    vids = a.vids.slice(-20),
    K = o.k || Math.max(8, vids.length),
    sp = (r1 - r0) / K,
    rot = rnd() * Math.PI;
  const harm = vids.map((v, i) => ({ n: 2 + (i % 4), amp: 0.012 + (0.018 * Math.min(1.6, v.rel)) / 1.6, ph: rnd() * 6.283 }));
  const g = c.createLinearGradient(cx - r1, cy - r1, cx + r1, cy + r1);
  cols.forEach((cl, i) => g.addColorStop(i / (cols.length - 1), cl));
  c.save();
  c.strokeStyle = g;
  c.lineCap = "round";
  c.lineWidth = Math.max(1.6, sp * (o.lw || 0.42));
  for (let k = 0; k < K; k++) {
    const v = vids[k % vids.length],
      base = r0 + (k + 0.6) * sp,
      gapA = rnd() * 6.283,
      gapW = 0.18 + rnd() * 0.35;
    c.globalAlpha = alpha * Math.min(1, 0.35 + 0.5 * (v ? v.rel : 1));
    c.beginPath();
    let pen = false;
    for (let t = 0; t <= 6.3; t += 0.03) {
      const d = Math.abs(((t - gapA + 9.42) % 6.283) - 3.14);
      if (d > 3.14 - gapW && k > 1) {
        pen = false;
        continue;
      }
      let w = 0;
      for (const hh of harm) w += hh.amp * Math.sin(hh.n * t + hh.ph + k * 0.22);
      const r2 = base * (1 + ell * Math.cos(2 * (t - rot)) + wob * w * (k / K));
      const x = cx + Math.cos(t) * r2,
        y = cy + Math.sin(t) * r2 * 0.94;
      if (pen) c.lineTo(x, y);
      else c.moveTo(x, y);
      pen = true;
    }
    c.stroke();
  }
  c.restore();
}
function photoIn(c: Ctx, cx: number, cy: number, R: number, tint: string, im: HTMLImageElement) {
  const s = Math.max((2 * R) / im.width, (2 * R) / im.height);
  c.save();
  c.beginPath();
  c.arc(cx, cy, R, 0, 7);
  c.clip();
  c.drawImage(im, cx - (im.width * s) / 2, cy - (im.height * s) / 2, im.width * s, im.height * s);
  const v = c.createRadialGradient(cx, cy, R * 0.6, cx, cy, R);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, tint);
  c.fillStyle = v;
  c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  c.restore();
}
interface GalaxyPalette {
  deep: string;
  glow: string;
  arm: string;
  mid: string;
  fp: string[];
}
function galaxyIn(c: Ctx, cx: number, cy: number, R: number, rnd: Rnd, P: GalaxyPalette, view: DnaCardView) {
  c.save();
  c.beginPath();
  c.arc(cx, cy, R, 0, 7);
  c.clip();
  c.fillStyle = P.deep;
  c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  blob(c, cx, cy, R * 1.1, P.glow);
  for (let i = 0; i < 260; i++) {
    c.globalAlpha = 0.2 + rnd() * 0.7;
    c.fillStyle = "#efe8ff";
    const t = rnd() * 6.283,
      d = Math.sqrt(rnd()) * R;
    c.fillRect(cx + Math.cos(t) * d, cy + Math.sin(t) * d, 1.6, 1.6);
  }
  c.globalAlpha = 1;
  c.save();
  c.translate(cx, cy);
  c.rotate(-0.5);
  c.scale(1, 0.42);
  blob(c, 0, 0, R * 0.95, P.arm);
  blob(c, 0, 0, R * 0.55, P.mid);
  blob(c, 0, 0, R * 0.22, "rgba(255,255,255,.95)");
  c.restore();
  c.globalCompositeOperation = "lighter";
  fingerprint(c, cx, cy, R * 0.05, R * 0.96, view.a, dnaCardSlug(view.handle) + "fp", 0.75, P.fp);
  c.restore();
}
function orbit(c: Ctx, cx: number, cy: number, R: number, col: string, front: boolean, planets?: string[]) {
  c.save();
  c.strokeStyle = col;
  c.lineWidth = front ? 2.5 : 2;
  c.beginPath();
  c.ellipse(cx, cy, R + 70, (R + 70) * 0.3, -0.32, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
  c.stroke();
  if (front && planets) {
    const o = R + 70,
      k = -0.32;
    (
      [
        [0.5, 9, planets[0]],
        [2.4, 6, planets[1]],
      ] as [number, number, string][]
    ).forEach(([t, r, cl]) => {
      const x = cx + Math.cos(t) * o * Math.cos(k) - Math.sin(t) * o * 0.3 * Math.sin(k),
        y = cy + Math.cos(t) * o * Math.sin(k) + Math.sin(t) * o * 0.3 * Math.cos(k);
      blob(c, x, y, r * 3, "rgba(214,198,255,.35)");
      c.fillStyle = cl;
      c.beginPath();
      c.arc(x, y, r, 0, 7);
      c.fill();
    });
  }
  c.restore();
}
function rim(c: Ctx, cx: number, cy: number, R: number, cols: string[], w: number, glow: string) {
  const g = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  cols.forEach((cl, i) => g.addColorStop(i / (cols.length - 1), cl));
  c.save();
  glowOn(c, glow, 28);
  c.strokeStyle = g;
  c.lineWidth = w;
  c.beginPath();
  c.arc(cx, cy, R, 0, 7);
  c.stroke();
  c.restore();
}
function uvMark(c: Ctx, x: number, y: number, r: number, txt: string, ring?: string[]) {
  const g = c.createLinearGradient(x - r, y - r, x + r, y + r);
  (ring || ["#d8c8ff", "#7c4dff"]).forEach((cl, i, a) => g.addColorStop(i / (a.length - 1), cl));
  c.strokeStyle = g;
  c.lineWidth = r * 0.16;
  c.beginPath();
  c.arc(x, y, r, 0, 7);
  c.stroke();
  c.fillStyle = txt;
  c.font = `700 ${Math.round(r * 0.78)}px Unbounded, sans-serif`;
  c.textAlign = "center";
  c.fillText("UV", x, y + r * 0.28);
  c.textAlign = "left";
}

export interface DnaCardTierDef {
  id: string;
  name: string;
  rank: number;
  need: { v: number; p: number };
  gemC: [string, string];
  ink: string;
  sub: string;
  accent: string[];
  label: string;
  handle: string;
  fine: string;
  tileFill: string;
  tileStroke: string;
  tileR: number;
  pill: [string, string];
  tierC: Record<DnaCardTier, string>;
  labFont: (z: number) => string;
  uvRing?: string[];
  fp: string[];
  divider: string;
  light?: boolean;
  brandInk?: string;
  segments?: boolean;
  qrR?: number;
  qrFrame?: string;
  bg: (c: Ctx, rnd: Rnd) => void;
  body: (c: Ctx, b: number[], view: DnaCardView) => void;
  emblem: (this: DnaCardTierDef, c: Ctx, cx: number, cy: number, R: number, a: DnaCardAnalysis, rnd: Rnd, view: DnaCardView) => void;
}

function qrBlock(c: Ctx, x: number, y: number, q: number, T: DnaCardTierDef, view: DnaCardView) {
  c.fillStyle = "#ffffff";
  rr(c, x, y, q, q, T.qrR ?? 22);
  c.fill();
  if (T.qrFrame) {
    c.strokeStyle = T.qrFrame;
    c.lineWidth = 3;
    rr(c, x - 8, y - 8, q + 16, q + 16, (T.qrR ?? 22) + 6);
    c.stroke();
  }
  const m = qr(dnaCardLink(view.handle, view.show.handle), "H"),
    cell = Math.floor((q - 24) / m.size),
    ox = x + (q - cell * m.size) / 2,
    oy = y + (q - cell * m.size) / 2;
  c.fillStyle = "#12082a";
  m.modules.forEach((row, yy) =>
    row.forEach((on, xx) => {
      if (on) c.fillRect(ox + xx * cell, oy + yy * cell, cell, cell);
    }),
  );
  const b = Math.round(cell * m.size * 0.26),
    bx = x + q / 2 - b / 2,
    by = y + q / 2 - b / 2;
  c.fillStyle = "#ffffff";
  rr(c, bx, by, b, b, b * 0.24);
  c.fill();
  uvMark(c, x + q / 2, y + q / 2, b * 0.36, "#1a0b3a", T.uvRing);
}

/* ---------- the five tiers ---------- */
const DARK_TIER: Record<DnaCardTier, string> = { verified: "#6ee7b7", observed: "#c4b5fd", testing: "#93c5fd" };
const MANROPE = (z: number): string => `800 ${z}px Manrope, sans-serif`;

export const DNA_CARD_TIERS: DnaCardTierDef[] = [
  {
    id: "quartz",
    name: "Quartz",
    rank: 1,
    need: { v: 8, p: 0 },
    gemC: ["rgba(255,255,255,.85)", "#ffffff"],
    ink: "#ffffff",
    sub: "rgba(255,255,255,.74)",
    accent: ["#ffc2f0", "#9fdcff"],
    label: "#ffc6f1",
    handle: "#ffd9f6",
    fine: "rgba(255,255,255,.55)",
    tileFill: "rgba(255,255,255,.05)",
    tileStroke: "rgba(255,255,255,.26)",
    tileR: 26,
    pill: ["rgba(255,255,255,.75)", "#ffffff"],
    tierC: DARK_TIER,
    labFont: MANROPE,
    uvRing: ["#ffb8ee", "#7fd8ff"],
    fp: ["#ffffff", "#ffc2f0", "#bfe9ff"],
    divider: "rgba(255,255,255,.4)",
    bg(c, rnd) {
      c.fillStyle = "#050509";
      c.fillRect(0, 0, CARD_W, CARD_H);
      blob(c, 160, 760, 640, "rgba(255,70,190,.22)");
      blob(c, 940, 320, 520, "rgba(140,90,255,.2)");
      blob(c, 920, 1620, 640, "rgba(60,140,255,.22)");
      for (let i = 0; i < 16; i++) {
        c.globalAlpha = 0.04 + rnd() * 0.08;
        c.fillStyle = i % 2 ? "#ffd1f2" : "#cfe6ff";
        c.beginPath();
        c.arc(rnd() * CARD_W, rnd() * CARD_H, 30 + rnd() * 80, 0, 7);
        c.fill();
      }
      c.globalAlpha = 1;
    },
    body(c, b) {
      const [x, y, w, h] = b;
      c.save();
      rr(c, x, y, w, h, 64);
      c.fillStyle = "rgba(255,255,255,.06)";
      c.fill();
      c.clip();
      const g = c.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, "rgba(255,255,255,.12)");
      g.addColorStop(0.5, "rgba(255,255,255,.02)");
      g.addColorStop(1, "rgba(255,140,220,.08)");
      c.fillStyle = g;
      c.fillRect(x, y, w, h);
      blob(c, x, y + h * 0.25, 420, "rgba(255,80,200,.14)");
      blob(c, x + w, y + h * 0.8, 480, "rgba(80,160,255,.14)");
      c.restore();
      const e = c.createLinearGradient(x, y, x + w, y + h);
      e.addColorStop(0, "#ff4fd8");
      e.addColorStop(0.5, "#a78bfa");
      e.addColorStop(1, "#5fd6ff");
      for (const [lw, bl] of [
        [10, 70],
        [5, 30],
      ]) {
        c.save();
        glowOn(c, "rgba(255,90,220,.85)", bl);
        c.strokeStyle = e;
        c.lineWidth = lw;
        rr(c, x, y, w, h, 64);
        c.stroke();
        c.restore();
      }
      c.strokeStyle = "rgba(255,255,255,.75)";
      c.lineWidth = 1.6;
      rr(c, x + 3, y + 3, w - 6, h - 6, 61);
      c.stroke();
    },
    emblem(this: DnaCardTierDef, c, cx, cy, R, a, _rnd, view) {
      c.save();
      glowOn(c, "rgba(255,255,255,.55)", 14);
      c.strokeStyle = "rgba(255,255,255,.92)";
      c.lineWidth = 3;
      const poly = (r: number, n: number, off: number) => {
        c.beginPath();
        for (let i = 0; i <= n; i++) {
          const t = off + (i * 6.283) / n;
          if (i) c.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r);
          else c.moveTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r);
        }
        c.stroke();
      };
      poly(R, 8, Math.PI / 8);
      c.globalAlpha = 0.55;
      c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const t1 = Math.PI / 8 + i * 0.785,
          t2 = Math.PI / 8 + (i + 3) * 0.785;
        c.moveTo(cx + Math.cos(t1) * R, cy + Math.sin(t1) * R);
        c.lineTo(cx + Math.cos(t2) * R, cy + Math.sin(t2) * R);
      }
      c.stroke();
      c.globalAlpha = 1;
      c.restore();
      c.save();
      c.beginPath();
      c.arc(cx, cy, R * 0.66, 0, 7);
      c.fillStyle = "rgba(8,6,16,.92)";
      c.fill();
      c.restore();
      if (view.photoImg) {
        photoIn(c, cx, cy, R * 0.62, "rgba(40,10,60,.4)", view.photoImg);
      } else fingerprint(c, cx, cy, R * 0.04, R * 0.62, a, dnaCardSlug(view.handle) + "fp", 0.9, this.fp);
      rim(c, cx, cy, R * 0.66, ["#ff6fe0", "#ffffff", "#6fd6ff"], 3.5, "rgba(255,120,230,.8)");
    },
  },
  {
    id: "amethyst",
    name: "Amethyst",
    rank: 2,
    need: { v: 12, p: 0 },
    gemC: ["#a78bfa", "#ede4ff"],
    ink: "#ffffff",
    sub: "#b8aed6",
    accent: ["#c4a8ff", "#c4a8ff"],
    label: "#b9a6ff",
    handle: "#c4b5fd",
    fine: "#857ba3",
    tileFill: "rgba(255,255,255,.05)",
    tileStroke: "rgba(196,181,253,.2)",
    tileR: 26,
    pill: ["rgba(183,148,255,.8)", "#cbb8ff"],
    tierC: DARK_TIER,
    labFont: MANROPE,
    fp: ["#e9dcff", "#ff9ad5", "#8fe9ff", "#c9b8ff"],
    divider: "rgba(196,181,253,.45)",
    bg(c, rnd) {
      c.fillStyle = "#030208";
      c.fillRect(0, 0, CARD_W, CARD_H);
      band(c, rnd, 46, [-100, 1800], [1180, 200], 260, ["rgba(124,77,255,.16)", "rgba(98,120,255,.12)", "rgba(229,140,255,.10)", "rgba(190,170,255,.10)"], 120, 360);
      stars(c, rnd, 1400, [0, 0, CARD_W, CARD_H], ["#ece4ff", "#ece4ff", "#cfe3ff"]);
      for (let i = 0; i < 9; i++) sparkle(c, rnd() * CARD_W, rnd() * CARD_H, 8 + rnd() * 14, 0.5 + rnd() * 0.5);
    },
    body(c, b) {
      const [x, y, w, h] = b;
      c.save();
      glowOn(c, "rgba(124,77,255,.55)", 70);
      c.fillStyle = "rgba(9,6,20,.9)";
      rr(c, x, y, w, h, 64);
      c.fill();
      c.restore();
      c.save();
      rr(c, x, y, w, h, 64);
      c.clip();
      blob(c, CARD_W / 2, y - 120, 760, "rgba(124,77,255,.30)");
      blob(c, x + w, y + h, 640, "rgba(98,120,255,.16)");
      blob(c, x, y + h * 0.55, 520, "rgba(229,140,255,.10)");
      const sh = c.createLinearGradient(x, y, x + w, y + h);
      sh.addColorStop(0, "rgba(255,154,213,.07)");
      sh.addColorStop(0.3, "rgba(0,0,0,0)");
      sh.addColorStop(0.52, "rgba(127,216,255,.06)");
      sh.addColorStop(0.75, "rgba(0,0,0,0)");
      sh.addColorStop(1, "rgba(183,148,255,.08)");
      c.fillStyle = sh;
      c.fillRect(x, y, w, h);
      c.restore();
      const e = c.createLinearGradient(x, y, x + w, y + h);
      e.addColorStop(0, "#ff8fd8");
      e.addColorStop(0.45, "#9b7bff");
      e.addColorStop(1, "#7fd8ff");
      c.save();
      glowOn(c, "rgba(183,148,255,.9)", 24);
      c.strokeStyle = e;
      c.lineWidth = 3.5;
      rr(c, x, y, w, h, 64);
      c.stroke();
      c.restore();
      c.strokeStyle = "rgba(255,255,255,.12)";
      c.lineWidth = 1.5;
      rr(c, x + 10, y + 10, w - 20, h - 20, 56);
      c.stroke();
    },
    emblem(this: DnaCardTierDef, c, cx, cy, R, a, rnd, view) {
      orbit(c, cx, cy, R, "rgba(196,181,253,.35)", false);
      blob(c, cx, cy, R * 1.9, "rgba(124,77,255,.30)");
      if (view.photoImg) {
        photoIn(c, cx, cy, R, "rgba(40,10,80,.45)", view.photoImg);
        fingerprint(c, cx, cy, R + 8, R + 40, a, dnaCardSlug(view.handle) + "fp", 0.85, this.fp, { ell: 0.012, wob: 0.18, k: 7 });
      } else
        galaxyIn(c, cx, cy, R, rnd, { deep: "#06031a", glow: "rgba(109,40,217,.55)", arm: "rgba(229,140,255,.35)", mid: "rgba(214,198,255,.65)", fp: this.fp }, view);
      rim(c, cx, cy, R, ["#ff8fd8", "#b794ff", "#7fd8ff"], 6, "rgba(183,148,255,.8)");
      orbit(c, cx, cy, R, "rgba(214,198,255,.6)", true, ["#ffffff", "#8fe9ff"]);
    },
  },
  {
    id: "sapphire",
    name: "Sapphire",
    rank: 3,
    need: { v: 16, p: 1 },
    gemC: ["#3b82f6", "#dbeafe"],
    ink: "#ffffff",
    sub: "#a9b8d8",
    accent: ["#9cc2ff", "#9cc2ff"],
    label: "#8fb8ff",
    handle: "#b9cdff",
    fine: "#7f8fb2",
    tileFill: "rgba(120,160,255,.06)",
    tileStroke: "rgba(120,160,255,.4)",
    tileR: 14,
    pill: ["rgba(255,255,255,.85)", "#ffffff"],
    tierC: DARK_TIER,
    labFont: MANROPE,
    fp: ["#dbe7ff", "#8fb8ff", "#ff9ad5", "#cfe0ff"],
    divider: "rgba(143,184,255,.5)",
    uvRing: ["#bcd3ff", "#3b6dff"],
    bg(c, _rnd) {
      const g = c.createLinearGradient(0, 0, CARD_W, CARD_H);
      g.addColorStop(0, "#22385f");
      g.addColorStop(1, "#0e1a33");
      c.fillStyle = g;
      c.fillRect(0, 0, CARD_W, CARD_H);
      blob(c, CARD_W / 2, CARD_H / 2, 1100, "rgba(255,255,255,.05)");
      const v = c.createRadialGradient(CARD_W / 2, CARD_H / 2, 500, CARD_W / 2, CARD_H / 2, 1250);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(0,0,0,.5)");
      c.fillStyle = v;
      c.fillRect(0, 0, CARD_W, CARD_H);
    },
    body(c, b, view) {
      const [x, y, w, h] = b;
      c.save();
      c.shadowColor = "rgba(0,0,0,.7)";
      c.shadowBlur = 80 * KS;
      c.shadowOffsetY = 34 * KS;
      c.fillStyle = "#04060e";
      rr(c, x, y, w, h, 56);
      c.fill();
      c.restore();
      c.save();
      rr(c, x, y, w, h, 56);
      c.clip();
      const r2 = seeded(dnaCardSlug(view.handle) + "sap");
      band(c, r2, 40, [x - 80, y + h * 0.78], [x + w + 80, y + h * 0.22], 300, ["rgba(60,110,255,.20)", "rgba(200,60,150,.14)", "rgba(120,160,255,.14)"], 120, 320);
      stars(c, r2, 700, [x, y, w, h], ["#dfe8ff", "#ffffff"]);
      for (let i = 0; i < 6; i++) sparkle(c, x + r2() * w, y + r2() * h, 6 + r2() * 10, 0.6, "#cfe0ff");
      c.restore();
      c.save();
      glowOn(c, "rgba(90,140,255,.6)", 18);
      c.strokeStyle = "rgba(130,170,255,.65)";
      c.lineWidth = 2.5;
      rr(c, x, y, w, h, 56);
      c.stroke();
      c.restore();
    },
    emblem(this: DnaCardTierDef, c, cx, cy, R, a, rnd, view) {
      blob(c, cx, cy, R * 1.8, "rgba(60,110,255,.28)");
      if (view.photoImg) photoIn(c, cx, cy, R, "rgba(10,20,70,.45)", view.photoImg);
      else
        galaxyIn(c, cx, cy, R, rnd, { deep: "#030716", glow: "rgba(50,90,230,.55)", arm: "rgba(200,80,170,.30)", mid: "rgba(170,200,255,.7)", fp: this.fp }, view);
      c.save();
      c.strokeStyle = "rgba(143,184,255,.85)";
      glowOn(c, "rgba(90,140,255,.8)", 12);
      c.lineWidth = 3;
      c.beginPath();
      c.arc(cx, cy, R + 4, 0, 7);
      c.stroke();
      c.lineWidth = 2;
      for (let i = 0; i < 72; i++) {
        const t = (i * 6.283) / 72,
          l = i % 6 ? 8 : 18;
        c.globalAlpha = i % 6 ? 0.5 : 0.95;
        c.beginPath();
        c.moveTo(cx + Math.cos(t) * (R + 16), cy + Math.sin(t) * (R + 16));
        c.lineTo(cx + Math.cos(t) * (R + 16 + l), cy + Math.sin(t) * (R + 16 + l));
        c.stroke();
      }
      c.globalAlpha = 0.7;
      c.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.arc(cx, cy, R + 46, i * 1.571 + 0.25, i * 1.571 + 1.3);
        c.stroke();
      }
      c.restore();
      blob(c, cx + R * 0.62, cy - R * 0.5, 22, "rgba(255,255,255,.85)");
    },
  },
  {
    id: "ruby",
    name: "Ruby",
    rank: 4,
    need: { v: 20, p: 2 },
    gemC: ["#ff2d87", "#ffd1e8"],
    ink: "#ffffff",
    sub: "#d3aec2",
    accent: ["#ff4fa3", "#ff4fa3"],
    label: "#ff6fb5",
    handle: "#ff9ccf",
    fine: "#a27b90",
    tileFill: "rgba(255,79,163,.04)",
    tileStroke: "rgba(255,79,163,.75)",
    tileR: 6,
    pill: ["#ff4fa3", "#ff8cc6"],
    tierC: { verified: "#ff4fa3", observed: "#ff9ccf", testing: "#ffd1e8" },
    segments: true,
    labFont: (z: number) => `700 ${z}px "Space Mono", ui-monospace, monospace`,
    fp: ["#ffffff", "#ff4fa3", "#ff9ccf"],
    divider: "rgba(255,79,163,.6)",
    uvRing: ["#ff9ccf", "#ff2d87"],
    qrR: 6,
    qrFrame: "#ff4fa3",
    bg(c, _rnd) {
      c.fillStyle = "#000";
      c.fillRect(0, 0, CARD_W, CARD_H);
      c.fillStyle = "#ff4fa3";
      c.fillRect(0, 22, CARD_W, 3);
      c.fillRect(0, CARD_H - 36, CARD_W, 16);
    },
    body(c, b) {
      const [x, y, w, h] = b;
      c.fillStyle = "#050205";
      rr(c, x, y, w, h, 20);
      c.fill();
      c.save();
      rr(c, x, y, w, h, 20);
      c.clip();
      blob(c, x + w, y, 600, "rgba(255,45,135,.14)");
      blob(c, x, y + h, 600, "rgba(255,45,135,.10)");
      c.fillStyle = "rgba(255,255,255,.025)";
      for (let yy = y; yy < y + h; yy += 6) c.fillRect(x, yy, w, 2);
      c.restore();
      c.save();
      glowOn(c, "rgba(255,79,163,.55)", 20);
      c.strokeStyle = "#ff4fa3";
      c.lineWidth = 2.5;
      rr(c, x, y, w, h, 20);
      c.stroke();
      c.restore();
      c.strokeStyle = "#ff4fa3";
      c.lineWidth = 6;
      const k = 64,
        i = 22;
      (
        [
          [x + i, y + i, 1, 1],
          [x + w - i, y + i, -1, 1],
          [x + i, y + h - i, 1, -1],
          [x + w - i, y + h - i, -1, -1],
        ] as [number, number, number, number][]
      ).forEach(([px, py, sx, sy]) => {
        c.beginPath();
        c.moveTo(px, py + sy * k);
        c.lineTo(px, py);
        c.lineTo(px + sx * k, py);
        c.stroke();
      });
    },
    emblem(this: DnaCardTierDef, c, cx, cy, R, a, _rnd, view) {
      c.save();
      c.beginPath();
      c.arc(cx, cy, R, 0, 7);
      c.fillStyle = "#0a0208";
      c.fill();
      c.restore();
      if (view.photoImg) photoIn(c, cx, cy, R - 6, "rgba(80,0,40,.45)", view.photoImg);
      else fingerprint(c, cx, cy, R * 0.05, R * 0.9, a, dnaCardSlug(view.handle) + "fp", 0.95, this.fp);
      c.save();
      c.strokeStyle = "#ff4fa3";
      glowOn(c, "rgba(255,79,163,.7)", 16);
      c.lineWidth = 16;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.arc(cx, cy, R + 22, i * 1.571 + 0.18, i * 1.571 + 1.39);
        c.stroke();
      }
      c.lineWidth = 2;
      c.globalAlpha = 0.5;
      c.beginPath();
      c.arc(cx, cy, R + 48, 0, 7);
      c.stroke();
      c.restore();
      c.save();
      c.strokeStyle = "#ff4fa3";
      c.lineWidth = 3;
      const gx = cx + R + 120,
        gy = cy - R * 0.45,
        gr = 34;
      c.beginPath();
      c.arc(gx, gy, gr, 0, 7);
      c.stroke();
      c.beginPath();
      c.ellipse(gx, gy, gr * 0.45, gr, 0, 0, 7);
      c.stroke();
      c.beginPath();
      c.moveTo(gx - gr, gy);
      c.lineTo(gx + gr, gy);
      c.moveTo(gx - gr * 0.86, gy - gr * 0.5);
      c.lineTo(gx + gr * 0.86, gy - gr * 0.5);
      c.moveTo(gx - gr * 0.86, gy + gr * 0.5);
      c.lineTo(gx + gr * 0.86, gy + gr * 0.5);
      c.stroke();
      c.strokeStyle = "#ffffff";
      c.lineWidth = 3;
      const sx = cx - R - 200,
        sy = cy + R * 0.4;
      c.beginPath();
      for (let t = 0; t <= 140; t += 3) {
        const yy = sy + Math.sin(((t / 140) * Math.PI * 3)) * 22;
        if (t) c.lineTo(sx + t, yy);
        else c.moveTo(sx + t, yy);
      }
      c.stroke();
      c.globalAlpha = 0.6;
      c.fillStyle = "#ffffff";
      c.fillRect(sx - 6, sy, 152, 2);
      c.restore();
    },
  },
  {
    id: "gold",
    name: "Gold",
    rank: 5,
    need: { v: 22, p: 3 },
    gemC: ["#e8b94a", "#fff1c1"],
    ink: "#fff8e7",
    sub: "#cdbf9f",
    accent: ["#fff3c4", "#e8b94a", "#b07a1c", "#f6d77d"],
    label: "#e6c068",
    handle: "#f3d48a",
    fine: "#9c8f72",
    tileFill: "rgba(232,185,74,.05)",
    tileStroke: "rgba(232,185,74,.45)",
    tileR: 22,
    pill: ["#e8b94a", "#f6d77d"],
    tierC: { verified: "#7ee2b8", observed: "#f3d48a", testing: "#cbd5e1" },
    labFont: MANROPE,
    fp: ["#fff3c4", "#e8b94a", "#b07a1c", "#f6d77d"],
    divider: "rgba(232,185,74,.6)",
    uvRing: ["#fff1c1", "#c8922a"],
    bg(c, rnd) {
      c.fillStyle = "#050403";
      c.fillRect(0, 0, CARD_W, CARD_H);
      band(c, rnd, 40, [-100, 1800], [1180, 200], 260, ["rgba(232,185,74,.10)", "rgba(180,120,40,.10)", "rgba(255,220,150,.06)"], 120, 340);
      stars(c, rnd, 1200, [0, 0, CARD_W, CARD_H], ["#fff1d6", "#ffe4a8", "#ffffff"]);
      for (let i = 0; i < 9; i++) sparkle(c, rnd() * CARD_W, rnd() * CARD_H, 8 + rnd() * 14, 0.5 + rnd() * 0.5, "#ffe9b0");
    },
    body(c, b) {
      const [x, y, w, h] = b;
      c.save();
      glowOn(c, "rgba(232,185,74,.35)", 70);
      c.fillStyle = "#0b0906";
      rr(c, x, y, w, h, 64);
      c.fill();
      c.restore();
      c.save();
      rr(c, x, y, w, h, 64);
      c.clip();
      blob(c, CARD_W / 2, y - 140, 760, "rgba(232,185,74,.16)");
      blob(c, x + w, y + h, 620, "rgba(176,122,28,.14)");
      blob(c, x, y + h * 0.5, 520, "rgba(255,220,150,.06)");
      c.globalAlpha = 0.035;
      c.strokeStyle = "#ffe9b0";
      c.lineWidth = 1;
      for (let i = -h; i < w; i += 7) {
        c.beginPath();
        c.moveTo(x + i, y + h);
        c.lineTo(x + i + h * 0.6, y);
        c.stroke();
      }
      c.globalAlpha = 1;
      c.restore();
      const e = c.createLinearGradient(x, y, x + w, y + h);
      ["#fff3c4", "#e8b94a", "#8a5a12", "#f6d77d", "#c8922a", "#fff1c1"].forEach((cl, i, arr) => e.addColorStop(i / (arr.length - 1), cl));
      c.save();
      glowOn(c, "rgba(232,185,74,.7)", 22);
      c.strokeStyle = e;
      c.lineWidth = 5;
      rr(c, x, y, w, h, 64);
      c.stroke();
      c.restore();
      c.strokeStyle = "rgba(232,185,74,.4)";
      c.lineWidth = 1.5;
      rr(c, x + 18, y + 18, w - 36, h - 36, 50);
      c.stroke();
    },
    emblem(this: DnaCardTierDef, c, cx, cy, R, a, rnd, view) {
      blob(c, cx, cy, R * 1.8, "rgba(232,185,74,.16)");
      if (view.photoImg) {
        photoIn(c, cx, cy, R, "rgba(60,35,5,.45)", view.photoImg);
        fingerprint(c, cx, cy, R + 8, R + 34, a, dnaCardSlug(view.handle) + "fp", 0.9, this.fp, { ell: 0.012, wob: 0.18, k: 6 });
      } else {
        c.save();
        c.beginPath();
        c.arc(cx, cy, R, 0, 7);
        c.clip();
        c.fillStyle = "#0a0703";
        c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
        blob(c, cx, cy, R, "rgba(232,185,74,.22)");
        for (let i = 0; i < 200; i++) {
          c.globalAlpha = 0.2 + rnd() * 0.6;
          c.fillStyle = "#fff1d6";
          const t = rnd() * 6.283,
            d = Math.sqrt(rnd()) * R;
          c.fillRect(cx + Math.cos(t) * d, cy + Math.sin(t) * d, 1.5, 1.5);
        }
        c.globalAlpha = 1;
        fingerprint(c, cx, cy, R * 0.05, R * 0.94, a, dnaCardSlug(view.handle) + "fp", 0.95, this.fp);
        c.restore();
      }
      rim(c, cx, cy, R, ["#fff3c4", "#e8b94a", "#8a5a12", "#f6d77d"], 7, "rgba(232,185,74,.8)");
      c.save();
      c.fillStyle = "#e8b94a";
      for (let i = 0; i < 60; i++) {
        const t = (i * 6.283) / 60;
        c.globalAlpha = i % 5 ? 0.55 : 1;
        c.beginPath();
        c.arc(cx + Math.cos(t) * (R + 22), cy + Math.sin(t) * (R + 22), i % 5 ? 2.2 : 3.6, 0, 7);
        c.fill();
      }
      c.globalAlpha = 0.45;
      c.strokeStyle = "#e8b94a";
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(cx, cy, R + 40, 0, 7);
      c.stroke();
      c.restore();
    },
  },
  {
    id: "diamond",
    name: "Diamond",
    rank: 6,
    need: { v: 24, p: 4 },
    light: true,
    gemC: ["#ffffff", "#7c3aed"],
    ink: "#140d2b",
    sub: "#4d4569",
    accent: ["#6d28d9", "#db2777"],
    label: "#c81e8f",
    handle: "#6d28d9",
    fine: "#6d6688",
    tileFill: "rgba(255,255,255,.55)",
    tileStroke: "rgba(140,110,220,.28)",
    tileR: 28,
    pill: ["#c81e8f", "#140d2b"],
    tierC: { verified: "#047857", observed: "#6d28d9", testing: "#1d4ed8" },
    labFont: MANROPE,
    fp: ["#ffffff", "#ffc2f0", "#a5e8ff", "#e3d6ff"],
    divider: "rgba(109,40,217,.35)",
    uvRing: ["#c81e8f", "#6d28d9"],
    brandInk: "#140d2b",
    bg(c, rnd) {
      c.fillStyle = "#020104";
      c.fillRect(0, 0, CARD_W, CARD_H);
      stars(c, rnd, 900, [0, 0, CARD_W, CARD_H], ["#ffffff", "#e9e2ff"]);
      for (let i = 0; i < 14; i++) sparkle(c, rnd() * CARD_W, rnd() * CARD_H, 8 + rnd() * 16, 0.55 + rnd() * 0.45);
    },
    body(c, b) {
      const [x, y, w, h] = b;
      c.save();
      glowOn(c, "rgba(183,148,255,.55)", 80);
      const g = c.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, "#f6f1ff");
      g.addColorStop(0.35, "#e6dcff");
      g.addColorStop(0.65, "#fbeaff");
      g.addColorStop(1, "#dff3ff");
      c.fillStyle = g;
      rr(c, x, y, w, h, 64);
      c.fill();
      c.restore();
      c.save();
      rr(c, x, y, w, h, 64);
      c.clip();
      blob(c, x + w * 0.88, y + h * 0.1, 560, "rgba(255,165,228,.55)");
      blob(c, x + w * 0.08, y + h * 0.42, 600, "rgba(160,225,255,.55)");
      blob(c, x + w * 0.82, y + h * 0.7, 620, "rgba(190,160,255,.5)");
      blob(c, x + w * 0.3, y + h * 0.18, 520, "rgba(255,255,255,.75)");
      blob(c, x + w * 0.2, y + h * 0.96, 520, "rgba(255,180,235,.5)");
      for (let i = 0; i < 5; i++) {
        c.save();
        c.translate(x + w * (0.1 + i * 0.22), y + h * (0.15 + i * 0.18));
        c.rotate(-0.65);
        const s2 = c.createLinearGradient(0, -60, 0, 60);
        s2.addColorStop(0, "rgba(255,255,255,0)");
        s2.addColorStop(0.5, "rgba(255,255,255,.45)");
        s2.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = s2;
        c.fillRect(-700, -60, 1400, 120);
        c.restore();
      }
      c.restore();
      const e = c.createLinearGradient(x, y, x + w, y + h);
      e.addColorStop(0, "#c9b6ff");
      e.addColorStop(0.5, "#ff9ad5");
      e.addColorStop(1, "#8fd8ff");
      c.save();
      glowOn(c, "rgba(201,182,255,.9)", 20);
      c.strokeStyle = e;
      c.lineWidth = 5;
      rr(c, x, y, w, h, 64);
      c.stroke();
      c.restore();
      c.strokeStyle = "rgba(255,255,255,.9)";
      c.lineWidth = 2;
      rr(c, x + 9, y + 9, w - 18, h - 18, 56);
      c.stroke();
    },
    emblem(this: DnaCardTierDef, c, cx, cy, R, a, rnd, view) {
      c.save();
      c.beginPath();
      c.arc(cx, cy, R + 22, 0, 7);
      c.fillStyle = "rgba(255,255,255,.6)";
      glowOn(c, "rgba(120,80,220,.35)", 40);
      c.fill();
      c.restore();
      orbit(c, cx, cy, R, "rgba(109,40,217,.35)", false);
      if (view.photoImg) {
        photoIn(c, cx, cy, R, "rgba(120,60,200,.3)", view.photoImg);
        fingerprint(c, cx, cy, R + 4, R + 20, a, dnaCardSlug(view.handle) + "fp", 0.9, ["#c81e8f", "#6d28d9", "#1d9bd8"], { ell: 0.01, wob: 0.12, k: 4, lw: 0.3 });
      } else
        galaxyIn(c, cx, cy, R, rnd, { deep: "#0a0620", glow: "rgba(124,77,255,.6)", arm: "rgba(255,154,213,.45)", mid: "rgba(214,198,255,.7)", fp: this.fp }, view);
      rim(c, cx, cy, R, ["#ff9ad5", "#ffffff", "#9b7bff", "#8fd8ff"], 9, "rgba(201,182,255,.9)");
      c.save();
      c.strokeStyle = "rgba(255,255,255,.95)";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(cx, cy, R - 2, Math.PI * 1.1, Math.PI * 1.45);
      c.stroke();
      c.restore();
      orbit(c, cx, cy, R, "rgba(109,40,217,.55)", true, ["#6d28d9", "#c81e8f"]);
    },
  },
];

export function dnaCardTierById(id: string | null | undefined): DnaCardTierDef {
  return DNA_CARD_TIERS.find((t) => t.id === id) || DNA_CARD_TIERS[1];
}

interface CardBlock {
  h?: number;
  emblem?: boolean;
  draw?: (y: number) => void;
}

export function renderCard(cv: HTMLCanvasElement, view: DnaCardView, T: DnaCardTierDef = dnaCardTierById(view.tier), k = 1) {
  const a = view.a,
    F = a.fields;
  cv.width = Math.round(CARD_W * k);
  cv.height = Math.round(CARD_H * k);
  KS = k;
  const c = cv.getContext("2d")!;
  c.setTransform(k, 0, 0, k, 0, 0);
  c.textBaseline = "alphabetic";
  const rnd = seeded(dnaCardSlug(view.handle) + a.n + T.id);
  T.bg(c, rnd);
  const CX = 54,
    CY = 54,
    CW = CARD_W - 108,
    CH = CARD_H - 108,
    box = [CX, CY, CW, CH];
  // No decorative rings at the card's edges: the owner ordered the side
  // tori removed (2026-11-24). The only ring left in the artwork is the
  // thin orbit centered on the fingerprint orb, drawn by the emblems.
  T.body(c, box, view);

  const L = CX + 60,
    RX = CX + CW - 60,
    IW = RX - L,
    MID = CARD_W / 2;
  const center = (t: string, y: number) => {
    c.textAlign = "center";
    c.fillText(t, MID, y);
    c.textAlign = "left";
  };
  const grad = (x0: number, x1: number) => {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    T.accent.forEach((cl, i) => g.addColorStop(i / (T.accent.length - 1), cl));
    return g;
  };
  const accentFill = () => grad(L + IW * 0.15, RX - IW * 0.15);
  // brand row: only UV / ULTRA VESTRA, plus the tier
  uvMark(c, L + 30, CY + 82, 30, T.brandInk || "#ffffff", T.uvRing);
  c.font = "600 28px Unbounded, sans-serif";
  c.fillStyle = T.brandInk || "#fff";
  ls(c, 3);
  c.fillText("ULTRA VESTRA", L + 80, CY + 93);
  ls(c, 0);
  const pill = T.name.toUpperCase() + (view.sample ? " · SAMPLE" : " · CREATOR DNA");
  c.font = T.labFont(21);
  ls(c, 1);
  const pw = c.measureText(pill).width + 76;
  const amber = view.sample ? (T.light ? "#b45309" : "#fcd34d") : null;
  c.strokeStyle = amber || T.pill[0];
  c.lineWidth = 2.5;
  rr(c, RX - pw, CY + 58, pw, 48, T.tileR > 10 ? 24 : 6);
  c.stroke();
  gem(c, RX - pw + 30, CY + 82, 12, T.gemC[0], T.gemC[1]);
  c.fillStyle = amber || T.pill[1];
  c.fillText(pill, RX - pw + 52, CY + 90);
  ls(c, 0);

  const top = CY + 140,
    bottom = CY + CH - 44;
  const tileKeys = (["topic", "format", "opportunity", "experiment"] as DnaCardFieldKey[]).filter((key) => view.show[key] && F[key]);
  const TL: Record<string, string> = {
    topic: "Strongest topic",
    format: "Best format",
    opportunity: "Growth opportunity",
    experiment: "Next experiment",
  };
  const TIERW: Record<DnaCardTier, string> = { verified: "Verified", observed: "Observed", testing: "Testing" },
    SEG: Record<DnaCardTier, number> = { verified: 3, observed: 2, testing: 1 };
  let plan: CardBlock[] = [],
    R = 0,
    gap = 0;
  for (const s of [1, 0.93, 0.86, 0.8]) {
    const B: CardBlock[] = [];
    {
      const f2 = fitLines(c, "YOU LEAVE A FINGERPRINT.", IW, (z) => `700 ${z}px Unbounded, sans-serif`, [50, 46, 42, 38].map((z) => Math.round(z * s)), 1);
      const z1 = Math.round(32 * s);
      B.push({
        h: z1 * 1.2 + 14 + f2.size * 1.05,
        draw: (y) => {
          c.font = `800 ${z1}px Manrope, sans-serif`;
          c.fillStyle = T.ink;
          ls(c, 1);
          center("YOU DON'T JUST CREATE CONTENT.", y + z1);
          ls(c, 0);
          c.font = `700 ${f2.size}px Unbounded, sans-serif`;
          c.fillStyle = accentFill();
          center("YOU LEAVE A FINGERPRINT.", y + z1 * 1.2 + 14 + f2.size * 0.9);
        },
      });
    }
    B.push({ emblem: true });
    // the handle block exists only when the creator has set their own
    // handle — with none set the block is omitted entirely, so the
    // identity title and everything below shift up naturally.
    if (view.show.handle && view.handle.trim()) {
      const z = Math.round(32 * s);
      B.push({
        h: z * 1.15,
        draw: (y) => {
          c.font = `700 ${z}px Manrope, sans-serif`;
          c.fillStyle = T.handle;
          center(view.handle, y + z * 0.9);
        },
      });
    }
    if (view.show.identity && F.identity) {
      const f = fitLines(c, F.identity.value.toUpperCase(), IW, (z) => `700 ${z}px Unbounded, sans-serif`, [54, 48, 44, 40].map((z) => Math.round(z * s)), 2);
      B.push({
        h: f.lines.length * f.size * 1.14,
        draw: (y) => {
          c.font = `700 ${f.size}px Unbounded, sans-serif`;
          c.fillStyle = T.ink;
          f.lines.forEach((l, i) => center(l, y + f.size * 0.92 + i * f.size * 1.14));
        },
      });
    }
    if (view.show.trait && F.trait) {
      const zl = Math.round(22 * s),
        f = fitLines(c, F.trait.value, IW, (z) => `700 ${z}px Manrope, sans-serif`, [36, 33, 30].map((z) => Math.round(z * s)), 2),
        t = F.trait;
      B.push({
        h: zl * 1.3 + 8 + f.lines.length * f.size * 1.18,
        draw: (y) => {
          c.font = T.labFont(zl);
          ls(c, 2);
          const l1 = "MY CREATOR SUPERPOWER  ·  ",
            l2 = TIERW[t.tier].toUpperCase(),
            w1 = c.measureText(l1).width,
            w2 = c.measureText(l2).width,
            x0 = MID - (w1 + w2) / 2;
          c.fillStyle = T.label;
          c.fillText(l1, x0, y + zl);
          c.fillStyle = T.tierC[t.tier];
          c.fillText(l2, x0 + w1, y + zl);
          ls(c, 0);
          c.font = `700 ${f.size}px Manrope, sans-serif`;
          c.fillStyle = T.ink;
          f.lines.forEach((l, i) => center(l, y + zl * 1.3 + 8 + f.size * 0.95 + i * f.size * 1.18));
        },
      });
    }
    {
      const z = Math.round(38 * s),
        zs = Math.round(26 * s),
        f = fitLines(c, "THIS IS MY CONTENT DNA.", IW, (q) => `700 ${q}px Unbounded, sans-serif`, [z, z - 4, z - 8], 1);
      B.push({
        h: 30 + f.size * 1.1 + 10 + zs * 1.3,
        draw: (y) => {
          const dg = c.createLinearGradient(L, 0, RX, 0);
          dg.addColorStop(0, "rgba(0,0,0,0)");
          dg.addColorStop(0.5, T.divider);
          dg.addColorStop(1, "rgba(0,0,0,0)");
          c.fillStyle = dg;
          c.fillRect(L, y, IW, 2);
          c.font = `700 ${f.size}px Unbounded, sans-serif`;
          c.fillStyle = T.ink;
          center("THIS IS MY CONTENT DNA.", y + 30 + f.size * 0.92);
          c.font = `500 ${zs}px Manrope, sans-serif`;
          c.fillStyle = T.sub;
          center("My style. My strengths. My creative identity.", y + 30 + f.size * 1.1 + 10 + zs);
        },
      });
    }
    if (tileKeys.length) {
      const gp = 16,
        zl = Math.round(20 * s),
        zt = Math.round(21 * s);
      const cells = tileKeys.map((key, i) => {
        const full = tileKeys.length % 2 === 1 && i === tileKeys.length - 1,
          w = full ? IW : (IW - gp) / 2,
          f = fitLines(c, F[key]!.value, w - 48, (z) => `700 ${z}px Manrope, sans-serif`, [32, 29, 26].map((z) => Math.round(z * s)), 3);
        return { key, w, full, f, h: 24 + zl + 12 + f.lines.length * f.size * 1.18 + 8 + zt + 22 };
      });
      const rowsT: (typeof cells)[] = [];
      for (let i = 0; i < cells.length; ) {
        if (cells[i].full) {
          rowsT.push([cells[i]]);
          i++;
        } else {
          rowsT.push(cells.slice(i, i + 2));
          i += 2;
        }
      }
      const rh = rowsT.map((r) => Math.max(...r.map((x2) => x2.h)));
      B.push({
        h: rh.reduce((s2, h) => s2 + h, 0) + gp * (rowsT.length - 1),
        draw: (y) => {
          let yy = y;
          rowsT.forEach((r, ri) => {
            let xx = L;
            r.forEach((cl) => {
              c.fillStyle = T.tileFill;
              rr(c, xx, yy, cl.w, rh[ri], T.tileR);
              c.fill();
              c.strokeStyle = T.tileStroke;
              c.lineWidth = T.segments ? 2 : 1.5;
              c.stroke();
              c.font = T.labFont(zl);
              c.fillStyle = T.label;
              ls(c, 1.5);
              c.fillText(TL[cl.key].toUpperCase(), xx + 24, yy + 24 + zl);
              ls(c, 0);
              c.font = `700 ${cl.f.size}px Manrope, sans-serif`;
              c.fillStyle = T.ink;
              let vy = yy + 24 + zl + 12 + cl.f.size * 0.95;
              cl.f.lines.forEach((l) => {
                c.fillText(l, xx + 24, vy);
                vy += cl.f.size * 1.18;
              });
              const tr = F[cl.key]!.tier,
                by = yy + rh[ri] - 22;
              c.fillStyle = T.tierC[tr];
              if (T.segments) {
                for (let q = 0; q < 3; q++) {
                  c.globalAlpha = q < SEG[tr] ? 1 : 0.25;
                  c.fillRect(xx + 24 + q * 22, by - zt * 0.7, 16, zt * 0.72);
                }
                c.globalAlpha = 1;
                c.font = T.labFont(zt - 2);
                c.fillText(TIERW[tr].toUpperCase(), xx + 24 + 72, by);
              } else {
                c.beginPath();
                c.arc(xx + 30, by - zt * 0.35, 6, 0, 7);
                c.fill();
                c.font = `700 ${zt}px Manrope, sans-serif`;
                c.fillText(TIERW[tr], xx + 44, by);
              }
              xx += cl.w + gp;
            });
            yy += rh[ri] + gp;
          });
        },
      });
    }
    {
      const q = 200;
      B.push({
        h: q,
        draw: (y) => {
          qrBlock(c, L, y, q, T, view);
          const tx = L + q + 36,
            tw = RX - tx;
          const f = fitLines(c, "WHAT'S YOURS?", tw, (z) => `700 ${z}px Unbounded, sans-serif`, [46, 42, 38, 34], 1);
          c.font = `700 ${f.size}px Unbounded, sans-serif`;
          c.fillStyle = grad(tx, tx + tw * 0.8);
          c.fillText("WHAT'S YOURS?", tx, y + f.size + 6);
          const f2 = fitLines(c, "DISCOVER YOURS · " + DNA_CARD_CONFIG.displayLink, tw, (z) => T.labFont(z), [24, 22, 20], 1);
          c.font = T.labFont(f2.size);
          c.fillStyle = T.ink;
          ls(c, 1);
          c.fillText(f2.lines[0], tx, y + f.size + 52);
          c.font = T.labFont(19);
          c.fillStyle = T.fine;
          c.fillText("MY CREATOR ID", tx, y + q - 50);
          ls(c, 0);
          c.font = "600 30px Unbounded, sans-serif";
          c.fillStyle = T.ink;
          c.fillText(dnaCardCreatorId(view.handle), tx, y + q - 8);
        },
      });
    }
    B.push({
      h: 26,
      draw: (y) => {
        c.font = "500 21px Manrope, sans-serif";
        c.fillStyle = T.fine;
        center(view.sample ? "Sample creator for preview. Not real analytics." : "Patterns from my own content. Not a guarantee.", y + 21);
      },
    });
    const fixed = B.reduce((s2, b) => s2 + (b.h || 0), 0),
      G = Math.round(26 * s),
      free = bottom - top - fixed - G * (B.length - 1);
    R = Math.min(230, (free - 40 - (T.id === "sapphire" || T.id === "ruby" || T.id === "gold" ? 30 : 0)) / 2);
    plan = B;
    gap = G;
    if (R >= 128) break;
  }
  R = Math.max(110, R);
  const used = plan.reduce((s2, b) => s2 + (b.emblem ? 2 * R + 40 : b.h || 0), 0) + gap * (plan.length - 1);
  const extra = Math.max(0, bottom - top - used),
    g2 = gap + extra / (plan.length - 1);
  let y = top;
  plan.forEach((b) => {
    if (b.emblem) {
      T.emblem(c, MID, y + 20 + R, R, a, rnd, view);
      y += 2 * R + 40 + g2;
    } else {
      b.draw!(y);
      y += (b.h || 0) + g2;
    }
  });
  KS = 1;
}

/* ---------- tiers unlock as Content DNA learns: analyzed videos + verified patterns, never followers or views ---------- */
export interface DnaCardDepth {
  v: number;
  p: number;
}

export function dnaDepth(a: DnaCardAnalysis): DnaCardDepth {
  return {
    v: a.n,
    p: (["topic", "format", "hook", "band"] as const).reduce(
      (n, key) => n + a.groups[key].filter((g) => g.tier === "verified").length,
      0,
    ),
  };
}

export function dnaCardTierUnlocked(T: DnaCardTierDef, d: DnaCardDepth): boolean {
  return !DNA_CARD_CONFIG.earnedTiers || (d.v >= T.need.v && d.p >= T.need.p);
}

export function dnaCardTierNeedText(T: DnaCardTierDef, d: DnaCardDepth): string {
  const parts: string[] = [];
  if (d.v < T.need.v) parts.push(`${T.need.v - d.v} more video${T.need.v - d.v === 1 ? "" : "s"}`);
  if (d.p < T.need.p) parts.push(`${T.need.p - d.p} more verified pattern${T.need.p - d.p === 1 ? "" : "s"}`);
  return parts.join(" and ");
}

/** The prototype's pickTier: fall back to the highest unlocked tier when the saved one is locked. */
export function dnaCardPickTier(a: DnaCardAnalysis, current: string | null): string {
  const d = dnaDepth(a);
  const cur = DNA_CARD_TIERS.find((t) => t.id === current);
  if (!cur || !dnaCardTierUnlocked(cur, d))
    return [...DNA_CARD_TIERS].reverse().find((t) => dnaCardTierUnlocked(t, d))?.id || "quartz";
  return cur.id;
}
