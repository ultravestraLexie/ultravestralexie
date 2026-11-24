"use client";

import { useEffect, useMemo, useState } from "react";
import {
  WI_DISCLAIMER,
  WI_ORDER,
  WI_SCENARIOS,
  WI_STORE_KEY,
  wiDefaults,
  wiFmt,
  wiMoney,
  wiMoneyShort,
  wiYrs,
  type WiKey,
  type WiValues,
} from "@/lib/galaxy/economy";
import { EconWrap, EconHead, Ico, useEconToast } from "../economy/Econ";

type SavedCompare = { q: string; line: string };

type WiStore = {
  inputs: Partial<Record<WiKey, WiValues>>;
  saved: SavedCompare[];
};

function loadStore(): WiStore {
  const fallback: WiStore = { inputs: {}, saved: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(WI_STORE_KEY) || "null");
    if (!raw || typeof raw !== "object") return fallback;
    const inputs: Partial<Record<WiKey, WiValues>> = {};
    for (const key of WI_ORDER) {
      const saved = (raw.inputs ?? {})[key];
      if (!saved || typeof saved !== "object") continue;
      const vals = wiDefaults(key);
      for (const f of WI_SCENARIOS[key].inputs) {
        const n = saved[f.id];
        if (typeof n === "number" && Number.isFinite(n)) {
          vals[f.id] = Math.min(f.max, Math.max(f.min, n));
        }
      }
      inputs[key] = vals;
    }
    const saved = Array.isArray(raw.saved)
      ? raw.saved
          .filter(
            (s: unknown): s is SavedCompare =>
              !!s &&
              typeof s === "object" &&
              typeof (s as SavedCompare).q === "string" &&
              typeof (s as SavedCompare).line === "string"
          )
          .slice(0, 3)
      : [];
    return { inputs, saved };
  } catch {
    return fallback;
  }
}

/* The prototype's drawChart, same geometry: a 320×170 plot, dashed
 * stay path, glowing what-if path, end labels pushed apart when the
 * two paths finish close together. */
function WiChart({
  stay,
  what,
  years,
  stayName,
  whatName,
}: {
  stay: number[];
  what: number[];
  years: number;
  stayName: string;
  whatName: string;
}) {
  const W = 320;
  const H = 170;
  const pl = 8;
  const pr = 64;
  const pt = 14;
  const pb = 26;
  const all = stay.concat(what);
  const min = Math.min(0, Math.min(...all));
  let max = Math.max(...all);
  if (max === min) max = min + 1;
  const n = stay.length;
  const x = (i: number) => pl + (i * (W - pl - pr)) / (n - 1);
  const y = (v: number) => pt + ((max - v) * (H - pt - pb)) / (max - min);
  const d = (arr: number[]) =>
    arr.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
  let ys = y(stay[n - 1]);
  let yw = y(what[n - 1]);
  if (Math.abs(ys - yw) < 14) {
    if (yw <= ys) {
      yw -= 7;
      ys += 7;
    } else {
      yw += 7;
      ys -= 7;
    }
  }
  return (
    <svg
      viewBox="0 0 320 170"
      width="100%"
      role="img"
      aria-label={`${stayName} ends at ${wiMoney(stay[n - 1])}, ${whatName} ends at ${wiMoney(what[n - 1])} after ${wiYrs(years)}.`}
    >
      <line x1={pl} x2={W - pr} y1={H - pb} y2={H - pb} stroke="#26306A" strokeWidth="1" />
      {min < 0 ? (
        <line x1={pl} x2={W - pr} y1={y(0)} y2={y(0)} stroke="#3A4580" strokeWidth="1" strokeDasharray="3 4" />
      ) : null}
      <path d={d(stay)} fill="none" stroke="#8E98C8" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />
      <path d={d(what)} fill="none" stroke="rgba(182,156,255,.28)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d(what)} fill="none" stroke="#B69CFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(0)} cy={y(what[0])} r="5" fill="#F2F4FF" />
      <circle cx={x(n - 1)} cy={y(what[n - 1])} r="4.5" fill="#B69CFF" />
      <circle cx={x(n - 1)} cy={y(stay[n - 1])} r="3.5" fill="#8E98C8" />
      <text x={x(n - 1) + 8} y={yw + 4} fill="#B69CFF" fontSize="12" fontWeight="700" fontFamily="'Space Grotesk', system-ui, sans-serif">
        {wiMoneyShort(what[n - 1])}
      </text>
      <text x={x(n - 1) + 8} y={ys + 4} fill="#A3ACD6" fontSize="11" fontWeight="600" fontFamily="'Space Grotesk', system-ui, sans-serif">
        {wiMoneyShort(stay[n - 1])}
      </text>
      <text x={pl} y={H - 8} fill="#8E98C8" fontSize="11" fontFamily="Inter, system-ui, sans-serif">
        Today
      </text>
      <text x={W - pr} y={H - 8} fill="#8E98C8" fontSize="11" textAnchor="end" fontFamily="Inter, system-ui, sans-serif">
        Year {years}
      </text>
    </svg>
  );
}

/* The What If frame. All math lives in lib/galaxy/economy (the
 * prototype's own run() functions); this component is its rendering:
 * scenario tabs, sliders, chart, path totals, the ahead/behind box,
 * outcome range, trade-offs, and save-to-compare (kept on device). */
export default function WhatIfClient() {
  const toast = useEconToast();
  const [current, setCurrent] = useState<WiKey>("save");
  const [allValues, setAllValues] = useState<Record<WiKey, WiValues>>(() => ({
    save: wiDefaults("save"),
    career: wiDefaults("career"),
    move: wiDefaults("move"),
    creator: wiDefaults("creator"),
  }));
  const [saved, setSaved] = useState<SavedCompare[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const store = loadStore();
    if (Object.keys(store.inputs).length) {
      setAllValues((prev) => ({ ...prev, ...store.inputs }));
    }
    setSaved(store.saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(WI_STORE_KEY, JSON.stringify({ inputs: allValues, saved }));
    } catch {
      /* storage unavailable — state lives in this session */
    }
  }, [hydrated, allValues, saved]);

  const sc = WI_SCENARIOS[current];
  const v = allValues[current];
  const res = useMemo(() => sc.run(v, sc.variants[1]), [sc, v]);
  const n = res.stay.length;
  const sEnd = res.stay[n - 1];
  const wEnd = res.what[n - 1];
  const diff = wEnd - sEnd;

  const outcomes = ["Cautious", "Expected", "Optimistic"].map((name, i) => {
    const k = sc.variants[i];
    const r = sc.run(v, k);
    const dd = r.what[r.what.length - 1] - r.stay[r.stay.length - 1];
    return { name, mid: i === 1, value: (dd >= 0 ? "+" : "") + wiMoneyShort(dd), label: sc.variantLabel(v, k) };
  });

  const onSave = () => {
    const line =
      (diff >= 0 ? "+" : "") + wiMoney(diff) + " vs. " + sc.stay.toLowerCase() + " over " + wiYrs(v.years);
    setSaved((prev) => [{ q: sc.q(v), line }, ...prev].slice(0, 3));
    toast.show("Saved to compare");
  };

  return (
    <EconWrap>
      <article className="screen">
        <EconHead title="Vestra What If" sub="Compare the path you're on with the one you're considering" />
        <div className="tabs" aria-label="Scenarios">
          {WI_ORDER.map((key) => (
            <button
              className="tab"
              type="button"
              key={key}
              aria-pressed={current === key}
              onClick={() => setCurrent(key)}
            >
              {WI_SCENARIOS[key].tab}
            </button>
          ))}
        </div>
        <div className="body" style={{ paddingTop: 16 }}>
          <p className="wi-q">{sc.q(v)}</p>

          <div className="card pad">
            {sc.inputs.map((f) => (
              <div className="wi-field" key={f.id}>
                <div className="between">
                  <label htmlFor={`wi-${current}-${f.id}`}>{f.label}</label>
                  <output htmlFor={`wi-${current}-${f.id}`}>{wiFmt(v[f.id], f.unit)}</output>
                </div>
                <input
                  type="range"
                  id={`wi-${current}-${f.id}`}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={v[f.id]}
                  onChange={(e) =>
                    setAllValues((prev) => ({
                      ...prev,
                      [current]: { ...prev[current], [f.id]: parseFloat(e.target.value) },
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="card pad stack" style={{ gap: 8, position: "relative", overflow: "hidden" }}>
            <div className="legend">
              <span>
                <i style={{ background: "var(--e-faint)" }} />
                <span>{sc.stay}</span>
              </span>
              <span>
                <i style={{ background: "var(--e-purple)" }} />
                <span>{sc.what}</span>
              </span>
            </div>
            <WiChart stay={res.stay} what={res.what} years={v.years} stayName={sc.stay} whatName={sc.what} />
          </div>

          <div className="grid2">
            <div className="path-card">
              <div className="k">{sc.stay}</div>
              <b>{wiMoney(sEnd)}</b>
              <span>{sc.kind + " " + wiYrs(v.years)}</span>
            </div>
            <div className="path-card what">
              <div className="k">{sc.what}</div>
              <b>{wiMoney(wEnd)}</b>
              <span>{sc.kind + " " + wiYrs(v.years)}</span>
            </div>
          </div>

          <div className={`diff${diff < 0 ? " neg" : ""}`}>
            <b>{(diff >= 0 ? "+" : "") + wiMoney(diff) + (diff >= 0 ? " ahead" : " behind")}</b>
            <div style={{ fontSize: 13, color: "var(--e-text2)", marginTop: 4 }}>
              {sc.what} vs. {sc.stay.toLowerCase()}, after {wiYrs(v.years)}.
            </div>
          </div>

          <div className="stack" style={{ gap: 6 }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--e-text2)" }}>{res.summary}</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--e-text2)" }}>{res.extra}</p>
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <div className="label">Possible outcomes</div>
            <div className="outcomes">
              {outcomes.map((o) => (
                <div className={`outcome${o.mid ? " mid" : ""}`} key={o.name}>
                  <div className="k">{o.name}</div>
                  <b>{o.value}</b>
                  <span>{o.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <div className="label">Trade-offs</div>
            <div className="card list">
              {sc.trade.map((t, i) => (
                <div className="row" key={t}>
                  <span className={`ico ${i === 2 ? "purple" : "orange"}`}>
                    <Ico name={i === 2 ? "star" : "route"} />
                  </span>
                  <div className="grow">
                    <div className="t">{t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            className="btn"
            type="button"
            onClick={onSave}
            style={{ background: "var(--e-surface2)", border: "1px solid var(--e-purple)" }}
          >
            <Ico name="plus" className="i" />
            Save to compare
          </button>

          {saved.length > 0 ? (
            <div className="stack" style={{ gap: 8 }}>
              <div className="label">Compared scenarios</div>
              <div className="card list">
                {saved.map((s, idx) => (
                  <div className="row" key={idx}>
                    <div className="grow">
                      <div className="t">{s.q}</div>
                      <div className="s">{s.line}</div>
                    </div>
                    <button
                      className="x-btn"
                      type="button"
                      aria-label={`Remove ${s.q}`}
                      onClick={() => setSaved((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Ico name="x" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <p className="note">{WI_DISCLAIMER}</p>
        </div>
      </article>
      {toast.el}
    </EconWrap>
  );
}
