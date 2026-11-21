import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import First3Chamber from "@/components/First3Chamber";
import {
  MISSION,
  THREE_BEATS,
  OPENING_STYLES,
  EXAMPLE_HOOKS,
  SEQUENCE,
  TIMED_EXAMPLE,
  MISTAKE_NOTE,
  MEASURE,
  MEASURE_NOTE,
  RULE,
} from "@/lib/first3";

/* THE FIRST 3 SECONDS — UltraVestra Creator Masterclass.
 * A complete First 3 Seconds Intelligence System: the three-second
 * breakdown, the 15 powerful opening styles, five complete worked
 * hooks, the biggest mistake (a good hook followed by nothing) and
 * the HOOK → PROOF → VALUE → PAYOFF → ACTION sequence, the testing
 * lab (the Chamber), what to measure, and THE ULTRAVESTRA RULE.
 * Source document: content/first-3-seconds.md. */

export const metadata: Metadata = {
  title: "The First 3 Seconds: Win the Scroll or Lose the Viewer | UltraVestra",
  description:
    "The first three seconds can determine whether someone keeps watching or scrolls past. UltraVestra's First 3 Seconds Intelligence System: the Interrupt–Connect–Stay breakdown, 15 powerful opening styles, five complete hooks, the Hook → Proof → Value → Payoff → Action sequence, and the testing lab — a creative testing hypothesis, never a guaranteed formula.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/creator-growth/first-3-seconds",
  },
  openGraph: {
    title: "The First 3 Seconds: Win the Scroll or Lose the Viewer | UltraVestra",
    description:
      "Give the right person a compelling reason to stop — not by shouting, begging, or promising, but with something interesting, useful, surprising, or relevant. The complete First 3 Seconds Intelligence System for UltraVestra creators.",
    url: "https://ultra-vestra.vercel.app/creator-growth/first-3-seconds",
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

export default async function First3SecondsPage() {
  await requireSubscription("/creator-growth/first-3-seconds");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO — THE MISSION */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          ULTRAVESTRA CREATOR MASTERCLASS
        </span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 8px", fontWeight: 800 }}>
          The First 3 Seconds
        </h1>
        <p style={{ color: "#f0abfc", fontSize: 21, fontWeight: 800, margin: "0 auto 10px", maxWidth: 720 }}>
          {MISSION.headline}
        </p>
        <p style={{ color: "#67e8f9", fontSize: 16.5, fontWeight: 700, letterSpacing: 0.6, margin: "0 auto 14px", maxWidth: 700 }}>
          The first three seconds can determine whether someone keeps watching or scrolls past.
        </p>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          {MISSION.paragraphs.map((p) => (
            <p key={p.slice(0, 32)} style={{ color: "#ddd0ff", fontSize: 16, margin: "0 0 10px" }}>{p}</p>
          ))}
        </div>
      </section>

      {/* THE THREE-SECOND BREAKDOWN */}
      <section style={panel}>
        <h2 style={h2style}>The Three-Second Breakdown</h2>
        <p style={sub}>
          Every second has one job. Interrupt, connect, and create a reason to stay — in that order, in three
          seconds.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {THREE_BEATS.map((beat, i) => (
            <article key={beat.second} style={{ ...card, padding: "20px 22px" }}>
              <p className="wow-title" style={{ fontSize: 30, fontWeight: 800, margin: "0 0 2px", lineHeight: 1 }}>
                {i + 1}
              </p>
              <h3 style={{ fontSize: 19, margin: "6px 0 2px", fontWeight: 800, color: "#f3e8ff" }}>
                {beat.second.toUpperCase()} — {beat.name}
              </h3>
              <p style={{ margin: "0 0 10px", fontSize: 15.5, fontWeight: 700, color: "#f0abfc" }}>{beat.tagline}</p>
              <p style={{ ...body, margin: "0 0 12px" }}>{beat.description}</p>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#ddd0ff", fontSize: 15, display: "flex", flexDirection: "column", gap: 4 }}>
                {beat.examples.map((ex) => <li key={ex}>{ex}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* THE 15 OPENING STYLES */}
      <section style={panel}>
        <h2 style={h2style}>The 15 Powerful Opening Styles</h2>
        <p style={sub}>
          Fifteen opening approaches UltraVestra creators should learn to use. Each gives the viewer a different
          reason to stop — learn them all, then test them.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15.5 }}>
            <thead>
              <tr>
                <th style={thStyle}>Opening style</th>
                <th style={thStyle}>Example</th>
              </tr>
            </thead>
            <tbody>
              {OPENING_STYLES.map((s) => (
                <tr key={s.style}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#f3e8ff", whiteSpace: "nowrap" }}>{s.style}</td>
                  <td style={tdStyle}>{s.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FIVE COMPLETE HOOKS */}
      <section style={panel}>
        <h2 style={h2style}>Five Complete Three-Second Hooks</h2>
        <p style={sub}>
          Complete openings for a skincare product — the spoken line, the visual, and why it may work. Study how
          each one does all three seconds&rsquo; jobs at once.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {EXAMPLE_HOOKS.map((hook) => (
            <article key={hook.letter} style={{ ...card, padding: "18px 22px" }}>
              <p style={{ margin: "0 0 8px", fontSize: 16.5 }}>
                <span className="wow-title" style={{ fontWeight: 800, fontSize: 22 }}>Hook {hook.letter}</span>{" "}
                <strong style={{ color: "#f0abfc" }}>— {hook.style}</strong>
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#67e8f9" }}>Spoken:</strong> &ldquo;{hook.spoken}&rdquo;
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#67e8f9" }}>Visual:</strong> {hook.visual}
              </p>
              <p style={{ margin: 0, fontSize: 15.5, color: "#ddd0ff" }}>
                <strong style={{ color: "#67e8f9" }}>Why it may work:</strong> {hook.why}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* THE BIGGEST MISTAKE + THE SEQUENCE */}
      <section style={panel}>
        <h2 style={h2style}>The Biggest Mistake: A Good Hook Followed by Nothing</h2>
        <p style={sub}>{MISTAKE_NOTE}</p>
        <p style={{ margin: "0 0 16px", fontSize: 19, fontWeight: 800, letterSpacing: 0.6, color: "#f3e8ff", textAlign: "center" }}>
          {SEQUENCE.map((s, i) => (
            <span key={s.step}>
              <span style={{ color: "#f0abfc" }}>{s.step.toUpperCase()}</span>
              {i < SEQUENCE.length - 1 && <span style={{ color: "#67e8f9" }}> → </span>}
            </span>
          ))}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
          {SEQUENCE.map((s) => (
            <div key={s.step} style={{ ...card, textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>{s.step}</p>
              <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>{s.question}</p>
            </div>
          ))}
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>The sequence, timed — a skincare example</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15.5 }}>
            <thead>
              <tr>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Step</th>
                <th style={thStyle}>What happens</th>
              </tr>
            </thead>
            <tbody>
              {TIMED_EXAMPLE.map((row) => (
                <tr key={row.time}>
                  <td style={{ ...tdStyle, fontWeight: 800, color: "#67e8f9", whiteSpace: "nowrap" }}>{row.time}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#f3e8ff", whiteSpace: "nowrap" }}>{row.step}</td>
                  <td style={{ ...tdStyle, color: "#f3e8ff" }}>{row.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* THE TESTING LAB */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">The First-Three-Seconds Testing Lab</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          Don&rsquo;t assume your favorite hook is the best. Build it, build its rival, and test them.
        </p>
      </div>
      <First3Chamber />

      {/* WHAT TO MEASURE */}
      <section style={panel}>
        <h2 style={h2style}>What to Measure</h2>
        <p style={sub}>
          The first three seconds are a creative testing hypothesis, not a guaranteed attention formula. After
          each version, review:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {MEASURE.map((m, i) => (
            <div key={m} style={card}>
              <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#67e8f9" }}>{i + 1}.</strong> {m}
              </p>
            </div>
          ))}
        </div>
        <p style={{ ...body, margin: "16px 0 0" }}>{MEASURE_NOTE}</p>
      </section>

      {/* THE ULTRAVESTRA RULE */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>
          THE ULTRAVESTRA RULE
        </span>
        <p className="wow-title" style={{ fontSize: 28, fontWeight: 800, margin: "14px auto 16px", maxWidth: 680 }}>
          {RULE.headline}
        </p>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {RULE.lines.map((line) => (
            <p key={line} style={{ color: "#f3e8ff", fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>{line}</p>
          ))}
        </div>
        <p style={{ color: "#67e8f9", fontWeight: 800, letterSpacing: 0.6, fontSize: 15.5, margin: "18px 0 0" }}>
          {RULE.closing}
        </p>
      </section>

      <p style={{ textAlign: "center", margin: 0, fontSize: 15, color: "#ddd0ff" }}>
        Go deeper with the <Link href="/creator-growth/human-emotion-video-playbook" style={linkStyle}>Human Emotion Video Playbook</Link>,
        master the room with <Link href="/creator-growth/art-of-human-connection" style={linkStyle}>The Art of Human Connection &amp; Conversion</Link>,
        and keep learning in the <Link href="/coach" style={linkStyle}>Creator Growth Center</Link>.
      </p>
    </div>
  );
}
