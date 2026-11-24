// ============================================================================
// Cancellation — acceptance fixtures for trust queue #4 (owner order
// 2026-11-23, policy decided by the owner the same day): "No refund"
// was the owner's FIRST answer and stands; the later 7-day tap was
// reversed by his explicit "No refund" — the LAST confirmed order
// governs.
//
// The rules pinned here:
//  - The policy sentence is identical on the three surfaces a
//    customer reads before and after paying: Pricing, Settings
//    Plan & billing, and the signed-in Support page (which also
//    says how to cancel).
//  - Cancellation is cancel-at-period-end ONLY: the routes set or
//    clear cancel_at_period_end on the caller's OWN live Stripe
//    subscription (session-derived user id, live-row scoping) and
//    sync the local row in the same request. There is NO refund
//    path anywhere in the billing routes or the Settings controls.
//  - Display state is one pure mapping (lib/billing.planState):
//    live + flag → cancelling(date); live → active; anything else
//    → ended; no row → none.
//  - The gate admits exactly the states the policy admits: active
//    and cancelling (access until the period ends) are in; ended
//    is out. The webhook's refund/dispute handling is knowingly
//    ABSENT (a separate, unauthorized package owns that gap) —
//    pinned here so the absence is a recorded fact, not a drift.
//
// Run (from the repo root):
//   npx tsx scripts/cancel-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { planState, planStateAdmits } from "../lib/billing";
import { GATED_PREFIXES, SUBSCRIBED_STATUSES } from "../lib/gate-paths";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`PASS ${label}`);
  } else {
    failures += 1;
    console.log(`FAIL ${label}\n  expected: ${e}\n  actual:   ${a}`);
  }
}

const read = (p: string) => readFileSync(p, "utf8");

const POLICY =
  "No refunds. You can cancel anytime — your plan stays active until the end of the current paid period and won't renew.";
const END = "2026-12-24T00:00:00.000Z";

/* ---------------- planState: the display mapping ----------------- */

check("planState: no row → none", planState(null), { kind: "none" });
check(
  "planState: active, renewing → active",
  planState({ status: "active", cancel_at_period_end: false, current_period_end: END }),
  { kind: "active" }
);
check(
  "planState: trialing, renewing → active",
  planState({ status: "trialing", cancel_at_period_end: false, current_period_end: END }),
  { kind: "active" }
);
check(
  "planState: active + cancel flag → cancelling with the period-end date",
  planState({ status: "active", cancel_at_period_end: true, current_period_end: END }),
  { kind: "cancelling", endsOn: END }
);
check(
  "planState: trialing + cancel flag → cancelling",
  planState({ status: "trialing", cancel_at_period_end: true, current_period_end: END }),
  { kind: "cancelling", endsOn: END }
);
check(
  "planState: cancel flag but no period end on file → cancelling, date null",
  planState({ status: "active", cancel_at_period_end: true, current_period_end: null }),
  { kind: "cancelling", endsOn: null }
);
check(
  "planState: canceled → ended (even if a stale cancel flag lingers)",
  planState({ status: "canceled", cancel_at_period_end: true, current_period_end: END }),
  { kind: "ended" }
);
check(
  "planState: past_due → ended",
  planState({ status: "past_due", cancel_at_period_end: false, current_period_end: END }),
  { kind: "ended" }
);
check(
  "planState: unpaid → ended",
  planState({ status: "unpaid", cancel_at_period_end: false, current_period_end: END }),
  { kind: "ended" }
);
check(
  "planState: incomplete → ended",
  planState({ status: "incomplete", cancel_at_period_end: false, current_period_end: null }),
  { kind: "ended" }
);
check(
  "planState: missing status → ended",
  planState({ status: null, cancel_at_period_end: false, current_period_end: null }),
  { kind: "ended" }
);

/* ---------------- gate admission per state ----------------------- */

check(
  "gate: the admitted statuses are exactly active + trialing",
  [...SUBSCRIBED_STATUSES],
  ["active", "trialing"]
);
check(
  "gate: every admitted status maps to an admitted plan state, flag on or off",
  [...SUBSCRIBED_STATUSES].flatMap((status) =>
    [false, true].map((flag) =>
      planStateAdmits(
        planState({ status, cancel_at_period_end: flag, current_period_end: END })
      )
    )
  ),
  [true, true, true, true]
);
check(
  "gate: ended and none are denied",
  [
    planStateAdmits(planState({ status: "canceled", cancel_at_period_end: false, current_period_end: END })),
    planStateAdmits(planState(null)),
  ],
  [false, false]
);
check(
  "gate: /api/billing is in the middleware gate list",
  (GATED_PREFIXES as readonly string[]).includes("/api/billing"),
  true
);

/* ---------------- policy copy: three surfaces -------------------- */

const pricing = read("app/pricing/page.tsx");
const settings = read("app/settings/page.tsx");
const supportClient = read("app/support/SupportClient.tsx");

check("policy: the exact sentence ships on Pricing", pricing.includes(POLICY), true);
check("policy: the exact sentence ships in Settings Plan & billing", settings.includes(POLICY), true);
check("policy: the exact sentence ships on signed-in Support", supportClient.includes(POLICY), true);
check(
  "policy: Support names the section and the cancel path",
  supportClient.includes("Cancelling and refunds") &&
    supportClient.includes("Settings → Plan & billing → Cancel plan"),
  true
);
check(
  "settings: the plan panel is titled Plan & billing",
  settings.includes("Plan &amp; billing"),
  true
);

/* ---------------- Settings controls ------------------------------ */

const billing = read("components/SettingsBilling.tsx");
check(
  "settings: the billing controls are wired to both routes",
  billing.includes('"/api/billing/cancel"') && billing.includes('"/api/billing/resume"'),
  true
);
check(
  "settings: the confirm step states the consequences with the real date",
  billing.includes("stays active until") &&
    billing.includes("won't renew and access ends") &&
    billing.includes("No refund is given for the current period."),
  true
);
check(
  "settings: confirm offers Keep my plan / Cancel my plan",
  billing.includes("Keep my plan") && billing.includes("Cancel my plan"),
  true
);
check(
  "settings: cancelling state shows Cancels on + Resume plan",
  billing.includes("Cancels on") && billing.includes("Resume plan"),
  true
);
check(
  "settings: the page renders the controls only for a live plan state",
  settings.includes("SettingsBilling") &&
    settings.includes('planState(sub).kind === "active"') &&
    settings.includes('planState(sub).kind === "cancelling"'),
  true
);
check(
  "settings: the page reads cancel_at_period_end off the row (no live Stripe read)",
  settings.includes("cancel_at_period_end") && !settings.includes("getStripe"),
  true
);
check(
  "settings: period-end dates format in UTC on both the page and the billing controls (battAR: Dec 23 vs Dec 24 split)",
  settings.includes('timeZone: "UTC"') && billing.includes('timeZone: "UTC"'),
  true
);

/* ---------------- the routes -------------------------------------- */

const cancelRoute = read("app/api/billing/cancel/route.ts");
const resumeRoute = read("app/api/billing/resume/route.ts");
const billingServer = read("lib/billing-server.ts");

check(
  "routes: both stand behind the member gate (401/403 pattern)",
  [cancelRoute, resumeRoute].map(
    (r) => r.includes("getGateState") && r.includes("401") && r.includes("403")
  ),
  [true, true]
);
check(
  "routes: cancel sets the flag, resume clears it",
  cancelRoute.includes("setCancelAtPeriodEnd(owner.userId, true)") &&
    resumeRoute.includes("setCancelAtPeriodEnd(owner.userId, false)"),
  true
);
check(
  "routes: the Stripe call is cancel_at_period_end on the row's own subscription",
  billingServer.includes("stripe.subscriptions.update") &&
    billingServer.includes("cancel_at_period_end: cancel") &&
    billingServer.includes("row.stripe_subscription_id"),
  true
);
check(
  "routes: the row lookup is scoped to the caller AND a live status",
  billingServer.includes('.eq("user_id", userId)') &&
    billingServer.includes("SUBSCRIBED_STATUSES"),
  true
);
check(
  "routes: the local row is synced in the same request, scoped by id + user",
  billingServer.includes("createAdminClient") &&
    billingServer.includes('.eq("id", row.id)') &&
    billingServer.includes("cancel_at_period_end: updated.cancel_at_period_end"),
  true
);
check(
  "routes: no refund path exists in the billing mechanic",
  [cancelRoute, resumeRoute, billingServer, billing].map((s) =>
    /refunds\.create|stripe\.refunds|payment_intents.*refund/i.test(s)
  ),
  [false, false, false, false]
);

/* ---------------- webhook sync (existing, verified) --------------- */

const webhook = read("app/api/stripe/webhook/route.ts");
check(
  "webhook: subscription created/updated/deleted all sync through one path",
  webhook.includes('case "customer.subscription.created"') &&
    webhook.includes('case "customer.subscription.updated"') &&
    webhook.includes('case "customer.subscription.deleted"') &&
    webhook.includes("cancel_at_period_end: subscription.cancel_at_period_end"),
  true
);
check(
  "webhook: refund/dispute handling is knowingly absent (separate package owns it)",
  webhook.includes("charge.refunded") || webhook.includes("charge.dispute"),
  false
);

/* ---------------- standing rules ---------------------------------- */

check(
  "standing rule: the rate limiter is untouched",
  createHash("md5").update(read("lib/rate-limit.ts")).digest("hex"),
  "17bac7184f8c9a015891e0287df539de"
);

if (failures > 0) {
  console.log(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll cancellation assertions passed.");
