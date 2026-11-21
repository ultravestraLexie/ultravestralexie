import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import NegotiationCoach from "@/components/NegotiationCoach";
import { TERMS, PRINCIPLES, CLOSING_LINE } from "@/lib/negotiation";

/* THE COMMISSION NEGOTIATION COACH — an UltraVestra Original.
 * Serves the understanding moment: "I understand how to negotiate
 * better commissions." A tool, not an article: the creator brings
 * a real offer, learns the anatomy of its eight terms — what each
 * means, what strong looks like, what a red flag looks like — runs
 * it through the Offer Checker, and leaves with grades and the
 * exact words to counter with. "Strong" is grounded in what the
 * directory itself proves exists: verified-uncapped programs are
 * published in the Commission Intelligence Center, and strong
 * published programs carry 30–90 day windows and written step-ups.
 * Educational guidance only — never legal advice, never a claim
 * about industry averages. */

export const metadata: Metadata = {
  title: "The Commission Negotiation Coach | UltraVestra",
  description:
    "UltraVestra's Commission Negotiation Coach: the anatomy of a brand offer — commission rate, earnings cap, cookie window, exclusivity, usage rights, payment terms, tier step-ups, seeding — what strong looks like, what a red flag looks like, and the exact counter line to send for every weak term. Check a real offer and leave with a counter-offer message ready to adapt.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/creator-growth/commission-negotiation",
  },
  openGraph: {
    title: "The Commission Negotiation Coach | UltraVestra",
    description:
      "Don't just accept the offer — understand the terms behind it. Grade a real offer term by term and get the exact words to counter with.",
    url: "https://ultra-vestra.vercel.app/creator-growth/commission-negotiation",
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

export default async function CommissionNegotiationPage() {
  await requireSubscription("/creator-growth/commission-negotiation");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#4ade80", border: "1px solid #22c55e", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          COMMISSION INTELLIGENCE
        </span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 8px", fontWeight: 800 }}>
          The Commission Negotiation Coach
        </h1>
        <p style={{ color: "#ddd0ff", fontSize: 16.5, margin: "0 auto", maxWidth: 720 }}>
          A brand offer is not one number — it is eight terms wearing a trench coat. Bring a real offer, learn
          what each term means, and leave knowing exactly which terms are weak and the exact words to counter
          with. This is how a creator comes to say: <em>“I understand how to negotiate better commissions.”</em>
        </p>
      </section>

      {/* THE ANATOMY OF AN OFFER */}
      <section style={panel}>
        <h2 style={h2style}>The Anatomy of an Offer</h2>
        <p style={sub}>
          Eight terms decide what a deal is really worth. For each one: what it means, what strong looks like,
          what a red flag looks like — and the counter line, ready to adapt. What “strong” means here is grounded
          in what the directory itself proves exists: verified-uncapped programs are published in the{" "}
          <Link href="/commissions" style={linkStyle}>Commission Intelligence Center</Link>, and strong published
          programs carry 30–90 day attribution windows and written tier step-ups.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {TERMS.map((t, i) => (
            <article key={t.id} style={{ ...card, padding: "18px 22px" }}>
              <p style={{ margin: "0 0 8px", fontSize: 17.5 }}>
                <span className="wow-title" style={{ fontWeight: 800, fontSize: 22 }}>{i + 1}</span>{" "}
                <strong style={{ color: "#f3e8ff" }}>{t.name}</strong>
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 15.5, color: "#ddd0ff" }}>
                <strong style={{ color: "#67e8f9" }}>What it means:</strong> {t.meaning}
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#4ade80" }}>What strong looks like:</strong> {t.strong}
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 15.5, color: "#ddd0ff" }}>
                <strong style={{ color: "#f87171" }}>Red flag:</strong> {t.redFlag}
              </p>
              <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#f0abfc" }}>If it&rsquo;s weak, say this:</strong> “{t.counter}”
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* THE OFFER CHECKER */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">Check a Real Offer</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          Your terms in — grades, reasons, counter lines, and a ready-to-adapt counter-offer message out.
        </p>
      </div>
      <NegotiationCoach />

      {/* THE PRINCIPLES */}
      <section style={panel}>
        <h2 style={h2style}>The Negotiation Principles</h2>
        <p style={sub}>
          Five principles behind every grade and every counter line in this coach. Learn these and you will
          never read an offer the same way again.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {PRINCIPLES.map((p, i) => (
            <article key={p.title} style={{ ...card, padding: "18px 20px" }}>
              <p className="wow-title" style={{ fontSize: 26, fontWeight: 800, margin: "0 0 2px", lineHeight: 1 }}>
                {i + 1}
              </p>
              <h3 style={{ fontSize: 18, margin: "6px 0 8px", fontWeight: 800, color: "#f0abfc" }}>{p.title}</h3>
              <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CLOSING LINE */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <p className="wow-title" style={{ fontSize: 34, fontWeight: 800, margin: "6px auto", maxWidth: 760, lineHeight: 1.3 }}>
          {CLOSING_LINE}
        </p>
      </section>

      <p style={{ textAlign: "center", margin: 0, fontSize: 15, color: "#ddd0ff" }}>
        See what strong terms look like in the wild in the <Link href="/commissions" style={linkStyle}>Commission Intelligence Center</Link>,
        find a brand worth negotiating with in <Link href="/radar" style={linkStyle}>Brand Opportunity Radar</Link>,
        diagnose why viewers watch but don&rsquo;t buy in the <Link href="/secret-weapon" style={linkStyle}>Creator&rsquo;s Secret Weapon</Link>,
        and keep learning in the <Link href="/coach" style={linkStyle}>Creator Growth Center</Link>.
      </p>
    </div>
  );
}
