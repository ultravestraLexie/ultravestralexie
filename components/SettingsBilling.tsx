"use client";

import { useState } from "react";
import type { PlanState } from "@/lib/billing";

/* Settings — Plan & billing controls (trust queue #4). Self-serve
 * cancellation under the owner's policy: NO refunds; cancel
 * anytime and the plan stays active until the end of the current
 * paid period, then does not renew. The buttons call
 * POST /api/billing/cancel and /api/billing/resume, which set
 * cancel_at_period_end on the member's own Stripe subscription
 * and sync the local row; this component renders the state the
 * server hands back (initialized from the row the Settings page
 * read). Nothing here can issue a refund — no such path exists. */

const primaryButton: React.CSSProperties = {
  background: "linear-gradient(92deg, #a855f7, #d946ef)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 14,
  border: "none",
  borderRadius: 999,
  padding: "10px 20px",
  cursor: "pointer",
};

const quietButton: React.CSSProperties = {
  background: "transparent",
  color: "#ddd0ff",
  fontWeight: 700,
  fontSize: 14,
  border: "1px solid #7e22ce",
  borderRadius: 999,
  padding: "10px 20px",
  cursor: "pointer",
};

function fmtDate(value: string | null): string {
  if (!value) return "the end of the current period";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "the end of the current period";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    /* One date everywhere: the period end is a single instant, and
     * the Settings page renders its UTC date — format in UTC here
     * too, or a browser behind UTC shows the day before (battAR:
     * "Cancels on December 23" beside "period ends December 24"). */
    timeZone: "UTC",
  });
}

type BillingResponse = {
  success?: boolean;
  state?: PlanState;
  error?: string;
};

export default function SettingsBilling({
  planLabel,
  periodEnd,
  initialState,
}: {
  planLabel: string;
  periodEnd: string | null;
  initialState: PlanState;
}) {
  const [state, setState] = useState<PlanState>(initialState);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (state.kind !== "active" && state.kind !== "cancelling") return null;

  const endsLabel = fmtDate(
    state.kind === "cancelling" ? (state.endsOn ?? periodEnd) : periodEnd
  );

  async function act(path: "/api/billing/cancel" | "/api/billing/resume") {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch(path, { method: "POST" });
      const data = (await res.json().catch(() => null)) as BillingResponse | null;
      if (res.ok && data?.success && data.state) {
        setState(data.state);
        setConfirming(false);
        setMsg(
          data.state.kind === "cancelling"
            ? `Your plan will cancel on ${fmtDate(data.state.endsOn)}. You keep full access until then.`
            : "Your plan will renew as usual."
        );
      } else {
        setErr(data?.error ?? "Your plan could not be updated. Please try again.");
      }
    } catch {
      setErr("Your plan could not be updated. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div>
      {state.kind === "cancelling" ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 15, color: "#fda4af", fontWeight: 700 }}>
            Cancels on {endsLabel}
          </span>
          <button
            type="button"
            style={primaryButton}
            disabled={busy}
            onClick={() => void act("/api/billing/resume")}
          >
            {busy ? "Working…" : "Resume plan"}
          </button>
        </div>
      ) : confirming ? (
        <div>
          <p style={{ margin: "0 0 14px", fontSize: 15.5, color: "#ddd0ff" }}>
            Your {planLabel} stays active until {endsLabel}.{" "}
            {"After that it won't renew and access ends. No refund is given for the current period."}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              style={primaryButton}
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Keep my plan
            </button>
            <button
              type="button"
              style={quietButton}
              disabled={busy}
              onClick={() => void act("/api/billing/cancel")}
            >
              {busy ? "Working…" : "Cancel my plan"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          style={quietButton}
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          Cancel plan
        </button>
      )}
      {msg ? (
        <p role="status" style={{ margin: "12px 0 0", color: "#86efac", fontSize: 14.5 }}>
          {msg}
        </p>
      ) : null}
      {err ? (
        <p role="alert" style={{ margin: "12px 0 0", color: "#fca5a5", fontSize: 14.5 }}>
          {err}
        </p>
      ) : null}
    </div>
  );
}
