"use client";

import { useState } from "react";
import {
  FEEDBACK_KINDS,
  feedbackKindLabel,
  type FeedbackKind,
} from "@/lib/galaxy/core";
import { toast } from "@/components/galaxy/ui";

/* Feedback (trust queue #7) — the signed-in Support page's second
 * section, deliberately separate from the request form above it.
 * Feedback is NOT a support ticket: submitting shows no reference
 * number and no status, and no reply is promised — the creator
 * can only say we may email them about it. Submissions land in
 * public.feedback via /api/feedback; the owner reads them from
 * the database. */

export default function FeedbackForm() {
  const [kind, setKind] = useState<FeedbackKind>("working");
  const [message, setMessage] = useState("");
  const [contactOk, setContactOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (message.trim().length < 10) {
      toast("Give us a sentence or two — a little detail helps most.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, message: message.trim(), contactOk }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (res.ok && data?.ok) {
        setSent(true);
        setMessage("");
        setContactOk(false);
      } else {
        const msg =
          data?.error ?? "Your feedback could not be sent. Please try again.";
        setError(msg);
        toast(msg);
      }
    } catch {
      const msg = "Your feedback could not be sent. Please try again.";
      setError(msg);
      toast(msg);
    }
    setBusy(false);
  }

  return (
    <section className="gx-panel" aria-labelledby="feedback-h" id="feedback">
      <div className="gx-panel-head">
        <h2 id="feedback-h">Feedback — help us learn why creators stay or leave</h2>
      </div>

      {sent ? (
        <div className="gx-empty" role="status">
          <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 16 }}>
            Feedback received.
          </p>
          <p style={{ margin: "0 0 14px" }}>
            Thank you — this goes straight to the owner.
          </p>
          <button
            type="button"
            className="gx-btn"
            onClick={() => setSent(false)}
          >
            Send more feedback
          </button>
        </div>
      ) : (
        <>
      <div
        className="gx-chips"
        role="group"
        aria-label="What kind of feedback is this?"
        style={{ margin: "2px 0 14px" }}
      >
        {FEEDBACK_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            className="gx-chip"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
          >
            {feedbackKindLabel(k)}
          </button>
        ))}
      </div>

      <label className="gx-field" style={{ display: "grid", gap: 6 }}>
        <span>Tell us more</span>
        <textarea
          className="gx-input"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={4000}
          placeholder="What happened, what you wish existed, or what's getting in your way."
        />
      </label>

      <label
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginTop: 12,
          cursor: "pointer",
          fontSize: 14.5,
        }}
      >
        <input
          type="checkbox"
          checked={contactOk}
          onChange={(e) => setContactOk(e.target.checked)}
        />
        You may email me about this
      </label>
      <p style={{ margin: "8px 0 0", color: "var(--ink-3)", fontSize: 13.5 }}>
        Feedback is not a support request — we read all of it, and if you
        tick the box, we may email you about it. For something broken that
        needs a reply, use the request form above.
      </p>

      {error ? (
        <p role="alert" style={{ color: "var(--bad, #f87171)", margin: "10px 0 0" }}>
          {error}
        </p>
      ) : null}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <button
          type="button"
          className="gx-btn gx-btn-primary"
          disabled={busy}
          onClick={() => void submit()}
        >
          {busy ? "Sending…" : "Send feedback"}
        </button>
      </div>
        </>
      )}
    </section>
  );
}
