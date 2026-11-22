"use client";

import { useEffect, useState } from "react";

// AI Creator Advisor (evidence core) — what should I do next,
// according to my own numbers?
//
// HONESTY RULES (binding):
// - Every recommendation on this page is computed by a stated
//   rule from the creator's OWN records (lib/advisor/
//   recommendations.ts) — there is no model call behind this
//   page in this phase, and the header says so.
// - Each card renders its evidence — the exact numbers the rule
//   read — so nothing here asks to be trusted on its own word.
// - Estimated earnings never produce a recommendation: the API
//   never reads the estimates table.

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
            Recommendations computed from your own records — every one
            shows its numbers. An AI-written advisor arrives in a
            later phase.
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
            every card is the exact evidence the rule read. Estimated
            earnings are never read here, and nothing is advised from
            data you have not recorded.
          </p>
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
