import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* Apply to a marketplace listing (rebuild Phase 3). One
 * application per creator per listing — the table's unique
 * constraint agrees, and a repeat apply gets a plain answer
 * instead of a duplicate. A business cannot apply to its own
 * listing. */

const ApplySchema = z.object({
  listingId: z.string().uuid(),
  pitch: z.string().trim().max(500).default(""),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = ApplySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { data: listing } = await supabase
    .from("market_listings")
    .select("id, business_user_id, status")
    .eq("id", parsed.data.listingId)
    .maybeSingle();
  const l = listing as { business_user_id: string; status: string } | null;
  if (!l) return NextResponse.json({ error: "That opportunity is no longer listed." }, { status: 404 });
  if (l.status !== "open") return NextResponse.json({ error: "That opportunity is closed." }, { status: 400 });
  if (l.business_user_id === user.id) {
    return NextResponse.json({ error: "This is your own listing." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("market_applications")
    .insert({ listing_id: parsed.data.listingId, creator_user_id: user.id, pitch: parsed.data.pitch })
    .select("id, status, created_at")
    .single();
  if (error || !data) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "You already applied to this one." }, { status: 409 });
    }
    return NextResponse.json({ error: "The application could not be saved. Try again." }, { status: 500 });
  }
  return NextResponse.json({ application: data });
}
