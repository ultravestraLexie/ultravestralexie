import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* Decide a marketplace application (rebuild Phase 3).
 * Accept runs the accept_market_application database function:
 * it verifies the caller owns the listing, creates the creator's
 * deal at Contracted with the listing's pay and deliverables, and
 * marks the application accepted — one atomic step, so an
 * accepted application always has its deal. Decline is a plain
 * status update under the listing owner's RLS policy. */

const DecideSchema = z.object({
  applicationId: z.string().uuid(),
  decision: z.enum(["accept", "decline"]),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = DecideSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { applicationId, decision } = parsed.data;

  if (decision === "accept") {
    const { data, error } = await supabase.rpc("accept_market_application", {
      p_application_id: applicationId,
    });
    if (error) {
      return NextResponse.json(
        { error: "Could not accept — the application may already be decided." },
        { status: 400 }
      );
    }
    return NextResponse.json({ dealId: data });
  }

  const { data, error } = await supabase
    .from("market_applications")
    .update({ status: "declined" })
    .eq("id", applicationId)
    .eq("status", "applied")
    .select("id, status")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Could not save the decision." }, { status: 500 });
  if (!data) {
    return NextResponse.json({ error: "That application is not yours to decide." }, { status: 404 });
  }
  return NextResponse.json({ application: data });
}
