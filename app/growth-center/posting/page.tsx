"use client";

import { useEffect, useMemo, useState } from "react";

// Posting Tracker — the creator's posting calendar.
//
// HONESTY RULE (binding): every post shown here is a row the
// creator logged (public.creator_posts), and every row shows its
// source. In Phase 1 all rows are 'manual' — logged by the
// creator — and the page says so plainly, in the legend and in the
// note below. Platform-verified posts arrive only when a real
// platform connection syncs them; nothing here pretends otherwise.
// All counts come from the summary /api/posts computes over the
// stored rows (lib/posts/summary.ts) — the calendar renders marks
// from the same rows, never its own math.

type Post = {
  id: string;
  platform: string;
  posted_date: string;
  source: "manual" | "verified";
  external_url: string | null;
  title: string | null;
  note: string | null;
  created_at: string;
};

type PostingSummary = {
  postsThisMonth: number;
  postsThisMonthManual: number;
  postsThisMonthVerified: number;
  currentStreak: number;
  postsThisWeek: number;
  weeklyGoal: number;
  goalProgressPct: number;
  activeDays: number;
  totalPosts: number;
  totalManual: number;
  totalVerified: number;
};

const PLATFORM_OPTIONS: { value: string; label: string; mark: string }[] = [
  { value: "tiktok", label: "TikTok", mark: "TT" },
  { value: "instagram", label: "Instagram", mark: "IG" },
  { value: "facebook", label: "Facebook / Meta", mark: "FB" },
  { value: "trybe", label: "Trybe", mark: "TB" },
  { value: "other", label: "Other", mark: "••" },
];

const PLATFORM_LABEL = new Map(PLATFORM_OPTIONS.map((p) => [p.value, p.label]));
const PLATFORM_MARK = new Map(PLATFORM_OPTIONS.map((p) => [p.value, p.mark]));

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const inputClass =
  "mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' → 'November 3, 2026', by string parts. */
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

export default function PostingTrackerPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [summary, setSummary] = useState<PostingSummary | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewMonth, setViewMonth] = useState(() => todayKey().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(() => todayKey());

  const [formDate, setFormDate] = useState(() => todayKey());
  const [formPlatform, setFormPlatform] = useState("tiktok");
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [goalInput, setGoalInput] = useState("5");
  const [goalBusy, setGoalBusy] = useState(false);

  async function load() {
    try {
      const response = await fetch("/api/posts");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your posts could not be loaded.");
      }
      setPosts(data.posts ?? []);
      setSummary(data.summary ?? null);
      setWeeklyGoal(data.weeklyGoal ?? 5);
      setGoalInput(String(data.weeklyGoal ?? 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your posts could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const postsByDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const post of posts) {
      const list = map.get(post.posted_date) ?? [];
      list.push(post);
      map.set(post.posted_date, list);
    }
    return map;
  }, [posts]);

  const calendarCells = useMemo(() => {
    const [year, month] = viewMonth.split("-").map(Number);
    const first = new Date(Date.UTC(year, month - 1, 1));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const leading = (first.getUTCDay() + 6) % 7; // Monday-first
    const cells: ({ key: string; day: number } | null)[] = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${viewMonth}-${String(day).padStart(2, "0")}`;
      cells.push({ key, day });
    }
    return cells;
  }, [viewMonth]);

  function shiftMonth(delta: number) {
    const [year, month] = viewMonth.split("-").map(Number);
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    setViewMonth(key);
  }

  const selectedPosts = postsByDate.get(selectedDate) ?? [];

  async function addPost() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: formPlatform,
          postedDate: formDate,
          title: formTitle.trim(),
          externalUrl: formUrl.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your post could not be saved.");
      }
      setFormTitle("");
      setFormUrl("");
      setSelectedDate(formDate);
      setViewMonth(formDate.slice(0, 7));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your post could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(id: string) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/posts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your post could not be deleted.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your post could not be deleted.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveGoal() {
    const goal = Number(goalInput);
    if (!Number.isInteger(goal) || goal < 1 || goal > 50) {
      setError("Weekly goal must be a whole number from 1 to 50.");
      return;
    }
    setGoalBusy(true);
    setError("");
    try {
      const response = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyGoal: goal }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your goal could not be saved.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your goal could not be saved.");
    } finally {
      setGoalBusy(false);
    }
  }

  const [viewYear, viewMonthNum] = viewMonth.split("-").map(Number);

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / CREATOR GROWTH CENTER / POSTING TRACKER
        </div>

        <div className="mb-10">
          <div className="text-cyan-400 text-sm mb-3">AM I CONSISTENT?</div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">
            POSTING
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500">
              TRACKER.
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Log every post, see your streak, and hold your weekly goal.
            Your consistency, counted from your own log.
          </p>
        </div>

        <div className="rounded-3xl border border-amber-400/30 bg-amber-500/[.05] p-6 mb-10">
          <div className="text-amber-300 text-xs tracking-widest mb-2">
            READ THIS FIRST — WHAT "LOGGED BY YOU" MEANS
          </div>
          <p className="text-sm text-gray-300 leading-6">
            Every entry in Phase 1 is a post <strong className="text-gray-100">you
            logged by hand</strong>, labeled "Logged by you". UltraVestra has
            not confirmed these posts with any platform yet. When your TikTok
            and Meta connections go live, platform-verified posts will appear
            with a "Verified" label — the two are never merged into one
            unlabeled count.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm mb-6">
            {error}
          </p>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="text-4xl animate-pulse mb-4">◈</div>
            <h3 className="text-xl font-bold">Loading your posting log</h3>
            <p className="text-gray-400 mt-2">Gathering your posts...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-white/[.04] border border-white/10 p-5">
                  <div className="text-3xl font-bold text-fuchsia-300">
                    {summary.currentStreak} days
                  </div>
                  <div className="text-gray-400 text-sm mt-2">Current streak</div>
                </div>
                <div className="rounded-2xl bg-white/[.04] border border-white/10 p-5">
                  <div className="text-3xl font-bold text-cyan-400">
                    {summary.postsThisWeek} / {summary.weeklyGoal}
                  </div>
                  <div className="text-gray-400 text-sm mt-2">
                    Posts this week vs goal ({summary.goalProgressPct}%)
                  </div>
                </div>
                <div className="rounded-2xl bg-white/[.04] border border-white/10 p-5">
                  <div className="text-3xl font-bold text-cyan-400">
                    {summary.postsThisMonth}
                  </div>
                  <div className="text-gray-400 text-sm mt-2">
                    Posts this month — {summary.postsThisMonthManual} logged by
                    you · {summary.postsThisMonthVerified} verified
                  </div>
                </div>
                <div className="rounded-2xl bg-white/[.04] border border-white/10 p-5">
                  <div className="text-3xl font-bold text-cyan-400">
                    {summary.activeDays}
                  </div>
                  <div className="text-gray-400 text-sm mt-2">
                    Active posting days, all time ({summary.totalPosts} posts)
                  </div>
                </div>
              </div>
            )}

            <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-2xl font-bold">
                  {MONTH_NAMES[viewMonthNum - 1]} {viewYear}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => shiftMonth(-1)}
                    className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5 transition"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => shiftMonth(1)}
                    className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5 transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] tracking-widest text-gray-500 mb-1.5">
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarCells.map((cell, i) =>
                  cell === null ? (
                    <div key={`blank-${i}`} />
                  ) : (
                    <button
                      key={cell.key}
                      onClick={() => setSelectedDate(cell.key)}
                      className={`rounded-xl border p-2 min-h-[64px] text-left transition ${
                        cell.key === selectedDate
                          ? "border-fuchsia-400/60 bg-fuchsia-500/10"
                          : cell.key === todayKey()
                            ? "border-cyan-400/40 bg-white/[.03]"
                            : "border-white/10 bg-white/[.02] hover:bg-white/[.05]"
                      }`}
                    >
                      <div className="text-sm font-bold">{cell.day}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(postsByDate.get(cell.key) ?? []).map((post) => (
                          <span
                            key={post.id}
                            title={`${PLATFORM_LABEL.get(post.platform)} — ${post.source === "manual" ? "Logged by you" : "Verified"}`}
                            className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${
                              post.source === "verified"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-white/10 text-gray-300"
                            }`}
                          >
                            {PLATFORM_MARK.get(post.platform)}
                          </span>
                        ))}
                      </div>
                    </button>
                  )
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-5 text-xs text-gray-400">
                <span>
                  <span className="inline-block rounded bg-white/10 text-gray-300 px-1.5 py-0.5 font-bold mr-1">TT</span>
                  Logged by you
                </span>
                <span>
                  <span className="inline-block rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 font-bold mr-1">TT</span>
                  Platform-verified (arrives with live connections)
                </span>
                <span>TT TikTok · IG Instagram · FB Facebook / Meta · TB Trybe</span>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="font-bold mb-3">{formatDate(selectedDate)}</div>
                {selectedPosts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No posts logged this day.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.02] px-5 py-4"
                      >
                        <div>
                          <div className="font-bold">
                            {PLATFORM_LABEL.get(post.platform)}
                            {post.title ? ` — ${post.title}` : ""}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            {post.source === "manual"
                              ? "Logged by you"
                              : "Platform-verified"}
                            {post.external_url ? (
                              <>
                                {" · "}
                                <a
                                  href={post.external_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-cyan-300 underline"
                                >
                                  View post
                                </a>
                              </>
                            ) : null}
                          </div>
                        </div>
                        <button
                          onClick={() => deletePost(post.id)}
                          disabled={busyId === post.id}
                          className="rounded-lg border border-red-400/40 text-red-300 px-4 py-2 text-sm hover:bg-red-400/10 disabled:opacity-40 transition"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
                <div className="text-cyan-400 text-xs tracking-widest mb-3">LOG A POST</div>
                <h2 className="text-2xl font-bold mb-5">Add a post you published</h2>
                <label className="text-sm text-gray-300 block">
                  Date
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300 block mt-4">
                  Platform
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className={inputClass}
                  >
                    {PLATFORM_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-300 block mt-4">
                  Title (optional)
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    maxLength={200}
                    placeholder="Example: Morning routine haul"
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300 block mt-4">
                  Post link (optional)
                  <input
                    type="text"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    maxLength={1000}
                    placeholder="https://…"
                    className={inputClass}
                  />
                </label>
                <button
                  onClick={addPost}
                  disabled={saving || formDate === ""}
                  className="mt-6 w-full rounded-xl p-4 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
                >
                  {saving ? "Saving..." : "Log post"}
                </button>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
                <div className="text-cyan-400 text-xs tracking-widest mb-3">WEEKLY GOAL</div>
                <h2 className="text-2xl font-bold mb-2">Your weekly posting goal</h2>
                <p className="text-gray-400 text-sm mb-5">
                  Currently {weeklyGoal} posts per week. Your progress bar and
                  the Growth Center read this goal.
                </p>
                <label className="text-sm text-gray-300 block">
                  Posts per week (1–50)
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <button
                  onClick={saveGoal}
                  disabled={goalBusy}
                  className="mt-6 w-full rounded-xl p-4 font-bold text-black bg-fuchsia-400 hover:bg-fuchsia-300 disabled:opacity-40 transition"
                >
                  {goalBusy ? "Saving..." : "Save goal"}
                </button>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
