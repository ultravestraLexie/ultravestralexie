import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, getStripe } from "@/lib/stripe";
import {
  isClaimableStatus,
  mapSubscriptionStatus,
  normalizeEmail,
} from "@/lib/pay-first";

/** Magic-link landing route: exchanges the one-time code in the email
 *  link for a session cookie, then sends the creator on to the app.
 *  The public.profiles row is created by the on_auth_user_created
 *  database trigger — no app code needed for that.
 *
 *  Pay-first attach: if this email paid for a plan BEFORE the account
 *  existed, the webhook parked the subscription as an unclaimed row
 *  in public.subscription_claims. Here we stamp the Stripe
 *  subscription with the new user id — the resulting
 *  customer.subscription.updated event makes the WEBHOOK write the
 *  real public.subscriptions row through its existing path. This
 *  route never writes public.subscriptions itself; it writes only
 *  the claim row and Stripe-side metadata. */
async function attachPayFirstClaim(user: {
  id: string;
  email?: string | null;
}): Promise<void> {
  if (!user.email) return;
  try {
    const admin = createAdminClient();
    const { data: claim } = await admin
      .from("subscription_claims")
      .select(
        "id, stripe_subscription_id, plan_id, status, claimed_user_id"
      )
      .eq("email", normalizeEmail(user.email))
      .is("claimed_user_id", null)
      .maybeSingle();
    if (!claim || !isClaimableStatus(claim.status)) return;

    // Re-verify against Stripe: a claim whose subscription has since
    // died (canceled, unpaid…) must never be attached.
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(
      claim.stripe_subscription_id
    );
    if (!isClaimableStatus(mapSubscriptionStatus(subscription.status))) {
      return;
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
    await admin
      .from("subscription_claims")
      .update({
        claimed_user_id: user.id,
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", claim.id);

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
  } catch {
    // Attaching must never break sign-in: if anything above fails,
    // the claim stays unclaimed and a later sign-in retries it.
  }
}

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
