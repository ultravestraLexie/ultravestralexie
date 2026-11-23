"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { computeReceivables, type DealLike } from "@/lib/business/health";

// Get Started — the guided path from a brand-new account to the
// creator's first computed business insight (the owner's
// onboarding directive: registration → first meaningful insight
// in five minutes or less; until now signup landed on a dashboard
// with next-actions but no guided path).
//
// Three short steps, each writing a REAL record through the same
// APIs the trackers use: (1) business basics → the Business
// Profile, (2) a first deal → the Deal Manager, (3) a first post
// → the Posting Tracker. Step state is DERIVED from the records
// themselves (a step is done when its record exists) — there is
// no separate "onboarded" flag that could disagree with the data.
// Every step is skippable. When the steps are done or skipped,
// the page computes the first insight from those records with the
// same receivables math Business Health uses, so the first thing
// a new creator sees is a true statement about their own business.

type Deal = DealLike & { brand_name: string };

type Profile = Record<string, unknown> & {
  creatorName?: string;
  platforms?: string[];
  contentCategories?: string[];
};

const PLATFORM_OPTIONS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook / Meta" },
  { value: "trybe", label: "Trybe" },
  { value: "other", label: "Other" },
];

const STAGE_OPTIONS = [
  { value: "lead", label: "Lead — talking, nothing agreed" },
  { value: "active", label: "Active — agreed, work underway" },
  { value: "delivered", label: "Delivered — content handed over" },
  { value: "invoiced", label: "Invoiced — waiting to be paid" },
  { value: "paid", label: "Paid — money received" },
];

function money(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-[#080b14] px-3 py-2.5 text-white";
const labelClass = "block text-sm text-gray-300";

export default function GetStartedPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  // Step 1 fields
  const [creatorName, setCreatorName] = useState("");
  const [mainPlatform, setMainPlatform] = useState("tiktok");
  const [category, setCategory] = useState("");
  // Step 2 fields
  const [brandName, setBrandName] = useState("");
  const [dealAmount, setDealAmount] = useState("");
  const [dealStage, setDealStage] = useState("active");
  // Step 3 fields
  const [postTitle, setPostTitle] = useState("");
  const [postPlatform, setPostPlatform] = useState("tiktok");
  const [postDate, setPostDate] = useState(todayKey());
  const [postUrl, setPostUrl] = useState("");

  async function load() {
    try {
      const [profileRes, dealsRes, postsRes] = await Promise.all([
        fetch("/api/business-profile"),
        fetch("/api/deals"),
        fetch("/api/posts"),
      ]);
      if (profileRes.ok) {
        const d = await profileRes.json();
        setProfile((d.profile ?? null) as Profile | null);
        if (d.profile?.creatorName) setCreatorName(d.profile.creatorName);
        if (d.profile?.platforms?.[0]) setMainPlatform(d.profile.platforms[0]);
        if (d.profile?.contentCategories?.[0])
          setCategory(d.profile.contentCategories[0]);
      }
      if (dealsRes.ok) {
        const d = await dealsRes.json();
        setDeals((d.deals ?? []) as Deal[]);
      }
      if (postsRes.ok) {
        const d = await postsRes.json();
        setPostCount(((d.posts ?? []) as unknown[]).length);
      }
    } catch {
      setError("Your information could not be loaded. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stepDone = useMemo(
    () => [
      Boolean(
        profile &&
          ((profile.creatorName ?? "").trim() !== "" ||
            (profile.platforms ?? []).length > 0)
      ),
      deals.length > 0,
      postCount > 0,
    ],
    [profile, deals, postCount]
  );

  const currentStep = [0, 1, 2].find(
    (i) => !stepDone[i] && !skipped.has(i)
  );
  const finished = currentStep === undefined;

  const receivables = useMemo(
    () => computeReceivables(deals, new Date()),
    [deals]
  );

  function skip(step: number) {
    setSkipped((prev) => new Set(prev).add(step));
  }

  async function saveBasics() {
    if (!creatorName.trim() && !category.trim()) {
      setError("Add your creator name or what you make content about.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const base: Profile = profile ?? {
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
      const merged = {
        ...base,
        creatorName: creatorName.trim(),
        platforms: [mainPlatform],
        contentCategories: category.trim() ? [category.trim()] : [],
      };
      const res = await fetch("/api/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Your basics could not be saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your basics could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDeal() {
    const amount = Number(dealAmount);
    if (!brandName.trim()) {
      setError("Add the brand name.");
      return;
    }
    if (dealAmount.trim() !== "" && (!Number.isFinite(amount) || amount < 0)) {
      setError("Amount must be zero or above.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          platform: mainPlatform,
          stage: dealStage,
          compensationCents:
            dealAmount.trim() === "" ? null : Math.round(amount * 100),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Your deal could not be saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your deal could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function savePost() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: postPlatform,
          postedDate: postDate,
          title: postTitle.trim(),
          externalUrl: postUrl.trim(),
          viewsCount: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Your post could not be saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your post could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  const stepShell = (step: number, title: string, intro: string) => (
    <div className="text-xs tracking-[.3em] text-cyan-400 mb-2">
      STEP {step + 1} OF 3
    </div>
  );

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-4">
          ULTRA VESTRA / GET STARTED
        </div>
        <h1 className="text-3xl font-black">
          Your first business insight, in three short steps
        </h1>
        <p className="text-gray-400 mt-2">
          Each step saves a real record — the same ones your trackers
          use. Skip anything you like; you can add it later.
        </p>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-red-200 text-sm">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-gray-400 mt-8">Loading…</p>
        ) : finished ? (
          <section className="mt-8 rounded-2xl border border-cyan-300/25 bg-cyan-400/[.06] p-6">
            <div className="text-xs tracking-[.3em] text-cyan-300 mb-2">
              YOUR FIRST INSIGHT — FROM YOUR OWN RECORDS
            </div>
            {deals.length === 0 && postCount === 0 ? (
              <p className="text-lg">
                Nothing recorded yet — that is the honest starting
                line. The moment you log a deal or a post, this page
                and your dashboard start answering real questions:
                who owes you money, what you kept, and which content
                became money.
              </p>
            ) : (
              <div className="space-y-3 text-lg">
                {deals.length > 0 && (
                  <p>
                    You have{" "}
                    <strong>{money(receivables.contractedCents)}</strong>{" "}
                    contracted across {deals.length} deal
                    {deals.length === 1 ? "" : "s"}
                    {receivables.collectedCents > 0
                      ? `, with ${money(receivables.collectedCents)} collected so far`
                      : ""}
                    {receivables.outstandingCents > 0
                      ? ` and ${money(receivables.outstandingCents)} still outstanding — that is the money to watch.`
                      : "."}
                  </p>
                )}
                {postCount > 0 && deals.length > 0 && (
                  <p>
                    You have {postCount} post{postCount === 1 ? "" : "s"}{" "}
                    logged. Link a post to a deal&apos;s deliverable in
                    the Deal Manager and your attribution chain starts:
                    content → deal → invoice → collected money, all
                    traceable.
                  </p>
                )}
                {postCount > 0 && deals.length === 0 && (
                  <p>
                    You have {postCount} post{postCount === 1 ? "" : "s"}{" "}
                    logged. Add your first brand deal and UltraVestra
                    can start connecting your content to money.
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/dashboard"
                className="rounded-xl bg-cyan-400 px-5 py-2.5 font-bold text-black hover:bg-cyan-300 transition"
              >
                Go to your dashboard →
              </Link>
              <Link
                href="/growth-center/deals"
                className="rounded-xl border border-white/20 px-5 py-2.5 text-gray-100 hover:bg-white/10 transition"
              >
                Open the Deal Manager
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.03] p-6">
            {currentStep === 0 && (
              <>
                {stepShell(0, "Your business basics", "")}
                <h2 className="text-xl font-bold">Your business basics</h2>
                <p className="text-gray-400 text-sm mt-1">
                  What brands and your Advisor will know you by.
                </p>
                <div className="space-y-4 mt-5">
                  <label className={labelClass}>
                    Creator / business name
                    <input
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Lexie Creates"
                    />
                  </label>
                  <label className={labelClass}>
                    Main platform
                    <select
                      value={mainPlatform}
                      onChange={(e) => setMainPlatform(e.target.value)}
                      className={inputClass}
                    >
                      {PLATFORM_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    What do you make content about?
                    <input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Beauty, Skincare"
                    />
                  </label>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={saveBasics}
                    disabled={busy}
                    className="rounded-xl bg-cyan-400 px-5 py-2.5 font-bold text-black hover:bg-cyan-300 disabled:opacity-40 transition"
                  >
                    {busy ? "Saving…" : "Save and continue"}
                  </button>
                  <button
                    onClick={() => skip(0)}
                    disabled={busy}
                    className="rounded-xl border border-white/20 px-5 py-2.5 text-gray-200 hover:bg-white/10 disabled:opacity-40 transition"
                  >
                    Skip for now
                  </button>
                </div>
              </>
            )}

            {currentStep === 1 && (
              <>
                {stepShell(1, "Your first deal", "")}
                <h2 className="text-xl font-bold">Your first deal</h2>
                <p className="text-gray-400 text-sm mt-1">
                  A brand you are working with — or about to. This is
                  where your money tracking starts.
                </p>
                <div className="space-y-4 mt-5">
                  <label className={labelClass}>
                    Brand name
                    <input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Glow Co"
                    />
                  </label>
                  <label className={labelClass}>
                    Amount (USD)
                    <input
                      type="number"
                      min={0}
                      value={dealAmount}
                      onChange={(e) => setDealAmount(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 500"
                    />
                  </label>
                  <label className={labelClass}>
                    Where does it stand?
                    <select
                      value={dealStage}
                      onChange={(e) => setDealStage(e.target.value)}
                      className={inputClass}
                    >
                      {STAGE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={saveDeal}
                    disabled={busy}
                    className="rounded-xl bg-cyan-400 px-5 py-2.5 font-bold text-black hover:bg-cyan-300 disabled:opacity-40 transition"
                  >
                    {busy ? "Saving…" : "Save and continue"}
                  </button>
                  <button
                    onClick={() => skip(1)}
                    disabled={busy}
                    className="rounded-xl border border-white/20 px-5 py-2.5 text-gray-200 hover:bg-white/10 disabled:opacity-40 transition"
                  >
                    Skip for now
                  </button>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                {stepShell(2, "Your first post", "")}
                <h2 className="text-xl font-bold">Your first post</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Log a post you have published. Later you can link it
                  to a deal&apos;s deliverable — that link is how
                  content becomes traceable money.
                </p>
                <div className="space-y-4 mt-5">
                  <label className={labelClass}>
                    Post title
                    <input
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. My morning routine review"
                    />
                  </label>
                  <label className={labelClass}>
                    Platform
                    <select
                      value={postPlatform}
                      onChange={(e) => setPostPlatform(e.target.value)}
                      className={inputClass}
                    >
                      {PLATFORM_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Date posted
                    <input
                      type="date"
                      value={postDate}
                      onChange={(e) => setPostDate(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    Post URL (optional)
                    <input
                      value={postUrl}
                      onChange={(e) => setPostUrl(e.target.value)}
                      className={inputClass}
                      placeholder="https://…"
                    />
                  </label>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={savePost}
                    disabled={busy}
                    className="rounded-xl bg-cyan-400 px-5 py-2.5 font-bold text-black hover:bg-cyan-300 disabled:opacity-40 transition"
                  >
                    {busy ? "Saving…" : "Save and see my insight"}
                  </button>
                  <button
                    onClick={() => skip(2)}
                    disabled={busy}
                    className="rounded-xl border border-white/20 px-5 py-2.5 text-gray-200 hover:bg-white/10 disabled:opacity-40 transition"
                  >
                    Skip for now
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {!loading && !finished && (
          <div className="flex gap-2 mt-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  stepDone[i]
                    ? "bg-cyan-300"
                    : i === currentStep
                      ? "bg-cyan-300/50"
                      : "bg-white/10"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
