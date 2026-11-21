import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import { BeforeAfterLibrary } from "@/components/BeforeAfter";
import { PAIRS, CLOSING_LINE } from "@/lib/beforeafter";

/* BEFORE-AND-AFTER CONTENT EXAMPLES — the paired-examples library.
 * One of the owner's six improvement priorities: creators don't need
 * more articles to read once and forget — they need to SEE the same
 * content written weak and written strong, with the principle named,
 * until their eye is trained. 27 pairs across hooks, first frames,
 * demonstrations, proof, CTAs, captions, titles, brand pitches, and
 * LIVE openers, grounded in the Secret Weapon, Say It Better, the
 * First 3 Seconds, the 10 Triggers, and the Art of Human Connection. */

export const metadata: Metadata = {
  title: "Before-and-After Content Examples | UltraVestra",
  description:
    "The same hook, demo, caption, pitch, and LIVE opener — written weak and written strong, side by side, with the principle named under each pair. Train your eye on 27 paired examples across hooks, first frames, demonstrations, proof, CTAs, captions, titles, brand pitches, and LIVE openers.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/creator-growth/before-and-after",
  },
  openGraph: {
    title: "Before-and-After Content Examples | UltraVestra",
    description:
      "Don't just read the difference. See it. Paired examples that teach creators why people scroll past — and what the stronger version does instead.",
    url: "https://ultra-vestra.vercel.app/creator-growth/before-and-after",
    type: "article",
  },
};

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "rgba(26,8,54,0.78)",
  borderRadius: 22,
  padding: "24px 26px 26px",
  boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const body: React.CSSProperties = { color: "#f3e8ff", fontSize: 15.5, margin: "0 0 12px" };
const linkStyle: React.CSSProperties = { color: "#67e8f9", fontWeight: 700, textDecoration: "none" };
const badge: React.CSSProperties = {
  background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999,
  padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2,
};

export default async function BeforeAndAfterPage() {
  await requireSubscription("/creator-growth/before-and-after");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={badge}>ULTRAVESTRA · BEFORE-AND-AFTER EXAMPLES</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "14px 0 8px", fontWeight: 800 }}>
          Before-and-After Content Examples
        </h1>
        <p style={{ color: "#ddd0ff", fontSize: 17, margin: "0 auto", maxWidth: 720 }}>
          {PAIRS.length} pairs. Nine parts of a creator&rsquo;s work. One skill underneath all of
          them: seeing your own content the way a viewer does — and knowing exactly what to change.
        </p>
      </section>

      {/* THE LIBRARY */}
      <BeforeAfterLibrary />

      {/* CLOSING — TURN THE EYE ON YOUR OWN VIDEO */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #22d3ee" }}>
        <p style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px" }} className="wow-title">
          Your Turn
        </p>
        <p style={{ ...body, margin: "0 auto 16px", maxWidth: 680 }}>
          {CLOSING_LINE} Start where the viewer meets you first: the first three seconds.
          The Chamber rebuilds your opening on the three beats — Interrupt, Connect, Create
          a Reason to Stay — in two contrasting styles, so you can feel the difference in
          your own words before you re-film.
        </p>
        <Link href="/creator-growth/first-3-seconds" className="neon-btn" style={{ ...linkStyle, fontSize: 16.5 }}>
          Enter the First 3 Seconds Chamber →
        </Link>
      </section>

      <p style={{ textAlign: "center", margin: 0, fontSize: 15, color: "#ddd0ff" }}>
        Go deeper with <Link href="/creator-growth/human-behind-the-view" style={linkStyle}>Say It Better in The Human Behind the View</Link>,
        run makeovers in the <Link href="/secret-weapon#sales-vault" style={linkStyle}>Makeover Studio</Link>,
        and keep training in the <Link href="/coach" style={linkStyle}>Creator Growth Center</Link>.
      </p>
    </div>
  );
}
