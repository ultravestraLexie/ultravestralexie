import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import LiveMastery from "@/components/LiveMastery";
import {
  PHILOSOPHY,
  PILLARS,
  AUDIENCE_SIGNALS,
  LIVE_CYCLE,
  LIVE_CYCLE_NOTE,
  TRANSFORMATION,
  CREATOR_CODE,
} from "@/lib/pillars";

/* THE ART OF HUMAN CONNECTION & CONVERSION — UltraVestra's signature
 * LIVE mastery experience. A philosophy for TikTok LIVE hosting:
 * command attention, earn trust, lead conversations, and convert
 * without losing authenticity. Not another list of selling tips.
 * The 12 Pillars, the 60-second cycle, the host checklist (inside the
 * tools), the transformation, and the Creator Code.
 * Source document: content/art-of-human-connection-conversion.md. */

export const metadata: Metadata = {
  title: "The Art of Human Connection & Conversion | UltraVestra",
  description:
    "Don't just go LIVE. Become the reason people stay. UltraVestra's signature LIVE mastery experience: the 12 Pillars of Creator Mastery — capture attention, create connection, build trust, and inspire action, without losing your authenticity.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/creator-growth/art-of-human-connection",
  },
  openGraph: {
    title: "The Art of Human Connection & Conversion | UltraVestra",
    description:
      "Don't just go LIVE. Become the reason people stay. The 12 Pillars of Creator Mastery — capture attention, create connection, build trust, and inspire action, without losing your authenticity.",
    url: "https://ultra-vestra.vercel.app/creator-growth/art-of-human-connection",
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

export default async function ArtOfHumanConnectionPage() {
  await requireSubscription("/creator-growth/art-of-human-connection");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO — THE PHILOSOPHY */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          ULTRAVESTRA CREATOR GROWTH CENTER · SIGNATURE EXPERIENCE
        </span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 8px", fontWeight: 800 }}>
          The Art of Human Connection &amp; Conversion
        </h1>
        <p style={{ color: "#f0abfc", fontSize: 21, fontWeight: 800, margin: "0 auto 10px", maxWidth: 720 }}>
          {PHILOSOPHY.headline}
        </p>
        <p style={{ color: "#67e8f9", fontSize: 16.5, fontWeight: 700, letterSpacing: 0.6, margin: "0 auto 14px", maxWidth: 700 }}>
          The UltraVestra philosophy: {PHILOSOPHY.mantra}
        </p>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          {PHILOSOPHY.paragraphs.map((p) => (
            <p key={p.slice(0, 32)} style={{ color: "#ddd0ff", fontSize: 16, margin: "0 0 10px" }}>{p}</p>
          ))}
        </div>
      </section>

      {/* THE 12 PILLARS */}
      <section style={panel}>
        <h2 style={h2style}>The UltraVestra 12 Pillars of Creator Mastery</h2>
        <p style={sub}>
          Twelve disciplines of the host — not tips to memorize, but a way of being on camera. Each pillar ends with
          its UltraVestra principle: the line to carry into every LIVE.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {PILLARS.map((pillar) => (
            <article key={pillar.number} style={{ ...card, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
                <span className="wow-title" style={{ fontSize: 38, fontWeight: 800, lineHeight: 1 }}>{pillar.number}</span>
                <div>
                  <h3 style={{ fontSize: 22, margin: 0, fontWeight: 800, color: "#f3e8ff" }}>{pillar.name}</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 15.5, fontWeight: 700, color: "#f0abfc" }}>{pillar.essence}</p>
                </div>
              </div>
              <p style={{ ...body, marginTop: 12 }}>{pillar.intro}</p>
              <ul style={{ margin: "0 0 14px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
                {pillar.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
              {pillar.number === "11" && (
                <div style={{ overflowX: "auto", margin: "0 0 14px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Audience signal</th>
                        <th style={thStyle}>What it might indicate</th>
                        <th style={thStyle}>What to do</th>
                      </tr>
                    </thead>
                    <tbody>
                      {AUDIENCE_SIGNALS.map((s) => (
                        <tr key={s.signal}>
                          <td style={{ ...tdStyle, fontWeight: 700, color: "#f3e8ff" }}>{s.signal}</td>
                          <td style={tdStyle}>{s.indicates}</td>
                          <td style={tdStyle}>{s.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p style={{ margin: 0, fontSize: 15.5, borderLeft: "3px solid #e879f9", paddingLeft: 14, color: "#f3e8ff" }}>
                <strong style={{ color: "#e879f9" }}>UltraVestra principle:</strong> {pillar.principle}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* THE TOOLS */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">The LIVE Mastery Tools</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          The philosophy, turned into practice. Diagnose yourself against the Pillars, build your 60-second cycle,
          and run the professional host checklist — before, during, and after every LIVE.
        </p>
      </div>
      <LiveMastery />

      {/* THE 60-SECOND CYCLE */}
      <section style={panel}>
        <h2 style={h2style}>The LIVE Mastery Blueprint — the 60-Second Cycle</h2>
        <p style={sub}>
          A useful practice loop for hosts: repeatable segments that welcome both existing viewers and newcomers,
          sixty seconds at a time.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15.5 }}>
            <thead>
              <tr>
                <th style={thStyle}>Segment</th>
                <th style={thStyle}>What the host does</th>
              </tr>
            </thead>
            <tbody>
              {LIVE_CYCLE.map((seg) => (
                <tr key={seg.time}>
                  <td style={{ ...tdStyle, fontWeight: 800, color: "#67e8f9", whiteSpace: "nowrap" }}>{seg.time}</td>
                  <td style={{ ...tdStyle, color: "#f3e8ff" }}>{seg.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...body, margin: "14px 0 0" }}>{LIVE_CYCLE_NOTE}</p>
      </section>

      {/* THE TRANSFORMATION */}
      <section style={panel}>
        <h2 style={h2style}>The UltraVestra Transformation</h2>
        <p style={sub}>
          A creator&rsquo;s journey should be bigger than learning how to sell one product. It should be a
          transformation in how they think, communicate, perform, and understand people.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15.5 }}>
            <thead>
              <tr>
                <th style={thStyle}>The uncertain creator</th>
                <th style={thStyle}>The developing creator</th>
              </tr>
            </thead>
            <tbody>
              {TRANSFORMATION.map((pair) => (
                <tr key={pair.uncertain}>
                  <td style={tdStyle}>{pair.uncertain}</td>
                  <td style={{ ...tdStyle, color: "#f3e8ff", fontWeight: 700 }}>{pair.developing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* THE CREATOR CODE */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>
          THE ULTRAVESTRA CREATOR CODE
        </span>
        <p className="wow-title" style={{ fontSize: 30, fontWeight: 800, margin: "14px auto 16px", maxWidth: 640 }}>
          {CREATOR_CODE.motto}
        </p>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {CREATOR_CODE.statements.map((s) => (
            <p key={s.slice(0, 32)} style={{ color: "#f3e8ff", fontSize: 16.5, margin: "0 0 10px" }}>{s}</p>
          ))}
        </div>
        <p style={{ color: "#67e8f9", fontWeight: 800, letterSpacing: 1.5, fontSize: 14.5, margin: "20px 0 0" }}>
          {CREATOR_CODE.closing}
        </p>
      </section>

      <p style={{ textAlign: "center", margin: 0, fontSize: 15, color: "#ddd0ff" }}>
        Pair this with the <Link href="/creator-growth/human-emotion-video-playbook" style={linkStyle}>Human Emotion Video Playbook</Link> for
        recorded video, and the <Link href="/coach" style={linkStyle}>Creator Growth Center</Link> to diagnose the videos you publish.
      </p>
    </div>
  );
}
