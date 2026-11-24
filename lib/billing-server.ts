import { createClient } from "@/lib/supabase/server";
import { createAdminClient, getStripe } from "@/lib/stripe";
import { SUBSCRIBED_STATUSES } from "@/lib/gate-paths";
import { mapSubscriptionStatus } from "@/lib/pay-first";
import { planState, type PlanState } from "@/lib/billing";

/** Server side of self-serve cancellation (trust queue #4).
 *  Sets or clears cancel_at_period_end on the caller's OWN live
 *  Stripe subscription, then syncs the local subscriptions row in
 *  the same request so Settings tells the truth immediately; the
 *  Stripe webhook (customer.subscription.updated) writes the same
 *  fields when the event lands, so the two writers cannot drift.
 *
 *  Which row: the caller's live row only — the query is scoped to
 *  the session's user_id AND a gate status (active/trialing), the
 *  same row the Settings page prefers. The Stripe call uses that
 *  row's own stripe_subscription_id; nothing in the request body
 *  can name another subscription.
 *
 *  The row write goes through the service-role client because
 *  public.subscriptions is backend-write only by policy (the
 *  webhook is the standing writer); the update is scoped by row
 *  id AND user_id, so it can only ever touch the caller's row.
 *
 *  There is deliberately NO refund path here: the owner's policy
 *  is no refunds, and cancel-at-period-end is the whole mechanic. */

export type BillingActionResult =
  | {
      ok: true;
      state: PlanState;
      status: string;
      cancelAtPeriodEnd: boolean;
      currentPeriodEnd: string | null;
    }
  | { ok: false; status: number; error: string };

export async function setCancelAtPeriodEnd(
  userId: string,
  cancel: boolean
): Promise<BillingActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, status, cancel_at_period_end, current_period_end, stripe_subscription_id"
    )
    .eq("user_id", userId)
    .in("status", [...SUBSCRIBED_STATUSES])
    .order("updated_at", { ascending: false })
    .limit(1);
  if (error) throw error;

  const row = (data ?? [])[0] as
    | {
        id: string;
        status: string | null;
        cancel_at_period_end: boolean | null;
        current_period_end: string | null;
        stripe_subscription_id: string | null;
      }
    | undefined;

  if (!row?.stripe_subscription_id) {
    return {
      ok: false,
      status: 404,
      error: "No active plan was found on this account.",
    };
  }

  const stripe = getStripe();
  const updated = await stripe.subscriptions.update(
    row.stripe_subscription_id,
    { cancel_at_period_end: cancel }
  );

  const item = updated.items.data[0];
  const synced = {
    status: mapSubscriptionStatus(updated.status),
    cancel_at_period_end: updated.cancel_at_period_end ?? cancel,
    current_period_end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : row.current_period_end,
    updated_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  const { error: syncError } = await admin
    .from("subscriptions")
    .update(synced)
    .eq("id", row.id)
    .eq("user_id", userId);
  if (syncError) throw syncError;

  return {
    ok: true,
    state: planState(synced),
    status: synced.status,
    cancelAtPeriodEnd: synced.cancel_at_period_end,
    currentPeriodEnd: synced.current_period_end,
  };
}
