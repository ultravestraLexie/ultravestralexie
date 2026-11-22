"use client";

import { useEffect, useMemo, useState } from "react";
import {
  repurpose,
  toPlainText,
  REPURPOSE_FORMATS,
  type RepurposeFormat,
} from "@/lib/repurpose/transform";

// Content Repurposing Studio — one piece of your content, reshaped
// for every platform you post on.
//
// HONESTY RULES (binding):
// - The reshape (lib/repurpose/transform.ts) only splits and
//   rearranges the creator's OWN words. It never writes a new
//   claim, statistic, or selling point; slots the source does not
//   fill appear as clearly labeled [placeholders] for the creator
//   to write themselves.
// - Sources are the creator's own records: a post from the
//   Posting Tracker / Planner, an idea from their Ideas, or text
//   they paste here. Picking a source only PREFILLS the fields —
//   the creator edits before anything is saved.
// - Saving goes through the existing APIs: "Save as idea" creates
//   an idea (/api/ideas); "Add to planner" creates a PLANNED post
//   (/api/posts, state='planned') — a plan, never a published
//   post, and never counted as one.

type Post = {
  id: string;
  platform: string;
  posted_date: string;
  state: "published" | "planned" | "draft";
  title: string | null;
  caption: string | null;
};

type Idea = {
  id: string;
  title: string;
  concept: string;
  caption_draft: string;
  platform: string | null;
};

const PLATFORM_OPTIONS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook / Meta" },
  { value: "trybe", label: "Trybe" },
  { value: "other", label: "Other" },
];

const inputClass =
  "mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white";
const labelClass = "text-sm text-gray-400";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function RepurposePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loadError, setLoadError] = useState("");

  const [sourceKind, setSourceKind] = useState<"post" | "idea" | "paste">("paste");
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [caption, setCaption] = useState("");
  const [format, setFormat] = useState<RepurposeFormat>("tiktok");

  const [planPlatform, setPlanPlatform] = useState("tiktok");
  const [planDate, setPlanDate] = useState(todayKey());
  const [saveState, setSaveState] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [postsRes, ideasRes] = await Promise.all([
          fetch("/api/posts"),
          fetch("/api/ideas"),
        ]);
        const postsData = await postsRes.json();
        const ideasData = await ideasRes.json();
        if (!postsRes.ok) throw new Error(postsData.error || "Your posts could not be loaded.");
        if (!ideasRes.ok) throw new Error(ideasData.error || "Your ideas could not be loaded.");
        setPosts(postsData.posts ?? []);
        setIdeas(ideasData.ideas ?? []);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Your records could not be loaded.");
      }
    })();
  }, []);

  const output = useMemo(
    () => repurpose({ title, script, caption }, format),
    [title, script, caption, format]
  );
  const plainText = useMemo(() => toPlainText(output), [output]);
  const tooLongForSave = plainText.length > 2000;

  function pickPost(id: string) {
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    setSourceKind("post");
    setTitle(post.title ?? "");
    // A post row stores a title and a caption — it does not store
    // the script that was spoken. The script field starts empty
    // rather than pretending the caption was the script.
    setScript("");
    setCaption(post.caption ?? "");
    setPlanPlatform(post.platform);
    setSaveState("");
  }

  function pickIdea(id: string) {
    const idea = ideas.find((i) => i.id === id);
    if (!idea) return;
    setSourceKind("idea");
    setTitle(idea.title);
    setScript(idea.concept);
    setCaption(idea.caption_draft);
    if (idea.platform) setPlanPlatform(idea.platform);
    setSaveState("");
  }

  async function copyText(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setCopied("");
      setSaveState("Copy failed — select the text and copy it manually.");
    }
  }

  async function saveAsIdea() {
    setSaveState("");
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: (title.trim() || `${output.formatLabel} version`).slice(0, 200),
          concept: plainText,
          captionDraft: "",
          platform: null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The idea could not be saved.");
      setSaveState(`Saved as an idea — find it in your Planner's Ideas.`);
    } catch (e) {
      setSaveState(e instanceof Error ? e.message : "The idea could not be saved.");
    }
  }

  async function addToPlanner() {
    setSaveState("");
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: planPlatform,
          postedDate: planDate,
          state: "planned",
          title: (title.trim() || `${output.formatLabel} version`).slice(0, 200),
          caption: plainText,
          externalUrl: "",
          note: "",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The planned post could not be saved.");
      setSaveState("Added to your Planner as a planned post — a plan, not a published post.");
    } catch (e) {
      setSaveState(e instanceof Error ? e.message : "The planned post could not be saved.");
    }
  }

  const usablePosts = posts.filter((p) => p.state === "published" || p.state === "planned");

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / CREATOR GROWTH CENTER / REPURPOSING STUDIO
        </div>

        <div className="mb-10">
          <div className="text-cyan-400 text-sm mb-3">ONE VIDEO, EVERY PLATFORM</div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">
            REPURPOSING
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500">
              STUDIO.
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Take words that already work and reshape them for the
            next platform — without writing from a blank page.
          </p>
        </div>

        <div className="rounded-3xl border border-amber-400/30 bg-amber-500/[.05] p-6 mb-10">
          <div className="text-amber-300 text-xs tracking-widest mb-2">
            READ THIS FIRST — WHAT THIS TOOL DOES AND DOES NOT DO
          </div>
          <p className="text-sm text-gray-300 leading-6">
            Repurposing rearranges your own words into each
            platform's shape. It does not write new claims — fill
            the labeled placeholders with your own facts. Nothing
            here invents a statistic, a testimonial, or a selling
            point you did not write.
          </p>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/[.07] p-4 mb-8 text-red-200">
            {loadError}
          </div>
        )}

        {/* Source picker */}
        <section className="mb-10">
          <div className="text-cyan-300/80 text-xs tracking-widest mb-3">
            1 · START FROM YOUR OWN WORDS
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>A post you logged</label>
              <select
                className={inputClass}
                value=""
                onChange={(e) => e.target.value && pickPost(e.target.value)}
              >
                <option value="">Choose a published or planned post…</option>
                {usablePosts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.title || "(untitled post)") + ` — ${p.posted_date} (${p.state})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>An idea you saved</label>
              <select
                className={inputClass}
                value=""
                onChange={(e) => e.target.value && pickIdea(e.target.value)}
              >
                <option value="">Choose an idea…</option>
                {ideas.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            …or just paste your own text below. Picking a source only
            fills the fields — edit freely before you reshape.
            {sourceKind === "post" &&
              " A post stores its title and caption, not the spoken script, so the script field starts empty for you to paste."}
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Title</label>
              <input
                className={inputClass}
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Your title, in your words"
              />
            </div>
            <div>
              <label className={labelClass}>
                Hook / script text (blank line between beats)
              </label>
              <textarea
                className={inputClass}
                rows={7}
                value={script}
                maxLength={4000}
                onChange={(e) => setScript(e.target.value)}
                placeholder={"Your hook first, then one beat per paragraph…"}
              />
            </div>
            <div>
              <label className={labelClass}>Caption</label>
              <textarea
                className={inputClass}
                rows={3}
                value={caption}
                maxLength={2000}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Your caption, in your words"
              />
            </div>
          </div>
        </section>

        {/* Format + output */}
        <section className="mb-10">
          <div className="text-cyan-300/80 text-xs tracking-widest mb-3">
            2 · PICK THE SHAPE
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {REPURPOSE_FORMATS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                className={`rounded-full border px-4 py-2 text-sm ${
                  format === f.value
                    ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/[.03] text-gray-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {output.sections.map((section) => (
              <div
                key={section.label}
                className="rounded-2xl border border-white/10 bg-white/[.03] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-gray-400 text-sm">{section.label}</div>
                  <button
                    onClick={() => copyText(section.text, section.label)}
                    className="shrink-0 text-xs text-cyan-300 underline"
                  >
                    {copied === section.label ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <p className="whitespace-pre-wrap leading-6 mt-2">{section.text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => copyText(plainText, "all")}
            className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm text-gray-200"
          >
            {copied === "all" ? "Copied ✓" : `Copy the whole ${output.formatLabel}`}
          </button>
        </section>

        {/* Save */}
        <section>
          <div className="text-cyan-300/80 text-xs tracking-widest mb-3">
            3 · KEEP IT
          </div>
          {tooLongForSave && (
            <p className="text-amber-300 text-sm mb-4">
              This version runs {plainText.length} characters — over
              the 2,000-character limit for a saved idea or planner
              caption. Copy it instead, or trim your source text.
            </p>
          )}
          <div className="flex flex-wrap items-end gap-4">
            <button
              onClick={saveAsIdea}
              disabled={tooLongForSave}
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 font-bold disabled:opacity-40"
            >
              Save as idea
            </button>
            <div>
              <label className={labelClass}>Planner platform</label>
              <select
                className="mt-2 bg-[#080b14] border border-white/10 rounded-xl p-3 text-white block"
                value={planPlatform}
                onChange={(e) => setPlanPlatform(e.target.value)}
              >
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Planned date</label>
              <input
                type="date"
                className="mt-2 bg-[#080b14] border border-white/10 rounded-xl p-3 text-white block"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
              />
            </div>
            <button
              onClick={addToPlanner}
              disabled={tooLongForSave}
              className="rounded-full border border-cyan-300/50 px-5 py-2.5 font-bold text-cyan-200 disabled:opacity-40"
            >
              Add to planner
            </button>
          </div>
          {saveState && <p className="text-gray-300 text-sm mt-4">{saveState}</p>}
          <p className="text-gray-500 text-sm mt-4">
            Saving creates a record in your own workspace — an idea
            in your Planner, or a planned post on your calendar. A
            planned post is a plan: it never counts as published.
          </p>
        </section>
      </div>
    </main>
  );
}
