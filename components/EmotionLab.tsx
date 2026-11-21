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
import {
  EMOTION_LIBRARY,
  FUSION_COMBINATIONS,
  FUSION_RULE,
  MASTER_FORMULA,
  MISSION_TYPES,
  CONTENT_FORMATS,
  HOOK_FAMILIES,
  OBJECTIONS,
  OBJECTIONS_CAVEAT,
  SCORECARD_GATES,
} from "@/lib/emotionintel";
import { discoverDirections } from "@/lib/ideaengine";
import type { Direction, Mode } from "@/lib/ideaengine";

/* THE HUMAN EMOTION VIDEO LAB — the interactive half of the Human
 * Emotion Video Playbook. Eight working tools, driven by the Playbook's
 * own data (lib/playbook.ts), the Viral Base (lib/viralbase.ts), the
 * Human Emotion & Conversion Intelligence System
 * (lib/emotionintel.ts) and the Idea Engine (lib/ideaengine.ts): the
 * Emotion Studio, the Hook Laboratory, the Video Architect, the
 * Audience Reaction Lab, the Pre-Flight Check, the Emotion Fusion
 * Reactor, the Creative Mission Builder and the Idea Machine.
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

/* ---------- Emotion Fusion Reactor helpers ----------
 * The library's "Frustration and relief" is one emotion that covers
 * both fusion tokens, so it can complete the proven problem-solving
 * pairing on its own. */
function fusionTokens(emotionName: string): string[] {
  if (emotionName === "Frustration and relief") return ["Frustration", "Relief"];
  return [EMOTION_LIBRARY.find((e) => e.name === emotionName)?.short ?? emotionName];
}

/* ---------- Creative Mission Builder helpers ---------- */
const VAGUE_AUDIENCE_WORDS = ["everyone", "anyone", "everybody", "all people", "people in general"];
const MISSION_MOTIVATION: Record<string, string> = {
  "Educational content": "They want to understand before they spend.",
  "Sales video": "They are close to a decision and want to choose well.",
  "UGC that builds trust": "They want an honest read from a real person, not an ad.",
  "Entertainment and connection": "They want to feel something real in a noisy feed.",
  "Community-building content": "They want to belong to a group that gets it.",
};
const MISSION_NEXT_ACTION: Record<string, string> = {
  "Educational content": "Learn — then save the video and ask their biggest question.",
  "Sales video": "Explore the product details and decide for themselves.",
  "UGC that builds trust": "Trust — then check the details and compare options.",
  "Entertainment and connection": "Comment, and share it with someone who gets it.",
  "Community-building content": "Comment, join in, and come back for the next one.",
};
const FAMILY_BY_EMOTION: Record<string, string> = {
  Curiosity: "Curiosity",
  Trust: "Trust",
  Humor: "Humor",
  Desire: "Desire",
  Confidence: "Education",
  Empathy: "Community",
  Surprise: "Demonstration",
  Frustration: "Problem recognition",
  Happiness: "Storytelling",
  Calm: "Trust",
  Belonging: "Community",
  Hope: "Education",
  Satisfaction: "Demonstration",
  Control: "Objection handling",
};
const FAMILY_BY_MISSION: Record<string, string> = {
  "Educational content": "Education",
  "Sales video": "Objection handling",
  "UGC that builds trust": "Personal experience",
  "Entertainment and connection": "Humor",
  "Community-building content": "Community",
};

function adaptHook(example: string, product: string): string {
  if (!product) return example;
  return example.replace(/moisturizer/gi, product);
}

/* ---------- Idea Machine helpers ----------
 * The Playbook's 15 emotion names are the Lab's vocabulary; the Idea
 * Engine's classic templates key off its own shorter list. This adapter
 * translates at the boundary only — the engine itself is untouched.
 * Names the engine does not know are passed through and simply fall
 * back to its default pool, exactly as the engine was designed. */
const IDEA_EMOTION_MAP: Record<string, string> = {
  "Hunger and appetite": "Hunger",
  Empathy: "Belonging",
  Excitement: "Surprise",
  Confidence: "Trust",
  "Fear of missing useful information": "Curiosity",
  Pride: "Inspiration",
};

const IDEA_MODES: { id: Mode; label: string; blurb: string }[] = [
  { id: "classic", label: "Classic", blurb: "Proven creative structures, matched to your primary emotion." },
  { id: "unexpected", label: "Unexpected", blurb: "Strange emotion pairings that force an angle you would not have picked." },
  { id: "experimental", label: "Experimental", blurb: "Format-breaking directions — the riskiest and the most original." },
];

function directionToText(d: Direction): string {
  const secs = d.scenes.reduce((a, s) => a + s.seconds, 0);
  return [
    `ULTRAVESTRA IDEA MACHINE — ${d.name}`,
    `Emotions: ${d.emotions.join(" + ")} · Difficulty: ${d.difficulty} · Length: ~${secs} seconds`,
    `For: ${d.audience}`,
    "",
    "THE ANGLE",
    d.angle,
    "",
    "WHY IT MAY WORK (HYPOTHESIS)",
    `${d.why} ${d.originality}`,
    "",
    "HOOKS",
    ...d.hooks.map((h) => `- “${h}”`),
    "",
    "FIRST VISUAL",
    d.firstVisual,
    "",
    "PRODUCTION SHEET — SCENE BY SCENE",
    ...d.scenes.map((s) => `${s.label} (~${s.seconds}s)\n  Show: ${s.show}\n  Say: ${s.say}\n  Camera: ${s.camera}\n  Sound: ${s.sound}\n  On-screen text: ${s.text || "—"}`),
    "",
    "VISUAL DIRECTION",
    ...d.visualDirection.map((v) => `- ${v}`),
    "",
    "AUDIO DIRECTION",
    ...d.audioDirection.map((v) => `- ${v}`),
    "",
    "SHARE-WORTHY MOMENT",
    d.share,
    "",
    "FOLLOW-UP VIDEO",
    d.followUp,
    "",
    "Everything here is a creative hypothesis, never a prediction of real audience behavior.",
  ].join("\n");
}

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

  /* Emotion Fusion Reactor (Conversion Intelligence): pick 2–3 emotions */
  const [fusionPicked, setFusionPicked] = useState<string[]>(["Curiosity", "Surprise"]);
  const toggleFusion = (name: string) => {
    setFusionPicked((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= 3) return prev;
      return [...prev, name];
    });
  };
  const fusionTokenSet = new Set(fusionPicked.flatMap(fusionTokens));
  const fusionMatch = [...FUSION_COMBINATIONS]
    .filter((c) => c.pair.every((t) => fusionTokenSet.has(t)))
    .sort((x, y) => y.pair.length - x.pair.length)[0];
  const fusionExact = !!fusionMatch && fusionMatch.pair.length === fusionTokenSet.size;
  const fusionEntries = fusionPicked
    .map((n) => EMOTION_LIBRARY.find((e) => e.name === n))
    .filter((e): e is (typeof EMOTION_LIBRARY)[number] => !!e);

  /* Creative Mission Builder (Conversion Intelligence, source section 14) */
  const [mission, setMission] = useState(MISSION_TYPES[0]);
  const [missionEmotion1, setMissionEmotion1] = useState("Curiosity");
  const [missionEmotion2, setMissionEmotion2] = useState("Trust");
  const [missionFormat, setMissionFormat] = useState(CONTENT_FORMATS[0]);
  const [missionProduct, setMissionProduct] = useState("");
  const [missionAudience, setMissionAudience] = useState("");
  const [missionViewerGet, setMissionViewerGet] = useState("");
  const [missionGuidance, setMissionGuidance] = useState<string | null>(null);
  const [missionResult, setMissionResult] = useState<{
    chain: [string, string][];
    concept: string;
    hooks: { family: string; line: string }[];
    text: string;
  } | null>(null);
  const [missionCopied, setMissionCopied] = useState(false);

  const generateMission = () => {
    const a = missionAudience.trim().toLowerCase();
    if (!a || VAGUE_AUDIENCE_WORDS.some((v) => a.includes(v))) {
      setMissionResult(null);
      setMissionGuidance(
        "Not yet — that audience is too vague to build a strategy on. UltraVestra never treats an audience as simply “everybody”: a video made for everyone is made for no one. Name a recognizable group instead — for example, “skincare beginners overwhelmed by product choices” — and the whole strategy gets stronger."
      );
      return;
    }
    setMissionGuidance(null);
    setMissionCopied(false);
    const product = missionProduct.trim() || "your product";
    const audienceText = missionAudience.trim();
    const viewerGet = missionViewerGet.trim() || "understand the product and decide whether to explore it";
    const e1 = EMOTION_LIBRARY.find((e) => e.name === missionEmotion1) ?? EMOTION_LIBRARY[0];
    const e2 = EMOTION_LIBRARY.find((e) => e.name === missionEmotion2) ?? EMOTION_LIBRARY[3];
    const nextAction = MISSION_NEXT_ACTION[mission] ?? "Learn · Trust · Comment · Save · Explore · Buy";
    const chain: [string, string][] = MASTER_FORMULA.map((s) => {
      if (s.step === "Human Audience") return [s.step, audienceText];
      if (s.step === "Human Motivation") return [s.step, MISSION_MOTIVATION[mission] ?? "What matters to them comes first."];
      if (s.step === "Emotion") return [s.step, `${e1.name} + ${e2.name} — “${e1.humanThought}” / “${e2.humanThought}”`];
      if (s.step === "Content Experience") return [s.step, `${missionFormat} built around ${product}, made as ${mission.toLowerCase()}.`];
      return [s.step, `${viewerGet} → Next action: ${nextAction}`];
    });
    const concept =
      `For ${audienceText}, build a ${missionFormat.toLowerCase()} around ${product}. Lead with ${e1.name.toLowerCase()}: ${e1.content.charAt(0).toLowerCase() + e1.content.slice(1)} ` +
      `Then bring in ${e2.name.toLowerCase()}: ${e2.content.charAt(0).toLowerCase() + e2.content.slice(1)} ` +
      `The viewer should leave able to ${viewerGet.charAt(0).toLowerCase() + viewerGet.slice(1)}. Close with the natural next step for this mission: ${nextAction.charAt(0).toLowerCase() + nextAction.slice(1)}`;
    const familyNames: string[] = [];
    [FAMILY_BY_EMOTION[e1.short], FAMILY_BY_EMOTION[e2.short], FAMILY_BY_MISSION[mission]].forEach((f) => {
      if (f && !familyNames.includes(f)) familyNames.push(f);
    });
    for (const f of HOOK_FAMILIES) {
      if (familyNames.length >= 3) break;
      if (!familyNames.includes(f.family)) familyNames.push(f.family);
    }
    const hooks = familyNames.slice(0, 3).map((family) => {
      const fam = HOOK_FAMILIES.find((h) => h.family === family) ?? HOOK_FAMILIES[0];
      return { family: fam.family, line: adaptHook(fam.example, missionProduct.trim()) };
    });
    const text =
      `CREATIVE STRATEGY — ${mission}\nEmotional direction: ${e1.name} + ${e2.name} · Format: ${missionFormat}\nProduct or subject: ${product}\n\n` +
      chain.map(([k, v]) => `${k.toUpperCase()}\n${v}`).join("\n\n") +
      `\n\nYOUR CONCEPT\n${concept}\n\nTHREE HOOKS TO TEST\n` +
      hooks.map((h) => `${h.family}: “${h.line}”`).join("\n") +
      `\n\nOBJECTIONS TO ANSWER (only what you can verify)\n` +
      OBJECTIONS.map((o) => `• ${o}`).join("\n") +
      `\n\nMANDATORY GATES\n${SCORECARD_GATES}`;
    setMissionResult({ chain, concept, hooks, text });
  };

  /* The Idea Machine (Idea Engine): one subject → three creative directions */
  const [ideaSubject, setIdeaSubject] = useState("");
  const [ideaAudience, setIdeaAudience] = useState("");
  const [ideaEmotion, setIdeaEmotion] = useState(EMOTIONS[0].name);
  const [ideaMode, setIdeaMode] = useState<Mode>("classic");
  const [ideaRound, setIdeaRound] = useState(0);
  const [ideaGuidance, setIdeaGuidance] = useState<string | null>(null);
  const [ideaResults, setIdeaResults] = useState<Direction[] | null>(null);
  const [ideaCopiedId, setIdeaCopiedId] = useState<string | null>(null);

  const generateIdeas = (round: number) => {
    if (!ideaSubject.trim()) {
      setIdeaResults(null);
      setIdeaGuidance("Give the Machine a subject first — a product, a topic, anything you want to film. It builds every direction around that subject, so a blank subject can only produce blank ideas.");
      return;
    }
    setIdeaGuidance(null);
    setIdeaCopiedId(null);
    setIdeaResults(
      discoverDirections(ideaSubject, {
        mode: ideaMode,
        emotions: [IDEA_EMOTION_MAP[ideaEmotion] ?? ideaEmotion],
        audience: ideaAudience,
        round,
      })
    );
  };
  const freshIdeas = () => {
    const next = ideaRound + 1;
    setIdeaRound(next);
    generateIdeas(next);
  };

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

      {/* THE EMOTION FUSION REACTOR */}
      <section style={toolPanel}>
        <p style={toolTitle}>⚛️ The Emotion Fusion Reactor</p>
        <p style={toolSub}>From the Human Emotion &amp; Conversion Intelligence System: the strongest creative concepts often combine two or three compatible emotions. Pick yours — the Reactor tells you honestly whether the pairing is proven or an experiment.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {EMOTION_LIBRARY.map((e) => (
            <button key={e.name} style={chip(fusionPicked.includes(e.name))} onClick={() => toggleFusion(e.name)}>{e.name}</button>
          ))}
        </div>
        <p style={{ color: "#ddd0ff", fontSize: 13.5, margin: "10px 0 0" }}>
          {fusionPicked.length} of 3 chosen{fusionPicked.length >= 3 ? " — deselect one to swap." : "."}
        </p>
        <div style={{ ...card, marginTop: 16 }}>
          {fusionPicked.length < 2 ? (
            <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>Pick at least two emotions to run the Reactor.</p>
          ) : fusionMatch ? (
            <>
              <p style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 700, letterSpacing: 1.5, color: "#6ee7b7" }}>
                {fusionExact ? "✓ PROVEN COMBINATION" : "✓ CONTAINS A PROVEN COMBINATION"}
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 800, color: "#f0abfc" }}>
                {fusionMatch.pair.join(" + ")} → {fusionMatch.experience}
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 15.5, color: "#f3e8ff" }}><strong style={{ color: "#67e8f9" }}>Video example:</strong> &ldquo;{fusionMatch.example}&rdquo;</p>
              {!fusionExact && (
                <p style={{ margin: "0 0 8px", fontSize: 14.5, color: "#ddd0ff" }}>Your extra emotion{fusionPicked.length > 2 ? "s" : ""} on top of this pair {fusionPicked.length > 2 ? "are" : "is"} untested — the proven pair is the safe core; judge the addition against your audience and purpose.</p>
              )}
              <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>
                {fusionEntries.map((e) => `${e.name}: “${e.humanThought}”`).join("  ·  ")}
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 700, letterSpacing: 1.5, color: "#fda4af" }}>
                EXPERIMENTAL COMBINATION — UNTESTED PAIRING, JUDGE IT AGAINST YOUR AUDIENCE AND PURPOSE
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 800, color: "#f0abfc" }}>
                {fusionPicked.join(" + ")}
              </p>
              <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>
                No tested pairing exists for this mix yet — treat it as an experiment, not a promise. Try opening on {fusionEntries[0]?.name.toLowerCase()}&rsquo;s ground — {fusionEntries[0] ? fusionEntries[0].content.charAt(0).toLowerCase() + fusionEntries[0].content.slice(1) : ""} Then let {fusionEntries[1]?.name.toLowerCase()} carry the payoff — {fusionEntries[1] ? fusionEntries[1].content.charAt(0).toLowerCase() + fusionEntries[1].content.slice(1) : ""}{fusionEntries[2] ? ` Layer in ${fusionEntries[2].name.toLowerCase()} only where it serves the same purpose.` : ""} Film it, measure it with the Human Response Dashboard below, and let the audience&rsquo;s real reaction decide whether the pairing earns a place in your system.
              </p>
            </>
          )}
        </div>
        <p style={{ ...card, marginTop: 14, fontWeight: 700, color: "#f0abfc" }}>UltraVestra rule: {FUSION_RULE}</p>
      </section>

      {/* THE CREATIVE MISSION BUILDER */}
      <section style={toolPanel}>
        <p style={toolTitle}>🎯 The Creative Mission Builder</p>
        <p style={toolSub}>The Conversion Intelligence engine in one brief: choose the mission, the emotional direction and the format — then get a creative strategy built on the master formula: Human Audience → Human Motivation → Emotion → Content Experience → Viewer Value &amp; Next Action.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <div>
            <label style={labelStyle}>What are you creating?</label>
            <select style={inputStyle} value={mission} onChange={(e) => setMission(e.target.value)}>
              {MISSION_TYPES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Content format</label>
            <select style={inputStyle} value={missionFormat} onChange={(e) => setMissionFormat(e.target.value)}>
              {CONTENT_FORMATS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Emotional direction — first emotion</label>
            <select style={inputStyle} value={missionEmotion1} onChange={(e) => setMissionEmotion1(e.target.value)}>
              {EMOTION_LIBRARY.map((e) => <option key={e.name}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Emotional direction — second emotion</label>
            <select style={inputStyle} value={missionEmotion2} onChange={(e) => setMissionEmotion2(e.target.value)}>
              {EMOTION_LIBRARY.map((e) => <option key={e.name}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Product or subject</label>
            <input style={inputStyle} value={missionProduct} onChange={(e) => setMissionProduct(e.target.value)} placeholder="e.g. the barrier-repair moisturizer" />
          </div>
          <div>
            <label style={labelStyle}>Exact audience</label>
            <input style={inputStyle} value={missionAudience} onChange={(e) => setMissionAudience(e.target.value)} placeholder="e.g. skincare beginners overwhelmed by product choices" />
          </div>
          <div>
            <label style={labelStyle}>What should the viewer get?</label>
            <input style={inputStyle} value={missionViewerGet} onChange={(e) => setMissionViewerGet(e.target.value)} placeholder="e.g. understand the product and decide whether to explore it" />
          </div>
        </div>
        <button
          onClick={generateMission}
          className="neon-btn"
          style={{ marginTop: 18, padding: "12px 26px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 15.5 }}
        >
          Generate my creative strategy
        </button>

        {missionGuidance && (
          <div style={{ ...card, marginTop: 18, border: "1px solid #fda4af" }}>
            <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>⏸️ <strong style={{ color: "#fda4af" }}>Not yet.</strong> {missionGuidance.replace(/^Not yet — /, "")}</p>
          </div>
        )}

        {missionResult && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={card}>
              <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>THE MASTER FORMULA, FILLED WITH YOUR ANSWERS</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {missionResult.chain.map(([k, v]) => (
                  <p key={k} style={{ margin: 0, fontSize: 15.5 }}>
                    <strong style={{ color: "#f0abfc" }}>{k}:</strong> <span style={{ color: "#f3e8ff" }}>{v}</span>
                  </p>
                ))}
              </div>
            </div>
            <div style={card}>
              <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>YOUR CONCEPT</p>
              <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>{missionResult.concept}</p>
            </div>
            <div style={card}>
              <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>THREE HOOKS TO TEST — ONE PER FAMILY</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {missionResult.hooks.map((h) => (
                  <p key={h.family} style={{ margin: 0, fontSize: 15.5 }}>
                    <strong style={{ color: "#f0abfc" }}>{h.family}:</strong> <span style={{ color: "#f3e8ff" }}>&ldquo;{h.line}&rdquo;</span>
                  </p>
                ))}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 14, color: "#ddd0ff" }}>The hook must accurately match what the video delivers. Never use an exaggerated promise just to attract attention.</p>
            </div>
            <div style={card}>
              <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>THE OBJECTIONS YOUR VIEWER MAY BE CARRYING</p>
              <ul style={{ margin: "0 0 10px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
                {OBJECTIONS.map((o) => <li key={o}>{o}</li>)}
              </ul>
              <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>{OBJECTIONS_CAVEAT}</p>
            </div>
            <p style={{ ...card, margin: 0, fontWeight: 700, color: "#f0abfc" }}>Mandatory gates: {SCORECARD_GATES}</p>
            <div>
              <button
                onClick={() => { navigator.clipboard?.writeText(missionResult.text); setMissionCopied(true); }}
                className="neon-btn"
                style={{ padding: "11px 24px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 15 }}
              >
                {missionCopied ? "Copied ✓" : "Copy the creative strategy"}
              </button>
              <p style={{ color: "#ddd0ff", fontSize: 13.5, margin: "12px 0 0" }}>
                Template-built from the Conversion Intelligence system and your answers — make it yours before you film, and verify every claim.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* THE IDEA MACHINE */}
      <section style={toolPanel}>
        <p style={toolTitle}>💡 The Idea Machine</p>
        <p style={toolSub}>From the Idea Engine: name one subject and the Machine builds three distinct creative directions around it — each with its angle, its hooks, its first visual and a full scene-by-scene production sheet. No AI, no generic list: proven creative structures, bent around your subject and your audience.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <div>
            <label style={labelStyle}>Subject or product</label>
            <input style={inputStyle} value={ideaSubject} onChange={(e) => setIdeaSubject(e.target.value)} placeholder="e.g. the barrier-repair moisturizer" />
          </div>
          <div>
            <label style={labelStyle}>Exact audience</label>
            <input style={inputStyle} value={ideaAudience} onChange={(e) => setIdeaAudience(e.target.value)} placeholder="e.g. skincare beginners overwhelmed by product choices" />
          </div>
          <div>
            <label style={labelStyle}>Primary emotion</label>
            <select style={inputStyle} value={ideaEmotion} onChange={(e) => setIdeaEmotion(e.target.value)}>
              {EMOTIONS.map((e) => <option key={e.name}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Mode</label>
            <select style={inputStyle} value={ideaMode} onChange={(e) => setIdeaMode(e.target.value as Mode)}>
              {IDEA_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        </div>
        <p style={{ color: "#ddd0ff", fontSize: 14, margin: "10px 0 0" }}>
          {IDEA_MODES.find((m) => m.id === ideaMode)?.blurb}
        </p>
        <button
          onClick={() => { setIdeaRound(0); generateIdeas(0); }}
          className="neon-btn"
          style={{ marginTop: 16, padding: "12px 26px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 15.5 }}
        >
          Build my three directions
        </button>

        {ideaGuidance && (
          <div style={{ ...card, marginTop: 18, border: "1px solid #fda4af" }}>
            <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>⏸️ <strong style={{ color: "#fda4af" }}>Not yet.</strong> {ideaGuidance}</p>
          </div>
        )}

        {ideaResults && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ ...card, margin: 0, fontWeight: 700, color: "#f0abfc" }}>
              ⚠ Everything here is a creative hypothesis, never a prediction of real audience behavior. Film one direction, measure the real reaction, and let your audience decide which idea earns a series.
            </p>
            {ideaResults.map((d) => {
              const secs = d.scenes.reduce((a, s) => a + s.seconds, 0);
              return (
                <div key={d.id} style={card}>
                  <p style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 800, color: "#f0abfc" }}>
                    {d.name}
                    {d.experimental ? <span style={{ color: "#fda4af", fontSize: 13.5, fontWeight: 700, letterSpacing: 1 }}> · EXPERIMENTAL</span> : null}
                  </p>
                  <p style={{ margin: "0 0 12px", fontSize: 14, color: "#ddd0ff" }}>
                    {d.emotions.join(" + ")} · {d.difficulty} to film · ~{secs} seconds · For {d.audience}
                  </p>
                  <p style={{ margin: "0 0 8px", fontSize: 15.5 }}>
                    <strong style={{ color: "#67e8f9" }}>The angle:</strong> <span style={{ color: "#f3e8ff" }}>{d.angle}</span>
                  </p>
                  <p style={{ margin: "0 0 8px", fontSize: 15.5 }}>
                    <strong style={{ color: "#67e8f9" }}>Why it may work:</strong> <span style={{ color: "#f3e8ff" }}>{d.why} {d.originality}</span>
                  </p>
                  <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>HOOKS — PICK ONE, SAY IT IN THE FIRST SECOND</p>
                  <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 4 }}>
                    {d.hooks.map((h) => <li key={h}>&ldquo;{h}&rdquo;</li>)}
                  </ul>
                  <p style={{ margin: "0 0 12px", fontSize: 15.5 }}>
                    <strong style={{ color: "#67e8f9" }}>First visual:</strong> <span style={{ color: "#f3e8ff" }}>{d.firstVisual}</span>
                  </p>
                  <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>PRODUCTION SHEET — SCENE BY SCENE</p>
                  <div style={{ overflowX: "auto", marginBottom: 12 }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760, fontSize: 13.5, color: "#f3e8ff" }}>
                      <thead>
                        <tr>
                          {["Scene", "Sec", "Show", "Say", "Camera", "Sound", "On-screen text"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "7px 9px", borderBottom: "1px solid #7e22ce", color: "#f0abfc", fontSize: 12.5, letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {d.scenes.map((s) => (
                          <tr key={s.label}>
                            <td style={{ padding: "7px 9px", borderBottom: "1px solid #4c1d95", fontWeight: 700, whiteSpace: "nowrap" }}>{s.label}</td>
                            <td style={{ padding: "7px 9px", borderBottom: "1px solid #4c1d95" }}>~{s.seconds}s</td>
                            <td style={{ padding: "7px 9px", borderBottom: "1px solid #4c1d95" }}>{s.show}</td>
                            <td style={{ padding: "7px 9px", borderBottom: "1px solid #4c1d95" }}>{s.say}</td>
                            <td style={{ padding: "7px 9px", borderBottom: "1px solid #4c1d95" }}>{s.camera}</td>
                            <td style={{ padding: "7px 9px", borderBottom: "1px solid #4c1d95" }}>{s.sound}</td>
                            <td style={{ padding: "7px 9px", borderBottom: "1px solid #4c1d95" }}>{s.text || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12, marginBottom: 12 }}>
                    <div>
                      <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>VISUAL DIRECTION</p>
                      <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 14.5, display: "flex", flexDirection: "column", gap: 4 }}>
                        {d.visualDirection.map((v) => <li key={v}>{v}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>AUDIO DIRECTION</p>
                      <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 14.5, display: "flex", flexDirection: "column", gap: 4 }}>
                        {d.audioDirection.map((v) => <li key={v}>{v}</li>)}
                      </ul>
                    </div>
                  </div>
                  <p style={{ margin: "0 0 8px", fontSize: 15.5 }}>
                    <strong style={{ color: "#67e8f9" }}>Share-worthy moment:</strong> <span style={{ color: "#f3e8ff" }}>{d.share}</span>
                  </p>
                  <p style={{ margin: "0 0 14px", fontSize: 15.5 }}>
                    <strong style={{ color: "#67e8f9" }}>Follow-up video:</strong> <span style={{ color: "#f3e8ff" }}>{d.followUp}</span>
                  </p>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(directionToText(d)); setIdeaCopiedId(d.id); }}
                    className="neon-btn"
                    style={{ padding: "10px 22px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 14.5 }}
                  >
                    {ideaCopiedId === d.id ? "Copied ✓" : "Copy this production sheet"}
                  </button>
                </div>
              );
            })}
            <div>
              <button
                onClick={freshIdeas}
                className="neon-btn"
                style={{ padding: "11px 24px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 15 }}
              >
                Show me a different set 🎲
              </button>
              <p style={{ color: "#ddd0ff", fontSize: 13.5, margin: "12px 0 0" }}>
                Engine-built from the Idea Engine&rsquo;s creative structures and your inputs — make each direction yours before you film, and verify every claim.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
