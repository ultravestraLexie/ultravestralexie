import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { SUBSCRIBED_STATUSES } from "@/lib/gate-paths";
import SignOutButton from "@/components/SignOutButton";
import { SideNav, BottomTabs, VMark } from "@/components/AppNav";
import GalaxyBackdrop from "@/components/galaxy/GalaxyBackdrop";
import { ProfileButton } from "@/components/galaxy/ProfileSheet";
import { initials } from "@/lib/galaxy/core";

export const metadata: Metadata = {
  title: "UltraVestra",
  description:
    "Less time searching. More time creating. Smarter brand partnerships.",
  appleWebApp: {
    capable: true,
    title: "UltraVestra",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#04051A",
};

/* Galaxy shell (2026-11-23 redesign): a 240px frosted rail on
 * desktop (logo, the six destinations, plan card, profile at the
 * foot), a slim top bar + six-tab bottom bar on mobile (≤860px).
 * Signed-out visitors keep a public header. The responsive switch
 * is plain CSS so every page inherits the frame. */
const SHELL_CSS = `
.uv-shell{display:flex;min-height:100vh}
.uv-side{width:240px;flex:0 0 240px;position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column;padding:26px 16px 20px;border-right:1px solid var(--line);background:rgba(4,6,26,.42);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.uv-mainwrap{flex:1;min-width:0;display:flex;flex-direction:column}
.uv-main{flex:1;width:100%;max-width:1180px;margin:0 auto;padding:40px 48px 72px}
.uv-topbar{display:none}
.uv-tabbar{display:none}
.uv-foot{padding:18px 30px 28px;color:var(--ink-3);font-size:12.5px;text-align:center}
@media (max-width:860px){
  .uv-side{display:none}
  .uv-topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 16px 10px;background:linear-gradient(180deg,rgba(4,5,26,.92),rgba(4,5,26,.6) 70%,transparent);position:sticky;top:0;z-index:40}
  .uv-main{padding:8px 16px calc(96px + env(safe-area-inset-bottom))}
  .uv-tabbar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:50;background:rgba(5,7,28,.88);border-top:1px solid var(--line);padding:6px 4px calc(6px + env(safe-area-inset-bottom));backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
  .uv-foot{padding-bottom:110px}
}
`;

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
      <VMark size={compact ? 34 : 40} />
      <span style={{ lineHeight: 1.1 }}>
        <span
          style={{
            display: "block",
            fontFamily: "var(--display)",
            fontWeight: 600,
            fontSize: compact ? 12 : 13,
            letterSpacing: ".12em",
            color: "var(--ink)",
            whiteSpace: "nowrap",
          }}
        >
          ULTRA VESTRA
        </span>
        {!compact ? (
          <span style={{ display: "block", marginTop: 6, fontSize: 11.5, color: "var(--ink-3)", letterSpacing: ".02em" }}>
            Create. Grow. Build.
          </span>
        ) : null}
      </span>
    </span>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <html lang="en">
        <body>
          <GalaxyBackdrop />
          <header
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              alignItems: "center",
              padding: "14px 24px",
              borderBottom: "1px solid var(--line)",
              background: "rgba(4,6,26,.55)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            <Link href="/" style={{ textDecoration: "none" }}>
              <BrandLockup compact />
            </Link>
            <nav style={{ display: "flex", flexWrap: "wrap", gap: 18, fontSize: 15, marginLeft: "auto", alignItems: "center" }}>
              <Link href="/pricing" style={{ textDecoration: "none", color: "var(--ink-2)" }}>Pricing</Link>
              <Link href="/login" style={{ textDecoration: "none", fontWeight: 600 }}>Log in</Link>
            </nav>
          </header>
          <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px" }}>
            {children}
          </main>
          <footer
            style={{
              padding: "24px",
              borderTop: "1px solid var(--line)",
              color: "var(--ink-3)",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            UltraVestra — Less time searching. More time creating. Smarter brand
            partnerships.
            <br />© 2026 UltraVestra. All rights reserved. The brand directory,
            research and platform content may not be copied, scraped or
            redistributed.
          </footer>
        </body>
      </html>
    );
  }

  /* The subscriptions table carries plan_id (the webhook resolves
   * it from the Stripe price); the plan's name lives in the plans
   * table. A returning subscriber has MORE THAN ONE row, so read
   * newest-first and prefer the LIVE one (active/trialing — the
   * same statuses the gate uses). No live row → the generic label. */
  const { data: subRows } = await supabase
    .from("subscriptions")
    .select("plan_id, status")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  const liveSub = (subRows ?? []).find((r) =>
    (SUBSCRIBED_STATUSES as readonly string[]).includes(
      r.status as string
    )
  );
  let planLabel = "UltraVestra Member";
  const planId = (liveSub?.plan_id as string | null) ?? null;
  if (planId) {
    const { data: plan } = await supabase
      .from("plans")
      .select("name")
      .eq("id", planId)
      .maybeSingle();
    const planName = (plan?.name as string | null) ?? null;
    if (planName) planLabel = `${planName} Member`;
  }

  const [{ data: bpRow }, { data: catRows }] = await Promise.all([
    supabase
      .from("creator_business_profiles")
      .select("creator_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("categories").select("name").order("name"),
  ]);
  const creatorName =
    ((bpRow as { creator_name: string | null } | null)?.creator_name ?? "").trim();
  const profileLabel = creatorName || user.email || "Your profile";
  const profileInitial = initials(creatorName || user.email || "UV");
  const categories = ((catRows ?? []) as { name: string }[]).map((c) => c.name);

  return (
    <html lang="en">
      <body>
        <style>{SHELL_CSS}</style>
        <GalaxyBackdrop />
        <div className="uv-shell">
          <aside className="uv-side">
            <Link href="/today" style={{ textDecoration: "none", padding: "0 8px 26px" }}>
              <BrandLockup />
            </Link>
            <SideNav />
            <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
              <div
                style={{
                  border: "1px solid var(--line)",
                  background: "linear-gradient(160deg, rgba(76,116,255,.16), rgba(10,15,48,.5))",
                  borderRadius: 16,
                  padding: "13px 14px",
                  boxShadow: "inset 0 1px 0 rgba(190,205,255,.12)",
                }}
              >
                <p style={{ margin: 0, fontSize: 12, letterSpacing: 1.6, color: "var(--ink-3)", fontWeight: 700 }}>
                  ULTRA VESTRA
                </p>
                <p style={{ margin: "3px 0 10px", fontSize: 13.5, color: "var(--ink)", fontWeight: 600 }}>
                  {planLabel}
                </p>
                <Link
                  href="/pricing"
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: "linear-gradient(92deg, var(--blue), var(--violet))",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13.5,
                    borderRadius: 999,
                    padding: "8px 0",
                    textDecoration: "none",
                    boxShadow: "0 8px 22px -8px rgba(76,116,255,.9)",
                  }}
                >
                  View Plans
                </Link>
              </div>
              <ProfileButton
                label={profileLabel}
                sub="Edit profile"
                initial={profileInitial}
                categories={categories}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "2px 8px 0",
                  fontSize: 13,
                  color: "var(--ink-3)",
                }}
              >
                <Link href="/settings" style={{ textDecoration: "none" }}>Settings</Link>
                <Link href="/support" style={{ textDecoration: "none" }}>Support</Link>
                <span style={{ marginLeft: "auto" }}>
                  <SignOutButton />
                </span>
              </div>
            </div>
          </aside>
          <div className="uv-mainwrap">
            <div className="uv-topbar">
              <Link href="/today" style={{ textDecoration: "none" }}>
                <BrandLockup compact />
              </Link>
              <span style={{ width: 168, maxWidth: "44vw" }}>
                <ProfileButton label={profileLabel} initial={profileInitial} categories={categories} />
              </span>
            </div>
            <main className="uv-main">{children}</main>
            <footer className="uv-foot">
              © 2026 UltraVestra. All rights reserved. The brand directory,
              research and platform content may not be copied, scraped or
              redistributed.
            </footer>
          </div>
          <nav className="uv-tabbar" aria-label="Main">
            <BottomTabs />
          </nav>
        </div>
      </body>
    </html>
  );
}
