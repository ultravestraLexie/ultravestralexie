"use client";

import { useEffect, useState } from "react";

// AI Creator Advisor — what should I do next, according to my
// own numbers?
//
// Two layers, one set of numbers:
// - The evidence core: every recommendation card below is
//   computed by a stated rule from the creator's OWN records
//   (lib/advisor/recommendations.ts) and renders its evidence —
//   the exact numbers the rule read.
// - The AI brief (POST /api/advisor/ai): a model writes a short,
//   prioritized brief from the SAME computed evidence. It may
//   only use figures the evidence contains, and the panel labels
//   it as AI-written so the creator can check every number
//   against the cards below.
//
// HONESTY RULES (binding):
// - Estimated earnings never produce a recommendation or shape
//   the brief: neither API route reads the estimates table.
// - Nothing is advised from data the creator has not recorded.

type Brief = {
  headline: string;
  actions: { title: string; why: string; step: string }[];
  closingNote: string;
};

type Recommendation = {
  id: string;
  severity: "act" | "watch" | "good";
  title: string;
  message: string;
  evidence: Record<string, number | string>;
  href: string;
};

const SEVERITY_STYLE: Record<
  Recommendation["severity"],
  { border: string; badge: string; label: string }
> = {
  act: {
    border: "border-red-400/30 bg-red-500/[.05]",
    badge: "bg-red-500/15 text-red-300 border-red-400/30",
    label: "ACT",
  },
  watch: {
    border: "border-amber-400/30 bg-amber-500/[.05]",
    badge: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    label: "WATCH",
  },
  good: {
    border: "border-emerald-400/30 bg-emerald-500/[.05]",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    label: "ON TRACK",
  },
};

const EVIDENCE_LABELS: Record<string, string> = {
  postsThisWeek: "posts this week",
  weeklyGoal: "weekly goal",
  daysLeftInWeek: "days left in the week",
  currentStreak: "current streak (days)",
  daysSinceLastPost: "days since last post",
  lastPostDate: "last post",
  recordedThisMonth: "recorded this month",
  projectedThisMonth: "projected this month (pace math)",
  goalTarget: "goal",
  topBrand: "top brand",
  topBrandSharePct: "top brand share %",
  topBrandRecorded: "top brand recorded",
  totalRecorded: "total recorded",
  overdueDeals: "overdue deals",
  oldestDaysOverdue: "oldest overdue (days)",
  overduePayments: "overdue payments",
  overdueTotal: "overdue total",
  postsLogged: "posts logged",
  earningsRecorded: "earnings recorded",
  dealsTracked: "deals tracked",
  goalsSet: "goals set",
  daysElapsed: "days elapsed this month",
  daysInMonth: "days in this month",
};

function evidenceLine(rec: Recommendation): string {
  return Object.entries(rec.evidence)
    .map(([key, value]) => `${value} ${EVIDENCE_LABELS[key] ?? key}`)
    .join(" · ");
}

export default function AdvisorPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState("");

  async function writeBrief() {
    setBriefLoading(true);
    setBriefError("");
    try {
      const response = await fetch("/api/advisor/ai", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your brief could not be written.");
      }
      setBrief(data.brief as Brief);
    } catch (e) {
      setBriefError(
        e instanceof Error ? e.message : "Your brief could not be written."
      );
    } finally {
      setBriefLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/advisor");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Your recommendations could not be loaded.");
        }
        setRecommendations(data.recommendations);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Your recommendations could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / CREATOR GROWTH CENTER / AI CREATOR ADVISOR
        </div>

        <div className="mb-10">
          <div className="text-cyan-400 text-sm mb-3">WHAT SHOULD I DO NEXT?</div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">
            CREATOR
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500">
              ADVISOR.
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Your AI Advisor writes a brief from your own records —
            and every rule-based recommendation below shows the
            numbers behind it, so you can check anything it says.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          <div className="text-cyan-300/80 text-xs tracking-widest mb-2">
            HOW THIS WORKS
          </div>
          <p className="text-sm text-gray-300 leading-6">
            Each card below is a plain rule reading your Posting
            Tracker, Creator Goals, deal pipeline, and recorded
            revenue — the same figures those pages show. The{" "}
            <strong className="text-gray-100">Why</strong> line on
            every card is the exact evidence the rule read. The AI
            brief is written from these same figures — it may only
            use numbers your records contain. Estimated earnings are
            never read here, and nothing is advised from data you
            have not recorded.
          </p>
        </div>

        <div className="rounded-3xl border border-fuchsia-400/25 bg-fuchsia-500/[.04] p-6 mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-fuchsia-300/80 text-xs tracking-widest mb-2">
                YOUR AI ADVISOR BRIEF
              </div>
              <p className="text-sm text-gray-300 leading-6 max-w-xl">
                A short, prioritized brief written by AI from the
                records on this page — what matters most, why, and
                the next step for each.
              </p>
            </div>
            <button
              onClick={writeBrief}
              disabled={briefLoading}
              className="shrink-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {briefLoading
                ? "Writing your brief…"
                : brief
                  ? "Write a fresh brief"
                  : "Write my brief"}
            </button>
          </div>

          {briefLoading && (
            <p className="text-gray-400 text-sm mt-4">
              Reading your records and writing — this can take up to
              a minute.
            </p>
          )}

          {briefError && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/[.07] p-4 mt-4 text-red-200 text-sm">
              {briefError}
            </div>
          )}

          {brief && !briefLoading && (
            <div className="mt-6">
              <h2 className="text-2xl font-bold leading-snug">
                {brief.headline}
              </h2>
              <div className="flex flex-col gap-4 mt-5">
                {brief.actions.map((action, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/10 bg-white/[.03] p-5"
                  >
                    <div className="font-bold">
                      {i + 1}. {action.title}
                    </div>
                    <p className="text-gray-300 leading-6 mt-2 text-sm">
                      <span className="text-gray-500 tracking-widest text-xs">
                        WHY:{" "}
                      </span>
                      {action.why}
                    </p>
                    <p className="text-gray-300 leading-6 mt-2 text-sm">
                      <span className="text-gray-500 tracking-widest text-xs">
                        NEXT STEP:{" "}
                      </span>
                      {action.step}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-gray-300 leading-6 mt-5">{brief.closingNote}</p>
              <p className="text-xs text-gray-500 mt-4">
                Written by AI from your records — every number in it
                comes from the recommendations below. Check them.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/[.07] p-4 mb-8 text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Reading your records…</p>
        ) : recommendations && recommendations.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6">
            <p className="text-gray-300">
              Nothing needs your attention right now. Your records
              are being read — when a rule finds something, it will
              appear here with its numbers attached.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {(recommendations ?? []).map((rec) => {
              const style = SEVERITY_STYLE[rec.severity];
              return (
                <div
                  key={rec.id}
                  className={`rounded-3xl border p-6 ${style.border}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold">{rec.title}</h2>
                    <span
                      className={`shrink-0 text-xs font-bold tracking-widest border rounded-full px-3 py-1 ${style.badge}`}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-6 mt-3">{rec.message}</p>
                  <div className="text-sm text-gray-400 mt-4">
                    <span className="text-gray-500 tracking-widest text-xs">
                      WHY:{" "}
                    </span>
                    {evidenceLine(rec)}
                  </div>
                  <a
                    href={rec.href}
                    className="inline-block mt-4 text-cyan-300 underline text-sm"
                  >
                    Go to the record →
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
