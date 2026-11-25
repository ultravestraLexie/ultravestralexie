import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* Open or close one of the caller's own listings. RLS restricts
 * the update to the listing's owner; a listing that is not theirs
 * simply matches no row. */

const Schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "closed"]),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { data, error } = await supabase
    .from("market_listings")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("business_user_id", user.id)
    .select("id, status")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Could not update the listing." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "That listing is not yours." }, { status: 404 });
  return NextResponse.json({ listing: data });
}
