import Link from "next/link";

/* VIDEO COACH — coming soon, honestly.
 * Secure video upload and real analysis arrive only when storage and an
 * analysis provider are configured. Nothing here fakes an analysis.
 * Until then, the framework below is the exact checklist the Coach will
 * score against — and creators can run it by hand today. */

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

export default function CoachPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>VIDEO COACH · COMING SOON</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "12px 0 6px", fontWeight: 800 }}>Your videos, coached</h1>
        <p style={{ color: "#ddd0ff", margin: "0 auto", maxWidth: 640, fontSize: 16 }}>
          Soon you will upload a video and get a real analysis: your 3 highest-impact fixes, a revised hook,
          a suggested structure and a filming checklist — scored against your own metrics, never guessed from pixels alone.
        </p>
        <p style={{ color: "#f0abfc", fontWeight: 700, marginTop: 12 }}>Uploads open when secure storage and the analysis engine are switched on. We will not fake an analysis before then.</p>
      </section>

      <section style={panel}>
        <h2 style={h2style}>🎬 The Coach checklist — use it today</h2>
        <p style={sub}>This is the exact framework the Video Coach will score. Run your next video against it before you post.</p>
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
    </div>
  );
}
