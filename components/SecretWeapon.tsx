"use client";

import { useEffect, useState } from "react";
import {
  HOOK_FAMILIES,
  WEAK_STRONG,
  SCORE_ITEMS,
  SCORE_LABEL,
  KEY_LESSON,
  SALES_PRINCIPLES,
  BUYER_TYPES,
  MESSAGE_STYLES,
  SIM_RESPONSES,
  SIM_LABEL,
  CLINIC_SYMPTOMS,
  FAILURE_LESSONS,
  MAKEOVERS,
  SCRIPT_STRUCTURES,
  AUTOPSY_STAGES,
  AUTOPSY_COMPLETE,
  CHALLENGES,
} from "@/lib/weapon";

/* THE CREATOR'S SECRET WEAPON — UltraVestra's interactive learning
 * universe. Nine working tools under three anchors: the Psychology Lab
 * (Hook Decoder, Scroll Stop Score), the Sales Vault (sales principles,
 * Buyer Brain Simulator, Conversion Clinic) and the Experiment Room
 * (Makeover Studio, Autopsy Worksheet, 30-Second Challenge) — plus the
 * Failure Museum and the Script Laboratory.
 * Honesty pattern, matching the other UltraVestra labs: the score is
 * educational, never a virality prediction; the simulator teaches
 * hypotheses about viewer psychology, never measured data; the autopsy
 * is a worksheet the creator runs on their OWN video — nothing here
 * claims to watch or analyze a video for them. */

const toolPanel: React.CSSProperties = {
  border: "1px solid #7e22ce", background: "rgba(26,8,54,0.78)", borderRadius: 22,
  padding: "24px 26px 26px", boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const toolTitle: React.CSSProperties = { fontSize: 23, margin: "0 0 6px", letterSpacing: 0.5, fontWeight: 800, color: "#f3e8ff" };
const toolSub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 16px", fontSize: 15 };
const card: React.CSSProperties = {
  border: "1px solid #4c1d95", borderRadius: 14, padding: "14px 18px", background: "rgba(13,2,33,0.65)",
};
const actionBtn: React.CSSProperties = {
  padding: "12px 26px", borderRadius: 999, border: "none", cursor: "pointer",
  background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, fontSize: 15.5,
};
const chipBtn = (active: boolean): React.CSSProperties => ({
  padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 14,
  border: active ? "1px solid #e879f9" : "1px solid #4c1d95",
  background: active ? "linear-gradient(92deg, #a855f7, #d946ef)" : "rgba(13,2,33,0.65)",
  color: "#fff",
});
const sectionHead: React.CSSProperties = { textAlign: "center", scrollMarginTop: 90 };
const honestyNote: React.CSSProperties = { margin: "14px 0 0", fontSize: 13.5, color: "#ddd0ff" };

/* ================= HOOK DECODER ================= */
function HookDecoder() {
  const [fam, setFam] = useState(0);
  const [pair, setPair] = useState(0);
  const family = HOOK_FAMILIES[fam];
  const ws = WEAK_STRONG[pair];
  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🔓 The Hook Decoder</p>
      <p style={toolSub}>
        Fifty-six opening hooks in seven families — each with the principle that makes it work and the formula
        behind it, so you build your own instead of copying someone else&rsquo;s. Below, weak openings decoded
        against their strong versions: same product, different psychology.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {HOOK_FAMILIES.map((f, i) => (
          <button key={f.name} style={chipBtn(fam === i)} onClick={() => setFam(i)}>{f.name}</button>
        ))}
      </div>
      <div style={{ ...card, marginBottom: 18 }}>
        <p style={{ margin: "0 0 6px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>{family.name}</p>
        <p style={{ margin: "0 0 8px", fontSize: 15.5, color: "#f3e8ff" }}><strong style={{ color: "#67e8f9" }}>Why it works:</strong> {family.principle}</p>
        <p style={{ margin: "0 0 14px", fontSize: 15.5, color: "#f3e8ff" }}><strong style={{ color: "#67e8f9" }}>The formula:</strong> <em>{family.formula}</em></p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
          {family.hooks.map((h) => (
            <p key={h} style={{ margin: 0, fontSize: 15, color: "#ddd0ff", borderLeft: "3px solid #a855f7", paddingLeft: 12 }}>&ldquo;{h}&rdquo;</p>
          ))}
        </div>
      </div>
      <p style={{ margin: "0 0 8px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>Weak vs strong — pick a pair</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {WEAK_STRONG.map((p, i) => (
          <button key={p.weak.slice(0, 18)} style={chipBtn(pair === i)} onClick={() => setPair(i)}>Pair {i + 1}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <div style={{ ...card, border: "1px solid #7f1d3d" }}>
          <p style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 800, letterSpacing: 1.5, color: "#fda4af" }}>WEAK</p>
          <p style={{ margin: 0, fontSize: 16.5, color: "#f3e8ff" }}>&ldquo;{ws.weak}&rdquo;</p>
        </div>
        <div style={{ ...card, border: "1px solid #e879f9" }}>
          <p style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 800, letterSpacing: 1.5, color: "#f0abfc" }}>STRONG</p>
          <p style={{ margin: 0, fontSize: 16.5, color: "#f3e8ff" }}>&ldquo;{ws.strong}&rdquo;</p>
        </div>
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 15.5, color: "#ddd0ff" }}><strong style={{ color: "#67e8f9" }}>Why the strong one works:</strong> {ws.why}</p>
    </section>
  );
}

/* ================= SCROLL STOP SCORE ================= */
function ScrollStopScore() {
  const [checked, setChecked] = useState<boolean[]>(SCORE_ITEMS.map(() => false));
  const score = checked.filter(Boolean).length;
  const toggle = (i: number) => setChecked((c) => c.map((v, j) => (j === i ? !v : v)));
  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🛑 The Scroll Stop Score</p>
      <p style={toolSub}>
        Run your planned opening against the eight checks before you film. Check each one your opening honestly
        passes — the score shows you exactly where the improvement lives.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SCORE_ITEMS.map((s, i) => (
          <label key={s.item} style={{ ...card, display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={checked[i]} onChange={() => toggle(i)} style={{ marginTop: 3, width: 18, height: 18, accentColor: "#d946ef" }} />
            <span>
              <span style={{ display: "block", fontSize: 15.5, fontWeight: 700, color: "#f3e8ff" }}>{s.item}</span>
              {!checked[i] && <span style={{ display: "block", fontSize: 14.5, color: "#ddd0ff", marginTop: 3 }}>Improve: {s.fix}</span>}
            </span>
          </label>
        ))}
      </div>
      <p style={{ margin: "18px 0 0", fontSize: 19, fontWeight: 800, color: "#f3e8ff" }}>
        Your opening scores <span className="wow-title" style={{ fontSize: 26 }}>{score} / 8</span>
        {score === 8 && <span style={{ color: "#f0abfc" }}> — every check passes. Now the rest of the video has to deserve it.</span>}
      </p>
      <p style={honestyNote}>{SCORE_LABEL} It measures the opening against the principles in this Lab — what happens in the feed is decided by real viewers, real products and real testing.</p>
    </section>
  );
}

/* ================= BUYER BRAIN SIMULATOR ================= */
function BuyerBrainSimulator() {
  const [buyer, setBuyer] = useState(0);
  const [style, setStyle] = useState(1);
  const b = BUYER_TYPES[buyer];
  const s = MESSAGE_STYLES[style];
  const resp = SIM_RESPONSES[b.type][s.style];
  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🧠 The Buyer Brain Simulator</p>
      <p style={toolSub}>
        Different viewers hear the same sales message in completely different ways. Pick a viewer type and a
        message style — and see the likely response before you ever press record.
      </p>
      <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#f0abfc" }}>Who is watching?</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {BUYER_TYPES.map((t, i) => (
          <button key={t.type} style={chipBtn(buyer === i)} onClick={() => setBuyer(i)}>{t.type}</button>
        ))}
      </div>
      <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#f0abfc" }}>What do you say?</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {MESSAGE_STYLES.map((t, i) => (
          <button key={t.style} style={chipBtn(style === i)} onClick={() => setStyle(i)}>{t.style}</button>
        ))}
      </div>
      <div style={{ ...card, marginBottom: 12 }}>
        <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#f3e8ff" }}>{b.type}</p>
        <p style={{ margin: "0 0 6px", fontSize: 15.5, color: "#ddd0ff" }}><strong style={{ color: "#67e8f9" }}>Mindset:</strong> {b.mindset}</p>
        <p style={{ margin: "0 0 6px", fontSize: 15.5, color: "#ddd0ff" }}><strong style={{ color: "#67e8f9" }}>Responds to:</strong> {b.responds_to}</p>
        <p style={{ margin: 0, fontSize: 15.5, color: "#ddd0ff" }}><strong style={{ color: "#67e8f9" }}>Turned off by:</strong> {b.turned_off_by}</p>
      </div>
      <div style={{ ...card, border: "1px solid #e879f9" }}>
        <p style={{ margin: "0 0 6px", fontSize: 15.5, color: "#f3e8ff" }}><strong style={{ color: "#f0abfc" }}>Your message — {s.style}:</strong> &ldquo;{s.example_line}&rdquo;</p>
        <p style={{ margin: "0 0 6px", fontSize: 15.5, color: "#f3e8ff" }}><strong style={{ color: "#f0abfc" }}>Likely response:</strong> {resp.reaction}</p>
        <p style={{ margin: 0, fontSize: 15.5, color: "#ddd0ff" }}><strong style={{ color: "#67e8f9" }}>The lesson:</strong> {resp.lesson}</p>
      </div>
      <p style={honestyNote}>{SIM_LABEL}</p>
    </section>
  );
}

/* ================= CONVERSION CLINIC ================= */
function ConversionClinic() {
  const [idx, setIdx] = useState(0);
  const c = CLINIC_SYMPTOMS[idx];
  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🩺 The Conversion Clinic</p>
      <p style={toolSub}>
        Views but no sales is a diagnosis problem, not a talent problem. Pick your symptom — the Clinic lays out
        the likely causes and the fixes, in order.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {CLINIC_SYMPTOMS.map((s, i) => (
          <button key={s.symptom} style={chipBtn(idx === i)} onClick={() => setIdx(i)}>{s.symptom}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        <div style={card}>
          <p style={{ margin: "0 0 10px", fontSize: 15.5, fontWeight: 800, color: "#fda4af" }}>LIKELY CAUSES</p>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 15, display: "flex", flexDirection: "column", gap: 8 }}>
            {c.likely_causes.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
        <div style={card}>
          <p style={{ margin: "0 0 10px", fontSize: 15.5, fontWeight: 800, color: "#4ade80" }}>THE FIXES</p>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 15, display: "flex", flexDirection: "column", gap: 8 }}>
            {c.fixes.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ================= MAKEOVER STUDIO ================= */
function MakeoverStudio() {
  const [idx, setIdx] = useState(0);
  const m = MAKEOVERS[idx];
  return (
    <section style={toolPanel}>
      <p style={toolTitle}>✨ The Creator Makeover Studio</p>
      <p style={toolSub}>
        Ordinary lines, transformed. Study what actually changed — it is never better adjectives. It is
        storytelling, curiosity, product positioning, and a reason to keep watching.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {MAKEOVERS.map((x, i) => (
          <button key={x.before.slice(0, 16)} style={chipBtn(idx === i)} onClick={() => setIdx(i)}>Makeover {i + 1}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <div style={{ ...card, border: "1px solid #7f1d3d" }}>
          <p style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 800, letterSpacing: 1.5, color: "#fda4af" }}>BEFORE</p>
          <p style={{ margin: 0, fontSize: 16.5, color: "#f3e8ff" }}>&ldquo;{m.before}&rdquo;</p>
        </div>
        <div style={{ ...card, border: "1px solid #e879f9" }}>
          <p style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 800, letterSpacing: 1.5, color: "#f0abfc" }}>AFTER</p>
          <p style={{ margin: 0, fontSize: 16.5, color: "#f3e8ff" }}>&ldquo;{m.after}&rdquo;</p>
        </div>
      </div>
      <p style={{ margin: "14px 0 8px", fontSize: 15.5, fontWeight: 800, color: "#67e8f9" }}>What changed:</p>
      <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 6 }}>
        {m.what_changed.map((x) => <li key={x}>{x}</li>)}
      </ul>
    </section>
  );
}

/* ================= AUTOPSY WORKSHEET ================= */
function AutopsyWorksheet() {
  const total = AUTOPSY_STAGES.reduce((n, s) => n + s.questions.length, 0);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const count = Object.values(done).filter(Boolean).length;
  const toggle = (key: string) => setDone((d) => ({ ...d, [key]: !d[key] }));
  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🔬 The Viral Video Autopsy — Your Worksheet</p>
      <p style={toolSub}>
        Investigators don&rsquo;t guess — they examine. Take one of YOUR videos (a hit, or one that stalled) and
        work the five stages, answering every question honestly. This worksheet runs on your judgment:
        UltraVestra does not analyze your video for you — it teaches you to see what the video is doing.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {AUTOPSY_STAGES.map((stage, si) => (
          <div key={stage.stage} style={card}>
            <p style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 800, color: "#f3e8ff" }}>
              <span style={{ color: "#67e8f9" }}>Stage {si + 1} —</span> {stage.stage}
            </p>
            <p style={{ margin: "0 0 10px", fontSize: 14.5, color: "#f0abfc", fontWeight: 700 }}>{stage.focus}</p>
            <p style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 800, color: "#ddd0ff" }}>WHAT TO LOOK FOR</p>
            <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#ddd0ff", fontSize: 14.5, display: "flex", flexDirection: "column", gap: 3 }}>
              {stage.what_to_look_for.map((x) => <li key={x}>{x}</li>)}
            </ul>
            <p style={{ margin: "0 0 6px", fontSize: 14.5, fontWeight: 800, color: "#ddd0ff" }}>ANSWER HONESTLY</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stage.questions.map((q, qi) => {
                const key = `${si}-${qi}`;
                return (
                  <label key={key} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontSize: 15, color: "#f3e8ff" }}>
                    <input type="checkbox" checked={!!done[key]} onChange={() => toggle(key)} style={{ marginTop: 3, width: 17, height: 17, accentColor: "#d946ef" }} />
                    <span>{q}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p style={{ margin: "18px 0 0", fontSize: 17, fontWeight: 800, color: "#f3e8ff" }}>
        Autopsy progress: <span className="wow-title" style={{ fontSize: 22 }}>{count} / {total}</span> questions answered
      </p>
      {count === total && (
        <div style={{ ...card, marginTop: 14, border: "1px solid #e879f9", textAlign: "center" }}>
          <p className="wow-title" style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>{AUTOPSY_COMPLETE}</p>
        </div>
      )}
    </section>
  );
}

/* ================= 30-SECOND CHALLENGE ================= */
function dayOfYearIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return day % CHALLENGES.length;
}

function ChallengeOfTheDay() {
  const [idx, setIdx] = useState(0);
  const [isToday, setIsToday] = useState(true);
  useEffect(() => {
    setIdx(dayOfYearIndex());
    setIsToday(true);
  }, []);
  const shuffle = () => {
    let next = idx;
    while (next === idx) next = Math.floor(Math.random() * CHALLENGES.length);
    setIdx(next);
    setIsToday(false);
  };
  const c = CHALLENGES[idx];
  return (
    <section style={toolPanel}>
      <p style={toolTitle}>⏱️ The 30-Second Challenge</p>
      <p style={toolSub}>
        One small, specific skill per day — practiced inside a single 30-second video. Small reps, done daily,
        are how openings, demonstrations and closings actually improve.
      </p>
      <div style={{ ...card, border: "1px solid #22d3ee" }}>
        <p style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 800, letterSpacing: 1.5, color: "#67e8f9" }}>
          {isToday ? "TODAY'S CHALLENGE" : "BONUS CHALLENGE"} · SKILL: {c.skill.toUpperCase()}
        </p>
        <p style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#f3e8ff" }}>{c.title}</p>
        <p style={{ margin: 0, fontSize: 15.5, color: "#ddd0ff" }}>{c.instructions}</p>
      </div>
      <p style={{ margin: "16px 0 0" }}>
        <button style={actionBtn} onClick={shuffle}>Give me another one</button>
      </p>
    </section>
  );
}

/* ================= FAILURE MUSEUM ================= */
function FailureMuseum() {
  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🏛️ The Content Failure Museum</p>
      <p style={toolSub}>
        Most platforms only teach success. This museum teaches what destroys content — every exhibit is a
        mistake, the explanation of why it kills the video, and the correction.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        {FAILURE_LESSONS.map((l) => (
          <article key={l.title} style={card}>
            <p style={{ margin: "0 0 10px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>{l.title}</p>
            <p style={{ margin: "0 0 8px", fontSize: 15, color: "#f3e8ff" }}><strong style={{ color: "#fda4af" }}>The mistake:</strong> {l.mistake}</p>
            <p style={{ margin: "0 0 8px", fontSize: 15, color: "#ddd0ff" }}><strong style={{ color: "#67e8f9" }}>Why it destroys the video:</strong> {l.explanation}</p>
            <p style={{ margin: 0, fontSize: 15, color: "#f3e8ff" }}><strong style={{ color: "#4ade80" }}>The correction:</strong> {l.correction}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ================= SCRIPT LABORATORY ================= */
function ScriptLaboratory() {
  const [idx, setIdx] = useState(0);
  const s = SCRIPT_STRUCTURES[idx];
  const th: React.CSSProperties = { textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc", fontSize: 14.5 };
  const td: React.CSSProperties = { padding: "8px 12px", borderBottom: "1px solid #4c1d95", color: "#ddd0ff", fontSize: 14.5, verticalAlign: "top" };
  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🧪 The Creator Script Laboratory</p>
      <p style={toolSub}>
        Eight ready-to-study script structures. Every beat tells you what to say, what to show, and why that
        part works — study the structure, then write it in your own words about your own product.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {SCRIPT_STRUCTURES.map((x, i) => (
          <button key={x.name} style={chipBtn(idx === i)} onClick={() => setIdx(i)}>{x.name.replace("The ", "").replace(" Script", "")}</button>
        ))}
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 16, color: "#f3e8ff" }}>
        <strong style={{ color: "#f0abfc" }}>{s.name}.</strong> {s.promise}
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Beat</th>
              <th style={th}>Say</th>
              <th style={th}>Show</th>
              <th style={th}>Why it works</th>
            </tr>
          </thead>
          <tbody>
            {s.beats.map((b) => (
              <tr key={b.beat}>
                <td style={{ ...td, fontWeight: 700, color: "#f3e8ff", whiteSpace: "nowrap" }}>{b.beat}</td>
                <td style={{ ...td, color: "#f3e8ff" }}>&ldquo;{b.say}&rdquo;</td>
                <td style={td}>{b.show}</td>
                <td style={td}>{b.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ================= THE FULL WEAPON ================= */
export default function SecretWeapon() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <div id="psychology-lab" style={sectionHead}>
        <p className="wow-title" style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }}>The 3-Second Psychology Lab</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          People decide whether to keep watching almost immediately. Learn to stop the scroll — and to know why it stopped.
        </p>
      </div>
      <HookDecoder />
      <ScrollStopScore />

      <div id="sales-vault" style={sectionHead}>
        <p className="wow-title" style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }}>The Sales Psychology Vault</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          How people actually make buying decisions — and how to sell without begging, hyping, or lying.
        </p>
      </div>
      <section style={{ ...toolPanel, border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.35)" }}>
        <p style={toolTitle}>The Key Lesson</p>
        <p className="wow-title" style={{ fontSize: 22, fontWeight: 800, margin: "0 0 18px", lineHeight: 1.4 }}>{KEY_LESSON}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {SALES_PRINCIPLES.map((p) => (
            <p key={p.title} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#f0abfc" }}>{p.title}.</strong> <span style={{ color: "#f3e8ff" }}>{p.line}</span>
            </p>
          ))}
        </div>
      </section>
      <BuyerBrainSimulator />
      <ConversionClinic />

      <div id="experiment-room" style={sectionHead}>
        <p className="wow-title" style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }}>The Experiment Room</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          Transform ordinary content, dissect your own videos like an investigator, and train one skill a day.
        </p>
      </div>
      <MakeoverStudio />
      <AutopsyWorksheet />
      <ChallengeOfTheDay />

      <div style={sectionHead}>
        <p className="wow-title" style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }}>Learn From What Destroys Content</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          Success teaches one path. Failure teaches the whole map.
        </p>
      </div>
      <FailureMuseum />
      <ScriptLaboratory />
    </div>
  );
}
