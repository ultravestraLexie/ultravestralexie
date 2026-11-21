"use client";

import { useState } from "react";
import { PAIRS, CATEGORIES, INTRO_LINE } from "@/lib/beforeafter";

/* BEFORE-AND-AFTER CONTENT EXAMPLES — the paired-examples library.
 * Category filter chips, then pair cards: BEFORE (muted, rose
 * accent) and AFTER (cyan/green accent) side by side, the principle
 * named under each pair, and a "try it on yours" prompt the creator
 * can apply to their own last video immediately. Examples teach the
 * eye — this is a training tool, not an article. */

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "rgba(26,8,54,0.78)",
  borderRadius: 22,
  padding: "24px 26px 26px",
  boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const chipBtn = (active: boolean): React.CSSProperties => ({
  padding: "8px 18px",
  borderRadius: 999,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  border: active ? "1px solid #22d3ee" : "1px solid #4c1d95",
  background: active ? "#2e1065" : "rgba(13,2,33,0.65)",
  color: active ? "#67e8f9" : "#ddd0ff",
});
const beforeBox: React.CSSProperties = {
  border: "1px solid #9f1239",
  borderRadius: 14,
  padding: "16px 18px",
  background: "rgba(40,4,20,0.55)",
  flex: "1 1 260px",
};
const afterBox: React.CSSProperties = {
  border: "1px solid #22d3ee",
  borderRadius: 14,
  padding: "16px 18px",
  background: "rgba(4,32,44,0.55)",
  flex: "1 1 260px",
  boxShadow: "0 0 18px rgba(34,211,238,0.15)",
};
const beforeLabel: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 12.5,
  fontWeight: 800,
  letterSpacing: 1.5,
  color: "#fda4af",
};
const afterLabel: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 12.5,
  fontWeight: 800,
  letterSpacing: 1.5,
  color: "#67e8f9",
};
const versionText: React.CSSProperties = {
  margin: 0,
  fontSize: 15.5,
  lineHeight: 1.55,
  color: "#f3e8ff",
};

export function BeforeAfterLibrary() {
  const [active, setActive] = useState<string>("All");
  const shown = active === "All" ? PAIRS : PAIRS.filter((p) => p.category === active);

  return (
    <section style={panel}>
      <p style={{ color: "#f3e8ff", fontSize: 16.5, margin: "0 0 18px", lineHeight: 1.55 }}>
        {INTRO_LINE}
      </p>

      {/* Category filter */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} style={chipBtn(active === c)} onClick={() => setActive(c)}>
            {c}
            {c !== "All" && (
              <span style={{ opacity: 0.75, fontWeight: 600 }}>
                {" "}· {PAIRS.filter((p) => p.category === c).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <p style={{ color: "#ddd0ff", fontSize: 14, margin: "0 0 16px" }}>
        Showing {shown.length} of {PAIRS.length} pairs
        {active !== "All" ? ` in ${active}` : ""}. Read the BEFORE the way a viewer
        hears it — fast, skeptical, one thumb-move from leaving.
      </p>

      {/* Pair cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {shown.map((pair, i) => (
          <article
            key={`${pair.category}-${pair.before.slice(0, 24)}`}
            style={{
              border: "1px solid #4c1d95",
              borderRadius: 16,
              padding: "18px 20px 20px",
              background: "rgba(13,2,33,0.65)",
            }}
          >
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, letterSpacing: 1.5, color: "#f0abfc" }}>
              {pair.category.toUpperCase()} · PAIR {i + 1}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              <div style={beforeBox}>
                <p style={beforeLabel}>✕ BEFORE</p>
                <p style={versionText}>{pair.before}</p>
              </div>
              <div style={afterBox}>
                <p style={afterLabel}>✓ AFTER — STRONGER CONSTRUCTION</p>
                <p style={versionText}>{pair.after}</p>
              </div>
            </div>
            <p style={{ margin: "14px 0 0", fontSize: 15.5, color: "#f3e8ff", lineHeight: 1.55 }}>
              <strong style={{ color: "#f0abfc" }}>Why the after works: </strong>
              {pair.principle}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 15, color: "#ddd0ff", lineHeight: 1.55 }}>
              <strong style={{ color: "#67e8f9" }}>Try it on yours: </strong>
              {pair.try_it}
            </p>
          </article>
        ))}
      </div>

      <p style={{ color: "#ddd0ff", fontSize: 14.5, margin: "20px 0 0", lineHeight: 1.55 }}>
        The after is never a promised result — it is a stronger construction. Proof is
        something you film, not something you claim: same light, same conditions, honest
        limits stated out loud. That honesty is what makes the believable parts believable.
      </p>
    </section>
  );
}
