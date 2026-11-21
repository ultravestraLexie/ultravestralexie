"use client";

import { useState } from "react";
import { EMOTIONS, OPENING_LINES } from "@/lib/playbook";
import {
  AUDIENCE_SEGMENTS,
  OUTCOME_TYPES,
  QC_CHECKLIST,
  VAGUE_GUIDANCE,
  type VagueGuidance,
} from "@/lib/humanfirst";

/* THE HUMAN-FIRST VIDEO CREATOR — the first working screen inside
 * UltraVestra. Start with the human, not the camera. Before it builds
 * anything, it asks who the video is for and what that person should
 * get from watching — and its quality gate refuses to generate on a
 * vague answer: "everyone" gets narrowed, "get views" gets reframed,
 * "make them buy" gets turned into an informed decision. Template-built
 * and honestly labeled: the strategy arranges the creator's own answers
 * through the Human-First system; it invents nothing about them. */

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #4c1d95",
  background: "rgba(13,2,33,0.8)", color: "#f3e8ff", fontSize: 15,
};
const labelStyle: React.CSSProperties = { display: "block", margin: "0 0 6px", fontWeight: 700, fontSize: 14.5, color: "#f0abfc" };
const toolPanel: React.CSSProperties = {
  border: "1px solid #7e22ce", background: "rgba(26,8,54,0.78)", borderRadius: 22,
  padding: "24px 26px 26px", boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const toolTitle: React.CSSProperties = { fontSize: 23, margin: "0 0 6px", letterSpacing: 0.5, fontWeight: 800, color: "#f3e8ff" };
const toolSub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 16px", fontSize: 15 };
const chip = (active: boolean): React.CSSProperties => ({
  padding: "9px 16px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 14.5,
  border: active ? "1px solid #e879f9" : "1px solid #4c1d95",
  background: active ? "linear-gradient(92deg, #a855f7, #d946ef)" : "rgba(13,2,33,0.65)",
  color: "#fff",
});
const card: React.CSSProperties = {
  border: "1px solid #4c1d95", borderRadius: 14, padding: "14px 18px", background: "rgba(13,2,33,0.65)",
};
const neonBtn: React.CSSProperties = {
  padding: "12px 26px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)",
  color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 15.5,
};

/* One Playbook opening line per emotion — the hook direction the
 * strategy points in once the human is understood. */
const HOOK_BY_EMOTION: Record<string, number> = {
  "Curiosity": 7,                    // "Let me show you the part nobody talks about."
  "Surprise": 13,                    // "Three things surprised me about this."
  "Humor": 14,                       // "I have a confession about this purchase."
  "Desire": 3,                       // "This is one of those little things that makes a big difference."
  "Hunger and appetite": 23,         // "Wait until you see the finished result."
  "Nostalgia": 11,                   // "I wish someone had explained this to me earlier."
  "Belonging": 16,                   // "If you're a beginner, start here."
  "Empathy": 1,                      // "If you struggle with this everyday problem, watch."
  "Satisfaction": 17,                // "This is for anyone who loves a satisfying transformation."
  "Confidence": 22,                  // "Here's what I would check before spending my money."
  "Excitement": 0,                   // "I didn't expect this to be the part I loved most."
  "Fear of missing useful information": 5, // "Before you buy one, look at this."
  "Pride": 12,                       // "Here is what happened when I tried it for the first time."
  "Inspiration": 9,                  // "I found a way to make this routine easier."
  "Trust": 2,                        // "I tested this so you can see what actually happens."
};

const PLATFORMS = ["TikTok", "TikTok Shop", "YouTube long-form", "YouTube Shorts", "Instagram Reels", "Instagram Stories", "Facebook", "Trybe", "Amazon", "eBay"];

const VAGUE_AUDIENCE = ["everyone", "anyone", "everybody", "all people", "people in general"];
const VIEWS_PHRASES = ["get views", "go viral", "going viral", "more views", "become viral"];
const BUY_PHRASES = ["make them buy", "make people buy", "sell more", "sell products", "get sales", "make sales"];

/* The video experience is designed from the primary outcome: a real
 * situation, a demonstration, a payoff — matched to outcome + platform. */
function designExperience(outcome: string, platform: string, topic: string, audience: string): string {
  const t = topic || "your subject";
  const a = audience || "your viewer";
  switch (outcome) {
    case "Understand something":
      return `Teach it inside a real situation, not a lecture. Open on the exact moment ${a} gets stuck with ${t}, then walk through it step by step — show each step working, don't just describe it. End on the one thing they can now do that they couldn't before. On ${platform}, give every step its own visual beat so the lesson never stalls.`;
    case "Feel something":
      return `Build the video around the feeling, not the facts. Open on a moment ${a} will recognize from their own life, let the emotion rise through a genuine demonstration of ${t}, and land on the payoff that makes the feeling stick. On ${platform}, let the reaction breathe — don't cut away from the moment that matters.`;
    case "Discover something":
      return `Hide the reveal until it earns its moment. Open with the question about ${t} that ${a} didn't know they had, show the ordinary expectation first, then reveal what you actually found — on camera, uncut. On ${platform}, tease the discovery in the first seconds without giving it away.`;
    case "Participate in something":
      return `Make the viewer a co-creator. Open with a real choice or question about ${t} that ${a} will have an opinion on, show your own side honestly, then hand them the decision — their answer shapes the follow-up video. On ${platform}, ask early, and ask again at the payoff.`;
    case "Make a better decision":
      return `Run a fair test ${a} can judge for themselves. Show ${t} working in a real situation, show the evidence — results, details, comparisons — then say plainly who it suits and who it doesn't. On ${platform}, keep the proof in the same light as the claim, and name one honest limitation.`;
    case "Feel connected":
      return `Speak to ${a} like they're already in the room. Open by naming their exact situation with ${t}, share the part of your own experience that is genuinely true, and close by inviting them into the next one. On ${platform}, consistency is the connection — the same welcome, the same promise, every time.`;
    default:
      return `Show ${t} in a real situation for ${a} — a demonstration, a payoff, and one honest moment. On ${platform}, keep every section earning the next.`;
  }
}

interface Strategy {
  topic: string;
  audience: string;
  need: string;
  outcome: string;
  outcomeDescription: string;
  emotion: string;
  emotionTagline: string;
  experience: string;
  nextAction: string;
  platform: string;
  hook: string;
  commentInvitation: string;
}

export default function HumanFirstCreator() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [need, setNeed] = useState("");
  const [outcome, setOutcome] = useState(OUTCOME_TYPES[0].label);
  const [emotionName, setEmotionName] = useState("Confidence");
  const [nextAction, setNextAction] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [guidance, setGuidance] = useState<VagueGuidance | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [copied, setCopied] = useState(false);

  const emotion = EMOTIONS.find((e) => e.name === emotionName) ?? EMOTIONS[0];

  const build = () => {
    setCopied(false);
    const a = audience.trim().toLowerCase();
    const n = need.trim().toLowerCase();
    /* QUALITY GATE — never generate before understanding the purpose. */
    if (!a || VAGUE_AUDIENCE.some((v) => a.includes(v))) {
      setGuidance(VAGUE_GUIDANCE[0]);
      setStrategy(null);
      return;
    }
    if (VIEWS_PHRASES.some((v) => n.includes(v))) {
      setGuidance(VAGUE_GUIDANCE[1]);
      setStrategy(null);
      return;
    }
    if (BUY_PHRASES.some((v) => n.includes(v))) {
      setGuidance(VAGUE_GUIDANCE[2]);
      setStrategy(null);
      return;
    }
    setGuidance(null);
    const outcomeType = OUTCOME_TYPES.find((o) => o.label === outcome) ?? OUTCOME_TYPES[0];
    setStrategy({
      topic: topic.trim(),
      audience: audience.trim(),
      need: need.trim(),
      outcome: outcomeType.label,
      outcomeDescription: outcomeType.description,
      emotion: emotion.name,
      emotionTagline: emotion.tagline,
      experience: designExperience(outcomeType.label, platform, topic.trim(), audience.trim()),
      nextAction: nextAction.trim(),
      platform,
      hook: OPENING_LINES[HOOK_BY_EMOTION[emotion.name] ?? 0],
      commentInvitation: emotion.commentInvitation,
    });
  };

  /* The QC checklist, assessed row by row against the built strategy. */
  const qcRows = strategy
    ? ([
        [QC_CHECKLIST[0], strategy.audience, true],
        [QC_CHECKLIST[1], strategy.need ? `They come because they need this: ${strategy.need}` : "", strategy.need.length > 0],
        [QC_CHECKLIST[2], strategy.need, strategy.need.length > 0],
        [QC_CHECKLIST[3], `${strategy.emotion} — ${strategy.emotionTagline.toLowerCase()}`, true],
        [QC_CHECKLIST[4], `${strategy.outcome} — ${strategy.outcomeDescription}`, true],
        [QC_CHECKLIST[5], "Designed in — the video experience builds to a payoff, it doesn't wander.", true],
        [QC_CHECKLIST[6], `The comment invitation: “${strategy.commentInvitation}”`, true],
        [QC_CHECKLIST[7], strategy.nextAction, strategy.nextAction.length > 0],
      ] as [[string, string], string, boolean][])
    : [];

  const strategyText = strategy
    ? [
        `MY HUMAN-FIRST VIDEO STRATEGY`,
        `Video: ${strategy.topic || "(not named)"} · Platform: ${strategy.platform}`,
        ``,
        `AUDIENCE → ${strategy.audience}`,
        `HUMAN NEED → ${strategy.need || "(not named)"}`,
        `EMOTION → ${strategy.emotion} — ${strategy.emotionTagline}`,
        `VIDEO EXPERIENCE → ${strategy.experience}`,
        `VIEWER OUTCOME → ${strategy.outcome} — ${strategy.outcomeDescription}`,
        `NEXT ACTION → ${strategy.nextAction || "(not named)"}`,
        ``,
        `HOOK DIRECTION (open on the human, then this line): “${strategy.hook}”`,
        `COMMENT INVITATION: “${strategy.commentInvitation}”`,
      ].join("\n")
    : "";

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🧑 The Human-First Video Creator</p>
      <p style={toolSub}>
        Start with the human, not the camera. Answer for the person first — the strategy is built only
        when the purpose is understood. That is the rule: never generate a video before understanding its purpose.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>What is your video about?</label>
          <input style={inputStyle} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. a simple skincare routine for beginners" />
        </div>
        <div>
          <label style={labelStyle}>Who exactly are you trying to reach?</label>
          <input style={inputStyle} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Beginners who want a simple skincare routine" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
            {AUDIENCE_SEGMENTS.map((s) => (
              <button
                key={s.label}
                style={chip(audience === s.label)}
                onClick={() => { setAudience(s.label); if (!need.trim()) setNeed(s.want); }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
            Quick-picks from the Playbook&rsquo;s skincare example — the same product needs a different story for each group. Never &ldquo;everybody.&rdquo;
          </p>
        </div>
        <div>
          <label style={labelStyle}>What does this audience need or want?</label>
          <input style={inputStyle} value={need} onChange={(e) => setNeed(e.target.value)} placeholder="e.g. Understand what products are right for them" />
        </div>
        <div>
          <label style={labelStyle}>What should the viewer get from the video? (pick one primary outcome)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {OUTCOME_TYPES.map((o) => (
              <button key={o.label} style={chip(outcome === o.label)} onClick={() => setOutcome(o.label)}>{o.label}</button>
            ))}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
            {(OUTCOME_TYPES.find((o) => o.label === outcome) ?? OUTCOME_TYPES[0]).description} A video can have several outcomes — it should have one primary.
          </p>
        </div>
        <div>
          <label style={labelStyle}>What should they feel?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EMOTIONS.map((e) => (
              <button key={e.name} style={chip(e.name === emotionName)} onClick={() => setEmotionName(e.name)}>{e.name}</button>
            ))}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>{emotion.name} — {emotion.tagline.toLowerCase()}.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <div>
            <label style={labelStyle}>What should they naturally do afterward?</label>
            <input style={inputStyle} value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="e.g. Ask questions and explore the topic" />
          </div>
          <div>
            <label style={labelStyle}>Where will you publish?</label>
            <select style={inputStyle} value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={build} className="neon-btn" style={{ ...neonBtn, marginTop: 20 }}>
        Build my human-first video strategy
      </button>

      {guidance && (
        <div style={{ ...card, marginTop: 20, border: "1px solid #e879f9", background: "rgba(46,16,101,0.75)" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 15.5, color: "#f0abfc" }}>
            ⏸️ Not yet — {guidance.said} is where strategies go to stay vague
          </p>
          <p style={{ margin: "0 0 8px", fontSize: 15.5, color: "#f3e8ff" }}>{guidance.guidance}</p>
          <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>{guidance.suggestion}</p>
          <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
            This isn&rsquo;t an error — it&rsquo;s the quality gate. Sharpen that one answer and build again.
          </p>
        </div>
      )}

      {strategy && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16.5, color: "#f3e8ff" }}>
            Your Emotion-to-Outcome chain — Audience → Human need → Emotion → Video experience → Viewer outcome → Next action
          </p>
          {([
            ["AUDIENCE", strategy.audience],
            ["HUMAN NEED", strategy.need || "Not named — the strategy is weaker without it. Add what this audience needs or wants."],
            ["EMOTION", `${strategy.emotion} — ${strategy.emotionTagline}`],
            ["VIDEO EXPERIENCE", strategy.experience],
            ["VIEWER OUTCOME", `${strategy.outcome} — ${strategy.outcomeDescription}`],
            ["NEXT ACTION", strategy.nextAction || "Not named — give them one natural next step, or the chain ends at the video."],
          ] as [string, string][]).map(([h, b]) => (
            <div key={h} style={card}>
              <p style={{ margin: "0 0 5px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>{h}</p>
              <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>{b}</p>
            </div>
          ))}

          <div style={{ ...card, textAlign: "center", padding: "20px 18px" }}>
            <p style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 700, letterSpacing: 1.5, color: "#f0abfc" }}>
              HOOK DIRECTION — OPEN ON {strategy.audience.toUpperCase()}, THEN THIS LINE
            </p>
            <p style={{ margin: 0, fontSize: 21, fontWeight: 800, color: "#f3e8ff" }}>&ldquo;{strategy.hook}&rdquo;</p>
            <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
              Drawn from the Playbook&rsquo;s 25 opening lines for {strategy.emotion}. The hook serves the human — never the other way around.
            </p>
          </div>

          <div style={card}>
            <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 14.5, letterSpacing: 0.5, color: "#67e8f9" }}>
              QUALITY CONTROL — YOUR ANSWERS AGAINST THE STANDARD
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {qcRows.map(([[q, strong], answer, ok]) => (
                <p key={q} style={{ margin: 0, fontSize: 15 }}>
                  <span style={{ color: ok ? "#67e8f9" : "#f0abfc", fontWeight: 800 }}>{ok ? "✓" : "△"}</span>{" "}
                  <strong style={{ color: "#f0abfc" }}>{q}</strong>{" "}
                  <span style={{ color: "#f3e8ff" }}>{answer || "Not answered yet."}</span>{" "}
                  <span style={{ color: "#ddd0ff" }}>(Strong: {strong.charAt(0).toLowerCase() + strong.slice(1)}.)</span>
                </p>
              ))}
            </div>
          </div>

          <button
            onClick={() => { navigator.clipboard?.writeText(strategyText); setCopied(true); }}
            className="neon-btn"
            style={{ ...neonBtn, alignSelf: "flex-start", padding: "11px 24px", fontSize: 15 }}
          >
            {copied ? "Copied ✓" : "Copy the strategy"}
          </button>
          <p style={{ color: "#ddd0ff", fontSize: 13.5, margin: 0 }}>
            Template-built from the Human-First system and your answers — make it yours before you film.
            Then build the full script in the Script Studio, and score the finished video in the Emotion Lab below.
          </p>
        </div>
      )}
    </section>
  );
}
