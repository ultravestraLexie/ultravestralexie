"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/* CREATOR VIDEO INTELLIGENCE LAB — a working self-diagnostic.
 * The creator answers plain yes/no checks about a real video they made;
 * the Lab scores the five things that decide whether a creator video
 * performs — hook, demonstration, storytelling, retention, conversion —
 * explains WHY the weak areas cost views and sales, and turns every
 * unchecked box into the exact fix. Deterministic and honest: it scores
 * what the creator reports, it does not pretend to watch the video. */

interface Area {
  name: string;
  emoji: string;
  why: string;
  academy: string;
  checks: [string, string][]; // [question, the fix when the answer is no]
}

const AREAS: Area[] = [
  {
    name: "Hook",
    emoji: "🪝",
    why: "Most viewers decide in the first two seconds. A weak hook means the video never gets the chance to sell — the algorithm reads the early swipe-away as a verdict on the whole video.",
    academy: "Hooks",
    checks: [
      ["Is the product or the problem on screen in the first second?", "Open on the product or the problem itself — not your face, not a greeting, not a logo."],
      ["Do you say a promise or a result out loud in the first three seconds?", "Say the payoff first: what it does, what changed, what it costs. 'Watch this' is not a promise."],
      ["Does on-screen text state the payoff for someone watching on mute?", "Put the result in big text from frame one. Most feeds are watched silently first."],
    ],
  },
  {
    name: "Demonstration",
    emoji: "🎬",
    why: "Creator video sells because it proves. A video that talks about a product without showing it working asks the viewer to trust a stranger — and viewers don't. The demo is the conversion engine.",
    academy: "Filming",
    checks: [
      ["Is the product shown actually working, with the key moment uncut?", "Film the real moment it works — the pour, the fit, the before-and-after — in one honest take."],
      ["Are your hands in frame, showing size, texture or how it is used?", "Hands give scale and make it real. Hold it, open it, use it — don't just point at it."],
      ["Is there proof on screen: a result, a comparison or a number?", "Show the outcome in the same light as the claim. Proof beats adjectives every time."],
    ],
  },
  {
    name: "Storytelling",
    emoji: "📖",
    why: "Facts tell, stories hold. A problem → attempt → result arc gives the viewer a reason to stay to the end, and watch-through is what platforms reward with reach.",
    academy: "Scripts",
    checks: [
      ["Does the video have a clear problem → attempt → result arc?", "Name the problem early, show the attempt, end on the result. Even 30 seconds needs the arc."],
      ["Is it about ONE idea a viewer could repeat in one sentence?", "Cut the second idea into its own video. Two ideas in one video means neither lands."],
      ["Do you say one honest limitation or real detail about yourself?", "One true limitation makes the praise believable — it is the line viewers quote back."],
    ],
  },
  {
    name: "Retention",
    emoji: "⏱️",
    why: "Retention is the metric behind the views. Dead air and a static frame are where swipes happen; every early exit tells the platform to stop pushing the video.",
    academy: "Filming",
    checks: [
      ["Does something change visually every 3–5 seconds — angle, zoom, text or B-roll?", "Plan a pattern change every few seconds: cut in close, switch angle, drop a text beat."],
      ["Is there no pause or dead air longer than about a second?", "Edit out the breaths and the reaching-for-the-product moments. Tight is not rushed."],
      ["Is every spoken line captioned?", "Caption everything. Silent viewers who can follow along stay — and staying is retention."],
    ],
  },
  {
    name: "Sales conversion",
    emoji: "🛒",
    why: "Views that don't convert are a hobby, not a business. One clear action, given at the moment of peak belief, is what turns a good video into a paid one.",
    academy: "Money",
    checks: [
      ["Is there exactly ONE call to action?", "Pick one action — tap the product, use the code, follow for part two. Two CTAs halve both."],
      ["Is the CTA spoken while the product is on screen?", "Say the action at the moment the product is proving itself, not over a black end screen."],
      ["Do you answer the viewer's biggest objection — price, doubt or 'does it work for me'?", "Name the objection and answer it in the video. The comment section is too late."],
    ],
  },
];

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "rgba(26,8,54,0.78)",
  borderRadius: 22,
  padding: "24px 26px 26px",
  boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};

export default function VideoLab() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [started, setStarted] = useState(false);

  const totalChecks = AREAS.reduce((n, a) => n + a.checks.length, 0);
  const answeredCount = Object.keys(answers).length;

  const areaScores = useMemo(
    () =>
      AREAS.map((area) => {
        const yes = area.checks.filter((_, i) => answers[`${area.name}-${i}`]).length;
        return { area, yes, total: area.checks.length };
      }),
    [answers],
  );

  const complete = answeredCount === totalChecks;
  const overall = complete ? Math.round((Object.values(answers).filter(Boolean).length / totalChecks) * 100) : null;
  const weakest = complete ? areaScores.filter((s) => s.yes < s.total) : [];

  const verdict = (yes: number, total: number) =>
    yes === total ? { label: "Strong", color: "#4ade80" } : yes === total - 1 ? { label: "Leaking views", color: "#fb923c" } : { label: "Likely why it stalls", color: "#f87171" };

  return (
    <section style={panel}>
      <h2 style={{ fontSize: 23, margin: "0 0 6px", letterSpacing: 0.5 }}>🔬 Run the diagnostic on your last video</h2>
      <p style={{ color: "#ddd0ff", margin: "0 0 16px", fontSize: 15 }}>
        Answer honestly about one real video — the one you posted, not the one you meant to post.
        The Lab scores the five things that decide whether a creator video performs, and tells you why.
      </p>

      {!started && (
        <button
          onClick={() => setStarted(true)}
          className="neon-btn"
          style={{ padding: "12px 26px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 15.5 }}
        >
          Start the diagnostic →
        </button>
      )}

      {started && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {AREAS.map((area) => (
            <div key={area.name}>
              <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 16.5 }}>{area.emoji} {area.name}</p>
              {area.checks.map(([q], i) => {
                const key = `${area.name}-${i}`;
                return (
                  <div key={key} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ flex: "1 1 320px", fontSize: 15 }}>{q}</span>
                    <button
                      onClick={() => setAnswers((a) => ({ ...a, [key]: true }))}
                      style={{ padding: "5px 16px", borderRadius: 999, border: "1px solid #22c55e", background: answers[key] === true ? "#14532d" : "transparent", color: "#4ade80", fontWeight: 700, cursor: "pointer" }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setAnswers((a) => ({ ...a, [key]: false }))}
                      style={{ padding: "5px 16px", borderRadius: 999, border: "1px solid #f87171", background: answers[key] === false ? "#450a0a" : "transparent", color: "#f87171", fontWeight: 700, cursor: "pointer" }}
                    >
                      No
                    </button>
                  </div>
                );
              })}
            </div>
          ))}

          {!complete && (
            <p style={{ color: "#f0abfc", fontWeight: 700, margin: 0 }}>
              {answeredCount} of {totalChecks} answered — finish all five areas to get your diagnosis.
            </p>
          )}

          {complete && overall != null && (
            <div style={{ borderTop: "1px solid rgba(168,85,247,0.35)", paddingTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, fontSize: 19 }}>
                <strong>Video score: {overall}/100.</strong>{" "}
                <span style={{ color: "#ddd0ff" }}>
                  {overall >= 85
                    ? "This video is built to perform. Post it, then make the next one the same way."
                    : overall >= 60
                      ? "The bones are there — the leaks below are costing you reach and sales."
                      : "This is why it stalls. Fix the red areas first; they are worth more than a new idea."}
                </span>
              </p>
              {areaScores.map(({ area, yes, total }) => {
                const v = verdict(yes, total);
                const fixes = area.checks.filter((_, i) => !answers[`${area.name}-${i}`]);
                return (
                  <div key={area.name}>
                    <p style={{ margin: "0 0 4px", fontSize: 15.5 }}>
                      {area.emoji} <strong>{area.name}</strong> — {yes}/{total} · <span style={{ color: v.color, fontWeight: 700 }}>{v.label}</span>
                    </p>
                    <p style={{ margin: "0 0 4px", color: "#ddd0ff", fontSize: 14.5 }}>{area.why}</p>
                    {fixes.map(([, fix]) => (
                      <p key={fix} style={{ margin: "0 0 2px", fontSize: 14.5 }}>🔧 {fix}</p>
                    ))}
                    <p style={{ margin: "2px 0 0", fontSize: 14.5 }}>
                      <Link href={`/academy?cat=${encodeURIComponent(area.academy)}`} style={{ color: "#67e8f9", fontWeight: 700 }}>
                        Train this in the Creator Academy →
                      </Link>
                    </p>
                  </div>
                );
              })}
              {weakest.length > 0 && (
                <p style={{ margin: 0, color: "#f0abfc", fontWeight: 700 }}>
                  Start here: {weakest.map((s) => s.area.name).join(" and ")} — the highest-impact fix is always the weakest area, not a new video idea.
                </p>
              )}
              <button
                onClick={() => { setAnswers({}); setStarted(false); }}
                style={{ alignSelf: "flex-start", padding: "8px 20px", borderRadius: 999, border: "1px solid #a855f7", background: "transparent", color: "#f0abfc", fontWeight: 700, cursor: "pointer" }}
              >
                Run it on another video
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
