"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { mediaUrl } from "@/lib/media";
import FollowButton from "@/components/FollowButton";

/* Feed (rebuild Phase 1 + 2) — the native social layer, real from
 * the first post: the composer writes to public.posts through
 * /api/feed/posts; video and photo files upload directly to the
 * `media` storage bucket under the author's own folder first, and
 * the post points at that object. Likes toggle through
 * /api/feed/like, comments write through /api/feed/comments, and
 * follows through /api/feed/follow — every number shown is the
 * count the database returned. */

export type FeedComment = {
  id: string;
  author: string;
  mine: boolean;
  body: string;
  createdAt: string;
};

export type FeedPost = {
  id: string;
  author: string;
  authorId: string;
  mine: boolean;
  kind: string;
  caption: string;
  mediaUrl: string | null;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  comments: FeedComment[];
  followingAuthor: boolean;
  authorFollowers: number;
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

type Pending = { file: File; kind: "video" | "photo" } | null;

function probe(file: File, kind: "video" | "photo"): Promise<{ width?: number; height?: number; duration?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    if (kind === "video") {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        const out = { width: v.videoWidth || undefined, height: v.videoHeight || undefined, duration: v.duration || undefined };
        URL.revokeObjectURL(url);
        resolve(out);
      };
      v.onerror = () => resolve({});
      v.src = url;
    } else {
      const img = new Image();
      img.onload = () => {
        const out = { width: img.naturalWidth || undefined, height: img.naturalHeight || undefined };
        URL.revokeObjectURL(url);
        resolve(out);
      };
      img.onerror = () => resolve({});
      img.src = url;
    }
  });
}

export default function FeedClient({
  initialPosts,
  myName,
  myId,
}: {
  initialPosts: FeedPost[];
  myName: string;
  myId: string;
}) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const videoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  async function publish() {
    if (busy) return;
    const caption = draft.trim();
    if (!pending && !caption) return;
    setBusy(true);
    setError("");
    try {
      let payload: Record<string, unknown> = { caption, kind: "pulse" };
      if (pending) {
        if (pending.file.size > 50 * 1024 * 1024) {
          setError("That file is over the 50 MB limit. Trim it shorter and try again.");
          return;
        }
        setStatus("Uploading…");
        const ext = (pending.file.name.split(".").pop() || (pending.kind === "video" ? "mp4" : "jpg")).toLowerCase();
        const path = `${myId}/${crypto.randomUUID()}.${ext}`;
        const supabase = createClient();
        const { error: upErr } = await supabase.storage
          .from("media")
          .upload(path, pending.file, { contentType: pending.file.type, upsert: false });
        if (upErr) {
          setError("The upload failed — check your connection and try again.");
          return;
        }
        const meta = await probe(pending.file, pending.kind);
        payload = { caption, kind: pending.kind, mediaAssetId: path, ...meta };
      }
      setStatus("Posting…");
      const res = await fetch("/api/feed/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          authorId: myId,
          mine: true,
          kind: body.post.kind,
          caption: body.post.caption,
          mediaUrl: mediaUrl(body.post.media_asset_id),
          createdAt: body.post.created_at,
          likes: 0,
          likedByMe: false,
          comments: [],
          followingAuthor: false,
          authorFollowers: 0,
        },
        ...prev,
      ]);
      setDraft("");
      setPending(null);
    } finally {
      setBusy(false);
      setStatus("");
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

  async function sendComment(post: FeedPost) {
    const body = (commentDrafts[post.id] ?? "").trim();
    if (!body) return;
    const res = await fetch("/api/feed/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, body }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.comment) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: data.comment.id, author: myName, mine: true, body: data.comment.body, createdAt: data.comment.created_at },
              ],
            }
          : p
      )
    );
    setCommentDrafts((d) => ({ ...d, [post.id]: "" }));
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
          <span className="attach">
            <button className="attachbtn" onClick={() => videoRef.current?.click()} type="button">
              Video
            </button>
            <button className="attachbtn" onClick={() => photoRef.current?.click()} type="button">
              Photo
            </button>
            {pending ? <span className="fname">{pending.file.name}</span> : null}
          </span>
          <span className="count">{draft.length}/500</span>
          <button className="postbtn" onClick={publish} disabled={busy || (!pending && !draft.trim())}>
            {busy ? status || "Posting…" : "Post"}
          </button>
        </div>
        <input
          ref={videoRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPending({ file: f, kind: "video" });
            e.target.value = "";
          }}
        />
        <input
          ref={photoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPending({ file: f, kind: "photo" });
            e.target.value = "";
          }}
        />
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
                <Link className="aname p-name" href={`/creator/${p.authorId}`}>
                  {p.author}
                </Link>
                <br />
                <span className="p-meta">{when(p.createdAt)}</span>
              </span>
              {!p.mine ? (
                <span style={{ marginLeft: "auto" }}>
                  <FollowButton followeeId={p.authorId} initialFollowing={p.followingAuthor} initialFollowers={p.authorFollowers} />
                </span>
              ) : (
                <span className="kind">{p.kind === "pulse" ? "Pulse" : p.kind}</span>
              )}
            </div>
            {p.mediaUrl && p.kind === "video" ? (
              <video className="media" src={p.mediaUrl} controls preload="metadata" playsInline />
            ) : null}
            {p.mediaUrl && p.kind === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="media" src={p.mediaUrl} alt={p.caption || "Photo post"} />
            ) : null}
            {p.caption ? <div className="p-cap">{p.caption}</div> : null}
            <div className="p-actions">
              <button className={`like${p.likedByMe ? " on" : ""}`} onClick={() => toggleLike(p)} aria-pressed={p.likedByMe}>
                {p.likedByMe ? "♥" : "♡"} {p.likes}
              </button>
              <button
                className="cbtn"
                onClick={() =>
                  setOpenComments((s) => {
                    const next = new Set(s);
                    if (next.has(p.id)) next.delete(p.id);
                    else next.add(p.id);
                    return next;
                  })
                }
                aria-expanded={openComments.has(p.id)}
              >
                Comments · {p.comments.length}
              </button>
            </div>
            {openComments.has(p.id) ? (
              <div className="comments">
                {p.comments.map((c) => (
                  <div className="comment" key={c.id}>
                    <span className="who">{c.author}</span>
                    {c.body}
                    <span className="when2">{when(c.createdAt)}</span>
                  </div>
                ))}
                <div className="crow">
                  <input
                    value={commentDrafts[p.id] ?? ""}
                    onChange={(e) => setCommentDrafts((d) => ({ ...d, [p.id]: e.target.value.slice(0, 500) }))}
                    placeholder="Add a comment"
                    aria-label="Add a comment"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendComment(p);
                    }}
                  />
                  <button className="cpost" onClick={() => sendComment(p)} disabled={!(commentDrafts[p.id] ?? "").trim()}>
                    Comment
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}
