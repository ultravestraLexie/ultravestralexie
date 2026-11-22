"use client";

import { useEffect, useState } from "react";
import {
  composeProposal,
  formatMoney,
  proposalTotals,
  type ProposalProofPoint,
} from "@/lib/proposals/compose";

// Proposal Builder — a creator assembles a partnership proposal
// for one brand from structured pieces: deliverables with prices,
// their audience summary, campaign ideas, and proof points pulled
// from their own Reputation Passport. The platform composes those
// pieces into a clean, copy-ready document (lib/proposals/
// compose.ts — the same function the fixtures test).
//
// HONESTY RULE (binding): the creator owns every word. All content
// is creator-entered or creator-selected from their own Passport;
// the platform assembles, it does not write, invent, or embellish.
// The copy on this page says so plainly. Money travels as integer
// cents; totals come from proposalTotals over the entered rows.
//
// All reads and writes go through /api/proposals (session +
// subscription gated, owner-only). This page holds no direct
// database access. After every change the page reloads from the
// API, so what it shows is always the server's stored rows.

type ProposalStatus = "draft" | "sent" | "accepted" | "declined";

type Proposal = {
  id: string;
  brand_id: string | null;
  brand_name: string;
  title: string;
  deliverables: { item: string; quantity: number; priceCents: number }[];
  audience_summary: string;
  campaign_ideas: string[];
  proof_points: ProposalProofPoint[];
  notes: string;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
};

type PassportEntryView = ProposalProofPoint & {
  id: string;
  section: string;
  verification_status: "platform_verified" | "self_reported";
};

type BrandSuggestion = { id: string; name: string };

type DeliverableRow = { item: string; quantity: string; price: string };

const EMPTY_ROW: DeliverableRow = { item: "", quantity: "1", price: "" };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** 'YYYY-MM-DD' → 'November 3, 2026', by string parts. */
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

/** Dollars typed by the creator ('250', '250.5', '250.50') → integer
 *  cents, or null when the text is not a clean amount. Zero is a
 *  real price here (a bonus deliverable can be free). */
function dollarsToCents(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const cents =
    Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 100_000_000) {
    return null;
  }
  return cents;
}

function parseQuantity(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const n = Number(value.trim());
  return n >= 1 && n <= 999 ? n : null;
}

function StatusPill({ status }: { status: ProposalStatus }) {
  const styles: Record<ProposalStatus, string> = {
    draft: "border-white/25 text-gray-300",
    sent: "border-cyan-400/40 text-cyan-300",
    accepted: "border-emerald-400/40 text-emerald-300",
    declined: "border-red-400/40 text-red-300",
  };
  return (
    <span
      className={`text-[11px] tracking-widest border rounded-full px-3 py-1 ${styles[status]}`}
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

const STATUS_ACTIONS: { status: ProposalStatus; label: string }[] = [
  { status: "sent", label: "Mark sent" },
  { status: "accepted", label: "Mark accepted" },
  { status: "declined", label: "Mark declined" },
  { status: "draft", label: "Back to draft" },
];

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [passportEntries, setPassportEntries] = useState<PassportEntryView[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Create-form state.
  const [brandName, setBrandName] = useState("");
  const [brandId, setBrandId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<BrandSuggestion[]>([]);
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<DeliverableRow[]>([{ ...EMPTY_ROW }]);
  const [audienceSummary, setAudienceSummary] = useState("");
  const [campaignIdeasText, setCampaignIdeasText] = useState("");
  const [selectedProofIds, setSelectedProofIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Saved-list state.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function load() {
    try {
      const response = await fetch("/api/proposals");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your proposals could not be loaded.");
      }
      setProposals(data.proposals ?? []);
      setPassportEntries(data.passportEntries ?? []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your proposals could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // --- Brand picker: the directory type-ahead (/api/suggest) ------

  async function fetchSuggestions(query: string) {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `/api/suggest?q=${encodeURIComponent(query.trim())}`
      );
      const data = await response.json();
      setSuggestions((data.brands ?? []) as BrandSuggestion[]);
    } catch {
      setSuggestions([]);
    }
  }

  function onBrandNameChange(value: string) {
    setBrandName(value);
    // Editing the text away from the picked brand unlinks it: the
    // proposal then names a free-text brand, with brandId null.
    if (brandId !== null) {
      setBrandId(null);
    }
    fetchSuggestions(value);
  }

  function pickBrand(brand: BrandSuggestion) {
    setBrandName(brand.name);
    setBrandId(brand.id);
    setSuggestions([]);
  }

  // --- Deliverables editor ------------------------------------------

  function updateRow(index: number, patch: Partial<DeliverableRow>) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function rowIsBlank(row: DeliverableRow): boolean {
    return row.item.trim() === "" && row.price.trim() === "";
  }

  function rowToDeliverable(row: DeliverableRow) {
    const quantity = parseQuantity(row.quantity);
    const priceCents = dollarsToCents(row.price);
    if (row.item.trim() === "" || quantity === null || priceCents === null) {
      return null;
    }
    return { item: row.item.trim(), quantity, priceCents };
  }

  const activeRows = rows.filter((row) => !rowIsBlank(row));
  const parsedDeliverables = activeRows.map(rowToDeliverable);
  const rowsValid = parsedDeliverables.every((d) => d !== null);
  const validDeliverables = parsedDeliverables.filter(
    (d): d is NonNullable<typeof d> => d !== null
  );
  const runningTotal = proposalTotals(validDeliverables).totalCents;

  const campaignIdeas = campaignIdeasText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const tooManyIdeas = campaignIdeas.length > 10;

  const formComplete =
    brandName.trim().length > 0 &&
    title.trim().length > 0 &&
    rowsValid &&
    !tooManyIdeas;

  async function createProposal() {
    if (!formComplete) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          brandId,
          title: title.trim(),
          deliverables: validDeliverables,
          audienceSummary: audienceSummary.trim(),
          campaignIdeas,
          proofPointIds: selectedProofIds,
          notes: notes.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your proposal could not be saved.");
      }
      setBrandName("");
      setBrandId(null);
      setSuggestions([]);
      setTitle("");
      setRows([{ ...EMPTY_ROW }]);
      setAudienceSummary("");
      setCampaignIdeasText("");
      setSelectedProofIds([]);
      setNotes("");
      // Reload so the list shows the server's stored rows.
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your proposal could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(proposal: Proposal, status: ProposalStatus) {
    setBusyId(proposal.id);
    setError("");
    try {
      const response = await fetch("/api/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: proposal.id, status }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your proposal could not be updated.");
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your proposal could not be updated."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteProposal(id: string) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(
        `/api/proposals?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your proposal could not be deleted.");
      }
      setConfirmDeleteId(null);
      if (expandedId === id) setExpandedId(null);
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your proposal could not be deleted."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function copyDocument(proposal: Proposal) {
    const doc = composeProposal({
      brandName: proposal.brand_name,
      title: proposal.title,
      deliverables: proposal.deliverables,
      audienceSummary: proposal.audience_summary,
      campaignIdeas: proposal.campaign_ideas,
      proofPoints: proposal.proof_points,
      notes: proposal.notes,
    });
    try {
      await navigator.clipboard.writeText(doc);
      setCopiedId(proposal.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Copy failed — open the proposal and copy the text manually.");
    }
  }

  function toggleProof(id: string) {
    setSelectedProofIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / PROPOSAL BUILDER
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          ULTRA VESTRA — PROPOSAL BUILDER
        </div>

        <div className="mb-12">
          <div className="text-cyan-400 text-sm mb-3">
            YOUR DELIVERABLES. YOUR PRICES. YOUR PROOF.
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            YOUR PITCH,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
              READY TO SEND.
            </span>
          </h1>

          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Assemble a partnership proposal for one brand — deliverables,
            prices, your audience, your campaign ideas, and proof points
            from your Reputation Passport — composed into one clean
            document you can copy and send.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          <div className="text-cyan-400 text-xs tracking-widest mb-4">
            YOUR WORDS, ASSEMBLED BY THE PLATFORM
          </div>
          <p className="text-sm text-gray-300 leading-6">
            UltraVestra puts the proposal together from the deliverables,
            prices, and words{" "}
            <strong className="text-gray-100">you</strong> enter, plus the
            proof points you select from your own Reputation Passport.{" "}
            <strong className="text-gray-100">
              It does not write your pitch, embellish your numbers, or
              estimate the results a brand will get.
            </strong>{" "}
            If a line is in the document, it came from you.
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
            <h3 className="text-xl font-bold">Loading your proposals</h3>
            <p className="text-gray-400 mt-2">Gathering your documents...</p>
          </div>
        ) : (
          <div className="space-y-10">
            <SectionShell
              label="BUILD A PROPOSAL"
              title="Assemble a proposal"
              blurb="Name the brand, price the work, add your proof. The document composes itself from these pieces — nothing added, nothing embellished."
            >
              <div className="grid md:grid-cols-2 gap-5">
                <label className="text-sm text-gray-300 relative">
                  Brand
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => onBrandNameChange(e.target.value)}
                    placeholder="Start typing — pick a directory brand or name any brand"
                    maxLength={120}
                    className={inputClass}
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-xl border border-white/10 bg-[#111827] overflow-hidden">
                      {suggestions.map((brand) => (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() => pickBrand(brand)}
                          className="block w-full text-left px-4 py-3 text-sm hover:bg-white/[.05] transition"
                        >
                          {brand.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="block text-gray-500 text-xs mt-2">
                    {brandId !== null
                      ? "Linked to this directory brand."
                      : "Free-text brand — or pick one from the directory list as you type."}
                  </span>
                </label>
                <label className="text-sm text-gray-300">
                  Proposal title
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Example: Holiday Gift Guide Partnership"
                    maxLength={160}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="mt-8">
                <div className="text-sm text-gray-300 mb-2">Deliverables</div>
                <div className="space-y-3">
                  {rows.map((row, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_90px_130px_40px] gap-3 items-start"
                    >
                      <input
                        type="text"
                        value={row.item}
                        onChange={(e) =>
                          updateRow(index, { item: e.target.value })
                        }
                        placeholder="Example: TikTok video"
                        maxLength={120}
                        className="w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(index, { quantity: e.target.value })
                        }
                        placeholder="Qty"
                        className="w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.price}
                        onChange={(e) =>
                          updateRow(index, { price: e.target.value })
                        }
                        placeholder="Price $"
                        className="w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRows((prev) =>
                            prev.length > 1
                              ? prev.filter((_, i) => i !== index)
                              : [{ ...EMPTY_ROW }]
                          )
                        }
                        className="rounded-lg border border-white/15 text-gray-300 px-3 py-4 text-sm hover:bg-white/[.05] transition"
                        aria-label="Remove deliverable"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {!rowsValid && (
                  <p role="alert" className="text-red-400 text-sm mt-3">
                    Each deliverable needs a name, a quantity of 1–999, and
                    a price like 250 or 250.50 (0 is fine for a bonus).
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() =>
                      rows.length < 20 &&
                      setRows((prev) => [...prev, { ...EMPTY_ROW }])
                    }
                    disabled={rows.length >= 20}
                    className="rounded-lg border border-cyan-400/40 text-cyan-300 px-4 py-2 text-sm hover:bg-cyan-400/10 disabled:opacity-40 transition"
                  >
                    Add deliverable
                  </button>
                  <div className="text-sm text-gray-400">
                    Proposal total:{" "}
                    <span className="text-xl font-bold text-cyan-300">
                      {formatMoney(runningTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5 mt-8">
                <label className="text-sm text-gray-300">
                  About my audience
                  <textarea
                    value={audienceSummary}
                    onChange={(e) => setAudienceSummary(e.target.value)}
                    placeholder="Who follows you, where, and what they buy — in your own words."
                    maxLength={2000}
                    rows={4}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Campaign ideas (one per line, up to 10)
                  <textarea
                    value={campaignIdeasText}
                    onChange={(e) => setCampaignIdeasText(e.target.value)}
                    placeholder={"Gift guide carousel\nPack-with-me travel series"}
                    rows={4}
                    className={inputClass}
                  />
                  {tooManyIdeas && (
                    <span className="block text-red-400 text-xs mt-2">
                      That is more than 10 ideas — trim the list to save.
                    </span>
                  )}
                </label>
              </div>

              <div className="mt-8">
                <div className="text-sm text-gray-300 mb-2">
                  Proof points from your Reputation Passport
                </div>
                {passportEntries.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Add results to your Reputation Passport and they'll
                    appear here as proof points.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {passportEntries.map((entry) => {
                      const detail = [entry.metric, entry.platform, entry.timeframe]
                        .filter((part) => part.trim() !== "")
                        .join(" · ");
                      return (
                        <label
                          key={entry.id}
                          className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.02] px-4 py-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedProofIds.includes(entry.id)}
                            onChange={() => toggleProof(entry.id)}
                            disabled={
                              !selectedProofIds.includes(entry.id) &&
                              selectedProofIds.length >= 10
                            }
                            className="mt-1 accent-fuchsia-500"
                          />
                          <span>
                            <span className="block font-bold text-sm">
                              {entry.title}
                            </span>
                            {detail && (
                              <span className="block text-gray-400 text-sm mt-0.5">
                                {detail}
                              </span>
                            )}
                            <span className="block text-gray-500 text-xs mt-0.5">
                              {entry.section} ·{" "}
                              {entry.verification_status ===
                              "platform_verified"
                                ? "Platform verified"
                                : "Self-reported"}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <label className="block text-sm text-gray-300 mt-8">
                Notes (optional)
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else the brand should know — terms, timing, exclusivity."
                  maxLength={2000}
                  rows={3}
                  className={inputClass}
                />
              </label>

              <button
                onClick={createProposal}
                disabled={saving || !formComplete}
                className="mt-6 w-full rounded-xl p-5 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
              >
                {saving ? "Saving..." : "Save proposal as draft"}
              </button>
            </SectionShell>

            <SectionShell
              label="YOUR PROPOSALS"
              title="Saved proposals"
              blurb="Every proposal you have assembled, newest first. Open one to read the composed document exactly as a brand would receive it, copy it, and track its status."
            >
              {proposals.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No proposals yet — assemble your first one above.
                </p>
              ) : (
                <div className="space-y-3">
                  {proposals.map((proposal) => {
                    const total = proposalTotals(
                      proposal.deliverables
                    ).totalCents;
                    const expanded = expandedId === proposal.id;
                    return (
                      <div
                        key={proposal.id}
                        className="rounded-2xl border border-white/10 bg-white/[.02] px-5 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-bold">{proposal.title}</div>
                            <div className="text-gray-400 text-sm mt-1">
                              For {proposal.brand_name} ·{" "}
                              {formatDate(proposal.created_at.slice(0, 10))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xl font-bold">
                              {formatMoney(total)}
                            </div>
                            <StatusPill status={proposal.status} />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <button
                            onClick={() =>
                              setExpandedId(expanded ? null : proposal.id)
                            }
                            className="rounded-lg border border-cyan-400/40 text-cyan-300 px-4 py-2 text-sm hover:bg-cyan-400/10 transition"
                          >
                            {expanded ? "Hide proposal" : "View proposal"}
                          </button>
                          {STATUS_ACTIONS.filter(
                            (a) => a.status !== proposal.status
                          ).map((action) => (
                            <button
                              key={action.status}
                              onClick={() => setStatus(proposal, action.status)}
                              disabled={busyId === proposal.id}
                              className="rounded-lg border border-white/15 text-gray-300 px-4 py-2 text-sm hover:bg-white/[.05] disabled:opacity-40 transition"
                            >
                              {action.label}
                            </button>
                          ))}
                          {confirmDeleteId === proposal.id ? (
                            <>
                              <button
                                onClick={() => deleteProposal(proposal.id)}
                                disabled={busyId === proposal.id}
                                className="rounded-lg border border-red-400/60 text-red-200 bg-red-400/10 px-4 py-2 text-sm disabled:opacity-40 transition"
                              >
                                {busyId === proposal.id
                                  ? "Deleting..."
                                  : "Confirm delete"}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-lg border border-white/15 text-gray-300 px-4 py-2 text-sm hover:bg-white/[.05] transition"
                              >
                                Keep
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(proposal.id)}
                              disabled={busyId === proposal.id}
                              className="rounded-lg border border-red-400/40 text-red-300 px-4 py-2 text-sm hover:bg-red-400/10 disabled:opacity-40 transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        {expanded && (
                          <div className="mt-4">
                            <pre className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-[#080b14] p-5 text-sm leading-6 text-gray-200 font-sans">
                              {composeProposal({
                                brandName: proposal.brand_name,
                                title: proposal.title,
                                deliverables: proposal.deliverables,
                                audienceSummary: proposal.audience_summary,
                                campaignIdeas: proposal.campaign_ideas,
                                proofPoints: proposal.proof_points,
                                notes: proposal.notes,
                              })}
                            </pre>
                            <button
                              onClick={() => copyDocument(proposal)}
                              className="mt-3 rounded-lg border border-fuchsia-400/40 text-fuchsia-300 px-4 py-2 text-sm hover:bg-fuchsia-400/10 transition"
                            >
                              {copiedId === proposal.id
                                ? "Copied ✓"
                                : "Copy proposal"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionShell>
          </div>
        )}
      </div>
    </main>
  );
}
