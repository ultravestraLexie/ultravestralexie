"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SAMPLE_SCRIPT,
  analyzeScript,
  type LabForm,
  type LabResult,
} from "@/lib/galaxy/analyze";
import { fmtDate } from "@/lib/galaxy/core";
import { Icon, I, toast } from "@/components/galaxy/ui";

/* STUDIO client — the Video Lab form, the instant deterministic
 * checks, and the full Buyer Brain V3 read.
 *
 * WIRING (exact): on submit, the form runs analyzeScript locally
 * for the instant result AND saves the check via POST
 * /api/studio. "Get the full Buyer Brain read" POSTs the same
 * form to /api/creator-lab — the existing Buyer Brain V3
 * endpoint the Creator Lab uses (request {product, audience,
 * price, script, stage}; response {success, report}) — and
 * renders its report when it returns. V3 internals are not
 * touched. */

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

export default function StudioClient({
  defaultAudience,
  recent,
}: {
  defaultAudience: string;
  recent: Recent[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<LabForm>({
    audience: defaultAudience,
    feel: "",
    product: "",
    price: "",
    script: "",
  });
  const [result, setResult] = useState<LabResult | null>(null);
  const [full, setFull] = useState<FullReport | null>(null);
  const [fullBusy, setFullBusy] = useState(false);
  const [fullError, setFullError] = useState<string | null>(null);

  const set = (k: keyof LabForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function check(e: React.FormEvent) {
    e.preventDefault();
    const r = analyzeScript(form);
    setResult(r);
    setFull(null);
    setFullError(null);
    try {
      const res = await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: form.audience,
          feel: form.feel,
          product: form.product,
          price: form.price,
          script: form.script,
          passed: r.passed,
          total: r.total,
          checks: r.checks,
          buyers: r.buyers,
        }),
      });
      if (res.ok) router.refresh();
    } catch {
      /* saving the history is best-effort; the result stands */
    }
  }

  async function fullRead() {
    setFullBusy(true);
    setFullError(null);
    try {
      const res = await fetch("/api/creator-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: form.product || "the product in this video",
          audience: form.audience || "the viewer this video is for",
          price: form.price ? `$${form.price}` : "Not provided",
          script: form.script,
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

  return (
    <div>
      <header style={{ marginBottom: 26 }}>
        <h1 className="gx-h1">Video Lab</h1>
        <p style={{ margin: "10px 0 0", color: "var(--ink-2)", maxWidth: "60ch" }}>
          Human emotion first. Who is this video for, and what should they feel when it ends?
          Check your script before you film.
        </p>
      </header>

      <div className="gx-studio-grid">
        <section className="gx-panel" aria-labelledby="lab-h">
          <div className="gx-panel-head">
            <h2 id="lab-h">Your video</h2>
            <button
              type="button"
              className="gx-btn gx-btn-sm gx-btn-quiet"
              onClick={() => {
                setForm(SAMPLE_SCRIPT);
                toast("Sample script loaded.");
              }}
            >
              Use a sample script
            </button>
          </div>
          <form onSubmit={(e) => void check(e)}>
            <label className="gx-field">
              <span>Who is this video for?</span>
              <input className="gx-input" value={form.audience} onChange={set("audience")} placeholder="Busy moms who skip skincare" />
            </label>
            <label className="gx-field">
              <span>What should they feel or get by the end?</span>
              <input className="gx-input" value={form.feel} onChange={set("feel")} placeholder="Relief that this takes 30 seconds" />
            </label>
            <div className="gx-row2">
              <label className="gx-field">
                <span>Product</span>
                <input className="gx-input" value={form.product} onChange={set("product")} placeholder="Glow Serum" />
              </label>
              <label className="gx-field">
                <span>Price in dollars</span>
                <input className="gx-input" inputMode="decimal" value={form.price} onChange={set("price")} placeholder="28" />
              </label>
            </div>
            <label className="gx-field">
              <span>Script</span>
              <textarea className="gx-input" rows={8} required value={form.script} onChange={set("script")} placeholder="Write it the way you will say it on camera." />
            </label>
            <button type="submit" className="gx-btn gx-btn-primary">
              Check script
            </button>
          </form>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "14px 0 0" }}>
            These quick checks run on your phone. The full Buyer Brain read runs on the server.
          </p>
        </section>

        <section className="gx-panel" aria-labelledby="res-h" aria-live="polite">
          {result ? (
            <div>
              <div className="gx-panel-head">
                <h2 id="res-h">How it lands</h2>
                <span className="gx-muted">About {result.secs} seconds</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                <strong style={{ font: "500 40px/1 var(--display)" }}>
                  {result.passed} of {result.total}
                </strong>
                <span className="gx-muted">checks landed</span>
              </div>
              {result.fixes.length ? (
                <>
                  <h3 style={{ fontSize: 14.5, marginTop: 18 }}>Fix these first</h3>
                  <ol style={{ margin: "14px 0 0", padding: 0, listStyle: "none", counterReset: "f" }}>
                    {result.fixes.map((x) => (
                      <li
                        key={x.id}
                        style={{ display: "grid", gridTemplateColumns: "26px minmax(0,1fr)", gap: 12, padding: "10px 0", borderTop: "1px solid var(--line)" }}
                      >
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            font: "600 11.5px var(--display)",
                            background: "rgba(155,92,255,.2)",
                            color: "#DCCBFF",
                          }}
                        >
                          {result.fixes.indexOf(x) + 1}
                        </span>
                        <div>
                          <b style={{ display: "block", fontWeight: 600 }}>{x.name}</b>
                          <span style={{ color: "var(--ink-2)", fontSize: 14 }}>{x.fix}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="gx-sub" style={{ marginTop: 12 }}>
                  Every check landed. Film it.
                </p>
              )}
              <h3 style={{ fontSize: 14.5, marginTop: 22 }}>How five buyers react</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10, marginTop: 12 }}>
                {result.buyers.map((b) => (
                  <div
                    key={b.name}
                    style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid var(--line)", background: "rgba(255,255,255,.03)" }}
                  >
                    <b style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                      <span style={{ color: b.yes ? "var(--good)" : "var(--warn)", display: "inline-flex" }}>
                        <Icon html={b.yes ? I.check : I.warn} size={15} />
                      </span>
                      {b.name}
                    </b>
                    <p style={{ margin: "6px 0 0", color: "var(--ink-2)", fontSize: 13.5, fontStyle: "italic" }}>
                      {b.yes ? b.y : b.n}
                    </p>
                  </div>
                ))}
              </div>
              <details style={{ marginTop: 20 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>See every check</summary>
                <ul className="gx-list" style={{ marginTop: 8 }}>
                  {result.checks.map((x) => (
                    <li key={x.id} style={{ display: "grid", gridTemplateColumns: "20px minmax(0,1fr)", gap: 12, padding: "10px 0", fontSize: 14 }}>
                      <span style={{ color: x.skip ? "var(--ink-3)" : x.pass ? "var(--good)" : "var(--warn)", marginTop: 2, display: "inline-flex" }}>
                        <Icon html={x.skip ? I.clock : x.pass ? I.check : I.warn} size={17} />
                      </span>
                      <div>
                        {x.name}
                        <small style={{ display: "block", color: "var(--ink-3)", fontSize: 13 }}>
                          {x.skip ? "Skipped" : x.pass ? "Landed" : "Needs work"}. {x.note}
                        </small>
                      </div>
                    </li>
                  ))}
                </ul>
              </details>

              <div style={{ marginTop: 22, borderTop: "1px solid var(--line)", paddingTop: 18 }}>
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
            </div>
          ) : (
            <div>
              <div className="gx-panel-head">
                <h2 id="res-h">How it lands</h2>
              </div>
              <div className="gx-empty">
                <p>
                  Paste a script and tap Check script. You&apos;ll see the three fixes that matter
                  most and how five kinds of buyers react.
                </p>
              </div>
            </div>
          )}
          {recent.length ? (
            <>
              <h3 style={{ fontSize: 14.5, marginTop: 22 }}>Recent checks</h3>
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
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
