import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SubscribeButton from "@/components/SubscribeButton";
import PayFirstButton from "@/components/PayFirstButton";
import type { Plan } from "@/lib/types";

export const dynamic = "force-dynamic";

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
        Recurring subscription. Cancel anytime. Paid features unlock only
        after Stripe confirms payment server-side.
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
              <p style={{ fontSize: 30, margin: "8px 0" }}>
                ${Number(plan.price_monthly)}
                <span style={{ fontSize: 15, color: "#b3a6e0" }}> / month</span>
              </p>
              {plan.price_yearly != null && (
                <p style={{ color: "#b3a6e0", fontSize: 14 }}>
                  or ${Number(plan.price_yearly)} / year
                </p>
              )}
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
      <p style={{ marginTop: 32, color: "#b3a6e0", fontSize: 14 }}>
        Questions, or a problem with billing?{" "}
        <Link href="/support">Contact support</Link>
      </p>
    </div>
  );
}
