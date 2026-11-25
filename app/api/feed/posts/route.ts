import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* Feed posts (rebuild Phase 1) — the social layer's write path.
 * v1 accepts pulse posts (text updates). Video and photo posts are
 * created from Studio when uploads land (Phase 2); the posts table
 * already carries their fields. A post is only ever written for the
 * signed-in user — RLS enforces the same rule at the database. */

const PostSchema = z.object({
  caption: z.string().trim().min(1).max(500),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Write something first (up to 500 characters)." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: user.id, kind: "pulse", caption: parsed.data.caption, visibility: "public" })
    .select("id, kind, caption, created_at")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "The post could not be saved. Try again." }, { status: 500 });
  }
  return NextResponse.json({ post: data });
}
