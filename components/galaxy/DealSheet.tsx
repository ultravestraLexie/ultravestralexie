"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDaysKey,
  dealRemainingCents,
  fmtDate,
  fmtMoney,
  followText,
  isOverdue,
  nextStage,
  plural,
  reminderText,
  stageOf,
  todayKey,
  type GalaxyDeal,
  type GalaxyProfile,
} from "@/lib/galaxy/core";
import { Icon, I, Sheet, copyText, shootingStar, toast } from "./ui";

/* The deal sheet — one dialog for a deal everywhere it appears
 * (Today orbit + actions, Deals board, Money waiting-on, Passport
 * history). All writes go through the existing /api/deals route.
 * There is deliberately NO delete here: closing a deal is a stage
 * change to 'lost', never a hard delete. */

async function patchDeal(id: string, patch: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch("/api/deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function DealSheet({
  deal,
  profile,
  open,
  onClose,
  onChanged,
}: {
  deal: GalaxyDeal | null;
  profile: GalaxyProfile;
  open: boolean;
  onClose: () => void;
  onChanged: (paidNow: boolean) => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceDue, setInvoiceDue] = useState("");
  const [invoiceMode, setInvoiceMode] = useState(false);
  const [followMode, setFollowMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seededFor, setSeededFor] = useState<string | null>(null);

  if (open && deal && seededFor !== deal.id) {
    setSeededFor(deal.id);
    setAmount(deal.amountCents != null ? String(deal.amountCents / 100) : "");
    setDueOn(deal.dueOn ?? "");
    setDeliverables(deal.deliverables);
    setNotes(deal.notes);
    setInvoiceDue(deal.invoiceDue ?? "");
    setInvoiceMode(false);
    setFollowMode(false);
  }
  if (!open && seededFor !== null) setSeededFor(null);

  if (!deal) return null;
  const st = stageOf(deal.stage);
  const active = deal.stage !== "paid" && deal.stage !== "lost";
  const overdue = isOverdue(deal);
  const next = nextStage(deal.stage);
  const dollarsToCents = (v: string) => {
    const n = Math.round(parseFloat(v));
    return Number.isFinite(n) && n >= 0 ? n * 100 : null;
  };

  async function run(patch: Record<string, unknown>, msg: string, paidNow = false) {
    if (!deal) return;
    setBusy(true);
    const ok = await patchDeal(deal.id, patch);
    setBusy(false);
    if (ok) {
      toast(msg);
      if (paidNow) shootingStar();
      /* Refresh the server data in place so the board / Money /
       * Today panels reflect the write immediately — no manual
       * reload. Done here in the sheet itself (not only via the
       * parent's onChanged) so every host page gets it. */
      router.refresh();
      onChanged(paidNow);
      onClose();
    } else {
      toast("That could not be saved. Please try again.");
    }
  }

  function advance() {
    if (!next) return;
    if (deal!.stage === "delivering") {
      setInvoiceMode(true);
      return;
    }
    if (next === "paid") {
      void run(
        {
          stage: "paid",
          paymentReceivedDate: todayKey(),
          amountReceivedCents: dollarsToCents(amount) ?? deal!.amountCents ?? null,
        },
        `${deal!.brandName} marked paid.`,
        true
      );
      return;
    }
    void run({ stage: next }, `${deal!.brandName} moved to ${stageOf(next).label}.`);
  }

  function save() {
    void run(
      {
        compensationCents: dollarsToCents(amount),
        deadline: dueOn || null,
        deliverables,
        notes,
        ...(deal!.stage === "invoiced"
          ? { paymentDueDate: invoiceDue || null }
          : {}),
      },
      "Deal saved."
    );
  }

  function logInvoice() {
    void run(
      {
        stage: "invoiced",
        compensationCents: dollarsToCents(amount),
        invoiceSentDate: todayKey(),
        paymentDueDate: invoiceDue || addDaysKey(14),
      },
      `Invoice logged for ${deal!.brandName}.`
    );
  }

  async function copyReminder() {
    const ok = await copyText(reminderText(profile, deal!));
    toast(ok ? "Reminder copied — paste it anywhere." : "Copy failed. Select the text manually.");
  }

  const daysSinceContact = deal.lastContact
    ? Math.max(0, Math.round((Date.now() - new Date(deal.lastContact + "T12:00:00").getTime()) / 86400000))
    : 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={deal.brandName}
      sub={
        deal.stage === "lost"
          ? "Closed, not won"
          : `${st.label}${overdue ? ", overdue" : ""}`
      }
    >
      <dl className="gx-meta-list">
        <dt>Pitched</dt>
        <dd>{deal.pitchedOn ? fmtDate(deal.pitchedOn) : "Not recorded"}</dd>
        <dt>Last contact</dt>
        <dd>
          {deal.lastContact
            ? `${fmtDate(deal.lastContact)} (${daysSinceContact === 0 ? "today" : plural(daysSinceContact, "day") + " ago"})`
            : "Not recorded"}
        </dd>
        {deal.paidOn ? (
          <>
            <dt>Paid</dt>
            <dd>{fmtDate(deal.paidOn)}</dd>
          </>
        ) : null}
      </dl>

      {invoiceMode ? (
        <div>
          <div className="gx-row2">
            <label className="gx-field">
              <span>Invoice amount ($)</span>
              <input
                className="gx-input"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="gx-field">
              <span>Payment due</span>
              <input
                className="gx-input"
                type="date"
                value={invoiceDue || addDaysKey(14)}
                onChange={(e) => setInvoiceDue(e.target.value)}
              />
            </label>
          </div>
          <p className="gx-sub" style={{ marginBottom: 12 }}>
            Money tracks it until it is paid, and Today flags it if it runs late.
          </p>
          <div className="gx-sheet-actions">
            <button type="button" className="gx-btn" onClick={() => setInvoiceMode(false)}>
              Back
            </button>
            <span className="spacer" />
            <button type="button" className="gx-btn gx-btn-primary" disabled={busy} onClick={logInvoice}>
              Log invoice
            </button>
          </div>
        </div>
      ) : followMode ? (
        <div>
          <label className="gx-field">
            <span>Message</span>
            <textarea className="gx-input" rows={9} defaultValue={followText(profile, deal)} id="gx-follow-text" />
          </label>
          <div className="gx-sheet-actions">
            <button
              type="button"
              className="gx-btn"
              onClick={async () => {
                const ta = document.getElementById("gx-follow-text") as HTMLTextAreaElement | null;
                const ok = ta ? await copyText(ta.value) : false;
                toast(ok ? "Follow-up copied." : "Copy failed.");
              }}
            >
              <Icon html={I.copy} size={15} /> Copy message
            </button>
            <span className="spacer" />
            <button
              type="button"
              className="gx-btn gx-btn-primary"
              disabled={busy}
              onClick={() => void run({}, "Marked as followed up.")}
            >
              Mark followed up
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="gx-row2">
            <label className="gx-field">
              <span>Deal value ($)</span>
              <input
                className="gx-input"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </label>
            <label className="gx-field">
              <span>Content due</span>
              <input
                className="gx-input"
                type="date"
                value={dueOn}
                onChange={(e) => setDueOn(e.target.value)}
              />
            </label>
          </div>
          <label className="gx-field">
            <span>Deliverables</span>
            <input
              className="gx-input"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="2 TikToks and 1 Story"
            />
          </label>
          {deal.stage === "invoiced" ? (
            <label className="gx-field">
              <span>Invoice due</span>
              <input
                className="gx-input"
                type="date"
                value={invoiceDue}
                onChange={(e) => setInvoiceDue(e.target.value)}
              />
            </label>
          ) : null}
          <label className="gx-field">
            <span>Notes</span>
            <textarea
              className="gx-input"
              rows={3}
              style={{ minHeight: 80 }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          {overdue ? (
            <p className="gx-sub" style={{ marginBottom: 12 }}>
              <Icon html={I.alert} size={13} /> {fmtMoney(dealRemainingCents(deal))} is{" "}
              {deal.invoiceDue
                ? `${plural(Math.max(0, Math.round((Date.now() - new Date(deal.invoiceDue + "T12:00:00").getTime()) / 86400000)), "day")} overdue`
                : "overdue"}
              .
            </p>
          ) : null}
          <div className="gx-sheet-actions">
            {active && st.next ? (
              <button type="button" className="gx-btn gx-btn-primary" disabled={busy} onClick={advance}>
                {st.next}
              </button>
            ) : null}
            {deal.stage === "lost" ? (
              <button
                type="button"
                className="gx-btn"
                disabled={busy}
                onClick={() => void run({ stage: "pitched" }, "Deal reopened.")}
              >
                Reopen deal
              </button>
            ) : null}
            <button type="button" className="gx-btn" disabled={busy} onClick={save}>
              Save changes
            </button>
            {deal.stage === "pitched" || deal.stage === "negotiating" ? (
              <button type="button" className="gx-btn gx-btn-quiet" onClick={() => setFollowMode(true)}>
                Write follow-up
              </button>
            ) : null}
            {overdue ? (
              <button type="button" className="gx-btn gx-btn-quiet" onClick={() => void copyReminder()}>
                Copy reminder
              </button>
            ) : null}
            <span className="spacer" />
            {active ? (
              <button
                type="button"
                className="gx-btn gx-btn-quiet gx-btn-danger"
                disabled={busy}
                onClick={() => void run({ stage: "lost" }, "Closed as not won.")}
              >
                Close as not won
              </button>
            ) : null}
          </div>
        </div>
      )}
    </Sheet>
  );
}
