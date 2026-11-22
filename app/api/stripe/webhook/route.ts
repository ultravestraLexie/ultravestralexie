import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, createAdminClient } from "@/lib/stripe";
import { mapSubscriptionStatus, normalizeEmail } from "@/lib/pay-first";

export const dynamic = "force-dynamic";

/** Stripe webhook — the ONLY place subscription access is granted or
 *  revoked. Every event is signature-verified and logged to
 *  payment_events (idempotent on the Stripe event id) before the
 *  subscriptions row is updated.
 *
 *  Pay-first exception: a subscription paid for BEFORE any account
 *  exists carries signup_email instead of a user id. It cannot be a
 *  subscriptions row yet (there is no user), so it is parked in
 *  public.subscription_claims keyed by that email. When the email
 *  first signs in, the auth callback stamps the Stripe subscription
 *  with the new user id; the resulting subscription.updated event
 *  then lands here and writes the real subscriptions row through the
 *  normal path. This handler remains the ONLY writer of
 *  public.subscriptions — claims are the only thing the pay-first
 *  branch writes. */

function mapStatus(status: Stripe.Subscription.Status): string {
  return mapSubscriptionStatus(status);
}

async function syncSubscription(
  admin: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const userId =
    (subscription.metadata?.user_id as string | undefined) ?? null;
  const priceId = subscription.items.data[0]?.price?.id ?? null;

  let planId: string | null = null;
  if (priceId) {
    const { data: plan } = await admin
      .from("plans")
      .select("id")
      .eq("stripe_price_id_monthly", priceId)
      .single();
    planId = plan?.id ?? null;
  }

  const item = subscription.items.data[0];
  const row = {
    user_id: userId,
    plan_id: planId,
    status: mapStatus(subscription.status),
    stripe_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    current_period_start: item?.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    current_period_end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  };

  if (!row.user_id) {
    // Pay-first: no user exists yet, but the checkout stamped the
    // email the account will be created with — park the subscription
    // as a claim keyed by that email instead of dropping it.
    const signupEmail = subscription.metadata?.signup_email as
      | string
      | undefined;
    if (signupEmail) {
      await admin.from("subscription_claims").upsert(
        {
          email: normalizeEmail(signupEmail),
          stripe_customer_id: row.stripe_customer_id,
          stripe_subscription_id: subscription.id,
          plan_id: planId,
          status: row.status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_subscription_id" }
      );
    }
    // Without a user id (and without a signup email) we cannot attach
    // the subscription; the event is still logged in payment_events
    // for manual reconciliation.
    return;
  }

  await admin
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 500 }
    );
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Log first; the unique stripe_event_id makes redeliveries harmless.
  await admin.from("payment_events").upsert(
    {
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
    },
    { onConflict: "stripe_event_id", ignoreDuplicates: true }
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id
        );
        // The checkout metadata carries the user id even when the
        // subscription's own metadata is missing.
        if (!subscription.metadata?.user_id && session.metadata?.user_id) {
          subscription.metadata = {
            ...subscription.metadata,
            user_id: session.metadata.user_id,
            plan_slug: session.metadata.plan_slug ?? "",
          };
        }
        // Same for pay-first checkouts: the session metadata carries
        // the signup email even when the subscription's is missing.
        if (
          !subscription.metadata?.user_id &&
          !subscription.metadata?.signup_email &&
          session.metadata?.signup_email
        ) {
          subscription.metadata = {
            ...subscription.metadata,
            signup_email: session.metadata.signup_email,
            plan_slug: session.metadata.plan_slug ?? "",
          };
        }
        await syncSubscription(admin, subscription);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(
        admin,
        event.data.object as Stripe.Subscription
      );
      break;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subRef = invoice.parent?.subscription_details?.subscription;
      const subId =
        typeof subRef === "string" ? subRef : (subRef?.id ?? null);
      if (subId) {
        const subscription = await stripe.subscriptions.retrieve(subId);
        await syncSubscription(admin, subscription);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
