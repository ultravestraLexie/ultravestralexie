import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, getStripe } from "@/lib/stripe";
import {
  isValidEmailShape,
  LIVE_SUBSCRIPTION_STATUSES,
  normalizeEmail,
} from "@/lib/pay-first";
import { checkRateLimitShared } from "@/lib/rate-limit";

/** Checkout starts allowed per identity per hour (Phase 1 Build 2d:
 *  this route previously had no rate-limit bucket and no error
 *  handling — a Stripe failure produced an unhandled error instead
 *  of a JSON answer). */
const CHECKOUT_RATE_LIMIT = { limit: 20, windowMs: 60 * 60 * 1000 } as const;

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
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  try {
  if (user) {
    const withinLimit = await checkRateLimitShared(
      `checkout:${ip}:${user.id}`,
      CHECKOUT_RATE_LIMIT.limit,
      CHECKOUT_RATE_LIMIT.windowMs
    );
    if (!withinLimit) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    // Item 5 guard: a signed-in creator who already has a live
    // subscription never starts a second checkout — a second paid
    // subscription beside the first is the defect being fixed.
    const admin = createAdminClient();
    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .in("status", [...LIVE_SUBSCRIPTION_STATUSES])
      .limit(1);
    if (existingSub && existingSub.length > 0) {
      return NextResponse.json(
        { error: "already_subscribed" },
        { status: 409 }
      );
    }
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
  const withinLimit = await checkRateLimitShared(
    `checkout:${ip}:${signupEmail}`,
    CHECKOUT_RATE_LIMIT.limit,
    CHECKOUT_RATE_LIMIT.windowMs
  );
  if (!withinLimit) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  // Item 5 guard (pay-first): this email already carries a live
  // plan — as an unclaimed claim, or as a claimed account's
  // subscription — so a second payment must never be taken.
  const admin = createAdminClient();
  const { data: existingClaim } = await admin
    .from("subscription_claims")
    .select("id")
    .eq("email", signupEmail)
    .in("status", [...LIVE_SUBSCRIPTION_STATUSES])
    .limit(1);
  if (existingClaim && existingClaim.length > 0) {
    return NextResponse.json(
      { error: "already_subscribed" },
      { status: 409 }
    );
  }
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", signupEmail)
    .limit(1);
  const profileId = profile?.[0]?.id as string | undefined;
  if (profileId) {
    const { data: profileSub } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", profileId)
      .in("status", [...LIVE_SUBSCRIPTION_STATUSES])
      .limit(1);
    if (profileSub && profileSub.length > 0) {
      return NextResponse.json(
        { error: "already_subscribed" },
        { status: 409 }
      );
    }
  }
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
  } catch (err) {
    console.error(
      `[checkout] session creation failed for plan ${plan.slug}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return NextResponse.json(
      { error: "checkout_unavailable" },
      { status: 500 }
    );
  }
}
