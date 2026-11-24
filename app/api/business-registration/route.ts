import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimitShared } from "@/lib/rate-limit";
import {
  isBusinessAccountType,
  validateBusinessFields,
  validateBusinessRegistration,
} from "@/lib/business-registration";

/** Business registration — Brand & Agency accounts (v1, 2026-11-24).
 *
 *  POST creates a business account. Unlike creator sign-up there is
 *  NO payment step: v1 business registration is free, creates no
 *  Stripe object and no public.subscriptions row — which is exactly
 *  why the subscription gate never admits a business account into
 *  the creator app. The route:
 *    1. Validates the whole submission with the shared pure module
 *       (lib/business-registration.ts) — the same rules the form
 *       runs client-side.
 *    2. Throttles creation attempts through the shared rate limiter.
 *    3. Creates the auth user through the Supabase ADMIN API with
 *       email_confirm: true (same pattern as the pay-first creator
 *       route; the handle_new_user trigger creates the profiles
 *       row as 'creator').
 *    4. Marks the profile with the real account_type and inserts
 *       the business_profiles row. If either write fails, the auth
 *       user is deleted again — a half-registered business account
 *       is never left behind.
 *  An email that already has an account gets 409 — sign in instead;
 *  a duplicate is never created.
 *
 *  PATCH updates the signed-in business account's own
 *  business_profiles row (the business-home edit form). It runs as
 *  the session user, so the table's own-row RLS policies are the
 *  enforcement; the route additionally refuses creator accounts.
 *
 *  The route lives at /api/business-registration — NOT under
 *  /api/business, which is a subscription-gated prefix (the creator
 *  Business Health API) in lib/gate-paths.ts. */
const REGISTER_RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 } as const;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const input = (body ?? {}) as Record<string, unknown>;

  const validation = validateBusinessRegistration(input);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "validation_failed", fields: validation.errors },
      { status: 400 }
    );
  }
  const v = validation.value;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const withinLimit = await checkRateLimitShared(
    `business-register:${ip}:${v.workEmail}`,
    REGISTER_RATE_LIMIT.limit,
    REGISTER_RATE_LIMIT.windowMs
  );
  if (!withinLimit) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const admin = createAdminClient();

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: v.workEmail,
      password: v.password,
      email_confirm: true,
      user_metadata: { full_name: v.contactName },
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
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
  const userId = created.user.id;

  // The trigger-created profiles row starts as 'creator'; stamp the
  // real type, then write the business facts. Either failure rolls
  // the whole registration back by deleting the auth user (which
  // cascades to both rows).
  const { error: profileError } = await admin
    .from("profiles")
    .update({ account_type: v.accountType })
    .eq("id", userId);
  const { error: businessError } = profileError
    ? { error: profileError }
    : await admin.from("business_profiles").insert({
        user_id: userId,
        account_type: v.accountType,
        company_name: v.companyName,
        website: v.website,
        contact_name: v.contactName,
        contact_email: v.workEmail,
        category: v.category,
        city: v.city,
        country: v.country,
        company_size: v.companySize,
        looking_for: v.lookingFor,
        description: v.description || null,
      });
  if (profileError || businessError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  return NextResponse.json({ created: true, accountType: v.accountType });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();
  const accountType = (profile as { account_type?: string } | null)
    ?.account_type;
  if (!isBusinessAccountType(accountType)) {
    return NextResponse.json({ error: "not_business" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const validation = validateBusinessFields(
    accountType,
    (body ?? {}) as Record<string, unknown>
  );
  if (!validation.ok) {
    return NextResponse.json(
      { error: "validation_failed", fields: validation.errors },
      { status: 400 }
    );
  }
  const v = validation.value;

  const { error } = await supabase
    .from("business_profiles")
    .update({
      company_name: v.companyName,
      website: v.website,
      contact_name: v.contactName,
      category: v.category,
      city: v.city,
      country: v.country,
      company_size: v.companySize,
      looking_for: v.lookingFor,
      description: v.description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ updated: true });
}
