"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SUPPORT_CATEGORIES,
  fmtDate,
  supportCategoryLabel,
  supportStatusLabel,
  supportTicketRef,
  type SupportTicket,
} from "@/lib/galaxy/core";
import { toast } from "@/components/galaxy/ui";

/* Support center (trust queue #1) — the signed-in half of
 * /support. The form files a real row in public.support_tickets
 * via /api/support; the confirmation quotes that row's own
 * reference. Below the form: the direct email fallback and the
 * creator's own previous requests with their status. Every
 * self-help line describes behavior the app actually has —
 * the same claims the public support page has always made. */

export default function SupportClient({
  accountEmail,
  initialTickets,
}: {
  accountEmail: string;
  initialTickets: SupportTicket[];
}) {
  const [category, setCategory] = useState<string>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState(accountEmail);
  const [busy, setBusy] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [confirmation, setConfirmation] = useState<SupportTicket | null>(null);
  const [error, setError] = useState("");

  async function submit() {
    if (!subject.trim()) {
      toast("Give your request a subject line.");
      return;
    }
    if (!message.trim()) {
      toast("Tell us what happened in the message.");
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      toast("Add the email we should reply to.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
          contactEmail: contactEmail.trim(),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ticket?: SupportTicket;
        error?: string;
      } | null;
      if (res.ok && data?.ticket) {
        setConfirmation(data.ticket);
        setTickets((prev) => [data.ticket!, ...prev]);
        setSubject("");
        setMessage("");
      } else {
        const msg =
          data?.error ?? "Your request could not be sent. Please try again.";
        setError(msg);
        toast(msg);
      }
    } catch {
      const msg = "Your request could not be sent. Please try again.";
      setError(msg);
      toast(msg);
    }
    setBusy(false);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section className="gx-panel" aria-labelledby="support-form-h">
        <div className="gx-panel-head">
          <h2 id="support-form-h">Send a request</h2>
          <span className="gx-muted">A person reads every request</span>
        </div>

        {confirmation ? (
          <div className="gx-empty" role="status" style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 6px", fontWeight: 600 }}>
              Request received. We read every request and reply by email.
            </p>
            <p style={{ margin: 0 }}>
              Your reference: <strong>{supportTicketRef(confirmation)}</strong>
              {" — "}quote it if you email us about this request.
            </p>
          </div>
        ) : null}

        <div className="gx-aud-form">
          <label className="gx-field">
            <span>What is it about?</span>
            <select
              className="gx-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {SUPPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {supportCategoryLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="gx-field">
            <span>Reply to this email</span>
            <input
              className="gx-input"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              maxLength={320}
            />
          </label>
        </div>
        <label className="gx-field" style={{ display: "grid", gap: 6 }}>
          <span>Subject</span>
          <input
            className="gx-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            placeholder="Short version — what broke or what you need"
          />
        </label>
        <label className="gx-field" style={{ display: "grid", gap: 6 }}>
          <span>What happened?</span>
          <textarea
            className="gx-input"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={5000}
            placeholder="What you were trying to do, and what happened instead. For a billing question, add the plan name and the date of the charge."
          />
        </label>
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
            {busy ? "Sending…" : "Send request"}
          </button>
        </div>
      </section>

      <section className="gx-panel" aria-labelledby="support-quick-h">
        <div className="gx-panel-head">
          <h2 id="support-quick-h">Things you can do right now</h2>
        </div>
        <ul className="gx-list">
          <li>
            Forgot your password?{" "}
            <Link href="/forgot-password">Reset it</Link> — a reset link is
            emailed to you.
          </li>
          <li>
            Paid but your account did not unlock? Sign in once with the email
            you paid with — your plan attaches automatically. If it still has
            not unlocked after a few minutes, send a request above.
          </li>
          <li>
            Your plan, its status and the current period dates live in{" "}
            <Link href="/settings">Settings</Link>. To change or cancel your
            plan, send a request here and we will take care of it.
          </li>
        </ul>
        <p style={{ margin: "14px 0 0" }}>
          You can also email{" "}
          <a href="mailto:ultravestraacademy@gmail.com">
            ultravestraacademy@gmail.com
          </a>{" "}
          directly.
        </p>
        <p style={{ margin: "10px 0 0", fontSize: 13.5 }}>
          Taking your records with you?{" "}
          <a href="/api/export">Download everything we hold about your business</a>{" "}
          — one JSON file, yours to keep.
        </p>
      </section>

      <section className="gx-panel" aria-labelledby="support-mine-h">
        <div className="gx-panel-head">
          <h2 id="support-mine-h">Your requests</h2>
          <span className="gx-muted">Newest first</span>
        </div>
        {tickets.length ? (
          <ul className="gx-list">
            {tickets.map((t) => (
              <li key={t.id} className="gx-action-li">
                <div>
                  <div style={{ fontWeight: 600, lineHeight: 1.35 }}>
                    {t.subject}
                  </div>
                  <div style={{ color: "var(--ink-3)", fontSize: 13.5, marginTop: 2 }}>
                    {supportCategoryLabel(t.category)} · {fmtDate(t.createdAt.slice(0, 10))}{" "}
                    · Ref {supportTicketRef(t)}
                  </div>
                </div>
                <span className="gx-pill">{supportStatusLabel(t.status)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="gx-empty">
            <p>No requests yet. When something breaks, this is where to go.</p>
          </div>
        )}
      </section>
    </div>
  );
}
