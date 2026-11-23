import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, createAdminClient } from "@/lib/stripe";
import {
  isLiveStatus,
  LIVE_SUBSCRIPTION_STATUSES,
  mapSubscriptionStatus,
  normalizeEmail,
} from "@/lib/pay-first";

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
 *  branch writes. *
 *  Failure honesty (Phase 1 Build 2a): every database write's error
 *  is checked. A failed write is logged and answered with HTTP 500
 *  so Stripe retries the event instead of the failure vanishing
 *  behind a 200. A 200 now means the event was logged AND its sync
 *  writes landed (or there was legitimately nothing to write — a
 *  subscription with no user id and no signup email is logged in
 *  payment_events for manual reconciliation and skipped by design). */

function mapStatus(status: Stripe.Subscription.Status): string {
  return mapSubscriptionStatus(status);
}

/** Item 5 — duplicate-subscription defense. When a second live
 *  subscription appears for a person who already has one (two
 *  checkouts racing before the first webhook landed, or a checkout
 *  the route guard could not see), the duplicate is cancelled at
 *  Stripe immediately and its first payment refunded, so it can
 *  never bill twice. The caller then records the duplicate row as
 *  canceled — the database always shows what happened; a paid
 *  subscription is never silently dropped. A cancel failure throws
 *  (→ HTTP 500 → Stripe retries); a refund failure is logged
 *  loudly for manual reconciliation but does not block the cancel,
 *  because stopping future billing is the critical act. */
async function cancelDuplicateSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  if (subscription.status !== "canceled") {
    await stripe.subscriptions.cancel(subscription.id);
  }
  try {
    const invoices = await stripe.invoices.list({
      subscription: subscription.id,
      limit: 1,
    });
    const invoice = invoices.data[0];
    const payment = invoice?.payments?.data?.[0]?.payment;
    const paymentIntent = payment?.payment_intent;
    const paymentIntentId =
      typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
    if (paymentIntentId) {
      await stripe.refunds.create({ payment_intent: paymentIntentId });
    }
  } catch (refundErr) {
    console.error(
      `[stripe-webhook] duplicate subscription ${subscription.id} was cancelled, but refunding its first payment failed — reconcile manually: ${
        refundErr instanceof Error ? refundErr.message : String(refundErr)
      }`
    );
  }
}

async function syncSubscription(
  admin: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
  stripe: Stripe
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
      // Item 5: a live claim for this email under a DIFFERENT
      // subscription means this one is a duplicate — cancel and
      // refund it at Stripe, and record it as canceled.
      if (isLiveStatus(row.status)) {
        const { data: otherClaims } = await admin
          .from("subscription_claims")
          .select("id")
          .eq("email", normalizeEmail(signupEmail))
          .neq("stripe_subscription_id", subscription.id)
          .in("status", [...LIVE_SUBSCRIPTION_STATUSES])
          .limit(1);
        if (otherClaims && otherClaims.length > 0) {
          await cancelDuplicateSubscription(stripe, subscription);
          row.status = "canceled";
        }
      }
      // Account-holder return (second variant of the battX defect,
      // owner-approved fix 2026-11-23): the email's claim row is
      // already CLAIMED by an existing account under a DIFFERENT
      // (old, canceled) subscription. That account is the proven
      // owner of this email, so the new purchase belongs to it:
      // repoint the claim row at the new subscription and fall
      // through to the normal user path below, which writes the
      // real subscriptions row (with its own duplicate guard).
      // Without this, the claim upsert collided with the unique
      // email constraint, the event 500'd, and the paid subscription
      // was orphaned — signup refuses a claimed email by design and
      // the sign-in attach only reads unclaimed claims.
      const { data: existingClaim } = await admin
        .from("subscription_claims")
        .select("id, claimed_user_id, stripe_subscription_id, status")
        .eq("email", normalizeEmail(signupEmail))
        .maybeSingle();
      if (
        existingClaim?.claimed_user_id &&
        existingClaim.stripe_subscription_id !== subscription.id &&
        isLiveStatus(existingClaim.status)
      ) {
        // The claimed claim is LIVE under its own subscription: this
        // event is a duplicate (already canceled + refunded by the
        // guard above) or a stray event for another subscription.
        // The live claim row stays exactly as it is — nothing parks.
        return;
      }
      if (
        existingClaim?.claimed_user_id &&
        existingClaim.stripe_subscription_id !== subscription.id
      ) {
        const { error: claimRepointError } = await admin
          .from("subscription_claims")
          .update({
            stripe_customer_id: row.stripe_customer_id,
            stripe_subscription_id: subscription.id,
            plan_id: planId,
            status: row.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingClaim.id);
        if (claimRepointError) {
          throw new Error(
            `subscription_claims repoint failed for subscription ${subscription.id}: ${claimRepointError.message}`
          );
        }
        // Stamp the account onto the Stripe subscription itself (the
        // same move the sign-in attach makes) so every later event
        // for this subscription carries the user id and syncs through
        // the normal path — renewals, cancels, everything.
        await stripe.subscriptions.update(subscription.id, {
          metadata: {
            ...(subscription.metadata ?? {}),
            user_id: existingClaim.claimed_user_id,
          },
        });
        row.user_id = existingClaim.claimed_user_id;
      } else {
        const { error: claimError } = await admin
          .from("subscription_claims")
          .upsert(
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
        if (claimError) {
          // Same-email return (defect proven live by battX, 2026-11-23):
          // this email already has a claim row under its OLD, canceled
          // subscription, so the insert above collides with the unique
          // email constraint and the new paid claim never parks — the
          // customer pays, then signup eligibility reads the old
          // canceled row and refuses the account. Fall back to reviving
          // that row with the new purchase, but ONLY when it is dead
          // weight: status canceled AND never claimed by an account.
          // A claimed row belongs to an existing account and is never
          // rewritten here. If the revive matches nothing, the original
          // error stands and the event 500s so Stripe retries.
          const { data: revived, error: reviveError } = await admin
            .from("subscription_claims")
            .update({
              stripe_customer_id: row.stripe_customer_id,
              stripe_subscription_id: subscription.id,
              plan_id: planId,
              status: row.status,
              updated_at: new Date().toISOString(),
            })
            .eq("email", normalizeEmail(signupEmail))
            .eq("status", "canceled")
            .is("claimed_user_id", null)
            .neq("stripe_subscription_id", subscription.id)
            .select("id");
          if (reviveError || !revived || revived.length === 0) {
            throw new Error(
              `subscription_claims upsert failed for subscription ${subscription.id}: ${claimError.message}`
            );
          }
        }
        // Without a user id (and without a signup email) we cannot attach
        // the subscription; the event is still logged in payment_events
        // for manual reconciliation.
        return;
      }
    } else {
      // Without a user id (and without a signup email) we cannot attach
      // the subscription; the event is still logged in payment_events
      // for manual reconciliation.
      return;
    }
  }

  // Item 5: this user already has a DIFFERENT live subscription —
  // this one is a duplicate. Cancel and refund it at Stripe and
  // record it as canceled, never as a second live plan.
  if (isLiveStatus(row.status)) {
    const { data: otherSubs } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", row.user_id)
      .neq("stripe_subscription_id", subscription.id)
      .in("status", [...LIVE_SUBSCRIPTION_STATUSES])
      .limit(1);
    if (otherSubs && otherSubs.length > 0) {
      await cancelDuplicateSubscription(stripe, subscription);
      row.status = "canceled";
    }
  }

  const { error: subError } = await admin
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });
  if (subError) {
    throw new Error(
      `subscriptions upsert failed for subscription ${subscription.id}: ${subError.message}`
    );
  }
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
  const { error: logError } = await admin.from("payment_events").upsert(
    {
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
    },
    { onConflict: "stripe_event_id", ignoreDuplicates: true }
  );
  if (logError) {
    console.error(
      `[stripe-webhook] payment_events log failed for event ${event.id} (${event.type}): ${logError.message}`
    );
    return NextResponse.json({ error: "event_log_failed" }, { status: 500 });
  }

  try {
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
        await syncSubscription(admin, subscription, stripe);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(admin, subscription, stripe);
      // A canceled subscription must also cancel its pay-first
      // claim row. syncSubscription writes claims only on the
      // no-user path, so once a claim has been claimed (user id
      // stamped) a later cancel would otherwise leave the claim
      // 'active' forever — verified defect, 2026-11-22 sandbox
      // test cleanup. This update matches on the subscription id
      // regardless of the claim's claimed state.
      if (
        event.type === "customer.subscription.deleted" ||
        subscription.status === "canceled"
      ) {
        const { error: claimCancelError } = await admin
          .from("subscription_claims")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        if (claimCancelError) {
          throw new Error(
            `subscription_claims cancel-sync failed for subscription ${subscription.id}: ${claimCancelError.message}`
          );
        }
      }
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
        await syncSubscription(admin, subscription, stripe);
      }
      break;
    }
    default:
      break;
    }
  } catch (err) {
    console.error(
      `[stripe-webhook] sync failed for event ${event.id} (${event.type}): ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return NextResponse.json({ error: "sync_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
