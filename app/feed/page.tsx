import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { ENG_CSS } from "@/lib/engine-css";
import { FEED_CSS, FEED2_CSS } from "@/lib/feed-css";
import { mediaUrl } from "@/lib/media";
import FeedClient, { type FeedPost } from "@/components/FeedClient";

export const dynamic = "force-dynamic";

/* FEED (rebuild Phase 1 + 2) — Vestra Media's front door: the
 * shared post stream (public.posts) with real likes, comments
 * and follows. Video and photo posts stream from the `media`
 * storage bucket. Authors are named from their creator business
 * profile when they have one; the stream is the same records the
 * Brain and Studio read. */
export default async function FeedPage() {
  await requireSubscription("/feed");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: postRows } = await supabase
    .from("posts")
    .select("id, user_id, kind, caption, media_asset_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const posts = (postRows ?? []) as {
    id: string;
    user_id: string;
    kind: string;
    caption: string;
    media_asset_id: string | null;
    created_at: string;
  }[];
  const postIds = posts.map((p) => p.id);

  const [{ data: likeRows }, { data: commentRows }, { data: followRows }] = await Promise.all([
    postIds.length
      ? supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string; user_id: string }[] }),
    postIds.length
      ? supabase
          .from("post_comments")
          .select("id, post_id, user_id, body, created_at")
          .in("post_id", postIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as { id: string; post_id: string; user_id: string; body: string; created_at: string }[] }),
    supabase.from("follows").select("follower_id, followee_id"),
  ]);
  const comments = (commentRows ?? []) as { id: string; post_id: string; user_id: string; body: string; created_at: string }[];
  const follows = (followRows ?? []) as { follower_id: string; followee_id: string }[];

  const peopleIds = [
    ...new Set([...posts.map((p) => p.user_id), ...comments.map((c) => c.user_id), user.id]),
  ];
  const { data: nameRows } = await supabase
    .from("creator_business_profiles")
    .select("user_id, creator_name")
    .in("user_id", peopleIds);
  const names = new Map<string, string>();
  for (const r of (nameRows ?? []) as { user_id: string; creator_name: string | null }[]) {
    if (r.creator_name) names.set(r.user_id, r.creator_name);
  }
  const nameOf = (id: string) => names.get(id) ?? "UltraVestra member";

  const likeCount = new Map<string, number>();
  const myLikes = new Set<string>();
  for (const l of (likeRows ?? []) as { post_id: string; user_id: string }[]) {
    likeCount.set(l.post_id, (likeCount.get(l.post_id) ?? 0) + 1);
    if (l.user_id === user.id) myLikes.add(l.post_id);
  }
  const myFollowees = new Set(follows.filter((f) => f.follower_id === user.id).map((f) => f.followee_id));
  const followerCount = new Map<string, number>();
  for (const f of follows) followerCount.set(f.followee_id, (followerCount.get(f.followee_id) ?? 0) + 1);
  const commentsByPost = new Map<string, FeedPost["comments"]>();
  for (const c of comments) {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push({ id: c.id, author: nameOf(c.user_id), mine: c.user_id === user.id, body: c.body, createdAt: c.created_at });
    commentsByPost.set(c.post_id, list);
  }

  const initial: FeedPost[] = posts.map((p) => ({
    id: p.id,
    author: nameOf(p.user_id),
    authorId: p.user_id,
    mine: p.user_id === user.id,
    kind: p.kind,
    caption: p.caption,
    mediaUrl: mediaUrl(p.media_asset_id),
    createdAt: p.created_at,
    likes: likeCount.get(p.id) ?? 0,
    likedByMe: myLikes.has(p.id),
    comments: commentsByPost.get(p.id) ?? [],
    followingAuthor: myFollowees.has(p.user_id),
    authorFollowers: followerCount.get(p.user_id) ?? 0,
  }));

  return (
    <div className="eng fd">
      <style>{ENG_CSS}</style>
      <style>{FEED_CSS}</style>
      <style>{FEED2_CSS}</style>
      <div className="wrap">
        <div className="label">Vestra Media</div>
        <h2 className="eng-title">Feed</h2>
        <p className="sub">
          What the universe is creating, learning and closing. Post a video, a photo or an
          update — every post, like, comment and follow here is a real record the Brain can
          learn from.
        </p>
        <FeedClient initialPosts={initial} myName={nameOf(user.id)} myId={user.id} />
      </div>
    </div>
  );
}
