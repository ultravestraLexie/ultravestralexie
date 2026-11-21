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
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>CREATOR GROWTH CENTER · VIDEO INTELLIGENCE LAB</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "12px 0 6px", fontWeight: 800 }}>Why did that video perform?</h1>
        <p style={{ color: "#ddd0ff", margin: "0 auto", maxWidth: 660, fontSize: 16 }}>
          Performance is not luck. Five things decide it — your hook, your demonstration, your storytelling,
          your retention and your sales conversion. The Lab scores all five on your real video and tells you
          exactly what to fix next.
        </p>
      </section>

      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>⭐ SIGNATURE RESOURCE</span>
        <h2 style={{ fontSize: 26, margin: "12px 0 6px", fontWeight: 800 }}>The Human Emotion Video Playbook</h2>
        <p style={{ ...sub, maxWidth: 640, margin: "0 auto 16px" }}>
          People don&rsquo;t watch videos only because they want information — they watch because they feel
          something. The Playbook is UltraVestra&rsquo;s complete human-emotion video creation system:
          15 emotions, the 10-second attention engine, 25 hooks, 30 concepts, five formulas, and the
          interactive Human Emotion Video Lab.
        </p>
        <p style={{ color: "#f0abfc", fontWeight: 800, fontSize: 17, margin: "0 auto 16px" }}>The human comes before the hook.</p>
        <Link href="/creator-growth/human-emotion-video-playbook" className="neon-btn" style={{ display: "inline-block", padding: "12px 26px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 15.5 }}>Open the Playbook &amp; the Lab →</Link>
      </section>

      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>⭐ SIGNATURE EXPERIENCE</span>
        <h2 style={{ fontSize: 26, margin: "12px 0 6px", fontWeight: 800 }}>The Art of Human Connection &amp; Conversion</h2>
        <p style={{ ...sub, maxWidth: 640, margin: "0 auto 16px" }}>
          UltraVestra&rsquo;s LIVE mastery philosophy: the 12 Pillars of Creator Mastery, the 60-second attention
          and conversion cycle, the professional host checklist, and the Creator Code — with the Pillar
          Self-Diagnostic, the LIVE Cycle Builder, and the Host Checklist as working tools.
        </p>
        <p style={{ color: "#f0abfc", fontWeight: 800, fontSize: 17, margin: "0 auto 16px" }}>Don&rsquo;t just go LIVE. Become the reason people stay.</p>
        <Link href="/creator-growth/art-of-human-connection" className="neon-btn" style={{ display: "inline-block", padding: "12px 26px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 15.5 }}>Enter the LIVE Mastery Experience →</Link>
      </section>

      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>⭐ CREATOR MASTERCLASS</span>
        <h2 style={{ fontSize: 26, margin: "12px 0 6px", fontWeight: 800 }}>The First 3 Seconds: Win the Scroll or Lose the Viewer</h2>
        <p style={{ ...sub, maxWidth: 640, margin: "0 auto 16px" }}>
          The First 3 Seconds Intelligence System: Interrupt, Connect, Create a Reason to Stay — the 15 powerful
          opening styles, five complete worked hooks, the HOOK → PROOF → VALUE → PAYOFF → ACTION sequence, and
          the First 3 Seconds Chamber testing tool.
        </p>
        <p style={{ color: "#f0abfc", fontWeight: 800, fontSize: 17, margin: "0 auto 16px" }}>The first three seconds earn the opportunity. The rest of the video must deserve the attention.</p>
        <Link href="/creator-growth/first-3-seconds" className="neon-btn" style={{ display: "inline-block", padding: "12px 26px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 15.5 }}>Enter the Masterclass →</Link>
      </section>

      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 2 }}>⭐ CREATOR MASTERCLASS</span>
        <h2 style={{ fontSize: 26, margin: "12px 0 6px", fontWeight: 800 }}>The Art of Captivating Human Attention</h2>
        <p style={{ ...sub, maxWidth: 640, margin: "0 auto 16px" }}>
          The Human Attention Intelligence Masterclass: the 15 attention triggers, the Friendly Controversy
          Laboratory, the emotional journey of a captivating video, the 7-day challenge — and the Human
          Attention Reactor, which turns your topic into strategies, hooks, controversy angles, and comment prompts.
        </p>
        <p style={{ color: "#f0abfc", fontWeight: 800, fontSize: 17, margin: "0 auto 16px" }}>Don&rsquo;t manufacture attention. Earn it.</p>
        <Link href="/creator-growth/art-of-captivating-attention" className="neon-btn" style={{ display: "inline-block", padding: "12px 26px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 15.5 }}>Enter the Masterclass →</Link>
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
        <h2 style={h2style}>🎓 The Growth Center curriculum — ten skills, all practical</h2>
        <p style={sub}>Every topic is a working lesson in the Creator Academy: instructions, a real example, and one thing to apply today. The Lab above tells you which one you need first.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
          {[
            ["Strong video hooks", "/academy?cat=Hooks"],
            ["Product demonstrations", "/academy?cat=Filming"],
            ["Storytelling", "/academy?cat=Scripts"],
            ["Product review structure", "/academy?cat=Scripts"],
            ["Video pacing & editing", "/academy?cat=Filming"],
            ["Calls to action", "/academy?cat=Scripts"],
            ["Trust & proof", "/academy?cat=Scripts"],
            ["Sales-focused video scripts", "/academy?cat=Scripts"],
            ["Content planning", "/academy?cat=Growth"],
            ["Platform-specific strategies", "/academy?cat=Growth"],
          ].map(([topic, href]) => (
            <Link key={topic} href={href} style={{ border: "1px solid #4c1d95", borderRadius: 14, padding: "13px 16px", background: "rgba(13,2,33,0.65)", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>{topic} →</Link>
          ))}
        </div>
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
