"use client";

import { useMemo, useState } from "react";
import { LESSONS } from "@/lib/academy";

/* Creator Academy search — filters the lesson library as you type,
 * by title, category and lesson content. */

const CATEGORIES = ["All", "Hooks", "Scripts", "Filming", "Pitching", "Money", "Growth"] as const;

export default function AcademySearch({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const results = useMemo(() => {
    const tokens = q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 3);
    return LESSONS.filter((l) => {
      if (cat !== "All" && l.category !== cat) return false;
      if (!tokens.length) return true;
      const hay = `${l.title} ${l.category} ${l.summary} ${l.points.join(" ")}`.toLowerCase();
      return tokens.some((t) => hay.includes(t));
    });
  }, [q, cat]);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search lessons… hooks, scripts, filming, rates"
          style={{ width: 440, maxWidth: "88vw", padding: "13px 18px", borderRadius: 999, border: "1px solid #a855f7", background: "rgba(10,5,28,0.85)", fontSize: 16 }}
        />
      </div>
      <p style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", margin: "16px 0 24px" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            style={{
              padding: "8px 18px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 14.5,
              border: cat === c ? "1px solid #e879f9" : "1px solid #4c1d95",
              background: cat === c ? "linear-gradient(92deg, #a855f7, #d946ef)" : "rgba(27,18,61,0.7)",
              color: "#fff",
            }}
          >
            {c}
          </button>
        ))}
      </p>
      <p style={{ color: "#ddd0ff", textAlign: "center", margin: "0 0 18px" }}>{results.length} lesson{results.length === 1 ? "" : "s"}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {results.map((l) => (
          <article key={l.id} style={{ border: "1px solid #4c1d95", borderRadius: 18, padding: "18px 20px", background: "rgba(13,2,33,0.65)" }}>
            <p style={{ margin: "0 0 5px", display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 19, fontWeight: 800 }}>{l.title}</span>
              <span style={{ border: "1px solid #22d3ee", color: "#67e8f9", borderRadius: 999, padding: "2px 11px", fontWeight: 700, fontSize: 12.5 }}>{l.category}</span>
              <span style={{ color: "#a1a1aa", fontSize: 13 }}>{l.minutes} min read</span>
            </p>
            <p style={{ margin: "0 0 10px", color: "#ddd0ff", fontSize: 15 }}>{l.summary}</p>
            {openId === l.id ? (
              <>
                <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15, display: "flex", flexDirection: "column", gap: 7 }}>
                  {l.points.map((p) => (<li key={p}>{p}</li>))}
                </ul>
                <button type="button" onClick={() => setOpenId(null)} style={{ background: "transparent", border: "1px solid #4c1d95", color: "#e9d5ff", borderRadius: 999, padding: "7px 16px", fontWeight: 700, cursor: "pointer" }}>Close lesson</button>
              </>
            ) : (
              <button type="button" onClick={() => setOpenId(l.id)} className="neon-btn" style={{ background: "linear-gradient(92deg, #a855f7, #d946ef)", border: "none", color: "#fff", borderRadius: 999, padding: "8px 18px", fontWeight: 700, cursor: "pointer" }}>Read the lesson →</button>
            )}
          </article>
        ))}
        {results.length === 0 && <p style={{ color: "#f0abfc", textAlign: "center" }}>No lessons match those words yet. Try “hooks”, “pitch” or “rates”.</p>}
      </div>
    </div>
  );
}
