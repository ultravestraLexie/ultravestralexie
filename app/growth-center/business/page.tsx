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
// - Since Build 12, revenue entries can carry a platform: the
//   platform block splits the entries that have one and says so
//   plainly for the rest — never an invented split. The source
//   block cuts the same rows by kind. Brand concentration is
//   real, because entries do carry a brand.
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
  bySource: ShareTotal[];
  byBrand: ShareTotal[];
  avgPerCampaignCents: number | null;
  monthlyTrend: MonthTotal[];
  topPlatformSharePct: number;
  topBrandSharePct: number;
  receivables: {
    contractedCents: number;
    invoicedCents: number;
    outstandingCents: number;
    overdueCents: number;
    collectedCents: number;
  };
  contentAttribution: {
    linkedCents: number;
    linkedPct: number;
    topPosts: {
      postId: string;
      title: string | null;
      platform: string | null;
      postedDate: string | null;
      cents: number;
    }[];
  };
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

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  amazon: "Amazon",
  other: "Other",
};

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
                      No revenue recorded with a platform yet. When
                      you record revenue in the{" "}
                      <a href="/revenue" className="text-cyan-300 underline">
                        Revenue Tracker
                      </a>
                      , choose the platform it came through — TikTok,
                      Instagram, YouTube, Amazon — and this block shows
                      exactly where your money comes from. Entries
                      without a platform stay out of the split; nothing
                      is estimated in their place.
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
                            <span className="font-semibold">
                              {PLATFORM_LABELS[p.name] ?? p.name}
                            </span>
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

                <h3 className="text-lg font-bold mt-8 mb-3">Content that earns</h3>
                {health.contentAttribution.linkedCents === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
                    <p className="text-gray-300">
                      No recorded revenue is linked to a post yet.
                      When you record revenue in the{" "}
                      <a href="/revenue" className="text-cyan-300 underline">
                        Revenue Tracker
                      </a>
                      , choose the post that earned it — this block
                      then shows which content actually produces
                      money, and what share of your revenue is
                      linked. Links are reported by you; UltraVestra
                      does not verify conversions.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-300 mb-3">
                      {money(health.contentAttribution.linkedCents)} of your{" "}
                      {money(health.totalRecordedCents)} recorded revenue —{" "}
                      {health.contentAttribution.linkedPct}% — is linked to a
                      post. The rest is not linked to any post, and it is
                      never spread across posts by assumption. Links are
                      reported by you.
                    </p>
                    <div className="flex flex-col gap-2">
                      {health.contentAttribution.topPosts.map((p) => (
                        <div
                          key={p.postId}
                          className="rounded-2xl border border-white/10 bg-white/[.03] px-5 py-3"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="font-semibold">
                              {p.title && p.title.trim() !== ""
                                ? p.title
                                : "Untitled post"}
                              {p.platform ? (
                                <span className="text-gray-400 font-normal text-sm">
                                  {" "}· {PLATFORM_LABELS[p.platform] ?? p.platform}
                                  {p.postedDate ? ` · ${p.postedDate}` : ""}
                                </span>
                              ) : null}
                            </span>
                            <span className="text-gray-300">{money(p.cents)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <h3 className="text-lg font-bold mt-8 mb-3">By source</h3>
                {health.bySource.length === 0 ? (
                  <p className="text-gray-400">
                    No recorded revenue yet. When you record earnings,
                    this block separates affiliate commissions, brand
                    sponsorships, platform payouts, and other income —
                    so you can see which kind of money actually pays.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {health.bySource.map((s) => (
                      <div
                        key={s.name}
                        className="rounded-2xl border border-white/10 bg-white/[.03] px-5 py-3"
                      >
                        <div className="flex items-baseline justify-between">
                          <span className="font-semibold">{s.name}</span>
                          <span className="text-gray-300">
                            {money(s.cents)} · {s.sharePct}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-fuchsia-400 to-violet-500"
                            style={{ width: `${Math.min(100, s.sharePct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
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

              {/* Receivables — Build 12: the five money states,
                  kept distinct. Contracted is agreed work; invoiced
                  is billed; outstanding is still owed; overdue is
                  owed past its due date; collected is what you
                  recorded as actually received on deals. Recorded
                  revenue (the ledger above) stays the money proof. */}
              <h3 className="text-lg font-bold mt-8 mb-3">
                Receivables — who owes you
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Stat
                  label="Contracted revenue"
                  value={money(health.receivables.contractedCents)}
                  sub="Agreed deals: active through paid"
                />
                <Stat
                  label="Invoiced revenue"
                  value={money(health.receivables.invoicedCents)}
                  sub="Deals you have sent an invoice for"
                />
                <Stat
                  label="Outstanding receivables"
                  value={money(health.receivables.outstandingCents)}
                  sub="Invoiced, not yet fully received"
                />
                <Stat
                  label="Overdue receivables"
                  value={money(health.receivables.overdueCents)}
                  sub="Outstanding past the payment due date"
                />
                <Stat
                  label="Collected on deals"
                  value={money(health.receivables.collectedCents)}
                  sub="Amounts you recorded as received"
                />
              </div>
              <p className="text-gray-500 text-sm mt-3">
                From your deal records in{" "}
                <a href="/growth-center/deals" className="text-cyan-300 underline">
                  Brand Deals
                </a>
                . A deal counts as collected only from amounts you
                recorded as received — never from a promise.
              </p>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
