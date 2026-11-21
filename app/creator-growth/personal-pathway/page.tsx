import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import PathwayBuilder from "@/components/PathwayBuilder";
import { DEPARTMENTS, PATHWAY, IDENTITY, HONESTY_LINE, MISSION } from "@/lib/universe";

/* THE PERSONAL PATHWAY — UltraVestra's personalized improvement
 * pathway builder. Not another article a creator reads once and
 * forgets: the creator names their #1 frustration, platform,
 * level, and honest weekly time, and gets a sequenced four-week
 * plan on the six-step method — Identify, Diagnose, Understand,
 * See It, Practice It, Measure Improvement — with every action
 * linked to the real tool that does it and every week closed by
 * a measurable checkpoint. Success is creator progress, never
 * promises of viral videos or guaranteed sales. */

export const metadata: Metadata = {
  title: "Your Personal Pathway | UltraVestra",
  description:
    "Answer four questions — your #1 frustration, your platform, your level, your honest time — and UltraVestra builds your four-week improvement pathway on the six-step method: identify, diagnose, understand, see it, practice it, measure improvement.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/creator-growth/personal-pathway",
  },
  openGraph: {
    title: "Your Personal Pathway | UltraVestra",
    description:
      "A plan built from your answers, not generic advice. Four weeks, one problem, every action linked to the tool that does it — and a checkpoint that proves whether it worked.",
    url: "https://ultra-vestra.vercel.app/creator-growth/personal-pathway",
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

export default async function PersonalPathwayPage() {
  await requireSubscription("/creator-growth/personal-pathway");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          ULTRAVESTRA · YOUR PERSONAL PATHWAY
        </span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 8px", fontWeight: 800 }}>
          A Pathway Built From Your Answers
        </h1>
        <p style={{ color: "#f0abfc", fontSize: 21, fontWeight: 800, margin: "0 auto 10px", maxWidth: 760 }}>
          &ldquo;Everybody gives different advice. Who should I listen to?&rdquo;
        </p>
        <p style={{ color: "#ddd0ff", fontSize: 16.5, margin: "0 auto", maxWidth: 720 }}>
          Listen to your own problem, in order. Name your #1 frustration, your platform, your level, and
          the time you honestly have — and UltraVestra sequences the next four weeks for you: what to
          diagnose first, what to understand, what to practice, and how you will know it worked.{" "}
          {MISSION}
        </p>
      </section>

      {/* THE SIX-STEP METHOD */}
      <section style={panel}>
        <h2 style={h2style}>Every Pathway Follows the Same Six Steps</h2>
        <p style={sub}>
          This is the method behind every UltraVestra lesson — applied to your problem, in your order of need.
        </p>
        <p style={{ margin: "0 0 16px", fontSize: 19, fontWeight: 800, letterSpacing: 0.6, color: "#f3e8ff", textAlign: "center" }}>
          {PATHWAY.map((s, i) => (
            <span key={s.step}>
              <span style={{ color: "#f0abfc" }}>{s.step.toUpperCase()}</span>
              {i < PATHWAY.length - 1 && <span style={{ color: "#67e8f9" }}> → </span>}
            </span>
          ))}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
          {PATHWAY.map((s, i) => (
            <article key={s.step} style={{ ...card, padding: "16px 18px" }}>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: "#67e8f9" }}>
                STEP {i + 1}
              </p>
              <h3 style={{ fontSize: 18, margin: "0 0 4px", fontWeight: 800, color: "#f3e8ff" }}>{s.step}</h3>
              <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>{s.line}</p>
            </article>
          ))}
        </div>
      </section>

      {/* THE BUILDER */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">Build Your Pathway</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          Four answers. Four weeks. Every action opens the tool that does the work — and every week ends
          with one thing you can measure.
        </p>
      </div>
      <PathwayBuilder />

      {/* WHERE PATHWAYS DRAW FROM — THE SIX DEPARTMENTS */}
      <section style={panel}>
        <h2 style={h2style}>Your Pathway Draws From All Six Departments</h2>
        <p style={sub}>
          Each department exists to solve one problem. Your pathway starts in the department your
          frustration belongs to — and borrows tools from the others when your checkpoints say to.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {DEPARTMENTS.map((d) => (
            <article key={d.n} style={{ ...card, padding: "18px 20px" }}>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: "#67e8f9" }}>
                {d.n}
              </p>
              <h3 style={{ fontSize: 18, margin: "0 0 4px", fontWeight: 800, color: "#f3e8ff" }}>{d.name}</h3>
              <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#f0abfc" }}>
                &ldquo;{d.problem}&rdquo;
              </p>
              <p style={{ margin: "0 0 10px", fontSize: 14.5, color: "#ddd0ff" }}>{d.solutions}</p>
              <Link href={d.href} style={linkStyle}>Enter the department →</Link>
            </article>
          ))}
        </div>
      </section>

      {/* THE HONEST CLOSE */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)", padding: "40px 26px 44px" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>
          THE ULTRAVESTRA STANDARD
        </span>
        <p className="wow-title" style={{ fontSize: 36, fontWeight: 800, margin: "22px auto 14px", maxWidth: 760, lineHeight: 1.15 }}>
          {IDENTITY.dontJust}
        </p>
        <p style={{ color: "#f3e8ff", fontSize: 17, fontWeight: 700, margin: "0 auto 10px", maxWidth: 640 }}>
          {HONESTY_LINE}
        </p>
        <p style={{ color: "#67e8f9", fontWeight: 700, fontSize: 16, margin: "10px auto 0", maxWidth: 640 }}>
          {IDENTITY.intelligence}
        </p>
      </section>

      <p style={{ textAlign: "center", margin: 0, fontSize: 15, color: "#ddd0ff" }}>
        Not sure which frustration is yours? Start at{" "}
        <Link href="/start-here" style={linkStyle}>Start Here</Link>, or bring the symptom to{" "}
        <Link href="/why-is-my-video-not-working" style={linkStyle}>Why Is My Video Not Working?</Link>{" "}
        and let the diagnosis choose for you.
      </p>
    </div>
  );
}
