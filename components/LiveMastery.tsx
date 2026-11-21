"use client";

import { useMemo, useState } from "react";
import { PILLARS, LIVE_CYCLE, LIVE_CYCLE_NOTE, HOST_CHECKLIST } from "@/lib/pillars";

/* THE LIVE MASTERY TOOLS — the interactive half of The Art of Human
 * Connection & Conversion. Three working tools driven by the Pillars
 * data (lib/pillars.ts): the Pillar Self-Diagnostic, the LIVE Cycle
 * Builder and the Host Checklist. Template-built and honestly labeled —
 * the tools arrange the system's own words and the creator's own
 * inputs; they invent nothing. */

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
const card: React.CSSProperties = {
  border: "1px solid #4c1d95", borderRadius: 14, padding: "14px 18px", background: "rgba(13,2,33,0.65)",
};
const actionBtn: React.CSSProperties = {
  padding: "12px 26px", borderRadius: 999, border: "none", cursor: "pointer",
  background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, fontSize: 15.5,
};
const rateBtn = (active: boolean): React.CSSProperties => ({
  width: 40, height: 40, borderRadius: 999, cursor: "pointer", fontWeight: 800, fontSize: 15,
  border: active ? "1px solid #e879f9" : "1px solid #4c1d95",
  background: active ? "linear-gradient(92deg, #a855f7, #d946ef)" : "rgba(13,2,33,0.65)",
  color: "#fff",
});

const PHASES: { key: "before" | "during" | "after"; title: string; items: string[] }[] = [
  { key: "before", title: "Before going LIVE", items: HOST_CHECKLIST.before },
  { key: "during", title: "During the LIVE", items: HOST_CHECKLIST.during },
  { key: "after", title: "After the LIVE", items: HOST_CHECKLIST.after },
];

export default function LiveMastery() {
  /* ---------- Pillar Self-Diagnostic ---------- */
  const [ratings, setRatings] = useState<(number | null)[]>(() => PILLARS.map(() => null));
  const ratedCount = ratings.filter((r) => r !== null).length;
  const diagnostic = useMemo(() => {
    if (ratedCount < PILLARS.length) return null;
    const scored = PILLARS.map((p, i) => ({ pillar: p, rating: ratings[i] as number, index: i }));
    const weakest = [...scored].sort((a, b) => a.rating - b.rating || a.index - b.index).slice(0, 2);
    const strongest = [...scored].sort((a, b) => b.rating - a.rating || a.index - b.index)[0];
    return { weakest, strongest };
  }, [ratings, ratedCount]);

  /* ---------- LIVE Cycle Builder ---------- */
  const [product, setProduct] = useState("");
  const [need, setNeed] = useState("");
  const [detail, setDetail] = useState("");
  const [question, setQuestion] = useState("");
  const [script, setScript] = useState<{ time: string; action: string; line: string }[] | null>(null);
  const [cycleNote, setCycleNote] = useState("");
  const [copied, setCopied] = useState(false);

  function buildCycle() {
    const p = product.trim() || "this product";
    const n = need.trim() || "a need your viewers actually have";
    const d = detail.trim() || "one detail you have verified about the product";
    const q = question.trim() || "the question viewers ask most";
    setScript([
      {
        time: LIVE_CYCLE[0].time, action: LIVE_CYCLE[0].action,
        line: `Welcome in! If ${n} sounds familiar, stay with me for the next sixty seconds — I'm going to show you something that speaks directly to it.`,
      },
      {
        time: LIVE_CYCLE[1].time, action: LIVE_CYCLE[1].action,
        line: `This is ${p}. It's on the table today because of exactly that need — let me show you what I mean.`,
      },
      {
        time: LIVE_CYCLE[2].time, action: LIVE_CYCLE[2].action,
        line: `Watch this. [Demonstrate ${p} — show it working, the key moment uncut.] See how it fits into a real routine? That's the part a feature list can't tell you.`,
      },
      {
        time: LIVE_CYCLE[3].time, action: LIVE_CYCLE[3].action,
        line: `A question I hear all the time: \u201c${q}\u201d Here's my honest answer — [answer only with what you can verify, and say plainly what you don't know].`,
      },
      {
        time: LIVE_CYCLE[4].time, action: LIVE_CYCLE[4].action,
        line: `One detail worth knowing about ${p}: ${d}. That's verified — you can check it yourself on the product page.`,
      },
      {
        time: LIVE_CYCLE[5].time, action: LIVE_CYCLE[5].action,
        line: `If this is something you've been looking for, tap the product link and explore all the details before deciding whether it's right for you. And if you're just joining — welcome in! We're looking at ${p}, and we start again.`,
      },
    ]);
    setCycleNote(
      `Cycle 2 — same product, new information: open on a different angle of ${n}, demonstrate a different moment of ${p}, answer the next most common question, and bring a second verified detail. Repeat the cycle with new information, demonstrations, and questions rather than repeating the same sales pitch.`
    );
    setCopied(false);
  }

  async function copyScript() {
    if (!script) return;
    const text = script.map((s) => `${s.time} — ${s.action}\n${s.line}`).join("\n\n") + `\n\n${cycleNote}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  /* ---------- Host Checklist ---------- */
  const [checks, setChecks] = useState<Record<string, boolean[]>>({
    before: HOST_CHECKLIST.before.map(() => false),
    during: HOST_CHECKLIST.during.map(() => false),
    after: HOST_CHECKLIST.after.map(() => false),
  });
  const totalChecked = PHASES.reduce((sum, ph) => sum + checks[ph.key].filter(Boolean).length, 0);
  const totalItems = PHASES.reduce((sum, ph) => sum + ph.items.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* PILLAR SELF-DIAGNOSTIC */}
      <section style={toolPanel}>
        <p style={toolTitle}>🪞 Pillar Self-Diagnostic</p>
        <p style={toolSub}>
          Rate yourself honestly on each of the 12 Pillars — 1 is &ldquo;not yet,&rdquo; 5 is &ldquo;this is who I am on
          camera.&rdquo; When all twelve are rated, the Diagnostic names your two growth pillars, each with its
          principle and one concrete practice focus drawn from the pillar itself.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {PILLARS.map((pillar, i) => (
            <div key={pillar.number} style={{ ...card, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, justifyContent: "space-between" }}>
              <div style={{ flex: "1 1 340px", minWidth: 240 }}>
                <p style={{ margin: "0 0 2px", fontSize: 15.5 }}>
                  <strong style={{ color: "#67e8f9" }}>{pillar.number}</strong>{" "}
                  <strong style={{ color: "#f0abfc" }}>{pillar.name}</strong>
                </p>
                <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>{pillar.diagnostic}</p>
              </div>
              <div style={{ display: "flex", gap: 7 }} role="radiogroup" aria-label={`Rate ${pillar.name}`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    style={rateBtn(ratings[i] === n)}
                    onClick={() => {
                      const next = [...ratings];
                      next[i] = n;
                      setRatings(next);
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...card, marginTop: 18 }}>
          {diagnostic === null ? (
            <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>
              {ratedCount} of {PILLARS.length} pillars rated — rate every pillar to see where your mastery grows next.
            </p>
          ) : (
            <>
              <p style={{ margin: "0 0 4px", fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#6ee7b7" }}>Your strength — {diagnostic.strongest.pillar.name} ({diagnostic.strongest.rating}/5).</strong>{" "}
                {diagnostic.strongest.pillar.principle} Keep leading from it.
              </p>
              <p style={{ margin: "14px 0 8px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>Your two growth pillars</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {diagnostic.weakest.map(({ pillar, rating }) => (
                  <div key={pillar.number}>
                    <p style={{ margin: "0 0 2px", fontSize: 15.5 }}>
                      <strong style={{ color: "#67e8f9" }}>{pillar.number} {pillar.name}</strong>{" "}
                      <span style={{ color: "#ddd0ff" }}>— rated {rating}/5</span>
                    </p>
                    <p style={{ margin: "0 0 2px", fontSize: 15, color: "#f3e8ff" }}>
                      <em>{pillar.principle}</em>
                    </p>
                    <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>
                      <strong style={{ color: "#f0abfc" }}>Practice focus:</strong> {pillar.practice}
                    </p>
                  </div>
                ))}
              </div>
              <p style={{ margin: "14px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
                Self-rated and template-built from the 12 Pillars — a mirror, not a measurement. Re-rate after a few LIVEs and watch the numbers move.
              </p>
            </>
          )}
        </div>
      </section>

      {/* LIVE CYCLE BUILDER */}
      <section style={toolPanel}>
        <p style={toolTitle}>🔁 LIVE Cycle Builder</p>
        <p style={toolSub}>
          The UltraVestra 60-second attention and conversion cycle, built around your product. Give it a product, the
          viewer need it serves, one verified detail, and one common question — it writes a host line for every segment.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <div>
            <label style={labelStyle} htmlFor="lm-product">Your product</label>
            <input id="lm-product" style={inputStyle} value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. this moisturizer" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="lm-need">The viewer need it serves</label>
            <input id="lm-need" style={inputStyle} value={need} onChange={(e) => setNeed(e.target.value)} placeholder="e.g. wanting a simpler morning routine" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="lm-detail">One verified product detail</label>
            <input id="lm-detail" style={inputStyle} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. it is fragrance-free, per the label" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="lm-question">One common viewer question</label>
            <input id="lm-question" style={inputStyle} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. How do I use it?" />
          </div>
        </div>
        <p style={{ margin: "18px 0 0" }}>
          <button style={actionBtn} onClick={buildCycle}>Build my 60-second cycle</button>
        </p>
        {script && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              {script.map((seg) => (
                <div key={seg.time} style={card}>
                  <p style={{ margin: "0 0 4px", fontSize: 14 }}>
                    <strong style={{ color: "#67e8f9" }}>{seg.time}</strong>{" "}
                    <span style={{ color: "#f0abfc", fontWeight: 700 }}>{seg.action}</span>
                  </p>
                  <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>&ldquo;{seg.line}&rdquo;</p>
                </div>
              ))}
            </div>
            <div style={{ ...card, marginTop: 14, border: "1px solid #e879f9" }}>
              <p style={{ margin: "0 0 4px", fontSize: 15.5, fontWeight: 800, color: "#f0abfc" }}>Then run it again — differently</p>
              <p style={{ margin: 0, fontSize: 15, color: "#f3e8ff" }}>{cycleNote}</p>
            </div>
            <p style={{ margin: "16px 0 0", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <button style={actionBtn} onClick={copyScript}>{copied ? "Copied ✓" : "Copy the cycle script"}</button>
              <span style={{ fontSize: 13.5, color: "#ddd0ff" }}>Template-built from the UltraVestra cycle — make it yours before you go LIVE.</span>
            </p>
          </>
        )}
        {!script && (
          <p style={{ margin: "14px 0 0", fontSize: 14, color: "#ddd0ff" }}>
            {LIVE_CYCLE_NOTE} Fill in what you know — blanks become honest placeholders, never invented claims.
          </p>
        )}
      </section>

      {/* HOST CHECKLIST */}
      <section style={toolPanel}>
        <p style={toolTitle}>🎙️ Host Checklist</p>
        <p style={toolSub}>
          The UltraVestra professional host checklist — before, during, and after every LIVE. Tick each item as you
          complete it; the counts keep you honest. {totalChecked} of {totalItems} done.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {PHASES.map((phase) => {
            const done = checks[phase.key].filter(Boolean).length;
            return (
              <div key={phase.key}>
                <p style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: "#f0abfc" }}>
                  {phase.title} <span style={{ color: "#67e8f9", fontSize: 14.5 }}>· {done} of {phase.items.length}</span>
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {phase.items.map((item, i) => (
                    <button
                      key={item}
                      onClick={() => {
                        const next = [...checks[phase.key]];
                        next[i] = !next[i];
                        setChecks({ ...checks, [phase.key]: next });
                      }}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left", cursor: "pointer",
                        border: checks[phase.key][i] ? "1px solid #e879f9" : "1px solid #4c1d95", borderRadius: 14,
                        padding: "12px 16px", background: checks[phase.key][i] ? "rgba(168,85,247,0.18)" : "rgba(13,2,33,0.65)",
                        color: "#f3e8ff", fontSize: 15.5,
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1.25, color: checks[phase.key][i] ? "#e879f9" : "#8b7bb8" }}>{checks[phase.key][i] ? "☑" : "☐"}</span>
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {totalChecked === totalItems && (
          <div style={{ ...card, marginTop: 18, textAlign: "center", padding: "20px 18px" }}>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#e879f9" }}>Every phase complete — host like it matters. It does. ✓</p>
          </div>
        )}
      </section>
    </div>
  );
}
