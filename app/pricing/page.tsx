import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SubscribeButton from "@/components/SubscribeButton";
import PayFirstButton from "@/components/PayFirstButton";
import type { Plan } from "@/lib/types";

export const dynamic = "force-dynamic";

/* Who each plan is for — positioning only. The code grants every
 * active subscription the complete platform (lib/gate.ts checks for
 * ANY live subscription; nothing is feature-gated by tier), so the
 * plans table's features list states exactly that, identically for
 * all three plans, and this page says so plainly below the grid. */
const WHO_ITS_FOR: Record<string, string> = {
  starter: "For creators organizing their first brand partnerships",
  pro: "For creators actively earning from brand partnerships",
  elite: "For established creators running partnerships at volume",
};

/** Subscription plans, read from the plans table (seeded by schema.sql).
 *  Checkout runs through Stripe; access is never unlocked from a
 *  browser redirect alone — only the verified Stripe webhook grants it. */
export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("price_monthly");
  const plans = (data ?? []) as Plan[];

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>Plans for every stage of your creator business</h1>
      <p style={{ textAlign: "center", color: "#ddd0ff" }}>
        Recurring subscription. Cancel anytime. Your plan activates as
        soon as your payment is confirmed.
      </p>
      {plans.length === 0 ? (
        <p style={{ textAlign: "center", color: "#b3a6e0" }}>
          Plans are being set up — run <code>supabase/schema.sql</code> to seed
          Starter, Pro and Elite.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginTop: 32,
          }}
        >
          {plans.map((plan) => (
            <article
              key={plan.id}
              style={{ border: "1px solid #3d2a6e", background: "#1b123d", borderRadius: 12, padding: 22 }}
            >
              <h2 style={{ marginTop: 0 }}>{plan.name}</h2>
              {WHO_ITS_FOR[plan.slug] && (
                <p style={{ color: "#f0abfc", fontSize: 14.5, margin: "0 0 4px", fontWeight: 700 }}>
                  {WHO_ITS_FOR[plan.slug]}
                </p>
              )}
              <p style={{ fontSize: 30, margin: "8px 0" }}>
                ${Number(plan.price_monthly).toFixed(2)}
                <span style={{ fontSize: 15, color: "#b3a6e0" }}> / month</span>
              </p>
              {/* No yearly line: no yearly Stripe price exists for any
                  plan, so nothing can actually be bought yearly —
                  monthly is the only real offer. */}
              <ul>
                {(plan.features ?? []).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {user ? (
                <SubscribeButton
                  planSlug={plan.slug}
                  planName={plan.name}
                  signedIn
                />
              ) : (
                <PayFirstButton planSlug={plan.slug} planName={plan.name} />
              )}
            </article>
          ))}
        </div>
      )}
      {plans.length > 0 && (
        <p style={{ textAlign: "center", color: "#ddd0ff", marginTop: 24, fontSize: 15 }}>
          {"No refunds. You can cancel anytime — your plan stays active until the end of the current paid period and won't renew."}
        </p>
      )}
      {plans.length > 0 && (
        <p style={{ textAlign: "center", color: "#ddd0ff", marginTop: 24, fontSize: 15 }}>
          Every plan unlocks the complete UltraVestra platform — no tool
          is held back by tier. Pick the plan that matches the stage of
          your creator business; you can switch or cancel anytime.
        </p>
      )}
      <p style={{ marginTop: 32, color: "#b3a6e0", fontSize: 14 }}>
        Questions, or a problem with billing?{" "}
        <Link href="/support">Contact support</Link>
      </p>
      <p style={{ marginTop: 16, color: "#b3a6e0", fontSize: 14 }}>
        Are you a brand or an agency?{" "}
        <Link href="/business/register">
          Register your business — free, no plan needed
        </Link>
      </p>
    </div>
  );
}
