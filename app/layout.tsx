import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { SUBSCRIBED_STATUSES } from "@/lib/gate-paths";
import SignOutButton from "@/components/SignOutButton";
import { SideNav, BottomTabs, VMark } from "@/components/AppNav";

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
  themeColor: "#020008",
};

/* Member shell (Build 9 — the owner's design target): a left sidebar
 * on desktop, a slim top bar + bottom tab bar on phone. Signed-out
 * visitors keep the public header below, unchanged. The responsive
 * switch is plain CSS so every page inherits the frame. */
const SHELL_CSS = `
.uv-shell{display:flex;min-height:100vh}
.uv-side{width:266px;flex:0 0 266px;position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column;padding:22px 16px 18px;border-right:1px solid rgba(168,85,247,.35);background:rgba(5,2,16,.85)}
.uv-mainwrap{flex:1;min-width:0;display:flex;flex-direction:column}
.uv-main{flex:1;width:100%;max-width:1460px;margin:0 auto;padding:28px 30px 44px}
.uv-topbar{display:none}
.uv-tabbar{display:none}
.uv-foot{padding:18px 30px 28px;color:#8f83c4;font-size:12.5px;text-align:center;border-top:1px solid rgba(124,58,237,.25)}
@media (max-width:1023px){
  .uv-side{display:none}
  .uv-topbar{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid rgba(168,85,247,.4);background:rgba(5,2,16,.88);position:sticky;top:0;z-index:40}
  .uv-main{padding:20px 16px 140px}
  .uv-tabbar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:50;background:rgba(7,3,20,.95);border-top:1px solid rgba(168,85,247,.45);padding:10px 8px calc(10px + env(safe-area-inset-bottom));justify-content:space-around;align-items:flex-start}
  .uv-foot{padding-bottom:132px}
}
`;

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
      <VMark size={compact ? 32 : 42} />
      <span style={{ lineHeight: 1.05 }}>
        <span
          style={{
            display: "block",
            fontWeight: 800,
            fontSize: compact ? 16 : 19,
            letterSpacing: 1.5,
            background:
              "linear-gradient(92deg, #ffffff 10%, #e879f9 45%, #a855f7 65%, #22d3ee 95%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          ULTRA VESTRA
        </span>
        <span style={{ display: "block", fontSize: compact ? 8.5 : 10, letterSpacing: 3.5, color: "#b3a6e0", fontWeight: 700, marginTop: 3 }}>
          CREATE. GROW. BUILD.
        </span>
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
          <header
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              alignItems: "center",
              padding: "14px 24px",
              borderBottom: "1px solid #a855f7",
              background: "rgba(2,0,8,0.72)",
              boxShadow: "0 4px 30px rgba(217,70,239,0.25)",
            }}
          >
            <Link
              href="/"
              style={{
                fontWeight: 800,
                fontSize: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                letterSpacing: 2,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  border: "2px solid #e879f9",
                  boxShadow:
                    "0 0 14px rgba(232,121,249,0.65), inset 0 0 10px rgba(168,85,247,0.55)",
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                UV
              </span>
              <span
                style={{
                  background:
                    "linear-gradient(92deg, #ffffff 10%, #e879f9 45%, #a855f7 65%, #22d3ee 95%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                UltraVestra
              </span>
            </Link>
            <nav style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 15 }}>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/growth-center">Growth Center</Link>
              <Link href="/discover">Opportunity Finder</Link>
              <Link href="/creator-lab">Creator Lab</Link>
              <Link href="/command-center">Command Center</Link>
            </nav>
            <span
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: 12,
                alignItems: "center",
                fontSize: 14,
              }}
            >
              <Link href="/login">Log in</Link>
            </span>
          </header>
          <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px" }}>
            {children}
          </main>
          <footer
            style={{
              padding: "24px",
              borderTop: "1px solid #3d2a6e",
              color: "#b3a6e0",
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
   * table. Selecting a "plan" column that does not exist errors the
   * whole read — found by the Build 9 acceptance pass.
   *
   * A returning subscriber has MORE THAN ONE row (the canceled old
   * subscription plus the live new one), so this read must not use
   * maybeSingle — with two rows that errors and returns null, and
   * the label fell back to generic even though the member's plan
   * was active (found by battZ, 2026-11-23). Mirror the
   * growth-center route: read the rows newest-first and prefer the
   * LIVE one (active/trialing — the same statuses the gate uses).
   * No live row → the generic label; a canceled plan is not
   * displayed as a current membership. */
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

  return (
    <html lang="en">
      <body>
        <style>{SHELL_CSS}</style>
        <div className="uv-shell">
          <aside className="uv-side">
            <Link href="/dashboard" style={{ textDecoration: "none", padding: "2px 6px 18px" }}>
              <BrandLockup />
            </Link>
            <SideNav />
            <div
              style={{
                marginTop: "auto",
                border: "1px solid rgba(232,121,249,0.45)",
                background:
                  "linear-gradient(160deg, rgba(124,58,237,0.35), rgba(26,8,54,0.85))",
                borderRadius: 18,
                padding: "16px 16px 14px",
                textAlign: "center",
                boxShadow: "0 0 24px rgba(168,85,247,0.25)",
              }}
            >
              <p style={{ margin: 0, fontSize: 20 }} aria-hidden="true">👑</p>
              <p style={{ margin: "4px 0 2px", fontWeight: 800, fontSize: 14.5, letterSpacing: 0.6, color: "#f5d0fe" }}>
                ULTRA VESTRA
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "#ddd0ff", fontWeight: 700 }}>
                {planLabel}
              </p>
              <Link
                href="/pricing"
                style={{
                  display: "block",
                  background: "linear-gradient(92deg, #a855f7, #d946ef)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: 14,
                  borderRadius: 999,
                  padding: "9px 0",
                  textDecoration: "none",
                  boxShadow: "0 0 16px rgba(217,70,239,0.45)",
                }}
              >
                View Plans
              </Link>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 6px 2px",
                fontSize: 13,
                color: "#b3a6e0",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "linear-gradient(140deg, #a855f7, #d946ef)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 13,
                  flex: "0 0 30px",
                }}
              >
                {(user.email ?? "?").charAt(0).toUpperCase()}
              </span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {user.email}
              </span>
              <SignOutButton />
            </div>
          </aside>
          <div className="uv-mainwrap">
            <div className="uv-topbar">
              <Link href="/dashboard" style={{ textDecoration: "none" }}>
                <BrandLockup compact />
              </Link>
              <span style={{ marginLeft: "auto", fontSize: 13.5, color: "#b3a6e0" }}>
                <SignOutButton />
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
