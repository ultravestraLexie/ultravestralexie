// ============================================================================
// Feed Phase 2 — acceptance fixtures (owner-confirmed rebuild
// 2026-11-24; his law: if it's there, it leads to something).
//
// Pins the social layer's second slice:
//  - Video/photo posts: the write route requires a media object
//    inside the CALLER's own storage folder (no pointing a post
//    at someone else's upload), pulse posts stay text-only, and
//    the client uploads to the `media` bucket under the user's id.
//  - Comments + follows have real write routes over real tables,
//    and the follow route refuses self-follows.
//  - The Feed renders video/photo media and links authors to
//    their creator profile; the profile page reads the same
//    posts/follows tables (no second source of truth).
//
// Run (from the repo root):
//   npx tsx scripts/feed2-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "fs";

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
const read = (p: string) => readFileSync(p, "utf8");

const postRoute = read("app/api/feed/posts/route.ts");
check("posts api: accepts video and photo kinds", postRoute.includes('z.enum(["pulse", "video", "photo"])'), true);
check("posts api: media posts require an upload", postRoute.includes("The upload did not finish"), true);
check("posts api: media must live in the caller's folder", postRoute.includes("mediaAssetId.startsWith(`${user.id}/`)"), true);
check("posts api: pulse stores no media", postRoute.includes('media_asset_id: kind === "pulse" ? null : mediaAssetId'), true);

const followRoute = read("app/api/feed/follow/route.ts");
check("follow api: toggles public.follows", followRoute.includes('from("follows")'), true);
check("follow api: refuses self-follow", followRoute.includes("You cannot follow yourself."), true);
check("follow api: returns the true follower count", followRoute.includes('count: "exact"'), true);

const commentRoute = read("app/api/feed/comments/route.ts");
check("comments api: writes public.post_comments", commentRoute.includes('from("post_comments")'), true);
check("comments api: returns the stored row", commentRoute.includes('.select("id, body, created_at")'), true);

const feedClient = read("components/FeedClient.tsx");
check("feed client: uploads to the media bucket", feedClient.includes('.from("media")') && feedClient.includes(".upload(path"), true);
check("feed client: uploads land under the user's own id", feedClient.includes("`${myId}/${crypto.randomUUID()}"), true);
check("feed client: renders video posts as video", feedClient.includes('p.kind === "video"') && feedClient.includes("<video"), true);
check("feed client: renders photo posts as images", feedClient.includes('p.kind === "photo"'), true);
check("feed client: authors link to creator profiles", feedClient.includes("href={`/creator/${p.authorId}`}"), true);
check("feed client: comment box writes through the api", feedClient.includes('fetch("/api/feed/comments"'), true);

const feedPage = read("app/feed/page.tsx");
check("feed page: reads comments for the stream", feedPage.includes('from("post_comments")'), true);
check("feed page: reads follows for the stream", feedPage.includes('from("follows")'), true);
check("feed page: builds media urls from stored paths", feedPage.includes("mediaUrl(p.media_asset_id)"), true);

const creatorPage = read("app/creator/[id]/page.tsx");
check("creator page: behind the subscription gate", creatorPage.includes("requireSubscription"), true);
check("creator page: reads the same posts table", creatorPage.includes('from("posts")'), true);
check("creator page: counts come from follows", creatorPage.includes('from("follows")'), true);
check("creator page: carries a working follow button", creatorPage.includes("FollowButton"), true);

const media = read("lib/media.ts");
check("media lib: builds public storage urls", media.includes("/storage/v1/object/public/media/"), true);

console.log(failures === 0 ? "\nFEED2 FIXTURES: ALL PASS" : `\nFEED2 FIXTURES: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
