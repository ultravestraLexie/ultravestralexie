import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUBSCRIBED_STATUSES } from "@/lib/gate-paths";

/** Server-side subscription gate — the second line of defense behind
 *  the middleware gate (lib/supabase/middleware.ts). Reads the caller's
 *  own row(s) in public.subscriptions; RLS policy
 *  "subscriptions_select_own" (auth.uid() = user_id) makes that readable
 *  with the normal session client. The webhook is the only writer. */

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function userHasActiveSubscription(
  supabase: ServerClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .in("status", [...SUBSCRIBED_STATUSES])
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export type GateState = "ok" | "login" | "pricing";

/** Resolve the gate for the current request without redirecting —
 *  used by API routes that must answer with JSON instead. */
export async function getGateState(): Promise<GateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "login";
  return (await userHasActiveSubscription(supabase, user.id))
    ? "ok"
    : "pricing";
}

/** Page guard: call as the first line of a gated server component.
 *  No session → /login (with ?next= back when a path is given).
 *  Session but no active/trialing subscription → /pricing. */
export async function requireSubscription(nextPath?: string): Promise<void> {
  const state = await getGateState();
  if (state === "login") {
    redirect(
      nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"
    );
  }
  if (state === "pricing") {
    redirect("/pricing");
  }
}
