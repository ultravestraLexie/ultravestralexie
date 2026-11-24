"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDaysKey,
  daysAgo,
  daysUntil,
  dealRemainingCents,
  emptyProtection,
  fmtDate,
  fmtMoney,
  followText,
  isOverdue,
  nextStage,
  parseKey,
  plural,
  protectionGaps,
  reminderText,
  rowToDeal,
  stageOf,
  type DealProtection,
  type DealRowLike,
  type GalaxyDeal,
  type GalaxyProfile,
} from "@/lib/galaxy/core";
import { Icon, I, Sheet, copyText, shootingStar, toast } from "./ui";

/* The deal sheet — one dialog for a deal everywhere it appears
 * (Today orbit + actions, Deals board, Money waiting-on, Passport
 * history). All writes go through the existing /api/deals route.
 * There is deliberately NO delete here: closing a deal is a stage
 * change to 'lost', never a hard delete. */

/* The deals API awaits the update's .select() before responding,
 * so a successful response body carries the committed row itself.
 * Return it as a GalaxyDeal: hosts apply it locally the moment the
 * write lands, instead of the screen depending solely on the
 * timing of the next router.refresh(). Null = the write failed. */
async function patchDeal(
  id: string,
  patch: Record<string, unknown>
): Promise<GalaxyDeal | null> {
  try {
    const res = await fetch("/api/deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as {
      deal?: DealRowLike;
    } | null;
    return json?.deal ? rowToDeal(json.deal) : null;
  } catch {
    return null;
  }
}

/* Deal Protection (System #2) — the checklist record lives in its
 * own table behind /api/deals/protection. The sheet loads it when
 * opened (so the section works on every host page, not just the
 * Deals board) and saves the whole record on every change. */
async function fetchProtection(dealId: string): Promise<DealProtection> {
  try {
    const res = await fetch(`/api/deals/protection?dealId=${dealId}`);
    if (res.ok) {
      const json = (await res.json()) as { protection: DealProtection | null };
      if (json.protection) return json.protection;
    }
  } catch {
    /* fall through to the empty record */
  }
  return emptyProtection(dealId);
}

async function saveProtection(p: DealProtection): Promise<DealProtection | null> {
  try {
    const res = await fetch("/api/deals/protection", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { protection: DealProtection };
    return json.protection;
  } catch {
    return null;
  }
}

type ProtCheckKey =
  | "contractReviewed"
  | "deliverablesAgreed"
  | "paymentTermsAgreed"
  | "usageRightsSet"
  | "exclusivityChecked";

const PROT_CHECKS: { key: ProtCheckKey; label: string }[] = [
  { key: "contractReviewed", label: "Contract reviewed" },
  { key: "deliverablesAgreed", label: "Deliverables confirmed in writing" },
  { key: "paymentTermsAgreed", label: "Payment terms confirmed" },
  { key: "usageRightsSet", label: "Usage rights recorded" },
  { key: "exclusivityChecked", label: "Exclusivity checked" },
];

export function DealSheet({
  deal,
  profile,
  today,
  open,
  onClose,
  onChanged,
}: {
  deal: GalaxyDeal | null;
  profile: GalaxyProfile;
  /* The server's today (YYYY-MM-DD), passed by every host page.
   * All day math in the sheet anchors to it — never to the
   * browser's local clock — so the sheet agrees with the board,
   * Today and Money to the day. */
  today: string;
  open: boolean;
  onClose: () => void;
  /* Called with the committed deal from the write's own response
   * body, so the host can render the new state immediately and
   * deterministically — router.refresh() remains only a backstop. */
  onChanged: (deal: GalaxyDeal, paidNow: boolean) => void;
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
  const [prot, setProt] = useState<DealProtection | null>(null);
  const [protBusy, setProtBusy] = useState(false);

  /* Load this deal's protection record each time the sheet opens
   * on a deal. A deal with no record yet gets the empty record —
   * nothing checked, nothing recorded. Keyed on the deal id so a
   * parent refresh (new deal object, same id) doesn't reload it. */
  const protDealId = open && deal ? deal.id : null;
  useEffect(() => {
    if (!protDealId) return;
    let live = true;
    setProt(null);
    void fetchProtection(protDealId).then((p) => {
      if (live) setProt(p);
    });
    return () => {
      live = false;
    };
  }, [protDealId]);

  async function persistProt(next: DealProtection) {
    if (!deal) return;
    setProtBusy(true);
    const saved = await saveProtection(next);
    setProtBusy(false);
    if (saved) {
      setProt(saved);
      /* The board's protection indicator reads server data — refresh
       * in place so it agrees with the sheet immediately. */
      router.refresh();
    } else {
      toast("That could not be saved. Please try again.");
      setProt(await fetchProtection(deal.id));
    }
  }

  function toggleProt(key: ProtCheckKey) {
    if (!prot) return;
    const next = { ...prot, [key]: !prot[key] };
    setProt(next);
    void persistProt(next);
  }

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
  const now = parseKey(today);
  const st = stageOf(deal.stage);
  const active = deal.stage !== "paid" && deal.stage !== "lost";
  const overdue = isOverdue(deal, now);
  const payDays = deal.invoiceDue ? daysUntil(deal.invoiceDue, now) : null;
  const protGaps = prot ? protectionGaps(deal, prot) : [];
  const next = nextStage(deal.stage);
  const dollarsToCents = (v: string) => {
    const n = Math.round(parseFloat(v));
    return Number.isFinite(n) && n >= 0 ? n * 100 : null;
  };

  async function run(patch: Record<string, unknown>, msg: string, paidNow = false) {
    if (!deal) return;
    setBusy(true);
    const updated = await patchDeal(deal.id, patch);
    setBusy(false);
    if (updated) {
      toast(msg);
      if (paidNow) shootingStar();
      /* The host applies the committed row from the response body
       * right now — the board / Money / Today panels show the new
       * state on this render, not whenever the refresh lands. The
       * refresh still runs as a backstop for server-computed props
       * (insights, protection indicators, totals). */
      onChanged(updated, paidNow);
      router.refresh();
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
          paymentReceivedDate: today,
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
        invoiceSentDate: today,
        paymentDueDate: invoiceDue || addDaysKey(14, now),
      },
      `Invoice logged for ${deal!.brandName}.`
    );
  }

  async function copyReminder() {
    const ok = await copyText(reminderText(profile, deal!));
    toast(ok ? "Reminder copied — paste it anywhere." : "Copy failed. Select the text manually.");
  }

  const daysSinceContact = deal.lastContact
    ? Math.max(0, daysAgo(deal.lastContact, now))
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
                value={invoiceDue || addDaysKey(14, now)}
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
          <div className="gx-prot">
            <p className="gx-prot-title">Deal protection</p>
            <p className="gx-sub">
              Protect yourself before you rely on this deal — check each item off as you confirm it.
            </p>
            {deal.invoiceDue ? (
              <p className="gx-sub">
                Payment deadline: due {fmtDate(deal.invoiceDue)}
                {overdue
                  ? ` — ${plural(daysAgo(deal.invoiceDue, now), "day")} overdue`
                  : payDays === 0
                    ? " — due today"
                    : payDays !== null && payDays > 0
                      ? ` — ${plural(payDays, "day")} left`
                      : " — that date has passed"}
                {dealRemainingCents(deal) > 0
                  ? ` · ${fmtMoney(dealRemainingCents(deal))} still owed`
                  : ""}
              </p>
            ) : deal.stage === "invoiced" ? (
              <p className="gx-sub">Payment deadline: no due date set on this invoice.</p>
            ) : null}
            {prot === null ? (
              <p className="gx-sub">Loading protection…</p>
            ) : (
              <>
                <div className="gx-prot-checks">
                  {PROT_CHECKS.map((c) => (
                    <label key={c.key} className={`gx-prot-check${prot[c.key] ? " on" : ""}`}>
                      <input
                        type="checkbox"
                        checked={prot[c.key]}
                        disabled={protBusy}
                        onChange={() => toggleProt(c.key)}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
                {protGaps.length ? (
                  <div className="gx-prot-chips">
                    {protGaps.map((g) => (
                      <span key={g.id} className="gx-pill gx-pill-warn">
                        <Icon html={I.warn} size={13} /> {g.text}
                      </span>
                    ))}
                  </div>
                ) : null}
                <label className="gx-field">
                  <span>Usage rights</span>
                  <textarea
                    className="gx-input"
                    rows={2}
                    value={prot.usageRightsNote}
                    onChange={(e) => setProt({ ...prot, usageRightsNote: e.target.value })}
                    placeholder="What the brand may do with your content, and for how long"
                  />
                </label>
                <label className="gx-field">
                  <span>Exclusivity</span>
                  <textarea
                    className="gx-input"
                    rows={2}
                    value={prot.exclusivityNote}
                    onChange={(e) => setProt({ ...prot, exclusivityNote: e.target.value })}
                    placeholder="Competing brands you agreed to avoid, and for how long — or None"
                  />
                </label>
                <label className="gx-field">
                  <span>Evidence of agreed terms</span>
                  <textarea
                    className="gx-input"
                    rows={3}
                    value={prot.termsNote}
                    onChange={(e) => setProt({ ...prot, termsNote: e.target.value })}
                    placeholder="What was agreed, where, and when — for example the signed agreement, or the email thread that confirmed it"
                  />
                </label>
                <div className="gx-sheet-actions">
                  <button
                    type="button"
                    className="gx-btn"
                    disabled={protBusy}
                    onClick={() => void persistProt(prot)}
                  >
                    Save protection
                  </button>
                </div>
              </>
            )}
          </div>
          {overdue ? (
            <p className="gx-sub" style={{ marginBottom: 12 }}>
              <Icon html={I.alert} size={13} /> {fmtMoney(dealRemainingCents(deal))} is{" "}
              {deal.invoiceDue
                ? `${plural(Math.max(0, daysAgo(deal.invoiceDue, now)), "day")} overdue`
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
