import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import { TriggerStack } from "@/components/TriggerLab";
import { LAB_INTRO, LAB_PRINCIPLE, LAB_AREAS } from "@/lib/triggers";

/* THE HUMAN BUYING LAB — UltraVestra's signature practice section.
 * The 10 Psychological Triggers teach creators what makes people
 * pay attention, develop interest, evaluate products, and decide;
 * the Lab is where they practice: hook psychology experiments,
 * buyer behavior breakdowns, weak-versus-strong examples,
 * demonstration challenges, script transformations, real-world ad
 * analysis, ethical persuasion, and conversion diagnostics — every
 * area wired to a live UltraVestra tool. One principle guides
 * every lesson in the Lab (see lib/triggers.ts, LAB_PRINCIPLE). */

export const metadata: Metadata = {
  title: "The Human Buying Lab | UltraVestra",
  description:
    "UltraVestra's signature practice section. Understand what makes people pay attention, develop interest, evaluate products, and make purchasing decisions — then practice the 10 Psychological Triggers with hook experiments, buyer behavior breakdowns, makeovers, script transformations, and conversion diagnostics.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/human-buying-lab",
  },
  openGraph: {
    title: "The Human Buying Lab | UltraVestra",
    description:
      "A creator's job isn't to make everybody buy. It's to help the right person understand why a product might be worth buying. Practice the triggers — don't just read them.",
    url: "https://ultra-vestra.vercel.app/human-buying-lab",
    type: "website",
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
const body: React.CSSProperties = { color: "#f3e8ff", fontSize: 15.5, margin: "0 0 12px" };
const card: React.CSSProperties = {
  border: "1px solid #4c1d95", borderRadius: 14, padding: "14px 18px", background: "rgba(13,2,33,0.65)",
};
const linkStyle: React.CSSProperties = { color: "#67e8f9", fontWeight: 700, textDecoration: "none" };
const badge: React.CSSProperties = {
  background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999,
  padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2,
};

export default async function HumanBuyingLabPage() {
  await requireSubscription("/human-buying-lab");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={badge}>ULTRA VESTRA · CREATOR SALES INTELLIGENCE</span>
        <h1 className="wow-title" style={{ fontSize: 46, margin: "14px 0 10px", fontWeight: 800 }}>
          The Human Buying Lab
        </h1>
        <p style={{ color: "#ddd0ff", fontSize: 17.5, margin: "0 auto 20px", maxWidth: 760 }}>
          {LAB_INTRO}
        </p>
        <p className="wow-title" style={{ fontSize: 25, fontWeight: 800, margin: "0 auto", maxWidth: 820, lineHeight: 1.45 }}>
          {LAB_PRINCIPLE}
        </p>
      </section>

      {/* START WITH THE LESSON */}
      <section style={{ ...panel, textAlign: "center" }}>
        <p style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#f3e8ff" }}>Start with the lesson</p>
        <p style={{ ...body, margin: "0 auto 14px", maxWidth: 680 }}>
          The Lab runs on one signature lesson: the ten triggers behind videos that sell — and the
          Pre-Publishing Test you run before any video goes live.
        </p>
        <Link href="/creator-growth/ten-psychological-triggers" style={{ ...linkStyle, fontSize: 16.5 }}>
          Learn The 10 Psychological Triggers →
        </Link>
      </section>

      {/* THE EIGHT LAB AREAS */}
      <section style={panel}>
        <h2 style={h2style}>Inside the Laboratory</h2>
        <p style={sub}>
          Eight practice areas. Every one opens a live UltraVestra tool — bring a real video, a real
          product, and your own numbers.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          {LAB_AREAS.map((a, i) => (
            <article key={a.area} style={{ ...card, padding: "18px 20px" }}>
              <p style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: "#f3e8ff" }}>
                <span style={{ color: "#67e8f9" }}>{i + 1}.</span> {a.area}
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 15, color: "#ddd0ff" }}>{a.inside}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {a.tools.map((tool) => (
                  <Link key={tool.name + tool.href} href={tool.href} style={{ ...linkStyle, fontSize: 15 }}>
                    {tool.name} →
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* TRIGGER STACK */}
      <div>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">Build Your Trigger Stack</p>
          <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
            The Lab&rsquo;s planning table: choose the job, take the triggers, film in chain order.
          </p>
        </div>
        <TriggerStack />
      </div>

      {/* CROSS-LINKS */}
      <p style={{ textAlign: "center", margin: 0, fontSize: 15, color: "#ddd0ff" }}>
        Go further with <Link href="/secret-weapon" style={linkStyle}>The Creator&rsquo;s Secret Weapon</Link> —
        the Hook Decoder, Scroll Stop Score, Buyer Brain Simulator, and Conversion Clinic — and keep
        training in the <Link href="/coach" style={linkStyle}>Creator Growth Center</Link>.
      </p>
    </div>
  );
}
