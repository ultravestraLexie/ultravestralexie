import { createAdminClient, getStripe } from "@/lib/stripe";
import {
  isClaimableStatus,
  mapSubscriptionStatus,
  normalizeEmail,
} from "@/lib/pay-first";

/** Pay-first claim attach — shared by every sign-in path.
 *
 *  If the user's email paid for a plan BEFORE the account existed,
 *  the webhook parked the subscription as an unclaimed row in
 *  public.subscription_claims. Attaching stamps the Stripe
 *  subscription with the user id — the resulting
 *  customer.subscription.updated event makes the WEBHOOK write the
 *  real public.subscriptions row through its existing path. This
 *  helper never writes public.subscriptions itself; it writes only
 *  the claim row and Stripe-side metadata.
 *
 *  Returns true only when a live claim was found, re-verified
 *  against Stripe, stamped, and marked claimed. Every failure is
 *  logged and swallowed (returns false) so attaching can never
 *  break sign-in, and the claim stays unclaimed for a later retry. */
export async function attachPayFirstClaim(user: {
  id: string;
  email?: string | null;
}): Promise<boolean> {
  if (!user.email) return false;
  try {
    const admin = createAdminClient();
    const { data: claim, error: claimError } = await admin
      .from("subscription_claims")
      .select(
        "id, stripe_subscription_id, plan_id, status, claimed_user_id"
      )
      .eq("email", normalizeEmail(user.email))
      .is("claimed_user_id", null)
      .maybeSingle();
    if (claimError) {
      throw new Error(
        `subscription_claims lookup failed for user ${user.id}: ${claimError.message}`
      );
    }
    if (!claim || !isClaimableStatus(claim.status)) return false;

    // Re-verify against Stripe: a claim whose subscription has since
    // died (canceled, unpaid…) must never be attached.
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(
      claim.stripe_subscription_id
    );
    if (!isClaimableStatus(mapSubscriptionStatus(subscription.status))) {
      return false;
    }

    let planSlug = "";
    if (claim.plan_id) {
      const { data: plan } = await admin
        .from("plans")
        .select("slug")
        .eq("id", claim.plan_id)
        .single();
      planSlug = plan?.slug ?? "";
    }

    await stripe.subscriptions.update(claim.stripe_subscription_id, {
      metadata: {
        ...(subscription.metadata ?? {}),
        user_id: user.id,
        plan_slug: planSlug,
      },
    });
    const { error: markError } = await admin
      .from("subscription_claims")
      .update({
        claimed_user_id: user.id,
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", claim.id);
    if (markError) {
      throw new Error(
        `subscription_claims mark-claimed failed for claim ${claim.id}: ${markError.message}`
      );
    }

    // The webhook writes the subscriptions row within moments; give
    // it a few seconds so the creator lands already unlocked instead
    // of bouncing off the pricing page.
    for (let i = 0; i < 10; i++) {
      const { data: sub } = await admin
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("stripe_subscription_id", claim.stripe_subscription_id)
        .maybeSingle();
      if (sub) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return true;
  } catch (err) {
    // Attaching must never break sign-in: if anything above fails,
    // the claim stays unclaimed and a later sign-in retries it. The
    // failure is LOGGED (Phase 1 Build 2a) — never silent — so a
    // stuck claim is visible instead of vanishing.
    console.error(
      `[pay-first-attach] attach failed for user ${user.id}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return false;
  }
}
