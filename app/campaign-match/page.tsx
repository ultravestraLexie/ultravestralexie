"use client";

import { useRef, useState } from "react";
import type { Brief } from "@/lib/campaign-match/engine";

// Campaign Match Engine — Brand Brain Phase 2 (spec "phase2-v1").
//
// Answers the anchor question: "Of the brands I could work with,
// which partnership gives me the best realistic opportunity, and
// what should I know before committing?"
//
// The Index on every brief is a RELATIVE DECISION INDEX — not a
// validated earnings predictor — and the page says so on its face,
// above the form and on every brief card. All scoring happens in
// the deterministic engine via /api/campaign-match; briefs are
// stored server-side before they are shown (evidence before
// verdict). This page holds no direct database access; brand and
// category type-ahead reuses the existing gated /api/suggest route.

const BANDS = ["<1k", "1-10k", "10-50k", "50-250k", "250k-1M", ">1M"];

type SuggestionBrand = { id: string; name: string };
type SuggestionCategory = { slug: string; name: string };

const VERDICT_STYLES: Record<string, string> = {
  Pursue: "border-emerald-400/40 text-emerald-300",
  "Negotiate First": "border-amber-400/40 text-amber-300",
  Skip: "border-red-400/40 text-red-300",
};

const CONFIDENCE_STYLES: Record<string, string> = {
  High: "border-emerald-400/40 text-emerald-300",
  Medium: "border-amber-400/40 text-amber-300",
  Low: "border-red-400/40 text-red-300",
};

const FLOOR_NAMES: Record<string, string> = {
  a: "Rate recorded and not conflicted",
  b: "Earnings cap classification known",
  c: "A direct source supports the specific rate and cap relied upon",
};

const FRESHNESS_LABELS: Record<string, string> = {
  verified_fresh: "Terms verified within the last 90 days",
  verified_stale: "Terms verified, but more than 90 days ago — stale",
  unverified:
    "Term verification unknown — the record carries fetch dates only, so the 90-day clock has not started",
};

function Pill({
  text,
  style,
}: {
  text: string;
  style: string;
}) {
  return (
    <span
      className={`text-[11px] tracking-widest border rounded-full px-3 py-1 ${style}`}
    >
      {text.toUpperCase()}
    </span>
  );
}

function FactorBar({
  label,
  weight,
  score,
}: {
  label: string;
  weight: string;
  score: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-300">
          {label} <span className="text-gray-500">({weight})</span>
        </span>
        <span className="font-bold text-gray-100">{score.toFixed(1)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/[.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "unknown";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "unknown"
    : d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function BriefCard({ brief, rank }: { brief: Brief; rank: number }) {
  const s = brief.earnings.realisticScenario;
  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-cyan-400 text-xs tracking-widest mb-2">
            {rank === 0 ? "TOP MATCH" : `MATCH #${rank + 1}`}
          </div>
          <h2 className="text-3xl font-bold">{brief.brandName}</h2>
          <div className="flex flex-wrap gap-2 mt-3">
            <Pill
              text={brief.verdict}
              style={VERDICT_STYLES[brief.verdict] ?? ""}
            />
            <Pill
              text={`Confidence: ${brief.confidence}`}
              style={CONFIDENCE_STYLES[brief.confidence] ?? ""}
            />
            {brief.staleWarning && (
              <Pill
                text="Stale terms warning"
                style="border-amber-400/40 text-amber-300"
              />
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
            {brief.index}
          </div>
          <div className="text-gray-500 text-xs tracking-widest mt-1">
            INDEX / 100
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-6">
        The Index is a relative decision index for comparing these
        partnerships — not a validated earnings predictor. Band:{" "}
        {brief.band}
        {brief.floor.pass
          ? "."
          : `, capped by the reliability floor at ${brief.verdict === "Skip" ? "the band's own verdict" : "Negotiate First"}.`}
      </p>

      <div className="grid gap-4 mb-8">
        <FactorBar label="Economic terms" weight="35%" score={brief.factors.economic} />
        <FactorBar label="Evidence reliability" weight="30%" score={brief.factors.reliability} />
        <FactorBar label="Creator fit" weight="20%" score={brief.factors.fit} />
        <FactorBar label="Risk" weight="15%" score={brief.factors.risk} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <div className="text-cyan-400 text-xs tracking-widest mb-3">
            RELIABILITY FLOOR
          </div>
          {brief.floor.pass ? (
            <p className="text-sm text-emerald-300">
              Passed — the rate is recorded and unconflicted, the cap
              classification is known, and a direct source supports the
              terms relied upon.
            </p>
          ) : (
            <>
              <p className="text-sm text-red-300 mb-3">
                Failed — the verdict is capped at Negotiate First and
                confidence at Low. Failed conditions:
              </p>
              <ul className="text-sm text-gray-300 space-y-1.5">
                {brief.floor.failedConditions.map((c) => (
                  <li key={c}>
                    ({c}) {FLOOR_NAMES[c]}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="text-cyan-400 text-xs tracking-widest mt-6 mb-3">
            FRESHNESS
          </div>
          <p className="text-sm text-gray-300">
            {FRESHNESS_LABELS[brief.freshnessState]}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Added to directory: {fmtDate(brief.dates.ingestedAt)} · Last
            fetched: {fmtDate(brief.dates.fetchedAt)} · Terms verified:{" "}
            {fmtDate(brief.dates.verifiedAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <div className="text-cyan-400 text-xs tracking-widest mb-3">
            EARNINGS — THREE DIFFERENT THINGS
          </div>
          <p className="text-sm text-gray-300 mb-3">
            <strong className="text-gray-100">Advertised rate:</strong>{" "}
            {brief.earnings.advertisedRatePct != null
              ? `${brief.earnings.advertisedRatePct}% as recorded in the directory. An advertised rate is not an earnings prediction.`
              : "Not recorded (missing or conflicted) — no rate is assumed."}
          </p>
          <p className="text-sm text-gray-300 mb-3">
            <strong className="text-gray-100">Realistic scenario:</strong>{" "}
            {s.kind === "unavailable"
              ? s.reason
              : `$${s.low.toLocaleString()} – $${s.high.toLocaleString()} across your views band (${s.viewsRange[0].toLocaleString()}–${s.viewsRange[1].toLocaleString()} views), from YOUR assumption ranges — labeled assumptions, never observed rates. At half your conversion assumption: $${s.halfConversion.low.toLocaleString()} – $${s.halfConversion.high.toLocaleString()}. At double: $${s.doubleConversion.low.toLocaleString()} – $${s.doubleConversion.high.toLocaleString()}.`}
          </p>
          <p className="text-sm text-gray-300">
            <strong className="text-gray-100">
              Maximum contractual potential:
            </strong>{" "}
            {brief.earnings.maxContractualPotential.kind === "figure"
              ? `$${brief.earnings.maxContractualPotential.amountUsd.toLocaleString()} — the recorded cap, with its qualifying conditions established.`
              : brief.earnings.maxContractualPotential.kind === "no_cap"
                ? "No contractual cap — the program's terms state no cap. That is a terms fact, never an earnings figure."
                : "Unknown — the cap or its qualifying conditions are not established in the record."}
          </p>
        </div>
      </div>

      {brief.subscores.riskDeductions.length > 0 && (
        <div className="mb-6">
          <div className="text-cyan-400 text-xs tracking-widest mb-3">
            RISK DEDUCTIONS (ITEMIZED)
          </div>
          <ul className="text-sm text-gray-300 space-y-1.5">
            {brief.subscores.riskDeductions.map((d) => (
              <li key={d.label}>
                −{d.points} — {d.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief.unknownTerms.length > 0 && (
        <div className="mb-6">
          <div className="text-cyan-400 text-xs tracking-widest mb-3">
            UNKNOWN MATERIAL TERMS
          </div>
          <p className="text-sm text-gray-300">
            {brief.unknownTerms.join(" · ")} — nothing is assumed for
            these; they are named so you can ask before committing.
          </p>
        </div>
      )}

      <div>
        <div className="text-cyan-400 text-xs tracking-widest mb-3">
          WHAT TO KNOW BEFORE COMMITTING
        </div>
        {brief.whatToKnow.length > 0 ? (
          <ul className="text-sm text-gray-300 space-y-2 list-disc pl-5">
            {brief.whatToKnow.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-300">
            Nothing flagged: the relied terms are recorded, supported by
            a direct source, and current.
          </p>
        )}
      </div>

      {brief.verdict !== "Skip" && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <a
            href={`/proposals?brand_id=${encodeURIComponent(
              brief.brandId
            )}&brand_name=${encodeURIComponent(brief.brandName)}`}
            className="inline-block rounded-xl border border-emerald-400/40 text-emerald-300 px-5 py-3 font-semibold hover:bg-emerald-400/10 transition"
          >
            Create proposal from this brief →
          </a>
          <p className="text-gray-500 text-sm mt-3">
            Opens the Proposal Builder with this brand filled in. You
            write and price the proposal yourself — nothing is sent or
            saved from here.
          </p>
        </div>
      )}
    </section>
  );
}

function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-sm text-cyan-200">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="text-cyan-300 hover:text-white"
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </span>
  );
}

export default function CampaignMatchPage() {
  const [niches, setNiches] = useState<string[]>([]);
  const [nicheQuery, setNicheQuery] = useState("");
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [exclusionQuery, setExclusionQuery] = useState("");
  const [catSuggestions, setCatSuggestions] = useState<SuggestionCategory[]>([]);
  const [platform, setPlatform] = useState("");
  const [audienceBand, setAudienceBand] = useState("10-50k");
  const [viewsBand, setViewsBand] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [formats, setFormats] = useState("");
  const [region, setRegion] = useState("");
  const [clickLo, setClickLo] = useState("");
  const [clickHi, setClickHi] = useState("");
  const [convLo, setConvLo] = useState("");
  const [convHi, setConvHi] = useState("");
  const [brands, setBrands] = useState<SuggestionBrand[]>([]);
  const [brandQuery, setBrandQuery] = useState("");
  const [brandSuggestions, setBrandSuggestions] = useState<SuggestionBrand[]>([]);
  const [briefs, setBriefs] = useState<Brief[] | null>(null);
  const [excludedCount, setExcludedCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchSuggestions(
    q: string,
    apply: (b: SuggestionBrand[], c: SuggestionCategory[]) => void
  ) {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (q.trim().length < 2) {
      apply([], []);
      return;
    }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        apply(data.brands ?? [], data.categories ?? []);
      } catch {
        apply([], []);
      }
    }, 200);
  }

  const assumptionsTouched =
    clickLo !== "" || clickHi !== "" || convLo !== "" || convHi !== "";
  const assumptionsComplete =
    clickLo !== "" && clickHi !== "" && convLo !== "" && convHi !== "";
  const priceTouched = priceMin !== "" || priceMax !== "";
  const priceComplete = priceMin !== "" && priceMax !== "";

  const canSubmit =
    niches.length >= 1 &&
    platform.trim().length > 0 &&
    brands.length >= 1 &&
    (!assumptionsTouched || assumptionsComplete) &&
    (!priceTouched || priceComplete) &&
    !running;

  async function run() {
    setRunning(true);
    setError("");
    setBriefs(null);
    try {
      const body: Record<string, unknown> = {
        niches,
        primaryPlatform: platform.trim(),
        audienceBand,
        brandIds: brands.map((b) => b.id),
        hardExclusions: exclusions,
      };
      if (viewsBand) body.viewsBand = viewsBand;
      if (priceComplete) {
        body.priceBand = { min: Number(priceMin), max: Number(priceMax) };
      }
      if (formats.trim()) {
        body.formats = formats
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);
      }
      if (region.trim()) body.region = region.trim();
      if (assumptionsComplete) {
        body.assumptionRanges = {
          clickRatePct: [Number(clickLo), Number(clickHi)],
          conversionRatePct: [Number(convLo), Number(convHi)],
        };
      }
      const res = await fetch("/api/campaign-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Your briefs could not be built.");
      }
      setBriefs(data.briefs ?? []);
      setExcludedCount(data.excludedCount ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your briefs could not be built.");
    } finally {
      setRunning(false);
    }
  }

  const inputCls =
    "mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white";
  const labelCls = "text-sm text-gray-300";

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / CAMPAIGN MATCH ENGINE
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          BRAND BRAIN — PHASE 2
        </div>

        <div className="mb-12">
          <div className="text-cyan-400 text-sm mb-3">
            WHICH PARTNERSHIP DESERVES YOU?
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            MATCH THE BRAND
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
              TO THE EVIDENCE.
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Of the brands you could work with, which partnership gives you
            the best realistic opportunity — and what should you know
            before committing? Pick up to five brands and get a brief for
            each, scored from the stored evidence.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          <div className="text-cyan-400 text-xs tracking-widest mb-4">
            READ THIS FIRST
          </div>
          <p className="text-sm text-gray-300 leading-6">
            The Index is a{" "}
            <strong className="text-gray-100">
              relative decision index
            </strong>{" "}
            for comparing partnerships against each other —{" "}
            <strong className="text-gray-100">
              not a validated earnings predictor
            </strong>
            . It is computed deterministically from the directory's stored
            evidence (spec phase2-v1): economic terms 35%, evidence
            reliability 30%, creator fit 20%, risk 15%. A reliability
            floor can cap a verdict no matter how high the Index runs,
            and every brief names what is unknown instead of assuming it.
          </p>
        </div>

        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8 mb-10">
          <div className="text-cyan-400 text-xs tracking-widest mb-3">
            YOUR SIDE OF THE MATCH
          </div>
          <h2 className="text-2xl font-bold mb-6">Creator inputs</h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div className={labelCls}>
              Your niches (up to 3, from the directory's categories)
              <input
                value={nicheQuery}
                onChange={(e) => {
                  setNicheQuery(e.target.value);
                  fetchSuggestions(e.target.value, (_b, c) =>
                    setCatSuggestions(c)
                  );
                }}
                placeholder="Start typing a category — e.g. Beauty"
                className={inputCls}
              />
              {catSuggestions.length > 0 && niches.length < 3 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {catSuggestions
                    .filter((c) => !niches.includes(c.name))
                    .map((c) => (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => {
                          setNiches((prev) => [...prev, c.name]);
                          setCatSuggestions([]);
                          setNicheQuery("");
                        }}
                        className="text-xs border border-white/20 rounded-full px-3 py-1.5 text-gray-300 hover:bg-white/5"
                      >
                        + {c.name}
                      </button>
                    ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {niches.map((n) => (
                  <Chip
                    key={n}
                    label={n}
                    onRemove={() =>
                      setNiches((prev) => prev.filter((x) => x !== n))
                    }
                  />
                ))}
              </div>
            </div>

            <label className={labelCls}>
              Primary platform
              <input
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="Example: tiktok"
                className={inputCls}
              />
            </label>

            <label className={labelCls}>
              Audience size
              <select
                value={audienceBand}
                onChange={(e) => setAudienceBand(e.target.value)}
                className={inputCls}
              >
                {BANDS.map((b) => (
                  <option key={b} value={b}>
                    {b} followers
                  </option>
                ))}
              </select>
            </label>

            <label className={labelCls}>
              Typical views per video (optional — used for scenarios)
              <select
                value={viewsBand}
                onChange={(e) => setViewsBand(e.target.value)}
                className={inputCls}
              >
                <option value="">Not selected</option>
                {BANDS.map((b) => (
                  <option key={b} value={b}>
                    {b} views
                  </option>
                ))}
              </select>
            </label>

            <label className={labelCls}>
              Product price band you promote, min $ (optional)
              <input
                type="number"
                min="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Example: 30"
                className={inputCls}
              />
            </label>

            <label className={labelCls}>
              Product price band you promote, max $ (optional)
              <input
                type="number"
                min="0"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Example: 100"
                className={inputCls}
              />
            </label>

            <label className={labelCls}>
              Content formats (optional, comma-separated)
              <input
                value={formats}
                onChange={(e) => setFormats(e.target.value)}
                placeholder="Example: unboxing, review, tutorial"
                className={inputCls}
              />
            </label>

            <label className={labelCls}>
              Region (optional)
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Example: US"
                className={inputCls}
              />
            </label>
          </div>

          <div className={`${labelCls} mt-5`}>
            Hard exclusions — categories you refuse. An excluded brand
            never appears in the results, at all.
            <input
              value={exclusionQuery}
              onChange={(e) => {
                setExclusionQuery(e.target.value);
                fetchSuggestions(e.target.value, (_b, c) =>
                  setCatSuggestions(c)
                );
              }}
              placeholder="Start typing a category to exclude"
              className={inputCls}
            />
            {catSuggestions.length > 0 && exclusionQuery.length >= 2 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {catSuggestions
                  .filter((c) => !exclusions.includes(c.name))
                  .map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => {
                        setExclusions((prev) => [...prev, c.name]);
                        setCatSuggestions([]);
                        setExclusionQuery("");
                      }}
                      className="text-xs border border-red-400/30 rounded-full px-3 py-1.5 text-red-200 hover:bg-white/5"
                    >
                      + Exclude {c.name}
                    </button>
                  ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {exclusions.map((n) => (
                <Chip
                  key={n}
                  label={n}
                  onRemove={() =>
                    setExclusions((prev) => prev.filter((x) => x !== n))
                  }
                />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="text-cyan-400 text-xs tracking-widest mb-3">
              EARNINGS SCENARIO ASSUMPTIONS (OPTIONAL — YOUR NUMBERS, LABELED)
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Realistic scenarios are computed only from ranges you choose
              here. Leave them empty and every brief will say the scenario
              is unavailable — nothing is assumed for you.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <label className={labelCls}>
                Click rate %, low
                <input type="number" min="0" max="100" value={clickLo} onChange={(e) => setClickLo(e.target.value)} className={inputCls} />
              </label>
              <label className={labelCls}>
                Click rate %, high
                <input type="number" min="0" max="100" value={clickHi} onChange={(e) => setClickHi(e.target.value)} className={inputCls} />
              </label>
              <label className={labelCls}>
                Conversion rate %, low
                <input type="number" min="0" max="100" value={convLo} onChange={(e) => setConvLo(e.target.value)} className={inputCls} />
              </label>
              <label className={labelCls}>
                Conversion rate %, high
                <input type="number" min="0" max="100" value={convHi} onChange={(e) => setConvHi(e.target.value)} className={inputCls} />
              </label>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-cyan-400 text-xs tracking-widest mb-3">
              BRANDS TO BRIEF (1–5)
            </div>
            <input
              value={brandQuery}
              onChange={(e) => {
                setBrandQuery(e.target.value);
                fetchSuggestions(e.target.value, (b) =>
                  setBrandSuggestions(b)
                );
              }}
              placeholder="Start typing a brand name"
              className={inputCls}
            />
            {brandSuggestions.length > 0 && brands.length < 5 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {brandSuggestions
                  .filter((b) => !brands.some((x) => x.id === b.id))
                  .map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBrands((prev) => [...prev, b]);
                        setBrandSuggestions([]);
                        setBrandQuery("");
                      }}
                      className="text-xs border border-white/20 rounded-full px-3 py-1.5 text-gray-300 hover:bg-white/5"
                    >
                      + {b.name}
                    </button>
                  ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {brands.map((b) => (
                <Chip
                  key={b.id}
                  label={b.name}
                  onRemove={() =>
                    setBrands((prev) => prev.filter((x) => x.id !== b.id))
                  }
                />
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-red-400 text-sm mt-6">
              {error}
            </p>
          )}

          <button
            onClick={run}
            disabled={!canSubmit}
            className="mt-8 w-full rounded-xl p-5 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
          >
            {running ? "BUILDING YOUR BRIEFS..." : "BUILD MY BRIEFS →"}
          </button>
        </section>

        {briefs && (
          <div className="grid gap-8">
            {excludedCount > 0 && (
              <p className="text-sm text-amber-300">
                {excludedCount} of your selected brands{" "}
                {excludedCount === 1 ? "was" : "were"} in a hard-excluded
                category and produced no brief — exclusions apply before
                scoring, exactly as specified.
              </p>
            )}
            {briefs.length === 0 && excludedCount === 0 && (
              <p className="text-gray-400">No briefs were returned.</p>
            )}
            {briefs.map((b, i) => (
              <BriefCard key={b.brandId} brief={b} rank={i} />
            ))}
            <p className="text-xs text-gray-500">
              Briefs are stored as immutable records under spec phase2-v1
              before they are shown. Same records + same inputs + same
              spec version always produce the identical Index.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
