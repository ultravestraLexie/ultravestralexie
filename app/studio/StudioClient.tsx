"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EMPTY_VIDEO,
  MAX_SECONDS,
  MIN_WORDS,
  REHEARSE,
  SAMPLE_VIDEO,
  STAGE_STATE,
  STRONG,
  STUDIO_STAGES,
  STORAGE_KEY,
  TARGET,
  analyzeScript,
  deliveryPlan,
  emphasisParts,
  plural,
  publishItems,
  suggestCaption,
  type StudioStageState,
  type StudioVideo,
} from "@/lib/galaxy/studio";
import { fmtDate } from "@/lib/galaxy/core";
import { Icon, copyText, toast } from "@/components/galaxy/ui";

/* STUDIO client — the Video Studio (owner's reference design,
 * 2026-11-23): five stages (Idea / Script / Analyze / Rehearse /
 * Publish) with a readiness bar and an "Up next" card. The stage
 * logic and the on-device 5-score check live in lib/galaxy/studio
 * (a faithful port of his component); drafts autosave to this
 * device only (localStorage "uv-studio-draft").
 *
 * BUYER BRAIN V3 — untouched: the Analyze stage also carries the
 * full five-buyer read exactly as before. "Get the full Buyer
 * Brain read" POSTs the video to /api/creator-lab — the existing
 * Buyer Brain V3 endpoint the Creator Lab uses (request {product,
 * audience, price, script, stage}; response {success, report}) —
 * and renders its report when it returns. Running the on-device
 * analysis also saves the check via POST /api/studio (the
 * script_analyses history), with the same payload keys as before.
 * V3 internals are not touched. */

type FullPersona = {
  name: string;
  firstReaction: string;
  innerThought: string;
  interestScore: number;
  trustScore: number;
  desireScore: number;
  biggestObjection: string;
  improvement: string;
  outcome: string;
};
type FullReport = {
  overallAnalysis: string;
  buyerSummary: string;
  personas: FullPersona[];
  biggestConversionBarrier: string;
  strongestElement: string;
  improvedHook: string;
  finalAdvice: string;
  headlineFraming?: string;
  topImprovements?: { title?: string; detail?: string; improvement?: string }[];
};

type Recent = { id: string; product: string; firstLine: string; passed: number; total: number; date: string };

const OUTCOME_LABEL: Record<string, string> = {
  likely_to_continue: "Likely to keep watching",
  needs_more_information: "Needs more information",
  likely_to_leave: "Likely to leave",
  considering_purchase: "Considering purchase",
};

/* His stage icons (Lucide-style, inline). */
const STAGE_ICON: Record<string, string> = {
  idea:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  script:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a1 1 0 0 1 3 3L12.4 14.6a2 2 0 0 1-.9.5l-2.9.8a.5.5 0 0 1-.6-.6l.8-2.9a2 2 0 0 1 .5-.9z"/></svg>',
  analyze:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/></svg>',
  rehearse:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>',
  publish:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 21.7a.5.5 0 0 0 .9 0l6.5-19a.5.5 0 0 0-.6-.6l-19 6.5a.5.5 0 0 0 0 .9l7.9 3.2a2 2 0 0 1 1.1 1.1z"/><path d="m21.9 2.1-11 11"/></svg>',
};

const PINK = "#e879f9";

function statePill(state: StudioStageState) {
  const tone = STAGE_STATE[state];
  return (
    <span
      className="gx-pill"
      style={{
        color: tone.color,
        background: `${tone.color}24`,
        boxShadow: `inset 0 0 0 1px ${tone.color}55`,
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 6, height: 6, borderRadius: "50%", background: tone.color }}
      />
      {tone.label}
    </span>
  );
}

export default function StudioClient({
  defaultAudience,
  recent,
}: {
  defaultAudience: string;
  recent: Recent[];
}) {
  const router = useRouter();
  const [v, setV] = useState<StudioVideo>({ ...EMPTY_VIDEO, audience: defaultAudience });
  const [open, setOpen] = useState<string | null>(null);
  const firstSave = useRef(true);
  const [postReady, setPostReady] = useState(false);

  /* Buyer Brain V3 full read — state and behavior unchanged. */
  const [full, setFull] = useState<FullReport | null>(null);
  const [fullBusy, setFullBusy] = useState(false);
  const [fullError, setFullError] = useState<string | null>(null);

  // Restore the saved draft on mount (device-only, per his spec).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as
        | Partial<StudioVideo>
        | null;
      if (saved) setV({ ...EMPTY_VIDEO, ...saved });
    } catch {
      /* no readable draft — start from the seeded state */
    }
  }, []);

  // Autosave the draft on every change (the first run is the
  // mount itself, so a restored draft is never clobbered early).
  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    } catch {
      /* storage unavailable — the draft lives in this session */
    }
  }, [v]);

  const set = (patch: Partial<StudioVideo>) => setV((p) => ({ ...p, ...patch }));
  const toggle = (group: "rehearsed" | "published", key: string) =>
    setV((p) => ({ ...p, [group]: { ...p[group], [key]: !p[group][key] } }));

  const a = useMemo(() => analyzeScript(v), [v]);
  const stages = STUDIO_STAGES.map((s) => ({ ...s, ...s.build(v, a) }));
  const doneCount = stages.filter((s) => s.state === "done").length;
  const next = stages.find((s) => s.state !== "done" && s.state !== "wait");

  const go = (key: string) => {
    setOpen(key);
    requestAnimationFrame(() => {
      const el = document.getElementById(`vs-stage-${key}`);
      const calm =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (el) el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    });
  };

  const reset = () => {
    const hasWork = v.script || v.audience || v.feeling || v.product;
    if (hasWork && !window.confirm("Start a new video? This clears the current draft."))
      return;
    setV(EMPTY_VIDEO);
    setOpen(null);
    setPostReady(false);
    setFull(null);
    setFullError(null);
  };

  /* His onAction("analyze", { video, report }): the check is
   * saved to the script_analyses history via /api/studio with the
   * same payload keys the old form used (passed/total now count
   * the checks at STRONG out of the five scores; the local buyer
   * reactions are gone — the Buyer Brain read below is the buyer
   * read now), then the Analyze stage opens. */
  async function onAnalyze() {
    setFull(null);
    setFullError(null);
    try {
      const res = await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: v.audience,
          feel: v.feeling,
          product: v.product,
          price: v.price,
          script: v.script,
          passed: a.checks.filter((c) => c.score >= STRONG).length,
          total: a.checks.length,
          checks: a.checks.map((c) => ({
            id: c.key,
            name: c.label,
            pass: c.score >= STRONG,
            note: c.fix ?? "Strong.",
            fix: c.fix ?? "",
          })),
          buyers: [],
        }),
      });
      if (res.ok) router.refresh();
    } catch {
      /* saving the history is best-effort; the result stands */
    }
    go("analyze");
  }

  /* The full Buyer Brain V3 read — request, response handling and
   * rendering exactly as they were; only the form source is the
   * studio video now. */
  async function fullRead() {
    setFullBusy(true);
    setFullError(null);
    try {
      const res = await fetch("/api/creator-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: v.product || "the product in this video",
          audience: v.audience || "the viewer this video is for",
          price: v.price ? `$${v.price}` : "Not provided",
          script: v.script,
          stage: "curious",
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; report?: FullReport; error?: string }
        | null;
      if (res.ok && data?.success && data.report) {
        setFull(data.report);
      } else {
        setFullError(
          data?.error ??
            "The full read could not be completed right now. Your instant checks above still stand."
        );
      }
    } catch {
      setFullError("The full read could not be completed right now. Your instant checks above still stand.");
    }
    setFullBusy(false);
  }

  const buyerBrainBlock = (
    <div style={{ marginTop: 22, borderTop: "1px solid var(--line)", paddingTop: 18 }}>
      <h3 style={{ fontSize: 14.5, margin: "0 0 6px" }}>Full Buyer Brain read</h3>
      <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.45 }}>
        The quick checks above run on your device. The full read runs your script past
        five buyers on the server.
      </p>
      <button type="button" className="gx-btn" disabled={fullBusy} onClick={() => void fullRead()}>
        {fullBusy ? "Running the full Buyer Brain read…" : "Get the full Buyer Brain read"}
      </button>
      {fullError ? (
        <p style={{ color: "#FFB6C4", fontSize: 14, marginTop: 12 }}>{fullError}</p>
      ) : null}
      {full ? (
        <div style={{ marginTop: 16 }}>
          {full.headlineFraming ? (
            <p style={{ fontWeight: 600, fontSize: 16, margin: "0 0 8px" }}>{full.headlineFraming}</p>
          ) : null}
          <p style={{ color: "var(--ink-2)", margin: "0 0 14px" }}>{full.overallAnalysis}</p>
          <div style={{ display: "grid", gap: 10 }}>
            {full.personas.map((bp) => (
              <div key={bp.name} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid var(--line)", background: "rgba(255,255,255,.03)" }}>
                <b style={{ fontSize: 14.5 }}>
                  {bp.name}{" "}
                  <span className="gx-pill" style={{ marginLeft: 6 }}>
                    {OUTCOME_LABEL[bp.outcome] ?? bp.outcome}
                  </span>
                </b>
                <p style={{ margin: "6px 0 0", color: "var(--ink-2)", fontSize: 13.5, fontStyle: "italic" }}>
                  “{bp.firstReaction}”
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 13.5 }}>
                  Interest {bp.interestScore}/10 · Trust {bp.trustScore}/10 · Desire {bp.desireScore}/10
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--ink-2)" }}>
                  Biggest objection: {bp.biggestObjection}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--ink-2)" }}>
                  Fix: {bp.improvement}
                </p>
              </div>
            ))}
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 14 }}>
            <strong>Biggest barrier:</strong> {full.biggestConversionBarrier}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 14 }}>
            <strong>Strongest element:</strong> {full.strongestElement}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 14 }}>
            <strong>Improved hook:</strong> {full.improvedHook}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ink-2)" }}>{full.finalAdvice}</p>
        </div>
      ) : null}
    </div>
  );

  const checklist = (
    items: { key: string; label: string; done: boolean; locked?: boolean; note?: string }[],
    onToggle: (key: string) => void
  ) => (
    <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it) => (
        <li key={it.key}>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: 12,
              borderRadius: 14,
              background: "rgba(255,255,255,.04)",
              cursor: it.locked ? "default" : "pointer",
              fontSize: 14.5,
              lineHeight: 1.4,
            }}
          >
            <input
              type="checkbox"
              checked={!!it.done}
              disabled={!!it.locked}
              onChange={() => onToggle(it.key)}
              style={{ flex: "none", width: 20, height: 20, margin: 0, accentColor: "#d946ef" }}
            />
            <span style={it.done ? { color: "var(--ink-3)" } : undefined}>
              {it.label}
              {it.note ? (
                <em
                  style={{
                    display: "block",
                    marginTop: 2,
                    fontSize: 12,
                    fontStyle: "normal",
                    color: it.done ? "var(--good)" : "var(--ink-3)",
                  }}
                >
                  {it.note}
                </em>
              ) : null}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );

  const panel = (s: (typeof stages)[number]) => {
    if (s.state === "wait")
      return (
        <>
          <p style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--ink-3)", margin: 0 }}>
            Write at least {MIN_WORDS} words in your script first. This step fills in from it.
          </p>
          <button type="button" className="gx-btn gx-btn-sm" style={{ marginTop: 12 }} onClick={() => go("script")}>
            Go to Script →
          </button>
        </>
      );
    if (s.key === "idea")
      return (
        <>
          <p style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--ink-3)", margin: 0 }}>
            Human first: who is this for, and what should they walk away with?
          </p>
          <label className="gx-field">
            <span>Who is this video for?</span>
            <input className="gx-input" value={v.audience} onChange={(e) => set({ audience: e.target.value })} placeholder="Busy moms who skip skincare" />
          </label>
          <label className="gx-field">
            <span>What should they feel or get by the end?</span>
            <input className="gx-input" value={v.feeling} onChange={(e) => set({ feeling: e.target.value })} placeholder="Relief that this takes 30 seconds" />
          </label>
          <div className="gx-row2">
            <label className="gx-field">
              <span>Product</span>
              <input className="gx-input" value={v.product} onChange={(e) => set({ product: e.target.value })} placeholder="Glow Serum" />
            </label>
            <label className="gx-field">
              <span>Price ($)</span>
              <input className="gx-input" inputMode="decimal" value={v.price} onChange={(e) => set({ price: e.target.value })} placeholder="28" />
            </label>
          </div>
        </>
      );
    if (s.key === "script") {
      const scale = MAX_SECONDS + 15;
      const pct = (sec: number) => `${Math.min(100, (sec / scale) * 100)}%`;
      const inRange = a.secs >= TARGET[0] && a.secs <= TARGET[1];
      return (
        <>
          <label className="gx-field" style={{ marginTop: 0 }}>
            <span>Your working script</span>
          </label>
          <p style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--ink-3)", margin: "6px 0 0" }}>
            Write it the way you&apos;ll say it on camera.
          </p>
          <textarea
            className="gx-input"
            rows={9}
            style={{ marginTop: 10, minHeight: 200, resize: "vertical", lineHeight: 1.5 }}
            placeholder="If you skip skincare because you're busy, this is for you…"
            value={v.script}
            onChange={(e) => set({ script: e.target.value })}
          />
          <div
            aria-hidden="true"
            style={{ position: "relative", height: 8, marginTop: 12, borderRadius: 99, background: "rgba(255,255,255,.08)", overflow: "hidden" }}
          >
            <span
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: pct(TARGET[0]),
                width: `${((TARGET[1] - TARGET[0]) / scale) * 100}%`,
                background: "rgba(74,222,128,.22)",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 2,
                bottom: 2,
                borderRadius: 99,
                width: pct(a.secs),
                background: inRange ? "#4ade80" : "#facc15",
              }}
            />
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--ink-3)" }}>
            {plural(a.words, "word")} · about {a.secs}s · target {TARGET[0]}–{TARGET[1]}s
          </p>
          <button
            type="button"
            className="gx-btn gx-btn-primary"
            style={{ display: "block", width: "100%", marginTop: 14 }}
            disabled={a.words < MIN_WORDS}
            onClick={() => void onAnalyze()}
          >
            {a.words < MIN_WORDS
              ? `Write ${MIN_WORDS - a.words} more words to analyze`
              : "Analyze my content →"}
          </button>
        </>
      );
    }
    if (s.key === "analyze")
      return (
        <>
          <p style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--ink-3)", margin: 0 }}>
            Checked on your device with simple writing rules. Aim for {STRONG}+ on each.
          </p>
          <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {a.checks.map((c) => {
              const tone = c.score >= STRONG ? "#4ade80" : c.score >= 40 ? "#facc15" : "#f87171";
              return (
                <li key={c.key} style={{ padding: 12, borderRadius: 14, background: "rgba(255,255,255,.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
                    <span>{c.label}</span>
                    <strong style={{ color: tone }}>{c.score}</strong>
                  </div>
                  <div style={{ height: 6, marginTop: 8, borderRadius: 99, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", borderRadius: 99, background: tone, width: `${c.score}%` }} />
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.45, color: "var(--ink-2)" }}>
                    {c.fix || "Strong."}
                  </p>
                </li>
              );
            })}
          </ul>
          {a.weak.length > 0 && (
            <button type="button" className="gx-btn gx-btn-sm" style={{ marginTop: 12 }} onClick={() => go("script")}>
              Edit script →
            </button>
          )}
          {buyerBrainBlock}
        </>
      );
    if (s.key === "rehearse")
      return (
        <>
          <p style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--ink-3)", margin: 0 }}>
            Your delivery plan. Stress the{" "}
            <strong style={{ color: "#fde047", fontWeight: 700 }}>highlighted</strong> words.
          </p>
          <ol style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {deliveryPlan(v).map((b) => (
              <li
                key={b.label}
                style={{ padding: 12, borderRadius: 14, background: "rgba(255,255,255,.04)", borderLeft: "3px solid #34d399" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#34d399",
                  }}
                >
                  <span>{b.label}</span>
                  <span>{b.time}</span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 15, lineHeight: 1.5 }}>
                  “
                  {emphasisParts(b.line, v).map((part, i) =>
                    part.em ? (
                      <strong key={i} style={{ color: "#fde047", fontWeight: 700 }}>
                        {part.text}
                      </strong>
                    ) : (
                      <span key={i}>{part.text}</span>
                    )
                  )}
                  ”
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.4, color: "var(--ink-3)" }}>
                  {b.tip}
                </p>
              </li>
            ))}
          </ol>
          {checklist(
            REHEARSE.map((r) => ({ ...r, done: !!v.rehearsed[r.key], note: "" })),
            (k) => toggle("rehearsed", k)
          )}
        </>
      );
    // publish
    const items = publishItems(v);
    const ready = items.every((i) => i.done);
    return (
      <>
        <label className="gx-field" style={{ marginTop: 0 }}>
          <span>Caption</span>
          <textarea
            className="gx-input"
            rows={3}
            style={{ minHeight: 90, resize: "vertical", lineHeight: 1.5 }}
            placeholder="Your hook line + #ad"
            value={v.caption}
            onChange={(e) => set({ caption: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="gx-btn gx-btn-sm"
          style={{ marginTop: 12 }}
          onClick={() => set({ caption: suggestCaption(v) })}
        >
          Use suggested caption
        </button>
        {checklist(items, (k) => toggle("published", k))}
        <button
          type="button"
          className="gx-btn gx-btn-primary"
          style={{ display: "block", width: "100%", marginTop: 14 }}
          disabled={!ready}
          onClick={() => setPostReady(true)}
        >
          {ready ? "Ready to post →" : "Finish the checklist to post"}
        </button>
        {ready && postReady ? (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid var(--line)" }}>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{v.caption}</p>
            <button
              type="button"
              className="gx-btn gx-btn-sm"
              style={{ marginTop: 12 }}
              onClick={async () => {
                const ok = await copyText(v.caption);
                toast(ok ? "Caption copied." : "Copy failed. Select the text manually.");
              }}
            >
              Copy caption
            </button>
            <p style={{ margin: "12px 0 0", fontSize: 13.5, lineHeight: 1.45, color: "var(--ink-2)" }}>
              Copy your caption and post it in your app — UltraVestra doesn&apos;t post for you.
            </p>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <div>
      <section aria-label="Video Studio" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h1 className="gx-h1">Video Studio</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ink-2)" }}>
              Your idea deserves a better execution.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setV(SAMPLE_VIDEO);
              setOpen(null);
              setPostReady(false);
              toast("Sample video loaded.");
            }}
            style={{
              all: "unset",
              cursor: "pointer",
              padding: "6px 0",
              fontSize: 13,
              fontWeight: 600,
              color: PINK,
              whiteSpace: "nowrap",
            }}
          >
            Try a sample
          </button>
        </div>

        {/* Readiness: one segment per stage */}
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontSize: 13,
              color: "var(--ink-3)",
            }}
          >
            <span>Video readiness</span>
            <strong style={{ color: "var(--ink)", fontWeight: 600 }}>
              {doneCount} of 5 ready
            </strong>
          </div>
          <div
            role="img"
            aria-label={stages.map((s) => `${s.name}: ${STAGE_STATE[s.state].label}`).join(", ")}
            style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginTop: 8 }}
          >
            {stages.map((s) => (
              <span
                key={s.key}
                style={{ height: 6, borderRadius: 99, background: STAGE_STATE[s.state].color }}
              />
            ))}
          </div>
        </div>

        {/* Up next: the first stage that isn't ready */}
        {next ? (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 20,
              background: `${next.color}12`,
              border: `1px solid ${next.color}4d`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                Up next
              </span>
              {statePill(next.state)}
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: next.color }}>
              {next.n} · {next.name}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 19, fontWeight: 700, lineHeight: 1.3 }}>{next.status}</p>
            {next.detail ? (
              <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--ink-2)" }}>
                {next.detail}
              </p>
            ) : null}
            <button
              type="button"
              className="gx-btn gx-btn-primary"
              style={{ display: "block", width: "100%", marginTop: 14 }}
              onClick={() => go(next.key)}
            >
              {next.cta}
            </button>
          </div>
        ) : (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 20,
              background: `${STAGE_STATE.done.color}12`,
              border: `1px solid ${STAGE_STATE.done.color}4d`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                Up next
              </span>
              {statePill("done")}
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 19, fontWeight: 700, lineHeight: 1.3 }}>
              Ready to film and post
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--ink-2)" }}>
              Every stage is ready. Go make it.
            </p>
            <button
              type="button"
              className="gx-btn gx-btn-primary"
              style={{ display: "block", width: "100%", marginTop: 14 }}
              onClick={reset}
            >
              Start a new video
            </button>
          </div>
        )}

        {/* The five stages */}
        <ol style={{ listStyle: "none", margin: "16px 0 0", padding: 0 }}>
          {stages.map((s, i) => {
            const isOpen = open === s.key;
            const after = stages[i + 1];
            return (
              <li
                key={s.key}
                id={`vs-stage-${s.key}`}
                style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`vs-panel-${s.key}`}
                  onClick={() => setOpen(isOpen ? null : s.key)}
                  style={{
                    all: "unset",
                    boxSizing: "border-box",
                    display: "grid",
                    gridTemplateColumns: "56px 1fr 30px",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "18px 2px",
                    cursor: "pointer",
                    borderRadius: 14,
                  }}
                >
                  <span style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, color: s.color }}>{s.n}</span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                    <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "0.01em" }}>{s.name}</span>
                    <span style={{ fontSize: 14, lineHeight: 1.35, color: "var(--ink-2)" }}>{s.status}</span>
                    <span style={{ alignSelf: "flex-start", marginTop: 2 }}>{statePill(s.state)}</span>
                  </span>
                  <span style={{ color: s.color, justifySelf: "end", display: "inline-flex" }}>
                    <Icon html={STAGE_ICON[s.key]} size={26} />
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={`vs-panel-${s.key}`}
                    style={{
                      margin: "0 0 18px",
                      padding: 16,
                      borderRadius: 18,
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    {panel(s)}
                    {s.state === "done" && after && (
                      <button
                        type="button"
                        className="gx-btn gx-btn-sm"
                        style={{ marginTop: 12 }}
                        onClick={() => go(after.key)}
                      >
                        Next: {after.name.charAt(0) + after.name.slice(1).toLowerCase()} →
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: "14px 2px 6px",
            borderTop: "1px solid var(--line)",
            fontSize: 12.5,
            color: "var(--ink-3)",
          }}
        >
          <span>Drafts save on this device.</span>
          <button
            type="button"
            onClick={reset}
            style={{ all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, color: PINK }}
          >
            Start a new video
          </button>
        </div>
      </section>

      {recent.length ? (
        <section className="gx-panel" aria-labelledby="recent-h" style={{ maxWidth: 560, margin: "22px auto 0" }}>
          <div className="gx-panel-head">
            <h2 id="recent-h">Recent checks</h2>
          </div>
          <ul className="gx-list">
            {recent.map((s) => (
              <li key={s.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: 12, alignItems: "center", padding: "10px 0", fontSize: 14.5 }}>
                <div>
                  {s.product || "Untitled script"}
                  <small style={{ display: "block", color: "var(--ink-3)", fontSize: 12.5 }}>
                    {s.firstLine}
                  </small>
                </div>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                  {s.passed} of {s.total}
                </span>
                <span className="gx-muted" style={{ fontSize: 12.5 }}>
                  {fmtDate(s.date)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
