"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Creator Business Profile v2 (Build 8 — the owner's 10-point
// profile spec): not a questionnaire — the setup of an intelligent
// business assistant. Short intro, numbered fields that each say
// WHY the answer matters, a creator identity layer, business
// goals, autosave with a clear saved indicator, a live preview of
// how UltraVestra understands the business, and an honest map of
// where the profile actually flows today.
//
// HONESTY RULE (binding): every value here is typed in by the
// creator. Nothing is synced from any platform, nothing is shown
// to brands, and the page says so — these are the creator's own
// stated facts, never platform-verified metrics.

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
  creatorName: string;
  businessDescription: string;
  uniqueSellingProposition: string;
  differentiator: string;
  professionalExperience: string;
  businessGoals: string[];
};

const PLATFORM_OPTIONS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X (Twitter)" },
  { value: "twitch", label: "Twitch" },
];

const CATEGORY_CHIPS = [
  "Beauty",
  "Technology",
  "Finance",
  "Lifestyle",
  "Education",
  "Fitness",
];

// The owner's monetization taxonomy (Build 8 spec, item 4).
const REVENUE_OPTIONS = [
  "Affiliate marketing",
  "Sponsorships",
  "Digital products",
  "Physical products",
  "Brand partnerships",
  "Subscriptions",
  "Advertising revenue",
  "Services and consulting",
];

// The owner's business-goals list (Build 8 spec, item 5).
const GOAL_OPTIONS = [
  "Grow my audience",
  "Increase revenue",
  "Find brand partnerships",
  "Launch a product",
  "Build a personal brand",
  "Improve content performance",
  "Build a sustainable creator business",
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
  creatorName: "",
  businessDescription: "",
  uniqueSellingProposition: "",
  differentiator: "",
  professionalExperience: "",
  businessGoals: [],
};

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2.5 text-[15px] text-white placeholder:text-gray-500 outline-none focus:border-cyan-400/60 mt-2";
const labelCls = "block text-[15px] font-semibold text-gray-100";
const whyCls = "mt-1 text-[13px] leading-5 text-gray-400";
const findCls = "mt-1 text-[13px] leading-5 text-cyan-300/70";

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

function splitCategories(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

/** Display band for a count — the same bands Campaign Match uses. */
function bandFor(n: number | null): string | null {
  if (n === null) return null;
  if (n < 1000) return "<1k";
  if (n < 10000) return "1-10k";
  if (n < 50000) return "10-50k";
  if (n < 250000) return "50-250k";
  if (n < 1000000) return "250k-1M";
  return ">1M";
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

type SaveState = "saved" | "unsaved" | "saving" | "error";

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [categoriesText, setCategoriesText] = useState("");
  const [completeness, setCompleteness] = useState({ filled: 0, total: 10 });
  const [identity, setIdentity] = useState({ filled: 0, total: 5 });
  const [intelligence, setIntelligence] = useState<
    { label: string; line: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const loadedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/business-profile");
        const data = await res.json();
        if (res.ok && data.profile) {
          const p = { ...EMPTY, ...(data.profile as Profile) };
          setProfile(p);
          setCategoriesText((p.contentCategories ?? []).join(", "));
        }
        if (res.ok && data.completeness) setCompleteness(data.completeness);
        if (res.ok && data.identity) setIdentity(data.identity);
        if (res.ok && data.intelligence) setIntelligence(data.intelligence);
      } catch {
        setError("Your business profile could not be loaded. Please try again.");
      } finally {
        loadedRef.current = true;
        setLoading(false);
      }
    })();
  }, []);

  function validate(p: Profile): string {
    if (p.engagementRate !== null && (p.engagementRate < 0 || p.engagementRate > 100)) {
      return "Engagement rate must be between 0 and 100.";
    }
    if (p.audienceSize !== null && p.audienceSize < 0) {
      return "Audience size cannot be negative.";
    }
    if (p.averageViews !== null && p.averageViews < 0) {
      return "Average views cannot be negative.";
    }
    return "";
  }

  async function doSave(current: Profile, catsText: string) {
    const payload: Profile = {
      ...current,
      contentCategories: splitCategories(catsText),
    };
    const problem = validate(payload);
    if (problem) {
      setFieldError(problem);
      setSaveState("error");
      return;
    }
    setFieldError("");
    setSaveState("saving");
    try {
      const res = await fetch("/api/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFieldError(data.error ?? "Your business profile could not be saved.");
        setSaveState("error");
        return;
      }
      if (data.completeness) setCompleteness(data.completeness);
      if (data.identity) setIdentity(data.identity);
      setSaveState("saved");
    } catch {
      setFieldError("Your business profile could not be saved. Please try again.");
      setSaveState("error");
    }
  }

  // Autosave: any change after the initial load schedules a save.
  useEffect(() => {
    if (!loadedRef.current || loading) return;
    setSaveState((s) => (s === "saving" ? s : "unsaved"));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void doSave(profile, categoriesText);
    }, 900);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, categoriesText]);

  const pct = Math.round((completeness.filled / completeness.total) * 100);

  // Per-section status (same counting rules as the server).
  const sections = [
    {
      name: "Where you create",
      filled:
        (profile.platforms.length > 0 ? 1 : 0) +
        (splitCategories(categoriesText).length > 0 ? 1 : 0),
      total: 2,
      benefit: "Campaign Match searches only your platforms and categories.",
    },
    {
      name: "Your audience",
      filled:
        (profile.audienceSize !== null ? 1 : 0) +
        (profile.averageViews !== null ? 1 : 0) +
        (profile.engagementRate !== null ? 1 : 0) +
        (profile.audienceDemographics.trim() !== "" ? 1 : 0),
      total: 4,
      benefit: "Your Advisor judges every recommendation against your real audience.",
    },
    {
      name: "Your creator identity",
      filled: identity.filled,
      total: identity.total,
      benefit: "How UltraVestra tells your business apart from every other creator.",
      recommended: true,
    },
    {
      name: "How you make money",
      filled: profile.revenueStreams.length > 0 ? 1 : 0,
      total: 1,
      benefit: "Monetization advice follows how you actually earn.",
    },
    {
      name: "Where you're going",
      filled:
        (profile.businessGoals.length > 0 ? 1 : 0) +
        (profile.pastPartnerships.trim() !== "" ? 1 : 0) +
        (profile.businessObjectives.trim() !== "" ? 1 : 0),
      total: 3,
      benefit: "Recommendations point at what you're trying to build.",
    },
  ];

  const platformLabel = (v: string) =>
    PLATFORM_OPTIONS.find((o) => o.value === v)?.label ?? v;

  const audienceBand = bandFor(profile.audienceSize);
  const viewsBand = bandFor(profile.averageViews);
  const matchParts = [
    splitCategories(categoriesText).slice(0, 3).join(", "),
    profile.platforms.length > 0 ? platformLabel(profile.platforms[0]) : "",
    audienceBand ? `${audienceBand} followers` : "",
    viewsBand ? `${viewsBand} views` : "",
  ].filter((s) => s !== "");

  const cats = splitCategories(categoriesText);
  const identityTitle =
    cats.length >= 2
      ? `${titleCase(cats[0])} & ${titleCase(cats[1])} Creator`
      : cats.length === 1
        ? `${titleCase(cats[0])} Creator`
        : "Creator";
  const businessFocus =
    profile.businessDescription.trim() ||
    profile.uniqueSellingProposition.trim() ||
    "";
  const primaryObjective =
    profile.businessGoals[0] || profile.businessObjectives.trim() || "";

  const chipCls = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
      active
        ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
        : "border-white/15 bg-white/[.03] text-gray-300"
    }`;

  const fieldHead = (num: string, label: string) => (
    <span className={labelCls}>
      <span className="text-cyan-300/80 font-bold mr-2">{num}</span>
      {label}
    </span>
  );

  const storedRevenueExtras = profile.revenueStreams.filter(
    (v) => !REVENUE_OPTIONS.includes(v)
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/growth-center" className="text-sm text-fuchsia-300 font-bold">
        ← Growth Center
      </Link>
      <div className="text-[11px] tracking-[.3em] text-cyan-300/70 mt-4">
        CREATOR BUSINESS PROFILE
      </div>
      <h1 className="text-3xl md:text-4xl font-black mt-2 leading-tight">
        Your Creator Business. One Profile.
      </h1>
      <p className="text-gray-400 mt-3 leading-6">
        Tell UltraVestra about your platforms, audience, content, and
        goals. We&rsquo;ll use this information to personalize your
        recommendations, campaign matches, and business insights.
      </p>
      <p className="text-gray-500 text-sm mt-2">
        These figures are the ones you type in. Nothing is synced from
        any platform, and nothing here is shown to brands or other
        creators.
      </p>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 mt-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
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
        <div className="mt-3 text-sm">
          {saveState === "saving" && <span className="text-gray-300">Saving…</span>}
          {saveState === "unsaved" && (
            <span className="text-gray-400">Unsaved changes — autosave is on.</span>
          )}
          {saveState === "saved" && (
            <span className="text-emerald-300">✓ All changes saved automatically.</span>
          )}
          {saveState === "error" && (
            <span className="text-red-300">
              Couldn&rsquo;t save.{" "}
              <button
                type="button"
                className="underline font-semibold"
                onClick={() => void doSave(profile, categoriesText)}
              >
                Tap to retry
              </button>
            </span>
          )}
        </div>
        {fieldError && <p className="text-red-300 text-sm mt-2">{fieldError}</p>}

        <div className="mt-5 space-y-2.5">
          {sections.map((s) => (
            <div key={s.name} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <span className="text-gray-200 font-semibold">{s.name}</span>
                {s.recommended && (
                  <span className="ml-2 text-[11px] font-bold tracking-widest text-fuchsia-300/80">
                    RECOMMENDED
                  </span>
                )}
                <div className="text-gray-500 text-[13px]">{s.benefit}</div>
              </div>
              <span
                className={
                  s.filled >= s.total
                    ? "text-emerald-300 font-semibold shrink-0"
                    : "text-gray-400 shrink-0"
                }
              >
                {s.filled >= s.total ? "✓ Complete" : `${s.total - s.filled} missing`}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[13px] text-gray-400 mt-5 leading-5">
          {matchParts.length > 0 ? (
            <>
              With this profile, Campaign Match searches:{" "}
              <span className="text-gray-200">{matchParts.join(" · ")}</span>
            </>
          ) : (
            "Start with your platforms and categories — Campaign Match searches from those first."
          )}
        </p>
      </section>

      {error && <p className="text-red-300 text-sm mt-4">{error}</p>}

      {loading ? (
        <p className="text-gray-400 mt-8">Loading your profile…</p>
      ) : (
        <>
          <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8 mt-6 space-y-7">
            <h2 className="text-lg font-bold">Where you create</h2>

            <div>
              {fieldHead("01", "Where do you create content?")}
              <p className={whyCls}>
                Why: Campaign Match only searches brands that work with
                creators on your platforms. Select every platform you
                actively use.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {PLATFORM_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() =>
                      setProfile((p) => ({ ...p, platforms: toggle(p.platforms, o.value) }))
                    }
                    className={chipCls(profile.platforms.includes(o.value))}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {fieldHead("02", "What type of content do you create?")}
              <p className={whyCls}>
                Why: your categories decide which brands and
                opportunities you see first. Tap your main ones, or
                type your own.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {CATEGORY_CHIPS.map((c) => {
                  const active = splitCategories(categoriesText).some(
                    (x) => x.toLowerCase() === c.toLowerCase()
                  );
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        const current = splitCategories(categoriesText);
                        const next = active
                          ? current.filter((x) => x.toLowerCase() !== c.toLowerCase())
                          : [...current, c.toLowerCase()];
                        setCategoriesText(next.join(", "));
                      }}
                      className={chipCls(active)}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <input
                className={inputCls}
                value={categoriesText}
                onChange={(e) => setCategoriesText(e.target.value)}
                placeholder="Example: beauty, skincare, product reviews"
              />
              <p className={whyCls}>Separate categories with commas.</p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8 mt-6 space-y-7">
            <h2 className="text-lg font-bold">Your audience</h2>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                {fieldHead("03", "Audience size")}
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
                <p className={whyCls}>
                  Why: brands set follower minimums — this puts you in
                  the right band.
                </p>
                <p className={findCls}>Find it: your profile page shows your follower count.</p>
              </div>
              <div>
                {fieldHead("04", "Average views")}
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
                <p className={whyCls}>
                  Why: views, not followers, are what most brands price
                  on.
                </p>
                <p className={findCls}>Find it: TikTok Studio → Analytics shows average video views.</p>
              </div>
              <div>
                {fieldHead("05", "Engagement rate (%)")}
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
                <p className={whyCls}>
                  Why: a small audience that engages beats a big silent
                  one — this proves yours talks back.
                </p>
                <p className={findCls}>Find it: (likes + comments + shares) ÷ views × 100.</p>
              </div>
            </div>

            <div>
              {fieldHead("06", "Who is your audience?")}
              <p className={whyCls}>
                Why: &ldquo;women 25–34 who buy mid-range skincare&rdquo;
                matches you to different brands than &ldquo;everyone&rdquo;.
                Describe the people you serve.
              </p>
              <textarea
                className={inputCls}
                rows={3}
                value={profile.audienceDemographics}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, audienceDemographics: e.target.value }))
                }
                placeholder="Example: Mostly women 25–34 in the US who buy mid-range skincare."
              />
            </div>
          </section>

          <section className="rounded-3xl border border-fuchsia-400/20 bg-[#111827] p-6 md:p-8 mt-6 space-y-7">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">Your creator identity</h2>
              <span className="text-[11px] font-bold tracking-widest text-fuchsia-300/80">
                RECOMMENDED
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-6 -mt-3">
              This is how UltraVestra tells your business apart from
              every other creator in your niche.
            </p>

            <div>
              {fieldHead("07", "Creator name or business name")}
              <input
                className={inputCls}
                value={profile.creatorName}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, creatorName: e.target.value }))
                }
                placeholder="Example: Glow With Ana"
              />
              <p className={whyCls}>
                Why: your business identity — used across your Growth
                Center and your proposals.
              </p>
            </div>

            <div>
              {fieldHead("08", "Short business description")}
              <textarea
                className={inputCls}
                rows={2}
                value={profile.businessDescription}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, businessDescription: e.target.value }))
                }
                placeholder="Example: I review mid-range skincare for women 25–34 and only recommend what I finish using."
              />
              <p className={whyCls}>
                Why: one or two sentences UltraVestra uses to state
                what your business is.
              </p>
            </div>

            <div>
              {fieldHead("09", "Your unique selling proposition")}
              <textarea
                className={inputCls}
                rows={2}
                value={profile.uniqueSellingProposition}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, uniqueSellingProposition: e.target.value }))
                }
                placeholder="Example: Every product is tested for 30 days before I say a word about it."
              />
              <p className={whyCls}>
                Why: the promise only you make — your Advisor weighs
                opportunities against it.
              </p>
            </div>

            <div>
              {fieldHead("10", "What makes your content different?")}
              <textarea
                className={inputCls}
                rows={2}
                value={profile.differentiator}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, differentiator: e.target.value }))
                }
                placeholder="Example: I show the receipt — price paid, days used, and the empty bottle."
              />
              <p className={whyCls}>
                Why: this is the difference between you and every
                other creator in your niche.
              </p>
            </div>

            <div>
              {fieldHead("11", "Your professional experience")}
              <textarea
                className={inputCls}
                rows={2}
                value={profile.professionalExperience}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, professionalExperience: e.target.value }))
                }
                placeholder="Example: Licensed esthetician for 6 years before creating content."
              />
              <p className={whyCls}>
                Why: real experience is proof brands trust — and your
                advice should build on it.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8 mt-6 space-y-7">
            <h2 className="text-lg font-bold">How you make money</h2>

            <div>
              {fieldHead("12", "How do you currently make money?")}
              <p className={whyCls}>
                Why: monetization advice follows how you actually
                earn. Select every stream you have today.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {REVENUE_OPTIONS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() =>
                      setProfile((p) => ({ ...p, revenueStreams: toggle(p.revenueStreams, o) }))
                    }
                    className={chipCls(profile.revenueStreams.includes(o))}
                  >
                    {o}
                  </button>
                ))}
                {storedRevenueExtras.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() =>
                      setProfile((p) => ({ ...p, revenueStreams: toggle(p.revenueStreams, o) }))
                    }
                    className={chipCls(true)}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8 mt-6 space-y-7">
            <h2 className="text-lg font-bold">Where you&rsquo;re going</h2>

            <div>
              {fieldHead("13", "Your business goals")}
              <p className={whyCls}>
                Why: your Advisor ranks its advice against what
                you&rsquo;re trying to accomplish.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {GOAL_OPTIONS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() =>
                      setProfile((p) => ({ ...p, businessGoals: toggle(p.businessGoals, o) }))
                    }
                    className={chipCls(profile.businessGoals.includes(o))}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {fieldHead("14", "Previous brand partnerships")}
              <textarea
                className={inputCls}
                rows={3}
                value={profile.pastPartnerships}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, pastPartnerships: e.target.value }))
                }
                placeholder="Example: Two paid TikTok videos for a skincare brand in 2025; one affiliate series for a supplement brand."
              />
              <p className={whyCls}>
                Why: proof of work — brands you&rsquo;ve already served
                shape which matches are realistic.
              </p>
            </div>

            <div>
              {fieldHead("15", "Your business objectives")}
              <textarea
                className={inputCls}
                rows={3}
                value={profile.businessObjectives}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, businessObjectives: e.target.value }))
                }
                placeholder="Example: Reach 100K followers and two paid brand deals a month by next summer."
              />
              <p className={whyCls}>
                Why: anything else about where this business is going,
                in your words. Your Advisor reads this.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[.04] p-6 md:p-8 mt-6">
            <div className="text-cyan-300/80 text-xs tracking-widest mb-3">
              YOUR CREATOR IDENTITY — PREVIEW
            </div>
            <div className="text-2xl font-black">
              {profile.creatorName.trim() || "Your creator business"}
            </div>
            <div className="text-lg text-gray-300 font-semibold mt-1">
              {identityTitle}
            </div>
            {profile.platforms.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.platforms.map((v) => (
                  <span
                    key={v}
                    className="rounded-full border border-white/15 bg-white/[.04] px-3 py-1 text-[13px] font-semibold text-gray-200"
                  >
                    {platformLabel(v)}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-5 space-y-3 text-sm leading-6">
              <p>
                <span className="text-gray-500 tracking-widest text-xs block">
                  BUSINESS FOCUS
                </span>
                {businessFocus ||
                  "Add a short business description above and UltraVestra will state your focus here."}
              </p>
              <p>
                <span className="text-gray-500 tracking-widest text-xs block">
                  PRIMARY OBJECTIVE
                </span>
                {primaryObjective ||
                  "Pick a business goal above and it becomes the objective your advice is ranked against."}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-5">
              How UltraVestra understands your business — built only
              from what you entered above. Nothing here is shown to
              brands or other creators.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8 mt-6">
            <div className="text-gray-300 text-xs tracking-widest mb-4">
              WHERE THIS PROFILE WORKS — LIVE NOW
            </div>
            <div className="space-y-3 text-sm leading-6">
              <p>
                <strong className="text-gray-100">Campaign Match</strong>{" "}
                — your niches, platform, audience and views bands
                prefill every search.
              </p>
              <p>
                <strong className="text-gray-100">Creator Advisor</strong>{" "}
                — the rules and your AI brief read this profile, so
                advice fits your audience, your identity, and your
                goals.
              </p>
              <p>
                <strong className="text-gray-100">Dashboard</strong> —
                your next actions count profile completeness until
                it&rsquo;s done.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8 mt-6">
            <div className="text-gray-300 text-xs tracking-widest mb-4">
              ULTRAVESTRA INTELLIGENCE — FROM YOUR SAVED PROFILE
            </div>
            {intelligence.length ? (
              <div className="space-y-4">
                {intelligence.map((e) => (
                  <div key={e.label}>
                    <div className="text-[11px] tracking-widest text-violet-300">
                      {e.label}
                    </div>
                    <p className="text-sm leading-6 text-gray-300 mt-1">
                      {e.line}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-gray-300">
                Complete your profile above and this panel shows how it
                is working for you — your matching band, your lead
                monetization, your goal focus, and whether your numbers
                are still fresh. Nothing here is invented: every line is
                computed from your own saved profile.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
