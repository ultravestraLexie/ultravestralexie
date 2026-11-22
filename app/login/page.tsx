import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { attachPayFirstClaim } from "@/lib/pay-first-attach";
import LoginForm from "./login-form";

/** Login page — the installed app's entry point (manifest start_url).
 *  A signed-in user who lands here is forwarded straight inside
 *  (/dashboard) instead of being left on the login form; signed-out
 *  visitors get the email + password form. Session check is
 *  server-side via the shared Supabase server client, the same
 *  pattern the member pages use.
 *
 *  Before forwarding, a signed-in user also gets a pay-first attach
 *  attempt: this is the retry path for someone whose claim was still
 *  unclaimed when their session was created (e.g. they confirmed
 *  their email later). The helper is a single claim lookup when
 *  there is nothing to attach and never throws, so the forward stays
 *  safe; it only takes longer in the rare case a live claim is
 *  actually waiting. */
export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await attachPayFirstClaim(user);
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
