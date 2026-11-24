import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { setCancelAtPeriodEnd } from "@/lib/billing-server";

export const runtime = "nodejs";

// Resume plan (trust queue #4) — clears cancel_at_period_end on
// the caller's own live Stripe subscription, undoing a cancel
// before the period ends so the plan renews as usual. Same
// isolation and gate pattern as /api/billing/cancel: the caller's
// id comes from the session, never from the request, and the
// subscription acted on is the caller's own live row (see
// lib/billing-server.ts).

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to manage your plan."
              : "An active subscription is required to manage your plan.",
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
        { error: "Please log in to manage your plan." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, userId: user.id };
}

export async function POST() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  try {
    const result = await setCancelAtPeriodEnd(owner.userId, false);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json({
      success: true,
      state: result.state,
      status: result.status,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
      currentPeriodEnd: result.currentPeriodEnd,
    });
  } catch (e) {
    console.error("Plan resume error:", e);
    return Response.json(
      { error: "Your plan could not be updated. Please try again." },
      { status: 500 }
    );
  }
}
