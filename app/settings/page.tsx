import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUBSCRIBED_STATUSES } from "@/lib/gate-paths";
import SignOutButton from "@/components/SignOutButton";
import SettingsPrefs from "@/components/SettingsPrefs";

export const dynamic = "force-dynamic";

/* SETTINGS (Build 9b — the owner's standard: functional, not
 * decorative). Account, subscription, support and preferences —
 * every value read live from the member's own rows, every control
 * wired to a real save. Login is required; an active subscription
 * is NOT, so a member whose plan lapses can still reach billing
 * help and support. There is no self-serve billing portal yet, so
 * plan changes and cancellations route honestly to Support instead
 * of a dead button. */

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "linear-gradient(165deg, rgba(46,16,101,0.85), rgba(13,2,33,0.9))",
  borderRadius: 22,
  padding: "22px 24px 24px",
  boxShadow: "0 0 30px rgba(168,85,247,0.20)",
};

/* Plan names and prices are read from the plans table — the same
 * rows the Stripe webhook resolves plan_id against. No hardcoded
 * price list to drift. */

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [subRes, prefsRes, profileRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan_id, status, current_period_end, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("growth_prefs")
      .select("weekly_post_goal")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("creator_profiles")
      .select("username")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  /* A returning subscriber has more than one subscription row
   * (canceled old + live new); maybeSingle errored on that and the
   * page showed no plan at all (found by battZ, 2026-11-23). Mirror
   * the growth-center route: prefer the LIVE row (active/trialing —
   * the gate's statuses); otherwise the most recent row, so a
   * lapsed member still sees their true last status. "Member since"
   * is the EARLIEST row's creation — the account's real start. */
  const subRows = (subRes.data ?? []) as {
    plan_id: string | null;
    status: string | null;
    current_period_end: string | null;
    created_at: string | null;
  }[];
  const sub =
    subRows.find((r) =>
      (SUBSCRIBED_STATUSES as readonly string[]).includes(r.status ?? "")
    ) ??
    subRows[0] ??
    null;
  const memberSince = subRows.reduce<string | null>(
    (earliest, r) =>
      r.created_at && (!earliest || r.created_at < earliest)
        ? r.created_at
        : earliest,
    null
  );
  const weeklyGoal =
    (prefsRes.data as { weekly_post_goal: number } | null)?.weekly_post_goal ?? 5;
  const username =
    (profileRes.data as { username: string | null } | null)?.username ?? "";
  let planName = "Member";
  let planPrice: string | null = null;
  if (sub?.plan_id) {
    const { data: plan } = await supabase
      .from("plans")
      .select("name, price_monthly")
      .eq("id", sub.plan_id)
      .maybeSingle();
    const p = plan as { name: string; price_monthly: number | null } | null;
    if (p?.name) planName = p.name;
    if (p?.price_monthly != null) {
      planPrice = `$${Number(p.price_monthly).toFixed(2)}/month`;
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 860 }}>
      <section>
        <h1 style={{ fontSize: 30, margin: "0 0 6px", fontWeight: 800 }}>Settings</h1>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          Your account, your plan, and the preferences your tools actually use.
        </p>
      </section>

      <section style={panel}>
        <h2 style={{ fontSize: 20, margin: "0 0 14px" }}>Account</h2>
        <p style={{ margin: "0 0 8px", fontSize: 15.5 }}>
          <strong>Email:</strong>{" "}
          <span style={{ color: "#ddd0ff" }}>{user.email}</span>
        </p>
        <p style={{ margin: "0 0 16px", fontSize: 15.5 }}>
          <strong>Member since:</strong>{" "}
          <span style={{ color: "#ddd0ff" }}>{fmtDate(memberSince)}</span>
        </p>
        <span style={{ fontSize: 14.5, color: "#f0abfc", fontWeight: 700 }}>
          <SignOutButton />
        </span>
      </section>

      <section style={panel}>
        <h2 style={{ fontSize: 20, margin: "0 0 14px" }}>Subscription</h2>
        {sub ? (
          <>
            <p style={{ margin: "0 0 8px", fontSize: 15.5 }}>
              <strong>Plan:</strong>{" "}
              <span style={{ color: "#ddd0ff" }}>
                UltraVestra {planName}
                {planPrice ? ` — ${planPrice}` : ""}
              </span>
            </p>
            <p style={{ margin: "0 0 8px", fontSize: 15.5 }}>
              <strong>Status:</strong>{" "}
              <span style={{ color: "#ddd0ff" }}>{sub.status ?? "—"}</span>
            </p>
            <p style={{ margin: "0 0 16px", fontSize: 15.5 }}>
              <strong>Current period ends:</strong>{" "}
              <span style={{ color: "#ddd0ff" }}>{fmtDate(sub.current_period_end)}</span>
            </p>
          </>
        ) : (
          <p style={{ margin: "0 0 16px", color: "#ddd0ff", fontSize: 15.5 }}>
            No subscription is on record for this account yet.
          </p>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href="/pricing"
            style={{
              background: "linear-gradient(92deg, #a855f7, #d946ef)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14.5,
              borderRadius: 999,
              padding: "10px 20px",
              textDecoration: "none",
            }}
          >
            View Plans
          </Link>
          <span style={{ color: "#ddd0ff", fontSize: 14 }}>
            To change or cancel your plan,{" "}
            <Link href="/support" style={{ color: "#67e8f9", fontWeight: 700 }}>
              contact Support
            </Link>{" "}
            and we&rsquo;ll take care of it the same day.
          </span>
        </div>
      </section>

      <section style={panel}>
        <h2 style={{ fontSize: 20, margin: "0 0 14px" }}>Preferences</h2>
        <SettingsPrefs initialGoal={weeklyGoal} initialUsername={username} />
      </section>

      <section style={panel}>
        <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>Support</h2>
        <p style={{ margin: "0 0 12px", color: "#ddd0ff", fontSize: 15 }}>
          Questions about your account, billing or the platform — a person
          answers.
        </p>
        <Link href="/support" style={{ color: "#67e8f9", fontWeight: 700, fontSize: 15 }}>
          Open Help &amp; Support →
        </Link>
      </section>
    </div>
  );
}
