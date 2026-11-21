"use client";

import { useState } from "react";
import Link from "next/link";
import { CHALLENGES, DEPARTMENTS } from "@/lib/universe";

/* SOLVE MY PROBLEM — the core website experience of the Creator
 * Problem-Solving Universe, and the centerpiece of the homepage.
 * A creator does not start with a topic or a search term; they
 * start with the problem that is stopping them right now. They
 * pick their biggest challenge and immediately get a starting
 * point: the department that owns the problem, what that problem
 * actually is, three first steps, and one button — Explore my
 * solution. Start with a solution, not another generic tip. */

const panel: React.CSSProperties = {
  border: "1px solid #d946ef", background: "rgba(26,8,54,0.85)", borderRadius: 22,
  padding: "24px 26px 26px", boxShadow: "0 0 36px rgba(217,70,239,0.30)",
};
const cardBtn = (active: boolean): React.CSSProperties => ({
  textAlign: "left", cursor: "pointer", borderRadius: 18, padding: "18px 20px",
  border: active ? "1px solid #e879f9" : "1px solid #4c1d95",
  background: active ? "linear-gradient(160deg, rgba(88,28,135,0.85), rgba(26,8,54,0.9))" : "rgba(13,2,33,0.65)",
  boxShadow: active ? "0 0 26px rgba(217,70,239,0.35)" : "none",
  color: "#f3e8ff", width: "100%",
});
const actionBtn: React.CSSProperties = {
  display: "inline-block", padding: "13px 30px", borderRadius: 999, border: "none",
  background: "linear-gradient(92deg, #a855f7, #d946ef 55%, #22d3ee 130%)", color: "#fff",
  fontWeight: 800, fontSize: 16, textDecoration: "none",
  boxShadow: "0 0 28px rgba(217,70,239,0.55)",
};

export default function SolveMyProblem() {
  const [selected, setSelected] = useState(0);
  const challenge = CHALLENGES[selected];
  const department = DEPARTMENTS.find((d) => d.name === challenge.department);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <span
          style={{
            display: "inline-block", background: "#2e1a5e", color: "#c084fc",
            borderRadius: 999, padding: "4px 14px", fontSize: 13, fontWeight: 700, letterSpacing: 2,
          }}
        >
          SOLVE MY PROBLEM
        </span>
        <h2 className="wow-title" style={{ fontSize: 38, margin: "14px 0 8px", fontWeight: 800 }}>
          What&rsquo;s stopping you right now?
        </h2>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 16.5 }}>
          Choose your biggest challenge. Start with a solution, not another generic tip.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {CHALLENGES.map((c, i) => (
          <button key={c.challenge} style={cardBtn(i === selected)} onClick={() => setSelected(i)}>
            <span style={{ display: "block", fontSize: 18.5, fontWeight: 800, lineHeight: 1.3 }}>
              {c.challenge}
            </span>
            <span style={{ display: "block", marginTop: 6, fontSize: 14.5, color: i === selected ? "#f0abfc" : "#b3a6e0" }}>
              {c.subline}
            </span>
          </button>
        ))}
      </div>

      <div style={{ ...panel, marginTop: 20 }}>
        <p
          style={{
            margin: "0 0 4px", fontSize: 12.5, fontWeight: 800, letterSpacing: 2.5, color: "#67e8f9",
          }}
        >
          YOUR STARTING POINT
        </p>
        <p style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, letterSpacing: 0.5 }}>
          {challenge.department}
        </p>
        {department && (
          <p style={{ margin: "0 0 16px", fontSize: 15.5, color: "#ddd0ff", fontStyle: "italic" }}>
            &ldquo;{department.problem}&rdquo;
          </p>
        )}
        <ol
          style={{
            margin: "0 0 20px", paddingLeft: 22, display: "flex", flexDirection: "column",
            gap: 8, fontSize: 15.5, color: "#f3e8ff", lineHeight: 1.5,
          }}
        >
          {challenge.first_steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <Link href={challenge.href} style={actionBtn}>
          Explore my solution →
        </Link>
      </div>
    </div>
  );
}
