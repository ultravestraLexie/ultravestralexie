// Posting Tracker — the consistency math, pure and isolated.
//
// HONESTY RULE (binding): every figure here is an exact count over
// the creator's own stored post rows (public.creator_posts). Each
// row carries its source — 'manual' (logged by the creator) or
// 'verified' (confirmed by a platform sync) — and the counts below
// never hide that distinction: the summary reports manual and
// verified counts separately wherever it reports a total, so a
// reader can always tell how much of a number is self-logged.
//
// DATES: a post's day is its posted_date ('YYYY-MM-DD'), a plain
// calendar date the creator picked — no timezone conversion is ever
// applied to it. "Today" is derived from `now`'s UTC fields, the
// same convention as lib/revenue/summary.ts, so results never
// depend on the server's local timezone.
//
// This module has no imports and no I/O on purpose: the API route
// feeds it the caller's rows, and the math is exercised in
// isolation by scripts/posts-fixtures.ts.

export type PostPlatform =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "trybe"
  | "other";

export type PostSource = "manual" | "verified";

export type PostLike = {
  platform: string;
  /** 'YYYY-MM-DD' */
  posted_date: string;
  source: PostSource;
};

export type PostingSummary = {
  /** Posts in the calendar month containing `now`. */
  postsThisMonth: number;
  postsThisMonthManual: number;
  postsThisMonthVerified: number;
  /** Consecutive days with at least one post, counting back from
   *  today (see currentStreak for the exact rule). */
  currentStreak: number;
  /** Posts in the current calendar week (Monday–Sunday). */
  postsThisWeek: number;
  /** The weekly goal the creator set (growth_prefs). */
  weeklyGoal: number;
  /** Posts this week as a percentage of the goal, capped at 100. */
  goalProgressPct: number;
  /** Distinct days with at least one post, all time. */
  activeDays: number;
  totalPosts: number;
  totalManual: number;
  totalVerified: number;
};

/** 'YYYY-MM-DD' for a Date's UTC fields. */
function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Shift a 'YYYY-MM-DD' key by whole days (UTC arithmetic). */
function shiftKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(Date.UTC(y, m - 1, d + days)));
}

/** The Monday ('YYYY-MM-DD') of the calendar week containing the
 *  given key. Weeks run Monday–Sunday. */
function mondayOf(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  const sinceMonday = (dow + 6) % 7; // Monday → 0, Sunday → 6
  return shiftKey(key, -sinceMonday);
}

/** Posts whose posted_date falls in the calendar month containing
 *  `now`. */
export function postsInMonth(posts: PostLike[], now: Date = new Date()): number {
  const prefix = dateKey(now).slice(0, 7);
  return posts.filter((p) => p.posted_date.startsWith(prefix)).length;
}

/**
 * The current posting streak, in days.
 *
 * RULE: count consecutive days with at least one post, walking
 * backwards from today. Multiple posts on one day still count as
 * one day. If today has no post yet, the streak is NOT broken —
 * the day isn't over — so the walk starts at yesterday instead;
 * a streak only dies when a full day passes with no post.
 */
export function currentStreak(
  posts: PostLike[],
  now: Date = new Date()
): number {
  const days = new Set(posts.map((p) => p.posted_date));
  let cursor = dateKey(now);
  if (!days.has(cursor)) cursor = shiftKey(cursor, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftKey(cursor, -1);
  }
  return streak;
}

/** Post counts for the last `weeks` calendar weeks (Monday–Sunday),
 *  oldest → newest, the current week last. Weeks with no posts
 *  appear as zeros — the trend never hides a quiet week. */
export function weekCounts(
  posts: PostLike[],
  now: Date = new Date(),
  weeks = 6
): { weekStart: string; count: number }[] {
  const currentMonday = mondayOf(dateKey(now));
  const result: { weekStart: string; count: number }[] = [];
  for (let offset = weeks - 1; offset >= 0; offset--) {
    const start = shiftKey(currentMonday, -7 * offset);
    const end = shiftKey(start, 7);
    const count = posts.filter(
      (p) => p.posted_date >= start && p.posted_date < end
    ).length;
    result.push({ weekStart: start, count });
  }
  return result;
}

/** This week's progress toward the weekly goal. The percentage is
 *  capped at 100 — posting double the goal is celebrated in the
 *  count, not in a 200% bar. */
export function goalProgress(
  postsThisWeekCount: number,
  weeklyGoal: number
): { count: number; goal: number; pct: number } {
  const goal = Math.max(1, weeklyGoal);
  return {
    count: postsThisWeekCount,
    goal,
    pct: Math.min(100, Math.floor((postsThisWeekCount / goal) * 100)),
  };
}

/** The full posting summary the Growth Center and the Posting
 *  Tracker render. Same rows in → same summary out, always. */
export function computePostingSummary(
  posts: PostLike[],
  weeklyGoal: number,
  now: Date = new Date()
): PostingSummary {
  const thisMonth = postsInMonth(posts, now);
  const monthPrefix = dateKey(now).slice(0, 7);
  const monthPosts = posts.filter((p) =>
    p.posted_date.startsWith(monthPrefix)
  );
  const thisWeek = weekCounts(posts, now, 1)[0].count;
  const progress = goalProgress(thisWeek, weeklyGoal);

  return {
    postsThisMonth: thisMonth,
    postsThisMonthManual: monthPosts.filter((p) => p.source === "manual")
      .length,
    postsThisMonthVerified: monthPosts.filter((p) => p.source === "verified")
      .length,
    currentStreak: currentStreak(posts, now),
    postsThisWeek: thisWeek,
    weeklyGoal: progress.goal,
    goalProgressPct: progress.pct,
    activeDays: new Set(posts.map((p) => p.posted_date)).size,
    totalPosts: posts.length,
    totalManual: posts.filter((p) => p.source === "manual").length,
    totalVerified: posts.filter((p) => p.source === "verified").length,
  };
}
