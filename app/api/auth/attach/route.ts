import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { attachPayFirstClaim } from "@/lib/pay-first-attach";

/** Runs the pay-first claim attach for the signed-in user.
 *
 *  The password login and sign-up forms call this right after a
 *  session is established (the legacy magic-link flow attaches in
 *  the auth callback instead). Attaching is best-effort by design:
 *  the shared helper never throws, and a false result simply means
 *  there was no live claim to attach or the attempt can be retried
 *  on a later sign-in. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { attached: false, error: "not_signed_in" },
      { status: 401 }
    );
  }

  const attached = await attachPayFirstClaim(user);
  return NextResponse.json({ attached });
}
