"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ACTIVE_STAGES,
  STAGES,
  dealFlag,
  daysAgo,
  fmtDate,
  fmtMoney,
  isOverdue,
  plural,
  protectionGaps,
  type DealProtection,
  type GalaxyDeal,
  type GalaxyProfile,
} from "@/lib/galaxy/core";
import { DealSheet } from "@/components/galaxy/DealSheet";
import { Icon, I, Sheet, toast } from "@/components/galaxy/ui";

/* DEALS board — five active-stage columns, paid/lost history,
 * add-deal sheet. Every write goes through /api/deals; closing a
 * deal is a stage change to 'lost', never a delete. */

const FLAG_CLASS = { bad: "gx-pill-bad", warn: "gx-pill-warn", plain: "" } as const;
const FLAG_ICON = { bad: I.alert, warn: I.warn, plain: I.clock };

export default function DealsClient({
  profile,
  deals,
  brandOptions,
  protections,
}: {
  profile: GalaxyProfile;
  deals: GalaxyDeal[];
  brandOptions: { id: string; name: string }[];
  protections: Record<string, DealProtection>;
}) {
  const router = useRouter();
  const [dealId, setDealId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  const deal = deals.find((d) => d.id === dealId) ?? null;
  const active = deals.filter((d) => ACTIVE_STAGES.includes(d.stage));
  const pipelineTotal = active.reduce((t, d) => t + (d.amountCents ?? 0), 0);
  const followups = deals.filter(
    (d) => d.stage === "pitched" && daysAgo(d.lastContact) >= 5
  ).length;
  const odList = deals.filter((d) => isOverdue(d));
  const odTotal = odList.reduce(
    (t, d) => t + Math.max(0, (d.amountCents ?? 0) - (d.receivedCents ?? 0)),
    0
  );
  const paid = deals
    .filter((d) => d.stage === "paid")
    .sort((a, b) => (b.paidOn ?? "").localeCompare(a.paidOn ?? ""));
  const lost = deals.filter((d) => d.stage === "lost");

  return (
    <div>
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 26 }}>
        <div>
          <h1 className="gx-h1">Deals</h1>
          <p style={{ margin: "10px 0 0", color: "var(--ink-2)", maxWidth: "60ch" }}>
            Every partnership from first pitch to paid. Tap a deal to move it forward.
          </p>
        </div>
        <button type="button" className="gx-btn gx-btn-primary" onClick={() => setAddOpen(true)}>
          <Icon html={I.plus} size={15} /> Add deal
        </button>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 28px", margin: "-6px 0 22px", color: "var(--ink-2)", fontSize: 14.5 }}>
        <span>
          <strong style={{ color: "var(--ink)" }}>{fmtMoney(pipelineTotal)}</strong> in your pipeline
        </span>
        <span>
          <strong style={{ color: "var(--ink)" }}>{plural(followups, "follow-up")}</strong> due
        </span>
        {odList.length ? (
          <span>
            <strong style={{ color: "var(--ink)" }}>{fmtMoney(odTotal)}</strong> overdue
          </span>
        ) : null}
      </div>

      {deals.length === 0 ? (
        <section className="gx-panel gx-empty">
          <p>No deals yet. Pitch a brand and it lands here as your first deal.</p>
          <Link href="/brands" className="gx-btn gx-btn-primary" style={{ textDecoration: "none" }}>
            Find brands
          </Link>
        </section>
      ) : (
        <div className="gx-board">
          {STAGES.slice(0, 5).map((st) => {
            const ds = deals
              .filter((d) => d.stage === st.id)
              .sort(
                (a, b) =>
                  Number(isOverdue(b)) - Number(isOverdue(a)) ||
                  (b.amountCents ?? 0) - (a.amountCents ?? 0)
              );
            return (
              <section
                key={st.id}
                aria-label={`${st.label}, ${plural(ds.length, "deal")}`}
                style={{
                  scrollSnapAlign: "start",
                  background: "rgba(8,12,42,.55)",
                  border: "1px solid var(--line)",
                  borderRadius: 18,
                  padding: 12,
                  minHeight: 200,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px 6px" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: st.color, boxShadow: `0 0 8px ${st.color}` }} />
                  <b style={{ fontWeight: 600, fontSize: 14 }}>{st.label}</b>
                  <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--ink-3)" }}>{ds.length}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", padding: "0 4px", marginTop: -8 }}>
                  {fmtMoney(ds.reduce((t, d) => t + (d.amountCents ?? 0), 0))}
                </div>
                {ds.length ? (
                  ds.map((d) => {
                    const flag = dealFlag(d);
                    /* Deal Protection (System #2): open items show on
                     * negotiating/contracted/delivering cards only —
                     * pitched deals stay quiet on the board. */
                    const protOpen =
                      d.stage === "negotiating" ||
                      d.stage === "contracted" ||
                      d.stage === "delivering"
                        ? protectionGaps(d, protections[d.id]).length
                        : 0;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDealId(d.id)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "12px 12px 12px 14px",
                          borderRadius: 12,
                          border: "1px solid var(--line)",
                          background: "rgba(255,255,255,.035)",
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "none",
                          color: "var(--ink)",
                          fontWeight: 400,
                        }}
                      >
                        <span style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 3, borderRadius: "0 3px 3px 0", background: st.color }} />
                        <b style={{ display: "block", fontWeight: 600, fontSize: 14.5 }}>{d.brandName}</b>
                        <span
                          style={
                            d.amountCents
                              ? { font: "500 14px var(--display)", marginTop: 4, display: "block" }
                              : { font: "400 13px var(--body)", color: "var(--ink-3)", marginTop: 4, display: "block" }
                          }
                        >
                          {d.amountCents ? fmtMoney(d.amountCents) : "Value not set"}
                        </span>
                        {d.deliverables ? (
                          <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>
                            {d.deliverables}
                          </span>
                        ) : null}
                        {flag ? (
                          <span className={`gx-pill ${FLAG_CLASS[flag.tone]}`} style={{ marginTop: 8 }}>
                            <Icon html={FLAG_ICON[flag.tone]} size={13} />
                            {flag.text}
                          </span>
                        ) : null}
                        {protOpen > 0 ? (
                          <span className="gx-pill gx-pill-warn" style={{ marginTop: 8 }}>
                            <Icon html={I.warn} size={13} />
                            Protection {protOpen} open
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <p style={{ fontSize: 13, color: "var(--ink-3)", padding: "6px 4px", margin: 0 }}>
                    {st.id === "pitched" ? "Pitches you send land here." : "Nothing here yet."}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}

      {paid.length || lost.length ? (
        <details
          className="gx-panel"
          style={{ marginTop: 22 }}
          open={showClosed}
          onToggle={(e) => setShowClosed((e.target as HTMLDetailsElement).open)}
        >
          <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 10, fontWeight: 600 }}>
            Paid and closed <span className="gx-muted">({paid.length + lost.length})</span>
          </summary>
          <ul className="gx-list" style={{ marginTop: 10 }}>
            {paid.map((d) => (
              <li key={d.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: 14, alignItems: "center", padding: "11px 0" }}>
                <button
                  type="button"
                  onClick={() => setDealId(d.id)}
                  style={{ fontWeight: 600, background: "none", border: 0, padding: 0, textAlign: "left", cursor: "pointer", color: "var(--ink)", boxShadow: "none" }}
                >
                  {d.brandName}
                </button>
                <span className="gx-pill gx-pill-good">
                  <Icon html={I.check} size={13} /> Paid {d.paidOn ? fmtDate(d.paidOn) : ""}
                </span>
                <strong>{fmtMoney(d.amountCents ?? d.receivedCents)}</strong>
              </li>
            ))}
            {lost.map((d) => (
              <li key={d.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: 14, alignItems: "center", padding: "11px 0" }}>
                <button
                  type="button"
                  onClick={() => setDealId(d.id)}
                  style={{ fontWeight: 600, background: "none", border: 0, padding: 0, textAlign: "left", cursor: "pointer", color: "var(--ink)", boxShadow: "none" }}
                >
                  {d.brandName}
                </button>
                <span className="gx-pill">Closed, not won</span>
                <span className="gx-muted">{d.amountCents ? fmtMoney(d.amountCents) : ""}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <DealSheet
        deal={deal}
        profile={profile}
        open={Boolean(deal)}
        onClose={() => setDealId(null)}
        onChanged={() => router.refresh()}
      />
      <AddDealSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        brandOptions={brandOptions}
        onAdded={() => router.refresh()}
      />
    </div>
  );
}

function AddDealSheet({
  open,
  onClose,
  brandOptions,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  brandOptions: { id: string; name: string }[];
  onAdded: () => void;
}) {
  const router = useRouter();
  const [brandSel, setBrandSel] = useState("");
  const [brandName, setBrandName] = useState("");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState("pitched");
  const [deliverables, setDeliverables] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const name = brandSel === "__other" ? brandName.trim() : brandSel;
    if (!name) {
      toast("Pick a brand first.");
      return;
    }
    setBusy(true);
    try {
      const cents = Math.round(parseFloat(amount));
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: name,
          stage,
          compensationCents: Number.isFinite(cents) && cents > 0 ? cents * 100 : null,
          deliverables,
          deadline: dueOn || null,
        }),
      });
      if (res.ok) {
        toast("Deal added.");
        router.refresh();
        onAdded();
        onClose();
      } else toast("The deal could not be added. Please try again.");
    } catch {
      toast("The deal could not be added. Please try again.");
    }
    setBusy(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add a deal" sub="For partnerships that started outside Ultra Vestra.">
      <label className="gx-field">
        <span>Brand</span>
        <select className="gx-input" value={brandSel} onChange={(e) => setBrandSel(e.target.value)}>
          <option value="">Choose a brand…</option>
          {brandOptions.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
          <option value="__other">Another brand</option>
        </select>
      </label>
      {brandSel === "__other" ? (
        <label className="gx-field">
          <span>Brand name</span>
          <input className="gx-input" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Brand name" />
        </label>
      ) : null}
      <div className="gx-row2">
        <label className="gx-field">
          <span>Deal value ($)</span>
          <input className="gx-input" type="number" min="0" step="1" inputMode="numeric" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="gx-field">
          <span>Stage</span>
          <select className="gx-input" value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.filter((s) => s.id !== "lost").map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="gx-field">
        <span>Deliverables</span>
        <input className="gx-input" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder="2 TikToks and 1 Story" />
      </label>
      <label className="gx-field">
        <span>Content due</span>
        <input className="gx-input" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
      </label>
      <div className="gx-sheet-actions">
        <span className="spacer" />
        <button type="button" className="gx-btn gx-btn-primary" disabled={busy} onClick={() => void submit()}>
          Add deal
        </button>
      </div>
    </Sheet>
  );
}
