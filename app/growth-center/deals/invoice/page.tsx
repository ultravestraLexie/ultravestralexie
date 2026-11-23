"use client";

import { useEffect, useState } from "react";

// Build 14 — invoice generation from a deal record. One click
// from the deal card ("View invoice") renders a clean invoice
// document built ONLY from figures the creator recorded on the
// deal: amount, invoice date, terms, due date, amount received,
// remaining balance, and the tracked deliverables.
//
// HONESTY RULES (binding):
// - Nothing on this document is invented. A field the creator
//   never recorded says "Not recorded" — it is never filled in
//   by assumption. The due date carries the "(calculated from
//   the invoice date and terms)" label whenever it was
//   calculated, exactly like the deal card.
// - The invoice number is derived from the deal record itself
//   (invoice date + the deal's own id), so the same deal always
//   produces the same number — it is a reference to the record,
//   not a sequential ledger UltraVestra keeps.
// - UltraVestra did not process any payment for this deal. The
//   document says so at the bottom.

type DeliverableItem = {
  id: string;
  title: string;
  due_date: string | null;
  status: "pending" | "delivered" | "approved";
  revisions: number;
  /** Build 16 — the post that fulfilled this item, when the
   *  creator linked one. Shown on the invoice as evidence. */
  post_id: string | null;
};

type Deal = {
  id: string;
  brand_name: string;
  platform: string | null;
  stage: string;
  compensation_cents: number | null;
  deliverables: string;
  invoice_sent_date: string | null;
  payment_terms: string | null;
  payment_due_date: string | null;
  payment_received_date: string | null;
  amount_received_cents: number | null;
  created_at: string;
  deliverable_items: DeliverableItem[];
  payment: {
    receivedCents: number;
    remainingCents: number | null;
    fullyPaid: boolean;
    dueDate: string | null;
    dueDateCalculated: boolean;
  };
};

/** Build 16b — an issued invoice snapshot: the document frozen
 *  server-side at issuance. It never changes afterward. */
type SnapshotItem = {
  deliverableId: string;
  title: string;
  status: string;
  dueDate: string | null;
  revisions: number;
  post: {
    title: string;
    url: string | null;
    platform: string;
    postedDate: string;
  } | null;
};

type SnapshotDoc = {
  invoiceNumber: string;
  brandName: string;
  brandPlatform: string | null;
  creatorName: string | null;
  invoiceDate: string | null;
  terms: string | null;
  dueDate: string | null;
  dueDateCalculated: boolean;
  stage: string;
  deliverablesText: string;
  items: SnapshotItem[];
  amountCents: number | null;
  receivedCents: number;
  receivedDate: string | null;
  balanceDueCents: number | null;
  fullyPaid: boolean;
};

type SnapshotRow = {
  id: string;
  version: number;
  invoice_number: string;
  issued_at: string;
  snapshot: SnapshotDoc;
};

const TERMS_LABEL = new Map([
  ["due_on_receipt", "Due on receipt"],
  ["net_7", "Net 7"],
  ["net_14", "Net 14"],
  ["net_30", "Net 30"],
  ["net_45", "Net 45"],
  ["net_60", "Net 60"],
  ["other", "Other terms"],
]);

const PLATFORM_LABEL = new Map([
  ["tiktok", "TikTok"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook / Meta"],
  ["trybe", "Trybe"],
  ["other", "Other"],
]);

const STATUS_LABEL = new Map([
  ["pending", "To do"],
  ["delivered", "Delivered"],
  ["approved", "Approved"],
]);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function money(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

export default function DealInvoicePage() {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [postDetails, setPostDetails] = useState<
    Record<string, { title: string; url: string | null }>
  >({});
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [view, setView] = useState<"live" | number>("live");
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState("");
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">(
    "loading"
  );

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("deal");
    if (!id) {
      setState("missing");
      return;
    }
    (async () => {
      try {
        const [dealsRes, profileRes, postsRes, snapsRes] = await Promise.all([
          fetch("/api/deals"),
          fetch("/api/business-profile"),
          fetch("/api/posts"),
          fetch(`/api/deals/invoice-snapshots?dealId=${encodeURIComponent(id)}`),
        ]);
        const dealsData = await dealsRes.json();
        if (!dealsRes.ok) {
          throw new Error(dealsData.error || "Your deals could not be loaded.");
        }
        const found = ((dealsData.deals ?? []) as Deal[]).find(
          (d) => d.id === id
        );
        if (!found) {
          setState("missing");
          return;
        }
        setDeal(found);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          const details: Record<string, { title: string; url: string | null }> =
            {};
          for (const p of (postsData.posts ?? []) as {
            id: string;
            title: string | null;
            external_url: string | null;
          }[]) {
            details[p.id] = {
              title:
                p.title && p.title.trim() !== "" ? p.title : "Untitled post",
              url: p.external_url,
            };
          }
          setPostDetails(details);
        }
        if (snapsRes.ok) {
          const snapsData = await snapsRes.json();
          const rows = (snapsData.snapshots ?? []) as SnapshotRow[];
          setSnapshots(rows);
          // The issued copy of record is the default view when
          // one exists — the live view is one tap away.
          if (rows.length > 0) setView(rows[rows.length - 1].version);
        }
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const name =
            profileData.profile?.creatorName ??
            profileData.profile?.creator_name ??
            null;
          if (typeof name === "string" && name.trim() !== "") {
            setCreatorName(name.trim());
          }
        }
        setState("ready");
      } catch {
        setState("error");
      }
    })();
  }, []);

  const latestSnapshot =
    snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const viewedSnapshot =
    view !== "live"
      ? (snapshots.find((s) => s.version === view) ?? null)
      : null;

  /** Build 16b — freeze the current live document as the next
   *  issued version. The server builds the snapshot from the
   *  records; this page only asks. */
  async function issueInvoice() {
    if (!deal || issuing) return;
    setIssuing(true);
    setIssueError("");
    try {
      const response = await fetch("/api/deals/invoice-snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: deal.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "The invoice could not be issued.");
      }
      const row = data.snapshot as SnapshotRow;
      setSnapshots((prev) => [...prev, row]);
      setView(row.version);
    } catch (e) {
      setIssueError(
        e instanceof Error ? e.message : "The invoice could not be issued."
      );
    } finally {
      setIssuing(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-doc, #invoice-doc * { visibility: visible; }
          #invoice-doc {
            position: absolute; left: 0; top: 0; width: 100%;
            box-shadow: none !important; border-radius: 0 !important;
          }
        }
      `}</style>
      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <a href="/growth-center/deals" className="text-cyan-300 underline">
            ← Back to Brand Deals
          </a>
          {state === "ready" && deal && (
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl border border-cyan-400/40 px-4 py-2 text-cyan-200"
            >
              Print / Save as PDF
            </button>
          )}
        </div>

        {state === "loading" && (
          <p className="text-gray-400">Building your invoice…</p>
        )}
        {state === "missing" && (
          <p className="text-gray-300">
            That deal could not be found among your deals. Open the
            invoice from the deal card in{" "}
            <a href="/growth-center/deals" className="text-cyan-300 underline">
              Brand Deals
            </a>
            .
          </p>
        )}
        {state === "error" && (
          <p className="text-red-200">
            The invoice could not be built. Please try again.
          </p>
        )}

        {state === "ready" && deal && (
          <>
            {/* Build 16b — issuance controls (screen only; the
                printed document below stays clean). The issued
                copy is frozen forever; the live view keeps
                moving with the records, and marks where it has
                moved away from the issued copy. */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[.03] p-4">
              {snapshots.length === 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-gray-300 text-sm max-w-md">
                    This is a <strong>live view</strong> of your
                    records — it changes when they change. Issue
                    the invoice to freeze the copy of record.
                  </p>
                  <button
                    type="button"
                    onClick={issueInvoice}
                    disabled={issuing}
                    className="rounded-xl bg-cyan-400 px-4 py-2 font-bold text-black hover:bg-cyan-300 disabled:opacity-40 transition"
                  >
                    {issuing ? "Issuing…" : "Issue invoice"}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {snapshots.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setView(s.version)}
                        className={`rounded-lg px-3 py-1.5 text-sm border ${
                          view === s.version
                            ? "border-cyan-300 text-cyan-200 bg-cyan-400/10"
                            : "border-white/15 text-gray-300"
                        }`}
                      >
                        Issued v{s.version}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setView("live")}
                      className={`rounded-lg px-3 py-1.5 text-sm border ${
                        view === "live"
                          ? "border-cyan-300 text-cyan-200 bg-cyan-400/10"
                          : "border-white/15 text-gray-300"
                      }`}
                    >
                      Live version
                    </button>
                    {view === "live" && (
                      <button
                        type="button"
                        onClick={issueInvoice}
                        disabled={issuing}
                        className="rounded-lg bg-cyan-400 px-3 py-1.5 text-sm font-bold text-black hover:bg-cyan-300 disabled:opacity-40 transition ml-auto"
                      >
                        {issuing
                          ? "Issuing…"
                          : `Issue revised version (v${snapshots.length + 1})`}
                      </button>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    {view === "live"
                      ? "Live view — your records today. Where they differ from the issued copy, the difference is marked on the document."
                      : `Issued copy of record — version ${view}. It is frozen as issued; later changes to your records do not alter it. Corrections are issued as a new version.`}
                  </p>
                </div>
              )}
              {issueError && (
                <p className="text-red-300 text-sm mt-2">{issueError}</p>
              )}
            </div>

            {view === "live" ? (
          <div
            id="invoice-doc"
            className="rounded-2xl bg-white text-gray-900 p-8 md:p-10 shadow-2xl"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-3xl font-black tracking-tight">
                  INVOICE
                </div>
                <div className="text-gray-500 text-sm mt-1">
                  Invoice no. UV-
                  {(deal.invoice_sent_date ?? deal.created_at.slice(0, 10)).replaceAll(
                    "-",
                    ""
                  )}
                  -{deal.id.slice(0, 6).toUpperCase()}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="text-gray-500">From</div>
                <div className="font-semibold">
                  {creatorName ?? "Creator"}
                </div>
                {!creatorName && (
                  <div className="text-gray-500 text-xs">
                    (add your name in your Business Profile)
                  </div>
                )}
                <div className="text-gray-500 mt-3">Bill to</div>
                <div className="font-semibold">{deal.brand_name}</div>
                {deal.platform && (
                  <div className="text-gray-500">
                    {PLATFORM_LABEL.get(deal.platform) ?? deal.platform}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-sm">
              <div>
                <div className="text-gray-500">Invoice date</div>
                <div className="font-medium">
                  {deal.invoice_sent_date
                    ? formatDate(deal.invoice_sent_date)
                    : "Not recorded"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Terms</div>
                <div className="font-medium">
                  {deal.payment_terms
                    ? (TERMS_LABEL.get(deal.payment_terms) ?? deal.payment_terms)
                    : "Not recorded"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Payment due</div>
                <div className="font-medium">
                  {deal.payment.dueDate
                    ? formatDate(deal.payment.dueDate)
                    : "Not recorded"}
                </div>
                {deal.payment.dueDateCalculated && (
                  <div className="text-gray-500 text-xs">
                    (calculated from the invoice date and terms)
                  </div>
                )}
              </div>
              <div>
                <div className="text-gray-500">Stage</div>
                <div className="font-medium capitalize">{deal.stage}</div>
              </div>
            </div>

            <table className="w-full mt-8 text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-left">
                  <th className="py-2 font-semibold">Description</th>
                  <th className="py-2 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 align-top">
                  <td className="py-3">
                    <div className="font-medium">
                      Brand partnership — {deal.brand_name}
                    </div>
                    {deal.deliverables && (
                      <div className="text-gray-600 mt-1 whitespace-pre-line">
                        {deal.deliverables}
                      </div>
                    )}
                    {deal.deliverable_items.length > 0 && (
                      <ul className="text-gray-600 mt-2 list-disc pl-5">
                        {deal.deliverable_items.map((item) => (
                          <li key={item.id}>
                            {item.title} —{" "}
                            {STATUS_LABEL.get(item.status) ?? item.status}
                            {item.due_date
                              ? ` · due ${formatDate(item.due_date)}`
                              : ""}
                            {item.revisions > 0
                              ? ` · ${item.revisions} revision${item.revisions === 1 ? "" : "s"}`
                              : ""}
                            {item.post_id && postDetails[item.post_id]
                              ? ` · Post: ${postDetails[item.post_id].title}${
                                  postDetails[item.post_id].url
                                    ? ` — ${postDetails[item.post_id].url}`
                                    : ""
                                }`
                              : ""}
                            {(() => {
                              // Build 16b — if the issued copy
                              // names a fulfilling post and the
                              // live record no longer matches it,
                              // say so on the live view. The
                              // issued copy itself never changes.
                              const snapItem =
                                latestSnapshot?.snapshot.items.find(
                                  (si) => si.deliverableId === item.id
                                );
                              if (!snapItem?.post) return null;
                              const livePost = item.post_id
                                ? postDetails[item.post_id]
                                : undefined;
                              if (!livePost) {
                                return (
                                  <div className="text-amber-700">
                                    Changed since issuance: this
                                    deliverable was fulfilled by post
                                    &ldquo;{snapItem.post.title}&rdquo;
                                    — that post has been deleted or
                                    unlinked. The issued copy
                                    preserves the original evidence.
                                  </div>
                                );
                              }
                              if (
                                livePost.title !== snapItem.post.title ||
                                (livePost.url ?? null) !==
                                  (snapItem.post.url ?? null)
                              ) {
                                return (
                                  <div className="text-amber-700">
                                    Changed since issuance: the
                                    issued copy names post &ldquo;
                                    {snapItem.post.title}&rdquo; as
                                    the fulfilling post.
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="py-3 text-right font-medium">
                    {deal.compensation_cents !== null
                      ? money(deal.compensation_cents)
                      : "Not recorded"}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 ml-auto max-w-xs text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">
                  {deal.compensation_cents !== null
                    ? money(deal.compensation_cents)
                    : "Not recorded"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Received</span>
                <span className="font-medium">
                  {money(deal.payment.receivedCents)}
                  {deal.payment_received_date
                    ? ` · ${formatDate(deal.payment_received_date)}`
                    : ""}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-300 text-base">
                <span className="font-bold">Balance due</span>
                <span className="font-bold">
                  {deal.payment.fullyPaid
                    ? money(0)
                    : deal.payment.remainingCents !== null
                      ? money(deal.payment.remainingCents)
                      : deal.compensation_cents !== null
                        ? money(deal.compensation_cents)
                        : "Not recorded"}
                </span>
              </div>
              {deal.payment.fullyPaid && (
                <p className="text-emerald-700 font-semibold text-right">
                  Paid in full
                </p>
              )}
            </div>

            <p className="text-gray-500 text-xs mt-10 border-t border-gray-200 pt-4">
              Generated from your UltraVestra deal record on{" "}
              {formatDate(today)}. Every figure on this invoice is a
              figure you recorded on the deal — UltraVestra did not
              process this payment and does not hold funds for it.
            </p>
          </div>
            ) : viewedSnapshot ? (
              <div
                id="invoice-doc"
                className="rounded-2xl bg-white text-gray-900 p-8 md:p-10 shadow-2xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-3xl font-black tracking-tight">
                      INVOICE
                    </div>
                    <div className="text-gray-500 text-sm mt-1">
                      Invoice no. {viewedSnapshot.snapshot.invoiceNumber}{" "}
                      · Version {viewedSnapshot.version} — issued{" "}
                      {formatDate(viewedSnapshot.issued_at.slice(0, 10))}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-500">From</div>
                    <div className="font-semibold">
                      {viewedSnapshot.snapshot.creatorName ?? "Creator"}
                    </div>
                    <div className="text-gray-500 mt-3">Bill to</div>
                    <div className="font-semibold">
                      {viewedSnapshot.snapshot.brandName}
                    </div>
                    {viewedSnapshot.snapshot.brandPlatform && (
                      <div className="text-gray-500">
                        {PLATFORM_LABEL.get(
                          viewedSnapshot.snapshot.brandPlatform
                        ) ?? viewedSnapshot.snapshot.brandPlatform}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-sm">
                  <div>
                    <div className="text-gray-500">Invoice date</div>
                    <div className="font-medium">
                      {viewedSnapshot.snapshot.invoiceDate
                        ? formatDate(viewedSnapshot.snapshot.invoiceDate)
                        : "Not recorded"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Terms</div>
                    <div className="font-medium">
                      {viewedSnapshot.snapshot.terms
                        ? (TERMS_LABEL.get(viewedSnapshot.snapshot.terms) ??
                          viewedSnapshot.snapshot.terms)
                        : "Not recorded"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Payment due</div>
                    <div className="font-medium">
                      {viewedSnapshot.snapshot.dueDate
                        ? formatDate(viewedSnapshot.snapshot.dueDate)
                        : "Not recorded"}
                    </div>
                    {viewedSnapshot.snapshot.dueDateCalculated && (
                      <div className="text-gray-500 text-xs">
                        (calculated from the invoice date and terms)
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-gray-500">Stage</div>
                    <div className="font-medium capitalize">
                      {viewedSnapshot.snapshot.stage}
                    </div>
                  </div>
                </div>

                <table className="w-full mt-8 text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 text-left">
                      <th className="py-2 font-semibold">Description</th>
                      <th className="py-2 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 align-top">
                      <td className="py-3">
                        <div className="font-medium">
                          Brand partnership —{" "}
                          {viewedSnapshot.snapshot.brandName}
                        </div>
                        {viewedSnapshot.snapshot.deliverablesText && (
                          <div className="text-gray-600 mt-1 whitespace-pre-line">
                            {viewedSnapshot.snapshot.deliverablesText}
                          </div>
                        )}
                        {viewedSnapshot.snapshot.items.length > 0 && (
                          <ul className="text-gray-600 mt-2 list-disc pl-5">
                            {viewedSnapshot.snapshot.items.map((item) => (
                              <li key={item.deliverableId}>
                                {item.title} —{" "}
                                {STATUS_LABEL.get(item.status) ?? item.status}
                                {item.dueDate
                                  ? ` · due ${formatDate(item.dueDate)}`
                                  : ""}
                                {item.revisions > 0
                                  ? ` · ${item.revisions} revision${item.revisions === 1 ? "" : "s"}`
                                  : ""}
                                {item.post
                                  ? ` · Post: ${item.post.title} (${item.post.platform} · ${formatDate(item.post.postedDate)})${item.post.url ? ` — ${item.post.url}` : ""}`
                                  : ""}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {viewedSnapshot.snapshot.amountCents !== null
                          ? money(viewedSnapshot.snapshot.amountCents)
                          : "Not recorded"}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-6 ml-auto max-w-xs text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-medium">
                      {viewedSnapshot.snapshot.amountCents !== null
                        ? money(viewedSnapshot.snapshot.amountCents)
                        : "Not recorded"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Received</span>
                    <span className="font-medium">
                      {money(viewedSnapshot.snapshot.receivedCents)}
                      {viewedSnapshot.snapshot.receivedDate
                        ? ` · ${formatDate(viewedSnapshot.snapshot.receivedDate)}`
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-300 text-base">
                    <span className="font-bold">Balance due</span>
                    <span className="font-bold">
                      {viewedSnapshot.snapshot.balanceDueCents !== null
                        ? money(viewedSnapshot.snapshot.balanceDueCents)
                        : "Not recorded"}
                    </span>
                  </div>
                  {viewedSnapshot.snapshot.fullyPaid && (
                    <p className="text-emerald-700 font-semibold text-right">
                      Paid in full
                    </p>
                  )}
                </div>

                <p className="text-gray-500 text-xs mt-10 border-t border-gray-200 pt-4">
                  Issued copy of record — frozen on{" "}
                  {formatDate(viewedSnapshot.issued_at.slice(0, 10))}.
                  This document does not change when your records
                  change; a correction is issued as a new version.
                  Every figure is as recorded at issuance —
                  UltraVestra did not process this payment and does
                  not hold funds for it.
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
