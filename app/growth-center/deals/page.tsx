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
  invoice_sent_date: string | null;
  payment_terms: string | null;
  payment_due_date: string | null;
  payment_received_date: string | null;
  amount_received_cents: number | null;
  created_at: string;
  updated_at: string;
  overdue: boolean;
  payment: {
    invoiced: boolean;
    receivedCents: number;
    remainingCents: number | null;
    fullyPaid: boolean;
    outstanding: boolean;
    overdue: boolean;
    dueDate: string | null;
    dueDateCalculated: boolean;
    daysOutstanding: number | null;
  };
  deliverable_items: DeliverableItem[];
  /** Build 16b — the attribution audit trail for this deal. */
  attribution_history: AttributionEvent[];
};

type AttributionEvent = {
  id: string;
  deliverable_title: string;
  action: "linked" | "unlinked";
  from_post_title: string | null;
  to_post_title: string | null;
  created_at: string;
};

/* Build 14 — one promised piece of content under a deal: its
 * own deadline, its status in the creator's tracking, and how
 * many revision rounds it has been through. */
type DeliverableItem = {
  id: string;
  deal_id: string;
  title: string;
  due_date: string | null;
  status: "pending" | "delivered" | "approved";
  revisions: number;
  /** Build 16 — the post that fulfilled this deliverable, when
   *  the creator linked one. The attribution chain's last edge. */
  post_id: string | null;
  overdue: boolean;
};

/** Build 16 — the creator's posts, for the fulfill picker. */
type PostOption = {
  id: string;
  title: string | null;
  platform: string;
  posted_date: string;
};

const DELIVERABLE_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "To do" },
  { value: "delivered", label: "Delivered" },
  { value: "approved", label: "Approved" },
];

type BrandHistory = {
  brandName: string;
  totalDeals: number;
  latePayments: number;
  avgDelayDays: number | null;
  outstandingCents: number;
  reliabilityPct: number | null;
  measurablePayments: number;
};

const TERMS_OPTIONS: { value: string; label: string }[] = [
  { value: "due_on_receipt", label: "Due on receipt" },
  { value: "net_7", label: "Net 7" },
  { value: "net_14", label: "Net 14" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
  { value: "other", label: "Other terms" },
];

const TERMS_LABEL = new Map(TERMS_OPTIONS.map((t) => [t.value, t.label]));

/* Build 12 — one follow-up queue inside deal management: payments
 * to chase, proposals waiting on a brand, deals gone quiet. */
type FollowUp = {
  type: "payment" | "proposal" | "quiet";
  brandName: string;
  dealId: string | null;
  proposalId: string | null;
  cents: number | null;
  days: number;
  overdue: boolean;
  stage: string | null;
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

/* Build 14 — the deliverables tracker on a deal card: each
 * promised piece of content with its own deadline, status, and
 * revision count. Status is the creator's own tracking, like
 * the deal stages above it. */
function DeliverablesBlock({
  deal,
  postOptions,
  onAdd,
  onPatch,
  onDelete,
}: {
  deal: Deal;
  postOptions: PostOption[];
  onAdd: (dealId: string, title: string, dueDate: string) => Promise<void>;
  onPatch: (id: string, patch: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const items = deal.deliverable_items ?? [];
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/[.02] px-4 py-3">
      <p className="text-xs tracking-widest text-gray-400 mb-2">
        DELIVERABLES — CONTENT DEADLINES &amp; REVISIONS (TRACKED BY YOU)
      </p>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">
          No deliverables tracked yet. Add each piece of content you
          owe this brand, with the date it is due.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
            >
              <span className="text-gray-200 font-medium">{item.title}</span>
              {item.due_date && (
                <span
                  className={
                    item.overdue
                      ? "text-red-300 font-semibold"
                      : "text-gray-400"
                  }
                >
                  Due {formatDate(item.due_date)}
                  {item.overdue ? " — overdue" : ""}
                </span>
              )}
              <select
                className="bg-[#080b14] border border-white/10 rounded-lg px-2 py-1 text-white"
                value={item.status}
                onChange={(e) =>
                  onPatch(item.id, { status: e.target.value })
                }
              >
                {DELIVERABLE_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <label className="text-gray-400">
                Revisions
                <input
                  type="number"
                  min="0"
                  className="ml-2 w-16 bg-[#080b14] border border-white/10 rounded-lg px-2 py-1 text-white"
                  defaultValue={item.revisions.toString()}
                  onBlur={(e) => {
                    const v = Math.round(Number(e.target.value));
                    if (Number.isFinite(v) && v >= 0 && v !== item.revisions) {
                      onPatch(item.id, { revisions: v });
                    }
                  }}
                />
              </label>
              <input
                type="date"
                className="bg-[#080b14] border border-white/10 rounded-lg px-2 py-1 text-white"
                defaultValue={item.due_date ?? ""}
                onBlur={(e) => {
                  const v = e.target.value === "" ? null : e.target.value;
                  if (v !== item.due_date) {
                    onPatch(item.id, { dueDate: v });
                  }
                }}
              />
              <label className="text-gray-400">
                Fulfilled by post
                <select
                  className="ml-2 max-w-[220px] bg-[#080b14] border border-white/10 rounded-lg px-2 py-1 text-white"
                  value={item.post_id ?? ""}
                  onChange={(e) =>
                    onPatch(item.id, {
                      postId: e.target.value === "" ? null : e.target.value,
                    })
                  }
                >
                  <option value="">Not linked</option>
                  {postOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title && p.title.trim() !== ""
                        ? p.title
                        : "Untitled post"}{" "}
                      ({p.platform} · {p.posted_date})
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="text-gray-500 underline"
                onClick={() => onDelete(item.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <input
          type="text"
          className="flex-1 min-w-[180px] bg-[#080b14] border border-white/10 rounded-lg px-3 py-2 text-white"
          placeholder="New deliverable — e.g. TikTok video 1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="date"
          className="bg-[#080b14] border border-white/10 rounded-lg px-3 py-2 text-white"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
        <button
          type="button"
          className="rounded-lg border border-cyan-400/40 px-3 py-2 text-cyan-200"
          onClick={async () => {
            if (!title.trim()) return;
            await onAdd(deal.id, title.trim(), due);
            setTitle("");
            setDue("");
          }}
        >
          Add deliverable
        </button>
      </div>
    </div>
  );
}

export default function BrandDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [brandHistory, setBrandHistory] = useState<BrandHistory[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [proposals, setProposals] = useState<ProposalOption[]>([]);
  const [postOptions, setPostOptions] = useState<PostOption[]>([]);
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
  const [invoiceSent, setInvoiceSent] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [paymentDue, setPaymentDue] = useState("");
  const [paymentReceived, setPaymentReceived] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [dealsRes, proposalsRes, postsRes] = await Promise.all([
        fetch("/api/deals"),
        fetch("/api/proposals"),
        fetch("/api/posts"),
      ]);
      const dealsData = await dealsRes.json();
      if (!dealsRes.ok) {
        throw new Error(dealsData.error || "Your deals could not be loaded.");
      }
      setDeals(dealsData.deals ?? []);
      setFollowUps(dealsData.followUps ?? []);
      setBrandHistory(dealsData.brandHistory ?? []);
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
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPostOptions(
          ((postsData.posts ?? []) as PostOption[]).filter(
            (p) => p && typeof p.id === "string"
          )
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
    const receivedCents =
      amountReceived.trim() === ""
        ? null
        : Math.round(Number(amountReceived) * 100);
    if (receivedCents !== null && (!Number.isFinite(receivedCents) || receivedCents < 0)) {
      setError("Amount received must be zero or above.");
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
          invoiceSentDate: invoiceSent === "" ? null : invoiceSent,
          paymentTerms: paymentTerms === "" ? null : paymentTerms,
          paymentDueDate: paymentDue === "" ? null : paymentDue,
          paymentReceivedDate: paymentReceived === "" ? null : paymentReceived,
          amountReceivedCents: receivedCents,
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
      setInvoiceSent("");
      setPaymentTerms("");
      setPaymentDue("");
      setPaymentReceived("");
      setAmountReceived("");
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

  async function addDeliverable(dealId: string, title: string, dueDate: string) {
    setError("");
    try {
      const response = await fetch("/api/deals/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          title,
          dueDate: dueDate === "" ? null : dueDate,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "The deliverable could not be saved.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The deliverable could not be saved.");
    }
  }

  async function patchDeliverable(id: string, patch: Record<string, unknown>) {
    setError("");
    try {
      const response = await fetch("/api/deals/deliverables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "The deliverable could not be updated.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The deliverable could not be updated.");
    }
  }

  async function deleteDeliverable(id: string) {
    setError("");
    try {
      const response = await fetch(
        `/api/deals/deliverables?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "The deliverable could not be deleted.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The deliverable could not be deleted.");
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

        {/* Follow-up queue — Build 12: who needs you next, computed
            from your own deals and proposals. Payments to chase
            first, then proposals waiting, then deals gone quiet. */}
        <h2 className="text-2xl font-bold mb-4">Follow-up queue</h2>
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          {loading ? (
            <p className="text-gray-400">Loading your queue…</p>
          ) : followUps.length === 0 ? (
            <p className="text-gray-300">
              Nothing needs chasing right now. When a payment goes
              outstanding, a proposal waits on a brand, or a deal goes
              quiet, it lands here — you never have to keep it in your
              head.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {followUps.map((f, i) => (
                <div
                  key={`${f.type}-${f.dealId ?? f.proposalId ?? i}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
                >
                  <span aria-hidden="true">
                    {f.type === "payment" ? "💰" : f.type === "proposal" ? "✉️" : "🤝"}
                  </span>
                  {f.type === "payment" && (
                    <span className="text-gray-200">
                      <strong>{f.brandName}</strong> —{" "}
                      {f.cents !== null ? `${money(f.cents)} ` : ""}invoiced
                      {f.days > 0 ? `, ${f.days} ${f.days === 1 ? "day" : "days"} outstanding` : ", not yet paid"}
                      {f.overdue && (
                        <span className="text-red-300 font-semibold">
                          {" "}— OVERDUE past the due date
                        </span>
                      )}{" "}
                      {f.dealId && (
                        <a href={`#deal-${f.dealId}`} className="text-cyan-300 underline">
                          Open the deal
                        </a>
                      )}
                    </span>
                  )}
                  {f.type === "proposal" && (
                    <span className="text-gray-200">
                      <strong>{f.brandName}</strong> — proposal sent, waiting{" "}
                      {f.days} {f.days === 1 ? "day" : "days"} for an answer.{" "}
                      {f.proposalId && (
                        <a
                          href={`/proposals?focus=${f.proposalId}`}
                          className="text-cyan-300 underline"
                        >
                          Open the proposal
                        </a>
                      )}
                    </span>
                  )}
                  {f.type === "quiet" && (
                    <span className="text-gray-200">
                      <strong>{f.brandName}</strong> — no movement in {f.days}{" "}
                      {f.days === 1 ? "day" : "days"}
                      {f.stage ? ` (stage: ${STAGE_LABEL.get(f.stage as DealStage) ?? f.stage})` : ""}
                      .{" "}
                      {f.dealId && (
                        <a href={`#deal-${f.dealId}`} className="text-cyan-300 underline">
                          Open the deal
                        </a>
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
                          id={`deal-${deal.id}`}
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
                          {/* Payment intelligence — Build 12: who
                              owes you, how much, since when, and
                              whether it is late. Received money is
                              only what you recorded as received. */}
                          {(deal.invoice_sent_date ||
                            deal.payment_terms ||
                            deal.payment.dueDate ||
                            deal.payment_received_date ||
                            deal.amount_received_cents !== null ||
                            deal.payment.outstanding) && (
                            <div className="mt-3 rounded-xl border border-white/10 bg-white/[.02] px-4 py-3 text-sm">
                              {deal.invoice_sent_date && (
                                <p className="text-gray-300">
                                  Invoice sent {formatDate(deal.invoice_sent_date)}
                                  {deal.payment_terms
                                    ? ` · Terms: ${TERMS_LABEL.get(deal.payment_terms) ?? deal.payment_terms}`
                                    : ""}
                                </p>
                              )}
                              {deal.payment.dueDate && !deal.payment.fullyPaid && (
                                <p className="text-gray-300">
                                  Payment due {formatDate(deal.payment.dueDate)}
                                  {deal.payment.dueDateCalculated
                                    ? " (calculated from the invoice date and terms)"
                                    : ""}
                                </p>
                              )}
                              {(deal.amount_received_cents !== null ||
                                deal.payment.receivedCents > 0) && (
                                <p className="text-gray-300">
                                  Received {money(deal.payment.receivedCents)}
                                  {deal.compensation_cents !== null
                                    ? ` of ${money(deal.compensation_cents)}`
                                    : ""}
                                  {deal.payment_received_date
                                    ? ` · ${formatDate(deal.payment_received_date)}`
                                    : ""}
                                </p>
                              )}
                              {deal.payment.fullyPaid ? (
                                <p className="text-emerald-300 font-semibold">
                                  Paid in full
                                  {deal.payment_received_date
                                    ? ` · ${formatDate(deal.payment_received_date)}`
                                    : ""}
                                </p>
                              ) : deal.payment.outstanding ? (
                                <p
                                  className={
                                    deal.payment.overdue
                                      ? "text-red-300 font-semibold"
                                      : "text-amber-200 font-semibold"
                                  }
                                >
                                  Outstanding
                                  {deal.payment.remainingCents !== null
                                    ? ` ${money(deal.payment.remainingCents)}`
                                    : deal.compensation_cents !== null
                                      ? ` ${money(deal.compensation_cents)}`
                                      : ""}
                                  {deal.payment.daysOutstanding !== null &&
                                  deal.payment.daysOutstanding > 0
                                    ? ` — ${deal.payment.daysOutstanding} ${
                                        deal.payment.daysOutstanding === 1 ? "day" : "days"
                                      } since the invoice`
                                    : ""}
                                  {deal.payment.overdue
                                    ? " — OVERDUE past the due date"
                                    : ""}
                                </p>
                              ) : null}
                            </div>
                          )}
                          {deal.deliverables && (
                            <p className="text-gray-300 mt-2">{deal.deliverables}</p>
                          )}
                          <DeliverablesBlock
                            deal={deal}
                            postOptions={postOptions}
                            onAdd={addDeliverable}
                            onPatch={patchDeliverable}
                            onDelete={deleteDeliverable}
                          />
                          {deal.attribution_history &&
                            deal.attribution_history.length > 0 && (
                              <div className="mt-2 px-1">
                                <p className="text-[11px] tracking-widest text-gray-500 mb-1">
                                  ATTRIBUTION HISTORY — WHO CHANGED WHAT, WHEN
                                </p>
                                <ul className="text-xs text-gray-400 space-y-1">
                                  {deal.attribution_history.map((ev) => (
                                    <li key={ev.id}>
                                      {formatDate(ev.created_at.slice(0, 10))}{" "}
                                      —{" "}
                                      {ev.action === "unlinked"
                                        ? `Unlinked "${ev.deliverable_title}" from post "${ev.from_post_title ?? "a post"}"`
                                        : ev.from_post_title
                                          ? `Changed "${ev.deliverable_title}" from post "${ev.from_post_title}" to "${ev.to_post_title ?? "a post"}"`
                                          : `Linked "${ev.deliverable_title}" to post "${ev.to_post_title ?? "a post"}"`}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          {deal.compensation_cents !== null && (
                            <p className="mt-2 text-sm">
                              <a
                                href={`/growth-center/deals/invoice?deal=${deal.id}`}
                                className="text-cyan-300 underline"
                              >
                                View invoice →
                              </a>{" "}
                              <span className="text-gray-500">
                                — a clean invoice built from this deal&apos;s
                                recorded figures, ready to print or save
                                as a PDF.
                              </span>
                            </p>
                          )}
                          {deal.notes && (
                            <p className="text-gray-400 mt-1 text-sm">{deal.notes}</p>
                          )}
                          {deal.proposal_id && (
                            <p className="text-gray-400 mt-1 text-sm">
                              Linked proposal:{" "}
                              <a
                                href={`/proposals?focus=${deal.proposal_id}`}
                                className="text-cyan-300 underline"
                              >
                                {proposalName.get(deal.proposal_id) ??
                                  "one of your proposals"}
                              </a>
                            </p>
                          )}
                          {deal.stage === "paid" && (
                            <p className="mt-2 text-sm">
                              <a
                                href={`/revenue?brand_name=${encodeURIComponent(
                                  deal.brand_name
                                )}&deal_id=${deal.id}&status=paid${
                                  deal.compensation_cents !== null
                                    ? `&amount_cents=${deal.compensation_cents}`
                                    : ""
                                }`}
                                className="text-emerald-300 underline"
                              >
                                Record this payment in Revenue →
                              </a>{" "}
                              <span className="text-gray-500">
                                — prefilled from this deal; you check and
                                save it yourself, nothing is recorded
                                automatically.
                              </span>
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
                            <label className="text-gray-400 text-sm">
                              Invoice sent
                              <input
                                type="date"
                                className="ml-2 bg-[#080b14] border border-white/10 rounded-lg px-3 py-2 text-white"
                                defaultValue={deal.invoice_sent_date ?? ""}
                                disabled={busyId === deal.id}
                                onBlur={(e) => {
                                  const v = e.target.value === "" ? null : e.target.value;
                                  if (v !== deal.invoice_sent_date) {
                                    patchDeal(deal.id, { invoiceSentDate: v });
                                  }
                                }}
                              />
                            </label>
                            <label className="text-gray-400 text-sm">
                              Terms
                              <select
                                className="ml-2 bg-[#080b14] border border-white/10 rounded-lg px-3 py-2 text-white"
                                defaultValue={deal.payment_terms ?? ""}
                                disabled={busyId === deal.id}
                                onChange={(e) => {
                                  const v = e.target.value === "" ? null : e.target.value;
                                  if (v !== deal.payment_terms) {
                                    patchDeal(deal.id, { paymentTerms: v });
                                  }
                                }}
                              >
                                <option value="">Not set</option>
                                {TERMS_OPTIONS.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="text-gray-400 text-sm">
                              Payment due
                              <input
                                type="date"
                                className="ml-2 bg-[#080b14] border border-white/10 rounded-lg px-3 py-2 text-white"
                                defaultValue={deal.payment_due_date ?? ""}
                                disabled={busyId === deal.id}
                                onBlur={(e) => {
                                  const v = e.target.value === "" ? null : e.target.value;
                                  if (v !== deal.payment_due_date) {
                                    patchDeal(deal.id, { paymentDueDate: v });
                                  }
                                }}
                              />
                            </label>
                            <label className="text-gray-400 text-sm">
                              Payment received
                              <input
                                type="date"
                                className="ml-2 bg-[#080b14] border border-white/10 rounded-lg px-3 py-2 text-white"
                                defaultValue={deal.payment_received_date ?? ""}
                                disabled={busyId === deal.id}
                                onBlur={(e) => {
                                  const v = e.target.value === "" ? null : e.target.value;
                                  if (v !== deal.payment_received_date) {
                                    patchDeal(deal.id, { paymentReceivedDate: v });
                                  }
                                }}
                              />
                            </label>
                            <label className="text-gray-400 text-sm">
                              Amount received $
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="ml-2 w-32 bg-[#080b14] border border-white/10 rounded-lg px-3 py-2 text-white"
                                defaultValue={
                                  deal.amount_received_cents === null
                                    ? ""
                                    : (deal.amount_received_cents / 100).toString()
                                }
                                disabled={busyId === deal.id}
                                onBlur={(e) => {
                                  const raw = e.target.value.trim();
                                  const cents =
                                    raw === "" ? null : Math.round(Number(raw) * 100);
                                  if (cents !== deal.amount_received_cents) {
                                    if (cents !== null && (!Number.isFinite(cents) || cents < 0)) {
                                      setError("Amount received must be zero or above.");
                                      return;
                                    }
                                    patchDeal(deal.id, { amountReceivedCents: cents });
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

        {/* Brand payment history — Build 12: which brands pay on
            time and which pay late, from your own deal records. */}
        <h2 className="text-2xl font-bold mb-4">Brand payment history</h2>
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          {loading ? (
            <p className="text-gray-400">Loading brand history…</p>
          ) : brandHistory.length === 0 ? (
            <p className="text-gray-300">
              No brands yet. As you track deals, this shows each
              brand's payment record — late payments, average delay,
              and what they still owe you.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {brandHistory.map((b) => (
                <div
                  key={b.brandName}
                  className="rounded-2xl border border-white/10 bg-white/[.02] px-5 py-4"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-bold">{b.brandName}</span>
                    <span className="text-gray-400 text-sm">
                      {b.totalDeals} {b.totalDeals === 1 ? "deal" : "deals"}
                    </span>
                    {b.outstandingCents > 0 && (
                      <span className="text-amber-200 font-semibold text-sm">
                        Owes you {money(b.outstandingCents)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    {b.latePayments === 0
                      ? "No late payments on record."
                      : `${b.latePayments} late ${b.latePayments === 1 ? "payment" : "payments"}${
                          b.avgDelayDays !== null
                            ? ` · average delay ${b.avgDelayDays} ${b.avgDelayDays === 1 ? "day" : "days"}`
                            : ""
                        }.`}
                    {b.reliabilityPct !== null
                      ? ` On-time reliability ${b.reliabilityPct}% across ${b.measurablePayments} measurable ${b.measurablePayments === 1 ? "payment" : "payments"}.`
                      : " Reliability appears once a payment has a due date and an outcome."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

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
              <span className="text-gray-300 text-sm">Invoice sent date</span>
              <input
                type="date"
                className={inputClass}
                value={invoiceSent}
                onChange={(e) => setInvoiceSent(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-gray-300 text-sm">Payment terms</span>
              <select
                className={inputClass}
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                <option value="">Not set</option>
                {TERMS_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-gray-300 text-sm">
                Payment due date (blank = calculated from terms)
              </span>
              <input
                type="date"
                className={inputClass}
                value={paymentDue}
                onChange={(e) => setPaymentDue(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-gray-300 text-sm">Payment received date</span>
              <input
                type="date"
                className={inputClass}
                value={paymentReceived}
                onChange={(e) => setPaymentReceived(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-gray-300 text-sm">
                Amount received ($) — only what actually arrived
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
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
