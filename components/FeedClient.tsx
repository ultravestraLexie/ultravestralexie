"use client";

import { useState } from "react";

/* Feed (rebuild Phase 1) — the native social layer, real from the
 * first post: the composer writes to public.posts through
 * /api/feed/posts, likes toggle through /api/feed/like and show
 * the count the database returns. Video and photo posts join this
 * same stream when Studio uploads land (Phase 2). */

export type FeedPost = {
  id: string;
  author: string;
  mine: boolean;
  kind: string;
  caption: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
};

function when(iso: string): string {
  const d = new Date(iso);
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function FeedClient({ initialPosts, myName }: { initialPosts: FeedPost[]; myName: string }) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function publish() {
    const caption = draft.trim();
    if (!caption || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/feed/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.post) {
        setError(body?.error ?? "The post could not be saved. Try again.");
        return;
      }
      setPosts((prev) => [
        {
          id: body.post.id,
          author: myName,
          mine: true,
          kind: body.post.kind,
          caption: body.post.caption,
          createdAt: body.post.created_at,
          likes: 0,
          likedByMe: false,
        },
        ...prev,
      ]);
      setDraft("");
    } finally {
      setBusy(false);
    }
  }

  async function toggleLike(post: FeedPost) {
    const res = await fetch("/api/feed/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body) return;
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, likes: body.count, likedByMe: body.liked } : p))
    );
  }

  return (
    <div>
      <div className="composer">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 500))}
          placeholder="Share an update with the universe — a win, a lesson, what you're working on."
          aria-label="Write a post"
        />
        <div className="composer-row">
          <span style={{ fontSize: 12.5, color: "var(--e-muted)" }}>Pulse update · public</span>
          <span className="count">{draft.length}/500</span>
          <button className="postbtn" onClick={publish} disabled={busy || !draft.trim()}>
            {busy ? "Posting…" : "Post"}
          </button>
        </div>
        {error ? <div className="err">{error}</div> : null}
      </div>

      {posts.length === 0 ? (
        <div className="empty">
          Nothing here yet. The feed fills as members post — yours can be the first update the
          universe sees.
        </div>
      ) : (
        posts.map((p) => (
          <article className="post" key={p.id}>
            <div className="p-head">
              <span className="avatar">{(p.author || "U").slice(0, 1).toUpperCase()}</span>
              <span>
                <span className="p-name">{p.author}</span>
                <br />
                <span className="p-meta">{when(p.createdAt)}</span>
              </span>
              <span className="kind">{p.kind === "pulse" ? "Pulse" : p.kind}</span>
            </div>
            <div className="p-cap">{p.caption}</div>
            <div className="p-actions">
              <button
                className={`like${p.likedByMe ? " on" : ""}`}
                onClick={() => toggleLike(p)}
                aria-pressed={p.likedByMe}
              >
                {p.likedByMe ? "♥" : "♡"} {p.likes}
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
