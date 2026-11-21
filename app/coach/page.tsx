import Link from "next/link";
import VideoLab from "@/components/VideoLab";

/* CREATOR VIDEO INTELLIGENCE LAB — why a video performs, or why it stalls.
 * The diagnostic works today: the creator scores their own real video
 * against the five performance areas and gets the why plus the fix.
 * Upload-based analysis arrives only when secure storage and an analysis
 * provider are configured — nothing here fakes watching a video. */

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "rgba(26,8,54,0.78)",
  borderRadius: 22,
  padding: "24px 26px 26px",
  boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const h2style: React.CSSProperties = { fontSize: 23, margin: "0 0 6px", letterSpacing: 0.5 };
const sub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 16px", fontSize: 15 };

const CHECKLIST: [string, string][] = [
  ["Hook (0–3s)", "Product or problem in frame in the first second. A spoken promise, not a greeting."],
  ["Clarity", "One idea per video. A viewer can repeat what it is about in one sentence."],
  ["Demonstration", "The product shown working, hands in frame, key moment uncut."],
  ["Story", "Problem → attempt → result. Even 30 seconds needs an arc."],
  ["Pacing & retention", "A pattern change every 3–5 seconds: angle, zoom, text, B-roll. No dead air."],
  ["Proof", "A result, comparison or number — in the same light as the claim."],
  ["Honest line", "One real limitation, said plainly. It is what makes the praise believable."],
  ["CTA", "One action, said while the product is on screen."],
  ["Light & sound", "Face lit from the front, voice close and clear, lens wiped."],
  ["Captions", "Every spoken line captioned. Most feeds are watched on mute first."],
];

const SYMPTOMS: [string, string, string][] = [
  ["Views die in the first seconds", "The hook is a greeting, a logo or a warm-up. Viewers swipe before the promise arrives.", "Open on the product or the problem, and say the payoff out loud in the first three seconds."],
  ["People watch but nobody clicks", "The video entertains but never proves. No uncut demo moment, no result on screen.", "Show the product working — the key moment uncut — and put the proof in the same light as the claim."],
  ["Good start, audience fades mid-video", "One static frame and dead air. Nothing changes, so the brain checks out.", "A pattern change every 3–5 seconds: angle, zoom, text beat, B-roll. Cut every pause over a second."],
  ["Comments ask 'how much?' and 'does it work?'", "The objection was never answered in the video, so it leaks into the comments instead of converting.", "Name the biggest objection — price, doubt, fit — and answer it while the product is on screen."],
  ["Sales come, but slowly and randomly", "Two or three different calls to action, or the CTA lands after the belief peak has passed.", "One CTA only, spoken at the moment the product proves itself."],
];

export default function CoachPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>CREATOR VIDEO INTELLIGENCE LAB</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "12px 0 6px", fontWeight: 800 }}>Why did that video perform?</h1>
        <p style={{ color: "#ddd0ff", margin: "0 auto", maxWidth: 660, fontSize: 16 }}>
          Performance is not luck. Five things decide it — your hook, your demonstration, your storytelling,
          your retention and your sales conversion. The Lab scores all five on your real video and tells you
          exactly what to fix next.
        </p>
      </section>

      <VideoLab />

      <section style={panel}>
        <h2 style={h2style}>🩺 Symptom → cause → fix</h2>
        <p style={sub}>The five patterns behind almost every underperforming creator video — and the fix for each.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {SYMPTOMS.map(([symptom, cause, fix]) => (
            <div key={symptom}>
              <p style={{ margin: "0 0 2px", fontSize: 15.5 }}><strong style={{ color: "#f0abfc" }}>{symptom}.</strong> <span style={{ color: "#f3e8ff" }}>{cause}</span></p>
              <p style={{ margin: 0, fontSize: 15 }}>🔧 <span style={{ color: "#ddd0ff" }}>{fix}</span></p>
            </div>
          ))}
        </div>
      </section>

      <section style={panel}>
        <h2 style={h2style}>🎬 The 10-point filming checklist</h2>
        <p style={sub}>Run your next video against this before you post. It is the same framework the Lab scores.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CHECKLIST.map(([name, desc]) => (
            <p key={name} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#f0abfc" }}>{name}:</strong> <span style={{ color: "#f3e8ff" }}>{desc}</span>
            </p>
          ))}
        </div>
        <p style={{ margin: "18px 0 0" }}>
          <Link href="/academy" className="neon-btn" style={{ padding: "11px 22px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 15 }}>Learn each skill in the Creator Academy →</Link>
        </p>
      </section>

      <section style={panel}>
        <h2 style={h2style}>📤 Upload analysis — coming honestly</h2>
        <p style={sub}>
          Soon you will be able to upload a video and get an automated analysis on top of this diagnostic.
          Uploads open only when secure storage and the analysis engine are switched on — we will not fake
          an analysis before then. The Lab above works today, on every video you make.
        </p>
      </section>
    </div>
  );
}
