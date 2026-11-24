/* Content pipeline — the owner's Content DNA demo also carried a
 * "Content plan" board (2026-11-23): every video the creator is
 * making, tracked through scripting → filming → scheduled → posted,
 * with results recorded once a video is posted. In the demo those
 * posted items are exactly what Content DNA reads as "Your Ultra
 * Vestra posts" (its converter filters status "posted" with stats
 * and a posted date, and maps them into DNA posts with source
 * "app"). This module is that board's pure logic: the item shape,
 * the status chain, the results test, the DNA conversion, and the
 * device-local store (localStorage "uv-content-pipeline", the same
 * pattern as the Studio draft and Content DNA — nothing is sent to
 * a server). The component lives in app/studio/PipelineSection.tsx.
 *
 * Demo details recovered from the bundle, verbatim:
 *   status chain (its Nl/_s): ["idea","scripting","filming",
 *   "scheduled","posted"] with labels Idea/Scripting/Filming/
 *   Scheduled/Posted — the owner's brief for this port fixes the
 *   chain at the four working statuses below (no "idea").
 *   item: {id, title, dealId, platform, status, dueAt} while in
 *   progress; posted items add {postedAt, stats:{views, likes,
 *   comments, shares, sales}}.
 *   board heading "Content plan", grouped list headed "Your own
 *   content" for deal-less items, empty copy "Nothing planned.
 *   Open Video Studio to start one.", and the posted-results
 *   panel's empty copy "No posts in the last 30 days yet. Posted
 *   videos show their results here."
 *   converter (its Vb): filter status==="posted" && stats &&
 *   postedAt, map to {id:`uv-${id}`, source:"app", title,
 *   hook: hook||title, date: postedAt, platform, topic, format,
 *   length, views/likes/comments/shares from stats, saves/watch/
 *   sales as stats value or null}.
 *   Discover source button: disabled when the converted list is
 *   empty; sub-label "N post(s) with results" or, when empty,
 *   "No posted videos with results yet"; picked label "N post(s)
 *   from Ultra Vestra". */

import type { DnaPost } from "./dna";

export const PIPELINE_STORAGE_KEY = "uv-content-pipeline";

/* ---------- the status chain ---------- */

export type PipelineStatus = "scripting" | "filming" | "scheduled" | "posted";

export const PIPELINE_STATUSES: PipelineStatus[] = ["scripting", "filming", "scheduled", "posted"];

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  scripting: "Scripting",
  filming: "Filming",
  scheduled: "Scheduled",
  posted: "Posted",
};

export const isPipelineStatus = (t: unknown): t is PipelineStatus =>
  typeof t === "string" && (PIPELINE_STATUSES as string[]).includes(t);

export const statusIndex = (status: PipelineStatus): number => PIPELINE_STATUSES.indexOf(status);

/** The next status along the chain, or null at the end (posted). */
export const nextStatus = (status: PipelineStatus): PipelineStatus | null =>
  PIPELINE_STATUSES[statusIndex(status) + 1] ?? null;

/** The previous status along the chain, or null at the start. */
export const prevStatus = (status: PipelineStatus): PipelineStatus | null =>
  PIPELINE_STATUSES[statusIndex(status) - 1] ?? null;

/* ---------- the item ---------- */

/** Results recorded once a video is posted. Views is the one
 * required number (it is what makes a posted item readable by
 * Content DNA); everything else is optional and stays absent —
 * never zero-filled at rest, so "not recorded" stays distinct
 * from "recorded as zero". */
export type PipelineResults = {
  views: number;
  shares?: number;
  saves?: number;
  comments?: number;
  likes?: number;
  watchSec?: number;
  clicks?: number;
  sales?: number;
};

export type PipelineItem = {
  id: string;
  title: string;
  status: PipelineStatus;
  topic: string;
  format: string;
  /** The demo's items carry a platform and DNA normalizes views
   * per platform, so the board keeps one too. */
  platform: string;
  hookStyle?: string;
  lengthSec?: number | null;
  /** yyyy-mm-dd, set when the item reaches posted. */
  postedDate?: string;
  dealId?: string | null;
  dealLabel?: string;
  results?: PipelineResults;
};

export const DEFAULT_PIPELINE_PLATFORM = "TikTok";

let idCounter = 0;
export function newPipelineItemId(): string {
  idCounter += 1;
  return `p-${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function createPipelineItem(title: string, status: PipelineStatus = "scripting"): PipelineItem {
  return {
    id: newPipelineItemId(),
    title: title.trim(),
    status,
    topic: "",
    format: "",
    platform: DEFAULT_PIPELINE_PLATFORM,
  };
}

/** A posted item Content DNA can read: posted, with a recorded
 * views number. (The demo's converter also demanded a posted
 * date; the conversion below supplies the day it is read when an
 * item somehow has none, so the test here is the brief's rule —
 * posted + views present.) */
export const hasResults = (item: PipelineItem): boolean =>
  item.status === "posted" &&
  !!item.results &&
  typeof item.results.views === "number" &&
  Number.isFinite(item.results.views);

export function countsByStatus(items: PipelineItem[]): Record<PipelineStatus, number> {
  const out: Record<PipelineStatus, number> = { scripting: 0, filming: 0, scheduled: 0, posted: 0 };
  items.forEach((i) => {
    out[i.status] += 1;
  });
  return out;
}

/* ---------- the DNA conversion (the demo's Vb) ---------- */

/** Posted-with-results items → DNA posts, field for field the
 * demo's own mapping. Likes/comments/shares the creator didn't
 * record read as 0 (the DNA post shape requires numbers);
 * saves/watch/clicks/sales stay null when unrecorded, exactly as
 * the demo leaves saves/watch/sales null — DNA treats null as
 * "metric unknown", never as zero. Untagged topic/format pass
 * through empty: DNA already counts and reports untagged posts
 * honestly rather than guessing. */
export function pipelineToDnaPosts(items: PipelineItem[], now: number = Date.now()): DnaPost[] {
  return items.filter(hasResults).map((item) => {
    const r = item.results as PipelineResults;
    const post: DnaPost = {
      id: `uv-${item.id}`,
      source: "app",
      title: item.title,
      hook: item.title,
      date: item.postedDate || new Date(now).toISOString().slice(0, 10),
      platform: item.platform || DEFAULT_PIPELINE_PLATFORM,
      topic: item.topic || "",
      format: item.format || "",
      length: item.lengthSec ?? null,
      views: r.views,
      likes: r.likes ?? 0,
      comments: r.comments ?? 0,
      shares: r.shares ?? 0,
      saves: r.saves ?? null,
      watch: r.watchSec ?? null,
      clicks: r.clicks ?? null,
      sales: r.sales ?? null,
    };
    if (item.hookStyle) post.hookStyle = item.hookStyle;
    return post;
  });
}

/** The DNA "Use my Ultra Vestra posts" source, as one pure
 * decision the Discover screen and the fixtures share: enabled
 * only when at least one posted item has results, with the count
 * and the converted posts. */
export function dnaSourceFromPipeline(items: PipelineItem[], now: number = Date.now()): {
  enabled: boolean;
  count: number;
  posts: DnaPost[];
} {
  const posts = pipelineToDnaPosts(items, now);
  return { enabled: posts.length >= 1, count: posts.length, posts };
}

/* ---------- the device-local store ---------- */

export type PipelineState = { v: 1; items: PipelineItem[] };

export const EMPTY_PIPELINE_STATE: PipelineState = { v: 1, items: [] };

const num = (t: unknown): number | undefined =>
  typeof t === "number" && Number.isFinite(t) ? t : undefined;

function sanitizeResults(raw: unknown): PipelineResults | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const views = num(r.views);
  if (views === undefined) return undefined;
  const out: PipelineResults = { views };
  const shares = num(r.shares);
  if (shares !== undefined) out.shares = shares;
  const saves = num(r.saves);
  if (saves !== undefined) out.saves = saves;
  const comments = num(r.comments);
  if (comments !== undefined) out.comments = comments;
  const likes = num(r.likes);
  if (likes !== undefined) out.likes = likes;
  const watchSec = num(r.watchSec);
  if (watchSec !== undefined) out.watchSec = watchSec;
  const clicks = num(r.clicks);
  if (clicks !== undefined) out.clicks = clicks;
  const sales = num(r.sales);
  if (sales !== undefined) out.sales = sales;
  return out;
}

function sanitizeItem(raw: unknown): PipelineItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id) return null;
  if (typeof r.title !== "string") return null;
  if (!isPipelineStatus(r.status)) return null;
  const item: PipelineItem = {
    id: r.id,
    title: r.title,
    status: r.status,
    topic: typeof r.topic === "string" ? r.topic : "",
    format: typeof r.format === "string" ? r.format : "",
    platform:
      typeof r.platform === "string" && r.platform ? r.platform : DEFAULT_PIPELINE_PLATFORM,
  };
  if (typeof r.hookStyle === "string" && r.hookStyle) item.hookStyle = r.hookStyle;
  const lengthSec = num(r.lengthSec);
  item.lengthSec = lengthSec !== undefined ? lengthSec : null;
  if (typeof r.postedDate === "string" && r.postedDate) item.postedDate = r.postedDate;
  if (typeof r.dealId === "string" && r.dealId) item.dealId = r.dealId;
  if (typeof r.dealLabel === "string" && r.dealLabel) item.dealLabel = r.dealLabel;
  const results = sanitizeResults(r.results);
  if (results) item.results = results;
  return item;
}

/** Parse whatever was stored into a clean state. Corrupt or
 * foreign data yields the empty state; malformed items are
 * dropped one by one, never fatal. */
export function parsePipelineState(raw: unknown): PipelineState {
  if (!raw || typeof raw !== "object") return { v: 1, items: [] };
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.items)) return { v: 1, items: [] };
  const items = r.items.map(sanitizeItem).filter((i): i is PipelineItem => i !== null);
  return { v: 1, items };
}

export function loadPipelineState(): PipelineState {
  try {
    const raw = localStorage.getItem(PIPELINE_STORAGE_KEY);
    if (!raw) return { v: 1, items: [] };
    return parsePipelineState(JSON.parse(raw));
  } catch {
    return { v: 1, items: [] };
  }
}

export function savePipelineState(state: PipelineState): void {
  try {
    localStorage.setItem(PIPELINE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — the board lives in this session */
  }
}
