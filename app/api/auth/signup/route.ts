import { NextResponse } from "next/server";
import { createAdminClient, getStripe } from "@/lib/stripe";
import {
  isValidEmailShape,
  mapSubscriptionStatus,
  normalizeEmail,
} from "@/lib/pay-first";
import {
  evaluateClaimEligibility,
  SIGNUP_CLAIM_STATUSES,
} from "@/lib/auth/claim-eligibility";
import { attachPayFirstClaim } from "@/lib/pay-first-attach";
import { checkRateLimitShared } from "@/lib/rate-limit";

/** Pay-before-account sign-up — the ONLY way a new account is
 *  created (owner's order: no account exists before payment).
 *
 *  The client form posts {email, password} here instead of calling
 *  supabase.auth.signUp itself. This route:
 *    1. Looks up the webhook-parked claim in
 *       public.subscription_claims for the normalized email. No
 *       live claim → 403 payment_required and NOTHING is created.
 *    2. Re-verifies the subscription's live status with Stripe
 *       (same pattern as lib/pay-first-attach.ts): a claim whose
 *       subscription has since died never creates an account.
 *    3. Creates the user through the Supabase ADMIN API with
 *       email_confirm: true (email confirmation is OFF for this
 *       project, and the payment is the verification).
 *    4. Runs the shared claim-attach helper; the Stripe webhook
 *       remains the only writer of public.subscriptions.
 *
 *  An email that already has an account gets 409 — sign in instead;
 *  a duplicate is never created. Creation attempts are throttled
 *  through the shared (fail-closed) rate limiter keyed by IP +
 *  email; the eligibility refusal happens before the limiter so a
 *  claimless email is always a plain 403.
 *
 *  ROLLOUT ORDER (do not reorder): this route must be live AND its
 *  positive path proven with a fresh test payment BEFORE the
 *  Supabase "Allow new users to sign up" setting is turned OFF —
 *  flipping the setting first would break the legacy path while the
 *  new one is still unproven. */
const SIGNUP_RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 } as const;

/** The password minimum that governed the old client signUp: the
 *  form itself set no explicit minimum beyond `required`, so the
 *  effective floor was Supabase's own 6-character default. Kept
 *  identical here so the rule does not change with the route. */
const PASSWORD_MIN_LENGTH = 6;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { email: rawEmail, password } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
  };
  if (typeof rawEmail !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const email = normalizeEmail(rawEmail);
  if (!isValidEmailShape(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json(
      { error: "password_too_short" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // 1–2. Claim lookup + live Stripe re-verification. Following the
  // attach helper's pattern, a lookup error reads as "no claim":
  // the failure direction is closed (nothing is created), never open.
  const { data: claim } = await admin
    .from("subscription_claims")
    .select("id, stripe_subscription_id, status, claimed_user_id")
    .eq("email", email)
    .maybeSingle();

  let stripeStatus: string | null = null;
  if (
    claim &&
    !claim.claimed_user_id &&
    (SIGNUP_CLAIM_STATUSES as readonly string[]).includes(claim.status)
  ) {
    try {
      const subscription = await getStripe().subscriptions.retrieve(
        claim.stripe_subscription_id
      );
      stripeStatus = mapSubscriptionStatus(subscription.status);
    } catch {
      stripeStatus = null;
    }
  }

  const eligibility = evaluateClaimEligibility(claim, stripeStatus);
  if (!eligibility.allow) {
    if (eligibility.reason === "already_claimed") {
      return NextResponse.json(
        { error: "account_exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "payment_required" },
      { status: 403 }
    );
  }

  // Throttle actual creation attempts (shared limiter, fail-closed).
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const withinLimit = await checkRateLimitShared(
    `signup:${ip}:${email}`,
    SIGNUP_RATE_LIMIT.limit,
    SIGNUP_RATE_LIMIT.windowMs
  );
  if (!withinLimit) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429 }
    );
  }

  // 3. Create the user via the admin API.
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (createError || !created?.user) {
    if (
      createError?.message.toLowerCase().includes("already") ||
      createError?.code === "email_exists"
    ) {
      return NextResponse.json(
        { error: "account_exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "create_failed" },
      { status: 500 }
    );
  }

  // 4. Attach the parked claim (best-effort inside the helper; a
  // false result retries on the user's next sign-in).
  const attached = await attachPayFirstClaim({
    id: created.user.id,
    email: created.user.email ?? email,
  });

  return NextResponse.json({ created: true, attached });
}
