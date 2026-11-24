import { SUBSCRIBED_STATUSES } from "@/lib/gate-paths";

/** Plan display state (trust queue #4 — cancellation, owner order
 *  2026-11-23). Pure mapping from the member's own subscriptions
 *  row to what Settings shows and offers. No server imports, so
 *  fixtures and client components can use it directly.
 *
 *  The owner's policy, and the only states it needs:
 *   - "active": a live (active/trialing) row that will renew.
 *   - "cancelling": a live row with cancel_at_period_end set —
 *     still fully admitted by the gate until the period ends,
 *     then access ends. Carries the period-end date.
 *   - "ended": a row exists but is not live (canceled, past_due,
 *     unpaid, incomplete) — the gate denies it.
 *   - "none": no subscription row at all.
 *
 *  Stripe keeps the subscription's status "active" while a
 *  cancel-at-period-end is pending and only sends
 *  customer.subscription.deleted when the period actually ends,
 *  and the webhook mirrors both facts onto the row (status +
 *  cancel_at_period_end) — so this mapping reads the row alone,
 *  never a live Stripe call. */

export interface SubscriptionRowLike {
  status: string | null;
  cancel_at_period_end: boolean | null;
  current_period_end: string | null;
}

export type PlanState =
  | { kind: "none" }
  | { kind: "active" }
  | { kind: "cancelling"; endsOn: string | null }
  | { kind: "ended" };

export function planState(
  row: SubscriptionRowLike | null | undefined
): PlanState {
  if (!row) return { kind: "none" };
  const live = (SUBSCRIBED_STATUSES as readonly string[]).includes(
    row.status ?? ""
  );
  if (!live) return { kind: "ended" };
  if (row.cancel_at_period_end) {
    return { kind: "cancelling", endsOn: row.current_period_end ?? null };
  }
  return { kind: "active" };
}

/** The gate's rule, stated once for fixtures and copy: a member is
 *  admitted exactly while their plan state is active or cancelling
 *  (cancel-at-period-end keeps access until the period ends — that
 *  IS the cancellation policy). Mirrors lib/gate.ts, which admits
 *  on the same SUBSCRIBED_STATUSES this module maps from. */
export function planStateAdmits(state: PlanState): boolean {
  return state.kind === "active" || state.kind === "cancelling";
}
