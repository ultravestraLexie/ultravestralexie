import type Stripe from "stripe";

/** Pay-first signup helpers — pure functions shared by the checkout
 *  route, the Stripe webhook, and the auth callback. Kept free of any
 *  client/env imports so the normalization and status-mapping rules
 *  live in exactly one place.
 *
 *  Flow: a visitor pays BEFORE an account exists. The webhook parks
 *  the paid subscription as a row in public.subscription_claims keyed
 *  by the checkout email; when that email first signs in, the auth
 *  callback stamps the Stripe subscription with the new user id and
 *  the webhook writes the real public.subscriptions row as usual. */

/** Canonical form for claim emails: trimmed and lowercased, matching
 *  how the claim is stored and looked up. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Minimal shape check for a pay-first email: something@something.tld
 *  with no whitespace. Stripe and Supabase do the authoritative
 *  validation later; this only rejects obvious junk before we open a
 *  checkout session. */
export function isValidEmailShape(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Map a Stripe subscription status onto the status vocabulary shared
 *  by public.subscriptions and public.subscription_claims. */
export function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): string {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
    case "unpaid":
      return status;
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

/** Statuses that mean "this claim represents a live paid plan" — the
 *  only ones the auth callback will attach to a new account. */
export function isClaimableStatus(status: string): boolean {
  return status === "active" || status === "trialing";
}
