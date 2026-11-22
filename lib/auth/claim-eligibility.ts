/** Pay-before-account eligibility — the pure decision behind
 *  POST /api/auth/signup. Kept free of any client/env imports so the
 *  rule lives in exactly one place and can be fixtured directly.
 *
 *  Owner's order: no account may exist before payment. An email is
 *  eligible to create an account only when the Stripe webhook has
 *  parked an UNCLAIMED claim for it (public.subscription_claims) and
 *  the subscription behind that claim is still payable on Stripe's
 *  side right now.
 *
 *  Semantics, stated plainly:
 *  - Claim-row statuses that may proceed: "incomplete", "trialing",
 *    "active". A stored "canceled" / "unpaid" / "past_due" claim is
 *    a dead payment and never proceeds.
 *  - Live Stripe statuses (already mapped through
 *    lib/pay-first.ts's mapSubscriptionStatus) that may proceed:
 *    "incomplete", "trialing", "active". "Incomplete" means the
 *    checkout completed and the subscription exists but its first
 *    payment is still processing — the visitor HAS paid or is
 *    mid-payment at the bank, so account creation is allowed; the
 *    claim ATTACH step stays stricter (lib/pay-first.ts's
 *    isClaimableStatus: active/trialing only), so nothing unlocks
 *    until Stripe confirms, and a later sign-in retries the attach.
 *  - "canceled" (which mapSubscriptionStatus also produces for
 *    Stripe's incomplete_expired), "unpaid", and "past_due" on the
 *    live check always deny, whatever the stored claim says: the
 *    stored row can be stale, Stripe is the authority.
 *  - A claim that already has claimed_user_id set belongs to an
 *    existing account — never create a duplicate. */

export const SIGNUP_CLAIM_STATUSES = [
  "incomplete",
  "trialing",
  "active",
] as const;

export const SIGNUP_STRIPE_STATUSES = [
  "incomplete",
  "trialing",
  "active",
] as const;

export type ClaimRowLike = {
  status: string;
  claimed_user_id: string | null;
} | null | undefined;

export type ClaimEligibility =
  | { allow: true }
  | {
      allow: false;
      reason:
        | "no_claim"
        | "already_claimed"
        | "claim_not_payable"
        | "stripe_not_payable"
        | "stripe_unverifiable";
    };

/** Decide whether an account may be created for an email.
 *
 *  `claim` is the subscription_claims row for the normalized email
 *  (null when none exists). `stripeStatus` is the claim's live
 *  Stripe subscription status mapped through mapSubscriptionStatus,
 *  or null when the live check has not run / could not be completed
 *  — an unverifiable payment never creates an account. */
export function evaluateClaimEligibility(
  claim: ClaimRowLike,
  stripeStatus: string | null
): ClaimEligibility {
  if (!claim) return { allow: false, reason: "no_claim" };
  if (claim.claimed_user_id) {
    return { allow: false, reason: "already_claimed" };
  }
  if (
    !(SIGNUP_CLAIM_STATUSES as readonly string[]).includes(claim.status)
  ) {
    return { allow: false, reason: "claim_not_payable" };
  }
  if (!stripeStatus) {
    return { allow: false, reason: "stripe_unverifiable" };
  }
  if (
    !(SIGNUP_STRIPE_STATUSES as readonly string[]).includes(stripeStatus)
  ) {
    return { allow: false, reason: "stripe_not_payable" };
  }
  return { allow: true };
}
