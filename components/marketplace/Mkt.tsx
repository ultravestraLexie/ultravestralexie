"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  STEP,
  STEP_LABELS,
  colorFor,
  fmtK,
  initialsOf,
  loadMarketState,
  money,
  saveMarketState,
  seedMarketState,
  type CollabStats,
  type MarketCollab,
  type MarketState,
} from "@/lib/marketplace";

/* Shared building blocks for the local-gigs market surfaces — the
 * prototype's icons, avatars, match rings, sheets, sample banner and
 * toast, as React components over the scoped .mkt stylesheet
 * (lib/marketplace-css.ts). All state lives in the device-local
 * store (lib/marketplace.ts, "uv-market.v1"); nothing here talks to
 * the database. */

const ICON_PATHS: Record<string, ReactNode> = {
  back: <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  chev: <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  search: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></g>),
  briefcase: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></g>),
  user: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></g>),
  users: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14.8c1.8.7 3 2.4 3.5 5.2" /></g>),
  store: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10v10h16V10" /><path d="M3 10l2-6h14l2 6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M10 20v-5h4v5" /></g>),
  video: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></g>),
  chart: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18" /><path d="M6 16v-4" /><path d="M11 16V8" /><path d="M16 16v-6" /></g>),
  megaphone: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11v2a2 2 0 0 0 2 2h2l8 4V5L7 9H5a2 2 0 0 0-2 2z" /><path d="M18 9a3 3 0 0 1 0 6" /><path d="M7 15v4" /></g>),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  pin: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></g>),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />,
  plus: <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  star: <path d="M12 2.8l2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.13 6.38 20.1l1.07-6.27L2.9 9.4l6.3-.9z" fill="currentColor" />,
  shield: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></g>),
  msg: <path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  mail: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></g>),
  copy: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 5V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" /></g>),
  cal: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></g>),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  gear: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></g>),
  link: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></g>),
  dollar: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v18" /><path d="M17 7.5c0-1.9-2.2-3-5-3s-5 1.3-5 3.3c0 4.4 10 2.3 10 6.9 0 2-2.2 3.3-5 3.3s-5-1.2-5-3" /></g>),
  building: (<g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" /></g>),
  crown: <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? "i"}>
      {ICON_PATHS[name]}
    </svg>
  );
}

export function Avatar({
  label,
  id,
  round,
  sm,
}: {
  label: string;
  id: string;
  round?: boolean;
  sm?: boolean;
}) {
  return (
    <span
      className={`avatar${round ? " round" : ""}${sm ? " sm" : ""}`}
      style={{ background: colorFor(id) }}
      aria-hidden="true"
    >
      {initialsOf(label)}
    </span>
  );
}

export function Ring({ score, label }: { score: number; label?: string }) {
  return (
    <div
      className="ring"
      style={{
        background: `conic-gradient(var(--m-cyan) ${score}%, rgba(130,150,255,.15) 0)`,
      }}
      role="img"
      aria-label={`${score}% match`}
    >
      <b>{score}%</b>
      {label ? <small>{label}</small> : null}
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  sub,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {sub ? <p>{sub}</p> : null}
        {children}
      </div>
    </div>
  );
}

export function SheetActions({ children }: { children: ReactNode }) {
  return <div className="actions">{children}</div>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function ToastView({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {msg}
    </div>
  );
}

/** The prototype's sample banner, verbatim text, with its Reset. */
export function SampleBanner({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <div className="banner">
        <div className="grow">
          Sample data: every business, creator, customer and number here is
          made up to show how it works.
        </div>
        <button type="button" className="btn small ghost" onClick={() => setConfirming(true)}>
          Reset
        </button>
      </div>
      <Sheet
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Reset the sample data?"
        sub="This puts all sample data back the way it started and removes anything you added on this device."
      >
        <SheetActions>
          <button type="button" className="btn ghost" onClick={() => setConfirming(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setConfirming(false);
              onReset();
            }}
          >
            Reset
          </button>
        </SheetActions>
      </Sheet>
    </>
  );
}

export function Stepper({ collab }: { collab: MarketCollab }) {
  const stepN = collab.paid ? 6 : STEP[collab.status];
  return (
    <>
      <div className="steps" aria-label={`Step ${Math.min(6, stepN + 1)} of 6`}>
        {STEP_LABELS.map((_, i) => (
          <i key={i} className={i < stepN || (i === stepN && stepN < 6) ? "on" : undefined} />
        ))}
      </div>
      <div className="steps-l" aria-hidden="true">
        {STEP_LABELS.map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
    </>
  );
}

export function StatsBlock({
  stats,
  code,
  note,
}: {
  stats?: CollabStats;
  code?: string;
  note?: boolean;
}) {
  if (!stats) return null;
  const cells: [string, string][] = [
    [fmtK(stats.views), "Views"],
    [fmtK(stats.clicks), "Clicks"],
    [fmtK(stats.leads), "Leads"],
    [String(stats.customers), "Customers"],
    [money(stats.revenue), "Revenue"],
  ];
  return (
    <>
      <div className="stats4">
        {cells.map(([v, l]) => (
          <div key={l}>
            <b>{v}</b>
            <span>{l}</span>
          </div>
        ))}
      </div>
      {note ? (
        <div className="note" style={{ margin: "8px 2px 0" }}>
          Demo tracking. In the app these come from the tracking link and promo
          code {code}.
        </div>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------
// Store hook — loads the device-local state once on mount; `update`
// clones, mutates, persists and re-renders. `notify` shows a toast.
// `demoReply` is the prototype's simulated other side: after a delay
// it applies a transition to the freshest copy of a collab — only
// used for sample businesses/creators that are not the user's own.
// ---------------------------------------------------------------------

export function useMarketStore() {
  const [state, setState] = useState<MarketState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setState(loadMarketState());
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

  const update = useCallback((fn: (draft: MarketState) => void) => {
    setState((prev) => {
      if (!prev) return prev;
      const next: MarketState = JSON.parse(JSON.stringify(prev));
      fn(next);
      saveMarketState(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = seedMarketState(Date.now());
    saveMarketState(fresh);
    setState(fresh);
  }, []);

  const demoReply = useCallback(
    (collabId: string, fn: (draft: MarketState) => void, delay?: number) => {
      const t = setTimeout(() => {
        setState((prev) => {
          if (!prev) return prev;
          if (!prev.collabs.some((x) => x.id === collabId)) return prev;
          const next: MarketState = JSON.parse(JSON.stringify(prev));
          fn(next);
          saveMarketState(next);
          return next;
        });
      }, delay ?? 2600);
      timers.current.push(t);
    },
    []
  );

  return { state, update, reset, notify, toast, demoReply };
}
