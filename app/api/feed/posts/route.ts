import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* Feed posts (rebuild Phase 1 + 2) — the social layer's write
 * path. Pulse posts are text-only. Video and photo posts carry a
 * media_asset_id: the object path inside the `media` storage
 * bucket, which the browser uploaded directly under the user's
 * own folder (storage policies enforce the same rule). This route
 * refuses media paths outside the caller's folder, so a post can
 * only ever point at the author's own upload. */

const PostSchema = z.object({
  caption: z.string().trim().max(500).default(""),
  kind: z.enum(["pulse", "video", "photo"]).default("pulse"),
  mediaAssetId: z.string().trim().max(200).optional(),
  width: z.number().int().positive().max(10000).optional(),
  height: z.number().int().positive().max(10000).optional(),
  duration: z.number().positive().max(3600).optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "That post is not valid — check the text and try again." }, { status: 400 });
  }
  const { caption, kind, mediaAssetId, width, height, duration } = parsed.data;

  if (kind === "pulse" && !caption) {
    return NextResponse.json({ error: "Write something first (up to 500 characters)." }, { status: 400 });
  }
  if (kind !== "pulse") {
    if (!mediaAssetId) {
      return NextResponse.json({ error: "The upload did not finish — try attaching the file again." }, { status: 400 });
    }
    if (!mediaAssetId.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "That file is not in your uploads." }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      kind,
      caption,
      media_asset_id: kind === "pulse" ? null : mediaAssetId,
      width: width ?? null,
      height: height ?? null,
      duration: duration ?? null,
      visibility: "public",
    })
    .select("id, kind, caption, media_asset_id, width, height, duration, created_at")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "The post could not be saved. Try again." }, { status: 500 });
  }
  return NextResponse.json({ post: data });
}
