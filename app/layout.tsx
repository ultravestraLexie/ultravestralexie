import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "UltraVestra — Brand Intelligence",
  description:
    "Less time searching. More time creating. Smarter brand partnerships.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
            <Link href="/discover">Opportunity Finder</Link>
            <Link href="/brands">Brand Intelligence</Link>
            <Link href="/commissions">Commissions</Link>
            <Link href="/coach">Growth Center</Link>
            <Link href="/buyer-brain">Buyer Brain Simulator</Link>
            <Link href="/creator-lab">Creator Lab</Link>
            <Link href="/passport">Passport</Link>
            <Link href="/trend-radar">Trend Radar</Link>
            <Link href="/growth-map">Growth Map</Link>
            <Link href="/campaign-match">Campaign Match</Link>
            <Link href="/studio">Script Studio</Link>
            <Link href="/academy">Creator Academy</Link>
            <Link href="/ask" style={{ fontWeight: 700, color: "#f0abfc" }}>Ask UltraVestra</Link>
            <Link href="/saved">Saved</Link>
            <Link href="/pricing">Pricing</Link>
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
            {user ? (
              <>
                <span style={{ color: "#b3a6e0" }}>{user.email}</span>
                <SignOutButton />
              </>
            ) : (
              <Link href="/login">Log in</Link>
            )}
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
        </footer>
      </body>
    </html>
  );
}
