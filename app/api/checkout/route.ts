import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { isValidEmailShape, normalizeEmail } from "@/lib/pay-first";

/** Starts a Stripe Checkout session for a plan's monthly price.
 *
 *  Signed-in flow: the session carries the user id and plan slug so
 *  the webhook can unlock the right account.
 *
 *  Pay-first flow (signed out): the body also carries the email the
 *  account will be created with. There is no user yet, so the session
 *  carries signup_email instead of a user id; the webhook parks the
 *  paid subscription as a claim keyed by that email, and the first
 *  sign-in with it creates the account and attaches the plan.
 *
 *  In both flows access is granted ONLY by the webhook after Stripe
 *  confirms payment — the browser redirect back here never unlocks
 *  anything. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { planSlug, email } = (await request.json().catch(() => ({}))) as {
    planSlug?: string;
    email?: string;
  };
  if (!planSlug) {
    return NextResponse.json({ error: "missing_plan" }, { status: 400 });
  }

  const { data: plan } = await supabase
    .from("plans")
    .select("slug, stripe_price_id_monthly")
    .eq("slug", planSlug)
    .eq("is_active", true)
    .single();
  if (!plan?.stripe_price_id_monthly) {
    return NextResponse.json({ error: "plan_not_ready" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const stripe = getStripe();

  if (user) {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.stripe_price_id_monthly, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan_slug: plan.slug },
      subscription_data: {
        metadata: { user_id: user.id, plan_slug: plan.slug },
      },
      success_url: `${origin}/pricing?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  }

  // Pay-first: no account yet — the email IS the future account.
  if (!email || !isValidEmailShape(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const signupEmail = normalizeEmail(email);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plan.stripe_price_id_monthly, quantity: 1 }],
    customer_email: signupEmail,
    metadata: { signup_email: signupEmail, plan_slug: plan.slug },
    subscription_data: {
      metadata: { signup_email: signupEmail, plan_slug: plan.slug },
    },
    success_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
