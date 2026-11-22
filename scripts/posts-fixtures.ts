// ============================================================================
// Posting Tracker — acceptance fixtures for the pure consistency
// math (lib/posts/summary.ts).
//
// Fixed inputs assert exact counts: the streak rule (today empty
// doesn't break it, a full missed day does), multi-post days
// counting once toward the streak, month boundaries, Monday-first
// week buckets, goal capping, and the manual/verified split.
//
// Run (from the repo root):
//   npx tsx scripts/posts-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  computePostingSummary,
  currentStreak,
  goalProgress,
  postsInMonth,
  weekCounts,
  type PostLike,
} from "../lib/posts/summary";

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

const post = (posted_date: string, source: "manual" | "verified" = "manual"): PostLike => ({
  platform: "tiktok",
  posted_date,
  source,
});

// Wednesday 2026-11-18 12:00 UTC is "now" for the streak fixtures.
const NOW = new Date(Date.UTC(2026, 10, 18, 12, 0, 0));

// --- Streak: the exact rule ---------------------------------------------------

check("(a) streak counts back from today", currentStreak([post("2026-11-18"), post("2026-11-17"), post("2026-11-16")], NOW), 3);
check("(a) today empty does NOT break the streak", currentStreak([post("2026-11-17"), post("2026-11-16")], NOW), 2);
check("(a) a full missed day breaks it", currentStreak([post("2026-11-18"), post("2026-11-16")], NOW), 1);
check("(a) missed yesterday + today empty = 0", currentStreak([post("2026-11-16")], NOW), 0);
check("(a) no posts = 0", currentStreak([], NOW), 0);
check(
  "(a) multiple posts on one day count once",
  currentStreak([post("2026-11-18"), post("2026-11-18"), post("2026-11-18"), post("2026-11-17")], NOW),
  2
);
check(
  "(a) streak walks across a month boundary",
  currentStreak(
    [post("2026-11-18"), post("2026-11-17")],
    new Date(Date.UTC(2026, 10, 18, 12, 0, 0))
  ),
  2
);
check(
  "(a) streak walks across Oct 31 → Nov 1",
  currentStreak(
    [post("2026-11-01"), post("2026-10-31"), post("2026-10-30")],
    new Date(Date.UTC(2026, 10, 1, 9, 0, 0))
  ),
  3
);

// --- Month counts ---------------------------------------------------------------

const monthPosts: PostLike[] = [
  post("2026-11-01"),
  post("2026-11-30"),
  post("2026-10-31"),
  post("2026-12-01"),
  post("2025-11-15"),
];
check("(b) postsInMonth counts only the current calendar month", postsInMonth(monthPosts, NOW), 2);
check("(b) postsInMonth on the 1st counts that day", postsInMonth(monthPosts, new Date(Date.UTC(2026, 10, 1))), 2);

// --- Weeks (Monday-first) -------------------------------------------------------
// 2026-11-18 is a Wednesday; its week starts Monday 2026-11-16.

const weekPosts: PostLike[] = [
  post("2026-11-16"), // Monday, this week
  post("2026-11-22"), // Sunday, this week
  post("2026-11-15"), // Sunday, LAST week
  post("2026-11-09"), // Monday, last week
];
check(
  "(c) weekCounts buckets Monday–Sunday, current week last",
  weekCounts(weekPosts, NOW, 2),
  [
    { weekStart: "2026-11-09", count: 2 },
    { weekStart: "2026-11-16", count: 2 },
  ]
);
check(
  "(c) quiet weeks appear as zeros",
  weekCounts([], NOW, 3).map((w) => w.count),
  [0, 0, 0]
);

// --- Goal progress ----------------------------------------------------------------

check("(d) goal progress is an exact floor percentage", goalProgress(3, 5), { count: 3, goal: 5, pct: 60 });
check("(d) goal progress caps at 100", goalProgress(12, 5), { count: 12, goal: 5, pct: 100 });
check("(d) zero goal is treated as 1 (no divide-by-zero)", goalProgress(0, 0), { count: 0, goal: 1, pct: 0 });

// --- Full summary: the source split is never hidden --------------------------------

const mixed: PostLike[] = [
  post("2026-11-18", "manual"),
  post("2026-11-18", "verified"),
  post("2026-11-17", "manual"),
  post("2026-10-05", "manual"),
];
const summary = computePostingSummary(mixed, 5, NOW);
check("(e) summary total", summary.totalPosts, 4);
check("(e) summary manual total", summary.totalManual, 3);
check("(e) summary verified total", summary.totalVerified, 1);
check("(e) summary this-month count", summary.postsThisMonth, 3);
check("(e) summary this-month manual", summary.postsThisMonthManual, 2);
check("(e) summary this-month verified", summary.postsThisMonthVerified, 1);
check("(e) summary streak (multi-post day counts once)", summary.currentStreak, 2);
check("(e) summary active days", summary.activeDays, 3);
check("(e) summary week count + goal", [summary.postsThisWeek, summary.weeklyGoal, summary.goalProgressPct], [3, 5, 60]);

check(
  "(e) empty summary is true zeros",
  computePostingSummary([], 5, NOW),
  {
    postsThisMonth: 0,
    postsThisMonthManual: 0,
    postsThisMonthVerified: 0,
    currentStreak: 0,
    postsThisWeek: 0,
    weeklyGoal: 5,
    goalProgressPct: 0,
    activeDays: 0,
    totalPosts: 0,
    totalManual: 0,
    totalVerified: 0,
  }
);

console.log(failures === 0 ? "\nALL ASSERTIONS PASSED" : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
