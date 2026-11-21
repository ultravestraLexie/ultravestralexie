import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "Ultra Vestra — UGC Brand Intelligence",
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
            gap: 20,
            alignItems: "center",
            padding: "14px 24px",
            borderBottom: "1px solid #2a3d6e",
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
                border: "2px solid #8da6df",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 1,
              }}
            >
              UV
            </span>
            ULTRA VESTRA
          </Link>
          <nav style={{ display: "flex", gap: 16, fontSize: 15 }}>
            <Link href="/brands">Brands</Link>
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
                <span style={{ color: "#a8b8dd" }}>{user.email}</span>
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
            borderTop: "1px solid #2a3d6e",
            color: "#a8b8dd",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          Ultra Vestra — Less time searching. More time creating. Smarter brand
          partnerships.
        </footer>
      </body>
    </html>
  );
}
