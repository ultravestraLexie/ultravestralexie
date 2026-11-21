import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import { CORE_FRUSTRATION, FRUSTRATIONS, PRINCIPLES, VISION_LINE, WORLDS } from "@/lib/frustrations";

/* START HERE — the problem-first front door of UltraVestra.
 * Instead of making creators search through hundreds of random
 * articles, the site is organized around the problem they came to
 * solve: pick one of the 12 biggest creator frustrations and get
 * a learning path — the world that owns it, and the first tool to
 * open. Below, the five problem worlds in full: Scroll Stop Lab,
 * Conversion Lab, Brand Observatory, Creator Diagnostic, Creator
 * Business School — every one wired to live UltraVestra tools. */

export const metadata: Metadata = {
  title: "Start With Your Frustration | UltraVestra",
  description:
    "The 12 biggest creator frustrations — low views, no sales, burnout, bad brand deals — each mapped to one of UltraVestra's five problem worlds and the first tool to open. A place creators return to whenever they get stuck.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/start-here",
  },
  openGraph: {
    title: "Start With Your Frustration | UltraVestra",
    description:
      "Choose the problem you came to solve and immediately find a complete learning path — examples, scripts, exercises, and solutions. Not random articles.",
    url: "https://ultra-vestra.vercel.app/start-here",
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
  border: "1px solid #4c1d95", borderRadius: 14, padding: "16px 20px", background: "rgba(13,2,33,0.65)",
};
const linkStyle: React.CSSProperties = { color: "#67e8f9", fontWeight: 700, textDecoration: "none" };
const badge: React.CSSProperties = {
  background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999,
  padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2,
};
const worldTag: React.CSSProperties = {
  display: "inline-block", border: "1px solid #22d3ee", color: "#67e8f9", borderRadius: 999,
  padding: "2px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
};

export default async function StartHerePage() {
  await requireSubscription("/start-here");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={badge}>ULTRA VESTRA · PROBLEM-FIRST</span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 10px", fontWeight: 800 }}>
          Start With Your Frustration
        </h1>
        <p style={{ color: "#ddd0ff", fontSize: 17.5, margin: "0 auto 14px", maxWidth: 780 }}>
          {CORE_FRUSTRATION} So don&rsquo;t search through hundreds of random articles — choose the
          problem you came to solve, and get a learning path: the world that owns it, and the first
          tool to open.
        </p>
        <p style={{ color: "#f0abfc", fontSize: 15.5, margin: 0, fontWeight: 700 }}>{PRINCIPLES[1]}</p>
      </section>

      {/* THE 12 FRUSTRATIONS */}
      <section style={panel}>
        <h2 style={h2style}>The 12 Biggest Creator Frustrations</h2>
        <p style={sub}>
          Recurring pain points, in creators&rsquo; own words. Find yours — your path starts there.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          {FRUSTRATIONS.map((f) => (
            <article key={f.n} style={card}>
              <p style={{ margin: "0 0 6px", fontSize: 16.5, fontWeight: 800, color: "#f3e8ff" }}>
                <span style={{ color: "#67e8f9" }}>{f.n}.</span> {f.title}
              </p>
              <p style={{ margin: "0 0 10px", fontSize: 15, color: "#f0abfc", fontStyle: "italic" }}>
                &ldquo;{f.quote}&rdquo;
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 14.5, color: "#ddd0ff" }}>{f.need}</p>
              <p style={{ margin: "0 0 10px" }}>
                <span style={worldTag}>
                  {String(WORLDS[f.world].n).padStart(2, "0")} · {WORLDS[f.world].theme} — {WORLDS[f.world].name}
                </span>
              </p>
              <Link href={f.first_tool.href} style={{ ...linkStyle, fontSize: 15 }}>
                Start here → {f.first_tool.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* THE FIVE WORLDS */}
      <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">The Five Problem Worlds</p>
          <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
            Every frustration lives in one world. Every world is a complete workshop — lessons,
            tools, and exercises aimed at one problem.
          </p>
        </div>
        {WORLDS.map((w) => (
          <section key={w.n} style={panel}>
            <p style={{ margin: "0 0 2px", fontSize: 13.5, fontWeight: 800, letterSpacing: 2, color: "#67e8f9" }}>
              {String(w.n).padStart(2, "0")} · {w.theme.toUpperCase()}
            </p>
            <h2 style={{ ...h2style, margin: "0 0 4px" }}>{w.name}</h2>
            <p style={{ ...body, color: "#f0abfc", fontWeight: 700, margin: "0 0 6px" }}>{w.promise}</p>
            <p style={{ ...sub, margin: "0 0 16px" }}>{w.topics.join(" · ")}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {w.tools.map((tool) => (
                <article key={tool.name + tool.href} style={card}>
                  <Link href={tool.href} style={{ ...linkStyle, fontSize: 16 }}>
                    {tool.name} →
                  </Link>
                  <p style={{ margin: "6px 0 0", fontSize: 14.5, color: "#ddd0ff" }}>{tool.note}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>

      {/* CLOSING */}
      <section style={{ textAlign: "center", padding: "6px 0" }}>
        <p className="wow-title" style={{ fontSize: 27, fontWeight: 800, margin: "0 auto 10px", maxWidth: 840, lineHeight: 1.45 }}>
          {VISION_LINE}
        </p>
        <p style={{ color: "#ddd0ff", fontSize: 15.5, margin: 0 }}>
          Stuck on a specific video right now?{" "}
          <Link href="/why-is-my-video-not-working" style={linkStyle}>
            Run the troubleshooter — Why Is My Video Not Working? →
          </Link>
        </p>
      </section>
    </div>
  );
}
