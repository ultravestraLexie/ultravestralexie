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
        const [dealsRes, profileRes] = await Promise.all([
          fetch("/api/deals"),
          fetch("/api/business-profile"),
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
        )}
      </div>
    </main>
  );
}
