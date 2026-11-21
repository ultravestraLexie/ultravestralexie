"use client";

import { useState } from "react";
import {
  TRIGGERS,
  CHAIN,
  PRE_PUBLISHING_TEST,
  PRE_PUBLISHING_NOTE,
  GOAL_TRIGGERS,
  type Trigger,
} from "@/lib/triggers";

/* THE 10 PSYCHOLOGICAL TRIGGERS — TRIGGER LAB. Two working tools
 * built on the signature lesson: the Pre-Publishing Test (his
 * 7-item checklist, run before any TikTok Shop, creator, or
 * affiliate advertisement goes live) and the Trigger Stack (pick a
 * goal, get the recommended triggers; then build a stack of up to
 * four and receive an ordered filming plan in his chain order —
 * attention, interest, understanding, trust, decision). The plan
 * is template-built from the lesson and labeled as such: a filming
 * plan, never a prediction of results. */

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
const ghostBtn: React.CSSProperties = {
  padding: "10px 22px", borderRadius: 999, cursor: "pointer",
  background: "rgba(13,2,33,0.65)", border: "1px solid #4c1d95", color: "#f3e8ff", fontWeight: 700, fontSize: 14.5,
};
const chipBtn = (active: boolean): React.CSSProperties => ({
  padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 14,
  border: active ? "1px solid #e879f9" : "1px solid #4c1d95",
  background: active ? "linear-gradient(92deg, #a855f7, #d946ef)" : "rgba(13,2,33,0.65)",
  color: "#fff",
});
const objectiveChip: React.CSSProperties = {
  display: "inline-block", background: "#2e1065", color: "#67e8f9", border: "1px solid #22d3ee",
  borderRadius: 999, padding: "3px 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: 0.4,
};

function triggerGuidance(t: Trigger): string {
  if (t.try_line) return `Try: \u201c${t.try_line}\u201d`;
  if (t.key_line) return t.key_line;
  if (t.examples && t.examples.length > 0) return `Open like this: \u201c${t.examples[0]}\u201d`;
  return t.teaching[0];
}

/* ================= THE PRE-PUBLISHING TEST ================= */
export function PrePublishingTest() {
  const [checked, setChecked] = useState<boolean[]>(() => PRE_PUBLISHING_TEST.map(() => false));
  const done = checked.filter(Boolean).length;
  const total = PRE_PUBLISHING_TEST.length;
  const complete = done === total;

  function toggle(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }
  function reset() {
    setChecked(PRE_PUBLISHING_TEST.map(() => false));
  }

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>✅ The Pre-Publishing Test</p>
      <p style={toolSub}>
        A practical challenge for creators: run this checklist before you publish. {PRE_PUBLISHING_NOTE}
      </p>
      <p style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 800, color: complete ? "#67e8f9" : "#f0abfc" }}>
        {done}/{total} completed
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        {PRE_PUBLISHING_TEST.map((item, i) => (
          <button
            key={item}
            onClick={() => toggle(i)}
            style={{
              ...card,
              cursor: "pointer", textAlign: "left", width: "100%",
              display: "flex", alignItems: "flex-start", gap: 12,
              border: checked[i] ? "1px solid #22d3ee" : "1px solid #4c1d95",
            }}
          >
            <span
              aria-hidden
              style={{
                flexShrink: 0, width: 24, height: 24, borderRadius: 7, marginTop: 1,
                border: checked[i] ? "1px solid #22d3ee" : "1px solid #7e22ce",
                background: checked[i] ? "linear-gradient(92deg, #a855f7, #d946ef)" : "rgba(13,2,33,0.65)",
                color: "#fff", fontSize: 15, fontWeight: 800, lineHeight: "22px", textAlign: "center",
              }}
            >
              {checked[i] ? "✓" : ""}
            </span>
            <span style={{ fontSize: 15.5, color: checked[i] ? "#f3e8ff" : "#ddd0ff", fontWeight: checked[i] ? 700 : 400 }}>
              {item}
            </span>
          </button>
        ))}
      </div>
      {complete && (
        <p style={{ margin: "0 0 16px", fontSize: 16.5, fontWeight: 800, color: "#67e8f9" }}>
          Ready to publish ✓ — you ran the test instead of guessing.
        </p>
      )}
      <button style={ghostBtn} onClick={reset}>Reset checklist</button>
    </section>
  );
}

/* ================= THE TRIGGER STACK ================= */
const MAX_STACK = 4;

export function TriggerStack() {
  const [goal, setGoal] = useState<string>(GOAL_TRIGGERS[0].goal);
  const [stack, setStack] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const activeGoal = GOAL_TRIGGERS.find((g) => g.goal === goal) ?? GOAL_TRIGGERS[0];
  const recommended = activeGoal.triggers
    .map((name) => TRIGGERS.find((t) => t.name === name))
    .filter((t): t is Trigger => Boolean(t));

  const plan = stack
    .map((name) => TRIGGERS.find((t) => t.name === name))
    .filter((t): t is Trigger => Boolean(t))
    .sort((a, b) => a.chain_stage - b.chain_stage || a.n - b.n);

  function toggleTrigger(name: string) {
    setCopied(false);
    setStack((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= MAX_STACK) return prev;
      return [...prev, name];
    });
  }

  function loadGoalStack() {
    setCopied(false);
    setStack(activeGoal.triggers.slice(0, MAX_STACK));
  }

  async function copyPlan() {
    if (plan.length === 0) return;
    const text =
      "MY TRIGGER STACK — FILMING PLAN\n" +
      plan
        .map(
          (t, i) =>
            `${i + 1}. [${CHAIN[t.chain_stage].stage}] ${t.name} — ${t.objective}\n   ${triggerGuidance(t)}`
        )
        .join("\n") +
      "\n\nTemplate-built from the UltraVestra lesson \u201cThe 10 Psychological Triggers.\u201d A filming plan, not a prediction of results — say it in your own words, and only say what is true.";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🧪 Trigger Stack</p>
      <p style={toolSub}>
        You don&rsquo;t need all ten triggers in every video. Start from what this video must do, take the
        recommended triggers, then build your own stack of up to {MAX_STACK} — the lab orders them into a
        filming plan in the chain order: attention → interest → understanding → trust → decision.
      </p>

      <p style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 700, color: "#f0abfc" }}>What must this video do?</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {GOAL_TRIGGERS.map((g) => (
          <button key={g.goal} style={chipBtn(goal === g.goal)} onClick={() => setGoal(g.goal)}>{g.goal}</button>
        ))}
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 15.5, color: "#f3e8ff" }}>
        <strong style={{ color: "#f0abfc" }}>How:</strong> {activeGoal.how}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12, marginBottom: 20 }}>
        {recommended.map((t) => (
          <div key={t.name} style={card}>
            <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#f3e8ff" }}>
              <span style={{ color: "#67e8f9" }}>{t.n}.</span> {t.name}
            </p>
            <span style={objectiveChip}>{t.objective}</span>
            <p style={{ margin: "10px 0 0", fontSize: 14.5, color: "#ddd0ff" }}>{triggerGuidance(t)}</p>
          </div>
        ))}
      </div>

      <p style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 700, color: "#f0abfc" }}>
        Build your stack — tick up to {MAX_STACK} triggers ({stack.length}/{MAX_STACK} chosen)
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {TRIGGERS.map((t) => (
          <button
            key={t.name}
            style={chipBtn(stack.includes(t.name))}
            onClick={() => toggleTrigger(t.name)}
          >
            {t.n}. {t.name}
          </button>
        ))}
      </div>
      <p style={{ margin: "0 0 18px" }}>
        <button style={ghostBtn} onClick={loadGoalStack}>Use the &ldquo;{activeGoal.goal}&rdquo; stack</button>
      </p>

      {plan.length > 0 ? (
        <>
          <p style={{ margin: "0 0 10px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>
            Your filming plan — in chain order
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {plan.map((t, i) => (
              <div key={t.name} style={card}>
                <p style={{ margin: "0 0 4px", fontSize: 14 }}>
                  <strong style={{ color: "#67e8f9" }}>STEP {i + 1} · {CHAIN[t.chain_stage].stage.toUpperCase()}</strong>{" "}
                  <span style={{ color: "#ddd0ff" }}>— {CHAIN[t.chain_stage].line}</span>
                </p>
                <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#f3e8ff" }}>
                  {t.name} <span style={{ color: "#f0abfc", fontWeight: 700, fontSize: 14.5 }}>· {t.objective}</span>
                </p>
                <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>{triggerGuidance(t)}</p>
              </div>
            ))}
          </div>
          <button style={actionBtn} onClick={copyPlan}>{copied ? "Copied ✓" : "Copy the filming plan"}</button>
          <p style={{ margin: "12px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
            Template-built from the UltraVestra lesson &ldquo;The 10 Psychological Triggers&rdquo; — a filming
            plan, not a prediction of results. Film it, run the Pre-Publishing Test, and let real audience
            behavior judge it.
          </p>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>
          Tick at least one trigger and your ordered filming plan appears here — opening triggers first,
          decision triggers last.
        </p>
      )}
    </section>
  );
}
