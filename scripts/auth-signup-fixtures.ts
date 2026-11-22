// ============================================================================
// Pay-before-account — acceptance fixtures for the pure claim
// eligibility decision (lib/auth/claim-eligibility.ts) behind
// POST /api/auth/signup.
//
// The owner's rule: no account exists before payment. These fixtures
// pin the decision for every claim/Stripe combination the route can
// meet: nothing parked → deny; already claimed → deny (the account
// exists; never duplicate); dead stored claim → deny; live Stripe
// status is the authority over a stale stored row; "incomplete" is
// allowed on BOTH sides (checkout completed, first payment still
// processing — creation allowed, while the attach step stays
// active/trialing-only per lib/pay-first.ts's isClaimableStatus);
// an unverifiable live status never creates an account.
//
// Run (from the repo root):
//   npx tsx scripts/auth-signup-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  evaluateClaimEligibility,
  type ClaimRowLike,
} from "../lib/auth/claim-eligibility";

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

const claim = (over: Partial<NonNullable<ClaimRowLike>>): ClaimRowLike => ({
  status: "active",
  claimed_user_id: null,
  ...over,
});

// --- Deny: nothing to attach a payment to -------------------------------
check("no claim row → deny no_claim", evaluateClaimEligibility(null, null), {
  allow: false,
  reason: "no_claim",
});
check(
  "undefined claim → deny no_claim",
  evaluateClaimEligibility(undefined, "active"),
  { allow: false, reason: "no_claim" }
);

// --- Deny: the account already exists ------------------------------------
check(
  "already claimed → deny already_claimed",
  evaluateClaimEligibility(
    claim({ claimed_user_id: "2de6534a-0000-0000-0000-000000000000" }),
    "active"
  ),
  { allow: false, reason: "already_claimed" }
);
check(
  "already claimed wins over a dead stripe status",
  evaluateClaimEligibility(
    claim({ claimed_user_id: "2de6534a-0000-0000-0000-000000000000" }),
    "canceled"
  ),
  { allow: false, reason: "already_claimed" }
);

// --- Deny: stored claim is a dead payment --------------------------------
check(
  "claim canceled → deny claim_not_payable",
  evaluateClaimEligibility(claim({ status: "canceled" }), "active"),
  { allow: false, reason: "claim_not_payable" }
);
check(
  "claim unpaid → deny claim_not_payable",
  evaluateClaimEligibility(claim({ status: "unpaid" }), "active"),
  { allow: false, reason: "claim_not_payable" }
);
check(
  "claim past_due → deny claim_not_payable",
  evaluateClaimEligibility(claim({ status: "past_due" }), "active"),
  { allow: false, reason: "claim_not_payable" }
);

// --- Allow: live claim, live Stripe status --------------------------------
check(
  "active claim + stripe active → allow",
  evaluateClaimEligibility(claim({ status: "active" }), "active"),
  { allow: true }
);
check(
  "trialing claim + stripe trialing → allow",
  evaluateClaimEligibility(claim({ status: "trialing" }), "trialing"),
  { allow: true }
);
check(
  "incomplete claim + stripe incomplete → allow (payment processing)",
  evaluateClaimEligibility(claim({ status: "incomplete" }), "incomplete"),
  { allow: true }
);
check(
  "incomplete claim + stripe active → allow (payment landed since parking)",
  evaluateClaimEligibility(claim({ status: "incomplete" }), "active"),
  { allow: true }
);

// --- Deny: Stripe is the authority over a stale stored row ----------------
check(
  "active claim + stripe canceled → deny stripe_not_payable",
  evaluateClaimEligibility(claim({ status: "active" }), "canceled"),
  { allow: false, reason: "stripe_not_payable" }
);
check(
  "active claim + stripe unpaid → deny stripe_not_payable",
  evaluateClaimEligibility(claim({ status: "active" }), "unpaid"),
  { allow: false, reason: "stripe_not_payable" }
);
check(
  "trialing claim + stripe past_due → deny stripe_not_payable",
  evaluateClaimEligibility(claim({ status: "trialing" }), "past_due"),
  { allow: false, reason: "stripe_not_payable" }
);

// --- Deny: the live check could not be completed ---------------------------
check(
  "active claim + stripe unverifiable → deny stripe_unverifiable",
  evaluateClaimEligibility(claim({ status: "active" }), null),
  { allow: false, reason: "stripe_unverifiable" }
);

console.log(
  failures === 0
    ? "\nALL AUTH-SIGNUP FIXTURES PASS"
    : `\n${failures} AUTH-SIGNUP FIXTURE(S) FAILED`
);
process.exit(failures === 0 ? 0 : 1);
