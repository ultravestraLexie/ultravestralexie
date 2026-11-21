import type { Metadata } from "next";
import Link from "next/link";
import SecretWeapon from "@/components/SecretWeapon";
import { POSITIONING, MISSION_LINE, FORMULA, UNIVERSE, HOOK_COUNT } from "@/lib/weapon";

/* THE CREATOR'S SECRET WEAPON — UltraVestra's interactive learning
 * universe. Not generic tips: a working system that shows creators HOW
 * — the 3-Second Psychology Lab, the Sales Psychology Vault, the
 * Content Failure Museum, the Creator Script Laboratory, the Makeover
 * Studio, the Autopsy worksheet and the 30-Second Challenge — organized
 * as six worlds and built on the Understand → Analyze → Improve →
 * Apply formula. Source: content/creator-secret-weapon.md. */

export const metadata: Metadata = {
  title: "The Creator's Secret Weapon | UltraVestra",
  description:
    "UltraVestra is the creator's secret weapon: an interactive learning universe that turns attention into influence, influence into sales, and content into income. The 3-Second Psychology Lab with 50+ decoded hooks, the Sales Psychology Vault, the Buyer Brain Simulator, the Conversion Clinic, the Content Failure Museum, the Script Laboratory, the Makeover Studio and the daily 30-Second Challenge.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/secret-weapon",
  },
  openGraph: {
    title: "The Creator's Secret Weapon | UltraVestra",
    description:
      "Most platforms teach you how to post. UltraVestra teaches you how to make people stop, watch, trust, and buy.",
    url: "https://ultra-vestra.vercel.app/secret-weapon",
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
const h2style: React.CSSProperties = { fontSize: 28, margin: "0 0 8px", letterSpacing: 0.4, fontWeight: 800 };
const sub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 16px", fontSize: 15.5 };
const card: React.CSSProperties = {
  border: "1px solid #4c1d95", borderRadius: 14, padding: "14px 18px", background: "rgba(13,2,33,0.65)",
};
const linkStyle: React.CSSProperties = { color: "#67e8f9", fontWeight: 700, textDecoration: "none" };

export default function SecretWeaponPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO — THE POSITIONING */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          ULTRAVESTRA · THE CREATOR INTELLIGENCE UNIVERSE
        </span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 8px", fontWeight: 800 }}>
          The Creator&rsquo;s Secret Weapon
        </h1>
        <p style={{ color: "#f0abfc", fontSize: 21, fontWeight: 800, margin: "0 auto 10px", maxWidth: 760 }}>
          {POSITIONING}
        </p>
        <p style={{ color: "#67e8f9", fontSize: 16.5, fontWeight: 700, letterSpacing: 0.6, margin: "0 auto 14px", maxWidth: 720 }}>
          Not another page of generic tips. This is where creators learn to turn attention into influence,
          influence into sales, and content into income.
        </p>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#ddd0ff", fontSize: 16, margin: "0 0 10px" }}>
            Most creator education teaches you <em>what</em> to do. UltraVestra shows you <strong style={{ color: "#f3e8ff" }}>how</strong> —
            with {HOOK_COUNT} decoded opening hooks, a sales-psychology simulator, a failure museum, script
            structures with every beat explained, and a daily challenge that trains one skill at a time.
            Platform-neutral: built for TikTok, YouTube, Instagram and affiliate creators alike.
          </p>
          <p className="wow-title" style={{ fontSize: 19, fontWeight: 800, margin: "6px 0 0" }}>
            {MISSION_LINE}
          </p>
        </div>
      </section>

      {/* THE FORMULA — UNDERSTAND → ANALYZE → IMPROVE → APPLY */}
      <section style={panel}>
        <h2 style={h2style}>How Every Weapon Here Is Built</h2>
        <p style={sub}>
          Nothing in this universe is a pile of articles. Every resource follows the same four-step formula:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {FORMULA.map((f, i) => (
            <div key={f.step} style={{ ...card, textAlign: "center" }}>
              <p className="wow-title" style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", lineHeight: 1 }}>{i + 1}</p>
              <p style={{ margin: "0 0 6px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>{f.step.toUpperCase()}</p>
              <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>{f.line}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THE KNOWLEDGE UNIVERSE — SIX WORLDS */}
      <section style={panel}>
        <h2 style={h2style}>Explore the Universe</h2>
        <p style={sub}>Six worlds, one journey — from understanding attention to advanced creator strategy.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {UNIVERSE.map((w) => (
            <Link key={w.name} href={w.href} style={{ textDecoration: "none" }}>
              <article className="glass-card" style={{ ...card, height: "100%", padding: "18px 20px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#f3e8ff" }}>{w.name}</p>
                <p style={{ margin: "0 0 10px", fontSize: 15, color: "#ddd0ff" }}>{w.tagline}</p>
                <p style={{ margin: 0, color: "#67e8f9", fontWeight: 700, fontSize: 14.5 }}>Enter →</p>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* THE TOOLS */}
      <SecretWeapon />

      {/* GO DEEPER — EXISTING WEAPONS */}
      <section style={panel}>
        <h2 style={h2style}>Go Deeper</h2>
        <p style={sub}>The Secret Weapon connects to the full UltraVestra arsenal:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 15.5 }}>
          <p style={{ margin: 0, color: "#ddd0ff" }}>
            ⏱️ <Link href="/creator-growth/first-3-seconds" style={linkStyle}>The First 3 Seconds Masterclass</Link> — Interrupt, Connect, Create a Reason to Stay, with the Chamber testing tool.
          </p>
          <p style={{ margin: 0, color: "#ddd0ff" }}>
            🎯 <Link href="/creator-growth/art-of-captivating-attention" style={linkStyle}>The Art of Captivating Human Attention</Link> — the 15 attention triggers and the Human Attention Reactor.
          </p>
          <p style={{ margin: 0, color: "#ddd0ff" }}>
            🔬 <Link href="/coach" style={linkStyle}>The Creator Video Intelligence Lab</Link> — diagnose why a video performed, or why it stalled.
          </p>
          <p style={{ margin: 0, color: "#ddd0ff" }}>
            🔭 <Link href="/discover" style={linkStyle}>The Brand Opportunity Observatory</Link> — brands accepting creators, with verified commissions clearly separated from unverified listings.
          </p>
          <p style={{ margin: 0, color: "#ddd0ff" }}>
            💰 <Link href="/commissions" style={linkStyle}>Commission Intelligence</Link> — capped, uncapped and unknown limits, separated and sourced.
          </p>
        </div>
      </section>

      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>
          THE MISSION
        </span>
        <p className="wow-title" style={{ fontSize: 27, fontWeight: 800, margin: "14px auto 10px", maxWidth: 680 }}>
          {MISSION_LINE}
        </p>
        <p style={{ color: "#ddd0ff", fontSize: 15.5, margin: "0 auto", maxWidth: 640 }}>
          The advantage was never the design. It is the quality, depth and practical usefulness of what you
          learn here — weapons you can use in the next video you film.
        </p>
      </section>
    </div>
  );
}
