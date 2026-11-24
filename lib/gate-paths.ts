/** Subscription-gate constants — deliberately free of any server-only
 *  imports (no next/headers, no next/navigation) so the Edge middleware
 *  can import it too. The server-side helper lives in lib/gate.ts.
 *
 *  Subscription status lives in public.subscriptions.status, written
 *  ONLY by the Stripe webhook (app/api/stripe/webhook/route.ts). The
 *  statuses it can write are: active, trialing, past_due, unpaid,
 *  canceled, incomplete. A member counts as subscribed ONLY with an
 *  'active' or 'trialing' row — past_due/unpaid do not pass the gate. */
export const SUBSCRIBED_STATUSES = ["active", "trialing"] as const;

/** Route prefixes that require login + an active subscription.
 *  Everything else (/, /pricing, /login, /auth/*, /api/checkout,
 *  /api/stripe/*) stays public. */
export const GATED_PREFIXES = [
  "/today",
  "/deals",
  "/money",
  "/discover",
  "/ask",
  "/commissions",
  "/radar",
  "/opportunities",
  "/brands",
  "/coach",
  "/academy",
  "/studio",
  "/dashboard",
  "/get-started",
  "/secret-weapon",
  "/human-buying-lab",
  "/buyer-brain",
  "/creator-lab",
  "/passport",
  "/trend-radar",
  "/growth-map",
  "/campaign-match",
  "/revenue",
  "/alerts",
  "/proposals",
  "/command-center",
  "/growth-center",
  "/start-here",
  "/why-is-my-video-not-working",
  "/creator-growth",
  "/saved",
  "/api/suggest",
  "/api/studio",
  "/api/buyer-brain",
  "/api/creator-lab",
  "/api/passport",
  "/api/trend-radar",
  "/api/growth-map",
  "/api/campaign-match",
  "/api/revenue",
  "/api/alerts",
  "/api/proposals",
  "/api/command-center",
  "/api/growth-center",
  "/api/posts",
  "/api/connections",
  "/api/ideas",
  "/api/goals",
  "/api/deals",
  "/api/audience",
  "/api/support",
  "/api/business",
  "/api/business-profile",
  "/api/advisor",
] as const;

export function isGatedPath(pathname: string): boolean {
  return GATED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
