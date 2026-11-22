"use client";

import { useEffect, useMemo, useState } from "react";

// Content Planner — the creator's own content schedule, sitting
// next to (never inside) their record of what actually published.
//
// HONESTY RULES (binding):
// - A planned item is a plan, not a post. Planned and draft rows
//   are drawn as outlines, labeled "Planned" / "Draft", and they
//   NEVER count toward the streak, totals, or goal figures — the
//   summary /api/posts returns is computed over published rows
//   only (lib/posts/summary.ts), and this page renders the plan
//   from the same rows with its state attached, never merged.
// - Marking a planned item "published" is the creator's own act:
//   the row stays source='manual' ("Logged by you"), because no
//   platform has confirmed anything.
// - Ideas are raw material. An idea becomes a planned post only
//   when the creator explicitly converts it here.
// - Everything on this page is the creator's own schedule and
//   words. Nothing here comes from a platform.

type PostState = "published" | "planned" | "draft";

type Post = {
  id: string;
  platform: string;
  posted_date: string;
  source: "manual" | "verified";
  state: PostState;
  external_url: string | null;
  title: string | null;
  caption: string | null;
  note: string | null;
  created_at: string;
};

type Idea = {
  id: string;
  title: string;
  concept: string;
  caption_draft: string;
  platform: string | null;
  created_at: string;
  updated_at: string;
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

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

function markClass(post: Post): string {
  if (post.state === "planned")
    return "border border-cyan-300/70 text-cyan-200 bg-transparent";
  if (post.state === "draft")
    return "border border-dashed border-white/30 text-gray-400 bg-transparent";
  return post.source === "verified"
    ? "bg-emerald-500/20 text-emerald-300"
    : "bg-white/10 text-gray-300";
}

function stateBadge(post: Post): string {
  if (post.state === "planned") return "Planned";
  if (post.state === "draft") return "Draft";
  return post.source === "manual" ? "Published — logged by you" : "Published — verified";
}

export default function ContentPlannerPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewMonth, setViewMonth] = useState(() => todayKey().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(() => todayKey());
  const [busyId, setBusyId] = useState<string | null>(null);

  // Add-item form
  const [formTitle, setFormTitle] = useState("");
  const [formPlatform, setFormPlatform] = useState("tiktok");
  const [formDate, setFormDate] = useState(() => todayKey());
  const [formState, setFormState] = useState<PostState>("planned");
  const [formCaption, setFormCaption] = useState("");
  const [formNote, setFormNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Idea form
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaPlatform, setIdeaPlatform] = useState("");
  const [ideaConcept, setIdeaConcept] = useState("");
  const [ideaCaption, setIdeaCaption] = useState("");
  const [ideaSaving, setIdeaSaving] = useState(false);
  const [convertDates, setConvertDates] = useState<Record<string, string>>({});

  async function load() {
    try {
      const [postsRes, ideasRes] = await Promise.all([
        fetch("/api/posts"),
        fetch("/api/ideas"),
      ]);
      const postsData = await postsRes.json();
      const ideasData = await ideasRes.json();
      if (!postsRes.ok) {
        throw new Error(postsData.error || "Your planner could not be loaded.");
      }
      if (!ideasRes.ok) {
        throw new Error(ideasData.error || "Your ideas could not be loaded.");
      }
      setPosts(postsData.posts ?? []);
      setIdeas(ideasData.ideas ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your planner could not be loaded.");
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

  const drafts = useMemo(
    () => posts.filter((p) => p.state === "draft"),
    [posts]
  );

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

  async function addItem() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: formPlatform,
          postedDate: formDate,
          state: formState,
          title: formTitle.trim(),
          caption: formCaption.trim(),
          note: formNote.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your item could not be saved.");
      }
      setFormTitle("");
      setFormCaption("");
      setFormNote("");
      setSelectedDate(formDate);
      setViewMonth(formDate.slice(0, 7));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your item could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function setPostState(id: string, state: PostState) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, state }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your item could not be updated.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your item could not be updated.");
    } finally {
      setBusyId(null);
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
        throw new Error(data.error || "Your item could not be deleted.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your item could not be deleted.");
    } finally {
      setBusyId(null);
    }
  }

  async function addIdea() {
    setIdeaSaving(true);
    setError("");
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ideaTitle.trim(),
          concept: ideaConcept.trim(),
          captionDraft: ideaCaption.trim(),
          platform: ideaPlatform === "" ? null : ideaPlatform,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your idea could not be saved.");
      }
      setIdeaTitle("");
      setIdeaConcept("");
      setIdeaCaption("");
      setIdeaPlatform("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your idea could not be saved.");
    } finally {
      setIdeaSaving(false);
    }
  }

  async function deleteIdea(id: string) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/ideas?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your idea could not be deleted.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your idea could not be deleted.");
    } finally {
      setBusyId(null);
    }
  }

  async function convertIdea(idea: Idea) {
    const date = convertDates[idea.id] || todayKey();
    setBusyId(idea.id);
    setError("");
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: idea.platform ?? "other",
          postedDate: date,
          state: "planned",
          title: idea.title,
          caption: idea.caption_draft,
          note: "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "The idea could not be planned.");
      }
      setSelectedDate(date);
      setViewMonth(date.slice(0, 7));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The idea could not be planned.");
    } finally {
      setBusyId(null);
    }
  }

  const [viewYear, viewMonthNum] = viewMonth.split("-").map(Number);

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / CREATOR GROWTH CENTER / CONTENT PLANNER
        </div>

        <div className="mb-10">
          <div className="text-cyan-400 text-sm mb-3">WHAT AM I MAKING NEXT?</div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">
            CONTENT
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500">
              PLANNER.
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Plan what you will post, keep your ideas in one place, and
            mark things published when they actually go out.
          </p>
        </div>

        <div className="rounded-3xl border border-amber-400/30 bg-amber-500/[.05] p-6 mb-10">
          <div className="text-amber-300 text-xs tracking-widest mb-2">
            READ THIS FIRST — A PLAN IS NOT A POST
          </div>
          <p className="text-sm text-gray-300 leading-6">
            This calendar holds <strong className="text-gray-100">your own
            schedule</strong>. Planned and draft items are drawn as outlines
            and labeled — they never count toward your streak, your totals,
            or your goals. An item starts counting only when you mark it
            published, and even then it is labeled "Logged by you": no
            platform has confirmed it. Nothing on this page comes from
            TikTok, Meta, or any other platform.
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
            <h3 className="text-xl font-bold">Loading your planner</h3>
            <p className="text-gray-400 mt-2">Gathering your plans and ideas...</p>
          </div>
        ) : (
          <div className="space-y-10">
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
                            title={`${PLATFORM_LABEL.get(post.platform)} — ${stateBadge(post)}`}
                            className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${markClass(post)}`}
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
                  Published — logged by you
                </span>
                <span>
                  <span className="inline-block rounded border border-cyan-300/70 text-cyan-200 px-1.5 py-0.5 font-bold mr-1">TT</span>
                  Planned — your schedule, not yet posted
                </span>
                <span>
                  <span className="inline-block rounded border border-dashed border-white/30 text-gray-400 px-1.5 py-0.5 font-bold mr-1">TT</span>
                  Draft — in progress
                </span>
                <span>TT TikTok · IG Instagram · FB Facebook / Meta · TB Trybe</span>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="font-bold mb-3">{formatDate(selectedDate)}</div>
                {selectedPosts.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nothing published or planned this day.</p>
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
                            {stateBadge(post)}
                            {post.caption ? ` · Caption draft saved` : ""}
                          </div>
                          {post.note ? (
                            <div className="text-gray-400 text-sm mt-1">{post.note}</div>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          {post.state !== "published" && (
                            <button
                              onClick={() => setPostState(post.id, "published")}
                              disabled={busyId === post.id}
                              className="rounded-lg border border-emerald-400/40 text-emerald-300 px-4 py-2 text-sm hover:bg-emerald-400/10 disabled:opacity-40 transition"
                            >
                              Mark published
                            </button>
                          )}
                          {post.state === "draft" && (
                            <button
                              onClick={() => setPostState(post.id, "planned")}
                              disabled={busyId === post.id}
                              className="rounded-lg border border-cyan-300/40 text-cyan-200 px-4 py-2 text-sm hover:bg-cyan-300/10 disabled:opacity-40 transition"
                            >
                              Plan it
                            </button>
                          )}
                          <button
                            onClick={() => deletePost(post.id)}
                            disabled={busyId === post.id}
                            className="rounded-lg border border-red-400/40 text-red-300 px-4 py-2 text-sm hover:bg-red-400/10 disabled:opacity-40 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
                <div className="text-cyan-400 text-xs tracking-widest mb-3">ADD TO THE PLAN</div>
                <h2 className="text-2xl font-bold mb-5">Plan a piece of content</h2>
                <label className="text-sm text-gray-300 block">
                  Title
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
                  Date
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300 block mt-4">
                  State
                  <select
                    value={formState}
                    onChange={(e) => setFormState(e.target.value as PostState)}
                    className={inputClass}
                  >
                    <option value="planned">Plan it</option>
                    <option value="draft">Draft</option>
                    <option value="published">Already posted</option>
                  </select>
                </label>
                <label className="text-sm text-gray-300 block mt-4">
                  Caption draft (optional)
                  <textarea
                    value={formCaption}
                    onChange={(e) => setFormCaption(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="The caption you plan to post with it"
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300 block mt-4">
                  Note (optional)
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    maxLength={500}
                    className={inputClass}
                  />
                </label>
                <button
                  onClick={addItem}
                  disabled={saving || formDate === ""}
                  className="mt-6 w-full rounded-xl p-4 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
                >
                  {saving ? "Saving..." : "Add to planner"}
                </button>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
                <div className="text-cyan-400 text-xs tracking-widest mb-3">DRAFTS</div>
                <h2 className="text-2xl font-bold mb-5">Drafts in progress</h2>
                {drafts.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No drafts. Add an item above with state "Draft" and it
                    will wait for you here — drafts never count as posts.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {drafts.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-2xl border border-dashed border-white/20 bg-white/[.02] px-5 py-4"
                      >
                        <div className="font-bold">
                          {PLATFORM_LABEL.get(post.platform)}
                          {post.title ? ` — ${post.title}` : ""}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          Draft · {formatDate(post.posted_date)}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => setPostState(post.id, "planned")}
                            disabled={busyId === post.id}
                            className="rounded-lg border border-cyan-300/40 text-cyan-200 px-4 py-2 text-sm hover:bg-cyan-300/10 disabled:opacity-40 transition"
                          >
                            Plan it
                          </button>
                          <button
                            onClick={() => setPostState(post.id, "published")}
                            disabled={busyId === post.id}
                            className="rounded-lg border border-emerald-400/40 text-emerald-300 px-4 py-2 text-sm hover:bg-emerald-400/10 disabled:opacity-40 transition"
                          >
                            Mark published
                          </button>
                          <button
                            onClick={() => deletePost(post.id)}
                            disabled={busyId === post.id}
                            className="rounded-lg border border-red-400/40 text-red-300 px-4 py-2 text-sm hover:bg-red-400/10 disabled:opacity-40 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-gray-500 text-sm mt-6">
                  Your published record lives in the{" "}
                  <a href="/growth-center/posting" className="text-cyan-300 underline">
                    Posting Tracker
                  </a>
                  .
                </p>
              </section>
            </div>

            <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
              <div className="text-cyan-400 text-xs tracking-widest mb-3">IDEAS</div>
              <h2 className="text-2xl font-bold mb-2">Your idea bank</h2>
              <p className="text-gray-400 text-sm mb-6">
                Ideas are raw material — not posts, not plans. Turn one
                into a planned post only when you mean it.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-300 block">
                    Idea title
                    <input
                      type="text"
                      value={ideaTitle}
                      onChange={(e) => setIdeaTitle(e.target.value)}
                      maxLength={200}
                      placeholder="Example: What $20 at the thrift store gets you"
                      className={inputClass}
                    />
                  </label>
                  <label className="text-sm text-gray-300 block mt-4">
                    Platform (optional)
                    <select
                      value={ideaPlatform}
                      onChange={(e) => setIdeaPlatform(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">No platform yet</option>
                      {PLATFORM_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-gray-300 block mt-4">
                    Concept (optional)
                    <textarea
                      value={ideaConcept}
                      onChange={(e) => setIdeaConcept(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      className={inputClass}
                    />
                  </label>
                  <label className="text-sm text-gray-300 block mt-4">
                    Caption draft (optional)
                    <textarea
                      value={ideaCaption}
                      onChange={(e) => setIdeaCaption(e.target.value)}
                      maxLength={2000}
                      rows={2}
                      className={inputClass}
                    />
                  </label>
                  <button
                    onClick={addIdea}
                    disabled={ideaSaving || ideaTitle.trim() === ""}
                    className="mt-6 w-full rounded-xl p-4 font-bold text-black bg-fuchsia-400 hover:bg-fuchsia-300 disabled:opacity-40 transition"
                  >
                    {ideaSaving ? "Saving..." : "Save idea"}
                  </button>
                </div>

                <div className="space-y-3">
                  {ideas.length === 0 ? (
                    <p className="text-gray-500 text-sm">No ideas saved yet.</p>
                  ) : (
                    ideas.map((idea) => (
                      <div
                        key={idea.id}
                        className="rounded-2xl border border-white/10 bg-white/[.02] px-5 py-4"
                      >
                        <div className="font-bold">{idea.title}</div>
                        <div className="text-gray-500 text-xs mt-1">
                          {idea.platform
                            ? PLATFORM_LABEL.get(idea.platform)
                            : "No platform yet"}
                        </div>
                        {idea.concept ? (
                          <p className="text-gray-300 text-sm mt-2">{idea.concept}</p>
                        ) : null}
                        {idea.caption_draft ? (
                          <p className="text-gray-500 text-sm mt-1 italic">
                            “{idea.caption_draft}”
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-end gap-2 mt-3">
                          <label className="text-xs text-gray-400">
                            Plan for
                            <input
                              type="date"
                              value={convertDates[idea.id] ?? todayKey()}
                              onChange={(e) =>
                                setConvertDates((prev) => ({
                                  ...prev,
                                  [idea.id]: e.target.value,
                                }))
                              }
                              className="ml-2 bg-[#080b14] border border-white/10 rounded-lg px-3 py-2 text-white"
                            />
                          </label>
                          <button
                            onClick={() => convertIdea(idea)}
                            disabled={busyId === idea.id}
                            className="rounded-lg border border-cyan-300/40 text-cyan-200 px-4 py-2 text-sm hover:bg-cyan-300/10 disabled:opacity-40 transition"
                          >
                            Turn into planned post
                          </button>
                          <button
                            onClick={() => deleteIdea(idea.id)}
                            disabled={busyId === idea.id}
                            className="rounded-lg border border-red-400/40 text-red-300 px-4 py-2 text-sm hover:bg-red-400/10 disabled:opacity-40 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
