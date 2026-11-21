import type { Metadata } from "next";
import AttentionReactor, { ChallengeTracker } from "@/components/AttentionReactor";
import {
  PHILOSOPHY,
  TRIGGERS,
  CONTROVERSY_FORMULA,
  CONTROVERSY_PAIRS,
  CONTROVERSY_NOTE,
  CAPTURE_INTRO,
  CAPTURE_SEQUENCE,
  JOURNEY_INTRO,
  JOURNEY,
  STARTERS_INTRO,
  CONVERSATION_STARTERS,
  TRANSFORMATION,
  NEVER_INTRO,
  NEVER_LIST,
  NEVER_CLOSE,
  CREATOR_CODE,
  CREATOR_CODE_CLOSE,
} from "@/lib/attention";

/* THE ART OF CAPTIVATING HUMAN ATTENTION — UltraVestra's Human
 * Attention Intelligence Masterclass. Not a lesson about hooks: a
 * complete system for earning attention honestly — the 15 attention
 * triggers, the Friendly Controversy Laboratory, the first-three-
 * seconds capture sequence, the emotional journey, and the Human
 * Attention Reactor that turns it all into concepts.
 * Source document: content/art-of-captivating-attention.md. */

export const metadata: Metadata = {
  title: "The Art of Captivating Human Attention | UltraVestra",
  description:
    "Don't just stop the scroll. Capture the imagination. UltraVestra's Human Attention Intelligence Masterclass: the 15 attention triggers, the Friendly Controversy Laboratory, the emotional journey — and the Human Attention Reactor. Don't manufacture attention. Earn it.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/creator-growth/art-of-captivating-attention",
  },
  openGraph: {
    title: "The Art of Captivating Human Attention | UltraVestra",
    description:
      "Don't just stop the scroll. Capture the imagination. Trigger curiosity. Create a feeling. Start a conversation. The 15 attention triggers and the Human Attention Reactor — attention earned, never manufactured.",
    url: "https://ultra-vestra.vercel.app/creator-growth/art-of-captivating-attention",
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
const thStyle: React.CSSProperties = { textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" };
const tdStyle: React.CSSProperties = { padding: "8px 12px", borderBottom: "1px solid #4c1d95", color: "#ddd0ff" };

export default function ArtOfCaptivatingAttentionPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO — THE MASTERCLASS */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          ULTRAVESTRA CREATOR MASTERCLASS · HUMAN ATTENTION INTELLIGENCE
        </span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 8px", fontWeight: 800 }}>
          The Art of Captivating Human Attention
        </h1>
        <p style={{ color: "#f0abfc", fontSize: 21, fontWeight: 800, margin: "0 auto 10px", maxWidth: 720 }}>
          {PHILOSOPHY.headline}
        </p>
        <p style={{ color: "#67e8f9", fontSize: 16.5, fontWeight: 700, letterSpacing: 0.6, margin: "0 auto 14px", maxWidth: 700 }}>
          {PHILOSOPHY.mantra}
        </p>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          {PHILOSOPHY.paragraphs.map((p) => (
            <p key={p.slice(0, 32)} style={{ color: "#ddd0ff", fontSize: 16, margin: "0 0 10px" }}>{p}</p>
          ))}
        </div>
      </section>

      {/* THE HUMAN ATTENTION REACTOR */}
      <AttentionReactor />

      {/* THE 15 ATTENTION TRIGGERS */}
      <section style={panel}>
        <h2 style={h2style}>The 15 Attention Triggers</h2>
        <p style={sub}>
          Each trigger gives viewers a different reason to stop, watch, and participate. Learn all fifteen — then
          let the Reactor match them to the outcome you want.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
          {TRIGGERS.map((t, i) => (
            <article key={t.name} style={card}>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, letterSpacing: 1.4, color: "#67e8f9" }}>
                TRIGGER {String(i + 1).padStart(2, "0")}
              </p>
              <h3 style={{ margin: "0 0 6px", fontSize: 17.5, color: "#f3e8ff" }}>{t.name}</h3>
              <p style={{ margin: "0 0 8px", color: "#ddd0ff", fontSize: 14.5 }}>{t.does}</p>
              <p style={{ margin: 0, color: "#f0abfc", fontSize: 14.5, fontStyle: "italic" }}>&ldquo;{t.example}&rdquo;</p>
            </article>
          ))}
        </div>
      </section>

      {/* THE FRIENDLY CONTROVERSY LABORATORY */}
      <section style={panel}>
        <h2 style={h2style}>The Friendly Controversy Laboratory</h2>
        <p style={sub}>
          An UltraVestra signature technique. {CONTROVERSY_NOTE}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
          {CONTROVERSY_FORMULA.map((f, i) => (
            <span key={f.step} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "#2e1065", border: "1px solid #e879f9", borderRadius: 999, padding: "7px 16px", fontWeight: 800, color: "#f0abfc", fontSize: 15 }}>
                {f.step}
              </span>
              {i < CONTROVERSY_FORMULA.length - 1 && <span style={{ color: "#67e8f9", fontWeight: 800 }}>→</span>}
            </span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12, marginBottom: 18 }}>
          {CONTROVERSY_FORMULA.map((f) => (
            <div key={f.step} style={card}>
              <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "#f3e8ff" }}>{f.step}</h3>
              <p style={{ margin: 0, color: "#ddd0ff", fontSize: 14.5 }}>{f.meaning}</p>
            </div>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr>
                <th style={thStyle}>Instead of saying…</th>
                <th style={thStyle}>Say this…</th>
              </tr>
            </thead>
            <tbody>
              {CONTROVERSY_PAIRS.map((pair) => (
                <tr key={pair.instead}>
                  <td style={{ ...tdStyle, color: "#fda4af" }}>{pair.instead}</td>
                  <td style={{ ...tdStyle, color: "#f3e8ff" }}>&ldquo;{pair.say}&rdquo;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* THE FIRST-THREE-SECONDS CAPTURE SEQUENCE */}
      <section style={panel}>
        <h2 style={h2style}>The First-Three-Seconds Capture Sequence</h2>
        <p style={sub}>{CAPTURE_INTRO} Three moves, three seconds, one mission: give the right person a reason to stay.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
          {CAPTURE_SEQUENCE.map((beat) => (
            <article key={beat.time} style={card}>
              <p className="wow-title" style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px", lineHeight: 1 }}>{beat.time}</p>
              <h3 style={{ margin: "0 0 6px", fontSize: 17.5, color: "#f3e8ff" }}>{beat.move}</h3>
              <p style={{ margin: 0, color: "#ddd0ff", fontSize: 14.5 }}>{beat.detail}</p>
              {beat.example && (
                <p style={{ margin: "8px 0 0", color: "#f0abfc", fontSize: 14.5, fontStyle: "italic" }}>&ldquo;{beat.example}&rdquo;</p>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* THE EMOTIONAL JOURNEY + CONVERSATION STARTERS */}
      <section style={panel}>
        <h2 style={h2style}>The Emotional Journey of a Captivating Video</h2>
        <p style={sub}>{JOURNEY_INTRO}</p>
        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr>
                <th style={thStyle}>Stage</th>
                <th style={thStyle}>Viewer experience</th>
                <th style={thStyle}>Creator&rsquo;s job</th>
              </tr>
            </thead>
            <tbody>
              {JOURNEY.map((j) => (
                <tr key={j.stage}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#f3e8ff" }}>{j.stage}</td>
                  <td style={{ ...tdStyle, fontStyle: "italic", color: "#67e8f9" }}>{j.viewer}</td>
                  <td style={tdStyle}>{j.job}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 style={{ fontSize: 19, margin: "0 0 6px", fontWeight: 800, color: "#f3e8ff" }}>Make Viewers Want to Comment</h3>
        <p style={{ ...sub, marginBottom: 12 }}>{STARTERS_INTRO}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {CONVERSATION_STARTERS.map((s, i) => (
            <p key={s.text} style={{ margin: 0, color: "#f3e8ff", fontSize: 15 }}>
              <span style={{ color: "#f0abfc", fontWeight: 800 }}>{i + 1}.</span> &ldquo;{s.text}&rdquo;
            </p>
          ))}
        </div>
      </section>

      {/* THE PRODUCT VIDEO TRANSFORMATION */}
      <section style={panel}>
        <h2 style={h2style}>The Product Video Transformation</h2>
        <p style={sub}>The mindset shift underneath everything in this masterclass.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 18 }}>
          <div style={{ ...card, borderColor: "#9f1239" }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 800, letterSpacing: 1.4, color: "#fda4af" }}>STOP THINKING</p>
            <p style={{ margin: 0, color: "#f3e8ff", fontSize: 16, fontStyle: "italic" }}>&ldquo;{TRANSFORMATION.stopThinking}&rdquo;</p>
          </div>
          <div style={{ ...card, borderColor: "#e879f9" }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 800, letterSpacing: 1.4, color: "#67e8f9" }}>START THINKING</p>
            <p style={{ margin: 0, color: "#f3e8ff", fontSize: 16, fontStyle: "italic" }}>&ldquo;{TRANSFORMATION.startThinking}&rdquo;</p>
          </div>
        </div>
        <p style={body}>
          For example, instead of simply showing {TRANSFORMATION.exampleProduct} — one product, seven experiences:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TRANSFORMATION.angles.map((a) => (
            <div key={a.angle} style={{ ...card, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "baseline", padding: "10px 16px" }}>
              <span style={{ fontWeight: 800, color: "#f0abfc", minWidth: 110 }}>{a.angle}</span>
              <span style={{ color: "#f3e8ff", fontSize: 15 }}>{a.line}</span>
            </div>
          ))}
        </div>
        <p style={{ ...body, marginTop: 14, marginBottom: 0, fontWeight: 700, color: "#f0abfc" }}>{TRANSFORMATION.closing}</p>
      </section>

      {/* THE 7-DAY CHALLENGE */}
      <section style={panel}>
        <h2 style={h2style}>The UltraVestra Captivating-Content Challenge</h2>
        <p style={sub}>7 days of attention mastery. One skill a day, practiced in public, honestly.</p>
        <ChallengeTracker />
      </section>

      {/* THE RULE + THE CREATOR CODE */}
      <section style={{ ...panel, textAlign: "center" }}>
        <h2 style={h2style}>The Rule That Separates Attention From Manipulation</h2>
        <p style={{ ...sub, marginBottom: 12 }}>{NEVER_INTRO}</p>
        <ul style={{ listStyle: "none", margin: "0 auto 14px", padding: 0, maxWidth: 520, display: "flex", flexDirection: "column", gap: 5 }}>
          {NEVER_LIST.map((n) => (
            <li key={n} style={{ color: "#fda4af", fontSize: 15.5, fontWeight: 600 }}>✕&nbsp; {n}</li>
          ))}
        </ul>
        <p style={{ ...body, marginBottom: 26 }}>{NEVER_CLOSE}</p>
        <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: "#67e8f9", margin: "0 0 14px" }}>
          THE ULTRAVESTRA CREATOR CODE
        </p>
        {CREATOR_CODE.map((line) => (
          <p key={line} className="wow-title" style={{ fontSize: 30, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.25 }}>
            {line}
          </p>
        ))}
        <p style={{ color: "#f0abfc", fontSize: 19, fontWeight: 800, margin: "16px 0 6px" }}>{CREATOR_CODE_CLOSE}</p>
        <p style={{ color: "#ddd0ff", fontSize: 14.5, margin: 0, letterSpacing: 1 }}>
          ULTRAVESTRA — THE INTELLIGENCE BEHIND YOUR CREATOR BUSINESS.
        </p>
      </section>
    </div>
  );
}
