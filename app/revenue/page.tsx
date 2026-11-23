"use client";

import { useEffect, useState } from "react";

// Creator Revenue Tracker — what the creator has actually earned
// across brand partnerships, what is still owed to them, and which
// brands the money comes from.
//
// HONESTY RULE (binding): every number on this page comes from the
// summary the API computes over the creator's own entered records
// (lib/revenue/summary.ts) — this page renders those numbers and
// never re-derives its own. Entries are creator-reported: the copy
// says plainly that UltraVestra does not receive the creator's
// affiliate payouts. Nothing is estimated, projected, or pulled
// from any network. Money travels as integer cents; the formatter
// below is exact integer math, display only.
//
// All reads and writes go through /api/revenue (session +
// subscription gated, owner-only). This page holds no direct
// database access. After every change the page reloads from the
// API, so the totals it shows are always the server's summary of
// the stored rows — never a local guess.

type RevenueKind =
  | "campaign_fee"
  | "affiliate_commission"
  | "brand_payment"
  | "platform_payout"
  | "other";

type RevenuePlatform = "tiktok" | "instagram" | "youtube" | "amazon" | "other";

type RevenueEntry = {
  id: string;
  brand_name: string;
  amount_cents: number;
  status: "pending" | "paid";
  kind: RevenueKind;
  platform: RevenuePlatform | null;
  earned_date: string;
  due_date: string | null;
  note: string;
  deal_id: string | null;
  created_at: string;
  updated_at: string;
};

const PLATFORM_LABELS: Record<RevenuePlatform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  amazon: "Amazon",
  other: "Other",
};

const PLATFORM_OPTIONS = Object.entries(PLATFORM_LABELS) as [
  RevenuePlatform,
  string,
][];

const KIND_LABELS: Record<RevenueKind, string> = {
  campaign_fee: "Campaign fee",
  affiliate_commission: "Affiliate commission",
  brand_payment: "Brand payment",
  platform_payout: "Platform payout",
  other: "Other",
};

const KIND_OPTIONS = Object.entries(KIND_LABELS) as [RevenueKind, string][];

type BrandTotal = {
  brandName: string;
  totalCents: number;
  pendingCents: number;
  paidCents: number;
  count: number;
};

type MonthTotal = {
  month: string;
  totalCents: number;
  paidCents: number;
  pendingCents: number;
};

type KindTotal = {
  kind: RevenueKind;
  totalCents: number;
  pendingCents: number;
  paidCents: number;
  count: number;
};

type YearTotal = {
  year: number;
  totalCents: number;
  paidCents: number;
  pendingCents: number;
};

type RevenueSummary = {
  totalEarnedCents: number;
  pendingCents: number;
  receivedCents: number;
  byBrand: BrandTotal[];
  monthly: MonthTotal[];
  byKind: KindTotal[];
  yearly: YearTotal[];
  currentMonthCents: number;
  previousMonthCents: number;
};

const EMPTY_SUMMARY: RevenueSummary = {
  totalEarnedCents: 0,
  pendingCents: 0,
  receivedCents: 0,
  byBrand: [],
  monthly: [],
  byKind: [],
  yearly: [],
  currentMonthCents: 0,
  previousMonthCents: 0,
};

// --- Estimated platform earnings --------------------------------------
// A separate shape from a separate API (/api/revenue/estimates) over
// a separate table. Nothing below ever touches the recorded summary
// above — the two are rendered in separate sections and never added
// together.

type RevenueEstimate = {
  id: string;
  platform: string;
  amount_cents: number;
  period_month: string;
  note: string;
  basis: "creator_entered" | "platform_reported";
  created_at: string;
  updated_at: string;
};

type EstimateSummary = {
  totalEstimatedCents: number;
  byPlatform: { platform: string; totalCents: number; count: number }[];
  byMonth: { month: string; totalCents: number }[];
  creatorEnteredCents: number;
  platformReportedCents: number;
};

const EMPTY_ESTIMATE_SUMMARY: EstimateSummary = {
  totalEstimatedCents: 0,
  byPlatform: [],
  byMonth: [],
  creatorEnteredCents: 0,
  platformReportedCents: 0,
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Exact integer formatting: cents → $X,XXX.XX. No float division —
 *  the dollar and cent parts come from integer math on the cents. */
function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = String(abs % 100).padStart(2, "0");
  return `${sign}$${dollars.toLocaleString("en-US")}.${remainder}`;
}

/** 'YYYY-MM' → 'November 2026', by string parts (no Date, no TZ). */
function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** 'YYYY-MM-DD' → 'November 3, 2026', by string parts. */
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

/** Dollars typed by the creator ('250', '250.5', '250.50') → integer
 *  cents, or null when the text is not a clean amount. */
function dollarsToCents(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const cents =
    Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 1 || cents > 100_000_000) {
    return null;
  }
  return cents;
}

function StatusPill({ status }: { status: string }) {
  const style =
    status === "paid"
      ? "border-emerald-400/40 text-emerald-300"
      : "border-amber-400/40 text-amber-300";
  const label = status === "paid" ? "PAID" : "PENDING — OWED TO YOU";
  return (
    <span
      className={`text-[11px] tracking-widest border rounded-full px-3 py-1 ${style}`}
    >
      {label}
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

export default function RevenuePage() {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [summary, setSummary] = useState<RevenueSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [brandName, setBrandName] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"pending" | "paid">("pending");
  const [kind, setKind] = useState<RevenueKind>("other");
  const [platform, setPlatform] = useState<RevenuePlatform | "">("");
  const [earnedDate, setEarnedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  // Phase 1 Build 3: when the creator arrives from a paid deal's
  // "Record in Revenue" action, the form is prefilled and the saved
  // entry carries the deal link. Nothing is created until the
  // creator checks the values and saves — money truth stays a
  // deliberate recorded act.
  const [dealId, setDealId] = useState<string | null>(null);
  const [prefillNote, setPrefillNote] = useState("");

  const [estimates, setEstimates] = useState<RevenueEstimate[]>([]);
  const [estimateSummary, setEstimateSummary] =
    useState<EstimateSummary>(EMPTY_ESTIMATE_SUMMARY);
  const [estimatePlatform, setEstimatePlatform] = useState("");
  const [estimateAmount, setEstimateAmount] = useState("");
  const [estimateMonth, setEstimateMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [estimateNote, setEstimateNote] = useState("");
  const [estimateSaving, setEstimateSaving] = useState(false);
  const [estimateBusyId, setEstimateBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const response = await fetch("/api/revenue");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your revenue entries could not be loaded.");
      }
      setEntries(data.entries ?? []);
      setSummary(data.summary ?? EMPTY_SUMMARY);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your revenue entries could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadEstimates() {
    try {
      const response = await fetch("/api/revenue/estimates");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your estimates could not be loaded.");
      }
      setEstimates(data.estimates ?? []);
      setEstimateSummary(data.summary ?? EMPTY_ESTIMATE_SUMMARY);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your estimates could not be loaded."
      );
    }
  }

  useEffect(() => {
    load();
    loadEstimates();
  }, []);

  // Deal → Revenue prefill (Build 3): read the handoff params once
  // on mount. Values are only placed into the form — the creator
  // confirms or edits before anything is saved.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const brand = params.get("brand_name");
    const centsRaw = params.get("amount_cents");
    const deal = params.get("deal_id");
    if (!brand && !deal) return;
    if (brand) setBrandName(brand.slice(0, 200));
    if (centsRaw && /^\d+$/.test(centsRaw)) {
      const cents = Number(centsRaw);
      if (cents > 0) setAmount((cents / 100).toFixed(2));
    }
    if (params.get("status") === "paid") setStatus("paid");
    if (deal) setDealId(deal);
    setPrefillNote(
      "Prefilled from your deal — check the brand and amount, then save to record it. Nothing was recorded yet."
    );
  }, []);

  const amountCents = dollarsToCents(amount);
  const formComplete =
    brandName.trim().length > 0 && amountCents !== null && earnedDate !== "";

  async function addEntry() {
    if (amountCents === null) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          amountCents,
          status,
          kind,
          platform: platform === "" ? null : platform,
          earnedDate,
          dueDate,
          note: note.trim(),
          dealId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your entry could not be saved.");
      }
      setBrandName("");
      setAmount("");
      setStatus("pending");
      setKind("other");
      setPlatform("");
      setDueDate("");
      setNote("");
      setDealId(null);
      setPrefillNote("");
      // Reload so the totals shown are the server's fresh summary.
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your entry could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function flipStatus(entry: RevenueEntry) {
    setBusyId(entry.id);
    setError("");
    try {
      const response = await fetch("/api/revenue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: entry.id,
          status: entry.status === "pending" ? "paid" : "pending",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your entry could not be updated.");
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your entry could not be updated."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteEntry(id: string) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(
        `/api/revenue?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your entry could not be deleted.");
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your entry could not be deleted."
      );
    } finally {
      setBusyId(null);
    }
  }

  const estimateAmountCents = dollarsToCents(estimateAmount);
  const estimateFormComplete =
    estimatePlatform.trim().length > 0 &&
    estimateAmountCents !== null &&
    estimateMonth !== "";

  async function addEstimate() {
    if (estimateAmountCents === null) return;
    setEstimateSaving(true);
    setError("");
    try {
      const response = await fetch("/api/revenue/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: estimatePlatform.trim(),
          amountCents: estimateAmountCents,
          periodMonth: `${estimateMonth}-01`,
          note: estimateNote.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your estimate could not be saved.");
      }
      setEstimatePlatform("");
      setEstimateAmount("");
      setEstimateNote("");
      await loadEstimates();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your estimate could not be saved."
      );
    } finally {
      setEstimateSaving(false);
    }
  }

  async function deleteEstimate(id: string) {
    setEstimateBusyId(id);
    setError("");
    try {
      const response = await fetch(
        `/api/revenue/estimates?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your estimate could not be deleted.");
      }
      await loadEstimates();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your estimate could not be deleted."
      );
    } finally {
      setEstimateBusyId(null);
    }
  }

  const maxMonthTotal = Math.max(0, ...summary.monthly.map((m) => m.totalCents));

  const summaryCards: Array<[string, string, string]> = [
    [formatMoney(summary.totalEarnedCents), "Total earned", "text-cyan-400"],
    [formatMoney(summary.pendingCents), "Pending — owed to you", "text-amber-300"],
    [formatMoney(summary.receivedCents), "Received", "text-emerald-300"],
  ];

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / CREATOR REVENUE TRACKER
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          ULTRA VESTRA — CREATOR REVENUE TRACKER
        </div>

        <div className="mb-12">
          <div className="text-cyan-400 text-sm mb-3">
            KNOW WHAT YOU EARNED. KNOW WHAT YOU ARE OWED.
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            YOUR MONEY,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
              COUNTED HONESTLY.
            </span>
          </h1>

          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Record what each brand partnership actually paid you — and what
            is still on its way. Your earnings, your pending payments, and
            your money by brand, in one place.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          <div className="text-cyan-400 text-xs tracking-widest mb-4">
            YOUR NUMBERS, ENTERED BY YOU
          </div>
          <p className="text-sm text-gray-300 leading-6">
            Every figure on this page is added up from records you entered
            here.{" "}
            <strong className="text-gray-100">
              UltraVestra does not receive your affiliate payouts
            </strong>{" "}
            and cannot see what a network actually sent you — so nothing
            here is estimated, projected, or pulled in from anywhere else.
            If a number is wrong, it is a record you can fix, not a guess
            you have to trust.
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
            <h3 className="text-xl font-bold">Loading your revenue</h3>
            <p className="text-gray-400 mt-2">Gathering your records...</p>
          </div>
        ) : (
          <div className="space-y-10">
            <div>
              <div className="text-cyan-400 text-xs tracking-widest mb-4">
                YOUR EARNINGS AT A GLANCE
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              label="BY BRAND"
              title="Earnings by brand"
              blurb="Where your money comes from, brand by brand — each brand's total, and how much of it is still pending."
            >
              {summary.byBrand.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No entries yet — add your first commission below and it
                  will appear here.
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.byBrand.map((brand) => (
                    <div
                      key={brand.brandName}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.02] px-5 py-4"
                    >
                      <div>
                        <div className="font-bold">{brand.brandName}</div>
                        <div className="text-gray-500 text-xs mt-1">
                          {brand.count}{" "}
                          {brand.count === 1 ? "entry" : "entries"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-cyan-300">
                          {formatMoney(brand.totalCents)}
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                          {formatMoney(brand.paidCents)} received ·{" "}
                          {formatMoney(brand.pendingCents)} pending
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionShell>

            <SectionShell
              label="BY KIND"
              title="Earnings by kind"
              blurb="Every recorded earning, classified the way you entered it — campaign fees, affiliate commissions, brand payments, platform payouts. Recorded money only; estimates live in their own section below and are never counted here."
            >
              {summary.byKind.filter((k) => k.count > 0).length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No entries yet — add your first earning below and its
                  kind will appear here.
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.byKind
                    .filter((k) => k.count > 0)
                    .map((k) => (
                      <div
                        key={k.kind}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.02] px-5 py-4"
                      >
                        <div>
                          <div className="font-bold">{KIND_LABELS[k.kind]}</div>
                          <div className="text-gray-500 text-xs mt-1">
                            {k.count} {k.count === 1 ? "entry" : "entries"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-cyan-300">
                            {formatMoney(k.totalCents)}
                          </div>
                          <div className="text-gray-400 text-xs mt-1">
                            {formatMoney(k.paidCents)} received ·{" "}
                            {formatMoney(k.pendingCents)} pending
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </SectionShell>

            <SectionShell
              label="MONTHLY TREND"
              title="Your last six months"
              blurb="What you earned each month, by the date you earned it. Quiet months are shown as zero — the trend never hides them."
            >
              <div className="space-y-4">
                {summary.monthly.map((month) => (
                  <div key={month.month}>
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                      <span className="text-sm text-gray-300">
                        {formatMonth(month.month)}
                      </span>
                      <span className="text-sm font-bold">
                        {formatMoney(month.totalCents)}
                        <span className="text-gray-500 font-normal">
                          {" "}
                          — {formatMoney(month.paidCents)} received ·{" "}
                          {formatMoney(month.pendingCents)} pending
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/[.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        style={{
                          width:
                            maxMonthTotal > 0
                              ? `${(month.totalCents / maxMonthTotal) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionShell>

            <SectionShell
              label="ADD AN ENTRY"
              title="Record an earning"
              blurb="A commission, a flat fee, a payout — enter what the brand owes or paid you, exactly as you know it."
            >
              {prefillNote && (
                <p className="text-cyan-300 text-sm border border-cyan-400/30 rounded-xl px-4 py-3 mb-5">
                  {prefillNote}
                </p>
              )}
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
                  Amount (dollars)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Example: 250.00"
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Status
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as "pending" | "paid")
                    }
                    className={inputClass}
                  >
                    <option value="pending">Pending — owed to me</option>
                    <option value="paid">Paid — received</option>
                  </select>
                </label>
                <label className="text-sm text-gray-300">
                  Kind of earning
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as RevenueKind)}
                    className={inputClass}
                  >
                    {KIND_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-300">
                  Platform it came through
                  <select
                    value={platform}
                    onChange={(e) =>
                      setPlatform(e.target.value as RevenuePlatform | "")
                    }
                    className={inputClass}
                  >
                    <option value="">Not set</option>
                    {PLATFORM_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-300">
                  Date earned
                  <input
                    type="date"
                    value={earnedDate}
                    onChange={(e) => setEarnedDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Expected payment date (optional)
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Note (optional)
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Example: October TikTok Shop commissions"
                    maxLength={500}
                    className={inputClass}
                  />
                </label>
              </div>
              {amount !== "" && amountCents === null && (
                <p role="alert" className="text-red-400 text-sm mt-4">
                  Enter an amount like 250 or 250.50 — more than $0 and up
                  to $1,000,000.
                </p>
              )}
              <button
                onClick={addEntry}
                disabled={saving || !formComplete}
                className="mt-6 w-full rounded-xl p-5 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
              >
                {saving ? "Saving..." : "Add entry"}
              </button>
            </SectionShell>

            <SectionShell
              label="YOUR RECORDS"
              title="Entries"
              blurb="Every earning you have recorded, newest first. When a pending payment lands, mark it paid — your totals update from the records."
            >
              {entries.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No entries yet — add your first commission above.
                </p>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-white/10 bg-white/[.02] px-5 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-bold">{entry.brand_name}</div>
                          <div className="text-gray-400 text-sm mt-1">
                            {entry.platform
                              ? `${PLATFORM_LABELS[entry.platform] ?? entry.platform} · `
                              : ""}
                            {KIND_LABELS[entry.kind] ?? "Other"} · Earned{" "}
                            {formatDate(entry.earned_date)}
                            {entry.status === "pending" && entry.due_date
                              ? ` · expected ${formatDate(entry.due_date)}`
                              : ""}
                          </div>
                          {entry.note && (
                            <div className="text-gray-500 text-sm mt-1">
                              {entry.note}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xl font-bold">
                            {formatMoney(entry.amount_cents)}
                          </div>
                          <StatusPill status={entry.status} />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => flipStatus(entry)}
                          disabled={busyId === entry.id}
                          className="rounded-lg border border-cyan-400/40 text-cyan-300 px-4 py-2 text-sm hover:bg-cyan-400/10 disabled:opacity-40 transition"
                        >
                          {entry.status === "pending"
                            ? "Mark paid"
                            : "Mark pending"}
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          disabled={busyId === entry.id}
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

            <section className="rounded-3xl border border-dashed border-violet-400/40 bg-violet-500/[.04] p-6 md:p-8">
              <div className="text-violet-300 text-xs tracking-widest mb-3">
                ESTIMATED PLATFORM EARNINGS
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Estimates — not money received
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                What a platform's dashboard suggests you might earn —
                TikTok or Meta monetization estimates, for example.{" "}
                <strong className="text-gray-200">
                  Estimates are not money received and are never added
                  to your recorded earnings above.
                </strong>{" "}
                They live in their own table, are totaled separately,
                and stay labeled as estimates everywhere they appear.
              </p>

              <div className="rounded-2xl bg-white/[.04] border border-violet-400/20 p-5 mb-6 max-w-xs">
                <div className="text-3xl font-bold text-violet-300">
                  {formatMoney(estimateSummary.totalEstimatedCents)}
                </div>
                <div className="text-gray-400 text-sm mt-2">
                  Total estimated —{" "}
                  {formatMoney(estimateSummary.creatorEnteredCents)} entered
                  by you · {formatMoney(estimateSummary.platformReportedCents)}{" "}
                  platform-reported
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <label className="text-sm text-gray-300">
                  Platform
                  <input
                    type="text"
                    value={estimatePlatform}
                    onChange={(e) => setEstimatePlatform(e.target.value)}
                    placeholder="Example: TikTok"
                    maxLength={100}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Estimated amount (dollars)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={estimateAmount}
                    onChange={(e) => setEstimateAmount(e.target.value)}
                    placeholder="Example: 120.00"
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Month the estimate is about
                  <input
                    type="month"
                    value={estimateMonth}
                    onChange={(e) => setEstimateMonth(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Note (optional)
                  <input
                    type="text"
                    value={estimateNote}
                    onChange={(e) => setEstimateNote(e.target.value)}
                    placeholder="Example: TikTok dashboard estimate"
                    maxLength={500}
                    className={inputClass}
                  />
                </label>
              </div>
              <button
                onClick={addEstimate}
                disabled={estimateSaving || !estimateFormComplete}
                className="mt-6 w-full rounded-xl p-5 font-bold text-black bg-violet-400 hover:bg-violet-300 disabled:opacity-40 transition"
              >
                {estimateSaving ? "Saving..." : "Add estimate"}
              </button>

              {estimates.length > 0 && (
                <div className="space-y-3 mt-8">
                  {estimates.map((estimate) => (
                    <div
                      key={estimate.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-400/20 bg-white/[.02] px-5 py-4"
                    >
                      <div>
                        <div className="font-bold">{estimate.platform}</div>
                        <div className="text-gray-400 text-sm mt-1">
                          {formatMonth(estimate.period_month.slice(0, 7))} ·{" "}
                          {estimate.basis === "platform_reported"
                            ? "Reported by platform"
                            : "Entered by you — an estimate"}
                          {estimate.note ? ` · ${estimate.note}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xl font-bold text-violet-300">
                          {formatMoney(estimate.amount_cents)}
                        </div>
                        <button
                          onClick={() => deleteEstimate(estimate.id)}
                          disabled={estimateBusyId === estimate.id}
                          className="rounded-lg border border-red-400/40 text-red-300 px-4 py-2 text-sm hover:bg-red-400/10 disabled:opacity-40 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
