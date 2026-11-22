"use client";

import { useEffect, useState } from "react";

// Brand Deal & Partnership Manager — the creator's own deal
// pipeline, inside the Creator Growth Center.
//
// HONESTY RULES (binding):
// - Every stage on this page is the creator's own tracking. A
//   deal moved to "Paid" means the creator marked it paid —
//   UltraVestra did not receive or verify the money. Payments
//   are proven only in the Revenue Tracker, from recorded
//   entries. The page says this plainly, at the top.
// - Compensation figures are amounts the creator recorded for
//   each deal; stage totals are exact sums over those rows and
//   are labeled as tracked by the creator.
// - This page INTEGRATES the existing tools instead of replacing
//   them: find matches in Campaign Match, build the pitch in
//   Proposals (a deal can link to one of your own proposals),
//   record the money in Revenue.
//
// All data comes from /api/deals, which scopes every row to the
// signed-in creator. Overdue is computed by the API from the
// deadline the creator entered — never stored, never guessed.

type DealStage =
  | "lead" | "applied" | "negotiating" | "active"
  | "delivered" | "invoiced" | "paid" | "closed";

type Deal = {
  id: string;
  brand_name: string;
  platform: string | null;
  stage: DealStage;
  compensation_cents: number | null;
  deliverables: string;
  deadline: string | null;
  proposal_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  overdue: boolean;
};

type StageTotal = { stage: DealStage; count: number; compensationCents: number };
type Pipeline = { byStage: StageTotal[] };

type ProposalOption = { id: string; brand_name: string; title: string; status: string };

const STAGES: { value: DealStage; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "applied", label: "Applied" },
  { value: "negotiating", label: "Negotiating" },
  { value: "active", label: "Active" },
  { value: "delivered", label: "Delivered" },
  { value: "invoiced", label: "Invoiced" },
  { value: "paid", label: "Paid" },
  { value: "closed", label: "Closed" },
];

const STAGE_LABEL = new Map(STAGES.map((s) => [s.value, s.label]));

const PLATFORM_OPTIONS: { value: string; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook / Meta" },
  { value: "trybe", label: "Trybe" },
  { value: "other", label: "Other" },
];

const PLATFORM_LABEL = new Map(PLATFORM_OPTIONS.map((p) => [p.value, p.label]));

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const inputClass =
  "mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white";

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

export default function BrandDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [proposals, setProposals] = useState<ProposalOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Add-deal form
  const [brand, setBrand] = useState("");
  const [platform, setPlatform] = useState("");
  const [stage, setStage] = useState<DealStage>("lead");
  const [compensation, setCompensation] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [deadline, setDeadline] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [dealsRes, proposalsRes] = await Promise.all([
        fetch("/api/deals"),
        fetch("/api/proposals"),
      ]);
      const dealsData = await dealsRes.json();
      if (!dealsRes.ok) {
        throw new Error(dealsData.error || "Your deals could not be loaded.");
      }
      setDeals(dealsData.deals ?? []);
      setPipeline(dealsData.pipeline ?? null);
      if (proposalsRes.ok) {
        const proposalsData = await proposalsRes.json();
        setProposals(
          (proposalsData.proposals ?? []).map((p: ProposalOption) => ({
            id: p.id,
            brand_name: p.brand_name,
            title: p.title,
            status: p.status,
          }))
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your deals could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addDeal() {
    if (!brand.trim()) {
      setError("Give the deal a brand name.");
      return;
    }
    const cents =
      compensation.trim() === "" ? null : Math.round(Number(compensation) * 100);
    if (cents !== null && (!Number.isFinite(cents) || cents < 0)) {
      setError("Compensation must be zero or above.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brand.trim(),
          platform: platform === "" ? null : platform,
          stage,
          compensationCents: cents,
          deliverables: deliverables.trim(),
          deadline: deadline === "" ? null : deadline,
          proposalId: proposalId === "" ? null : proposalId,
          notes: notes.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your deal could not be saved.");
      }
      setBrand("");
      setPlatform("");
      setStage("lead");
      setCompensation("");
      setDeliverables("");
      setDeadline("");
      setProposalId("");
      setNotes("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your deal could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function patchDeal(id: string, patch: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch("/api/deals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your deal could not be updated.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your deal could not be updated.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteDeal(id: string) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/deals?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your deal could not be deleted.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your deal could not be deleted.");
    } finally {
      setBusyId(null);
    }
  }

  const proposalName = new Map(
    proposals.map((p) => [p.id, `${p.brand_name} — ${p.title}`])
  );

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / CREATOR GROWTH CENTER / BRAND DEALS
        </div>

        <div className="mb-10">
          <div className="text-cyan-400 text-sm mb-3">WHAT AM I WORKING ON?</div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">
            BRAND
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500">
              DEALS.
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Your partnership pipeline — every brand you are chasing,
            negotiating, delivering, and invoicing, in one place.
          </p>
        </div>

        <div className="rounded-3xl border border-amber-400/30 bg-amber-500/[.05] p-6 mb-10">
          <div className="text-amber-300 text-xs tracking-widest mb-2">
            READ THIS FIRST — STAGES ARE YOUR TRACKING
          </div>
          <p className="text-gray-300">
            The stages here are your own workflow labels, tracked by
            you. A deal you move to “Paid” is a deal you marked paid —
            UltraVestra did not receive or verify the money. Payments
            are proven in your{" "}
            <a href="/revenue" className="text-cyan-300 underline">
              Revenue Tracker
            </a>
            , from the earnings you record there.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/[.07] p-4 mb-8 text-red-200">
            {error}
          </div>
        )}

        {/* Pipeline board */}
        <h2 className="text-2xl font-bold mb-4">Your pipeline</h2>
        {loading ? (
          <p className="text-gray-400 mb-10">Loading your deals…</p>
        ) : deals.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
            <p className="text-gray-300">
              No deals tracked yet. Add your first one below — or find
              a match worth chasing in{" "}
              <a href="/campaign-match" className="text-cyan-300 underline">
                Campaign Match
              </a>{" "}
              and build the pitch in{" "}
              <a href="/proposals" className="text-cyan-300 underline">
                Proposals
              </a>
              .
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 mb-10">
            {STAGES.map(({ value, label }) => {
              const stageDeals = deals.filter((d) => d.stage === value);
              const total = pipeline?.byStage.find((s) => s.stage === value);
              return (
                <section key={value}>
                  <div className="flex items-baseline gap-3 mb-3">
                    <h3 className="text-lg font-bold">{label}</h3>
                    <span className="text-gray-400 text-sm">
                      {stageDeals.length} {stageDeals.length === 1 ? "deal" : "deals"}
                      {total && total.compensationCents > 0
                        ? ` · ${money(total.compensationCents)} tracked`
                        : ""}
                    </span>
                  </div>
                  {stageDeals.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nothing here right now.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="rounded-2xl border border-white/10 bg-white/[.03] p-5"
                        >
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="font-bold text-lg">{deal.brand_name}</span>
                            {deal.platform && (
                              <span className="text-gray-400 text-sm">
                                {PLATFORM_LABEL.get(deal.platform) ?? deal.platform}
                              </span>
                            )}
                            {deal.compensation_cents !== null && (
                              <span className="text-cyan-300 font-semibold">
                                {money(deal.compensation_cents)}
                              </span>
                            )}
                            {deal.deadline && (
                              <span
                                className={
                                  deal.overdue
                                    ? "text-red-300 font-semibold text-sm"
                                    : "text-gray-400 text-sm"
                                }
                              >
                                Due {formatDate(deal.deadline)}
                                {deal.overdue ? " — overdue" : ""}
                              </span>
                            )}
                          </div>
                          {deal.deliverables && (
                            <p className="text-gray-300 mt-2">{deal.deliverables}</p>
                          )}
                          {deal.notes && (
                            <p className="text-gray-400 mt-1 text-sm">{deal.notes}</p>
                          )}
                          {deal.proposal_id && (
                            <p className="text-gray-400 mt-1 text-sm">
                              Linked proposal:{" "}
                              {proposalName.get(deal.proposal_id) ?? "one of your proposals"} —{" "}
                              <a href="/proposals" className="text-cyan-300 underline">
                                open Proposals
                              </a>
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-4">
                            <label className="text-gray-400 text-sm">
                              Stage
                              <select
                                className="ml-2 bg-[#080b14] border border-white/10 rounded-lg px-3 py-2 text-white"
                                value={deal.stage}
                                disabled={busyId === deal.id}
                                onChange={(e) =>
                                  patchDeal(deal.id, { stage: e.target.value })
                                }
                              >
                                {STAGES.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="text-gray-400 text-sm">
                              Compensation $
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="ml-2 w-32 bg-[#080b14] border border-white/10 rounded-lg px-3 py-2 text-white"
                                defaultValue={
                                  deal.compensation_cents === null
                                    ? ""
                                    : (deal.compensation_cents / 100).toString()
                                }
                                disabled={busyId === deal.id}
                                onBlur={(e) => {
                                  const raw = e.target.value.trim();
                                  const cents =
                                    raw === "" ? null : Math.round(Number(raw) * 100);
                                  if (cents !== deal.compensation_cents) {
                                    if (cents !== null && (!Number.isFinite(cents) || cents < 0)) {
                                      setError("Compensation must be zero or above.");
                                      return;
                                    }
                                    patchDeal(deal.id, { compensationCents: cents });
                                  }
                                }}
                              />
                            </label>
                            <label className="text-gray-400 text-sm">
                              Deadline
                              <input
                                type="date"
                                className="ml-2 bg-[#080b14] border border-white/10 rounded-lg px-3 py-2 text-white"
                                defaultValue={deal.deadline ?? ""}
                                disabled={busyId === deal.id}
                                onBlur={(e) => {
                                  const v = e.target.value === "" ? null : e.target.value;
                                  if (v !== deal.deadline) {
                                    patchDeal(deal.id, { deadline: v });
                                  }
                                }}
                              />
                            </label>
                            <button
                              className="text-red-300 text-sm underline disabled:opacity-50"
                              disabled={busyId === deal.id}
                              onClick={() => deleteDeal(deal.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* Add a deal */}
        <h2 className="text-2xl font-bold mb-4">Add a deal</h2>
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-gray-300 text-sm">Brand name *</span>
              <input
                className={inputClass}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="GlowCo"
              />
            </label>
            <label className="block">
              <span className="text-gray-300 text-sm">Platform</span>
              <select
                className={inputClass}
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="">Not set</option>
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-gray-300 text-sm">Stage</span>
              <select
                className={inputClass}
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-gray-300 text-sm">Compensation ($)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                placeholder="750.00"
              />
            </label>
            <label className="block">
              <span className="text-gray-300 text-sm">Deadline</span>
              <input
                type="date"
                className={inputClass}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-gray-300 text-sm">Linked proposal (optional)</span>
              <select
                className={inputClass}
                value={proposalId}
                onChange={(e) => setProposalId(e.target.value)}
              >
                <option value="">None</option>
                {proposals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand_name} — {p.title} ({p.status})
                  </option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-gray-300 text-sm">Deliverables</span>
              <input
                className={inputClass}
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                placeholder="2 TikTok videos, 1 Story set"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-gray-300 text-sm">Notes</span>
              <input
                className={inputClass}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you want to remember about this deal"
              />
            </label>
          </div>
          <button
            className="mt-6 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-6 py-3 font-bold disabled:opacity-50"
            disabled={saving}
            onClick={addDeal}
          >
            {saving ? "Saving…" : "Add deal"}
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6">
          <h2 className="text-xl font-bold mb-2">Keep the pipeline fed</h2>
          <p className="text-gray-300">
            Find brands that fit your audience in{" "}
            <a href="/campaign-match" className="text-cyan-300 underline">
              Campaign Match
            </a>
            , build the pitch in{" "}
            <a href="/proposals" className="text-cyan-300 underline">
              Proposals
            </a>
            , and when money lands, record it in{" "}
            <a href="/revenue" className="text-cyan-300 underline">
              Revenue
            </a>{" "}
            — that record is what your{" "}
            <a href="/growth-center/business" className="text-cyan-300 underline">
              Business Health
            </a>{" "}
            reads.
          </p>
        </div>
      </div>
    </main>
  );
}
