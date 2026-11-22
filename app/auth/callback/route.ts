import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { attachPayFirstClaim } from "@/lib/pay-first-attach";

/** Auth landing route: exchanges the one-time code from an email
 *  link (legacy magic-link sign-in, email confirmation, or password
 *  recovery) for a session cookie, then sends the creator on to the
 *  app. The public.profiles row is created by the
 *  on_auth_user_created database trigger — no app code needed for
 *  that.
 *
 *  After the exchange it runs the shared pay-first attach: if this
 *  email paid for a plan before the account existed, the claim is
 *  attached here (see lib/pay-first-attach.ts). The password-based
 *  flows attach through POST /api/auth/attach instead. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/brands";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await attachPayFirstClaim(user);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link-expired`);
}
