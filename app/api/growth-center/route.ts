import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { SUBSCRIBED_STATUSES } from "@/lib/gate-paths";
import { buildOverview, type AccountLike } from "@/lib/growth-center/aggregate";
import type { RevenueEntryLike, RevenueEstimateLike } from "@/lib/revenue/summary";
import type { PostLike } from "@/lib/posts/summary";
import type { RevenueKind } from "@/lib/revenue/summary";

export const runtime = "nodejs";

// Creator Growth Center — the hub's read model plus the one write
// that belongs to the foundation layer: the creator's own username.
//
// ISOLATION (binding): every query below runs through the session
// client (lib/supabase/server), so each table's RLS own-row
// policies apply, AND every query is additionally scoped to the
// caller's user_id in code. The caller's id comes from the session
// (auth.getUser) — never from the request. There is no parameter
// anywhere in this route that could name another creator.
//
// HONESTY RULE (binding): the overview is shaped by
// lib/growth-center/aggregate.ts from the caller's own rows only.
// Social metrics have no Phase 1 source and are returned as an
// explicit not-connected state. Estimates are returned in their own
// field, computed from estimate rows only, and are never merged
// into recorded earnings.
//
// Gate pattern identical to the other member API routes: no
// session → 401, no active/trialing subscription → 403, enforced
// here AND by the middleware via lib/gate-paths.ts.

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use your Creator Growth Center."
              : "An active subscription is required to use your Creator Growth Center.",
        },
        { status: gate === "login" ? 401 : 403 }
      ),
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "Please log in to use your Creator Growth Center." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

function loadError() {
  return Response.json(
    { error: "Your Growth Center could not be loaded. Please try again." },
    { status: 500 }
  );
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;
  const { supabase, userId } = owner;

  const [
    profileRes,
    creatorProfileRes,
    subscriptionsRes,
    revenueRes,
    estimatesRes,
    postsRes,
    prefsRes,
    connectionsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("creator_profiles")
      .select("username")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, plan_id, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("revenue_entries")
      .select("brand_name, amount_cents, status, earned_date, kind")
      .eq("user_id", userId),
    supabase
      .from("revenue_estimates")
      .select("platform, amount_cents, period_month, basis")
      .eq("user_id", userId),
    supabase
      .from("creator_posts")
      .select("platform, posted_date, source")
      .eq("user_id", userId),
    supabase
      .from("growth_prefs")
      .select("weekly_post_goal")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("social_connections")
      .select("platform, handle, status")
      .eq("user_id", userId),
  ]);

  const failed = [
    profileRes,
    creatorProfileRes,
    subscriptionsRes,
    revenueRes,
    estimatesRes,
    postsRes,
    prefsRes,
    connectionsRes,
  ].find((r) => r.error);
  if (failed?.error) {
    console.error("Growth Center load error:", failed.error);
    return loadError();
  }

  // Member status + plan from the caller's OWN subscription rows —
  // the same table the gate reads. Prefer an active/trialing row;
  // otherwise show the most recent row's true status. The plan name
  // comes from public.plans via the subscription's plan_id; a
  // subscription with no plan (e.g. the owner's comp) shows none.
  const subscriptions = (subscriptionsRes.data ?? []) as {
    status: string;
    plan_id: string | null;
    updated_at: string;
  }[];
  const current =
    subscriptions.find((s) =>
      (SUBSCRIBED_STATUSES as readonly string[]).includes(s.status)
    ) ?? subscriptions[0];
  let planName: string | null = null;
  if (current?.plan_id) {
    const { data: plan } = await supabase
      .from("plans")
      .select("name")
      .eq("id", current.plan_id)
      .maybeSingle();
    planName = (plan?.name as string | undefined) ?? null;
  }

  const profile = profileRes.data as {
    full_name: string | null;
    email: string | null;
  } | null;

  const account: AccountLike = {
    name: profile?.full_name ?? null,
    email: profile?.email ?? null,
    username:
      (creatorProfileRes.data as { username: string | null } | null)
        ?.username ?? null,
    memberStatus: current?.status ?? "none",
    planName,
  };

  const overview = buildOverview({
    account,
    revenueEntries: (revenueRes.data ?? []) as (RevenueEntryLike & {
      kind?: RevenueKind;
    })[],
    estimates: (estimatesRes.data ?? []) as RevenueEstimateLike[],
    posts: (postsRes.data ?? []) as PostLike[],
    weeklyGoal:
      (prefsRes.data as { weekly_post_goal: number } | null)
        ?.weekly_post_goal ?? 5,
    connections: (connectionsRes.data ?? []) as {
      platform: string;
      handle: string | null;
      status: string;
    }[],
  });

  return Response.json({ success: true, overview });
}

// --- The creator's own username ----------------------------------------------
//
// Usernames are stored lowercase: 3–24 characters of lowercase
// letters, numbers, and underscores (the database carries the same
// check). Setting one upserts the caller's own creator_profiles
// row — those rows are NOT auto-created at signup (the signup
// trigger creates only public.profiles), so the first save creates
// the row, scoped to the session's user id and nothing else.
// Sending an empty username clears it. A name another creator
// holds fails honestly with 409 — a different name is never
// silently assigned.

const UsernameSchema = z.object({
  username: z.string().max(64),
});

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

export async function PATCH(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your username." },
      { status: 400 }
    );
  }

  const parsed = UsernameSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your username." },
      { status: 400 }
    );
  }

  const normalized = parsed.data.username.trim().toLowerCase();
  if (normalized !== "" && !USERNAME_PATTERN.test(normalized)) {
    return Response.json(
      {
        error:
          "Usernames are 3–24 characters: lowercase letters, numbers, and underscores only.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("creator_profiles")
    .upsert(
      {
        user_id: owner.userId,
        username: normalized === "" ? null : normalized,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("username")
    .single();

  if (error) {
    // Postgres unique violation: the name belongs to another
    // creator. Say exactly that.
    if (error.code === "23505") {
      return Response.json(
        { error: "That username is taken. Please choose another." },
        { status: 409 }
      );
    }
    console.error("Growth Center username save error:", error);
    return Response.json(
      { error: "Your username could not be saved. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    username: (data as { username: string | null }).username,
  });
}
