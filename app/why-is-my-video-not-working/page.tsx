import type { Metadata } from "next";
import Link from "next/link";
import Troubleshooter from "@/components/Troubleshooter";
import { DIAGNOSES, PRINCIPLES, TROUBLESHOOTER_INTRO } from "@/lib/frustrations";

/* WHY IS MY VIDEO NOT WORKING? — UltraVestra's signature feature.
 * An interactive creator troubleshooting experience: the creator
 * chooses the problem they're experiencing, and UltraVestra
 * teaches them how to investigate it — examine the opening, the
 * relevance, the trust, the expectations — instead of guessing.
 * "Don't just tell creators what to do. Teach them how to
 * identify the problem themselves." */

export const metadata: Metadata = {
  title: "Why Is My Video Not Working? | UltraVestra",
  description:
    "UltraVestra's signature troubleshooter. People scroll away, watch but don't click, click but don't purchase, buy but return — pick your symptom and learn how to investigate it, check by check.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/why-is-my-video-not-working",
  },
  openGraph: {
    title: "Why Is My Video Not Working? | UltraVestra",
    description:
      "Don't just tell creators what to do. Teach them how to identify the problem themselves. Pick the symptom — investigate it like a diagnostician.",
    url: "https://ultra-vestra.vercel.app/why-is-my-video-not-working",
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
const card: React.CSSProperties = {
  border: "1px solid #4c1d95", borderRadius: 14, padding: "16px 20px", background: "rgba(13,2,33,0.65)",
};
const linkStyle: React.CSSProperties = { color: "#67e8f9", fontWeight: 700, textDecoration: "none" };
const badge: React.CSSProperties = {
  background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999,
  padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2,
};

export default function WhyIsMyVideoNotWorkingPage() {
  const core = DIAGNOSES.filter((d) => d.core);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={badge}>ULTRA VESTRA · THE CREATOR DIAGNOSTIC</span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 10px", fontWeight: 800 }}>
          Why Is My Video Not Working?
        </h1>
        <p style={{ color: "#ddd0ff", fontSize: 17.5, margin: "0 auto", maxWidth: 720 }}>
          {TROUBLESHOOTER_INTRO} A creator troubleshooting experience — no guessing, no generic
          tips. A diagnosis you run yourself.
        </p>
      </section>

      {/* THE TROUBLESHOOTER */}
      <Troubleshooter />

      {/* HIS FOUR EXAMPLE DIAGNOSES — QUICK REFERENCE */}
      <section style={panel}>
        <h2 style={h2style}>The Four Classic Diagnoses</h2>
        <p style={sub}>
          The pattern behind the troubleshooter: every symptom points at a stage of the video to
          examine — never at a single automatic explanation.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {core.map((d) => (
            <article key={d.symptom} style={card}>
              <p style={{ margin: "0 0 6px", fontSize: 16.5, fontWeight: 800, color: "#f3e8ff" }}>{d.symptom}</p>
              <p style={{ margin: "0 0 10px", fontSize: 15, color: "#f0abfc", fontWeight: 700 }}>→ {d.examine}</p>
              <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>
                First fix: {d.first_fix}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* THE PRINCIPLE */}
      <section style={{ textAlign: "center", padding: "6px 0" }}>
        <p className="wow-title" style={{ fontSize: 27, fontWeight: 800, margin: "0 auto 10px", maxWidth: 840, lineHeight: 1.45 }}>
          {PRINCIPLES[0]}
        </p>
        <p style={{ color: "#ddd0ff", fontSize: 15.5, margin: 0 }}>
          Every frustration maps to one of UltraVestra&rsquo;s five problem worlds.{" "}
          <Link href="/start-here" style={linkStyle}>Start with your frustration →</Link>
        </p>
      </section>
    </div>
  );
}
