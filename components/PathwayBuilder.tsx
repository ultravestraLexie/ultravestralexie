"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FRUSTRATIONS } from "@/lib/frustrations";
import {
  LEVELS,
  PLATFORMS,
  TIME_OPTIONS,
  buildPathway,
  pathwayToText,
  PATHWAY_HONESTY,
  PATHWAY_CLOSING,
  type LevelId,
  type TimeId,
} from "@/lib/pathway";

/* THE PERSONAL PATHWAY BUILDER — UltraVestra's answer to
 * "everybody gives different advice." The creator answers four
 * questions — frustration, platform, level, honest time — and
 * gets a sequenced four-week plan on the six-step method, every
 * action linked to the real tool that does it, every week closed
 * by one measurable checkpoint. Not an article to read once:
 * a plan to work, tick off, and adjust as their own numbers
 * come in. */

const toolPanel: React.CSSProperties = {
  border: "1px solid #7e22ce", background: "rgba(26,8,54,0.78)", borderRadius: 22,
  padding: "24px 26px 26px", boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const toolTitle: React.CSSProperties = { fontSize: 23, margin: "0 0 6px", letterSpacing: 0.5, fontWeight: 800, color: "#f3e8ff" };
const toolSub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 16px", fontSize: 15 };
const card: React.CSSProperties = {
  border: "1px solid #4c1d95", borderRadius: 14, padding: "16px 20px", background: "rgba(13,2,33,0.65)",
};
const stepLabel: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 700, letterSpacing: 2, color: "#67e8f9", margin: "0 0 10px",
};
const chipBtn = (active: boolean): React.CSSProperties => ({
  padding: "9px 15px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 14,
  border: active ? "1px solid #e879f9" : "1px solid #4c1d95",
  background: active ? "linear-gradient(92deg, #a855f7, #d946ef)" : "rgba(13,2,33,0.65)",
  color: "#fff", textAlign: "left",
});
const frustBtn = (active: boolean): React.CSSProperties => ({
  padding: "12px 16px", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 14.5,
  border: active ? "1px solid #e879f9" : "1px solid #4c1d95",
  background: active ? "linear-gradient(92deg, rgba(168,85,247,0.85), rgba(217,70,239,0.85))" : "rgba(13,2,33,0.65)",
  color: "#fff", textAlign: "left", lineHeight: 1.35,
});
const actionBtn: React.CSSProperties = {
  display: "inline-block", padding: "12px 26px", borderRadius: 999, border: "none", cursor: "pointer",
  background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, fontSize: 15.5,
  textDecoration: "none",
};
const toolLink: React.CSSProperties = { color: "#67e8f9", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" };

export default function PathwayBuilder() {
  const [frustrationN, setFrustrationN] = useState<number | null>(null);
  const [platform, setPlatform] = useState<string>("TikTok");
  const [level, setLevel] = useState<LevelId>("stuck");
  const [time, setTime] = useState<TimeId>("mid");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const pathway = useMemo(
    () =>
      frustrationN === null
        ? null
        : buildPathway({ frustrationN, platform, level, time }),
    [frustrationN, platform, level, time],
  );

  const totalActions = pathway ? pathway.weeks.reduce((n, w) => n + w.actions.length, 0) : 0;
  const doneCount = pathway
    ? pathway.weeks.reduce(
        (n, w, wi) => n + w.actions.filter((_, ai) => done[`${wi}-${ai}`]).length,
        0,
      )
    : 0;

  function toggle(wi: number, ai: number) {
    const key = `${wi}-${ai}`;
    setDone((prev) => ({ ...prev, [key]: !prev[key] }));
    setCopied(false);
  }

  async function copyPathway() {
    if (!pathway) return;
    try {
      await navigator.clipboard.writeText(pathwayToText(pathway));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* STEP 1 — THE FRUSTRATION */}
      <section style={toolPanel}>
        <p style={stepLabel}>STEP 1 · IDENTIFY</p>
        <p style={toolTitle}>What is your #1 frustration right now?</p>
        <p style={toolSub}>
          Pick the one that costs you the most. The pathway attacks one problem properly instead of
          twelve problems lightly — you can build another pathway when this one is done.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
          {FRUSTRATIONS.map((f) => (
            <button key={f.n} type="button" style={frustBtn(frustrationN === f.n)} onClick={() => { setFrustrationN(f.n); setDone({}); setCopied(false); }}>
              {f.title}
              <span style={{ display: "block", fontWeight: 400, fontSize: 13, color: "#e9d5ff", marginTop: 4 }}>
                &ldquo;{f.quote}&rdquo;
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* STEPS 2–4 — PLATFORM, LEVEL, TIME */}
      <section style={toolPanel}>
        <p style={stepLabel}>STEPS 2–4 · YOUR CONTEXT</p>
        <p style={toolTitle}>Where you create, where you are, and the time you honestly have</p>
        <p style={toolSub}>
          A plan that assumes ten free hours dies by Wednesday. Tell the truth here — the pathway
          sizes itself to your real week.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 15, color: "#f3e8ff" }}>My main platform</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PLATFORMS.map((p) => (
                <button key={p} type="button" style={chipBtn(platform === p)} onClick={() => setPlatform(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 15, color: "#f3e8ff" }}>Where I am</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LEVELS.map((l) => (
                <button key={l.id} type="button" style={chipBtn(level === l.id)} onClick={() => setLevel(l.id)}>{l.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 15, color: "#f3e8ff" }}>Time I can give it each week</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TIME_OPTIONS.map((t) => (
                <button key={t.id} type="button" style={chipBtn(time === t.id)} onClick={() => setTime(t.id)}>{t.label}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* THE PATHWAY */}
      {pathway === null ? (
        <section style={{ ...toolPanel, textAlign: "center" }}>
          <p style={{ ...toolTitle, margin: "0 0 6px" }}>Your pathway appears here</p>
          <p style={{ ...toolSub, margin: 0 }}>
            Choose your #1 frustration above — the four weeks build themselves around it.
          </p>
        </section>
      ) : (
        <>
          <section style={{ ...toolPanel, border: "1px solid #22d3ee", boxShadow: "0 0 40px rgba(34,211,238,0.25)" }}>
            <p style={stepLabel}>YOUR STARTING POINT</p>
            <p style={{ ...toolTitle, fontSize: 26 }}>{pathway.frustrationTitle}</p>
            <p style={{ color: "#f0abfc", fontSize: 17, fontWeight: 700, margin: "0 0 10px" }}>
              &ldquo;{pathway.frustrationQuote}&rdquo;
            </p>
            <p style={{ color: "#f3e8ff", fontSize: 15.5, margin: "0 0 12px" }}>{pathway.need}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 15, color: "#ddd0ff" }}>
              <p style={{ margin: 0 }}>
                <strong style={{ color: "#f3e8ff" }}>Department:</strong>{" "}
                <Link href={pathway.departmentHref} style={toolLink}>{pathway.department}</Link>
                {pathway.worldName ? <> · {pathway.worldName}</> : null}
              </p>
              <p style={{ margin: 0 }}><strong style={{ color: "#f3e8ff" }}>Platform — {pathway.platform}:</strong> {pathway.platformLine}</p>
              <p style={{ margin: 0 }}><strong style={{ color: "#f3e8ff" }}>Level — {pathway.levelLabel}:</strong> {pathway.levelNote}</p>
              <p style={{ margin: 0 }}><strong style={{ color: "#f3e8ff" }}>Pace — {pathway.timeLabel} a week:</strong> {pathway.pace}</p>
            </div>
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <button type="button" style={actionBtn} onClick={copyPathway}>
                {copied ? "Copied ✓ — take it with you" : "Copy my pathway"}
              </button>
              <span style={{ fontSize: 14.5, color: "#ddd0ff", fontWeight: 700 }}>
                Progress: {doneCount} of {totalActions} actions done
              </span>
            </div>
            <div style={{ marginTop: 12, height: 10, borderRadius: 999, background: "rgba(76,29,149,0.5)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 999,
                width: totalActions ? `${Math.round((doneCount / totalActions) * 100)}%` : "0%",
                background: "linear-gradient(92deg, #22d3ee, #a855f7, #d946ef)",
                transition: "width 0.3s ease",
              }} />
            </div>
          </section>

          {pathway.weeks.map((week, wi) => (
            <section key={week.week} style={toolPanel}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
                <span className="wow-title" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>
                  WEEK {week.week}
                </span>
                <span style={{ background: "#082f3f", color: "#67e8f9", border: "1px solid #22d3ee", borderRadius: 999, padding: "4px 14px", fontSize: 12.5, fontWeight: 700, letterSpacing: 1.5 }}>
                  {week.methodStep.toUpperCase()}
                </span>
              </div>
              <p style={{ color: "#f3e8ff", fontSize: 19, fontWeight: 800, margin: "12px 0 4px" }}>{week.focus}</p>
              <p style={{ color: "#ddd0ff", fontSize: 14.5, margin: "0 0 16px", fontStyle: "italic" }}>{week.methodLine}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {week.actions.map((act, ai) => {
                  const isDone = !!done[`${wi}-${ai}`];
                  return (
                    <div key={ai} style={{ ...card, display: "flex", gap: 14, alignItems: "flex-start", opacity: isDone ? 0.72 : 1 }}>
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggle(wi, ai)}
                        aria-label={`Mark done: ${act.text}`}
                        style={{ marginTop: 4, width: 19, height: 19, accentColor: "#d946ef", cursor: "pointer", flexShrink: 0 }}
                      />
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: 15.5, color: "#f3e8ff", textDecoration: isDone ? "line-through" : "none" }}>
                          {act.text}
                        </p>
                        <Link href={act.href} style={toolLink}>→ {act.tool}</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, border: "1px solid #22d3ee", borderRadius: 14, padding: "14px 18px", background: "rgba(8,47,63,0.45)" }}>
                <p style={{ margin: 0, fontSize: 15, color: "#f3e8ff" }}>
                  <strong style={{ color: "#67e8f9" }}>Measure improvement:</strong> {week.checkpoint}
                </p>
              </div>
            </section>
          ))}

          <section style={{ ...toolPanel, textAlign: "center" }}>
            <p style={{ color: "#ddd0ff", fontSize: 15.5, margin: "0 auto 14px", maxWidth: 680 }}>{PATHWAY_HONESTY}</p>
            <button type="button" style={actionBtn} onClick={copyPathway}>
              {copied ? "Copied ✓ — take it with you" : "Copy my pathway"}
            </button>
            <p className="wow-title" style={{ fontSize: 26, fontWeight: 800, margin: "22px auto 0", maxWidth: 640 }}>
              {PATHWAY_CLOSING}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
