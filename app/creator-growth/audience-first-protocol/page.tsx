import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import AudienceFirst from "@/components/AudienceFirst";
import {
  CORE_MESSAGE,
  CORE_MESSAGE_NOTE,
  HEADLINE,
  HEADLINE_SUB,
  ONE_QUESTION,
  ONE_QUESTION_CONTEXT,
  PSYCHOLOGY_STEPS,
  JOURNEY,
  CENTER_EXAMPLES,
  THE_RULE,
  PHILOSOPHY,
} from "@/lib/audiencefirst";

/* THE AUDIENCE FIRST PROTOCOL — UltraVestra's defining message,
 * as a signature learning experience. Your video is not about what
 * YOU want to sell — it's about what YOUR audience wants, needs,
 * feels, or is trying to solve. The five psychology steps, the
 * four-stage journey (Attention → Relevance → Desire → Action),
 * the serum example, the UltraVestra Rule, the working tools (the
 * Alignment Test, the Journey Builder, Center Shift), and the
 * Philosophy that defines UltraVestra.
 * Source document: content/audience-first-protocol.md. */

export const metadata: Metadata = {
  title: "The Audience First Protocol | UltraVestra",
  description:
    "Your video is not about you. It's about them. UltraVestra's Audience First Protocol: the psychology of getting people to care, the four-stage journey from attention to action, the Audience Alignment Test, and the philosophy — create for the human, not the algorithm.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/creator-growth/audience-first-protocol",
  },
  openGraph: {
    title: "The Audience First Protocol | UltraVestra",
    description:
      "Stop creating for yourself. Start creating for the person watching. The psychology of getting people to care — and the tools to practice it before you publish.",
    url: "https://ultra-vestra.vercel.app/creator-growth/audience-first-protocol",
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
const body: React.CSSProperties = { color: "#f3e8ff", fontSize: 15.5, margin: "0 0 12px" };
const card: React.CSSProperties = {
  border: "1px solid #4c1d95", borderRadius: 14, padding: "14px 18px", background: "rgba(13,2,33,0.65)",
};
const linkStyle: React.CSSProperties = { color: "#67e8f9", fontWeight: 700, textDecoration: "none" };

export default async function AudienceFirstProtocolPage() {
  await requireSubscription("/creator-growth/audience-first-protocol");
  const serum = CENTER_EXAMPLES[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO — THE PROTOCOL */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          ULTRAVESTRA · THE FUTURE OF CREATOR INTELLIGENCE
        </span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 8px", fontWeight: 800 }}>
          The Audience First Protocol
        </h1>
        <p style={{ color: "#f0abfc", fontSize: 21, fontWeight: 800, margin: "0 auto 10px", maxWidth: 760 }}>
          {HEADLINE}
        </p>
        <p style={{ color: "#67e8f9", fontSize: 16.5, fontWeight: 700, letterSpacing: 0.6, margin: "0 auto 14px", maxWidth: 700 }}>
          {HEADLINE_SUB}
        </p>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#f3e8ff", fontSize: 17.5, fontWeight: 700, margin: "0 0 10px" }}>{CORE_MESSAGE}</p>
          <p style={{ color: "#ddd0ff", fontSize: 16, margin: 0 }}>{CORE_MESSAGE_NOTE}</p>
        </div>
      </section>

      {/* THE ONE QUESTION */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #22d3ee", boxShadow: "0 0 40px rgba(34,211,238,0.3)" }}>
        <span style={{ background: "#082f3f", color: "#67e8f9", border: "1px solid #22d3ee", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>
          BEFORE YOU RECORD — ASK ONE QUESTION
        </span>
        <p className="wow-title" style={{ fontSize: 30, fontWeight: 800, margin: "16px auto 12px", maxWidth: 720 }}>
          &ldquo;{ONE_QUESTION}&rdquo;
        </p>
        <p style={{ color: "#ddd0ff", fontSize: 15.5, margin: "0 auto", maxWidth: 700 }}>{ONE_QUESTION_CONTEXT}</p>
      </section>

      {/* THE PSYCHOLOGY OF GETTING PEOPLE TO CARE */}
      <section style={panel}>
        <h2 style={h2style}>The Psychology of Getting People to Care</h2>
        <p style={sub}>
          Five steps, in order. This is where sales psychology begins — not with the product, but with the
          person watching.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {PSYCHOLOGY_STEPS.map((step) => (
            <article key={step.number} style={{ ...card, padding: "18px 22px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
                <span className="wow-title" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{step.number}</span>
                <h3 style={{ fontSize: 20, margin: 0, fontWeight: 800, color: "#f3e8ff" }}>{step.name}</h3>
              </div>
              <p style={{ ...body, margin: "10px 0 0" }}>{step.explanation}</p>
              {step.examples.length > 0 && (
                <ul style={{ margin: "10px 0 0", paddingLeft: 20, color: "#ddd0ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
                  {step.examples.map((ex) => <li key={ex}>{ex}</li>)}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* THE FOUR-STAGE JOURNEY */}
      <section style={panel}>
        <h2 style={h2style}>How Audience Psychology Works — The Four-Stage Journey</h2>
        <p style={sub}>
          Every video asks the viewer to travel four stages. Miss one, and the journey ends early.
        </p>
        <p style={{ margin: "0 0 16px", fontSize: 19, fontWeight: 800, letterSpacing: 0.6, color: "#f3e8ff", textAlign: "center" }}>
          {JOURNEY.map((s, i) => (
            <span key={s.stage}>
              <span style={{ color: "#f0abfc" }}>{s.stage}</span>
              {i < JOURNEY.length - 1 && <span style={{ color: "#67e8f9" }}> → </span>}
            </span>
          ))}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
          {JOURNEY.map((s, i) => (
            <article key={s.stage} style={{ ...card, padding: "18px 20px" }}>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: "#67e8f9" }}>
                STAGE {i + 1}
              </p>
              <h3 style={{ fontSize: 19, margin: "0 0 4px", fontWeight: 800, color: "#f3e8ff" }}>{s.stage}</h3>
              <p style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 800, color: "#f0abfc" }}>&ldquo;{s.viewerSays}&rdquo;</p>
              <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>{s.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* THE SERUM EXAMPLE */}
      <section style={panel}>
        <h2 style={h2style}>Same Product, Completely Different Psychology</h2>
        <p style={sub}>
          One serum, two openings. The difference is not the product — it&rsquo;s who the video is about.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          <div style={{ ...card, border: "1px solid #7f1d3d", padding: "18px 22px" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 13.5, letterSpacing: 1, color: "#fda4af" }}>CREATOR-CENTERED VIDEO</p>
            <p style={{ margin: 0, fontSize: 18, color: "#f3e8ff" }}>&ldquo;{serum.creator_centered}&rdquo;</p>
          </div>
          <div style={{ ...card, border: "1px solid #22d3ee", padding: "18px 22px" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 13.5, letterSpacing: 1, color: "#67e8f9" }}>AUDIENCE-CENTERED VIDEO</p>
            <p style={{ margin: 0, fontSize: 18, color: "#f3e8ff" }}>&ldquo;{serum.audience_centered}&rdquo;</p>
          </div>
        </div>
        <p style={{ ...body, margin: "16px 0 0" }}>{serum.why}</p>
      </section>

      {/* THE ULTRAVESTRA RULE */}
      <section style={{ ...panel, textAlign: "center" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>
          THE ULTRAVESTRA RULE
        </span>
        <div style={{ maxWidth: 680, margin: "16px auto 0" }}>
          {THE_RULE.intro.map((line) => (
            <p key={line} style={{ color: "#ddd0ff", fontSize: 16.5, margin: "0 0 10px" }}>{line}</p>
          ))}
          <p className="wow-title" style={{ fontSize: 24, fontWeight: 800, margin: "14px 0" }}>{THE_RULE.bold}</p>
          {THE_RULE.closing.map((line) => (
            <p key={line} style={{ color: "#f3e8ff", fontSize: 16.5, fontWeight: 700, margin: "0 0 8px" }}>{line}</p>
          ))}
        </div>
      </section>

      {/* THE TOOLS */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">The Audience First Tools</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          The Protocol, turned into practice. Run the Alignment Test before you publish, build the journey
          before you record, and shift your lines before you say them.
        </p>
      </div>
      <AudienceFirst />

      {/* THE PHILOSOPHY */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)", padding: "40px 26px 44px" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>
          THE ULTRAVESTRA PHILOSOPHY
        </span>
        <p className="wow-title" style={{ fontSize: 40, fontWeight: 800, margin: "22px auto 16px", maxWidth: 760, lineHeight: 1.15 }}>
          {PHILOSOPHY.headline}
        </p>
        {PHILOSOPHY.lines.map((line) => (
          <p key={line} style={{ color: "#f3e8ff", fontSize: 19, fontWeight: 700, margin: "0 0 10px" }}>{line}</p>
        ))}
        <p style={{ color: "#67e8f9", fontWeight: 700, fontSize: 16.5, margin: "18px auto 0", maxWidth: 640 }}>
          {PHILOSOPHY.closing}
        </p>
      </section>

      <p style={{ textAlign: "center", margin: 0, fontSize: 15, color: "#ddd0ff" }}>
        Go deeper with the <Link href="/creator-growth/human-emotion-video-playbook" style={linkStyle}>Human Emotion Video Playbook</Link>,
        start every video human-first in the <Link href="/coach" style={linkStyle}>Creator Growth Center</Link>,
        and win the opening with <Link href="/creator-growth/first-3-seconds" style={linkStyle}>The First 3 Seconds</Link>.
      </p>
    </div>
  );
}
