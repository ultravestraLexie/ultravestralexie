import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

/** Starts a Stripe Checkout session for a plan's monthly price.
 *  The caller must be signed in; the session carries the user id and
 *  plan slug so the webhook can unlock the right account. Access is
 *  granted ONLY by the webhook after Stripe confirms payment — the
 *  browser redirect back here never unlocks anything. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  const { planSlug } = (await request.json().catch(() => ({}))) as {
    planSlug?: string;
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
