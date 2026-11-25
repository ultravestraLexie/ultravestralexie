import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* Post comments — written to public.post_comments for the
 * signed-in user. The response returns the stored row so the UI
 * shows exactly what the database holds. */

const CommentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1).max(500),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = CommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Write a comment first (up to 500 characters)." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: parsed.data.postId, user_id: user.id, body: parsed.data.body })
    .select("id, body, created_at")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "The comment could not be saved. Try again." }, { status: 500 });
  }
  return NextResponse.json({ comment: data });
}
