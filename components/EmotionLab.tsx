"use client";

import { useMemo, useState } from "react";
import {
  EMOTIONS,
  OPENING_LINES,
  TEN_SECOND_STRUCTURE,
  FORMULAS,
  IMPROVEMENT_RULES,
  SCORECARD,
} from "@/lib/playbook";
import { HOOK_BANK, HOOK_BANK_NOTE, PRE_POST_CHECKLIST } from "@/lib/viralbase";

/* THE HUMAN EMOTION VIDEO LAB — the interactive half of the Human
 * Emotion Video Playbook. Five working tools, driven by the Playbook's
 * own data (lib/playbook.ts) and the Viral Base (lib/viralbase.ts):
 * the Emotion Studio, the Hook Laboratory, the Video Architect, the
 * Audience Reaction Lab and the Pre-Flight Check.
 * Template-built and honestly labeled — the tools arrange the
 * Playbook's words and the creator's own inputs; they invent nothing. */

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

/* ---------- The Video Architect: slot the creator's inputs into a beat ---------- */
function beatGuide(step: string, audience: string, topic: string): string {
  const s = step.toLowerCase();
  const a = audience || "your audience";
  const t = topic || "your product or topic";
  if (s.includes("emotion")) return `Name the emotion ${a} already feels about ${t} — and open on it.`;
  if (s.includes("funny") || s.includes("relatable moment")) return `Use a moment ${a} will recognize from their own life with ${t}.`;
  if (s.includes("close-up") || s.includes("delicious")) return `Film ${t} up close — texture and detail carry this beat.`;
  if (s.includes("sound") || s.includes("texture")) return `Let the natural sound of ${t} play — don't talk over it.`;
  if (s.includes("find out")) return `Say what you wanted to find out about ${t} before you tested it.`;
  if (s.includes("question")) return `Ask the exact question ${a} would ask about ${t}.`;
  if (s.includes("problem") || s.includes("desire")) return `State the problem or desire in the words ${a} would use.`;
  if (s.includes("curious") || s.includes("visual")) return `Show the most curious visual moment of ${t} — hold the explanation back.`;
  if (s.includes("demonstrat") || s.includes("preparation") || s.includes("show")) return `Show ${t} working in a real situation, the key moment uncut.`;
  if (s.includes("test")) return `Test ${t} fairly — show the real result, whatever it is.`;
  if (s.includes("limitation")) return `Name one real limitation of ${t}, plainly. It makes everything before it believable.`;
  if (s.includes("useful")) return `Say exactly who ${t} is for — and who it is not for.`;
  if (s.includes("invite") || s.includes("respond") || s.includes("choose") || s.includes("contribute")) return `Ask ${a} one real question about ${t} — borrow a conversation trigger from the Playbook.`;
  if (s.includes("next step")) return `Give one next step only — check the details, compare options, or view ${t}.`;
  if (s.includes("address") || s.includes("audience")) return `Open by naming ${a} directly — this video is for them.`;
  if (s.includes("tip")) return `Give ${a} one useful tip about ${t} that they can use today.`;
  if (s.includes("suggestion")) return `Build this beat from a real suggestion ${a} gave you.`;
  if (s.includes("recognize") || s.includes("contribution")) return `Thank ${a} — recognition is the beat.`;
  if (s.includes("memorable") || s.includes("finish")) return `End on one line ${a} will remember about ${t}.`;
  if (s.includes("reaction")) return `Capture your genuine first reaction to ${t} — do not perform it.`;
  if (s.includes("situation")) return `Set the scene: where ${a} would meet ${t} in real life.`;
  if (s.includes("entertaining")) return `Raise the energy — a reaction, a cut, a twist — without faking anything about ${t}.`;
  if (s.includes("naturally")) return `Let ${t} enter the story as the solution — no ad break, no tone change.`;
  if (s.includes("result") || s.includes("reveal") || s.includes("finished") || s.includes("explain")) return `Show and say the honest result of ${t} — no exaggeration.`;
  return `Write this beat for ${a}, with ${t} in frame.`;
}

/* ---------- The Audience Reaction Lab: symptom → the Playbook's fix ---------- */
const SYMPTOMS: { label: string; rule: [string, string]; goal: string }[] = [
  { label: "Viewers leave early", rule: IMPROVEMENT_RULES[0], goal: "Stop scrolling" },
  { label: "They watch but don't comment", rule: IMPROVEMENT_RULES[4], goal: "Create conversation" },
  { label: "They comment but don't follow", rule: IMPROVEMENT_RULES[2], goal: "Build an audience" },
  { label: "They click but don't buy", rule: IMPROVEMENT_RULES[3], goal: "Drive sales" },
  { label: "Views, but few useful interactions", rule: IMPROVEMENT_RULES[4], goal: "Create conversation" },
];

export default function EmotionLab() {
  /* Emotion Studio */
  const [emotionName, setEmotionName] = useState(EMOTIONS[0].name);
  const emotion = EMOTIONS.find((e) => e.name === emotionName) ?? EMOTIONS[0];

  /* Hook Laboratory */
  const [hookEmotion, setHookEmotion] = useState("Any emotion");
  const [hookIdx, setHookIdx] = useState(0);
  const drawHook = () => {
    let next = Math.floor(Math.random() * OPENING_LINES.length);
    if (next === hookIdx) next = (next + 1) % OPENING_LINES.length;
    setHookIdx(next);
  };

  /* Hook Bank (Viral Base): pick a pattern, fill its blanks */
  const [bankIdx, setBankIdx] = useState(0);
  const [bankValues, setBankValues] = useState<string[]>(() => HOOK_BANK[0].blanks.map(() => ""));
  const [bankCopied, setBankCopied] = useState(false);
  const bankPattern = HOOK_BANK[bankIdx];
  const pickPattern = (i: number) => {
    setBankIdx(i);
    setBankValues(HOOK_BANK[i].blanks.map(() => ""));
    setBankCopied(false);
  };
  let bankLine = bankPattern.template;
  bankValues.forEach((v) => { bankLine = bankLine.replace("___", v.trim() || "___"); });

  /* Pre-Flight Check (Viral Base): the 15 before-you-post checks */
  const [preFlight, setPreFlight] = useState<boolean[]>(() => PRE_POST_CHECKLIST.map(() => false));
  const preFlightCount = preFlight.filter(Boolean).length;
  const nextCheck = PRE_POST_CHECKLIST[preFlight.findIndex((done) => !done)];

  /* Video Architect */
  const [formulaId, setFormulaId] = useState(FORMULAS[0].id);
  const [audience, setAudience] = useState("");
  const [topic, setTopic] = useState("");
  const [copied, setCopied] = useState(false);
  const formula = FORMULAS.find((f) => f.id === formulaId) ?? FORMULAS[0];
  const outline = useMemo(
    () => formula.steps.map((step, i) => [`BEAT ${i + 1} — ${step}`, beatGuide(step, audience.trim(), topic.trim())]),
    [formula, audience, topic]
  );
  const outlineText = `${formula.name}\nAudience: ${audience.trim() || "your audience"} · Product/topic: ${topic.trim() || "your product or topic"}\n\n` +
    outline.map(([h, b]) => `${h}\n${b}`).join("\n\n");

  /* Audience Reaction Lab */
  const [symptomIdx, setSymptomIdx] = useState(0);
  const symptom = SYMPTOMS[symptomIdx];
  const scoreRow = SCORECARD.find(([goal]) => goal === symptom.goal);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* THE EMOTION STUDIO */}
      <section style={toolPanel}>
        <p style={toolTitle}>🎛️ The Emotion Studio</p>
        <p style={toolSub}>Choose an emotion. Get the video ideas, the creator technique and the comment invitation the Playbook builds around it.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {EMOTIONS.map((e) => (
            <button key={e.name} style={chip(e.name === emotionName)} onClick={() => setEmotionName(e.name)}>{e.name}</button>
          ))}
        </div>
        <div style={{ ...card, marginTop: 18 }}>
          <p style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 800, color: "#f0abfc" }}>{emotion.name} — {emotion.tagline}</p>
          <p style={{ margin: "0 0 12px", color: "#ddd0ff", fontSize: 15.5 }}>{emotion.why}</p>
          <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>VIDEO IDEAS</p>
          <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
            {emotion.videoIdeas.map((idea) => <li key={idea}>{idea}</li>)}
          </ul>
          <p style={{ margin: "0 0 8px", fontSize: 15.5 }}><strong style={{ color: "#f0abfc" }}>Creator technique:</strong> <span style={{ color: "#f3e8ff" }}>{emotion.technique}</span></p>
          <p style={{ margin: 0, fontSize: 15.5 }}><strong style={{ color: "#f0abfc" }}>Comment invitation:</strong> <span style={{ color: "#f3e8ff" }}>&ldquo;{emotion.commentInvitation}&rdquo;</span></p>
        </div>
      </section>

      {/* THE HOOK LABORATORY */}
      <section style={toolPanel}>
        <p style={toolTitle}>🧪 The Hook Laboratory</p>
        <p style={toolSub}>The Playbook&rsquo;s 10-second attention engine — then draw a proven opening line and make it yours.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12, marginBottom: 18 }}>
          {TEN_SECOND_STRUCTURE.map(([step, text]) => (
            <div key={step} style={card}>
              <p style={{ margin: "0 0 5px", fontWeight: 800, fontSize: 14.5, color: "#67e8f9" }}>{step}</p>
              <p style={{ margin: 0, fontSize: 14.5, color: "#f3e8ff" }}>{text}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, alignItems: "end" }}>
          <div>
            <label style={labelStyle}>Emotion this hook should carry</label>
            <select style={inputStyle} value={hookEmotion} onChange={(e) => setHookEmotion(e.target.value)}>
              <option>Any emotion</option>
              {EMOTIONS.map((e) => <option key={e.name}>{e.name}</option>)}
            </select>
          </div>
          <button onClick={drawHook} className="neon-btn" style={{ padding: "12px 24px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 15 }}>
            Another hook 🎲
          </button>
        </div>
        <div style={{ ...card, marginTop: 16, textAlign: "center", padding: "22px 18px" }}>
          <p style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 700, letterSpacing: 1.5, color: "#f0abfc" }}>
            {hookEmotion === "Any emotion" ? "YOUR OPENING LINE" : `YOUR OPENING LINE · CARRY IT WITH ${hookEmotion.toUpperCase()}`}
          </p>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f3e8ff" }}>&ldquo;{OPENING_LINES[hookIdx]}&rdquo;</p>
          <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>Drawn from the Playbook&rsquo;s 25 opening lines. Say it with the product or the problem already in frame.</p>
        </div>

        {/* THE HOOK BANK — Viral Base fill-in patterns */}
        <div style={{ borderTop: "1px solid #4c1d95", marginTop: 22, paddingTop: 20 }}>
          <p style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 800, color: "#f3e8ff" }}>🎯 The Hook Bank</p>
          <p style={toolSub}>From Lexie Viral Base 1: fifteen fill-in hook patterns the selling videos kept using. Pick a pattern, fill the blanks, say it in the first second — and put the same words on screen.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {HOOK_BANK.map((p, i) => (
              <button key={p.name} style={chip(i === bankIdx)} onClick={() => pickPattern(i)}>{p.name}</button>
            ))}
          </div>
          {bankPattern.blanks.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 16 }}>
              {bankPattern.blanks.map((label, i) => (
                <div key={label}>
                  <label style={labelStyle}>Fill in: {label}</label>
                  <input
                    style={inputStyle}
                    value={bankValues[i] ?? ""}
                    onChange={(e) => {
                      const next = [...bankValues];
                      next[i] = e.target.value;
                      setBankValues(next);
                      setBankCopied(false);
                    }}
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
          )}
          <div style={{ ...card, marginTop: 16, textAlign: "center", padding: "22px 18px" }}>
            <p style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 700, letterSpacing: 1.5, color: "#f0abfc" }}>YOUR HOOK · {bankPattern.name.toUpperCase()}</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f3e8ff" }}>&ldquo;{bankLine}&rdquo;</p>
            <button
              onClick={() => { navigator.clipboard?.writeText(bankLine); setBankCopied(true); }}
              className="neon-btn"
              style={{ marginTop: 14, padding: "10px 22px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 14.5 }}
            >
              {bankCopied ? "Copied ✓" : "Copy the hook"}
            </button>
          </div>
          <p style={{ color: "#ddd0ff", fontSize: 13.5, margin: "12px 0 0" }}>{HOOK_BANK_NOTE}</p>
        </div>
      </section>

      {/* THE VIDEO ARCHITECT */}
      <section style={toolPanel}>
        <p style={toolTitle}>🏗️ The Video Architect</p>
        <p style={toolSub}>Pick one of the Playbook&rsquo;s five formulas, name your audience and your product or topic — the Architect lays out the full beat-by-beat script outline.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <div>
            <label style={labelStyle}>Formula</label>
            <select style={inputStyle} value={formulaId} onChange={(e) => setFormulaId(e.target.value)}>
              {FORMULAS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Your audience</label>
            <input style={inputStyle} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. beginner creators with a full-time job" />
          </div>
          <div>
            <label style={labelStyle}>Product or topic</label>
            <input style={inputStyle} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. the LED sunset lamp" />
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {outline.map(([h, b]) => (
            <div key={h} style={card}>
              <p style={{ margin: "0 0 5px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>{h}</p>
              <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>{b}</p>
            </div>
          ))}
        </div>
        <div style={{ ...card, marginTop: 14 }}>
          <p style={{ margin: "0 0 5px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>THE PLAYBOOK&rsquo;S WORKED EXAMPLE</p>
          <p style={{ margin: 0, fontSize: 15.5, whiteSpace: "pre-line", color: "#f3e8ff" }}>{formula.example}</p>
        </div>
        <button
          onClick={() => { navigator.clipboard?.writeText(outlineText); setCopied(true); }}
          className="neon-btn"
          style={{ marginTop: 16, padding: "11px 24px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 15 }}
        >
          {copied ? "Copied ✓" : "Copy the script outline"}
        </button>
        <p style={{ color: "#ddd0ff", fontSize: 13.5, margin: "12px 0 0" }}>
          Template-built from the Playbook formula and your inputs — write each beat in your own words and verify every claim before you film.
        </p>
      </section>

      {/* THE AUDIENCE REACTION LAB */}
      <section style={toolPanel}>
        <p style={toolTitle}>📊 The Audience Reaction Lab</p>
        <p style={toolSub}>Tell the Lab what your audience is doing. It answers with the Playbook&rsquo;s improvement rule and the scorecard measure behind it. One weakness, one improvement — never change everything at once.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {SYMPTOMS.map((s, i) => (
            <button key={s.label} style={chip(i === symptomIdx)} onClick={() => setSymptomIdx(i)}>{s.label}</button>
          ))}
        </div>
        <div style={{ ...card, marginTop: 18 }}>
          <p style={{ margin: "0 0 8px", fontSize: 15.5 }}><strong style={{ color: "#f0abfc" }}>The Playbook&rsquo;s rule:</strong> <span style={{ color: "#f3e8ff" }}>{symptom.rule[0]} → {symptom.rule[1]}</span></p>
          {scoreRow && (
            <p style={{ margin: 0, fontSize: 15.5 }}><strong style={{ color: "#f0abfc" }}>Measure it — {scoreRow[0]}:</strong> <span style={{ color: "#f3e8ff" }}>{scoreRow[1]}.</span></p>
          )}
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "#ddd0ff" }}>Use the analytics available on each platform. Metrics and definitions vary between platforms, so compare like with like.</p>
        </div>
      </section>

      {/* THE PRE-FLIGHT CHECK */}
      <section style={toolPanel}>
        <p style={toolTitle}>✅ The Pre-Flight Check</p>
        <p style={toolSub}>From Lexie Viral Base 1: the fifteen before-you-post checks, taken from the videos that sell. Tick each one honestly — the second sentence builds trust. No ingredient list.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {PRE_POST_CHECKLIST.map((check, i) => (
            <button
              key={check}
              onClick={() => {
                const next = [...preFlight];
                next[i] = !next[i];
                setPreFlight(next);
              }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left", cursor: "pointer",
                border: preFlight[i] ? "1px solid #e879f9" : "1px solid #4c1d95", borderRadius: 14,
                padding: "12px 16px", background: preFlight[i] ? "rgba(168,85,247,0.18)" : "rgba(13,2,33,0.65)",
                color: "#f3e8ff", fontSize: 15.5,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1.25, color: preFlight[i] ? "#e879f9" : "#8b7bb8" }}>{preFlight[i] ? "☑" : "☐"}</span>
              <span>{check}</span>
            </button>
          ))}
        </div>
        <div style={{ ...card, marginTop: 18, textAlign: "center", padding: "20px 18px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#f3e8ff" }}>{preFlightCount} of {PRE_POST_CHECKLIST.length}</p>
          {preFlightCount === PRE_POST_CHECKLIST.length ? (
            <p style={{ margin: 0, fontSize: 16.5, fontWeight: 700, color: "#e879f9" }}>Ready to post ✓</p>
          ) : (
            <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>Next check: {nextCheck}</p>
          )}
        </div>
      </section>
    </div>
  );
}
