import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* Follows — a toggle on public.follows. The response carries the
 * followee's true follower count read back after the write. You
 * cannot follow yourself (the table's check constraint agrees). */

const FollowSchema = z.object({ followeeId: z.string().uuid() });

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = FollowSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const followeeId = parsed.data.followeeId;
  if (followeeId === user.id) {
    return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followee_id", followeeId)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", followeeId);
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, followee_id: followeeId });
    if (error) return NextResponse.json({ error: "Could not save the follow." }, { status: 500 });
  }

  const { count } = await supabase
    .from("follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("followee_id", followeeId);
  return NextResponse.json({ following: !existing, followers: count ?? 0 });
}
