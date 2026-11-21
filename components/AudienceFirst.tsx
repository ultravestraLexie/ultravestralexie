"use client";

import { useState } from "react";
import {
  ALIGNMENT_TEST,
  CENTER_EXAMPLES,
  JOURNEY,
} from "@/lib/audiencefirst";

/* THE AUDIENCE FIRST TOOLS — the Protocol, turned into practice.
 * Three working tools built on the owner's defining message:
 * the Audience Alignment Test (the pre-publish challenge), the
 * Journey Builder (Attention → Relevance → Desire → Action,
 * template-built from the creator's own answers), and Center
 * Shift (creator-centered lines rewritten audience-centered).
 * Same honesty pattern as the Human-First Creator: a vague
 * audience — "everyone" — gets narrowing guidance and no verdict,
 * never a generated answer. Templates are labeled template-built;
 * they arrange the creator's own words, they invent nothing. */

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

/* The quality gate: an audience of "everyone" is no audience.
 * Word-boundary matching so "small creators" never trips on "all". */
const VAGUE_WORDS = ["everyone", "anyone", "everybody", "people", "all", "anybody", "whoever"];
function isVagueAudience(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  return VAGUE_WORDS.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(t)) || t.length < 4;
}

const NARROWING_GUIDANCE =
  "UltraVestra never treats an audience as simply “everybody.” A video made for everyone is made for no one — narrow it to a recognizable group of people, and the whole strategy gets stronger. Try a specific group instead — for example, “Beginners who want a simple skincare routine.” Sharpen that one answer and run it again.";

/* ---------------- THE ALIGNMENT TEST ---------------- */

function AlignmentTest() {
  const [answers, setAnswers] = useState<string[]>(ALIGNMENT_TEST.map(() => ""));
  const [blocked, setBlocked] = useState<"vague" | "missing" | null>(null);
  const [missingIdx, setMissingIdx] = useState<number[]>([]);
  const [aligned, setAligned] = useState(false);
  const [copied, setCopied] = useState(false);

  const setAnswer = (i: number, v: string) => {
    const next = [...answers];
    next[i] = v;
    setAnswers(next);
    setAligned(false);
    setBlocked(null);
  };

  const run = () => {
    setCopied(false);
    if (isVagueAudience(answers[0])) {
      setBlocked("vague");
      setAligned(false);
      return;
    }
    const missing = answers.map((a, i) => (a.trim() ? -1 : i)).filter((i) => i >= 0);
    if (missing.length > 0) {
      setBlocked("missing");
      setMissingIdx(missing);
      setAligned(false);
      return;
    }
    setBlocked(null);
    setAligned(true);
  };

  const contractText = [
    "MY AUDIENCE CONTRACT — THE AUDIENCE FIRST PROTOCOL",
    "",
    ...ALIGNMENT_TEST.map((q, i) => `${i + 1}. ${q.question}\n   ${answers[i].trim()}`),
    "",
    "Create for the human. Not the algorithm.",
  ].join("\n");

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>The Audience Alignment Test</p>
      <p style={toolSub}>
        The UltraVestra challenge — before you publish, make sure your video has a purpose for the person
        watching. Answer all five questions specifically. Vague answers get guidance, not a verdict.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {ALIGNMENT_TEST.map((q, i) => (
          <div key={q.question}>
            <label style={labelStyle}>{i + 1}. {q.question}</label>
            <input
              style={inputStyle}
              value={answers[i]}
              onChange={(e) => setAnswer(i, e.target.value)}
              placeholder={q.guidance}
            />
            <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>{q.guidance}</p>
          </div>
        ))}
      </div>
      <button onClick={run} className="neon-btn" style={{ ...neonBtn, marginTop: 20 }}>
        Run the Alignment Test
      </button>

      {blocked === "vague" && (
        <div style={{ ...card, marginTop: 20, border: "1px solid #e879f9", background: "rgba(46,16,101,0.75)" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 15.5, color: "#f0abfc" }}>
            Not yet — that audience is too wide to align anything
          </p>
          <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>{NARROWING_GUIDANCE}</p>
          <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
            This isn&rsquo;t an error — it&rsquo;s the quality gate. No verdict is issued on a vague audience.
          </p>
        </div>
      )}

      {blocked === "missing" && (
        <div style={{ ...card, marginTop: 20, border: "1px solid #e879f9", background: "rgba(46,16,101,0.75)" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 15.5, color: "#f0abfc" }}>
            Almost — {missingIdx.length} question{missingIdx.length > 1 ? "s" : ""} still unanswered
          </p>
          <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>
            {missingIdx.map((i) => `Question ${i + 1}: ${ALIGNMENT_TEST[i].question} (${ALIGNMENT_TEST[i].guidance})`).join(" · ")}
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
            An unanswered question is a gap the viewer will feel. Answer it before the video goes out.
          </p>
        </div>
      )}

      {aligned && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...card, border: "1px solid #22d3ee", textAlign: "center", padding: "18px" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#67e8f9" }}>Aligned ✓</p>
            <p style={{ margin: "6px 0 0", fontSize: 15, color: "#ddd0ff" }}>
              Every question has a specific answer. This is your video&rsquo;s audience contract — the promise
              the video makes to the person watching.
            </p>
          </div>
          {ALIGNMENT_TEST.map((q, i) => (
            <div key={q.question} style={card}>
              <p style={{ margin: "0 0 5px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>
                {q.question.toUpperCase()}
              </p>
              <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>{answers[i].trim()}</p>
            </div>
          ))}
          <button
            onClick={() => { navigator.clipboard?.writeText(contractText); setCopied(true); }}
            className="neon-btn"
            style={{ ...neonBtn, alignSelf: "flex-start", padding: "11px 24px", fontSize: 15 }}
          >
            {copied ? "Copied ✓" : "Copy my audience contract"}
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------------- THE JOURNEY BUILDER ---------------- */

interface JourneyPlan {
  topic: string;
  audience: string;
  problem: string;
  lines: { stage: string; viewerSays: string; description: string; line: string }[];
}

function buildJourney(topic: string, audience: string, problem: string): JourneyPlan {
  const t = topic.trim();
  const a = audience.trim();
  const p = problem.trim().replace(/\.$/, "");
  const lines = [
    {
      ...JOURNEY[0],
      line: `If ${p} is part of your day, stop scrolling — this one is for you.`,
    },
    {
      ...JOURNEY[1],
      line: `This is for ${a} — if that's your situation, watch what happens next.`,
    },
    {
      ...JOURNEY[2],
      line: `Here's what ${t} is designed to do about it. Watch it work on the real problem, then judge the result for yourself.`,
    },
    {
      ...JOURNEY[3],
      line: `If this could improve your situation, the details are linked below. Read the facts, check who it suits — and decide with the evidence, not the hype.`,
    },
  ];
  return { topic: t, audience: a, problem: p, lines };
}

function JourneyBuilder() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [problem, setProblem] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [plan, setPlan] = useState<JourneyPlan | null>(null);
  const [copied, setCopied] = useState(false);

  const build = () => {
    setCopied(false);
    if (isVagueAudience(audience) || !topic.trim() || !problem.trim()) {
      setBlocked(true);
      setPlan(null);
      return;
    }
    setBlocked(false);
    setPlan(buildJourney(topic, audience, problem));
  };

  const planText = plan
    ? [
        "MY FOUR-STAGE JOURNEY — THE AUDIENCE FIRST PROTOCOL",
        `Video: ${plan.topic} · For: ${plan.audience}`,
        "",
        ...plan.lines.map((l) => `${l.stage} — “${l.viewerSays}”\n${l.line}`),
      ].join("\n")
    : "";

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>The Journey Builder</p>
      <p style={toolSub}>
        Build your video on the four-stage psychological journey: Attention → Relevance → Desire → Action.
        Name the product, the exact audience, and their problem — the builder writes a template line for
        each stage, in the viewer&rsquo;s words.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>What is the product or topic?</label>
          <input style={inputStyle} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. this foldable storage box" />
        </div>
        <div>
          <label style={labelStyle}>Who exactly is it for?</label>
          <input style={inputStyle} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. renters with small closets" />
        </div>
        <div>
          <label style={labelStyle}>What problem or desire do they have?</label>
          <input style={inputStyle} value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="e.g. closet clutter taking over the bedroom" />
        </div>
      </div>
      <button onClick={build} className="neon-btn" style={{ ...neonBtn, marginTop: 20 }}>
        Build my four-stage journey
      </button>

      {blocked && (
        <div style={{ ...card, marginTop: 20, border: "1px solid #e879f9", background: "rgba(46,16,101,0.75)" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 15.5, color: "#f0abfc" }}>
            Not yet — the journey needs a real person at the start of it
          </p>
          <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>
            {!topic.trim() || !problem.trim()
              ? "Fill in the product and the audience's problem or desire — a journey built on blanks would be a template about nothing."
              : NARROWING_GUIDANCE}
          </p>
        </div>
      )}

      {plan && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16.5, color: "#f3e8ff" }}>
            Your journey — {plan.topic}, for {plan.audience}
          </p>
          {plan.lines.map((l, i) => (
            <div key={l.stage} style={card}>
              <p style={{ margin: "0 0 5px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>
                STAGE {i + 1} · {l.stage} — &ldquo;{l.viewerSays}&rdquo;
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 16.5, fontWeight: 700, color: "#f3e8ff" }}>&ldquo;{l.line}&rdquo;</p>
              <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>{l.description}</p>
            </div>
          ))}
          <button
            onClick={() => { navigator.clipboard?.writeText(planText); setCopied(true); }}
            className="neon-btn"
            style={{ ...neonBtn, alignSelf: "flex-start", padding: "11px 24px", fontSize: 15 }}
          >
            {copied ? "Copied ✓" : "Copy the journey"}
          </button>
          <p style={{ color: "#ddd0ff", fontSize: 13.5, margin: 0 }}>
            Template-built from your answers — starting lines, not finished scripts. Say them in your own
            words, and demonstrate the desire stage honestly: show what it actually does.
          </p>
        </div>
      )}
    </section>
  );
}

/* ---------------- CENTER SHIFT ---------------- */

const PROBLEM_OPTIONS = [
  "a routine that takes too many steps",
  "cleaning that eats the whole weekend",
  "weeknight meals that take too long",
  "workouts that keep getting skipped",
  "hair that won't cooperate in the morning",
  "closets too small for everything in them",
  "snacking they regret by mid-afternoon",
];

function CenterShift() {
  const [picked, setPicked] = useState(0);
  const [myLine, setMyLine] = useState("");
  const [problem, setProblem] = useState(PROBLEM_OPTIONS[0]);
  const [shifted, setShifted] = useState<string | null>(null);

  const example = CENTER_EXAMPLES[picked];

  const shift = () => {
    if (!myLine.trim()) {
      setShifted(null);
      return;
    }
    setShifted(
      `Tired of ${problem}? Here's what this is designed to do about it — and how I actually use it. Watch it work, then decide for yourself.`
    );
  };

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>Center Shift</p>
      <p style={toolSub}>
        Same product, completely different psychology. Study the pairs — then shift one of your own lines
        from creator-centered to audience-centered.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {CENTER_EXAMPLES.map((ex, i) => (
          <button key={ex.niche} style={chip(picked === i)} onClick={() => setPicked(i)}>{ex.niche}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <div style={{ ...card, border: "1px solid #7f1d3d" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 13.5, letterSpacing: 1, color: "#fda4af" }}>CREATOR-CENTERED</p>
          <p style={{ margin: 0, fontSize: 16.5, color: "#f3e8ff" }}>&ldquo;{example.creator_centered}&rdquo;</p>
        </div>
        <div style={{ ...card, border: "1px solid #22d3ee" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 13.5, letterSpacing: 1, color: "#67e8f9" }}>AUDIENCE-CENTERED</p>
          <p style={{ margin: 0, fontSize: 16.5, color: "#f3e8ff" }}>&ldquo;{example.audience_centered}&rdquo;</p>
        </div>
      </div>
      <p style={{ margin: "14px 0 0", fontSize: 15.5, color: "#ddd0ff" }}>
        <strong style={{ color: "#67e8f9" }}>Why the shift works:</strong> {example.why}
      </p>

      <div style={{ borderTop: "1px solid #4c1d95", marginTop: 22, paddingTop: 20 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 16.5, color: "#f3e8ff" }}>Shift my line</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Your creator-centered line</label>
            <input style={inputStyle} value={myLine} onChange={(e) => setMyLine(e.target.value)} placeholder="e.g. Look at this new mop I just bought!" />
          </div>
          <div>
            <label style={labelStyle}>What is your audience dealing with?</label>
            <select style={inputStyle} value={problem} onChange={(e) => setProblem(e.target.value)}>
              {PROBLEM_OPTIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <button onClick={shift} className="neon-btn" style={{ ...neonBtn, marginTop: 18 }}>
          Shift it to the audience
        </button>
        {shifted && (
          <div style={{ ...card, marginTop: 18, border: "1px solid #22d3ee" }}>
            <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 13.5, letterSpacing: 1, color: "#67e8f9" }}>
              AUDIENCE-CENTERED REWRITE — TEMPLATE
            </p>
            <p style={{ margin: 0, fontSize: 16.5, fontWeight: 700, color: "#f3e8ff" }}>&ldquo;{shifted}&rdquo;</p>
            <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
              A template rewrite built from your audience&rsquo;s problem — it moves the center of the line from
              your purchase to their situation. Adjust the wording to the product you&rsquo;re actually showing,
              and only claim what you can demonstrate.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function AudienceFirst() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <AlignmentTest />
      <JourneyBuilder />
      <CenterShift />
    </div>
  );
}
