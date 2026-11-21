"use client";

import { useState } from "react";
import { EVALUATION, SCORING_NOTE } from "@/lib/purchaselab";

/* THE PRODUCT-TO-PURCHASE EVALUATOR — UltraVestra's Video
 * Intelligence self-check. The creator answers the seven evaluation
 * questions honestly — Yes, Partly, or No — and the Evaluator
 * diagnoses every weak point, ranks the fixes weakest-first (all No
 * answers before Partly; the first frame and the hook outrank the
 * rest, because nothing downstream matters if nobody stops or the
 * wrong person stops), and returns an improvement plan: fix ONE
 * thing, then test. Educational only — never a prediction of sales
 * or virality. */

type Answer = "yes" | "partly" | "no";

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

const ANSWER_META: { key: Answer; label: string; accent: string }[] = [
  { key: "yes", label: "Yes", accent: "#22d3ee" },
  { key: "partly", label: "Partly", accent: "#e879f9" },
  { key: "no", label: "No", accent: "#fb7185" },
];

const answerBtn = (accent: string, active: boolean): React.CSSProperties => ({
  padding: "8px 20px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 14.5,
  border: active ? `1px solid ${accent}` : "1px solid #4c1d95",
  background: active ? "linear-gradient(92deg, #a855f7, #d946ef)" : "rgba(13,2,33,0.65)",
  color: "#fff",
});

/* Priority inside the same severity: the first frame and the hook
 * rank highest — if nobody stops, or the wrong person stops, nothing
 * after them gets a chance to work. */
const PRIORITY_RANK = [0, 1, 2, 3, 4, 5, 6];

export default function PurchaseLab() {
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [copied, setCopied] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === EVALUATION.length;

  const weaknesses = EVALUATION
    .map((q, i) => ({ q, i, answer: answers[i] }))
    .filter((w) => w.answer === "no" || w.answer === "partly")
    .sort((a, b) => {
      const sev = (x: Answer | undefined) => (x === "no" ? 0 : 1);
      if (sev(a.answer) !== sev(b.answer)) return sev(a.answer) - sev(b.answer);
      return PRIORITY_RANK[a.i] - PRIORITY_RANK[b.i];
    });

  const hasNo = weaknesses.some((w) => w.answer === "no");
  const readiness = !allAnswered
    ? null
    : weaknesses.length === 0
      ? { line: "Ready to test", detail: "All seven questions answered Yes. Publish it, watch the real audience behavior — retention, clicks, comments, conversions — and let the test speak." }
      : hasNo
        ? { line: "Fix before you publish", detail: "At least one question is a No. Fix the weakest point first — the plan below is in priority order — then run the check again." }
        : { line: "Publishable — improve the weakest point next round", detail: "No hard failures, but some Partly answers are costing you. Publish, measure, and fix the top item below in the next version." };

  function setAnswer(i: number, a: Answer) {
    setAnswers((prev) => ({ ...prev, [i]: a }));
    setCopied(false);
  }

  async function copyPlan() {
    if (!readiness) return;
    const text =
      "MY PRODUCT-TO-PURCHASE IMPROVEMENT PLAN\n" +
      `Readiness: ${readiness.line}\n\n` +
      (weaknesses.length === 0
        ? "All seven evaluation questions answered Yes. Next: publish and test — compare retention, clicks, comments, conversions."
        : weaknesses
            .map(
              (w, n) =>
                `${n + 1}. [${w.answer === "no" ? "NO" : "PARTLY"}] ${w.q.question}\n   Diagnosis: ${w.q.if_weak}\n   Fix: ${w.q.fix}`
            )
            .join("\n\n")) +
      "\n\nThe loop: Diagnose \u2192 Improve ONE thing \u2192 Test. Educational self-check from the UltraVestra Product-to-Purchase Lab — not a prediction of sales or virality.";
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
      <p style={toolTitle}>🧪 The Product-to-Purchase Evaluator</p>
      <p style={toolSub}>
        Don&rsquo;t guess how your video is doing — diagnose it. Answer the seven questions honestly for the
        video you are about to publish. Partly counts: a polite Yes here costs you sales out there.
      </p>
      <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "#f0abfc", fontWeight: 700, letterSpacing: 0.4 }}>
        {SCORING_NOTE}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {EVALUATION.map((q, i) => (
          <div key={q.question} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: "#f3e8ff" }}>
                <span style={{ color: "#67e8f9" }}>{i + 1}.</span> {q.question}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {ANSWER_META.map((m) => (
                  <button
                    key={m.key}
                    style={answerBtn(m.accent, answers[i] === m.key)}
                    onClick={() => setAnswer(i, m.key)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "#ddd0ff" }}>{q.what_it_checks}</p>
          </div>
        ))}
      </div>

      {!allAnswered && (
        <p style={{ margin: "16px 0 0", fontSize: 14.5, color: "#ddd0ff" }}>
          {answeredCount} of {EVALUATION.length} answered — answer all seven to get your diagnosis and
          improvement plan.
        </p>
      )}

      {allAnswered && readiness && (
        <>
          <div style={{ ...card, marginTop: 20, border: "1px solid #e879f9", textAlign: "center", padding: "20px 22px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#f0abfc" }}>
              YOUR READINESS
            </p>
            <p className="wow-title" style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800 }}>{readiness.line}</p>
            <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>{readiness.detail}</p>
          </div>

          {weaknesses.length > 0 && (
            <>
              <p style={{ margin: "22px 0 10px", fontSize: 17, fontWeight: 800, color: "#f0abfc" }}>
                The diagnosis — every weak point, weakest first
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {weaknesses.map((w) => (
                  <div key={w.q.question} style={card}>
                    <p style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 800, color: "#f3e8ff" }}>
                      {w.q.question}{" "}
                      <span style={{ color: w.answer === "no" ? "#fb7185" : "#e879f9", fontSize: 13.5, letterSpacing: 1 }}>
                        — {w.answer === "no" ? "NO" : "PARTLY"}
                      </span>
                    </p>
                    <p style={{ margin: "0 0 6px", fontSize: 15, color: "#ddd0ff" }}>
                      <strong style={{ color: "#f0abfc" }}>If it stays weak:</strong> {w.q.if_weak}
                    </p>
                    <p style={{ margin: 0, fontSize: 15, color: "#f3e8ff" }}>
                      <strong style={{ color: "#67e8f9" }}>The fix:</strong> {w.q.fix}
                    </p>
                  </div>
                ))}
              </div>

              <p style={{ margin: "22px 0 10px", fontSize: 17, fontWeight: 800, color: "#f0abfc" }}>
                Your improvement plan
              </p>
              <ol style={{ margin: "0 0 4px", paddingLeft: 22, color: "#f3e8ff", fontSize: 15.5, display: "flex", flexDirection: "column", gap: 8 }}>
                {weaknesses.map((w) => (
                  <li key={w.q.question}>
                    <strong>{w.q.question}</strong> — {w.q.fix}
                  </li>
                ))}
              </ol>
            </>
          )}

          <p style={{ margin: "18px 0 0", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <button style={actionBtn} onClick={copyPlan}>{copied ? "Copied ✓" : "Copy my improvement plan"}</button>
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 14, color: "#ddd0ff" }}>
            Then follow the loop: <strong style={{ color: "#f3e8ff" }}>Diagnose → Improve ONE thing → Test.</strong>{" "}
            Change one thing, publish, and compare the real behavior before touching anything else.
          </p>
        </>
      )}
    </section>
  );
}
