"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  dealFlag,
  dealPaidCents,
  dealRemainingCents,
  fmtDate,
  fmtMoney,
  isOverdue,
  monthKeyOf,
  monthsBackMoney,
  niceMax,
  owedCents,
  overdueCents,
  paidInMonth,
  plural,
  reminderText,
  shortMoney,
  spentInMonth,
  todayKey,
  type GalaxyDeal,
  type GalaxyExpense,
  type GalaxyIncome,
  type GalaxyProfile,
} from "@/lib/galaxy/core";
import { DealSheet } from "@/components/galaxy/DealSheet";
import { Icon, I, Sheet, copyText, shootingStar, toast } from "@/components/galaxy/ui";

/* MONEY client — KPIs, the 6-month money-in chart, the recent
 * ledger and the waiting-on list. Deal money is written through
 * /api/deals only; payouts through /api/revenue; expenses
 * through /api/expenses. */

type LedgerRow = {
  key: string;
  date: string;
  label: string;
  note: string;
  cents: number;
  kind: "deal" | "income" | "expense";
  id?: string;
};

export default function MoneyClient({
  profile,
  deals,
  income,
  expenses,
}: {
  profile: GalaxyProfile;
  deals: GalaxyDeal[];
  income: GalaxyIncome[];
  expenses: GalaxyExpense[];
}) {
  const router = useRouter();
  const [dealId, setDealId] = useState<string | null>(null);
  const [moneyForm, setMoneyForm] = useState<"income" | "expense" | null>(null);
  const [tip, setTip] = useState<number | null>(null);

  const deal = deals.find((d) => d.id === dealId) ?? null;
  const now = new Date();
  const thisMonth = monthKeyOf(todayKey(now));
  const ow = owedCents(deals);
  const odTotal = overdueCents(deals, now);
  const odCount = deals.filter((d) => isOverdue(d, now)).length;
  const waiting = deals
    .filter((d) => d.stage === "invoiced")
    .sort((a, b) => (a.invoiceDue ?? "").localeCompare(b.invoiceDue ?? ""));
  const inM = paidInMonth(deals, income, thisMonth);
  const outM = spentInMonth(expenses, thisMonth);
  const months = useMemo(() => monthsBackMoney(deals, income, 6, now), [deals, income]);
  const max = niceMax(Math.max(...months.map((m) => m.totalCents)));
  const peak = months.reduce((a, b) => (b.totalCents > a.totalCents ? b : a), months[0]);

  const ledger: LedgerRow[] = useMemo(() => {
    const rows: LedgerRow[] = [
      ...deals
        .filter((d) => d.stage === "paid" && d.paidOn)
        .map((d) => ({
          key: `deal-${d.id}`,
          date: d.paidOn as string,
          label: d.brandName,
          note: "Brand deal",
          cents: dealPaidCents(d),
          kind: "deal" as const,
        })),
      ...income.map((i) => ({
        key: `inc-${i.id}`,
        date: i.date,
        label: i.source,
        note: "Payout",
        cents: i.amountCents,
        kind: "income" as const,
        id: i.id,
      })),
      ...expenses.map((e) => ({
        key: `exp-${e.id}`,
        date: e.date,
        label: e.label,
        note: "Expense",
        cents: -e.amountCents,
        kind: "expense" as const,
        id: e.id,
      })),
    ];
    return rows.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [deals, income, expenses]);

  async function markPaid(d: GalaxyDeal) {
    try {
      const res = await fetch("/api/deals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: d.id,
          stage: "paid",
          paymentReceivedDate: todayKey(),
          amountReceivedCents: d.amountCents ?? null,
        }),
      });
      if (res.ok) {
        toast(`${d.brandName} marked paid.`);
        shootingStar();
        router.refresh();
      } else toast("That could not be saved. Please try again.");
    } catch {
      toast("That could not be saved. Please try again.");
    }
  }

  async function delMoney(row: LedgerRow) {
    if (!row.id) return;
    const url = row.kind === "income" ? "/api/revenue" : "/api/expenses";
    try {
      const res = await fetch(`${url}?id=${row.id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Removed.");
        router.refresh();
      } else toast("That could not be removed. Please try again.");
    } catch {
      toast("That could not be removed. Please try again.");
    }
  }

  const kpis = [
    { label: "Owed to you", value: ow, small: `${plural(waiting.length, "invoice")} out`, alert: false },
    {
      label: "Overdue",
      value: odTotal,
      small: odCount ? `${plural(odCount, "invoice")} past due` : "Nothing late",
      alert: odTotal > 0,
    },
    { label: "Came in this month", value: inM, small: "Deals and payouts", alert: false },
    { label: "Kept this month", value: inM - outM, small: `After ${fmtMoney(outM)} in expenses`, alert: false },
  ];

  return (
    <div>
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 26 }}>
        <div>
          <h1 style={{ fontSize: 30, lineHeight: 1.15, margin: 0 }}>Money</h1>
          <p style={{ margin: "10px 0 0", color: "var(--ink-2)", maxWidth: "60ch" }}>
            What you are owed, what is late and what came in. It reads from your deals, so
            nothing gets typed twice.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="gx-btn" onClick={() => setMoneyForm("income")}>
            <Icon html={I.plus} size={15} /> Log payout
          </button>
          <button type="button" className="gx-btn" onClick={() => setMoneyForm("expense")}>
            <Icon html={I.plus} size={15} /> Log expense
          </button>
        </div>
      </header>

      <section className="gx-panel" style={{ padding: "6px 0" }} aria-label="Money summary">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
          {kpis.map((k, i) => (
            <div key={k.label} style={{ padding: "16px 22px", borderLeft: i === 0 ? "none" : "1px solid var(--line)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--ink-2)" }}>
                {k.alert ? (
                  <span style={{ color: "var(--bad)", display: "inline-flex" }}>
                    <Icon html={I.alert} size={14} />
                  </span>
                ) : null}
                {k.label}
              </span>
              <strong style={{ display: "block", font: "500 25px/1.2 var(--display)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                {fmtMoney(k.value)}
              </strong>
              <small style={{ display: "block", color: "var(--ink-3)", fontSize: 12.5, marginTop: 3 }}>{k.small}</small>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 20, marginTop: 20, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 20 }}>
          <section className="gx-panel" aria-labelledby="chart-h">
            <div className="gx-panel-head">
              <h2 id="chart-h">Money in, last 6 months</h2>
              <span className="gx-muted">Paid deals plus payouts</span>
            </div>
            <div
              role="group"
              aria-label={`Money in by month: ${months.map((m) => `${m.long} ${fmtMoney(m.totalCents)}`).join(", ")}`}
              style={{ position: "relative", height: 240, marginTop: 4 }}
              onMouseLeave={() => setTip(null)}
            >
              {[1, 0.5, 0].map((f) => (
                <div
                  key={f}
                  style={{
                    position: "absolute",
                    left: 46,
                    right: 0,
                    top: `calc(24px + ${((1 - f) * (100 - 0)) / 100} * (100% - 50px))`,
                    borderTop: `1px solid rgba(150,170,255,${f === 0 ? 0.3 : 0.12})`,
                  }}
                >
                  <span style={{ position: "absolute", right: "calc(100% + 10px)", top: -8, fontSize: 11.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                    {shortMoney(max * f)}
                  </span>
                </div>
              ))}
              <div style={{ position: "absolute", inset: "24px 0 0 46px", display: "grid", gridAutoFlow: "column", gridAutoColumns: "1fr", gap: 2 }}>
                {months.map((m, i) => {
                  const showVal = m.totalCents > 0 && (m === peak || i === months.length - 1);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      aria-label={`${m.long}: ${fmtMoney(m.totalCents)}`}
                      onMouseEnter={() => setTip(i)}
                      onFocus={() => setTip(i)}
                      onClick={() => setTip(i)}
                      style={{
                        position: "relative",
                        border: 0,
                        background: "transparent",
                        cursor: "default",
                        padding: "0 0 26px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        borderRadius: 8,
                        boxShadow: "none",
                      }}
                    >
                      <span
                        style={{
                          position: "relative",
                          width: "min(34px,60%)",
                          borderRadius: "4px 4px 0 0",
                          background: "linear-gradient(180deg,#7C9BFF,var(--blue))",
                          minHeight: 2,
                          height: `${(m.totalCents / max) * 100}%`,
                          boxShadow: "0 0 18px -6px rgba(110,140,255,.9)",
                          display: "block",
                        }}
                      >
                        {showVal ? (
                          <span style={{ position: "absolute", bottom: "calc(100% + 5px)", left: "50%", translate: "-50% 0", fontSize: 12, color: "var(--ink-2)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                            {shortMoney(m.totalCents)}
                          </span>
                        ) : null}
                      </span>
                      <span style={{ position: "absolute", bottom: 4, fontSize: 12, color: "var(--ink-3)" }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
              {tip !== null && months[tip] ? (
                <div
                  style={{
                    position: "absolute",
                    pointerEvents: "none",
                    zIndex: 3,
                    minWidth: 150,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "rgba(8,11,38,.96)",
                    border: "1px solid var(--line-2)",
                    fontSize: 13,
                    boxShadow: "0 12px 30px rgba(0,0,0,.5)",
                    left: `${((tip + 0.5) / months.length) * 100}%`,
                    top: 0,
                    translate: "-50% 0",
                  }}
                >
                  <b style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>{months[tip].long}</b>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14, color: "var(--ink-2)" }}>
                    <span>Total</span>
                    <span>{fmtMoney(months[tip].totalCents)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14, color: "var(--ink-2)" }}>
                    <span>Brand deals</span>
                    <span>{fmtMoney(months[tip].dealsCents)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14, color: "var(--ink-2)" }}>
                    <span>Payouts</span>
                    <span>{fmtMoney(months[tip].incomeCents)}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="gx-panel" aria-labelledby="ledger-h">
            <div className="gx-panel-head">
              <h2 id="ledger-h">Recent money in and out</h2>
            </div>
            {ledger.length ? (
              <ul className="gx-list">
                {ledger.map((l) => (
                  <li key={l.key} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto 30px", gap: 12, alignItems: "center", padding: "10px 0", fontSize: 14.5 }}>
                    <div>
                      {l.label}
                      <small style={{ display: "block", color: "var(--ink-3)", fontSize: 12.5 }}>
                        {l.note}, {fmtDate(l.date)}
                      </small>
                    </div>
                    <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: l.cents < 0 ? 500 : 600, color: l.cents < 0 ? "var(--ink-2)" : undefined }}>
                      {l.cents < 0 ? "−" : "+"}
                      {fmtMoney(Math.abs(l.cents))}
                    </span>
                    {l.id ? (
                      <button
                        type="button"
                        aria-label={`Remove ${l.label}`}
                        onClick={() => void delMoney(l)}
                        style={{ width: 30, height: 30, borderRadius: 8, border: 0, background: "transparent", color: "var(--ink-3)", cursor: "pointer", display: "grid", placeItems: "center", padding: 0, boxShadow: "none" }}
                      >
                        <Icon html={I.close} size={14} />
                      </button>
                    ) : (
                      <span />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="gx-empty">
                <p>Paid deals, payouts and expenses show up here.</p>
              </div>
            )}
          </section>
        </div>

        <section className="gx-panel" aria-labelledby="wait-h">
          <div className="gx-panel-head">
            <h2 id="wait-h">Waiting on</h2>
            <span className="gx-muted">{fmtMoney(ow)}</span>
          </div>
          {waiting.length ? (
            <ul className="gx-list">
              {waiting.map((d) => {
                const flag = dealFlag(d);
                const od = isOverdue(d);
                return (
                  <li key={d.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "6px 14px", alignItems: "center", padding: "13px 0" }}>
                    <div>
                      <button
                        type="button"
                        onClick={() => setDealId(d.id)}
                        style={{ fontWeight: 600, background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--ink)", boxShadow: "none" }}
                      >
                        {d.brandName}
                      </button>
                      <div style={{ color: "var(--ink-3)", fontSize: 13.5, marginTop: 2 }}>
                        {d.deliverables || "Brand deal"}
                      </div>
                    </div>
                    <strong>{fmtMoney(dealRemainingCents(d))}</strong>
                    <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                      {flag ? (
                        <span className={`gx-pill ${flag.tone === "bad" ? "gx-pill-bad" : flag.tone === "warn" ? "gx-pill-warn" : ""}`}>
                          <Icon html={flag.tone === "bad" ? I.alert : flag.tone === "warn" ? I.warn : I.clock} size={13} />
                          {flag.text}
                        </span>
                      ) : null}
                      <span style={{ flex: 1 }} />
                      {od ? (
                        <button
                          type="button"
                          className="gx-btn gx-btn-sm"
                          onClick={async () => {
                            const ok = await copyText(reminderText(profile, d));
                            toast(ok ? "Reminder copied — paste it anywhere." : "Copy failed.");
                          }}
                        >
                          Copy reminder
                        </button>
                      ) : null}
                      <button type="button" className="gx-btn gx-btn-sm gx-btn-primary" onClick={() => void markPaid(d)}>
                        Mark paid
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="gx-empty">
              <p>No invoices out. When you log an invoice in Deals, it shows up here until it is paid.</p>
            </div>
          )}
        </section>
      </div>

      <DealSheet
        deal={deal}
        profile={profile}
        open={Boolean(deal)}
        onClose={() => setDealId(null)}
        onChanged={() => router.refresh()}
      />
      <MoneyFormSheet kind={moneyForm} onClose={() => setMoneyForm(null)} onSaved={() => router.refresh()} />
    </div>
  );
}

function MoneyFormSheet({
  kind,
  onClose,
  onSaved,
}: {
  kind: "income" | "expense" | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayKey());
  const [busy, setBusy] = useState(false);
  const inc = kind === "income";

  async function submit() {
    const cents = Math.round(parseFloat(amount)) * 100;
    if (!label.trim() || !Number.isFinite(cents) || cents <= 0) {
      toast("Add a label and an amount first.");
      return;
    }
    setBusy(true);
    try {
      const res = inc
        ? await fetch("/api/revenue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              brandName: label.trim(),
              amountCents: cents,
              status: "paid",
              kind: "platform_payout",
              earnedDate: date,
            }),
          })
        : await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: label.trim(),
              amountCents: cents,
              category: "other",
              spentDate: date,
            }),
          });
      if (res.ok) {
        toast(inc ? "Payout logged." : "Expense logged.");
        setLabel("");
        setAmount("");
        router.refresh();
        onSaved();
        onClose();
      } else toast("That could not be saved. Please try again.");
    } catch {
      toast("That could not be saved. Please try again.");
    }
    setBusy(false);
  }

  return (
    <Sheet
      open={kind !== null}
      onClose={onClose}
      title={inc ? "Log a payout" : "Log an expense"}
      sub={inc ? "Money you received outside a tracked deal — a platform payout, a commission run." : "A cost of running your creator business."}
    >
      <label className="gx-field">
        <span>{inc ? "Source" : "What was it?"}</span>
        <input className="gx-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={inc ? "TikTok Shop commissions" : "Ring light"} />
      </label>
      <div className="gx-row2">
        <label className="gx-field">
          <span>Amount ($)</span>
          <input className="gx-input" type="number" min="1" step="1" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="gx-field">
          <span>Date</span>
          <input className="gx-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      <div className="gx-sheet-actions">
        <span className="spacer" />
        <button type="button" className="gx-btn gx-btn-primary" disabled={busy} onClick={() => void submit()}>
          {inc ? "Log payout" : "Log expense"}
        </button>
      </div>
    </Sheet>
  );
}
