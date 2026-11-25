import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* Feed likes — a toggle on public.posts via public.post_likes.
 * The like either exists (and this removes it) or it doesn't (and
 * this adds it); the response carries the post's true like count
 * read back after the write, so the UI never shows a number the
 * database doesn't hold. */

const LikeSchema = z.object({ postId: z.string().uuid() });

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = LikeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const postId = parsed.data.postId;

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
  } else {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    if (error) return NextResponse.json({ error: "Could not save the like." }, { status: 500 });
  }

  const { count } = await supabase
    .from("post_likes")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", postId);
  return NextResponse.json({ liked: !existing, count: count ?? 0 });
}
