import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { ENG_CSS } from "@/lib/engine-css";
import { FEED_CSS } from "@/lib/feed-css";
import FeedClient, { type FeedPost } from "@/components/FeedClient";

export const dynamic = "force-dynamic";

/* FEED (rebuild Phase 1) — Vestra Media's front door: the shared
 * post stream (public.posts) with real likes. Authors are named
 * from their creator business profile when they have one; the
 * stream is the same records the Brain and Studio will read. */
export default async function FeedPage() {
  await requireSubscription("/feed");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: postRows } = await supabase
    .from("posts")
    .select("id, user_id, kind, caption, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const posts = (postRows ?? []) as {
    id: string;
    user_id: string;
    kind: string;
    caption: string;
    created_at: string;
  }[];

  const authorIds = [...new Set(posts.map((p) => p.user_id).concat(user.id))];
  const [{ data: nameRows }, { data: likeRows }] = await Promise.all([
    supabase
      .from("creator_business_profiles")
      .select("user_id, creator_name")
      .in("user_id", authorIds),
    posts.length
      ? supabase.from("post_likes").select("post_id, user_id").in("post_id", posts.map((p) => p.id))
      : Promise.resolve({ data: [] as { post_id: string; user_id: string }[] }),
  ]);
  const names = new Map<string, string>();
  for (const r of (nameRows ?? []) as { user_id: string; creator_name: string | null }[]) {
    if (r.creator_name) names.set(r.user_id, r.creator_name);
  }
  const likeCount = new Map<string, number>();
  const myLikes = new Set<string>();
  for (const l of (likeRows ?? []) as { post_id: string; user_id: string }[]) {
    likeCount.set(l.post_id, (likeCount.get(l.post_id) ?? 0) + 1);
    if (l.user_id === user.id) myLikes.add(l.post_id);
  }

  const initial: FeedPost[] = posts.map((p) => ({
    id: p.id,
    author: names.get(p.user_id) ?? "UltraVestra member",
    mine: p.user_id === user.id,
    kind: p.kind,
    caption: p.caption,
    createdAt: p.created_at,
    likes: likeCount.get(p.id) ?? 0,
    likedByMe: myLikes.has(p.id),
  }));
  const myName = names.get(user.id) ?? "UltraVestra member";

  return (
    <div className="eng fd">
      <style>{ENG_CSS}</style>
      <style>{FEED_CSS}</style>
      <div className="wrap">
        <div className="label">Vestra Media</div>
        <h2 className="eng-title">Feed</h2>
        <p className="sub">
          What the universe is creating, learning and closing. Post an update, like what helps
          you — every post and like here is a real record the Brain can learn from.
        </p>
        <FeedClient initialPosts={initial} myName={myName} />
      </div>
    </div>
  );
}
