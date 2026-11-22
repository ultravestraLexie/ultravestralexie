import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";

/** Login page — the installed app's entry point (manifest start_url).
 *  A signed-in user who lands here is forwarded straight inside
 *  (/dashboard) instead of being left on the sign-in form; signed-out
 *  visitors get the magic-link form. Session check is server-side via
 *  the shared Supabase server client, the same pattern the member
 *  pages use. */
export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
