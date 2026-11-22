"use client";

import { useEffect, useState } from "react";

// Partnership Protection Center — the terms of the creator's brand
// partnerships and every deadline inside them: contract ends,
// usage-rights expirations, exclusivity ends.
//
// HONESTY RULES (binding): every term on this page is one the
// creator entered from their own agreements — the copy says so
// plainly, and points them to keep the signed documents in their
// Agreement Vault. UltraVestra has not seen those documents and
// cannot verify the terms. The countdowns and the summary come from
// the API, which computes them deterministically from the stored
// dates (lib/protection/deadlines.ts) — this page renders those
// numbers and never re-derives its own. NO reminders are sent by
// this feature: there is no email or push in v1, the page says so,
// and the deadlines view is the reminder surface.
//
// All reads and writes go through /api/protection (session +
// subscription gated, owner-only). This page holds no direct
// database access. After every change the page reloads from the
// API, so what it shows is always the server's view of the stored
// rows — never a local guess.

type ProtectionAgreement = {
  id: string;
  brand_name: string;
  deliverables: string[];
  start_date: string | null;
  contract_end_date: string | null;
  usage_rights_end: string | null;
  exclusivity: "none" | "exclusive";
  exclusivity_end: string | null;
  payment_terms: string;
  notes: string;
  status: "active" | "ended";
  created_at: string;
  updated_at: string;
};

type Deadline = {
  agreementId: string;
  brandName: string;
  kind: "contract_end" | "usage_rights_end" | "exclusivity_end";
  date: string;
  daysLeft: number;
};

type ProtectionSummary = {
  activeAgreements: number;
  deadlinesNext30Days: number;
  overdueDeadlines: number;
  exclusivityActive: number;
};

const EMPTY_SUMMARY: ProtectionSummary = {
  activeAgreements: 0,
  deadlinesNext30Days: 0,
  overdueDeadlines: 0,
  exclusivityActive: 0,
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const KIND_LABELS: Record<Deadline["kind"], string> = {
  contract_end: "Contract ends",
  usage_rights_end: "Usage rights expire",
  exclusivity_end: "Exclusivity ends",
};

/** 'YYYY-MM-DD' → 'November 3, 2026', by string parts (no Date, no TZ). */
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

function DaysLeftPill({ daysLeft }: { daysLeft: number }) {
  let style = "border-white/20 text-gray-300";
  let label: string;
  if (daysLeft < 0) {
    style = "border-red-400/40 text-red-300";
    label = `${-daysLeft} ${daysLeft === -1 ? "day" : "days"} overdue`;
  } else if (daysLeft === 0) {
    style = "border-red-400/40 text-red-300";
    label = "Due today";
  } else if (daysLeft <= 7) {
    style = "border-red-400/40 text-red-300";
    label = `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
  } else if (daysLeft <= 30) {
    style = "border-amber-400/40 text-amber-300";
    label = `${daysLeft} days left`;
  } else {
    label = `${daysLeft} days left`;
  }
  return (
    <span
      className={`text-[11px] tracking-widest border rounded-full px-3 py-1 whitespace-nowrap ${style}`}
    >
      {label.toUpperCase()}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const style =
    status === "active"
      ? "border-emerald-400/40 text-emerald-300"
      : "border-white/20 text-gray-400";
  return (
    <span
      className={`text-[11px] tracking-widest border rounded-full px-3 py-1 ${style}`}
    >
      {status.toUpperCase()}
    </span>
  );
}

function SectionShell({
  label,
  title,
  blurb,
  children,
}: {
  label: string;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
      <div className="text-cyan-400 text-xs tracking-widest mb-3">{label}</div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400 text-sm mb-6">{blurb}</p>
      {children}
    </section>
  );
}

const inputClass =
  "mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white";

export default function ProtectionPage() {
  const [agreements, setAgreements] = useState<ProtectionAgreement[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [summary, setSummary] = useState<ProtectionSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [brandName, setBrandName] = useState("");
  const [deliverablesText, setDeliverablesText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [usageRightsEnd, setUsageRightsEnd] = useState("");
  const [exclusivity, setExclusivity] = useState<"none" | "exclusive">("none");
  const [exclusivityEnd, setExclusivityEnd] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/protection");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your agreements could not be loaded.");
      }
      setAgreements(data.agreements ?? []);
      setDeadlines(data.deadlines ?? []);
      setSummary(data.summary ?? EMPTY_SUMMARY);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your agreements could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const deliverables = deliverablesText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const deliverablesValid =
    deliverables.length <= 50 &&
    deliverables.every((line) => line.length <= 300);
  const formComplete = brandName.trim().length > 0 && deliverablesValid;

  async function addAgreement() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/protection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          deliverables,
          startDate,
          contractEndDate,
          usageRightsEnd,
          exclusivity,
          exclusivityEnd,
          paymentTerms: paymentTerms.trim(),
          notes: notes.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your agreement could not be saved.");
      }
      setBrandName("");
      setDeliverablesText("");
      setStartDate("");
      setContractEndDate("");
      setUsageRightsEnd("");
      setExclusivity("none");
      setExclusivityEnd("");
      setPaymentTerms("");
      setNotes("");
      // Reload so the deadlines and totals shown are the server's
      // fresh computation over the stored rows.
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your agreement could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function flipStatus(agreement: ProtectionAgreement) {
    setBusyId(agreement.id);
    setError("");
    try {
      const response = await fetch("/api/protection", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agreement.id,
          status: agreement.status === "active" ? "ended" : "active",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your agreement could not be updated.");
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your agreement could not be updated."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteAgreement(id: string) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(
        `/api/protection?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your agreement could not be deleted.");
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your agreement could not be deleted."
      );
    } finally {
      setBusyId(null);
    }
  }

  const summaryCards: Array<[string, string, string]> = [
    [String(summary.activeAgreements), "Active agreements", "text-cyan-400"],
    [
      String(summary.deadlinesNext30Days),
      "Deadlines in next 30 days",
      "text-amber-300",
    ],
    [String(summary.overdueDeadlines), "Overdue deadlines", "text-red-300"],
    [
      String(summary.exclusivityActive),
      "Exclusivity in force",
      "text-fuchsia-300",
    ],
  ];

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / PARTNERSHIP PROTECTION CENTER
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          ULTRA VESTRA — PARTNERSHIP PROTECTION CENTER
        </div>

        <div className="mb-12">
          <div className="text-cyan-400 text-sm mb-3">
            YOUR TERMS. YOUR DEADLINES. NOTHING SILENT.
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            EVERY DATE THAT
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
              PROTECTS YOU.
            </span>
          </h1>

          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Record the terms of each partnership — what you owe, when the
            contract ends, when usage rights expire, how long you are
            exclusive — and watch every deadline count down before it can
            pass you by.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          <div className="text-cyan-400 text-xs tracking-widest mb-4">
            TERMS YOU ENTERED FROM YOUR AGREEMENTS
          </div>
          <p className="text-sm text-gray-300 leading-6">
            Every term on this page is one you typed in from your own
            agreements —{" "}
            <strong className="text-gray-100">
              keep the signed documents in your Agreement Vault
            </strong>
            . UltraVestra has not seen those documents and cannot verify
            the terms; the countdowns are simple date math on what you
            entered.{" "}
            <strong className="text-gray-100">
              UltraVestra does not send email or push reminders
            </strong>{" "}
            — this page is your reminder surface, so check it before you
            sign, post, or renew.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm mb-6">
            {error}
          </p>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="text-4xl animate-pulse mb-4">◈</div>
            <h3 className="text-xl font-bold">Loading your agreements</h3>
            <p className="text-gray-400 mt-2">Gathering your terms...</p>
          </div>
        ) : (
          <div className="space-y-10">
            <div>
              <div className="text-cyan-400 text-xs tracking-widest mb-4">
                YOUR PARTNERSHIPS AT A GLANCE
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {summaryCards.map(([value, label, color]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-white/[.04] border border-white/10 p-5"
                  >
                    <div className={`text-3xl font-bold ${color}`}>{value}</div>
                    <div className="text-gray-400 text-sm mt-2">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <SectionShell
              label="UPCOMING DEADLINES"
              title="What needs your attention"
              blurb="Every deadline inside your active agreements, nearest first — contract ends, usage-rights expirations, and exclusivity ends, counted down from today."
            >
              {deadlines.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No deadlines recorded yet — add an agreement with dates
                  below and they will count down here.
                </p>
              ) : (
                <div className="space-y-3">
                  {deadlines.map((deadline) => (
                    <div
                      key={`${deadline.agreementId}-${deadline.kind}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.02] px-5 py-4"
                    >
                      <div>
                        <div className="font-bold">{deadline.brandName}</div>
                        <div className="text-gray-400 text-sm mt-1">
                          {KIND_LABELS[deadline.kind]} ·{" "}
                          {formatDate(deadline.date)}
                        </div>
                      </div>
                      <DaysLeftPill daysLeft={deadline.daysLeft} />
                    </div>
                  ))}
                </div>
              )}
            </SectionShell>

            <SectionShell
              label="ADD AN AGREEMENT"
              title="Record a partnership"
              blurb="Copy the terms from the agreement you signed. Leave a date blank if the agreement does not set one."
            >
              <div className="grid md:grid-cols-2 gap-5">
                <label className="text-sm text-gray-300">
                  Brand name
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Example: Nomatic"
                    maxLength={200}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Exclusivity
                  <select
                    value={exclusivity}
                    onChange={(e) =>
                      setExclusivity(e.target.value as "none" | "exclusive")
                    }
                    className={inputClass}
                  >
                    <option value="none">Non-exclusive</option>
                    <option value="exclusive">Exclusive</option>
                  </select>
                </label>
                <label className="text-sm text-gray-300 md:col-span-2">
                  Deliverables — one per line
                  <textarea
                    value={deliverablesText}
                    onChange={(e) => setDeliverablesText(e.target.value)}
                    placeholder={
                      "Example:\n2 TikTok videos\n1 Instagram post\nUsage rights for 90 days"
                    }
                    rows={4}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Start date (optional)
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Contract end date (optional)
                  <input
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Usage rights end (optional)
                  <input
                    type="date"
                    value={usageRightsEnd}
                    onChange={(e) => setUsageRightsEnd(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Exclusivity end (optional)
                  <input
                    type="date"
                    value={exclusivityEnd}
                    onChange={(e) => setExclusivityEnd(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Payment terms (optional)
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Example: Net 30 after posting"
                    maxLength={500}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Notes (optional)
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Example: Renewal call scheduled with the brand"
                    maxLength={1000}
                    className={inputClass}
                  />
                </label>
              </div>
              {!deliverablesValid && (
                <p role="alert" className="text-red-400 text-sm mt-4">
                  Keep deliverables to at most 50 lines, each 300
                  characters or fewer.
                </p>
              )}
              <button
                onClick={addAgreement}
                disabled={saving || !formComplete}
                className="mt-6 w-full rounded-xl p-5 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
              >
                {saving ? "Saving..." : "Add agreement"}
              </button>
            </SectionShell>

            <SectionShell
              label="YOUR AGREEMENTS"
              title="Agreements"
              blurb="Every partnership you have recorded, with the terms exactly as you entered them. When a partnership is over, mark it ended — its dates stop counting down, and the record stays."
            >
              {agreements.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No agreements yet — add your first partnership above.
                </p>
              ) : (
                <div className="space-y-3">
                  {agreements.map((agreement) => (
                    <div
                      key={agreement.id}
                      className="rounded-2xl border border-white/10 bg-white/[.02] px-5 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="font-bold">{agreement.brand_name}</div>
                        <StatusPill status={agreement.status} />
                      </div>

                      {agreement.deliverables.length > 0 && (
                        <div className="mt-4">
                          <div className="text-cyan-400 text-xs tracking-widest mb-2">
                            DELIVERABLES
                          </div>
                          <ul className="space-y-1.5">
                            {agreement.deliverables.map((item, index) => (
                              <li
                                key={index}
                                className="flex gap-2 text-sm text-gray-300"
                              >
                                <span className="text-cyan-400">◈</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
                        {agreement.start_date && (
                          <div className="text-gray-400">
                            Starts{" "}
                            <span className="text-gray-200">
                              {formatDate(agreement.start_date)}
                            </span>
                          </div>
                        )}
                        {agreement.contract_end_date && (
                          <div className="text-gray-400">
                            Contract ends{" "}
                            <span className="text-gray-200">
                              {formatDate(agreement.contract_end_date)}
                            </span>
                          </div>
                        )}
                        {agreement.usage_rights_end && (
                          <div className="text-gray-400">
                            Usage rights end{" "}
                            <span className="text-gray-200">
                              {formatDate(agreement.usage_rights_end)}
                            </span>
                          </div>
                        )}
                        <div className="text-gray-400">
                          Exclusivity{" "}
                          <span className="text-gray-200">
                            {agreement.exclusivity === "none"
                              ? "Non-exclusive"
                              : agreement.exclusivity_end
                                ? `Exclusive until ${formatDate(agreement.exclusivity_end)}`
                                : "Exclusive — no end date recorded"}
                          </span>
                        </div>
                        {agreement.payment_terms && (
                          <div className="text-gray-400">
                            Payment terms{" "}
                            <span className="text-gray-200">
                              {agreement.payment_terms}
                            </span>
                          </div>
                        )}
                      </div>

                      {agreement.notes && (
                        <div className="text-gray-500 text-sm mt-3">
                          {agreement.notes}
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => flipStatus(agreement)}
                          disabled={busyId === agreement.id}
                          className="rounded-lg border border-cyan-400/40 text-cyan-300 px-4 py-2 text-sm hover:bg-cyan-400/10 disabled:opacity-40 transition"
                        >
                          {agreement.status === "active"
                            ? "Mark ended"
                            : "Reactivate"}
                        </button>
                        <button
                          onClick={() => deleteAgreement(agreement.id)}
                          disabled={busyId === agreement.id}
                          className="rounded-lg border border-red-400/40 text-red-300 px-4 py-2 text-sm hover:bg-red-400/10 disabled:opacity-40 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionShell>
          </div>
        )}
      </div>
    </main>
  );
}
