"use client";

import { useEffect, useState } from "react";

// Creator Business Health — is the business underneath the
// content actually healthy?
//
// HONESTY RULES (binding):
// - Every money figure on this page comes from the creator's
//   RECORDED revenue entries (the Revenue Tracker ledger),
//   computed by the same summary math the ledger itself uses.
//   Estimated platform earnings are never read here — an estimate
//   is not business health. Each block names its source.
// - Deal figures come from the creator's own pipeline tracking
//   and are labeled "tracked by you": a deal in stage "paid" is
//   not a verified payment.
// - Recorded revenue entries do not carry a platform today, so
//   the platform block says exactly that instead of inventing a
//   split. Brand concentration is real, because entries do carry
//   a brand.
// - Empty data renders honest zeros and empty states — never a
//   number the records do not support.

type ShareTotal = { name: string; cents: number; sharePct: number };
type MonthTotal = {
  month: string;
  totalCents: number;
  paidCents: number;
  pendingCents: number;
};

type Health = {
  totalRecordedCents: number;
  outstandingCents: number;
  receivedCents: number;
  byPlatform: ShareTotal[];
  byBrand: ShareTotal[];
  avgPerCampaignCents: number | null;
  monthlyTrend: MonthTotal[];
  topPlatformSharePct: number;
  topBrandSharePct: number;
  pipeline: {
    openDeals: number;
    openValueCents: number;
    paidDeals: number;
    closedDeals: number;
    conversionPct: number | null;
  };
};

const CONCENTRATION_THRESHOLD = 70;

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

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function SourceLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-cyan-300/80 text-xs tracking-widest mb-3">{children}</div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
      <div className="text-gray-400 text-sm">{label}</div>
      <div className="text-3xl font-black mt-1">{value}</div>
      {sub && <div className="text-gray-500 text-sm mt-1">{sub}</div>}
    </div>
  );
}

export default function BusinessHealthPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/business");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Your business health could not be loaded.");
        }
        setHealth(data.health);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Your business health could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasRevenue = (health?.totalRecordedCents ?? 0) > 0;
  const topBrand = health?.byBrand[0];

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / CREATOR GROWTH CENTER / BUSINESS HEALTH
        </div>

        <div className="mb-10">
          <div className="text-cyan-400 text-sm mb-3">IS THE BUSINESS HEALTHY?</div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">
            BUSINESS
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500">
              HEALTH.
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Not views — the business underneath them. What you have
            actually recorded earning, who it depends on, and what
            your pipeline is worth.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/[.07] p-4 mb-8 text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Loading your business health…</p>
        ) : health ? (
          <div className="flex flex-col gap-12">
            {/* Recorded money */}
            <section>
              <SourceLabel>FROM YOUR RECORDED REVENUE</SourceLabel>
              {!hasRevenue ? (
                <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6">
                  <p className="text-gray-300">
                    Nothing recorded yet. When you record earnings in
                    the{" "}
                    <a href="/revenue" className="text-cyan-300 underline">
                      Revenue Tracker
                    </a>
                    , this page reads that ledger — and only that
                    ledger. Estimated platform earnings never appear
                    here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Stat label="Recorded all time" value={money(health.totalRecordedCents)} />
                    <Stat label="Received" value={money(health.receivedCents)} sub="Entries you marked paid" />
                    <Stat label="Outstanding" value={money(health.outstandingCents)} sub="Earned, still owed to you" />
                    <Stat
                      label="Average per campaign"
                      value={
                        health.avgPerCampaignCents === null
                          ? "—"
                          : money(health.avgPerCampaignCents)
                      }
                      sub={
                        health.avgPerCampaignCents === null
                          ? "No campaign fees recorded yet"
                          : "Across your recorded campaign fees"
                      }
                    />
                  </div>

                  <h3 className="text-lg font-bold mt-8 mb-3">Monthly trend</h3>
                  <div className="rounded-2xl border border-white/10 bg-white/[.03] divide-y divide-white/5">
                    {health.monthlyTrend.map((m) => (
                      <div
                        key={m.month}
                        className="flex items-baseline justify-between px-5 py-3"
                      >
                        <span className="text-gray-300">{monthLabel(m.month)}</span>
                        <span className="text-gray-400 text-sm">
                          {money(m.paidCents)} received · {money(m.pendingCents)} outstanding
                        </span>
                        <span className="font-bold">{money(m.totalCents)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* Concentration */}
            {hasRevenue && (
              <section>
                <SourceLabel>FROM YOUR RECORDED REVENUE</SourceLabel>
                <h3 className="text-lg font-bold mb-3">Where the money comes from — by brand</h3>
                <div className="flex flex-col gap-2">
                  {health.byBrand.map((b) => (
                    <div
                      key={b.name}
                      className="rounded-2xl border border-white/10 bg-white/[.03] px-5 py-3"
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="font-semibold">{b.name}</span>
                        <span className="text-gray-300">
                          {money(b.cents)} · {b.sharePct}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-fuchsia-400 to-violet-500"
                          style={{ width: `${Math.min(100, b.sharePct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {topBrand && health.topBrandSharePct >= CONCENTRATION_THRESHOLD && (
                  <p className="text-amber-200 mt-4">
                    Most of your recorded income comes from one brand —{" "}
                    {topBrand.name} is {health.topBrandSharePct}% of it.
                    That is a concentration risk worth seeing clearly:
                    if that one relationship pauses, most of the income
                    does too.
                  </p>
                )}

                <h3 className="text-lg font-bold mt-8 mb-3">By platform</h3>
                {health.byPlatform.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
                    <p className="text-gray-300">
                      Platform is not recorded on revenue entries yet,
                      so there is no honest platform split to show.
                      When platform sync arrives — or entries start
                      carrying a platform — this block fills in from
                      the same records. Nothing is estimated in its
                      place.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      {health.byPlatform.map((p) => (
                        <div
                          key={p.name}
                          className="rounded-2xl border border-white/10 bg-white/[.03] px-5 py-3"
                        >
                          <div className="flex items-baseline justify-between">
                            <span className="font-semibold">{p.name}</span>
                            <span className="text-gray-300">
                              {money(p.cents)} · {p.sharePct}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-fuchsia-400 to-violet-500"
                              style={{ width: `${Math.min(100, p.sharePct)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {health.topPlatformSharePct >= CONCENTRATION_THRESHOLD && (
                      <p className="text-amber-200 mt-4">
                        Most of your recorded income comes from one
                        platform — {health.topPlatformSharePct}% of it.
                        That is a concentration risk worth seeing
                        clearly.
                      </p>
                    )}
                  </>
                )}
              </section>
            )}

            {/* Pipeline */}
            <section>
              <SourceLabel>FROM YOUR DEAL PIPELINE — TRACKED BY YOU</SourceLabel>
              {health.pipeline.openDeals === 0 &&
              health.pipeline.paidDeals === 0 &&
              health.pipeline.closedDeals === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6">
                  <p className="text-gray-300">
                    No deals in your pipeline yet. Track them in{" "}
                    <a href="/growth-center/deals" className="text-cyan-300 underline">
                      Brand Deals
                    </a>{" "}
                    and this block reads that pipeline — your stages,
                    your figures.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Stat
                    label="Open deals"
                    value={String(health.pipeline.openDeals)}
                    sub="Lead through invoiced"
                  />
                  <Stat
                    label="Open pipeline value"
                    value={money(health.pipeline.openValueCents)}
                    sub="Compensation you recorded on open deals"
                  />
                  <Stat
                    label="Deals you marked paid"
                    value={String(health.pipeline.paidDeals)}
                    sub="Your tracking — payments are proven in Revenue"
                  />
                  <Stat
                    label="Deal conversion"
                    value={
                      health.pipeline.conversionPct === null
                        ? "—"
                        : `${health.pipeline.conversionPct}%`
                    }
                    sub={
                      health.pipeline.conversionPct === null
                        ? "No deal has reached paid or closed yet"
                        : `Paid out of paid + closed (${health.pipeline.closedDeals} closed)`
                    }
                  />
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
