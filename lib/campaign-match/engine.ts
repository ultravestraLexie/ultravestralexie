// ============================================================================
// Campaign Match Engine — Brand Brain Phase 2 (spec version "phase2-v1").
//
// PURE deterministic engine: no I/O, no Date.now(), no randomness. The
// caller passes the current time in (`now`), so the same records +
// inputs + spec version always produce the identical Index.
//
// The brief answers the Brand Brain anchor question: "Of the brands I
// could work with, which partnership gives me the best realistic
// opportunity, and what should I know before committing?"
//
// The Index is a RELATIVE DECISION INDEX. It is not a validated
// earnings predictor, and every surface that shows it must say so.
//
// RAW FIELDS ONLY (spec Decision 4): this engine reads no composite
// score. brand_scores.total_score has zero influence — the type below
// has no such field and nothing here selects one.
//
// Formulas are the approved Phase 2 specification, implemented
// exactly as written. Factor scores are rounded to one decimal
// (half up); the Index is the weighted sum of the rounded factor
// scores, rounded to the nearest integer (.5 rounds up).
// ============================================================================

export const SPEC_VERSION = "phase2-v1";

export type AudienceBand =
  | "<1k"
  | "1-10k"
  | "10-50k"
  | "50-250k"
  | "250k-1M"
  | ">1M";

export type CapClassification = "uncapped" | "capped" | "unknown";

export type SourceTier = "direct" | "network" | "third_party" | "snippet";

export interface SourceRecord {
  /** Provenance tier of this source. */
  tier: SourceTier;
  /** Origin (domain) — independence is deduped by this value. */
  origin: string;
  /** The commission rate (%) this source states, if it states one. */
  statesRatePct: number | null;
  /** The cap classification this source states, if it states one. */
  statesCap: CapClassification | null;
  /** True when this source is evidence for the program's terms
   *  (states the rate and/or the cap, or is a terms-bearing record). */
  supportsTerms: boolean;
}

export interface BrandRecord {
  brandId: string;
  brandName: string;
  primaryCategory: { name: string; slug: string } | null;
  secondaryCategories: { name: string; slug: string }[];

  /** The relied-upon commission rate (%). Null when unknown OR when
   *  conflicted (a conflicted rate is never relied upon). */
  ratePct: number | null;
  /** A recorded conflict exists on the rate. */
  rateConflicted: boolean;
  /** The conflict was resolved by a primary source, with the
   *  resolution recorded. Only meaningful when rateConflicted. */
  rateConflictResolved: boolean;
  /** Known, non-conflicted rates in the percentile pool (the brand's
   *  primary category, or the global pool when the category pool has
   *  fewer than 5 known rates). Includes this brand's own rate when
   *  it is known and non-conflicted. */
  ratePool: number[];
  /** 10th percentile of the pool (nearest-rank), for the risk rule. */
  categoryRateP10: number | null;
  /** At least one source states exactly the relied rate. */
  rateCorroborated: boolean;

  cap: CapClassification;
  /** Recorded cap amount (USD), when a source states one. */
  capAmountUsd: number | null;
  /** The cap's qualifying conditions are established in the record. */
  capQualifyingConditionsKnown: boolean;

  /** Attribution window in days. Null = unknown. */
  attributionDays: number | null;
  attributionSessionOnly: boolean;
  /** The attribution value comes from a direct or network source. */
  attributionVerified: boolean;

  /** Recorded payment terms; null = unknown. Either field may itself
   *  be null when only the other is recorded. */
  paymentTerms: {
    netDays: number | null;
    payoutThresholdUsd: number | null;
  } | null;

  /** Recorded exclusivity; null = unknown. */
  exclusivity: { restrictive: boolean } | null;

  sources: SourceRecord[];

  /** Term-verification date (ISO). Null = unknown — per Correction A,
   *  legacy directory rows can never establish it, and the 90-day
   *  clock never starts from ingestion or fetch dates. */
  verifiedAt: string | null;
  /** Most recent fetch/check date (ISO), for display only. */
  fetchedAt: string | null;
  /** Directory ingestion date (ISO), for display only. */
  ingestedAt: string | null;

  /** Brand price signal (e.g. product price range), when recorded. */
  priceSignal: { min: number; max: number } | null;
  /** Platform scope of the program, when a signal is recorded. */
  platformScope:
    | { kind: "specific"; platforms: string[] }
    | { kind: "agnostic" }
    | null;
}

export interface CreatorInputs {
  /** Category names or slugs, at most 3. */
  niches: string[];
  primaryPlatform: string;
  audienceBand: AudienceBand;
  viewsBand?: AudienceBand | null;
  priceBand?: { min: number; max: number } | null;
  formats?: string[];
  region?: string | null;
  /** Category names/slugs the creator refuses — applied BEFORE
   *  scoring; an excluded brand produces no brief at all. */
  hardExclusions: string[];
  /** Creator-selected assumption ranges for earnings scenarios.
   *  Unset by default; scenarios are never computed from invented
   *  assumptions. */
  assumptionRanges?: {
    clickRatePct: [number, number];
    conversionRatePct: [number, number];
  } | null;
}

export type Verdict = "Pursue" | "Negotiate First" | "Skip";
export type Band = "Pursue-eligible" | "Negotiate First" | "Skip";
export type Confidence = "High" | "Medium" | "Low";
export type FreshnessState = "verified_fresh" | "verified_stale" | "unverified";

export interface Brief {
  brandId: string;
  brandName: string;
  specVersion: string;
  index: number;
  factors: {
    economic: number;
    reliability: number;
    fit: number;
    risk: number;
  };
  subscores: {
    economic: {
      rateScore: number | null;
      capScore: number;
      attributionScore: number | null;
    };
    reliability: {
      provenance: number;
      independence: number;
      conflicts: number;
      freshness: number;
    };
    fit: {
      niche: number;
      price: number | null;
      platform: number | null;
      partial: boolean;
    };
    riskDeductions: { label: string; points: number }[];
  };
  band: Band;
  floor: { pass: boolean; failedConditions: ("a" | "b" | "c")[] };
  verdict: Verdict;
  confidence: Confidence;
  freshnessState: FreshnessState;
  staleWarning: boolean;
  unknownTerms: string[];
  whatToKnow: string[];
  earnings: {
    advertisedRatePct: number | null;
    realisticScenario:
      | { kind: "unavailable"; reason: string }
      | {
          kind: "range";
          low: number;
          high: number;
          halfConversion: { low: number; high: number };
          doubleConversion: { low: number; high: number };
          viewsRange: [number, number];
        };
    maxContractualPotential:
      | { kind: "figure"; amountUsd: number }
      | { kind: "no_cap" }
      | { kind: "unknown" };
  };
  dates: {
    ingestedAt: string | null;
    fetchedAt: string | null;
    verifiedAt: string | null;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Round to one decimal, half up (all values here are non-negative). */
function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

/** Round to the nearest integer, .5 rounds up. */
function roundIndex(x: number): number {
  return Math.floor(x + 0.5);
}

function roundMoney(x: number): number {
  return Math.round(x * 100) / 100;
}

function normalizeKey(s: string): string {
  return s.trim().toLowerCase();
}

function categoryMatches(
  cat: { name: string; slug: string },
  keys: string[]
): boolean {
  const name = normalizeKey(cat.name);
  const slug = normalizeKey(cat.slug);
  return keys.some((k) => k === name || k === slug);
}

/** Hard exclusions apply BEFORE scoring: a brand in any excluded
 *  category (primary or secondary) produces no brief. */
export function isExcluded(
  record: BrandRecord,
  inputs: CreatorInputs
): boolean {
  const keys = (inputs.hardExclusions ?? []).map(normalizeKey);
  if (keys.length === 0) return false;
  const cats = [
    ...(record.primaryCategory ? [record.primaryCategory] : []),
    ...record.secondaryCategories,
  ];
  return cats.some((c) => categoryMatches(c, keys));
}

/** Rate percentile: 100 × (count below + 0.5 × count equal) / count
 *  known — the pool includes the brand's own rate. */
export function percentileRank(pool: number[], value: number): number {
  if (pool.length === 0) return 100 * (0 + 0.5 * 1) / 1; // degenerate: only itself
  let below = 0;
  let equal = 0;
  for (const v of pool) {
    if (v < value) below += 1;
    else if (v === value) equal += 1;
  }
  return (100 * (below + 0.5 * equal)) / pool.length;
}

/** 10th percentile of a pool, nearest-rank method. */
export function poolP10(pool: number[]): number | null {
  if (pool.length === 0) return null;
  const sorted = [...pool].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil(0.1 * sorted.length));
  return sorted[rank - 1];
}

const TIER_SCORE: Record<SourceTier, number> = {
  direct: 100,
  network: 80,
  third_party: 40,
  snippet: 20,
};

const BAND_VIEWS: Record<AudienceBand, [number, number]> = {
  "<1k": [0, 1000],
  "1-10k": [1000, 10000],
  "10-50k": [10000, 50000],
  "50-250k": [50000, 250000],
  "250k-1M": [250000, 1000000],
  // Open-ended band: the numeric range is a stated convention —
  // floor 1,000,000 with an upper bound of 5,000,000 — so scenario
  // arithmetic stays finite and labeled.
  ">1M": [1000000, 5000000],
};

const VERDICT_RANK: Record<Verdict, number> = {
  Pursue: 0,
  "Negotiate First": 1,
  Skip: 2,
};

export function verdictRank(v: Verdict): number {
  return VERDICT_RANK[v];
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

export function computeBrief(
  record: BrandRecord,
  inputs: CreatorInputs,
  now: Date
): Brief {
  const rateKnown = record.ratePct != null && !record.rateConflicted;

  // ----- ECONOMIC (35%) -----------------------------------------------------
  // Weighted mean over AVAILABLE subscores, weights renormalized —
  // except rate absence zeroes the whole factor.
  let economic = 0;
  let rateScore: number | null = null;
  const capScore =
    record.cap === "uncapped" ? 100 : record.cap === "capped" ? 60 : 30;
  let attributionScore: number | null = null;
  if (record.attributionSessionOnly) attributionScore = 20;
  else if (record.attributionDays != null) {
    attributionScore =
      record.attributionDays >= 30
        ? 100
        : record.attributionDays >= 7
          ? 70
          : record.attributionDays >= 1
            ? 40
            : 20;
  }
  if (rateKnown) {
    rateScore = percentileRank(record.ratePool, record.ratePct as number);
    let num = rateScore * 0.55 + capScore * 0.25;
    let den = 0.55 + 0.25;
    if (attributionScore != null) {
      num += attributionScore * 0.2;
      den += 0.2;
    }
    economic = round1(num / den);
  }

  // ----- RELIABILITY (30%) --------------------------------------------------
  // Four subscores, equal-weighted mean, all always computable.
  const supporting = record.sources.filter((s) => s.supportsTerms);
  const provenance =
    supporting.length === 0
      ? 0
      : Math.max(...supporting.map((s) => TIER_SCORE[s.tier]));

  // Independence: genuinely independent origins corroborating the
  // relied rate. Copies of one source count once (dedupe by origin).
  // A conflicted/absent rate has no relied rate to corroborate → 0.
  let independence = 0;
  if (rateKnown) {
    const origins = new Set(
      record.sources
        .filter((s) => s.statesRatePct === record.ratePct)
        .map((s) => s.origin)
    );
    independence = origins.size >= 2 ? 100 : origins.size === 1 ? 70 : 0;
  }

  const conflictsScore = !record.rateConflicted
    ? 100
    : record.rateConflictResolved
      ? 40
      : 0;

  let freshnessScore: number;
  let freshnessState: FreshnessState;
  let staleWarning = false;
  if (record.verifiedAt == null) {
    // Verification unknown (Correction A): never "fresh", and the
    // 90-day clock never started — this is its own state, not stale.
    freshnessScore = 40;
    freshnessState = "unverified";
  } else {
    const days =
      (now.getTime() - new Date(record.verifiedAt).getTime()) / 86400000;
    if (days <= 90) {
      freshnessScore = 100;
      freshnessState = "verified_fresh";
    } else if (days <= 365) {
      freshnessScore = 30;
      freshnessState = "verified_stale";
      staleWarning = true;
    } else {
      freshnessScore = 10;
      freshnessState = "verified_stale";
      staleWarning = true;
    }
  }
  const reliability = round1(
    (provenance + independence + conflictsScore + freshnessScore) / 4
  );

  // ----- FIT (20%) ----------------------------------------------------------
  // Weighted mean over available subscores, renormalized. Niche is
  // always computable; unavailable subscores mark the fit "partial".
  const nicheKeys = inputs.niches.map(normalizeKey);
  let nicheScore = 10;
  if (
    record.primaryCategory &&
    categoryMatches(record.primaryCategory, nicheKeys)
  ) {
    nicheScore = 100;
  } else if (
    record.secondaryCategories.some((c) => categoryMatches(c, nicheKeys))
  ) {
    nicheScore = 60;
  }

  let priceScore: number | null = null;
  if (inputs.priceBand && record.priceSignal) {
    const c = inputs.priceBand;
    const b = record.priceSignal;
    if (c.min <= b.max && b.min <= c.max) {
      priceScore = 100;
    } else {
      const gap = Math.max(b.min - c.max, c.min - b.max);
      const adjacentThreshold = Math.max(25, 0.25 * (c.max - c.min));
      priceScore = gap <= adjacentThreshold ? 60 : 20;
    }
  }

  let platformScore: number | null = null;
  if (record.platformScope != null) {
    if (record.platformScope.kind === "agnostic") {
      platformScore = 70;
    } else {
      const mine = normalizeKey(inputs.primaryPlatform).replace(
        /[^a-z0-9]/g,
        ""
      );
      const theirs = record.platformScope.platforms.map((p) =>
        normalizeKey(p).replace(/[^a-z0-9]/g, "")
      );
      platformScore = theirs.includes(mine) ? 100 : 20;
    }
  }

  const fitPartial = priceScore == null || platformScore == null;
  const fit = (() => {
    let num = nicheScore * 0.5;
    let den = 0.5;
    if (priceScore != null) {
      num += priceScore * 0.3;
      den += 0.3;
    }
    if (platformScore != null) {
      num += platformScore * 0.2;
      den += 0.2;
    }
    return round1(num / den);
  })();

  // ----- RISK (15%) ---------------------------------------------------------
  // Starts at 100; deductions ONLY for confirmed unfavorable terms,
  // each verified from stored evidence and itemized. Missing terms
  // deduct nothing. Staleness deducts nothing here.
  const deductions: { label: string; points: number }[] = [];
  if (record.exclusivity?.restrictive === true) {
    deductions.push({ label: "Restrictive exclusivity recorded", points: 40 });
  }
  if (
    record.attributionVerified &&
    (record.attributionSessionOnly ||
      (record.attributionDays != null && record.attributionDays < 7))
  ) {
    deductions.push({
      label: "Verified attribution window under 7 days",
      points: 30,
    });
  }
  if (
    rateKnown &&
    record.rateCorroborated &&
    record.categoryRateP10 != null &&
    (record.ratePct as number) < record.categoryRateP10
  ) {
    deductions.push({
      label: "Verified rate below the category's 10th percentile",
      points: 20,
    });
  }
  if (
    record.paymentTerms &&
    ((record.paymentTerms.netDays != null && record.paymentTerms.netDays >= 60) ||
      (record.paymentTerms.payoutThresholdUsd != null &&
        record.paymentTerms.payoutThresholdUsd > 100))
  ) {
    deductions.push({
      label: "Verified payment terms net-60+ or payout threshold over $100",
      points: 15,
    });
  }
  const risk = round1(
    Math.max(
      0,
      100 - deductions.reduce((sum, d) => sum + d.points, 0)
    )
  );

  // ----- INDEX --------------------------------------------------------------
  const index = roundIndex(
    0.35 * economic + 0.3 * reliability + 0.2 * fit + 0.15 * risk
  );

  // ----- VERDICT: band, reliability floor, lower of the two -----------------
  const band: Band =
    index >= 70 ? "Pursue-eligible" : index >= 45 ? "Negotiate First" : "Skip";

  const failedConditions: ("a" | "b" | "c")[] = [];
  if (!rateKnown) failedConditions.push("a"); // rate recorded & not conflicted
  if (record.cap === "unknown") failedConditions.push("b"); // cap known
  const directSupports =
    rateKnown &&
    record.sources.some(
      (s) =>
        s.tier === "direct" &&
        s.supportsTerms &&
        s.statesRatePct === record.ratePct &&
        s.statesCap === record.cap
    );
  if (!directSupports) failedConditions.push("c");
  const floorPass = failedConditions.length === 0;

  const bandVerdict: Verdict =
    band === "Pursue-eligible" ? "Pursue" : band === "Negotiate First" ? "Negotiate First" : "Skip";
  const floorCap: Verdict = floorPass ? "Pursue" : "Negotiate First";
  const verdict: Verdict =
    VERDICT_RANK[bandVerdict] >= VERDICT_RANK[floorCap]
      ? bandVerdict
      : floorCap;

  // ----- Material-term unknowns ---------------------------------------------
  const unknownTerms: string[] = [];
  if (record.ratePct == null && !record.rateConflicted)
    unknownTerms.push("commission rate");
  if (record.rateConflicted)
    unknownTerms.push("commission rate (conflicted)");
  if (record.cap === "unknown")
    unknownTerms.push("earnings cap classification");
  if (record.attributionDays == null && !record.attributionSessionOnly)
    unknownTerms.push("attribution window");
  if (record.paymentTerms == null) unknownTerms.push("payment terms");
  if (record.exclusivity == null) unknownTerms.push("exclusivity");
  const unknownCount = unknownTerms.length;

  // ----- CONFIDENCE -----------------------------------------------------------
  let confidence: Confidence;
  if (
    !floorPass ||
    (record.rateConflicted && !record.rateConflictResolved) ||
    unknownCount >= 3
  ) {
    confidence = "Low";
  } else if (
    floorPass &&
    unknownCount <= 1 &&
    !(record.rateConflicted && !record.rateConflictResolved) &&
    record.verifiedAt != null &&
    freshnessState === "verified_fresh" &&
    !fitPartial
  ) {
    confidence = "High";
  } else {
    confidence = "Medium";
  }

  // ----- EARNINGS -------------------------------------------------------------
  // Realistic scenarios ONLY from creator-selected assumption ranges.
  let realisticScenario: Brief["earnings"]["realisticScenario"];
  if (!inputs.assumptionRanges) {
    realisticScenario = {
      kind: "unavailable",
      reason: "Unavailable — no assumption range selected",
    };
  } else if (!inputs.viewsBand) {
    realisticScenario = {
      kind: "unavailable",
      reason: "Unavailable — no views band selected",
    };
  } else if (!rateKnown) {
    realisticScenario = {
      kind: "unavailable",
      reason: "Unavailable — no recorded rate to apply",
    };
  } else {
    const viewsRange = BAND_VIEWS[inputs.viewsBand];
    const [clickLo, clickHi] = inputs.assumptionRanges.clickRatePct;
    const [convLo, convHi] = inputs.assumptionRanges.conversionRatePct;
    const rate = record.ratePct as number;
    // Spec formula: views × click range × conversion range × rate
    // (rate applied in percent points — equivalent to a $100
    // average order value; labeled as an assumption, never an
    // observed rate).
    const scenario = (convScale: number) => ({
      low: roundMoney(
        viewsRange[0] * (clickLo / 100) * ((convLo * convScale) / 100) * rate
      ),
      high: roundMoney(
        viewsRange[1] * (clickHi / 100) * ((convHi * convScale) / 100) * rate
      ),
    });
    const base = scenario(1);
    realisticScenario = {
      kind: "range",
      low: base.low,
      high: base.high,
      halfConversion: scenario(0.5),
      doubleConversion: scenario(2),
      viewsRange,
    };
  }

  const maxContractualPotential: Brief["earnings"]["maxContractualPotential"] =
    record.cap === "uncapped"
      ? { kind: "no_cap" }
      : record.cap === "capped" &&
          record.capAmountUsd != null &&
          record.capQualifyingConditionsKnown
        ? { kind: "figure", amountUsd: record.capAmountUsd }
        : { kind: "unknown" };

  // ----- "What to know" — deterministic itemizations, no narrative model ----
  const whatToKnow: string[] = [];
  if (!floorPass) {
    const names: Record<"a" | "b" | "c", string> = {
      a: "the rate is missing or conflicted",
      b: "the earnings cap classification is unknown",
      c: "no direct source supports the specific rate and cap relied upon",
    };
    whatToKnow.push(
      `Reliability floor failed: ${failedConditions.map((c) => `(${c}) ${names[c]}`).join("; ")}. The verdict is capped at Negotiate First and confidence at Low.`
    );
  }
  if (record.rateConflicted && !record.rateConflictResolved) {
    whatToKnow.push(
      "The commission rate is conflicted across sources and the conflict is unresolved — no single rate can be relied upon."
    );
  }
  for (const d of deductions) {
    whatToKnow.push(`Risk deduction −${d.points}: ${d.label}.`);
  }
  if (unknownTerms.length > 0) {
    whatToKnow.push(
      `Unknown material terms (nothing is assumed for these): ${unknownTerms.join(", ")}.`
    );
  }
  if (freshnessState === "unverified") {
    whatToKnow.push(
      "Term verification date is unknown — the directory record carries fetch dates only, so freshness is unverified and the 90-day clock has not started."
    );
  }
  if (staleWarning) {
    whatToKnow.push(
      "Stale terms warning: the relied terms were verified more than 90 days ago."
    );
  }
  if (fitPartial) {
    whatToKnow.push(
      "Fit is partial: at least one fit subscore could not be computed from the recorded signals."
    );
  }
  if (realisticScenario.kind === "unavailable") {
    whatToKnow.push(
      `Realistic earnings scenario: ${realisticScenario.reason}. Advertised rates are not earnings predictions.`
    );
  }

  return {
    brandId: record.brandId,
    brandName: record.brandName,
    specVersion: SPEC_VERSION,
    index,
    factors: { economic, reliability, fit, risk },
    subscores: {
      economic: { rateScore, capScore, attributionScore },
      reliability: {
        provenance,
        independence,
        conflicts: conflictsScore,
        freshness: freshnessScore,
      },
      fit: { niche: nicheScore, price: priceScore, platform: platformScore, partial: fitPartial },
      riskDeductions: deductions,
    },
    band,
    floor: { pass: floorPass, failedConditions },
    verdict,
    confidence,
    freshnessState,
    staleWarning,
    unknownTerms,
    whatToKnow,
    earnings: {
      advertisedRatePct: rateKnown ? record.ratePct : null,
      realisticScenario,
      maxContractualPotential,
    },
    dates: {
      ingestedAt: record.ingestedAt,
      fetchedAt: record.fetchedAt,
      verifiedAt: record.verifiedAt,
    },
  };
}
