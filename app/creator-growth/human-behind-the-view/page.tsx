import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import PsychologyLab from "@/components/PsychologyLab";
import {
  TAGLINE,
  SUBJECT_INTRO,
  TRUTH,
  AUDIENCE_QUESTIONS,
  BIGGEST_MISTAKE,
  BLENDER_THINKING,
  FIRST_SECOND_JOB,
  OPENING_TECHNIQUES,
  HOOK_MATCH_RULE,
  FIRST_SECOND,
  FIRST_SECOND_NOTE,
  SAY_PAIRS,
  AVOID_PHRASES,
  USE_INSTEAD,
  HONESTY_RULE,
  BLENDER_MATRIX,
  MATRIX_INTRO,
  MATRIX_NOTE,
  MATRIX_RULE,
  AD_FRAMEWORK,
  EXAMPLE_SCRIPT,
  SCRIPT_DISCLAIMER,
  VISUAL_ELEMENTS,
  VISUAL_NOTE,
  DIAGNOSTIC_INTRO,
  DIAGNOSTIC,
  DIAGNOSTIC_CAVEAT,
  TESTING_VERSIONS,
  TESTING_RULE,
  TESTING_METRICS,
  TESTING_CLOSING,
  PLATFORMS,
  PLATFORMS_NOTE,
  PHILOSOPHY,
  BRAND_AD_CONTEXT,
  BRAND_AD_WEAK,
  BRAND_AD,
  CURRICULUM,
  NEVER_COMPROMISE,
  ENGRAVED,
  RESOURCES,
} from "@/lib/psychology";

/* THE HUMAN BEHIND THE VIEW — Audience Psychology & Advertising
 * Intelligence. A permanent signature subject of the UltraVestra
 * Original Curriculum: the psychology of the person watching, the
 * first second, what to say versus what not to say, the one-product /
 * five-audiences matrix, the six-stage advertising framework, visual
 * strength, the Psychology Lab, the diagnostic, the testing
 * psychology, platform differences, the advertising philosophy,
 * UltraVestra's own brand advertisement, the core lessons, and the
 * engraved principle. Source: content/audience-psychology-intelligence.md. */

export const metadata: Metadata = {
  title: "The Human Behind the View: Audience Psychology & Advertising Intelligence | UltraVestra",
  description:
    "Stop making videos just to show products. Start making videos that make people understand why they matter. UltraVestra's signature subject: the five audience questions, the first second, say-vs-not-say, the one-product/five-audiences matrix, the six-stage advertising framework, the diagnostic, and the engraved principle — the viewer is not waiting for your video.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/creator-growth/human-behind-the-view",
  },
  openGraph: {
    title: "The Human Behind the View: Audience Psychology & Advertising Intelligence | UltraVestra",
    description:
      "Views are attention. Watch time is engagement. Trust creates consideration. Learn how people think, what captures their attention, why they trust, how they evaluate products, and what influences their decisions.",
    url: "https://ultra-vestra.vercel.app/creator-growth/human-behind-the-view",
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

export default async function HumanBehindTheViewPage() {
  await requireSubscription("/creator-growth/human-behind-the-view");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          ULTRA VESTRA ORIGINAL CURRICULUM · SIGNATURE SUBJECT
        </span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 8px", fontWeight: 800 }}>
          The Human Behind the View
        </h1>
        <p style={{ color: "#f0abfc", fontSize: 21, fontWeight: 800, margin: "0 auto 10px", maxWidth: 760 }}>
          Audience Psychology &amp; Advertising Intelligence
        </p>
        <p style={{ color: "#67e8f9", fontSize: 17, fontWeight: 700, margin: "0 auto 14px", maxWidth: 760 }}>
          {TAGLINE}
        </p>
        <p style={{ color: "#ddd0ff", fontSize: 16, margin: "0 auto", maxWidth: 720 }}>
          {SUBJECT_INTRO} Approached from sales psychology, consumer behavior, advertising, and content strategy.
        </p>
      </section>

      {/* ONE IMPORTANT TRUTH */}
      <section style={{ ...panel, textAlign: "center" }}>
        <h2 style={h2style}>One Important Truth</h2>
        <p style={{ color: "#f3e8ff", fontSize: 17.5, margin: "0 auto 20px", maxWidth: 760 }}>{TRUTH.statement}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 18 }}>
          {TRUTH.stages.map((s) => (
            <div key={s.term} style={card}>
              <p style={{ margin: "0 0 4px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>{s.term}</p>
              <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>{s.meaning}</p>
            </div>
          ))}
        </div>
        <p style={{ color: "#67e8f9", fontWeight: 700, fontSize: 15.5, margin: 0 }}>{TRUTH.closing}</p>
      </section>

      {/* 1. THE PSYCHOLOGY OF THE PERSON WATCHING */}
      <section style={panel}>
        <h2 style={h2style}>1 · The Psychology of the Person Watching</h2>
        <p style={sub}>
          Before creators make a video, they need to understand five things about their audience.
        </p>
        <div style={{ overflowX: "auto", marginBottom: 18 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15.5 }}>
            <thead>
              <tr>
                <th style={thStyle}>Audience question</th>
                <th style={thStyle}>What creators need to understand</th>
              </tr>
            </thead>
            <tbody>
              {AUDIENCE_QUESTIONS.map((q) => (
                <tr key={q.question}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#f3e8ff", whiteSpace: "nowrap" }}>{q.question}</td>
                  <td style={tdStyle}>{q.understand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...body, fontWeight: 700, color: "#f0abfc" }}>{BIGGEST_MISTAKE}</p>
        <div style={{ ...card, padding: "18px 22px" }}>
          <p style={{ margin: "0 0 10px", fontSize: 16, color: "#f3e8ff" }}>
            Example — <strong>{BLENDER_THINKING.product}</strong>:
          </p>
          <p style={{ margin: "0 0 8px", fontSize: 15.5, color: "#ddd0ff" }}>
            <strong style={{ color: "#fda4af" }}>Creator-centered thinking:</strong> {BLENDER_THINKING.creatorCentered}
          </p>
          <p style={{ margin: "0 0 8px", fontSize: 15.5, color: "#ddd0ff" }}>
            <strong style={{ color: "#67e8f9" }}>Audience-centered thinking:</strong> {BLENDER_THINKING.audienceCentered}
          </p>
          <p style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "#f3e8ff" }}>{BLENDER_THINKING.result}</p>
        </div>
      </section>

      {/* 2. THE FIRST SECOND */}
      <section style={panel}>
        <h2 style={h2style}>2 · The First Second: Win Attention, Not the Sale</h2>
        <p style={{ ...body, fontSize: 17, fontWeight: 700 }}>{FIRST_SECOND_JOB.headline}</p>
        <p style={body}>{FIRST_SECOND_JOB.notTheJob}</p>
        <p style={{ ...body, marginBottom: 20 }}>{FIRST_SECOND_JOB.shouldCreate}</p>

        <p style={{ margin: "0 0 10px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>Six opening techniques creators should master</p>
        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15.5 }}>
            <thead>
              <tr>
                <th style={thStyle}>Technique</th>
                <th style={thStyle}>Example opening</th>
              </tr>
            </thead>
            <tbody>
              {OPENING_TECHNIQUES.map((t) => (
                <tr key={t.technique}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#f3e8ff", whiteSpace: "nowrap" }}>{t.technique}</td>
                  <td style={tdStyle}>{t.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...body, fontWeight: 700, color: "#f0abfc" }}>{HOOK_MATCH_RULE}</p>

        <p style={{ margin: "18px 0 10px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>What should happen in the first second?</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 16 }}>
          {FIRST_SECOND.map((m) => (
            <article key={m.window} style={{ ...card, padding: "18px 20px" }}>
              <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 800, color: "#67e8f9" }}>{m.window}</p>
              <h3 style={{ fontSize: 18, margin: "0 0 8px", fontWeight: 800, color: "#f3e8ff" }}>{m.name}</h3>
              <p style={{ margin: "0 0 8px", fontSize: 15, color: "#ddd0ff" }}>{m.description}</p>
              {m.viewer_thoughts.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 15, display: "flex", flexDirection: "column", gap: 4 }}>
                  {m.viewer_thoughts.map((t) => <li key={t}>{t}</li>)}
                </ul>
              )}
            </article>
          ))}
        </div>
        <p style={{ ...body, margin: 0 }}>{FIRST_SECOND_NOTE}</p>
      </section>

      {/* 3. SAY VS NOT SAY */}
      <section style={panel}>
        <h2 style={h2style}>3 · What to Say Versus What NOT to Say</h2>
        <p style={sub}>
          This is one of the most important lessons UltraVestra teaches. The difference between an ineffective
          advertisement and a compelling one is often the way the message is communicated.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {SAY_PAIRS.map((pair) => (
            <article key={pair.category} style={{ ...card, padding: "18px 22px" }}>
              <p style={{ margin: "0 0 10px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>{pair.category}</p>
              <p style={{ margin: "0 0 4px", fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#fda4af" }}>Weak:</strong> {pair.weak}
              </p>
              {pair.why_weak && (
                <p style={{ margin: "0 0 10px", fontSize: 14.5, color: "#ddd0ff" }}>
                  <strong style={{ color: "#f0abfc" }}>Why it needs improvement:</strong> {pair.why_weak}
                </p>
              )}
              <p style={{ margin: "0 0 4px", fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#67e8f9" }}>Stronger:</strong> {pair.stronger}
              </p>
              {pair.why_stronger && (
                <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>
                  <strong style={{ color: "#f0abfc" }}>Why it works better:</strong> {pair.why_stronger}
                </p>
              )}
            </article>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 18 }}>
          <div style={{ ...card, border: "1px solid #7f1d3d" }}>
            <p style={{ margin: "0 0 10px", fontSize: 15.5, fontWeight: 800, color: "#fda4af" }}>WORDS AND PHRASES TO USE CAREFULLY — AVOID</p>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 15, display: "flex", flexDirection: "column", gap: 5 }}>
              {AVOID_PHRASES.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
          <div style={{ ...card, border: "1px solid #22d3ee" }}>
            <p style={{ margin: "0 0 10px", fontSize: 15.5, fontWeight: 800, color: "#67e8f9" }}>USE INSTEAD</p>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 15, display: "flex", flexDirection: "column", gap: 5 }}>
              {USE_INSTEAD.map((u) => <li key={u}>{u}</li>)}
            </ul>
          </div>
        </div>
        <p style={{ ...body, margin: 0, fontWeight: 700 }}>
          Unbiased advice: {HONESTY_RULE}
        </p>
      </section>

      {/* 4. THE AD MUST MATCH THE AUDIENCE */}
      <section style={panel}>
        <h2 style={h2style}>4 · The Advertisement Must Match the Audience</h2>
        <p style={sub}>{MATRIX_INTRO} This is where audience psychology becomes powerful — the example product is a portable blender.</p>
        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15.5 }}>
            <thead>
              <tr>
                <th style={thStyle}>Audience</th>
                <th style={thStyle}>What matters to them</th>
                <th style={thStyle}>Video angle</th>
              </tr>
            </thead>
            <tbody>
              {BLENDER_MATRIX.map((row) => (
                <tr key={row.audience}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#f3e8ff", whiteSpace: "nowrap" }}>{row.audience}</td>
                  <td style={tdStyle}>{row.matters}</td>
                  <td style={{ ...tdStyle, color: "#f3e8ff" }}>{row.angle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={body}>{MATRIX_NOTE}</p>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#67e8f9", textAlign: "center" }}>
          The Ultra Vestra rule: {MATRIX_RULE}
        </p>
      </section>

      {/* 5. THE SIX-STAGE FRAMEWORK + EXAMPLE SCRIPT */}
      <section style={panel}>
        <h2 style={h2style}>5 · Structure an Advertisement That Actually Communicates</h2>
        <p style={sub}>The six-stage advertising framework — teach creators to build every ad on it.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 20 }}>
          {AD_FRAMEWORK.map((s, i) => (
            <div key={s.stage} style={card}>
              <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#f0abfc" }}>
                {i + 1}. {s.stage}
              </p>
              <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>{s.action}</p>
            </div>
          ))}
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>Example: a 25-second advertisement</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
          {EXAMPLE_SCRIPT.map((seg) => (
            <div key={seg.stage} style={card}>
              <p style={{ margin: "0 0 6px", fontSize: 14 }}>
                <strong style={{ color: "#67e8f9" }}>{seg.window}</strong>{" "}
                <span style={{ color: "#f0abfc", fontWeight: 800, fontSize: 15.5 }}>{seg.stage.toUpperCase()}</span>
              </p>
              <p style={{ margin: "0 0 4px", fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#67e8f9" }}>Visual:</strong> {seg.visual}
              </p>
              <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#67e8f9" }}>Say:</strong> {seg.say}
              </p>
            </div>
          ))}
        </div>
        <p style={{ ...body, margin: 0 }}>{SCRIPT_DISCLAIMER}</p>
      </section>

      {/* 6. VISUALLY STRONGER */}
      <section style={panel}>
        <h2 style={h2style}>6 · Make the Advertisement Visually Stronger</h2>
        <p style={sub}>
          A video can have a brilliant script and still fail because the viewer cannot understand what is
          happening. Improve five visual elements.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {VISUAL_ELEMENTS.map((v, i) => (
            <div key={v.title} style={card}>
              <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#f3e8ff" }}>
                <span style={{ color: "#67e8f9" }}>{i + 1}.</span> {v.title}
              </p>
              <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>{v.text}</p>
            </div>
          ))}
        </div>
        <p style={{ ...body, margin: 0 }}>{VISUAL_NOTE}</p>
      </section>

      {/* THE PSYCHOLOGY LAB */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">The Psychology Lab</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          Don&rsquo;t just read the psychology — run your own product, lines, and numbers through it.
        </p>
      </div>
      <PsychologyLab />

      {/* 7. THE DIAGNOSTIC */}
      <section style={panel}>
        <h2 style={h2style}>7 · Understand Why Your Ads Fail</h2>
        <p style={sub}>{DIAGNOSTIC_INTRO}</p>
        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15.5 }}>
            <thead>
              <tr>
                <th style={thStyle}>What happens</th>
                <th style={thStyle}>What to investigate</th>
              </tr>
            </thead>
            <tbody>
              {DIAGNOSTIC.map((d) => (
                <tr key={d.happens}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#f3e8ff" }}>{d.happens}</td>
                  <td style={tdStyle}>{d.investigate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...body, margin: 0 }}>{DIAGNOSTIC_CAVEAT}</p>
      </section>

      {/* 8. THE PSYCHOLOGY OF TESTING */}
      <section style={panel}>
        <h2 style={h2style}>8 · The Psychology of Testing</h2>
        <p style={sub}>{TESTING_RULE}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 18 }}>
          {TESTING_VERSIONS.map((v) => (
            <div key={v.version} style={{ ...card, textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>{v.version}</p>
              <p style={{ margin: 0, fontSize: 15, color: "#f3e8ff" }}>{v.hook_type}</p>
            </div>
          ))}
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>Measure</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 16 }}>
          {TESTING_METRICS.map((m, i) => (
            <div key={m} style={card}>
              <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#67e8f9" }}>{i + 1}.</strong> {m}
              </p>
            </div>
          ))}
        </div>
        <p style={{ ...body, margin: 0, fontWeight: 700 }}>{TESTING_CLOSING}</p>
      </section>

      {/* 9. PLATFORMS */}
      <section style={panel}>
        <h2 style={h2style}>9 · Different Platforms, Different Creative</h2>
        <p style={sub}>What creators should learn about different platforms — each one rewards a different creative priority.</p>
        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15.5 }}>
            <thead>
              <tr>
                <th style={thStyle}>Platform</th>
                <th style={thStyle}>Creative priority</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORMS.map((p) => (
                <tr key={p.platform}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#f3e8ff", whiteSpace: "nowrap" }}>{p.platform}</td>
                  <td style={tdStyle}>{p.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...body, margin: 0 }}>{PLATFORMS_NOTE}</p>
      </section>

      {/* 10. THE PHILOSOPHY */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #22d3ee" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>
          THE ULTRA VESTRA ADVERTISING PHILOSOPHY
        </span>
        <div style={{ maxWidth: 760, margin: "18px auto 0" }}>
          {PHILOSOPHY.map((line) => (
            <p key={line} style={{ color: "#f3e8ff", fontSize: 17.5, fontWeight: 700, margin: "0 0 12px" }}>{line}</p>
          ))}
        </div>
      </section>

      {/* 11. HOW ULTRAVESTRA ADVERTISES ITSELF */}
      <section style={panel}>
        <h2 style={h2style}>11 · How Ultra Vestra Advertises Itself</h2>
        <p style={sub}>{BRAND_AD_CONTEXT}</p>
        <div style={{ ...card, border: "1px solid #7f1d3d", padding: "18px 22px", marginBottom: 18 }}>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "#fda4af" }}>A WEAK ULTRA VESTRA ADVERTISEMENT</p>
          <p style={{ margin: "0 0 6px", fontSize: 16, color: "#f3e8ff" }}>{BRAND_AD_WEAK.line}</p>
          <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>
            <strong style={{ color: "#f0abfc" }}>Why it&rsquo;s weak:</strong> {BRAND_AD_WEAK.why_weak}
          </p>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>The stronger advertisement — Ultra Vestra, 25 seconds</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {BRAND_AD.map((seg) => (
            <div key={seg.name} style={card}>
              <p style={{ margin: "0 0 6px", fontSize: 14 }}>
                <strong style={{ color: "#67e8f9" }}>{seg.window.toUpperCase()}</strong>{" "}
                <span style={{ color: "#f0abfc", fontWeight: 800, fontSize: 15.5 }}>{seg.name}</span>
              </p>
              <p style={{ margin: "0 0 4px", fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#67e8f9" }}>Visual:</strong> {seg.visual}
              </p>
              <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#67e8f9" }}>Voice:</strong> {seg.voice}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 12. THE SIGNATURE SUBJECT — CORE LESSONS */}
      <section style={panel}>
        <h2 style={h2style}>12 · The Signature Subject: Core Lessons</h2>
        <p style={sub}>
          The Human Behind the View is a permanent signature subject of the Ultra Vestra Original Curriculum.
          These are its core lessons.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 20 }}>
          {CURRICULUM.map((lesson, i) => (
            <div key={lesson} style={card}>
              <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#67e8f9" }}>{i + 1}.</strong> {lesson}
              </p>
            </div>
          ))}
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>Three things to never compromise on</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {NEVER_COMPROMISE.map((p) => (
            <div key={p.name} style={{ ...card, border: "1px solid #e879f9" }}>
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#f3e8ff" }}>{p.name}</p>
              <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>{p.explanation}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ENGRAVED */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>
          ENGRAVED INTO ULTRA VESTRA
        </span>
        <p className="wow-title" style={{ fontSize: 30, fontWeight: 800, margin: "16px auto 16px", maxWidth: 820, lineHeight: 1.35 }}>
          {ENGRAVED.headline}
        </p>
        <p style={{ color: "#f3e8ff", fontSize: 17, fontWeight: 700, margin: "0 auto 12px", maxWidth: 700 }}>
          {ENGRAVED.firstSecond}
        </p>
        <p style={{ color: "#67e8f9", fontWeight: 800, letterSpacing: 0.4, fontSize: 15.5, margin: 0 }}>
          {ENGRAVED.closing}
        </p>
      </section>

      {/* FURTHER STUDY */}
      <section style={panel}>
        <h2 style={h2style}>For Further Study</h2>
        <p style={sub}>Official resources behind this subject — study them at the source.</p>
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, fontSize: 15.5 }}>
          {RESOURCES.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>{r.label}</a>
            </li>
          ))}
        </ul>
      </section>

      <p style={{ textAlign: "center", margin: 0, fontSize: 15, color: "#ddd0ff" }}>
        Start with the <Link href="/creator-growth/audience-first-protocol" style={linkStyle}>Audience First Protocol</Link>,
        master the opening with <Link href="/creator-growth/first-3-seconds" style={linkStyle}>The First 3 Seconds</Link>,
        build with <Link href="/secret-weapon" style={linkStyle}>The Creator&rsquo;s Secret Weapon</Link>,
        and keep learning in the <Link href="/coach" style={linkStyle}>Creator Growth Center</Link>.
      </p>
    </div>
  );
}
