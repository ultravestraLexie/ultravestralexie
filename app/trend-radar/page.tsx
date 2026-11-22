"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Trend Radar (v1, directory-data edition) — what moved inside the
// UltraVestra brand directory: the newest brands added, the biggest
// categories, the freshest affiliate programs on record, and the
// highest-scored brands among the newest arrivals.
//
// HONESTY RULES (binding, from the platform's no-false-precision
// doctrine): every number here is a count or a stored value
// computed from the directory itself by /api/trend-radar. This page
// is labeled directory activity throughout — never market or web
// trends. An "added" date is the day a brand or program entered
// THIS directory, not the day it launched, and the copy says so
// wherever a date appears. The "Live web trends" panel renders an
// explicit unavailable state: there is no placeholder or invented
// trend data anywhere on this page.
//
// All data comes through /api/trend-radar (session + subscription
// gated). This page holds no direct database access.

type NewestBrand = {
  brandId: string;
  name: string;
  category: string | null;
  addedAt: string;
};

type CategoryCount = {
  name: string;
  slug: string;
  brandCount: number;
};

type FreshProgram = {
  brandId: string;
  brandName: string;
  network: string | null;
  commissionRate: number | null;
  commissionNotes: string | null;
  addedAt: string;
};

type ScoredArrival = {
  brandId: string;
  name: string;
  category: string | null;
  totalScore: number | null;
  addedAt: string;
};

type TrendRadarData = {
  totals: { brandCount: number; categoryCount: number; programCount: number };
  newest: NewestBrand[];
  biggestCategories: CategoryCount[];
  freshestPrograms: FreshProgram[];
  topScoredNewArrivals: {
    cohortSize: number;
    cohortCutoff: string | null;
    items: ScoredArrival[];
  };
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ScoreChip({ score }: { score: number }) {
  return (
    <span
      className="text-[11px] font-bold text-white rounded-full px-3 py-1"
      style={{
        background: "linear-gradient(92deg, #a855f7, #d946ef)",
      }}
    >
      Score {Math.round(score)}
    </span>
  );
}

function SectionCard({
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

export default function TrendRadarPage() {
  const [data, setData] = useState<TrendRadarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/trend-radar");
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error || "Trend Radar could not be loaded.");
        }
        setData(body as TrendRadarData);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Trend Radar could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const topCategoryCount = data?.biggestCategories[0]?.brandCount ?? 0;

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / TREND RADAR
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          TREND RADAR — DIRECTORY EDITION
        </div>

        <div className="mb-12">
          <div className="text-cyan-400 text-sm mb-3">
            WHAT MOVED INSIDE THE ULTRAVESTRA DIRECTORY
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            THE DIRECTORY,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
              AS IT MOVES.
            </span>
          </h1>

          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            The newest brands added, the biggest categories, and the freshest
            programs on record — counted from the UltraVestra directory
            itself. This is directory activity, not a measure of the wider
            market or the live web.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          <div className="text-cyan-400 text-xs tracking-widest mb-4">
            HOW TO READ THE DATES
          </div>
          <p className="text-sm text-gray-300 leading-6">
            An &ldquo;added&rdquo; date is the day a brand or program was
            added to <strong className="text-gray-100">this directory</strong>{" "}
            — the day our research brought it in, not the day the brand or
            its program launched. New additions are where early creators get
            in before a niche crowds; the dates here tell you what is new to
            UltraVestra, and nothing more.
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
            <h3 className="text-xl font-bold">Reading the directory</h3>
            <p className="text-gray-400 mt-2">Counting what moved...</p>
          </div>
        ) : data ? (
          <div className="space-y-10">
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                [String(data.totals.brandCount), "Brands in the directory"],
                [String(data.totals.categoryCount), "Categories covered"],
                [String(data.totals.programCount), "Programs on record"],
              ].map(([number, label]) => (
                <div
                  key={label}
                  className="rounded-2xl bg-white/[.04] border border-white/10 p-5"
                >
                  <div className="text-3xl font-bold text-cyan-400">
                    {number}
                  </div>
                  <div className="text-gray-400 text-sm mt-2">{label}</div>
                </div>
              ))}
            </div>

            <SectionCard
              label="NEWEST IN THE DIRECTORY"
              title="Newest in the directory"
              blurb="The 10 most recently added brands. Added dates are when each brand entered this directory."
            >
              {data.newest.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No brands in the directory yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.newest.map((b) => (
                    <div
                      key={b.brandId}
                      className="rounded-2xl border border-white/10 bg-white/[.04] p-5 flex flex-wrap items-center gap-3"
                    >
                      <Link
                        href={`/brands/${b.brandId}`}
                        className="font-bold text-gray-100"
                      >
                        {b.name}
                      </Link>
                      {b.category && (
                        <span className="text-[11px] tracking-widest border rounded-full px-3 py-1 border-violet-400/40 text-violet-300">
                          {b.category.toUpperCase()}
                        </span>
                      )}
                      <span className="text-sm text-gray-400 ml-auto">
                        Added {formatDate(b.addedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              label="BIGGEST CATEGORIES"
              title="Biggest categories"
              blurb="The 8 categories with the most brands in the directory. Each count is the number of directory brands in that category; a brand in two categories counts in both."
            >
              {data.biggestCategories.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No categorized brands yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.biggestCategories.map((c) => (
                    <div
                      key={c.slug}
                      className="rounded-2xl border border-white/10 bg-white/[.04] p-5"
                    >
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <span className="font-bold text-gray-100">{c.name}</span>
                        <span className="text-sm text-gray-400">
                          {c.brandCount} brands
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[.06] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${
                              topCategoryCount
                                ? Math.round(
                                    (c.brandCount / topCategoryCount) * 100
                                  )
                                : 0
                            }%`,
                            background:
                              "linear-gradient(92deg, #22d3ee, #a855f7, #d946ef)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              label="FRESHEST PROGRAMS"
              title="Freshest programs"
              blurb="The 10 most recently added affiliate programs on record, with the network and commission exactly as stored. Added dates are when each program entered this directory."
            >
              {data.freshestPrograms.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No affiliate programs on record yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.freshestPrograms.map((p, i) => (
                    <div
                      key={`${p.brandId}-${p.addedAt}-${i}`}
                      className="rounded-2xl border border-white/10 bg-white/[.04] p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <Link
                          href={`/brands/${p.brandId}`}
                          className="font-bold text-gray-100"
                        >
                          {p.brandName}
                        </Link>
                        {p.network && (
                          <span className="text-[11px] tracking-widest border rounded-full px-3 py-1 border-cyan-400/40 text-cyan-300">
                            {p.network.toUpperCase()}
                          </span>
                        )}
                        {p.commissionRate != null ? (
                          <span className="text-sm font-bold text-emerald-300">
                            Pays {p.commissionRate}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Rate not recorded
                          </span>
                        )}
                        <span className="text-sm text-gray-400 ml-auto">
                          Added {formatDate(p.addedAt)}
                        </span>
                      </div>
                      {p.commissionNotes && (
                        <p className="text-sm text-gray-400 leading-6">
                          {p.commissionNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              label="TOP SCORED NEW ARRIVALS"
              title="Top scored new arrivals"
              blurb={`Among the newest 10% of the directory (${data.topScoredNewArrivals.cohortSize} brands${
                data.topScoredNewArrivals.cohortCutoff
                  ? `, added since ${formatDate(data.topScoredNewArrivals.cohortCutoff)}`
                  : ""
              }), the five highest Opportunity Scores on record. Scores are the stored directory scores, not predictions.`}
            >
              {data.topScoredNewArrivals.items.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No scored new arrivals yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.topScoredNewArrivals.items.map((b) => (
                    <div
                      key={b.brandId}
                      className="rounded-2xl border border-white/10 bg-white/[.04] p-5 flex flex-wrap items-center gap-3"
                    >
                      <Link
                        href={`/brands/${b.brandId}`}
                        className="font-bold text-gray-100"
                      >
                        {b.name}
                      </Link>
                      {b.totalScore != null && (
                        <ScoreChip score={b.totalScore} />
                      )}
                      {b.category && (
                        <span className="text-[11px] tracking-widest border rounded-full px-3 py-1 border-violet-400/40 text-violet-300">
                          {b.category.toUpperCase()}
                        </span>
                      )}
                      <span className="text-sm text-gray-400 ml-auto">
                        Added {formatDate(b.addedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              label="LIVE WEB TRENDS"
              title="Live web trends"
              blurb="What is rising across the live web — search interest, social conversation and emerging topics beyond this directory."
            >
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-6 text-center">
                <div className="text-3xl mb-3">◈</div>
                <p className="font-bold text-gray-200 mb-2">Not connected yet</p>
                <p className="text-sm text-gray-400 leading-6 max-w-md mx-auto">
                  Live-web trend data is not connected yet. It will arrive
                  when the Tavily search key is set. Until then this panel
                  stays empty — Trend Radar shows only what it can count from
                  the directory, never placeholder trends.
                </p>
              </div>
            </SectionCard>
          </div>
        ) : null}

        <p className="text-xs text-gray-500 text-center mt-12">
          Every number on this page is counted from the UltraVestra directory
          at load time — brands, categories, programs and scores as stored.
          Directory activity is not market data, and an Opportunity Score is
          a directory ranking, not a promise of results.
        </p>
      </div>
    </main>
  );
}
