"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  loadMarket2State,
  saveMarket2State,
  seedMarket2State,
  type M2State,
} from "@/lib/marketplace2";
import { Avatar, Icon } from "@/components/marketplace/Mkt";

/* Shared building blocks for the marketplace v2 home pages — the
 * store hook over "uv-market.v2" (mirroring the v1 hook's shape:
 * load once on mount, clone-mutate-persist updates, toast, and the
 * prototype's simulated other-side replies), plus the prototype's
 * KPI grid, bar list, progress bar and dashboard header row as React
 * components over the scoped .mkt stylesheet. */

export function useMarket2Store() {
  const [state, setState] = useState<M2State | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setState(loadMarket2State());
    const stash = timers.current;
    return () => {
      stash.forEach(clearTimeout);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const update = useCallback((fn: (draft: M2State) => void) => {
    setState((prev) => {
      if (!prev) return prev;
      const next: M2State = JSON.parse(JSON.stringify(prev));
      fn(next);
      saveMarket2State(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = seedMarket2State(Date.now());
    saveMarket2State(fresh);
    setState(fresh);
  }, []);

  /** The prototype's demoReply: after a delay, apply a transition to
   *  the freshest copy of a collab — only used for sample businesses
   *  and creators that are not the user's own. */
  const demoReply = useCallback(
    (collabId: string, fn: (draft: M2State) => void, delay?: number) => {
      const t = setTimeout(() => {
        setState((prev) => {
          if (!prev) return prev;
          if (!prev.collabs.some((x) => x.id === collabId)) return prev;
          const next: M2State = JSON.parse(JSON.stringify(prev));
          fn(next);
          saveMarket2State(next);
          return next;
        });
      }, delay ?? 2600);
      timers.current.push(t);
    },
    []
  );

  return { state, update, reset, notify, toast, demoReply };
}

export function SectionHead({ title, right }: { title: string; right?: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {right ? <span className="label">{right}</span> : null}
    </div>
  );
}

export function KpiGrid({ items }: { items: [string, string, string?][] }) {
  return (
    <div className="kpis">
      {items.map(([v, label, color]) => (
        <div key={label} className="glass kpi">
          <b style={color ? { color } : undefined}>{v}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function Progress({ frac }: { frac: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, frac)) * 100);
  return (
    <div className="prog" role="img" aria-label={`${pct}% complete`}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export interface BarRow {
  label: string;
  value: number;
  text: string;
  sub?: string;
  color?: string;
}

/** The prototype's barList — funnel-style bars normalized to the
 *  largest row. */
export function BarList({ rows }: { rows: BarRow[] }) {
  const max = Math.max(...rows.map((r) => r.value), 0.0001);
  return (
    <div className="glass pad funnel">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="fstep">
            <span className="muted">{r.label}</span>
            <div className="bar2">
              <i
                style={{
                  width: `${Math.max(3, (r.value / max) * 100)}%`,
                  background: r.color || "#B69CFF",
                }}
              />
            </div>
            <b>{r.text}</b>
          </div>
          {r.sub ? (
            <div className="faint" style={{ fontSize: 11, margin: "-4px 0 4px 96px" }}>
              {r.sub}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Dashboard header row: avatar, name, sub-line, optional gear. */
export function HeaderRow({
  label,
  id,
  sub,
  onGear,
  gearLabel,
}: {
  label: string;
  id: string;
  sub: string;
  onGear?: () => void;
  gearLabel?: string;
}) {
  return (
    <div className="row" style={{ marginTop: 4 }}>
      <Avatar label={label} id={id} />
      <div className="grow">
        <div style={{ font: "700 20px var(--m-display)" }}>{label}</div>
        <div className="faint" style={{ fontSize: 13 }}>
          {sub}
        </div>
      </div>
      {onGear ? (
        <button
          type="button"
          className="icon-btn"
          aria-label={gearLabel || "Settings"}
          onClick={onGear}
        >
          <Icon name="gear" />
        </button>
      ) : null}
    </div>
  );
}

export function RowOf({ children }: { children: ReactNode }) {
  return <div className="row wrap">{children}</div>;
}
