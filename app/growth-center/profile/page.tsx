"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Creator Business Profile — the creator's own business facts,
// entered once and read across the platform: Campaign Match
// prefills its form from this profile, and the Advisor counts its
// completeness.
//
// HONESTY RULE (binding): every number here is typed in by the
// creator. Nothing is synced from any platform, and the page says
// so — these are the creator's own stated figures, never
// platform-verified metrics.

type Profile = {
  platforms: string[];
  contentCategories: string[];
  audienceSize: number | null;
  averageViews: number | null;
  engagementRate: number | null;
  audienceDemographics: string;
  pastPartnerships: string;
  revenueStreams: string[];
  businessObjectives: string;
};

const PLATFORM_OPTIONS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X (Twitter)" },
  { value: "twitch", label: "Twitch" },
];

const REVENUE_OPTIONS = [
  "Brand deals",
  "Affiliate commissions",
  "Ad revenue",
  "Digital products",
  "Coaching / consulting",
  "Live gifts / tips",
];

const EMPTY: Profile = {
  platforms: [],
  contentCategories: [],
  audienceSize: null,
  averageViews: null,
  engagementRate: null,
  audienceDemographics: "",
  pastPartnerships: "",
  revenueStreams: [],
  businessObjectives: "",
};

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2.5 text-[15px] text-white placeholder:text-gray-500 outline-none focus:border-cyan-400/60";
const labelCls = "block text-sm font-semibold text-gray-200";
const hintCls = "mt-1 text-[13px] text-gray-400";

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [categoriesText, setCategoriesText] = useState("");
  const [completeness, setCompleteness] = useState({ filled: 0, total: 9 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/business-profile");
        const data = await res.json();
        if (res.ok && data.profile) {
          setProfile(data.profile as Profile);
          setCategoriesText(
            ((data.profile as Profile).contentCategories ?? []).join(", ")
          );
        }
        if (res.ok && data.completeness) setCompleteness(data.completeness);
      } catch {
        setError("Your business profile could not be loaded. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    const payload: Profile = {
      ...profile,
      contentCategories: categoriesText
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== ""),
    };
    try {
      const res = await fetch("/api/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Your business profile could not be saved.");
        return;
      }
      setProfile(data.profile as Profile);
      if (data.completeness) setCompleteness(data.completeness);
      setMessage("Saved. Campaign Match and your Advisor now read this profile.");
    } catch {
      setError("Your business profile could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const pct = Math.round((completeness.filled / completeness.total) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/growth-center" className="text-sm text-fuchsia-300 font-bold">
        ← Growth Center
      </Link>
      <h1 className="text-3xl md:text-4xl font-black mt-3">
        Creator Business Profile
      </h1>
      <p className="text-gray-400 mt-2">
        Your business, in one profile. Enter it once — Campaign Match
        prefills from it, and your Advisor reads it, so matches and
        advice fit <em>your</em> audience and goals instead of giving
        every creator the same answers.
      </p>
      <p className="text-gray-500 text-sm mt-2">
        These figures are the ones you type in. Nothing is synced from
        any platform, and nothing here is shown to brands or other
        creators.
      </p>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 mt-6">
        <div className="flex items-center justify-between gap-3">
          <strong>Profile completeness</strong>
          <span className="text-cyan-300 font-bold">
            {completeness.filled} of {completeness.total} fields · {pct}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-white/[.06] overflow-hidden mt-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      {loading ? (
        <p className="text-gray-400 mt-8">Loading your profile…</p>
      ) : (
        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8 mt-6 space-y-6">
          <div>
            <span className={labelCls}>Platforms you create on</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {PLATFORM_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() =>
                    setProfile((p) => ({ ...p, platforms: toggle(p.platforms, o.value) }))
                  }
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                    profile.platforms.includes(o.value)
                      ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                      : "border-white/15 bg-white/[.03] text-gray-300"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Content categories
              <input
                className={inputCls}
                value={categoriesText}
                onChange={(e) => setCategoriesText(e.target.value)}
                placeholder="Example: beauty, skincare, product reviews"
              />
            </label>
            <p className={hintCls}>Separate categories with commas.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>
                Audience size (followers)
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  value={profile.audienceSize ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, audienceSize: numOrNull(e.target.value) }))
                  }
                  placeholder="Example: 25000"
                />
              </label>
            </div>
            <div>
              <label className={labelCls}>
                Average views per video
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  value={profile.averageViews ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, averageViews: numOrNull(e.target.value) }))
                  }
                  placeholder="Example: 8000"
                />
              </label>
            </div>
            <div>
              <label className={labelCls}>
                Engagement rate (%)
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={profile.engagementRate ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, engagementRate: numOrNull(e.target.value) }))
                  }
                  placeholder="Example: 4.5"
                />
              </label>
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Who is your audience?
              <textarea
                className={inputCls}
                rows={3}
                value={profile.audienceDemographics}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, audienceDemographics: e.target.value }))
                }
                placeholder="Example: Mostly women 25–34 in the US who buy mid-range skincare."
              />
            </label>
          </div>

          <div>
            <label className={labelCls}>
              Previous brand partnerships
              <textarea
                className={inputCls}
                rows={3}
                value={profile.pastPartnerships}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, pastPartnerships: e.target.value }))
                }
                placeholder="Example: Two paid TikTok videos for a skincare brand in 2025; one affiliate series for a supplement brand."
              />
            </label>
          </div>

          <div>
            <span className={labelCls}>Revenue streams</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {REVENUE_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() =>
                    setProfile((p) => ({ ...p, revenueStreams: toggle(p.revenueStreams, o) }))
                  }
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                    profile.revenueStreams.includes(o)
                      ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                      : "border-white/15 bg-white/[.03] text-gray-300"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Your business objectives
              <textarea
                className={inputCls}
                rows={3}
                value={profile.businessObjectives}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, businessObjectives: e.target.value }))
                }
                placeholder="Example: Reach 100K followers and two paid brand deals a month by next summer."
              />
            </label>
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}
          {message && <p className="text-emerald-300 text-sm">{message}</p>}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save business profile"}
          </button>
        </section>
      )}
    </div>
  );
}
