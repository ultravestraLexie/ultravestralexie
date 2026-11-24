import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { setCancelAtPeriodEnd } from "@/lib/billing-server";

export const runtime = "nodejs";

// Cancel plan (trust queue #4) — sets cancel_at_period_end on the
// caller's own live Stripe subscription. The plan stays active
// until the end of the current paid period and does not renew;
// NO refund is issued — that is the owner's stated policy, and
// this route has no refund path at all.
//
// ISOLATION (binding, same as /api/support): the caller's id comes
// from the session, never from the request; the subscription acted
// on is the caller's own live row (see lib/billing-server.ts).
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts covers
// /api/billing).

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
    const result = await setCancelAtPeriodEnd(owner.userId, true);
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
    console.error("Plan cancel error:", e);
    return Response.json(
      { error: "Your plan could not be updated. Please try again." },
      { status: 500 }
    );
  }
}
