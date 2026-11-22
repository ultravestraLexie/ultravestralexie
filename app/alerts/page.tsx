"use client";

import { useEffect, useState } from "react";

// Opportunity Alerts — what was added to the brand directory since
// the creator last checked: new brands and new affiliate programs,
// filtered by the categories and alert types they chose.
//
// HONESTY RULE (binding): every alert is a real directory row with
// its real added-on timestamp, computed server-side by
// lib/alerts/feed.ts from the creator's stored watermark — this
// page renders the feed it is given and never re-derives its own.
// Changes INSIDE an existing program (a rate edited in place) are
// not tracked — no change-history exists — and the panel below says
// so plainly. Email delivery is not connected in v1: this page is
// where alerts live. Nothing here is estimated or predicted.
//
// All reads and writes go through /api/alerts (session +
// subscription gated, owner-only). This page holds no direct
// database access. After every change the page reloads from the
// API, so what it shows is always the server's feed for the stored
// watermark — never a local guess.

type AlertPrefs = {
  id: string;
  user_id: string;
  niches: string[];
  types: string[];
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

type AlertItem = {
  type: "new_brand" | "new_program";
  brandId: string;
  brandName: string;
  category: string | null;
  detail: { network: string | null; commissionRate: number | null } | null;
  at: string;
};

type AlertFeed = {
  items: AlertItem[];
  totalMatched: number;
  capped: boolean;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** ISO timestamp → 'November 22, 2026, 8:14 AM' (viewer-local). */
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hours24 = d.getHours();
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${hours}:${minutes} ${suffix}`;
}

function TypeBadge({ type }: { type: AlertItem["type"] }) {
  const style =
    type === "new_brand"
      ? "border-cyan-400/40 text-cyan-300"
      : "border-fuchsia-400/40 text-fuchsia-300";
  const label = type === "new_brand" ? "NEW BRAND" : "NEW PROGRAM";
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

export default function AlertsPage() {
  const [prefs, setPrefs] = useState<AlertPrefs | null>(null);
  const [feed, setFeed] = useState<AlertFeed>({
    items: [],
    totalMatched: 0,
    capped: false,
  });
  const [watermark, setWatermark] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");
  const [savedNote, setSavedNote] = useState("");

  const [nichesText, setNichesText] = useState("");
  const [wantBrands, setWantBrands] = useState(true);
  const [wantPrograms, setWantPrograms] = useState(true);

  async function load() {
    try {
      const response = await fetch("/api/alerts");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your alerts could not be loaded.");
      }
      const loadedPrefs = (data.prefs ?? null) as AlertPrefs | null;
      setPrefs(loadedPrefs);
      setFeed(
        data.feed ?? { items: [], totalMatched: 0, capped: false }
      );
      setWatermark(data.watermark ?? loadedPrefs?.last_seen_at ?? "");
      if (loadedPrefs) {
        setNichesText(loadedPrefs.niches.join(", "));
        setWantBrands(loadedPrefs.types.includes("new_brand"));
        setWantPrograms(loadedPrefs.types.includes("new_program"));
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your alerts could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function savePrefs() {
    const types: string[] = [];
    if (wantBrands) types.push("new_brand");
    if (wantPrograms) types.push("new_program");
    if (types.length === 0) {
      setError("Choose at least one alert type.");
      return;
    }
    setSaving(true);
    setError("");
    setSavedNote("");
    try {
      const response = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niches: nichesText
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== ""),
          types,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your alert settings could not be saved.");
      }
      setSavedNote("Settings saved.");
      // Reload so the feed shown is the server's, under the new prefs.
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your alert settings could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function markAllSeen() {
    setMarking(true);
    setError("");
    try {
      const response = await fetch("/api/alerts", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your alerts could not be marked as seen.");
      }
      // Reload: with the watermark at now, the feed comes back empty.
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your alerts could not be marked as seen."
      );
    } finally {
      setMarking(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / OPPORTUNITY ALERTS
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          ULTRA VESTRA — OPPORTUNITY ALERTS
        </div>

        <div className="mb-12">
          <div className="text-cyan-400 text-sm mb-3">
            NEW BRANDS. NEW PROGRAMS. AS THEY LAND.
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            WHAT&apos;S NEW,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500">
              SINCE YOU LAST LOOKED.
            </span>
          </h1>

          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            The directory grows in batches. This feed shows you the brands
            and affiliate programs added since your last check — in the
            categories you chose, and nowhere else.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          <div className="text-cyan-400 text-xs tracking-widest mb-4">
            WHAT THESE ALERTS CAN AND CANNOT SEE
          </div>
          <p className="text-sm text-gray-300 leading-6">
            Alerts come from the directory&apos;s own add records: a brand
            or a program appears here when its row was added, with the
            date it was added.{" "}
            <strong className="text-gray-100">
              Edits inside an existing program — like a commission rate
              changed in place — are not tracked yet,
            </strong>{" "}
            because the directory keeps no change-history to read them
            from. Email delivery is not connected either —{" "}
            <strong className="text-gray-100">
              this page is where alerts live for now.
            </strong>{" "}
            Nothing here is estimated, predicted, or pulled from anywhere
            else.
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
            <h3 className="text-xl font-bold">Loading your alerts</h3>
            <p className="text-gray-400 mt-2">Checking the directory...</p>
          </div>
        ) : (
          <div className="space-y-10">
            <SectionShell
              label="YOUR ALERTS"
              title="New since your last check"
              blurb={
                watermark
                  ? `${feed.totalMatched} new since ${formatTimestamp(watermark)}` +
                    (feed.capped
                      ? ` — showing the newest ${feed.items.length}.`
                      : ".")
                  : "Your new brands and programs, newest first."
              }
            >
              {feed.items.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Nothing new since your last check — alerts appear here
                  when brands or programs are added to the directory in
                  your categories.
                </p>
              ) : (
                <div className="space-y-3">
                  {feed.items.map((item, index) => (
                    <div
                      key={`${item.type}-${item.brandId}-${item.at}-${index}`}
                      className="rounded-2xl border border-white/10 bg-white/[.02] px-5 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-bold">{item.brandName}</div>
                          <div className="text-gray-400 text-sm mt-1">
                            {item.category
                              ? `${item.category} · `
                              : ""}
                            Added {formatTimestamp(item.at)}
                          </div>
                          {item.type === "new_program" && item.detail && (
                            <div className="text-gray-500 text-sm mt-1">
                              {item.detail.network
                                ? `Network: ${item.detail.network}`
                                : "Network: not recorded"}
                              {item.detail.commissionRate != null
                                ? ` · Rate: ${item.detail.commissionRate}%`
                                : " · Rate: not recorded"}
                            </div>
                          )}
                        </div>
                        <TypeBadge type={item.type} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {feed.items.length > 0 && (
                <button
                  onClick={markAllSeen}
                  disabled={marking}
                  className="mt-6 w-full rounded-xl p-5 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
                >
                  {marking ? "Marking..." : "Mark all as seen"}
                </button>
              )}
            </SectionShell>

            <SectionShell
              label="PREFERENCES"
              title="What you get alerts for"
              blurb="Categories are matched by name, however you capitalize them. Leave the categories blank to watch the whole directory. Changes apply to the feed right away."
            >
              <label className="text-sm text-gray-300">
                Categories (comma-separated)
                <input
                  type="text"
                  value={nichesText}
                  onChange={(e) => setNichesText(e.target.value)}
                  placeholder="Example: Beauty, Travel, Pets — blank means all"
                  className={inputClass}
                />
              </label>
              <div className="flex flex-wrap gap-6 mt-5">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={wantBrands}
                    onChange={(e) => setWantBrands(e.target.checked)}
                    className="h-4 w-4 accent-fuchsia-500"
                  />
                  New brands
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={wantPrograms}
                    onChange={(e) => setWantPrograms(e.target.checked)}
                    className="h-4 w-4 accent-fuchsia-500"
                  />
                  New programs
                </label>
              </div>
              {prefs && (
                <p className="text-gray-500 text-xs mt-4">
                  Watching since {formatTimestamp(prefs.last_seen_at)} —
                  marking all as seen moves this date to now.
                </p>
              )}
              {savedNote && (
                <p className="text-emerald-300 text-sm mt-4">{savedNote}</p>
              )}
              <button
                onClick={savePrefs}
                disabled={saving}
                className="mt-6 w-full rounded-xl p-5 font-bold text-black bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:opacity-90 disabled:opacity-40 transition"
              >
                {saving ? "Saving..." : "Save preferences"}
              </button>
            </SectionShell>
          </div>
        )}
      </div>
    </main>
  );
}
