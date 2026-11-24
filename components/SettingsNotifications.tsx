"use client";

import { useState } from "react";
import type { NotificationPrefs } from "@/lib/galaxy/core";

/* Settings — Notifications (trust queue #6). Three toggles, one
 * per alert type buildAlerts can raise, saved through
 * POST /api/notifications the moment they change (optimistic —
 * a failed save puts the toggle back and says so). Alerts are
 * in-app only: they appear on Today. Email alerts are not
 * promised anywhere, because the sending domain is not live. */

const ROWS: {
  key: keyof NotificationPrefs;
  label: string;
  detail: string;
}[] = [
  {
    key: "overdue",
    label: "Overdue invoices",
    detail: "An invoiced deal passes its payment due date with money still owed.",
  },
  {
    key: "dueSoon",
    label: "Invoices due soon",
    detail: "An invoice is due today or within the next 3 days.",
  },
  {
    key: "quietDeals",
    label: "Quiet negotiations",
    detail: "A pitched or negotiating deal has not moved in 3 days.",
  },
];

export default function SettingsNotifications({
  initialPrefs,
}: {
  initialPrefs: NotificationPrefs;
}) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function toggle(key: keyof NotificationPrefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prefs", ...next }),
      });
      const data = (await res.json().catch(() => null)) as {
        prefs?: NotificationPrefs;
        error?: string;
      } | null;
      if (res.ok && data?.prefs) {
        setPrefs(data.prefs);
        setMsg("Alert settings saved.");
      } else {
        setPrefs(prefs);
        setErr(data?.error ?? "Your alert settings could not be saved. Please try again.");
      }
    } catch {
      setPrefs(prefs);
      setErr("Your alert settings could not be saved. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div>
      <div style={{ display: "grid", gap: 12 }}>
        {ROWS.map((row) => (
          <label
            key={row.key}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={prefs[row.key]}
              disabled={busy}
              onChange={() => void toggle(row.key)}
              style={{ marginTop: 3, width: 18, height: 18, accentColor: "#a855f7" }}
            />
            <span>
              <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>
                {row.label}
              </span>
              <span style={{ display: "block", color: "#ddd0ff", fontSize: 14 }}>
                {row.detail}
              </span>
            </span>
          </label>
        ))}
      </div>
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
