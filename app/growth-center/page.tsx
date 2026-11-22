"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Creator Growth Center — the central creator dashboard.
//
// THE FOUNDATION (owner, 2026-11-22): every creator owns their
// data. This page opens with the creator's own account — their
// identity, their member status, their plan, their username — and
// every figure below it comes from that same creator's own stored
// rows via /api/growth-center (shaped by lib/growth-center/
// aggregate.ts). Nothing here reads, infers, or displays another
// creator's data.
//
// HONESTY RULE (binding): recorded earnings are the creator's own
// records; estimated platform earnings are shown in their own
// block, labeled as estimates, and never added to recorded money.
// Followers, views, and engagement have no source until a platform
// connection is live, so they render as an explicit not-connected
// state — never as numbers. The seven sections say their real
// state: live, partial, or a later phase.

type Account = {
  name: string | null;
  email: string | null;
  username: string | null;
  memberStatus: string;
  planName: string | null;
};

type Overview = {
  account: Account;
  earnings: {
    lifetimeCents: number;
    thisMonthCents: number;
    lastMonthCents: number;
    changePct: number | null;
    pendingCents: number;
    receivedCents: number;
  };
  estimates: {
    totalEstimatedCents: number;
    creatorEnteredCents: number;
    platformReportedCents: number;
  };
  posting: {
    postsThisMonth: number;
    postsThisMonthManual: number;
    postsThisMonthVerified: number;
    currentStreak: number;
    postsThisWeek: number;
    weeklyGoal: number;
    goalProgressPct: number;
    activeDays: number;
    totalPosts: number;
  };
  connections: {
    platform: string;
    label: string;
    status: string;
    statusLabel: string;
    handle: string | null;
  }[];
  socialMetrics: { state: "not_connected"; note: string };
  sections: {
    id: string;
    number: string;
    title: string;
    state: "live" | "partial" | "later_phase";
    stateNote: string;
    links: { label: string; href: string }[];
  }[];
};

/** Exact integer formatting: cents → $X,XXX.XX (display only). */
function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = String(abs % 100).padStart(2, "0");
  return `${sign}$${dollars.toLocaleString("en-US")}.${remainder}`;
}

const inputClass =
  "mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white";

function StateChip({ state }: { state: string }) {
  const styles: Record<string, string> = {
    live: "border-emerald-400/40 text-emerald-300",
    partial: "border-amber-400/40 text-amber-300",
    later_phase: "border-white/20 text-gray-400",
  };
  const labels: Record<string, string> = {
    live: "LIVE",
    partial: "PARTIAL",
    later_phase: "LATER PHASE",
  };
  return (
    <span
      className={`text-[11px] tracking-widest border rounded-full px-3 py-1 ${styles[state] ?? styles.later_phase}`}
    >
      {labels[state] ?? state.toUpperCase()}
    </span>
  );
}

export default function GrowthCenterPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [usernameInput, setUsernameInput] = useState("");
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSaved, setUsernameSaved] = useState(false);

  async function load() {
    try {
      const response = await fetch("/api/growth-center");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your Growth Center could not be loaded.");
      }
      setOverview(data.overview as Overview);
      setUsernameInput((data.overview as Overview).account.username ?? "");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your Growth Center could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveUsername() {
    setUsernameBusy(true);
    setUsernameError("");
    setUsernameSaved(false);
    try {
      const response = await fetch("/api/growth-center", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your username could not be saved.");
      }
      setOverview((prev) =>
        prev
          ? { ...prev, account: { ...prev.account, username: data.username } }
          : prev
      );
      setUsernameInput(data.username ?? "");
      setUsernameSaved(true);
    } catch (e) {
      setUsernameError(
        e instanceof Error ? e.message : "Your username could not be saved."
      );
    } finally {
      setUsernameBusy(false);
    }
  }

  const metricCards: Array<[string, string, string]> = overview
    ? [
        [formatMoney(overview.earnings.lifetimeCents), "Lifetime recorded earnings", "text-cyan-400"],
        [formatMoney(overview.earnings.thisMonthCents), "Recorded this month", "text-cyan-400"],
        [
          overview.earnings.changePct === null
            ? "—"
            : `${overview.earnings.changePct > 0 ? "+" : ""}${overview.earnings.changePct}%`,
          `vs last month (${formatMoney(overview.earnings.lastMonthCents)})`,
          overview.earnings.changePct !== null && overview.earnings.changePct < 0
            ? "text-amber-300"
            : "text-emerald-300",
        ],
        [formatMoney(overview.earnings.pendingCents), "Outstanding — owed to you", "text-amber-300"],
        [formatMoney(overview.earnings.receivedCents), "Received", "text-emerald-300"],
      ]
    : [];

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / CREATOR GROWTH CENTER
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          ULTRA VESTRA — CREATOR GROWTH CENTER
        </div>

        <div className="mb-10">
          <div className="text-cyan-400 text-sm mb-3">
            ONE CREATOR. MULTIPLE PLATFORMS. ONE COMMAND CENTER.
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            CREATOR
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500">
              GROWTH CENTER.
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Your creator operating system — your account, your recorded
            earnings, your posting consistency, and your platform
            connections. Every figure here is yours, from your records.
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
            <h3 className="text-xl font-bold">Loading your Growth Center</h3>
            <p className="text-gray-400 mt-2">Gathering your records...</p>
          </div>
        ) : overview ? (
          <div className="space-y-10">
            {/* --- Your Creator Account (the foundation) --- */}
            <section className="rounded-3xl border border-fuchsia-400/30 bg-[#111827] p-6 md:p-8">
              <div className="text-cyan-400 text-xs tracking-widest mb-3">
                YOUR CREATOR ACCOUNT
              </div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold">
                    {overview.account.name ?? overview.account.email ?? "Your account"}
                  </div>
                  {overview.account.name && overview.account.email && (
                    <div className="text-gray-400 text-sm mt-1">
                      {overview.account.email}
                    </div>
                  )}
                  <div className="text-gray-300 text-sm mt-2">
                    Member status:{" "}
                    <strong className="text-gray-100">
                      {overview.account.memberStatus}
                    </strong>
                    {overview.account.planName
                      ? ` · Plan: ${overview.account.planName}`
                      : ""}
                  </div>
                  {overview.account.username ? (
                    <div className="text-fuchsia-300 font-bold mt-2">
                      @{overview.account.username}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm mt-2">
                      No username set yet — choose yours below.
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 max-w-md">
                <label className="text-sm text-gray-300">
                  Your UltraVestra username
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="yourname"
                    maxLength={24}
                    className={inputClass}
                  />
                </label>
                <p className="text-gray-500 text-xs mt-2">
                  3–24 characters: lowercase letters, numbers, and
                  underscores. Yours alone — no one else can take it.
                </p>
                {usernameError && (
                  <p role="alert" className="text-red-400 text-sm mt-2">
                    {usernameError}
                  </p>
                )}
                {usernameSaved && (
                  <p className="text-emerald-300 text-sm mt-2">Saved.</p>
                )}
                <button
                  onClick={saveUsername}
                  disabled={usernameBusy}
                  className="mt-3 rounded-xl px-5 py-3 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
                >
                  {usernameBusy ? "Saving..." : "Save username"}
                </button>
              </div>
            </section>

            {/* --- 01 Overview metrics --- */}
            <div>
              <div className="text-cyan-400 text-xs tracking-widest mb-4">
                01 · OVERVIEW — YOUR RECORDED EARNINGS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {metricCards.map(([value, label, color]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-white/[.04] border border-white/10 p-5"
                  >
                    <div className={`text-3xl font-bold ${color}`}>{value}</div>
                    <div className="text-gray-400 text-sm mt-2">{label}</div>
                  </div>
                ))}
                <div className="rounded-2xl border border-violet-400/30 bg-violet-500/[.06] p-5">
                  <div className="text-3xl font-bold text-violet-300">
                    {formatMoney(overview.estimates.totalEstimatedCents)}
                  </div>
                  <div className="text-gray-400 text-sm mt-2">
                    Estimated platform earnings —{" "}
                    <strong className="text-gray-200">
                      not money received
                    </strong>
                    , never added to the figures above.{" "}
                    <Link href="/revenue" className="text-cyan-300 underline">
                      Manage in Revenue
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Posting strip --- */}
            <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-cyan-400 text-xs tracking-widest mb-3">
                    POSTING CONSISTENCY
                  </div>
                  <div className="text-2xl font-bold">
                    {overview.posting.currentStreak} day streak ·{" "}
                    {overview.posting.postsThisMonth} posts this month
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    This week: {overview.posting.postsThisWeek} of{" "}
                    {overview.posting.weeklyGoal} goal posts (
                    {overview.posting.goalProgressPct}%). This month:{" "}
                    {overview.posting.postsThisMonthManual} logged by you ·{" "}
                    {overview.posting.postsThisMonthVerified} platform-verified.
                  </p>
                </div>
                <Link
                  href="/growth-center/posting"
                  className="text-fuchsia-300 text-sm font-bold"
                >
                  Open Posting Tracker →
                </Link>
              </div>
              <div className="h-2.5 rounded-full bg-white/[.06] overflow-hidden mt-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-500"
                  style={{ width: `${overview.posting.goalProgressPct}%` }}
                />
              </div>
            </section>

            {/* --- Connections strip + social metrics state --- */}
            <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-cyan-400 text-xs tracking-widest">
                  YOUR PLATFORMS
                </div>
                <Link
                  href="/growth-center/connections"
                  className="text-fuchsia-300 text-sm font-bold"
                >
                  Manage connections →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {overview.connections.map((c) => (
                  <div
                    key={c.platform}
                    className="rounded-2xl border border-white/10 bg-white/[.02] px-5 py-4"
                  >
                    <div className="font-bold">{c.label}</div>
                    <div className="text-gray-400 text-sm mt-1">
                      {c.statusLabel}
                      {c.handle ? ` · ${c.handle}` : ""}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-sm mt-4">
                {overview.socialMetrics.note}
              </p>
            </section>

            {/* --- The seven sections --- */}
            <div>
              <div className="text-cyan-400 text-xs tracking-widest mb-4">
                THE GROWTH CENTER
              </div>
              <div className="space-y-4">
                {overview.sections.map((section) => (
                  <section
                    key={section.id}
                    className="rounded-3xl border border-white/10 bg-[#111827] p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-bold text-lg">
                        <span className="text-cyan-400 mr-2">
                          {section.number}
                        </span>
                        {section.title}
                      </div>
                      <StateChip state={section.state} />
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      {section.stateNote}
                    </p>
                    {section.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {section.links.map((link) => (
                          <Link
                            key={link.href + link.label}
                            href={link.href}
                            className="rounded-lg border border-cyan-400/40 text-cyan-300 px-4 py-2 text-sm hover:bg-cyan-400/10 transition"
                          >
                            {link.label} →
                          </Link>
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
