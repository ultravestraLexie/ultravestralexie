"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CONFIDENCE,
  CSV_TEMPLATE,
  DNA_SHARE_URL,
  DNA_STORAGE_KEY,
  EMPTY_DNA_STATE,
  EXPERIMENT_IDEAS,
  HOOK_STYLES,
  LEAD_PHRASES,
  METRICS,
  OBJECTIVES,
  SOURCES,
  VERDICTS,
  analyzeDna,
  experimentFromOpportunity,
  experimentResult,
  fmtMetric,
  helixData,
  leadText,
  median,
  otherPostsLabel,
  parsePostsCsv,
  plural,
  samplePosts,
  fmtDateShort,
  fmtDateTime,
  type DnaAnalysis,
  type DnaExperiment,
  type DnaOpportunity,
  type DnaPattern,
  type DnaPost,
  type DnaState,
  type EnrichedPost,
} from "@/lib/galaxy/dna";
import { dnaSourceFromPipeline, loadPipelineState } from "@/lib/galaxy/pipeline";
import { copyText, toast } from "@/components/galaxy/ui";

/* CONTENT DNA client — the owner's prototype ported (2026-11-23):
 * hero + six tabs (My DNA / Opportunities / Lab / 30-Day / Share /
 * Data). State lives on this device only (localStorage
 * "uv-content-dna", the prototype's key and shape). Share actions
 * are copy-only — UltraVestra never posts for the user. */

const TABS: [string, string][] = [
  ["dna", "My DNA"],
  ["ideas", "Opportunities"],
  ["lab", "Lab"],
  ["challenge", "30-Day"],
  ["share", "Share"],
  ["data", "Data"],
];

const DNA_CSS = `
.dna{--card:rgba(21,15,40,.82);--line:rgba(167,139,250,.18);--line2:rgba(167,139,250,.34);--text2:#dcd6f3;--muted:#a8a1c9;--violet:#a78bfa;--grad:linear-gradient(90deg,#8b5cf6,#3b82f6);position:relative;max-width:560px;margin:0 auto;padding:22px 16px 40px;border-radius:28px;color:#fff;overflow:hidden;background:radial-gradient(130% 55% at 50% 0%,rgba(124,58,237,.26),transparent 62%),radial-gradient(90% 40% at 100% 75%,rgba(59,130,246,.10),transparent 70%),#05040b;border:1px solid var(--line)}
.dna *{box-sizing:border-box}.dna p,.dna h1,.dna h2,.dna h3,.dna h4{margin:0}
.dna-chip{display:inline-flex;padding:4px 10px;border-radius:99px;border:1px solid var(--line2);font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--violet)}
.dna h1{font-size:30px;font-weight:800;letter-spacing:-.02em;margin-top:10px}
.dna-sub{color:var(--muted);font-size:14px;margin-top:4px}
.dna-state{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:13px;color:var(--text2)}
.dna-state i{width:8px;height:8px;border-radius:50%;display:inline-block}
.dna-fresh{font-size:12.5px;color:var(--muted);margin-top:6px}
.dna-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-top:18px}
.dna-tabs button{position:relative;padding:8px 13px;border-radius:99px;border:1px solid var(--line);background:transparent;color:var(--text2);font:inherit;font-size:13.5px;font-weight:600;cursor:pointer}
.dna-tabs button.is-on{background:var(--grad);color:#fff;border-color:transparent}
.dna-tab-n{position:absolute;top:-6px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:99px;background:#f59e0b;color:#1a1005;font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center}
.dna-body{margin-top:20px}
.dna-reveal{font-size:26px;font-weight:800;line-height:1.15;letter-spacing:-.01em}
.dna-reveal span{display:block;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.dna-lede{font-size:15px;line-height:1.55;color:var(--text2);margin-top:12px}
.dna-step{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:22px}
.dna-card{margin-top:14px;padding:16px;border-radius:18px;background:var(--card);border:1px solid var(--line)}
.dna-card h4{font-size:16.5px;font-weight:700;line-height:1.3}
.dna-eyebrow{font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--violet)}
.dna-big{font-size:16px;line-height:1.45;margin-top:8px}
.dna-meta{font-size:13.5px;line-height:1.5;color:var(--muted);margin-top:8px}
.dna-fine{font-size:12.5px;line-height:1.5;color:var(--muted);margin-top:10px}
.dna-caveat{font-size:13px;line-height:1.5;color:#fbbf24;margin-top:8px}
.dna-error{font-size:13.5px;color:#f87171;margin-top:10px}
.dna-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;margin-top:14px;border:0;border-radius:14px;background:var(--grad);color:#fff;font:inherit;font-size:14.5px;font-weight:700;cursor:pointer}
.dna-cta{display:block;width:100%;min-height:52px;margin-top:16px;border:0;border-radius:16px;background:var(--grad);color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer}
.dna-cta:disabled,.dna-btn:disabled{opacity:.45;cursor:not-allowed}
.dna-ghost{display:inline-flex;align-items:center;min-height:40px;padding:0 14px;border-radius:12px;border:1px solid var(--line);background:transparent;color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none}
.dna-ghost:disabled{opacity:.45;cursor:not-allowed}
.dna-sm{min-height:34px;font-size:13px;padding:0 11px}
.dna-full{width:100%;justify-content:center;margin-top:14px}
.dna-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center}
.dna-actions .dna-btn{margin-top:0}
.dna-why{all:unset;cursor:pointer;font-size:13.5px;font-weight:600;color:var(--violet);margin-top:12px;display:inline-block}
.dna-link{color:var(--violet);font-size:13.5px;font-weight:600;display:inline-block;margin-top:12px}
.dna-sources{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.dna-source{display:flex;flex-direction:column;gap:2px;align-items:flex-start;padding:14px;border-radius:16px;border:1px solid var(--line);background:var(--card);color:#fff;font:inherit;text-align:left;cursor:pointer}
.dna-source strong{font-size:15px}
.dna-source span{font-size:13px;color:var(--muted)}
.dna-source.is-on{border-color:var(--violet);box-shadow:0 0 0 1px var(--violet)}
.dna-source:disabled{opacity:.5;cursor:not-allowed}
.dna-connect{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.dna-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.dna-chip-btn{padding:9px 14px;border-radius:99px;border:1px solid var(--line);background:transparent;color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer}
.dna-chip-btn.is-on{background:var(--grad);border-color:transparent}
.dna-picked{margin-top:12px;font-size:14px;color:#4ade80;font-weight:600}
.dna-kicker{font-size:12.5px;color:var(--muted);letter-spacing:.04em}
.dna-identity{margin-top:16px;padding:18px;border-radius:20px;background:var(--card);border:1px solid var(--line2);text-align:left}
.dna-arch{font-size:24px;font-weight:800;margin-top:6px}
.dna-arch-line{font-size:14.5px;color:var(--text2);margin-top:4px;line-height:1.45}
.dna-sec{margin-top:26px}
.dna-sec-head{display:flex;align-items:baseline;gap:10px}
.dna-sec-n{font-size:13px;font-weight:800;color:var(--violet)}
.dna-sec h3{font-size:18px;font-weight:700}
.dna-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.dna-facts>div{padding:14px;border-radius:16px;background:var(--card);border:1px solid var(--line)}
.dna-facts strong{display:block;font-size:22px;font-weight:800}
.dna-facts span{font-size:12px;color:var(--muted);line-height:1.4;display:block;margin-top:2px}
.dna-card-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dna-dim{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-left:auto}
.dna-conf{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--tone)}
.dna-conf::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--tone)}
.dna-pattern.is-down{border-color:rgba(248,113,113,.35)}
.dna-evidence{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:6px}
.dna-evidence li{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:var(--text2);border-top:1px solid var(--line);padding-top:6px}
.dna-evidence b{color:#fff;white-space:nowrap}
.dna-rank{font-weight:800;color:var(--violet)}
.dna-qa{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin-top:12px;font-size:14px;line-height:1.5}
.dna-qa dt{font-weight:700;color:var(--muted);font-size:12.5px;padding-top:2px}
.dna-qa dd{margin:0;color:var(--text2)}
.dna-hook{display:block;margin-top:4px;color:#fff}
.dna-need{font-size:13.5px;color:var(--text2);margin-top:12px;line-height:1.5}
.dna-lesson{font-size:13.5px;color:#4ade80;margin-top:8px}
.dna-howto{margin:14px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:8px;font-size:14.5px;color:var(--text2);line-height:1.5}
.dna-toggle{display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border-radius:14px;background:var(--card);border:1px solid var(--line);cursor:pointer;font-size:14px}
.dna-toggle input{width:19px;height:19px;accent-color:#8b5cf6;flex:none}
.dna-toggle em{display:block;font-style:normal;font-size:12px;color:var(--muted)}
.dna-toggle.is-off{opacity:.55}
.dna-toggles{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.dna-sharecard{margin-top:14px;padding:22px;border-radius:22px;background:linear-gradient(160deg,#171029,#0a0618);border:1px solid var(--line2);text-align:center}
.dna-sharecard .dna-big-lines{font-size:24px;font-weight:800;line-height:1.2;letter-spacing:-.01em}
.dna-sharecard .dna-big-lines span{display:block;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.dna-share-rows{margin-top:14px;display:flex;flex-direction:column;gap:8px;text-align:left}
.dna-share-rows div{display:flex;justify-content:space-between;gap:12px;font-size:13.5px;border-top:1px solid var(--line);padding-top:8px}
.dna-share-rows dt{color:var(--muted)}.dna-share-rows dd{margin:0;font-weight:600;text-align:right}
.dna-edit{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:10px}
.dna-edit li{padding:12px;border-radius:14px;background:var(--card);border:1px solid var(--line)}
.dna-edit-title{font-size:14px;font-weight:600;line-height:1.4}
.dna-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.dna-input{display:block;width:100%;min-height:42px;padding:9px 12px;border-radius:12px;border:1px solid var(--line);background:#0c081c;color:#fff;font:inherit;font-size:14px}
.dna-input:focus{outline:none;border-color:#8b5cf6}
.dna-select{min-height:42px}
.dna-history{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:6px;font-size:13.5px;color:var(--text2)}
.dna-history span{display:block;color:var(--muted);font-size:12.5px}
.dna-ring-wrap{display:flex;gap:16px;align-items:center;margin-top:14px}
.dna-milestones{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:7px;font-size:14px;color:var(--text2)}
.dna-milestones li.is-done{color:#4ade80}
.dna-analyzing ul{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-direction:column;gap:10px;font-size:14.5px;color:var(--muted)}
.dna-analyzing li.is-done{color:#4ade80}.dna-analyzing li.is-now{color:#fff;font-weight:600}
.dna-postpick{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:6px;max-height:220px;overflow:auto}
.dna-postpick label{display:flex;gap:9px;align-items:flex-start;font-size:13.5px;color:var(--text2);cursor:pointer;padding:8px;border-radius:10px;background:rgba(255,255,255,.03)}
.dna-postpick input{width:18px;height:18px;accent-color:#8b5cf6;flex:none}
.dna-form{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.dna-form label{font-size:13px;font-weight:600;color:var(--text2);display:flex;flex-direction:column;gap:6px}
.dna-inline{all:unset;cursor:pointer;color:var(--violet);font-weight:600}
.dna-center{text-align:center}
.dna-update{border-color:rgba(74,222,128,.4)}
@media (prefers-reduced-motion:reduce){.dna *{transition:none!important}}
`;

function ConfPill({ conf }: { conf: string }) {
  const c = CONFIDENCE[conf] || CONFIDENCE.hypothesis;
  return (
    <span className="dna-conf" style={{ "--tone": c.color } as React.CSSProperties}>
      {c.label}
    </span>
  );
}

function EvidenceList({ posts, metric }: { posts: EnrichedPost[]; metric: string | null }) {
  return (
    <ul className="dna-evidence">
      {posts.map((p) => (
        <li key={p.id}>
          <span>
            “{p.title}” · {fmtDateShort(p.date)} · {p.platform}
          </span>
          <b>{metric ? fmtMetric(metric, p.m[metric]) : `score ${Math.round(p.score)}`}</b>
        </li>
      ))}
    </ul>
  );
}

function Helix({ a }: { a: DnaAnalysis }) {
  const h = helixData(a);
  const W = 300;
  const H = 92;
  const cy = H / 2;
  const pts = h.rungs.map((r, i) => {
    const x = 8 + (i * (W - 16)) / (h.rungs.length - 1);
    const t = h.phase + i * h.twist * 0.9;
    return { x, y1: cy + Math.sin(t) * 26, y2: cy - Math.sin(t) * 26, ...r };
  });
  const strand = (k: "y1" | "y2") => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p[k].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-hidden="true" style={{ display: "block", margin: "6px 0 2px" }}>
      {pts.map((p, i) => (
        <line key={i} x1={p.x} y1={p.y1} x2={p.x} y2={p.y2} stroke={p.color} strokeWidth={2 + p.strength * 2} strokeLinecap="round" opacity={0.35 + p.strength * 0.6} />
      ))}
      <path d={strand("y1")} fill="none" stroke="#a78bfa" strokeWidth="2" opacity=".8" />
      <path d={strand("y2")} fill="none" stroke="#60a5fa" strokeWidth="2" opacity=".8" />
    </svg>
  );
}

export default function DnaClient({ creatorName }: { creatorName: string }) {
  const [state, setState] = useState<DnaState>(EMPTY_DNA_STATE);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dna");
  const [analyzing, setAnalyzing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(DNA_STORAGE_KEY) || "null");
      if (raw && raw.v === 1) setState({ ...EMPTY_DNA_STATE, ...raw, share: { ...EMPTY_DNA_STATE.share, ...(raw.share || {}) } });
    } catch {
      /* fresh device */
    }
    setLoaded(true);
  }, []);

  const update = (fn: Partial<DnaState> | ((s: DnaState) => DnaState)) => {
    const next = typeof fn === "function" ? (fn as (s: DnaState) => DnaState)(stateRef.current) : { ...stateRef.current, ...fn };
    stateRef.current = next;
    setState(next);
    try {
      localStorage.setItem(DNA_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full/blocked — state still lives in memory */
    }
  };

  const now = useMemo(() => Date.now(), [state]);
  const A = useMemo(() => analyzeDna(state, now), [state, now]);

  /* Analysis snapshots — the prototype records one whenever the
   * usable count, goal, finished experiments or tag edits change. */
  const doneCount = state.experiments.filter((e) => e.status === "done").length;
  const editedCount = state.posts.filter((p) => p.edited).length;
  const sig = `${A.usable.length}|${state.objective}|${doneCount}|${editedCount}`;
  useEffect(() => {
    if (!loaded || !state.started || analyzing) return;
    const last = state.snapshots[state.snapshots.length - 1];
    if (last && last.sig === sig) return;
    let reason = "First discovery";
    if (last) {
      const [prevPosts, prevObj, prevDone, prevEdited] = last.sig.split("|");
      reason =
        prevObj !== state.objective
          ? "You changed your goal"
          : +prevDone < doneCount
            ? "An experiment finished"
            : +prevEdited !== editedCount
              ? "You corrected your tags"
              : +prevPosts < A.usable.length
                ? "New posts added"
                : +prevPosts > A.usable.length
                  ? "Posts removed or replaced"
                  : "Your data changed";
    }
    update((s) => ({
      ...s,
      snapshots: [...s.snapshots, { at: Date.now(), sig, reason, posts: A.usable.length, top: A.strengths.slice(0, 3).map((x) => x.name) }].slice(-30),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, loaded, state.started, analyzing]);

  useEffect(() => {
    if (!analyzing) return;
    const t0 = Date.now();
    const iv = setInterval(() => setElapsed(Date.now() - t0), 120);
    const done = setTimeout(() => setAnalyzing(false), 3100);
    return () => {
      clearInterval(iv);
      clearTimeout(done);
    };
  }, [analyzing]);

  const startFromOpp = (o: DnaOpportunity, silent = false): DnaExperiment => {
    const exp = experimentFromOpportunity(o);
    update((s) => ({
      ...s,
      experiments: [exp, ...s.experiments],
      decisions: { ...s.decisions, [o.id]: "accepted" },
    }));
    if (!silent) setTab("lab");
    return exp;
  };

  const startChallenge = (exp: DnaExperiment) => {
    update((s) => ({ ...s, challenge: { startedAt: Date.now(), experimentId: exp.id, checkins: [], completedAt: null } }));
    setTab("challenge");
  };

  const lastSnap = state.snapshots[state.snapshots.length - 1];
  const runningExp = state.experiments.find((e) => e.status === "running");
  const newOpps = A.opps.slice(0, 3).filter((o) => !state.seenOpps.includes(o.id)).length;
  const heroMode = !state.started
    ? { label: "Waiting for your content", color: "rgb(167,139,250)", note: "Add your content to begin" }
    : runningExp
      ? { label: "Experiment in progress", color: "rgb(34,211,238)", note: `${runningExp.title} · ${(A.results[runningExp.id] || {}).n || 0}/${runningExp.minPosts} posts` }
      : newOpps
        ? { label: "New opportunity discovered", color: "rgb(251,191,36)", note: plural(newOpps, "new opportunity", "new opportunities") + " for you" }
        : { label: "Learning", color: "rgb(167,139,250)", note: A.enough ? `${plural(A.usable.length, "post")} mapped · ${plural(A.strengths.length, "strong pattern")}` : `${plural(A.usable.length, "post")} mapped` };

  return (
    <div className="dna">
      <style>{DNA_CSS}</style>
      <header>
        <span className="dna-chip">Signature technology</span>
        <h1>VESTRA CONTENT DNA</h1>
        <p className="dna-sub">A continuously improving creator intelligence system</p>
        <p className="dna-state" aria-live="polite">
          <i style={{ background: heroMode.color }} />
          {heroMode.label} · {heroMode.note}
        </p>
        {state.started && lastSnap && (
          <p className="dna-fresh">
            Last analysis {fmtDateTime(lastSnap.at)} · {plural(lastSnap.posts, "post")} · {SOURCES[state.source || ""] || "your posts"}
            {state.source === "sample" ? " · sample data" : ""}
          </p>
        )}
      </header>

      {!loaded ? null : analyzing ? (
        <Analyzing A={A} state={state} elapsed={elapsed} />
      ) : !state.started ? (
        <Discover
          onStart={(source, posts, objective) => {
            update({ started: true, source, posts, objective });
            setAnalyzing(true);
            setElapsed(0);
          }}
        />
      ) : (
        <>
          <nav className="dna-tabs" aria-label="Content DNA">
            {TABS.map(([key, label]) => {
              const badge = key === "ideas" ? newOpps : key === "lab" ? state.experiments.filter((e) => e.status === "running").length : 0;
              return (
                <button key={key} type="button" className={tab === key ? "is-on" : ""} aria-current={tab === key ? "page" : undefined} onClick={() => setTab(key)}>
                  {label}
                  {badge > 0 && <span className="dna-tab-n">{badge}</span>}
                </button>
              );
            })}
          </nav>
          <div className="dna-body">
            {tab === "dna" && (
              <MyDna A={A} state={state} setTab={setTab} dismiss={(id) => update((s) => ({ ...s, dismissed: { ...s.dismissed, [id]: Date.now() } }))} startFromOpp={startFromOpp} />
            )}
            {tab === "ideas" && <Opportunities A={A} state={state} update={update} startFromOpp={startFromOpp} setTab={setTab} />}
            {tab === "lab" && <Lab A={A} state={state} update={update} startChallenge={startChallenge} />}
            {tab === "challenge" && (
              <Challenge A={A} state={state} update={update} startChallenge={startChallenge} startFromOpp={startFromOpp} creatorName={creatorName} />
            )}
            {tab === "share" && <Share A={A} state={state} update={update} creatorName={creatorName} />}
            {tab === "data" && <DataTab A={A} state={state} update={update} />}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- analyzing interstitial (the prototype's zb) ---------- */

function Analyzing({ A, state, elapsed }: { A: DnaAnalysis; state: DnaState; elapsed: number }) {
  const steps = [
    `Reading ${plural(A.all.length, "post")} from ${(SOURCES[state.source || ""] || "your content").toLowerCase()}`,
    `Setting your baselines on ${plural(A.platforms.length || 1, "platform")}`,
    `Testing ${plural(A.patterns.length, "pattern")} across topic, format, hook and length`,
    "Checking for platform, timing and overlap bias",
    `Ranking ${plural(A.opps.length, "opportunity", "opportunities")} for ${OBJECTIVES[state.objective].short}`,
  ];
  const cur = Math.floor(elapsed / 620);
  return (
    <div className="dna-analyzing" aria-live="polite">
      <h2 className="dna-reveal" style={{ marginTop: 20 }}>
        LOOKING FOR<span>YOUR PATTERN…</span>
      </h2>
      <ul>
        {steps.map((s, i) => (
          <li key={s} className={i < cur ? "is-done" : i === cur ? "is-now" : ""}>
            {i < cur ? "✓ " : ""}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- discovery / onboarding (the prototype's Ab) ---------- */

function Discover({ onStart }: { onStart: (source: string, posts: DnaPost[], objective: string) => void }) {
  const [picked, setPicked] = useState<{ source: string; posts: DnaPost[]; label: string } | null>(null);
  const [objective, setObjective] = useState("grow");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  /* "Use my Ultra Vestra posts" reads the Studio's content
   * pipeline on this device: enabled only when at least one
   * posted pipeline video has results (the demo's own rule —
   * its button is disabled with "No posted videos with results
   * yet" until the converted list is non-empty). */
  const [appSource, setAppSource] = useState<{ count: number; posts: DnaPost[] }>({ count: 0, posts: [] });
  useEffect(() => {
    const s = dnaSourceFromPipeline(loadPipelineState().items);
    setAppSource({ count: s.count, posts: s.posts });
  }, []);

  const onFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = parsePostsCsv(String(reader.result || ""));
      if (r.error) {
        setErr(r.error);
        setPicked(null);
        return;
      }
      setErr("");
      setPicked({ source: "import", posts: r.posts, label: `${plural(r.posts.length, "post")} from ${f.name}${r.skipped ? ` (${r.skipped} rows skipped)` : ""}` });
    };
    reader.readAsText(f);
  };

  return (
    <div>
      <h2 className="dna-reveal" style={{ marginTop: 20 }}>
        YOUR CONTENT HAS A PATTERN.<span>LET'S FIND IT.</span>
      </h2>
      <p className="dna-lede">
        Content DNA studies your real posts to learn what makes your content work: your hooks, topics, formats and length. Every finding shows the
        evidence behind it, and nothing is made up.
      </p>
      <p className="dna-step">1 · Choose your content</p>
      <div className="dna-sources">
        <button
          type="button"
          className={`dna-source${picked?.source === "app" ? " is-on" : ""}`}
          disabled={!appSource.count}
          onClick={() =>
            setPicked({ source: "app", posts: appSource.posts, label: `${plural(appSource.count, "post")} from Ultra Vestra` })
          }
        >
          <strong>Use my Ultra Vestra posts</strong>
          <span>{appSource.count ? `${plural(appSource.count, "post")} with results` : "No posted videos with results yet"}</span>
        </button>
        <button type="button" className={`dna-source${picked?.source === "import" ? " is-on" : ""}`} onClick={() => fileRef.current?.click()}>
          <strong>Import my analytics</strong>
          <span>CSV export from TikTok, Instagram or YouTube</span>
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv,.tsv,.txt" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
        <button
          type="button"
          className={`dna-source${picked?.source === "sample" ? " is-on" : ""}`}
          onClick={() => setPicked({ source: "sample", posts: samplePosts(), label: "31 example posts from a sample creator" })}
        >
          <strong>Explore with sample data</strong>
          <span>See how it works before using your own posts</span>
        </button>
      </div>
      <div className="dna-connect">
        {["TikTok", "Instagram", "YouTube"].map((p) => (
          <button
            key={p}
            type="button"
            className="dna-ghost dna-sm"
            onClick={() => setMsg(`Connecting ${p} directly needs Ultra Vestra's server to sign in with ${p}. Until that's set up, export your analytics from ${p} and import the CSV.`)}
          >
            Connect {p}
          </button>
        ))}
      </div>
      {msg && <p className="dna-fine">{msg}</p>}
      {err && <p className="dna-error">{err}</p>}
      {picked && <p className="dna-picked">✓ {picked.label}</p>}
      <a className="dna-link" href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`} download="content-dna-template.csv">
        Download the CSV template
      </a>
      <p className="dna-step">2 · What matters most right now?</p>
      <div className="dna-chips">
        {Object.keys(OBJECTIVES).map((k) => (
          <button key={k} type="button" className={`dna-chip-btn${objective === k ? " is-on" : ""}`} onClick={() => setObjective(k)}>
            {OBJECTIVES[k].label}
          </button>
        ))}
      </div>
      <button type="button" className="dna-cta" disabled={!picked} onClick={() => picked && onStart(picked.source, picked.posts, objective)}>
        Find my pattern
      </button>
      <p className="dna-fine dna-center">Only you see your analysis. Nothing is shared unless you choose to share it.</p>
    </div>
  );
}

/* ---------- pattern card (the prototype's kb) ---------- */

function PatternCard({
  p,
  A,
  state,
  onDismiss,
  onFixTags,
}: {
  p: DnaPattern;
  A: DnaAnalysis;
  state: DnaState;
  onDismiss: (id: string) => void;
  onFixTags: () => void;
}) {
  const obj = OBJECTIVES[state.objective];
  const evidence = [...p.posts].sort((a, b) => b.score - a.score).slice(0, 3);
  const weakest = [...p.posts].sort((a, b) => a.score - b.score).slice(0, 3);
  const strong = p.lift >= 0;
  return (
    <div className={`dna-card dna-pattern${strong ? "" : " is-down"}`}>
      <div className="dna-card-top">
        <ConfPill conf={p.conf} />
        <span className="dna-dim">{p.dim === "hookStyle" ? "Hook" : p.dim === "lengthBucket" ? "Length" : p.dim === "topic" ? "Topic" : "Format"}</span>
      </div>
      <h4 style={{ marginTop: 10 }}>{p.name}</h4>
      <p className="dna-big">
        {p.lead
          ? `They get ${leadText(p.lead, otherPostsLabel(p.dim))}.`
          : `They score ${Math.round(Math.abs(p.lift))} points ${strong ? "higher" : "lower"} than ${otherPostsLabel(p.dim)}.`}
      </p>
      <p className="dna-meta">
        {p.beat} of {p.n} beat your usual score. They&apos;re {Math.round(p.share * 100)}% of your posts.
      </p>
      <p className="dna-meta">
        <b style={{ color: "#fff" }}>How we know.</b> Every post gets a score for your {obj.short} goal, ranked only against your own posts (views
        are compared within each platform, so a big TikTok never drowns out a smaller Instagram post). We compared these {p.n} with the other{" "}
        {p.restN}. {CONFIDENCE[p.conf].explain(p)}
      </p>
      <p className="dna-meta">
        <b style={{ color: "#fff" }}>{strong ? "Strongest examples" : "Weakest examples"}.</b>
      </p>
      <EvidenceList posts={strong ? evidence : weakest} metric={p.lead ? p.lead.key : null} />
      {p.caveats.map((c) => (
        <p key={c} className="dna-caveat">
          {c}
        </p>
      ))}
      <p className="dna-fine">This is a pattern, not proof of cause. The Lab can test it. Source: {SOURCES[state.source || ""] || "your posts"}.</p>
      <div className="dna-actions">
        <button type="button" className="dna-ghost dna-sm" onClick={onFixTags}>
          Tags look wrong
        </button>
        <button type="button" className="dna-ghost dna-sm" onClick={() => onDismiss(p.id)}>
          Not useful, hide it
        </button>
      </div>
    </div>
  );
}

/* ---------- opportunity card (the prototype's ug) ---------- */

function OppCard({
  o,
  rank,
  onTest,
  onSave,
  onReject,
  saved,
  onOpenLab,
}: {
  o: DnaOpportunity;
  rank: number;
  onTest: () => void;
  onSave?: () => void;
  onReject?: () => void;
  saved?: boolean;
  onOpenLab: () => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="dna-card">
      <div className="dna-card-top">
        <span className="dna-rank">#{rank}</span>
        <ConfPill conf={o.conf} />
        <span className="dna-dim">Effort: {o.effortLabel}</span>
      </div>
      <h4 style={{ marginTop: 10 }}>{o.title}</h4>
      <dl className="dna-qa">
        <dt>Why this?</dt>
        <dd>{o.why}</dd>
        <dt>Why now?</dt>
        <dd>{o.whyNow}</dd>
        <dt>What should I do?</dt>
        <dd>
          {o.todo}
          <span className="dna-hook">{o.hook}.</span>
        </dd>
        <dt>How will we know?</dt>
        <dd>
          Track {METRICS[o.metric].label}. Your usual is {fmtMetric(o.metric, o.baseline)}. Aim for {fmtMetric(o.metric, o.target)} or better
          across {o.minPosts} posts.
        </dd>
      </dl>
      <p className="dna-need">
        <b>Audience need:</b> {o.need}
      </p>
      {o.lesson && <p className="dna-lesson">{o.lesson}</p>}
      <button type="button" className="dna-why" aria-expanded={show} onClick={() => setShow(!show)}>
        {show ? "Hide the posts" : `See the ${plural(o.evidence.length, "post")} behind it`}
      </button>
      {show && <EvidenceList posts={o.evidence} metric={o.metric} />}
      <div className="dna-actions">
        {o.inLab === "running" ? (
          <button type="button" className="dna-btn" onClick={onOpenLab}>
            In the Lab →
          </button>
        ) : (
          <button type="button" className="dna-btn" onClick={onTest}>
            {o.inLab === "done" ? "Test it again" : "Test it"}
          </button>
        )}
        {onSave && (
          <button type="button" className="dna-ghost" onClick={onSave}>
            {saved ? "Saved ✓" : "Save"}
          </button>
        )}
        {onReject && (
          <button type="button" className="dna-ghost" onClick={onReject}>
            Not for me
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- My DNA tab (the prototype's Eb) ---------- */

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="dna-sec">
      <div className="dna-sec-head">
        <span className="dna-sec-n">{n}</span>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function MyDna({
  A,
  state,
  setTab,
  dismiss,
  startFromOpp,
}: {
  A: DnaAnalysis;
  state: DnaState;
  setTab: (t: string) => void;
  dismiss: (id: string) => void;
  startFromOpp: (o: DnaOpportunity) => DnaExperiment;
}) {
  const obj = OBJECTIVES[state.objective];
  const snaps = state.snapshots;
  const last = snaps[snaps.length - 1];
  const prev = snaps[snaps.length - 2];

  if (!A.enough) {
    return (
      <>
        <h2 className="dna-reveal">
          ALMOST THERE.<span>WE NEED MORE POSTS.</span>
        </h2>
        <div className="dna-card">
          <p className="dna-big">
            {plural(A.usable.length, "post")} ready to analyze. Patterns unlock at 8.
          </p>
          <p className="dna-meta">
            With fewer posts, any “pattern” would just be noise, so we won&apos;t guess.{" "}
            {A.fresh.length ? `${plural(A.fresh.length, "post")} from the last 3 days ${A.fresh.length === 1 ? "is" : "are"} still collecting views.` : ""}
          </p>
          {A.bestPost && (
            <p className="dna-meta">
              So far, your strongest post for {obj.short} is “{A.bestPost.title}”.
            </p>
          )}
          <button type="button" className="dna-btn" onClick={() => setTab("data")}>
            Add more posts
          </button>
        </div>
      </>
    );
  }

  const top3 = A.strengths.slice(0, 3);
  const weak = A.weaknesses[0];
  const topOpp = A.opps[0];
  const running = state.experiments.filter((e) => e.status === "running");
  const done = state.experiments.filter((e) => e.status === "done");
  const sig = A.sig!;
  const newTop = last && prev ? last.top.filter((x) => !prev.top.includes(x)) : [];
  const goneTop = last && prev ? prev.top.filter((x) => !last.top.includes(x)) : [];

  return (
    <>
      <p className="dna-kicker">
        Analysis {last ? fmtDateTime(last.at) : "now"} · goal: {obj.label.toLowerCase()}
      </p>
      <h2 className="dna-reveal" style={{ marginTop: 8 }}>
        YOUR CONTENT HAS A PATTERN.<span>WE FOUND IT.</span>
      </h2>
      {prev && (newTop.length > 0 || goneTop.length > 0) && (
        <div className="dna-card dna-update">
          <p className="dna-eyebrow">Intelligence updated · {last.reason}</p>
          {newTop.map((x) => (
            <p key={x} className="dna-meta">
              New strong pattern: <b style={{ color: "#fff" }}>{x}</b>
            </p>
          ))}
          {goneTop.map((x) => (
            <p key={x} className="dna-meta">
              No longer in your top patterns: {x}
            </p>
          ))}
        </div>
      )}
      <div className="dna-identity">
        <Helix a={A} />
        <p className="dna-eyebrow">Your creator identity</p>
        <p className="dna-arch">{A.identity.name}</p>
        <p className="dna-arch-line">{A.identity.line}</p>
        {A.identity.from && <p className="dna-fine">Based on your strongest pattern: {A.identity.from.name}.</p>}
      </div>

      <Section n="01" title="What we learned">
        <div className="dna-facts">
          <div>
            <strong>{A.usable.length}</strong>
            <span>
              posts analyzed
              <br />
              {fmtDateShort(sig.from)} – {fmtDateShort(sig.to)}
            </span>
          </div>
          <div>
            <strong>{sig.perWeek.toFixed(1)}</strong>
            <span>
              posts a week
              <br />
              on {A.platforms.join(", ")}
            </span>
          </div>
          <div>
            <strong>{sig.length ? `${Math.round(sig.length)}s` : "–"}</strong>
            <span>typical length</span>
          </div>
        </div>
        <div className="dna-card">
          <p className="dna-eyebrow">What makes your content recognizable</p>
          <p style={{ marginTop: 8, lineHeight: 1.55, fontSize: 14.5 }}>
            You mostly make <b>{sig.topic ? sig.topic.value : "untagged"}</b> videos ({sig.topic ? Math.round(sig.topic.share * 100) : 0}%),
            usually as <b>{sig.format ? sig.format.value : "untagged"}</b>, most often opening with a{" "}
            <b>{sig.hook ? HOOK_STYLES[sig.hook.value].label.toLowerCase() : "statement"}</b> hook.
          </p>
          {A.bestPost && (
            <p className="dna-meta">
              Your strongest post for {obj.short}: “{A.bestPost.title}” ({fmtDateShort(A.bestPost.date)}, {A.bestPost.platform}).
            </p>
          )}
          {done.length > 0 && (
            <p className="dna-meta">
              From your experiments: {done.map((x) => `${x.title} (${VERDICTS[A.results[x.id]?.verdict || "collecting"].label.toLowerCase()})`).join("; ")}.
            </p>
          )}
        </div>
        <p className="dna-fine">
          Data coverage: saves on {Math.round(A.coverage.saveRate * 100)}% of posts, watch time on {Math.round(A.coverage.retention * 100)}%,
          sales or clicks on {Math.round(A.coverage.conversion * 100)}%. Missing numbers are left out, never guessed.
          {A.fresh.length
            ? ` ${plural(A.fresh.length, "post")} from the last 3 days ${A.fresh.length === 1 ? "is" : "are"} still collecting views and ${A.fresh.length === 1 ? "isn't" : "aren't"} included yet.`
            : ""}
          {A.untagged ? ` ${plural(A.untagged, "post")} ${A.untagged === 1 ? "has" : "have"} no topic or format; tag them in Data to sharpen your DNA.` : ""}
        </p>
      </Section>

      <Section n="02" title="Your strongest patterns">
        {top3.length ? (
          top3.map((p) => <PatternCard key={p.id} p={p} A={A} state={state} onDismiss={dismiss} onFixTags={() => setTab("data")} />)
        ) : (
          <div className="dna-card">
            <p>
              No pattern stands out with enough evidence yet. Your posts perform about the same, which is useful to know: an experiment is the
              fastest way to find one.
            </p>
          </div>
        )}
      </Section>

      <Section n="03" title="Your biggest opportunity">
        {topOpp ? (
          <>
            <OppCard o={topOpp} rank={1} onTest={() => startFromOpp(topOpp)} onOpenLab={() => setTab("lab")} />
            <button type="button" className="dna-why" onClick={() => setTab("ideas")}>
              See all {plural(A.opps.length, "opportunity", "opportunities")} →
            </button>
          </>
        ) : (
          <div className="dna-card">
            <p>No opportunity has enough evidence yet. Add more posts or run an experiment.</p>
          </div>
        )}
      </Section>

      <Section n="04" title="Something to stop doing">
        {weak ? (
          <div className="dna-card dna-pattern is-down">
            <div className="dna-card-top">
              <ConfPill conf={weak.conf} />
              <span className="dna-dim">{weak.dim === "hookStyle" ? "Hook" : weak.dim === "lengthBucket" ? "Length" : weak.dim === "topic" ? "Topic" : "Format"}</span>
            </div>
            <h4 style={{ marginTop: 10 }}>{weak.name}</h4>
            <p className="dna-big">
              take {Math.round(weak.share * 100)}% of your posts
              {weak.lead ? ` but get ${leadText(weak.lead, otherPostsLabel(weak.dim))}` : ` but score ${Math.round(-weak.lift)} points lower`}.
            </p>
            <p className="dna-meta">
              {weak.beat} of {weak.n} fell below your usual. That&apos;s production time you could move to {top3[0] ? top3[0].name : "what works"}.
            </p>
            {weak.caveats.map((c) => (
              <p key={c} className="dna-caveat">
                {c}
              </p>
            ))}
            <p className="dna-meta">Not sure you want to stop? Make the next one shorter or in a different format, and let the Lab tell you.</p>
          </div>
        ) : (
          <div className="dna-card">
            <p>Nothing to stop. None of your repeated choices is clearly underperforming.</p>
          </div>
        )}
        {A.rep && (
          <div className="dna-card">
            <p className="dna-eyebrow">Getting repetitive</p>
            <p style={{ marginTop: 8, lineHeight: 1.55, fontSize: 14.5 }}>
              You opened {A.rep.n} of your last {A.rep.of} posts with {HOOK_STYLES[A.rep.style].label.toLowerCase()} hooks
              {A.rep.fading ? ", and they're fading: their scores have dropped as you've used them more." : ". Mix in a different opening so your audience doesn't tune out."}
            </p>
          </div>
        )}
      </Section>

      <Section n="05" title="Your next experiment">
        {running.length ? (
          <div className="dna-card">
            <p className="dna-eyebrow">In progress</p>
            <h4 style={{ marginTop: 6 }}>{running[0].title}</h4>
            <p className="dna-meta">{A.results[running[0].id].text}</p>
            <button type="button" className="dna-btn" onClick={() => setTab("lab")}>
              Open the Lab
            </button>
          </div>
        ) : topOpp ? (
          <div className="dna-card">
            <h4>{topOpp.title}</h4>
            <p className="dna-meta">
              Change one thing: {topOpp.todo} Then we compare your {METRICS[topOpp.metric].label} against your usual{" "}
              {fmtMetric(topOpp.metric, topOpp.baseline)}.
            </p>
            <button type="button" className="dna-btn" onClick={() => startFromOpp(topOpp)}>
              Start this experiment
            </button>
          </div>
        ) : (
          <div className="dna-card">
            <p>Design your own in the Lab.</p>
          </div>
        )}
        <div className="dna-card">
          <p className="dna-eyebrow">My Content DNA</p>
          <p className="dna-meta">Turn this into a card for your Stories. Labels only, never your numbers.</p>
          <button type="button" className="dna-btn" onClick={() => setTab("share")}>
            Make my card
          </button>
        </div>
      </Section>
    </>
  );
}

/* ---------- Opportunities tab (the prototype's Mb) ---------- */

function Opportunities({
  A,
  state,
  update,
  startFromOpp,
  setTab,
}: {
  A: DnaAnalysis;
  state: DnaState;
  update: (fn: Partial<DnaState> | ((s: DnaState) => DnaState)) => void;
  startFromOpp: (o: DnaOpportunity) => DnaExperiment;
  setTab: (t: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    const fresh = A.opps.slice(0, 3).map((o) => o.id);
    if (fresh.some((id) => !state.seenOpps.includes(id))) {
      update((s) => ({ ...s, seenOpps: [...new Set([...s.seenOpps, ...fresh])] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [A.opps]);

  if (!A.enough) {
    return (
      <div className="dna-card">
        <p>Opportunities unlock once you have 8 posts with results.</p>
      </div>
    );
  }
  const decide = (o: DnaOpportunity, d: string) =>
    update((s) => {
      const decisions = { ...s.decisions };
      if (decisions[o.id] === d) delete decisions[o.id];
      else decisions[o.id] = d;
      return { ...s, decisions };
    });
  const list = filter === "saved" ? A.opps.filter((o) => state.decisions[o.id] === "saved") : A.opps;
  const rejectedCount = Object.keys(state.decisions).filter((k) => state.decisions[k] === "rejected").length;
  return (
    <>
      <p className="dna-lede">
        Built from your own history, ranked by business value for {OBJECTIVES[state.objective].short}, strength of evidence and effort. What you
        test, save or pass on changes what shows up next.
      </p>
      <div className="dna-chips">
        <button type="button" className={`dna-chip-btn${filter === "all" ? " is-on" : ""}`} onClick={() => setFilter("all")}>
          All {A.opps.length}
        </button>
        <button type="button" className={`dna-chip-btn${filter === "saved" ? " is-on" : ""}`} onClick={() => setFilter("saved")}>
          Saved
        </button>
      </div>
      {list.map((o) => (
        <OppCard
          key={o.id}
          o={o}
          rank={A.opps.indexOf(o) + 1}
          saved={state.decisions[o.id] === "saved"}
          onTest={() => startFromOpp(o)}
          onSave={() => decide(o, "saved")}
          onReject={() => decide(o, "rejected")}
          onOpenLab={() => setTab("lab")}
        />
      ))}
      {rejectedCount > 0 && (
        <p className="dna-fine">
          You passed on {plural(rejectedCount, "idea")}. We&apos;ll show fewer like them.{" "}
          <button
            type="button"
            className="dna-inline"
            onClick={() => update((s) => ({ ...s, decisions: Object.fromEntries(Object.entries(s.decisions).filter(([, v]) => v !== "rejected")) }))}
          >
            Bring them back
          </button>
        </p>
      )}
    </>
  );
}

/* ---------- Lab tab (the prototype's _b) ---------- */

function ExperimentCard({
  exp,
  A,
  update,
  startChallenge,
}: {
  exp: DnaExperiment;
  A: DnaAnalysis;
  update: (fn: Partial<DnaState> | ((s: DnaState) => DnaState)) => void;
  startChallenge: (e: DnaExperiment) => void;
}) {
  const result = A.results[exp.id] || experimentResult(exp, A.all);
  const verdict = VERDICTS[result.verdict];
  const [picking, setPicking] = useState(false);
  const togglePost = (id: string) =>
    update((s) => ({
      ...s,
      experiments: s.experiments.map((x) =>
        x.id === exp.id ? { ...x, postIds: x.postIds.includes(id) ? x.postIds.filter((p) => p !== id) : [...x.postIds, id] } : x
      ),
    }));
  return (
    <div className="dna-card">
      <div className="dna-card-top">
        <span className="dna-conf" style={{ "--tone": verdict.color } as React.CSSProperties}>
          {exp.status === "done" ? verdict.label : result.verdict === "collecting" ? verdict.label : verdict.label}
        </span>
        <span className="dna-dim">{exp.status === "done" ? "Finished" : "Running"}</span>
      </div>
      <h4 style={{ marginTop: 10 }}>{exp.title}</h4>
      {exp.change && <p className="dna-meta">Change one thing: {exp.change}</p>}
      {exp.hypothesis && <p className="dna-meta">{exp.hypothesis}</p>}
      <p className="dna-meta">{result.text}</p>
      {result.values.length > 0 && (
        <EvidenceList
          posts={result.posts.filter((p) => result.values.some((v) => v.id === p.id))}
          metric={exp.metric}
        />
      )}
      <p className="dna-fine">
        Your usual {METRICS[exp.metric].label}: {fmtMetric(exp.metric, exp.baseline)} · aim: {fmtMetric(exp.metric, exp.target)} ·{" "}
        {plural(exp.postIds.length, "test post")} logged
      </p>
      {exp.status === "running" && (
        <>
          <div className="dna-actions">
            <button type="button" className="dna-ghost dna-sm" onClick={() => setPicking(!picking)}>
              {picking ? "Done picking" : "Log test posts"}
            </button>
            <button
              type="button"
              className="dna-ghost dna-sm"
              onClick={() =>
                update((s) => ({
                  ...s,
                  experiments: s.experiments.map((x) => (x.id === exp.id ? { ...x, status: "done", verdict: result.verdict } : x)),
                }))
              }
            >
              Finish experiment
            </button>
            <button type="button" className="dna-ghost dna-sm" onClick={() => startChallenge(exp)}>
              Start the 30-Day Challenge
            </button>
          </div>
          {picking && (
            <ul className="dna-postpick">
              {A.all.map((p) => (
                <li key={p.id}>
                  <label>
                    <input type="checkbox" checked={exp.postIds.includes(p.id)} onChange={() => togglePost(p.id)} />
                    <span>
                      “{p.title}” · {fmtDateShort(p.date)} · {p.platform}
                      {p.fresh ? " · still collecting views" : ""}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Lab({
  A,
  state,
  update,
  startChallenge,
}: {
  A: DnaAnalysis;
  state: DnaState;
  update: (fn: Partial<DnaState> | ((s: DnaState) => DnaState)) => void;
  startChallenge: (e: DnaExperiment) => void;
}) {
  const [designing, setDesigning] = useState(false);
  const [what, setWhat] = useState(EXPERIMENT_IDEAS[0]);
  const [change, setChange] = useState("");
  const [metric, setMetric] = useState("shareRate");
  const [minPosts, setMinPosts] = useState(3);
  const running = state.experiments.filter((e) => e.status === "running");
  const done = state.experiments.filter((e) => e.status === "done");

  const create = () => {
    const baseline = median(A.usable.filter((p) => p.m[metric] != null).map((p) => p.m[metric] as number)) || null;
    const exp: DnaExperiment = {
      id: `exp-${Date.now()}`,
      title: change.trim() || `Test a new ${what.toLowerCase()}`,
      what,
      change: change.trim(),
      metric,
      baseline,
      target: baseline == null ? null : baseline * 1.2,
      minPosts: Math.max(1, minPosts || 3),
      startedAt: Date.now(),
      postIds: [],
      status: "running",
    };
    update((s) => ({ ...s, experiments: [exp, ...s.experiments] }));
    setDesigning(false);
    setChange("");
  };

  return (
    <>
      <p className="dna-lede">
        Turn ideas into measurable tests. Change one thing, post it, and compare against your usual. We&apos;ll never call it proven on a handful
        of posts.
      </p>
      {designing ? (
        <div className="dna-card">
          <p className="dna-eyebrow">Design your own experiment</p>
          <div className="dna-form">
            <label>
              What will you change?
              <select className="dna-input dna-select" value={what} onChange={(e) => setWhat(e.target.value)}>
                {EXPERIMENT_IDEAS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Describe the change
              <input className="dna-input" value={change} onChange={(e) => setChange(e.target.value)} placeholder="Open every video with a bold claim" />
            </label>
            <label>
              How will we know it worked?
              <select className="dna-input dna-select" value={metric} onChange={(e) => setMetric(e.target.value)}>
                {Object.keys(METRICS).map((k) => (
                  <option key={k} value={k}>
                    {METRICS[k].title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Test posts needed
              <input className="dna-input" type="number" min={1} max={10} value={minPosts} onChange={(e) => setMinPosts(+e.target.value)} />
            </label>
          </div>
          <div className="dna-actions">
            <button type="button" className="dna-btn" onClick={create}>
              Start experiment
            </button>
            <button type="button" className="dna-ghost" onClick={() => setDesigning(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="dna-ghost dna-full" disabled={!A.usable.length} onClick={() => setDesigning(true)}>
          + Design your own experiment
        </button>
      )}
      {!running.length && !done.length && !designing && (
        <div className="dna-card">
          <p>No experiments yet. Pick one from Opportunities with “Test it”, or design your own.</p>
        </div>
      )}
      {running.map((e) => (
        <ExperimentCard key={e.id} exp={e} A={A} update={update} startChallenge={startChallenge} />
      ))}
      {done.length > 0 && <p className="dna-step">What you&apos;ve learned</p>}
      {done.map((e) => (
        <ExperimentCard key={e.id} exp={e} A={A} update={update} startChallenge={startChallenge} />
      ))}
    </>
  );
}

/* ---------- 30-Day Challenge tab (the prototype's Ub) ---------- */

function Challenge({
  A,
  state,
  update,
  startChallenge,
  startFromOpp,
  creatorName,
}: {
  A: DnaAnalysis;
  state: DnaState;
  update: (fn: Partial<DnaState> | ((s: DnaState) => DnaState)) => void;
  startChallenge: (e: DnaExperiment) => void;
  startFromOpp: (o: DnaOpportunity, silent?: boolean) => DnaExperiment;
  creatorName: string;
}) {
  const ch = state.challenge;
  const exp = ch ? state.experiments.find((e) => e.id === ch.experimentId) : undefined;
  const running = state.experiments.filter((e) => e.status === "running");
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (!ch || !exp) {
    return (
      <>
        <h2 className="dna-reveal">
          THE 30-DAY<span>CONTENT DNA CHALLENGE</span>
        </h2>
        <p className="dna-lede">
          Pick one improvement from your DNA and run it for 30 days. At the end you get a before-and-after report. It rewards showing up,
          experimenting and learning, not follower counts or viral views.
        </p>
        <ol className="dna-howto">
          <li>
            <b>Discover</b> your Content DNA.
          </li>
          <li>
            <b>Choose</b> one improvement to test.
          </li>
          <li>
            <b>Run it</b> for 30 days and check in each week.
          </li>
          <li>
            <b>See</b> your before-and-after, and share it if you want to.
          </li>
        </ol>
        {running.map((e) => (
          <div key={e.id} className="dna-card">
            <h4>{e.title}</h4>
            <button type="button" className="dna-btn" onClick={() => startChallenge(e)}>
              Start the challenge with this
            </button>
          </div>
        ))}
        {!running.length && A.opps[0] && (
          <div className="dna-card">
            <p className="dna-eyebrow">Suggested from your DNA</p>
            <h4 style={{ marginTop: 6 }}>{A.opps[0].title}</h4>
            <button type="button" className="dna-btn" onClick={() => startChallenge(startFromOpp(A.opps[0], true))}>
              Start the challenge with this
            </button>
          </div>
        )}
        {!A.enough && (
          <div className="dna-card">
            <p>Discover your DNA first. You need 8 posts with results.</p>
          </div>
        )}
      </>
    );
  }

  const now = Date.now();
  const day = Math.max(1, Math.min(30, Math.floor((now - ch.startedAt) / 864e5) + 1));
  const result = A.results[exp.id];
  const week = Math.floor((now - ch.startedAt) / (7 * 864e5));
  const checkedWeeks = new Set(ch.checkins.map((c) => Math.floor((c - ch.startedAt) / (7 * 864e5))));
  const checkedThisWeek = checkedWeeks.has(week);
  const before = A.usable.filter((p) => {
    const t = new Date(p.date).getTime();
    return t < ch.startedAt && t >= ch.startedAt - 30 * 864e5;
  });
  const after = A.all.filter((p) => new Date(p.date).getTime() >= ch.startedAt && !p.fresh);
  const beforeMed = median(before.filter((p) => p.m[exp.metric] != null).map((p) => p.m[exp.metric] as number));
  const afterMed = median(after.filter((p) => p.m[exp.metric] != null).map((p) => p.m[exp.metric] as number));
  const milestones: [string, boolean][] = [
    ["Discovered your Content DNA", true],
    ["Chose one improvement", true],
    ["Logged your first test post", exp.postIds.length >= 1],
    [`Logged ${exp.minPosts} test posts`, exp.postIds.length >= exp.minPosts],
    ["Checked in 2 different weeks", checkedWeeks.size >= 2],
    ["Finished all 30 days", !!ch.completedAt],
  ];
  const doneCount = milestones.filter(([, d]) => d).length;
  const R = 52;
  const circ = 2 * Math.PI * R;
  const shareText = `${ch.completedAt ? "I finished" : "I'm taking"} the 30-Day Content DNA Challenge. What's your Content DNA? ${DNA_SHARE_URL}`;

  return (
    <>
      <div className="dna-ring-wrap">
        <svg className="dna-ring" viewBox="0 0 130 130" width="104" height="104" aria-label={`Day ${day} of 30`}>
          <defs>
            <linearGradient id="dnaRing" x1="0" x2="1">
              <stop offset="0" stopColor="#a78bfa" />
              <stop offset="1" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <circle cx="65" cy="65" r={R} fill="none" stroke="rgba(167,139,250,.18)" strokeWidth="10" />
          <circle
            cx="65"
            cy="65"
            r={R}
            fill="none"
            stroke="url(#dnaRing)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - day / 30)}
            transform="rotate(-90 65 65)"
          />
          <text x="65" y="62" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="800">
            {day}
          </text>
          <text x="65" y="84" textAnchor="middle" fill="#a8a1c9" fontSize="11">
            of 30 days
          </text>
        </svg>
        <div>
          <p className="dna-eyebrow">Your challenge</p>
          <h4 style={{ fontSize: 17, marginTop: 4 }}>{exp.title}</h4>
          <p className="dna-meta">
            {doneCount} of {milestones.length} milestones · {plural(exp.postIds.length, "test post")} logged
          </p>
        </div>
      </div>
      <button
        type="button"
        className="dna-cta"
        disabled={checkedThisWeek}
        onClick={() => update((s) => (s.challenge ? { ...s, challenge: { ...s.challenge, checkins: [...s.challenge.checkins, Date.now()] } } : s))}
      >
        {checkedThisWeek ? `Week ${week + 1} check-in done ✓` : `Check in for week ${week + 1}`}
      </button>
      <ul className="dna-milestones">
        {milestones.map(([label, done]) => (
          <li key={label} className={done ? "is-done" : ""}>
            {done ? "✓ " : "○ "}
            {label}
          </li>
        ))}
      </ul>
      <div className="dna-card">
        <p className="dna-eyebrow">Before &amp; after · {METRICS[exp.metric].label}</p>
        <p className="dna-big">
          Before: {fmtMetric(exp.metric, beforeMed || null)} · Since you started: {fmtMetric(exp.metric, afterMed || null)}
        </p>
        <p className="dna-meta">{result ? result.text : ""}</p>
      </div>
      <div className="dna-sharecard">
        <p className="dna-eyebrow">30-Day Content DNA Challenge</p>
        <p className="dna-big-lines" style={{ marginTop: 10 }}>
          {ch.completedAt ? "I FINISHED" : "I'M TAKING THE"}
          <span>30-DAY CHALLENGE.</span>
        </p>
        <dl className="dna-share-rows">
          <div>
            <dt>What I tested</dt>
            <dd>{exp.title}</dd>
          </div>
          <div>
            <dt>What I learned</dt>
            <dd>{result ? VERDICTS[result.verdict].label : "Still collecting results"}</dd>
          </div>
          <div>
            <dt>Achievements</dt>
            <dd>
              {doneCount} of {milestones.length} milestones
            </dd>
          </div>
        </dl>
        <p className="dna-fine dna-center">
          {creatorName ? `${creatorName} · ` : ""}
          {DNA_SHARE_URL}
        </p>
      </div>
      <div className="dna-actions">
        <button type="button" className="dna-btn" onClick={() => void copyText(shareText).then(() => toast("Share text copied — paste it anywhere"))}>
          Copy share text
        </button>
        {!ch.completedAt && day >= 30 && (
          <button
            type="button"
            className="dna-ghost"
            onClick={() => update((s) => (s.challenge ? { ...s, challenge: { ...s.challenge, completedAt: Date.now() } } : s))}
          >
            Finish the challenge
          </button>
        )}
        <button
          type="button"
          className="dna-ghost"
          onClick={() => {
            if (confirmLeave) update({ challenge: null });
            else {
              setConfirmLeave(true);
              setTimeout(() => setConfirmLeave(false), 3500);
            }
          }}
        >
          {confirmLeave ? "Tap again to leave (your experiment stays in the Lab)" : "Leave the challenge"}
        </button>
      </div>
    </>
  );
}

/* ---------- Share tab (the prototype's Hb) ---------- */

function Share({
  A,
  state,
  update,
  creatorName,
}: {
  A: DnaAnalysis;
  state: DnaState;
  update: (fn: Partial<DnaState> | ((s: DnaState) => DnaState)) => void;
  creatorName: string;
}) {
  if (!A.enough) {
    return (
      <div className="dna-card">
        <p>Your card unlocks once your DNA has been discovered (8+ posts).</p>
      </div>
    );
  }
  const s = state.share;
  const running = state.experiments.find((e) => e.status === "running");
  const topTopic = A.strengths.find((p) => p.dim === "topic");
  const topFormat = A.strengths.find((p) => p.dim === "format");
  const top = A.strengths[0];
  const rows: [string, string, string | null][] = [
    ["characteristic", "Strongest characteristic", top ? `${top.name}${top.lead ? ` ${LEAD_PHRASES[top.lead.key]}` : ""}` : null],
    ["topic", "Strongest verified topic", topTopic ? topTopic.value : null],
    ["format", "Most effective format", topFormat ? topFormat.value : null],
    ["opportunity", "Biggest growth opportunity", A.opps[0] ? A.opps[0].title : null],
    ["experiment", "Next experiment", running ? running.title : null],
  ];
  const visible = rows.filter(([key, , v]) => v && s[key]);
  const toggle = (k: string) => update((st) => ({ ...st, share: { ...st.share, [k]: !st.share[k] } }));
  const shareText = `This is my Content DNA. What's yours? ${DNA_SHARE_URL}`;
  return (
    <>
      <p className="dna-lede">
        Your card shows labels only. Views, revenue, audience numbers and private analytics are never on it. You choose every line.
      </p>
      <div className="dna-sharecard">
        <p className="dna-eyebrow">Vestra Content DNA</p>
        <Helix a={A} />
        {s.name && creatorName && <p style={{ fontWeight: 700, fontSize: 16 }}>{creatorName}</p>}
        {s.identity && <p className="dna-arch" style={{ fontSize: 22 }}>{A.identity.name}</p>}
        <p className="dna-big-lines" style={{ marginTop: 12 }}>
          THIS IS MY<span>CONTENT DNA.</span>
        </p>
        <dl className="dna-share-rows">
          {visible.map(([key, label, v]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="dna-fine dna-center" style={{ fontSize: 14, color: "#fff", fontWeight: 700, letterSpacing: ".06em" }}>
          WHAT&apos;S YOUR DNA? · {DNA_SHARE_URL}
        </p>
      </div>
      <div className="dna-actions">
        <button type="button" className="dna-btn" onClick={() => void copyText(shareText).then(() => toast("Share text copied — paste it anywhere"))}>
          Copy share text
        </button>
      </div>
      <p className="dna-fine">Copy-only: UltraVestra never posts for you. Paste the text wherever you share.</p>
      <p className="dna-step">What&apos;s on your card</p>
      <div className="dna-toggles">
        {(
          [
            ["name", "My name", !!creatorName, "No name on your profile"],
            ["identity", "Creator identity", true, ""],
            ...rows.map(([k, label, v]): [string, string, boolean, string] => [
              k,
              label,
              !!v,
              k === "experiment" ? "Start an experiment to add this" : "Not enough evidence yet",
            ]),
          ] as [string, string, boolean, string][]
        ).map(([k, label, available, why]) => (
          <label key={k} className={`dna-toggle${available ? "" : " is-off"}`}>
            <input type="checkbox" checked={!!s[k] && available} disabled={!available} onChange={() => toggle(k)} />
            <span>
              {label}
              {!available && <em>{why}</em>}
            </span>
          </label>
        ))}
      </div>
    </>
  );
}

/* ---------- Data tab (the prototype's Yb) ---------- */

function DataTab({
  A,
  state,
  update,
}: {
  A: DnaAnalysis;
  state: DnaState;
  update: (fn: Partial<DnaState> | ((s: DnaState) => DnaState)) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* --- change data source (live-proof fix, 2026-11-23): until
   * now the only route back to the source chooser was deleting
   * all DNA data. The switcher returns the user to the same
   * three sources Discover offers, WITHOUT touching the rest of
   * their DNA state. --- */
  const [switching, setSwitching] = useState(false);
  const switchFileRef = useRef<HTMLInputElement>(null);

  /* "Use my Ultra Vestra posts" under the same live rule the
   * Discover chooser uses — enabled only when ≥1 posted pipeline
   * video has results — re-read each time the switcher opens, so
   * a video posted since the page loaded is counted. */
  const [appSource, setAppSource] = useState<{ count: number; posts: DnaPost[] }>({ count: 0, posts: [] });
  useEffect(() => {
    if (!switching) return;
    const s = dnaSourceFromPipeline(loadPipelineState().items);
    setAppSource({ count: s.count, posts: s.posts });
  }, [switching]);

  /* Switching source REPLACES the working post set — the demo's
   * Data-source behavior — and nothing else: experiments, the
   * challenge, snapshots and the goal all stay as they are.
   * "Delete all Content DNA data" (Privacy, below) remains the
   * separate, destructive full reset. */
  const switchSource = (source: string, posts: DnaPost[], label: string) => {
    update((s) => ({ ...s, posts, source }));
    setSwitching(false);
    setMsg(`Data source changed: ${label}. Your experiments, challenge and history are unchanged.`);
  };

  const onSwitchFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = parsePostsCsv(String(reader.result || ""));
      if (r.error) {
        setMsg(r.error);
        return;
      }
      switchSource("import", r.posts, `${plural(r.posts.length, "post")} from ${f.name}${r.skipped ? ` (${r.skipped} rows skipped)` : ""}`);
    };
    reader.readAsText(f);
  };

  const addPosts = (posts: DnaPost[], source: string) =>
    update((s) => {
      const kept = s.posts.filter((p) => p.source !== "sample" && !posts.some((n) => n.id === p.id));
      return { ...s, posts: [...kept, ...posts], source: s.source === "sample" || !s.source ? source : s.source };
    });

  const onFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = parsePostsCsv(String(reader.result || ""));
      if (r.error) {
        setMsg(r.error);
        return;
      }
      const hadSample = state.posts.some((p) => p.source === "sample");
      addPosts(r.posts, "import");
      setMsg(
        `Imported ${plural(r.posts.length, "post")}${r.skipped ? ` and skipped ${plural(r.skipped, "row")} without a date or views` : ""}.${hadSample ? " The sample data was replaced with your posts." : ""} Your DNA has been updated.`
      );
    };
    reader.readAsText(f);
  };

  const counts: Record<string, number> = {};
  state.posts.forEach((p) => {
    counts[p.source] = (counts[p.source] || 0) + 1;
  });
  const sorted = [...A.all].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const shown = showAll ? sorted : sorted.slice(0, 8);
  const topics = [...new Set(state.posts.map((p) => p.topic).filter(Boolean))];
  const formats = [...new Set(state.posts.map((p) => p.format).filter(Boolean))];
  const editPost = (id: string, patch: Partial<DnaPost>) =>
    update((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? { ...p, ...patch, edited: true } : p)) }));

  return (
    <>
      <p className="dna-step" style={{ marginTop: 0 }}>
        Data sources
      </p>
      <div className="dna-card">
        {Object.keys(counts).map((k) => (
          <p key={k} className="dna-meta">
            {SOURCES[k] || k}: {plural(counts[k], "post")}
          </p>
        ))}
        {state.source === "sample" && (
          <p className="dna-caveat">You&apos;re looking at sample data, not your own. Import your analytics to see your real DNA.</p>
        )}
        <div className="dna-actions">
          <button type="button" className="dna-btn" onClick={() => fileRef.current?.click()}>
            Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv,.tsv,.txt" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
          <a className="dna-ghost" href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`} download="content-dna-template.csv">
            CSV template
          </a>
          <button type="button" className="dna-ghost dna-sm" onClick={() => setSwitching(!switching)}>
            Change data source
          </button>
        </div>
        {switching && (
          <div className="dna-sources">
            <button
              type="button"
              className={`dna-source${state.source === "app" ? " is-on" : ""}`}
              disabled={!appSource.count}
              onClick={() => switchSource("app", appSource.posts, `${plural(appSource.count, "post")} from Ultra Vestra`)}
            >
              <strong>Use my Ultra Vestra posts</strong>
              <span>{appSource.count ? `${plural(appSource.count, "post")} with results` : "No posted videos with results yet"}</span>
            </button>
            <button type="button" className={`dna-source${state.source === "import" ? " is-on" : ""}`} onClick={() => switchFileRef.current?.click()}>
              <strong>Import my analytics</strong>
              <span>CSV export from TikTok, Instagram or YouTube — replaces your current posts</span>
            </button>
            <input ref={switchFileRef} type="file" accept=".csv,text/csv,.tsv,.txt" hidden onChange={(e) => onSwitchFile(e.target.files?.[0] || null)} />
            <button
              type="button"
              className={`dna-source${state.source === "sample" ? " is-on" : ""}`}
              onClick={() => switchSource("sample", samplePosts(), "31 example posts from a sample creator")}
            >
              <strong>Explore with sample data</strong>
              <span>See how it works before using your own posts</span>
            </button>
            <button type="button" className="dna-ghost dna-sm" onClick={() => setSwitching(false)}>
              Keep my current data
            </button>
          </div>
        )}
        <div className="dna-connect">
          {["TikTok", "Instagram", "YouTube"].map((p) => (
            <button
              key={p}
              type="button"
              className="dna-ghost dna-sm"
              onClick={() => setMsg(`Connecting ${p} directly needs Ultra Vestra's server. Until then, export your ${p} analytics and import the CSV.`)}
            >
              Connect {p}
            </button>
          ))}
        </div>
        {msg && <p className="dna-fine">{msg}</p>}
        <p className="dna-fine">
          Content DNA updates when you add posts, log results, finish an experiment or change your goal. It isn&apos;t live, so check the date on
          your last analysis.
        </p>
      </div>

      <p className="dna-step">Your goal</p>
      <div className="dna-chips">
        {Object.keys(OBJECTIVES).map((k) => (
          <button
            key={k}
            type="button"
            className={`dna-chip-btn${state.objective === k ? " is-on" : ""}`}
            onClick={() => update({ objective: k })}
          >
            {OBJECTIVES[k].label}
          </button>
        ))}
      </div>

      <p className="dna-step">Correct your posts</p>
      <p className="dna-fine">Wrong topic, format or hook? Fix it here and your DNA re-learns from the corrected tags.</p>
      <datalist id="dna-topics">
        {topics.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <datalist id="dna-formats">
        {formats.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <ul className="dna-edit">
        {shown.map((p) => (
          <li key={p.id}>
            <p className="dna-edit-title">
              “{p.title}” · {fmtDateShort(p.date)} · {p.platform} · {p.views.toLocaleString()} views
            </p>
            <div className="dna-edit-grid">
              <input className="dna-input" list="dna-topics" value={p.topic} aria-label="Topic" onChange={(e) => editPost(p.id, { topic: e.target.value })} />
              <input className="dna-input" list="dna-formats" value={p.format} aria-label="Format" onChange={(e) => editPost(p.id, { format: e.target.value })} />
              <select className="dna-input dna-select" value={p.hookStyle} aria-label="Hook style" onChange={(e) => editPost(p.id, { hookStyle: e.target.value })}>
                {Object.keys(HOOK_STYLES).map((k) => (
                  <option key={k} value={k}>
                    {HOOK_STYLES[k].label}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ul>
      {sorted.length > 8 && (
        <button type="button" className="dna-why" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer" : `Show all ${sorted.length} posts`}
        </button>
      )}

      <p className="dna-step">Analysis history</p>
      <ul className="dna-history">
        {[...state.snapshots].reverse().map((s) => (
          <li key={s.at}>
            <b>{fmtDateTime(s.at)}</b> · {s.reason} · {plural(s.posts, "post")}
            {s.top.length > 0 && <span>Top: {s.top.join(", ")}</span>}
          </li>
        ))}
      </ul>

      <p className="dna-step">Privacy</p>
      <div className="dna-card">
        <p className="dna-meta">
          Only you see your analysis. Your posts and results stay on this device — Content DNA keeps them in this browser, not on Ultra
          Vestra&apos;s servers. Nothing is shared unless you choose to share it.
        </p>
        <div className="dna-actions">
          <button
            type="button"
            className="dna-ghost dna-sm"
            onClick={() => {
              if (confirmDelete) {
                update(() => ({ ...EMPTY_DNA_STATE }));
                setConfirmDelete(false);
              } else {
                setConfirmDelete(true);
                setTimeout(() => setConfirmDelete(false), 3500);
              }
            }}
          >
            {confirmDelete ? "Tap again to delete everything. This can't be undone." : "Delete all Content DNA data"}
          </button>
        </div>
      </div>
    </>
  );
}
