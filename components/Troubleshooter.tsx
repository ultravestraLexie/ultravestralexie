"use client";

import { useState } from "react";
import Link from "next/link";
import { DIAGNOSES, HONESTY_NOTE } from "@/lib/frustrations";

/* WHY IS MY VIDEO NOT WORKING? — UltraVestra's signature
 * troubleshooter. The creator picks the symptom they're actually
 * experiencing; the tool teaches them how to investigate it —
 * what to examine, the concrete checks to run, and one first fix —
 * instead of handing down a verdict. A symptom can have more than
 * one cause, so the framing stays honest throughout: investigate
 * and compare before you conclude. */

const toolPanel: React.CSSProperties = {
  border: "1px solid #7e22ce", background: "rgba(26,8,54,0.78)", borderRadius: 22,
  padding: "24px 26px 26px", boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const toolTitle: React.CSSProperties = { fontSize: 23, margin: "0 0 6px", letterSpacing: 0.5, fontWeight: 800, color: "#f3e8ff" };
const toolSub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 16px", fontSize: 15 };
const card: React.CSSProperties = {
  border: "1px solid #4c1d95", borderRadius: 14, padding: "16px 20px", background: "rgba(13,2,33,0.65)",
};
const chipBtn = (active: boolean): React.CSSProperties => ({
  padding: "9px 15px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 14,
  border: active ? "1px solid #e879f9" : "1px solid #4c1d95",
  background: active ? "linear-gradient(92deg, #a855f7, #d946ef)" : "rgba(13,2,33,0.65)",
  color: "#fff", textAlign: "left",
});
const actionBtn: React.CSSProperties = {
  display: "inline-block", padding: "12px 26px", borderRadius: 999, border: "none", cursor: "pointer",
  background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, fontSize: 15.5,
  textDecoration: "none",
};

export default function Troubleshooter() {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);

  function pick(i: number) {
    setSelected(i);
    setChecked(DIAGNOSES[i].checks.map(() => false));
  }

  function toggleCheck(j: number) {
    setChecked((prev) => prev.map((v, k) => (k === j ? !v : v)));
  }

  const d = selected !== null ? DIAGNOSES[selected] : null;
  const doneCount = checked.filter(Boolean).length;

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🔬 The Troubleshooter</p>
      <p style={toolSub}>
        Pick the symptom you&rsquo;re actually experiencing. UltraVestra won&rsquo;t hand you a verdict —
        it will show you what to examine, the checks to run, and the first fix to try. Then you compare
        and decide.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {DIAGNOSES.map((diag, i) => (
          <button key={diag.symptom} style={chipBtn(selected === i)} onClick={() => pick(i)}>
            {diag.symptom}
          </button>
        ))}
      </div>

      {!d && (
        <p style={{ margin: "18px 0 0", fontSize: 14.5, color: "#ddd0ff" }}>
          Start with the symptom that matches your numbers — not the one that feels worst. Low views,
          early drop-off, clicks without purchases, and returns are four different problems with four
          different investigations.
        </p>
      )}

      {d && (
        <div style={{ ...card, marginTop: 20, border: "1px solid #e879f9" }}>
          <p style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800, color: "#f3e8ff" }}>{d.symptom}</p>
          <p style={{ margin: "0 0 16px", fontSize: 16, color: "#f0abfc", fontWeight: 700 }}>{d.examine}</p>

          <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#67e8f9", letterSpacing: 0.5 }}>
            RUN THESE CHECKS — {doneCount}/{d.checks.length} INVESTIGATED
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {d.checks.map((check, j) => (
              <label
                key={j}
                style={{
                  display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer",
                  fontSize: 15, color: checked[j] ? "#ddd0ff" : "#f3e8ff",
                  textDecoration: checked[j] ? "line-through" : "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!checked[j]}
                  onChange={() => toggleCheck(j)}
                  style={{ marginTop: 3, accentColor: "#d946ef", width: 16, height: 16, flexShrink: 0 }}
                />
                <span>{check}</span>
              </label>
            ))}
          </div>

          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#67e8f9", letterSpacing: 0.5 }}>
            YOUR FIRST FIX
          </p>
          <p style={{ margin: "0 0 18px", fontSize: 15.5, color: "#f3e8ff" }}>{d.first_fix}</p>

          <Link href={d.lab.href} style={actionBtn}>
            Go deeper: {d.lab.name} →
          </Link>
        </div>
      )}

      <p style={{ margin: "18px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>{HONESTY_NOTE}</p>
    </section>
  );
}
