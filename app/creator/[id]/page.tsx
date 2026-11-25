import Link from "next/link";
import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { ENG_CSS } from "@/lib/engine-css";
import { FEED_CSS, FEED2_CSS } from "@/lib/feed-css";
import { mediaUrl } from "@/lib/media";
import FollowButton from "@/components/FollowButton";

export const dynamic = "force-dynamic";

/* CREATOR PROFILE (rebuild Phase 2) — a member's channel: who
 * they are (from their creator business profile), their counts
 * from the real follows/posts tables, and their public posts.
 * Reached by tapping an author in the Feed. */
export default async function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSubscription(`/creator/${id}`);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: bp }, { data: postRows }, { data: followRows }] = await Promise.all([
    supabase
      .from("creator_business_profiles")
      .select("creator_name, business_description, content_categories")
      .eq("user_id", id)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("id, kind, caption, media_asset_id, created_at")
      .eq("user_id", id)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("follows").select("follower_id, followee_id").or(`follower_id.eq.${id},followee_id.eq.${id}`),
  ]);
  const profile = bp as { creator_name: string | null; business_description: string | null; content_categories: string[] | null } | null;
  const posts = (postRows ?? []) as { id: string; kind: string; caption: string; media_asset_id: string | null; created_at: string }[];
  const follows = (followRows ?? []) as { follower_id: string; followee_id: string }[];
  const followers = follows.filter((f) => f.followee_id === id).length;
  const following = follows.filter((f) => f.follower_id === id).length;
  const iFollow = follows.some((f) => f.follower_id === user.id && f.followee_id === id);
  const name = profile?.creator_name ?? "UltraVestra member";
  const isMe = id === user.id;

  return (
    <div className="eng fd">
      <style>{ENG_CSS}</style>
      <style>{FEED_CSS}</style>
      <style>{FEED2_CSS}</style>
      <div className="wrap">
        <div className="label">Creator</div>
        <h2 className="eng-title">{name}</h2>
        {profile?.business_description ? <p className="sub">{profile.business_description}</p> : null}
        {(profile?.content_categories ?? []).length ? (
          <p className="sub">Creates in: {(profile?.content_categories ?? []).join(" · ")}</p>
        ) : null}

        <div className="kpis">
          <div className="kpi">
            <div className="v">{posts.length}</div>
            <div className="k">Posts</div>
          </div>
          <div className="kpi">
            <div className="v">{followers}</div>
            <div className="k">Followers</div>
          </div>
          <div className="kpi">
            <div className="v">{following}</div>
            <div className="k">Following</div>
          </div>
        </div>

        {!isMe ? (
          <div style={{ margin: "4px 0 18px" }}>
            <FollowButton followeeId={id} initialFollowing={iFollow} initialFollowers={followers} />
          </div>
        ) : null}

        {posts.length === 0 ? (
          <div className="empty">No public posts yet.</div>
        ) : (
          posts.map((p) => (
            <article className="post" key={p.id}>
              <div className="p-head">
                <span className="p-meta">
                  {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="kind">{p.kind === "pulse" ? "Pulse" : p.kind}</span>
              </div>
              {mediaUrl(p.media_asset_id) && p.kind === "video" ? (
                <video className="media" src={mediaUrl(p.media_asset_id) ?? undefined} controls preload="metadata" playsInline />
              ) : null}
              {mediaUrl(p.media_asset_id) && p.kind === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="media" src={mediaUrl(p.media_asset_id) ?? undefined} alt={p.caption || "Photo post"} />
              ) : null}
              {p.caption ? <div className="p-cap">{p.caption}</div> : null}
            </article>
          ))
        )}

        <p style={{ marginTop: 16 }}>
          <Link className="cta" href="/feed">
            ← Back to the Feed
          </Link>
        </p>
      </div>
    </div>
  );
}
