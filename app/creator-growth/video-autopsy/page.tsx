import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import VideoAutopsy from "@/components/VideoAutopsy";
import { STAGES, UPLOAD_NOTE, CLOSING_LINE } from "@/lib/autopsy";
import { THE_LOOP } from "@/lib/purchaselab";

/* THE VIDEO AUTOPSY — UltraVestra's video analysis experience.
 * One of the owner's Five Signature Tools. A guided, stage-by-stage
 * autopsy of the creator's OWN video — the Stop, the Hold, the
 * Reveal & Demonstration, Understanding, Proof & Trust, the
 * Decision — assembled from his existing systems: the First 3
 * Seconds beats, the Product-to-Purchase seven questions, the
 * trigger chain, and the Autopsy Worksheet stages. It ends with ONE
 * change for the next video, never a pile of tips.
 * HONESTY: a guided self-analysis built from the creator's answers.
 * It does not watch the video, and the page says so. Automatic
 * upload analysis arrives only when an analysis provider is
 * connected. */

export const metadata: Metadata = {
  title: "The Video Autopsy: Know Exactly What to Change | UltraVestra",
  description:
    "UltraVestra's Video Autopsy: a guided, stage-by-stage analysis of your own video — the stop, the hold, the reveal, the benefit, the proof, the decision — graded from your honest answers, ordered weakest-first, and ending with the ONE change to make in your next video. A guided self-analysis, not a virality prediction.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/creator-growth/video-autopsy",
  },
  openGraph: {
    title: "The Video Autopsy: Know Exactly What to Change | UltraVestra",
    description:
      "Don't guess why a video stalled — autopsy it. Six stages, one diagnosis, one change for the next video.",
    url: "https://ultra-vestra.vercel.app/creator-growth/video-autopsy",
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

export default async function VideoAutopsyPage() {
  await requireSubscription("/creator-growth/video-autopsy");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          ⭐ SIGNATURE TOOL · VIDEO ANALYSIS
        </span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 8px", fontWeight: 800 }}>
          The Video Autopsy
        </h1>
        <p style={{ color: "#67e8f9", fontSize: 19, fontWeight: 800, letterSpacing: 1.6, margin: "0 auto 14px", maxWidth: 720 }}>
          KNOW EXACTLY WHAT TO CHANGE IN YOUR NEXT VIDEO
        </p>
        <p style={{ color: "#ddd0ff", fontSize: 16.5, margin: "0 auto", maxWidth: 720 }}>
          A video never fails everywhere at once. It breaks at one stage — the stop, the hold, the reveal, the
          benefit, the proof, or the decision. The Autopsy walks your own video through all six, grades each
          one from your honest answers, and hands you the single change that matters most.
        </p>
      </section>

      {/* THE AUTOPSY STANDARD — THE SIX STAGES */}
      <section style={panel}>
        <h2 style={h2style}>The Six Stages of Every Video</h2>
        <p style={sub}>
          The Autopsy is built from the systems you already know — the First 3 Seconds beats, the
          Product-to-Purchase questions, the trigger chain (Attention → Interest → Understanding → Trust →
          Decision), and the Autopsy Worksheet. One video, six stages, one weakest link.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {STAGES.map((s, i) => (
            <article key={s.id} style={{ ...card, padding: "18px 22px" }}>
              <p style={{ margin: "0 0 8px", fontSize: 17.5 }}>
                <span className="wow-title" style={{ fontWeight: 800, fontSize: 22 }}>{i + 1}</span>{" "}
                <strong style={{ color: "#f3e8ff" }}>{s.name}</strong>
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 15.5, color: "#ddd0ff" }}>
                <strong style={{ color: "#67e8f9" }}>What it examines:</strong> {s.focus}
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#f0abfc" }}>What good looks like:</strong> {s.look_for[0]}
              </p>
              <p style={{ margin: 0, fontSize: 13.5, color: "#ddd0ff" }}>{s.source}</p>
            </article>
          ))}
        </div>
      </section>

      {/* THE AUTOPSY */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">Put Your Video on the Table</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          Honest answers in — a diagnosis, one change, and a re-film checklist out.
        </p>
      </div>
      <VideoAutopsy />

      {/* THE LOOP */}
      <section style={panel}>
        <h2 style={h2style}>After the Autopsy: The Loop</h2>
        <p style={sub}>
          An autopsy is not the finish line. It is how the next video gets better — one diagnosed change at a
          time.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {THE_LOOP.map((s, i) => (
            <article key={s.step} style={{ ...card, padding: "18px 20px" }}>
              <p className="wow-title" style={{ fontSize: 26, fontWeight: 800, margin: "0 0 2px", lineHeight: 1 }}>
                {i + 1}
              </p>
              <h3 style={{ fontSize: 18, margin: "6px 0 8px", fontWeight: 800, color: "#f0abfc" }}>{s.step}</h3>
              <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* UPLOAD ANALYSIS — COMING, HONESTLY */}
      <section style={panel}>
        <h2 style={h2style}>📤 Upload analysis — coming honestly</h2>
        <p style={{ ...sub, margin: 0 }}>{UPLOAD_NOTE}</p>
      </section>

      {/* CLOSING LINE */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <p className="wow-title" style={{ fontSize: 34, fontWeight: 800, margin: "6px auto", maxWidth: 760, lineHeight: 1.3 }}>
          {CLOSING_LINE}
        </p>
      </section>

      <p style={{ textAlign: "center", margin: 0, fontSize: 15, color: "#ddd0ff" }}>
        Rebuild the opening in <Link href="/creator-growth/first-3-seconds" style={linkStyle}>The First 3 Seconds</Link>,
        grade the selling in <Link href="/creator-growth/product-to-purchase-lab" style={linkStyle}>The Product-to-Purchase Lab</Link>,
        practice in the <Link href="/secret-weapon" style={linkStyle}>Creator&rsquo;s Secret Weapon</Link>,
        and keep learning in the <Link href="/coach" style={linkStyle}>Creator Growth Center</Link>.
      </p>
    </div>
  );
}
