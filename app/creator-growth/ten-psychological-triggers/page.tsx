import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import { PrePublishingTest } from "@/components/TriggerLab";
import {
  OPENING,
  SUBTITLE,
  SIGN_OFF,
  TRIGGERS,
  FINAL_LESSON,
} from "@/lib/triggers";

/* THE 10 PSYCHOLOGICAL TRIGGERS BEHIND VIDEOS THAT SELL — a
 * signature lesson of Ultra Vestra Creator Sales Intelligence.
 * His 90-second creator training script, expanded into the page
 * creators return to whenever they make a TikTok Shop, creator, or
 * affiliate video: the opening, all ten triggers with his instead /
 * try lines, the cheat sheet, the Pre-Publishing Test, and the
 * final lesson chain. Source: content/ten-psychological-triggers.md. */

export const metadata: Metadata = {
  title: "The 10 Psychological Triggers Behind Videos That Sell | UltraVestra",
  description:
    "How to make people stop scrolling, keep watching, trust your message, and consider buying. UltraVestra's signature lesson: curiosity, problem recognition, pattern interruption, self-identification, visual proof, social proof, specificity, objection handling, emotional connection, and a clear call to action — plus the 7-item Pre-Publishing Test.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/creator-growth/ten-psychological-triggers",
  },
  openGraph: {
    title: "The 10 Psychological Triggers Behind Videos That Sell | UltraVestra",
    description:
      "It's not always the product. It's the psychology behind how you present it. The ten triggers, the cheat sheet, and the Pre-Publishing Test.",
    url: "https://ultra-vestra.vercel.app/creator-growth/ten-psychological-triggers",
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
const thStyle: React.CSSProperties = { textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" };
const tdStyle: React.CSSProperties = { padding: "8px 12px", borderBottom: "1px solid #4c1d95", color: "#ddd0ff" };
const objectiveChip: React.CSSProperties = {
  display: "inline-block", background: "#2e1065", color: "#67e8f9", border: "1px solid #22d3ee",
  borderRadius: 999, padding: "3px 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: 0.4,
};
const badge: React.CSSProperties = {
  background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999,
  padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2,
};

export default async function TenPsychologicalTriggersPage() {
  await requireSubscription("/creator-growth/ten-psychological-triggers");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={badge}>ULTRA VESTRA · CREATOR SALES INTELLIGENCE</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "14px 0 8px", fontWeight: 800 }}>
          The 10 Psychological Triggers Behind Videos That Sell
        </h1>
        <p style={{ color: "#ddd0ff", fontSize: 17, margin: "0 auto 18px", maxWidth: 720 }}>
          {SUBTITLE}
        </p>
        <div style={{ ...card, maxWidth: 780, margin: "0 auto", padding: "20px 24px", textAlign: "left" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13.5, fontWeight: 800, letterSpacing: 1.5, color: "#67e8f9" }}>
            OPENING — 0–5 SECONDS
          </p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f3e8ff", lineHeight: 1.5 }}>
            &ldquo;{OPENING}&rdquo;
          </p>
        </div>
      </section>

      {/* THE 10 TRIGGERS */}
      <section style={panel}>
        <h2 style={h2style}>The 10 Triggers</h2>
        <p style={sub}>
          The lesson creators return to whenever they are making a TikTok Shop, creator, or affiliate video.
          Learn what each trigger does, then practice them in the Human Buying Lab.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {TRIGGERS.map((t) => (
            <article key={t.n} style={{ ...card, padding: "18px 22px" }}>
              <p style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 800, color: "#f3e8ff" }}>
                <span style={{ color: "#67e8f9" }}>{t.n}.</span> {t.name}
              </p>
              <span style={objectiveChip}>{t.objective}</span>
              <div style={{ marginTop: 12 }}>
                {t.teaching.map((line) => (
                  <p key={line} style={{ margin: "0 0 8px", fontSize: 15.5, color: "#f3e8ff" }}>{line}</p>
                ))}
              </div>
              {t.instead && t.try_line && (
                <div style={{ marginTop: 6 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 15.5, color: "#ddd0ff" }}>
                    <strong style={{ color: "#fda4af" }}>Instead of saying:</strong> &ldquo;{t.instead}&rdquo;
                  </p>
                  <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>
                    <strong style={{ color: "#67e8f9" }}>Try:</strong> &ldquo;{t.try_line}&rdquo;
                  </p>
                </div>
              )}
              {t.examples && (
                <div style={{ marginTop: 6 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#f0abfc" }}>Examples:</p>
                  <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
                    {t.examples.map((e) => <li key={e}>&ldquo;{e}&rdquo;</li>)}
                  </ul>
                </div>
              )}
              {t.key_line && (
                <p style={{ margin: "10px 0 0", fontSize: 16, fontWeight: 800, color: "#f0abfc" }}>{t.key_line}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* CHEAT SHEET */}
      <section style={panel}>
        <h2 style={h2style}>The Creator&rsquo;s Cheat Sheet</h2>
        <p style={sub}>The ten techniques in the format creators refer to before filming.</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15.5 }}>
            <thead>
              <tr>
                <th style={thStyle}>Trigger</th>
                <th style={thStyle}>Creator&rsquo;s objective</th>
              </tr>
            </thead>
            <tbody>
              {TRIGGERS.map((t) => (
                <tr key={t.n}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#f3e8ff", whiteSpace: "nowrap" }}>
                    {t.n}. {t.name}
                  </td>
                  <td style={tdStyle}>{t.objective}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PRE-PUBLISHING TEST */}
      <div>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">Before You Publish</p>
          <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
            Don&rsquo;t guess whether the triggers are in your video. Test for them.
          </p>
        </div>
        <PrePublishingTest />
      </div>

      {/* THE FINAL LESSON */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <span style={{ ...badge, padding: "4px 14px", fontSize: 12.5 }}>THE FINAL LESSON</span>
        <p style={{ color: "#f3e8ff", fontSize: 16.5, margin: "18px auto 20px", maxWidth: 720 }}>
          {FINAL_LESSON.intro}
        </p>
        <div style={{ maxWidth: 720, margin: "0 auto 20px" }}>
          {FINAL_LESSON.chain.map((c) => (
            <p key={c.stage} style={{ color: "#f3e8ff", fontSize: 19, fontWeight: 700, margin: "0 0 10px" }}>
              {c.line}
            </p>
          ))}
        </div>
        <p className="wow-title" style={{ fontSize: 24, fontWeight: 800, margin: "0 auto 14px", maxWidth: 760, lineHeight: 1.4 }}>
          {FINAL_LESSON.closing}
        </p>
        <p style={{ color: "#67e8f9", fontWeight: 800, letterSpacing: 0.4, fontSize: 15.5, margin: 0 }}>
          This is UltraVestra. {SIGN_OFF}
        </p>
      </section>

      {/* CROSS-LINK: THE HUMAN BUYING LAB */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #22d3ee" }}>
        <p style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px" }} className="wow-title">Now practice them — THE HUMAN BUYING LAB</p>
        <p style={{ ...body, margin: "0 auto 16px", maxWidth: 680 }}>
          Don&rsquo;t stop at learning the ten triggers. In the Lab you run hook experiments, buyer behavior
          breakdowns, weak-versus-strong makeovers, script transformations, and conversion diagnostics.
        </p>
        <Link href="/human-buying-lab" className="neon-btn" style={{ ...linkStyle, fontSize: 16.5 }}>
          Enter The Human Buying Lab →
        </Link>
      </section>

      <p style={{ textAlign: "center", margin: 0, fontSize: 15, color: "#ddd0ff" }}>
        Go deeper with <Link href="/creator-growth/human-behind-the-view" style={linkStyle}>The Human Behind the View</Link>,
        evaluate every video in the <Link href="/creator-growth/product-to-purchase-lab" style={linkStyle}>Product-to-Purchase Lab</Link>,
        and keep training in the <Link href="/coach" style={linkStyle}>Creator Growth Center</Link>.
      </p>
    </div>
  );
}
