"use client";

import { useState } from "react";
import {
  PLATFORMS,
  VIDEO_TYPES,
  DROPOFF_POINTS,
  PRODUCT_TIMINGS,
  PROOF_OPTIONS,
  BENEFIT_OPTIONS,
  STAGES,
  GRADE_META,
  runAutopsy,
  ALL_STRONG_CHANGE,
  HONESTY_NOTE,
  type AutopsyInputs,
  type StageResult,
} from "@/lib/autopsy";

/* THE VIDEO AUTOPSY — UltraVestra's guided video analysis
 * experience. The creator walks their OWN video through six stages
 * — the Stop, the Hold, the Reveal & Demonstration, Understanding,
 * Proof & Trust, the Decision — answering honestly at each one. The
 * Autopsy grades every stage from those answers, orders the damage
 * weakest-first, and ends with ONE change for the next video plus a
 * re-film checklist. It is a guided self-analysis: it never claims
 * to have watched the video, and it never predicts virality.
 *
 * The quality gate matches the other labs: a vague audience
 * ("everyone") or an empty hook gets narrowing guidance and no
 * report — a verdict built on vague inputs would be a guess, and
 * UltraVestra doesn't guess. */

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
  padding: "12px 22px", borderRadius: 999, cursor: "pointer",
  border: "1px solid #4c1d95", background: "rgba(13,2,33,0.65)", color: "#ddd0ff", fontWeight: 700, fontSize: 15,
};
const label: React.CSSProperties = { display: "block", fontSize: 15, fontWeight: 800, color: "#f3e8ff", margin: "0 0 4px" };
const hint: React.CSSProperties = { fontSize: 13.5, color: "#ddd0ff", margin: "0 0 8px" };
const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 12,
  border: "1px solid #4c1d95", background: "rgba(13,2,33,0.85)", color: "#f3e8ff", fontSize: 15,
};
const stepTag: React.CSSProperties = {
  display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#67e8f9", margin: "0 0 6px",
};

/* The quality gate: an audience of "everyone" is no audience — the
 * same rule the other UltraVestra labs enforce. */
const VAGUE_WORDS = ["everyone", "anyone", "everybody", "people", "all", "anybody", "whoever"];
function isVagueAudience(v: string): boolean {
  const t = v.trim().toLowerCase();
  if (t.length < 4) return true;
  return VAGUE_WORDS.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(t));
}

const AUDIENCE_GUIDANCE =
  "UltraVestra never treats an audience as simply \u201ceverybody.\u201d A video made for everyone is made for no one — and an autopsy run for everyone diagnoses nothing. Narrow it to a recognizable person: who are they, and what are they trying to solve? For example, \u201cBeginners who want a simple skincare routine.\u201d Sharpen that one answer and run it again.";

type BlockReason = "hook" | "frame" | "audience" | null;

const BLOCK_COPY: Record<Exclude<BlockReason, null>, { title: string; body: string }> = {
  hook: {
    title: "The autopsy needs your exact first line",
    body: "Type the first words you actually say in the video — word for word, not what you meant to say. The opening is where the Autopsy starts, and a verdict built on a remembered hook would be a guess. If the video opens with no spoken line at all, type what appears on screen instead.",
  },
  frame: {
    title: "The autopsy needs your first frame",
    body: "Describe the very first thing on screen — before you speak, before anything moves. Frame one is what the scroll decides on. \u201cThe product already being used, close up\u201d is an answer; a blank description isn't.",
  },
  audience: {
    title: "Narrow the audience first",
    body: AUDIENCE_GUIDANCE,
  },
};

export default function VideoAutopsy() {
  const [inputs, setInputs] = useState<AutopsyInputs>({
    platform: PLATFORMS[0],
    videoType: VIDEO_TYPES[0],
    audience: "",
    hook: "",
    firstFrame: "",
    dropoff: DROPOFF_POINTS[0].key,
    productTiming: PRODUCT_TIMINGS[0].key,
    proof: PROOF_OPTIONS[0].key,
    benefits: BENEFIT_OPTIONS[0].key,
    cta: "",
  });
  const [blocked, setBlocked] = useState<BlockReason>(null);
  const [report, setReport] = useState<StageResult[] | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  function set<K extends keyof AutopsyInputs>(key: K, value: AutopsyInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setBlocked(null);
  }

  function run() {
    if (inputs.hook.trim().length < 3) return setBlocked("hook");
    if (!inputs.firstFrame.trim()) return setBlocked("frame");
    if (isVagueAudience(inputs.audience)) return setBlocked("audience");
    setBlocked(null);
    setChecked({});
    setCopied(false);
    setReport(runAutopsy(inputs));
  }

  function startOver() {
    setReport(null);
    setChecked({});
    setCopied(false);
    setBlocked(null);
  }

  const weakest = report && report[0].grade !== "strong" ? report[0] : null;
  const oneChange = report
    ? weakest
      ? { stageName: weakest.def.name, fix: weakest.def.first_fix, refilm: weakest.def.refilm }
      : { stageName: "No broken stage", fix: ALL_STRONG_CHANGE.fix, refilm: ALL_STRONG_CHANGE.refilm }
    : null;
  const refilmDone = oneChange ? oneChange.refilm.filter((_, i) => checked[`r${i}`]).length : 0;

  async function copyReport() {
    if (!report || !oneChange) return;
    const lines = report.map((r, n) => {
      const meta = GRADE_META[r.grade];
      return (
        `${n + 1}. [${meta.label}] ${r.def.name}\n` +
        `   From your answers: ${r.evidence}` +
        (r.cause ? `\n   Likely cause: ${r.cause}` : "") +
        (r.grade !== "strong" ? `\n   First fix: ${r.def.first_fix}` : "")
      );
    });
    const text =
      "MY VIDEO AUTOPSY — DIAGNOSIS REPORT\n" +
      `Platform: ${inputs.platform} · Type: ${inputs.videoType} · For: ${inputs.audience}\n` +
      `Hook: \u201c${inputs.hook}\u201d\n\n` +
      lines.join("\n\n") +
      `\n\nYOUR ONE CHANGE FOR THE NEXT VIDEO (${oneChange.stageName}):\n${oneChange.fix}\n\n` +
      "RE-FILM CHECKLIST:\n" +
      oneChange.refilm.map((r) => `☐ ${r}`).join("\n") +
      `\n\n${HONESTY_NOTE}\nUltraVestra Video Autopsy — guided self-analysis, not a prediction of virality or sales.`;
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
      <p style={toolTitle}>🔬 The Video Autopsy</p>
      <p style={toolSub}>
        Put one of your real videos on the table and walk it stage by stage — the stop, the hold, the reveal,
        the benefit, the proof, the decision. Answer honestly: the Autopsy can only find what your answers
        show it. Partly counts, and so does No.
      </p>
      <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "#f0abfc", fontWeight: 700, letterSpacing: 0.4 }}>
        {HONESTY_NOTE}
      </p>

      {!report && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <span style={stepTag}>STEP 1 — THE VIDEO</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <div>
                  <label style={label} htmlFor="ax-platform">Platform</label>
                  <select id="ax-platform" style={field} value={inputs.platform} onChange={(e) => set("platform", e.target.value)}>
                    {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label} htmlFor="ax-type">Video type</label>
                  <select id="ax-type" style={field} value={inputs.videoType} onChange={(e) => set("videoType", e.target.value)}>
                    {VIDEO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={label} htmlFor="ax-audience">Who is this video for?</label>
                <p style={hint}>One recognizable person, not a crowd. The human comes before the hook.</p>
                <input
                  id="ax-audience" style={field} value={inputs.audience}
                  onChange={(e) => set("audience", e.target.value)}
                  placeholder="e.g. Beginners who want a simple skincare routine"
                />
              </div>
            </div>

            <div>
              <span style={stepTag}>STEP 2 — THE STOP</span>
              <label style={label} htmlFor="ax-hook">Your exact first spoken line</label>
              <p style={hint}>Word for word — what you actually say first, not what you planned to say.</p>
              <input
                id="ax-hook" style={field} value={inputs.hook}
                onChange={(e) => set("hook", e.target.value)}
                placeholder="e.g. Still confused about which moisturizer to choose?"
              />
              <div style={{ marginTop: 12 }}>
                <label style={label} htmlFor="ax-frame">Your first frame</label>
                <p style={hint}>The very first thing on screen, before anything moves.</p>
                <input
                  id="ax-frame" style={field} value={inputs.firstFrame}
                  onChange={(e) => set("firstFrame", e.target.value)}
                  placeholder="e.g. The cream already being dispensed, close up"
                />
              </div>
            </div>

            <div>
              <span style={stepTag}>STEP 3 — WHERE THEY LEAVE</span>
              <label style={label} htmlFor="ax-dropoff">Where do viewers drop off?</label>
              <p style={hint}>Use your retention graph if you have one. If you don&rsquo;t, your honest best read is enough — this is an investigation, not a verdict.</p>
              <select id="ax-dropoff" style={field} value={inputs.dropoff} onChange={(e) => set("dropoff", e.target.value)}>
                {DROPOFF_POINTS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
            </div>

            <div>
              <span style={stepTag}>STEP 4 — THE PRODUCT & THE PROOF</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={label} htmlFor="ax-timing">When does the product first appear?</label>
                  <select id="ax-timing" style={field} value={inputs.productTiming} onChange={(e) => set("productTiming", e.target.value)}>
                    {PRODUCT_TIMINGS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label} htmlFor="ax-proof">Is there a proof moment?</label>
                  <select id="ax-proof" style={field} value={inputs.proof} onChange={(e) => set("proof", e.target.value)}>
                    {PROOF_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label} htmlFor="ax-benefits">Could a first-time viewer say what the product does for them?</label>
                  <select id="ax-benefits" style={field} value={inputs.benefits} onChange={(e) => set("benefits", e.target.value)}>
                    {BENEFIT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <span style={stepTag}>STEP 5 — THE DECISION</span>
              <label style={label} htmlFor="ax-cta">Your exact call to action</label>
              <p style={hint}>The last thing you ask the viewer to do. Leave it empty if the video just ends.</p>
              <input
                id="ax-cta" style={field} value={inputs.cta}
                onChange={(e) => set("cta", e.target.value)}
                placeholder="e.g. Check the size guide before you order — the fit runs small"
              />
            </div>
          </div>

          {blocked && (
            <div style={{ ...card, marginTop: 20, border: "1px solid #e879f9", padding: "18px 22px" }}>
              <p style={{ margin: "0 0 6px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>
                {BLOCK_COPY[blocked].title}
              </p>
              <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>{BLOCK_COPY[blocked].body}</p>
              <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
                This isn&rsquo;t an error — it&rsquo;s the quality gate. No report is issued on vague inputs.
              </p>
            </div>
          )}

          <p style={{ margin: "22px 0 0" }}>
            <button style={actionBtn} onClick={run}>Run the autopsy →</button>
          </p>
        </>
      )}

      {report && oneChange && (
        <>
          <div style={{ ...card, textAlign: "center", padding: "18px 22px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#f0abfc" }}>
              AUTOPSY OF YOUR {inputs.videoType.toUpperCase()} · {inputs.platform.toUpperCase()}
            </p>
            <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>
              For: <strong style={{ color: "#f3e8ff" }}>{inputs.audience}</strong> · Hook:{" "}
              <em style={{ color: "#f3e8ff" }}>&ldquo;{inputs.hook}&rdquo;</em>
            </p>
          </div>

          <p style={{ margin: "22px 0 10px", fontSize: 17, fontWeight: 800, color: "#f0abfc" }}>
            The diagnosis — every stage, weakest first
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {report.map((r, n) => {
              const meta = GRADE_META[r.grade];
              return (
                <div key={r.def.id} style={card}>
                  <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#f3e8ff" }}>
                    <span style={{ color: "#67e8f9" }}>{n + 1}.</span> {r.def.name}{" "}
                    <span style={{ color: meta.accent, fontSize: 13, letterSpacing: 1.5 }}>— {meta.label}</span>
                  </p>
                  <p style={{ margin: "0 0 6px", fontSize: 14.5, color: "#ddd0ff" }}>
                    <strong style={{ color: "#67e8f9" }}>Chain:</strong> {r.def.chain_stage}
                  </p>
                  <p style={{ margin: "0 0 6px", fontSize: 15, color: "#ddd0ff" }}>
                    <strong style={{ color: "#f0abfc" }}>From your answers:</strong> {r.evidence}
                  </p>
                  {r.cause && (
                    <p style={{ margin: "0 0 6px", fontSize: 15, color: "#ddd0ff" }}>
                      <strong style={{ color: "#f0abfc" }}>Likely cause:</strong> {r.cause}
                    </p>
                  )}
                  {r.grade !== "strong" && (
                    <p style={{ margin: 0, fontSize: 15, color: "#f3e8ff" }}>
                      <strong style={{ color: "#67e8f9" }}>First fix:</strong> {r.def.first_fix}
                    </p>
                  )}
                  {r.grade === "strong" && (
                    <p style={{ margin: 0, fontSize: 15, color: "#f3e8ff" }}>
                      <strong style={{ color: "#67e8f9" }}>Holding:</strong> this stage is doing its job — leave it alone and fix what is broken first.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ ...card, marginTop: 22, border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.35)", padding: "22px 24px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#f0abfc", textAlign: "center" }}>
              ⭐ YOUR ONE CHANGE FOR THE NEXT VIDEO
            </p>
            <p className="wow-title" style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 800, textAlign: "center" }}>
              {oneChange.stageName}
            </p>
            <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>{oneChange.fix}</p>
            <p style={{ margin: "12px 0 0", fontSize: 14.5, color: "#ddd0ff" }}>
              Change this one thing. Not two, not everything — if you change everything at once, you will
              never know what worked.
            </p>
          </div>

          <p style={{ margin: "22px 0 10px", fontSize: 17, fontWeight: 800, color: "#f0abfc" }}>
            Your re-film checklist — {refilmDone} of {oneChange.refilm.length}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {oneChange.refilm.map((item, i) => {
              const key = `r${i}`;
              const done = !!checked[key];
              return (
                <button
                  key={key}
                  onClick={() => setChecked((prev) => ({ ...prev, [key]: !prev[key] }))}
                  style={{
                    ...card, textAlign: "left", cursor: "pointer", width: "100%",
                    color: done ? "#ddd0ff" : "#f3e8ff", fontSize: 15,
                    textDecoration: done ? "line-through" : "none",
                  }}
                >
                  {done ? "☑" : "☐"} {item}
                </button>
              );
            })}
          </div>
          {refilmDone === oneChange.refilm.length && (
            <p style={{ margin: "14px 0 0", fontSize: 15.5, fontWeight: 800, color: "#67e8f9" }}>
              Autopsy complete — now apply one fix and re-film.
            </p>
          )}

          <p style={{ margin: "20px 0 0", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={actionBtn} onClick={copyReport}>{copied ? "Copied ✓" : "Copy my diagnosis report"}</button>
            <button style={ghostBtn} onClick={startOver}>Autopsy another video</button>
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 14, color: "#ddd0ff" }}>
            Then follow the loop: <strong style={{ color: "#f3e8ff" }}>Diagnose → Improve ONE thing → Test.</strong>{" "}
            Publish the new version and compare real behavior — retention, clicks, comments, conversions —
            before touching anything else.
          </p>
        </>
      )}
    </section>
  );
}
