import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRYBE — UGC Brand Intelligence",
  description:
    "Less time searching. More time creating. Smarter brand partnerships.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            display: "flex",
            gap: 20,
            alignItems: "center",
            padding: "14px 24px",
            borderBottom: "1px solid #e5e5e5",
          }}
        >
          <Link href="/" style={{ fontWeight: 800, fontSize: 20 }}>
            TRYBE
          </Link>
          <nav style={{ display: "flex", gap: 16, fontSize: 15 }}>
            <Link href="/brands">Brands</Link>
            <Link href="/saved">Saved</Link>
            <Link href="/pricing">Pricing</Link>
          </nav>
          <span style={{ marginLeft: "auto" }}>
            <Link href="/login">Log in</Link>
          </span>
        </header>
        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px" }}>
          {children}
        </main>
        <footer
          style={{
            padding: "24px",
            borderTop: "1px solid #e5e5e5",
            color: "#666",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          TRYBE — Less time searching. More time creating. Smarter brand
          partnerships.
        </footer>
      </body>
    </html>
  );
}
