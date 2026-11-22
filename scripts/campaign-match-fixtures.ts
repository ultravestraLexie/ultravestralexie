// ============================================================================
// Campaign Match Engine — acceptance fixtures + engine-level tests.
//
// Feeds the five approved Phase 2 fixtures (F1–F5) plus the engine
// tests into the PURE engine (lib/campaign-match/engine.ts) and
// asserts the exact expected outputs. The formulas are fixed by the
// approved specification: if a fixture does not reproduce, the
// mismatch is reported — the formulas are never tuned to fit.
//
// Run (from the repo root):
//   npx tsc lib/campaign-match/engine.ts scripts/campaign-match-fixtures.ts \
//     --outDir /tmp/cm-fixtures --rootDir . --module commonjs \
//     --target es2022 --moduleResolution node --skipLibCheck --strict
//   node /tmp/cm-fixtures/scripts/campaign-match-fixtures.js
// ============================================================================

import {
  computeBrief,
  isExcluded,
  poolP10,
  SPEC_VERSION,
  type BrandRecord,
  type CreatorInputs,
} from "../lib/campaign-match/engine";

const NOW = new Date("2026-11-22T00:00:00.000Z");
const daysAgo = (d: number) =>
  new Date(NOW.getTime() - d * 86400000).toISOString();

/** A pool of `total` rates (including the brand's own) with exactly
 *  `below` rates strictly below `rate` and `equal` rates equal to it,
 *  so percentileRank(pool, rate) lands on a chosen percentile:
 *  100 × (below + 0.5 × equal) / total. */
function makePool(
  rate: number,
  below: number,
  equal: number,
  total = 20
): number[] {
  const pool: number[] = [];
  for (let i = 1; i <= below; i++) pool.push(rate - i * 0.5);
  for (let i = 0; i < equal; i++) pool.push(rate);
  const above = total - below - equal;
  for (let i = 1; i <= above; i++) pool.push(rate + i * 0.5);
  return pool;
}

const BASE_INPUTS: CreatorInputs = {
  niches: ["Beauty"],
  primaryPlatform: "tiktok",
  audienceBand: "10-50k",
  hardExclusions: [],
};

function baseRecord(over: Partial<BrandRecord>): BrandRecord {
  return {
    brandId: "fixture",
    brandName: "Fixture Brand",
    primaryCategory: { name: "Beauty", slug: "beauty" },
    secondaryCategories: [],
    ratePct: null,
    rateConflicted: false,
    rateConflictResolved: false,
    ratePool: [],
    categoryRateP10: null,
    rateCorroborated: false,
    cap: "unknown",
    capAmountUsd: null,
    capQualifyingConditionsKnown: false,
    attributionDays: null,
    attributionSessionOnly: false,
    attributionVerified: false,
    paymentTerms: null,
    exclusivity: null,
    sources: [],
    verifiedAt: null,
    fetchedAt: daysAgo(2),
    ingestedAt: daysAgo(30),
    priceSignal: null,
    platformScope: null,
    ...over,
  };
}

// ---------------------------------------------------------------------------
// F1: rate 20% (85th pct), uncapped, attribution 30d, direct source,
// 2 independent, verified 10d ago, full fit
// → Index 96, floor Pass, Pursue, High.
// Fit construction: niche 100 (primary match), price 100 (bands
// overlap), platform 70 (program platform-agnostic) → Fit 94.
// Material unknowns: exclusivity only (1) → High is reachable.
// ---------------------------------------------------------------------------
const f1Pool = makePool(20, 16, 2);
const F1 = baseRecord({
  brandId: "f1",
  brandName: "F1",
  ratePct: 20,
  ratePool: f1Pool,
  categoryRateP10: poolP10(f1Pool),
  rateCorroborated: true,
  cap: "uncapped",
  attributionDays: 30,
  attributionVerified: true,
  paymentTerms: { netDays: 30, payoutThresholdUsd: 10 },
  exclusivity: null,
  sources: [
    { tier: "direct", origin: "brand.example", statesRatePct: 20, statesCap: "uncapped", supportsTerms: true },
    { tier: "network", origin: "impact.example", statesRatePct: 20, statesCap: "uncapped", supportsTerms: true },
  ],
  verifiedAt: daysAgo(10),
  priceSignal: { min: 40, max: 120 },
  platformScope: { kind: "agnostic" },
});
const F1_INPUTS: CreatorInputs = {
  ...BASE_INPUTS,
  priceBand: { min: 30, max: 100 },
};

// ---------------------------------------------------------------------------
// F2: advertised 40% (95th pct, third-party source only), cap unknown,
// attribution unknown, verification unknown, price unknown
// → Index 78, floor FAIL (b, c), verdict Negotiate First (band alone
// Pursue), Low.
// Fit: niche 100, platform 70 (agnostic), price unavailable → 91.4.
// ---------------------------------------------------------------------------
const f2Pool = makePool(40, 18, 2);
const F2 = baseRecord({
  brandId: "f2",
  brandName: "F2",
  ratePct: 40,
  ratePool: f2Pool,
  categoryRateP10: poolP10(f2Pool),
  rateCorroborated: true,
  cap: "unknown",
  attributionDays: null,
  paymentTerms: null,
  exclusivity: null,
  sources: [
    { tier: "third_party", origin: "listing.example", statesRatePct: 40, statesCap: null, supportsTerms: true },
  ],
  verifiedAt: null,
  priceSignal: null,
  platformScope: { kind: "agnostic" },
});

// ---------------------------------------------------------------------------
// F3: rate 10% capped (45th pct), attribution 14d, direct source,
// 1 independent, verified 20d ago
// → Index 78, floor Pass, Pursue, High.
// Fit: niche 100, price 60 (bands adjacent), platform 70 → Fit 82.
// Material unknowns: exclusivity only (1) → High is reachable.
// ---------------------------------------------------------------------------
const f3Pool = makePool(10, 8, 2);
const F3 = baseRecord({
  brandId: "f3",
  brandName: "F3",
  ratePct: 10,
  ratePool: f3Pool,
  categoryRateP10: poolP10(f3Pool),
  rateCorroborated: true,
  cap: "capped",
  attributionDays: 14,
  attributionVerified: true,
  paymentTerms: { netDays: 30, payoutThresholdUsd: null },
  exclusivity: null,
  sources: [
    { tier: "direct", origin: "brand.example", statesRatePct: 10, statesCap: "capped", supportsTerms: true },
  ],
  verifiedAt: daysAgo(20),
  priceSignal: { min: 110, max: 160 },
  platformScope: { kind: "agnostic" },
});
const F3_INPUTS: CreatorInputs = {
  ...BASE_INPUTS,
  priceBand: { min: 30, max: 100 },
};

// ---------------------------------------------------------------------------
// F4: rate 25% (90th pct), uncapped, attribution 30d, direct,
// 2 independent, verified 140d ago
// → Index 92, floor Pass, Pursue + stale warning, Medium.
// Fit 94 (as F1). Verification age blocks High → Medium.
// ---------------------------------------------------------------------------
const f4Pool = makePool(25, 17, 2);
const F4 = baseRecord({
  brandId: "f4",
  brandName: "F4",
  ratePct: 25,
  ratePool: f4Pool,
  categoryRateP10: poolP10(f4Pool),
  rateCorroborated: true,
  cap: "uncapped",
  attributionDays: 30,
  attributionVerified: true,
  paymentTerms: { netDays: 30, payoutThresholdUsd: 50 },
  exclusivity: { restrictive: false },
  sources: [
    { tier: "direct", origin: "brand.example", statesRatePct: 25, statesCap: "uncapped", supportsTerms: true },
    { tier: "network", origin: "impact.example", statesRatePct: 25, statesCap: "uncapped", supportsTerms: true },
  ],
  verifiedAt: daysAgo(140),
  priceSignal: { min: 40, max: 120 },
  platformScope: { kind: "agnostic" },
});
const F4_INPUTS: CreatorInputs = {
  ...BASE_INPUTS,
  priceBand: { min: 30, max: 100 },
};

// ---------------------------------------------------------------------------
// F5: rate conflicted, cap unknown, fit strong
// → Index 40, floor FAIL (a, b, c), Skip (band governs), Low.
// Reliability: provenance 20 (snippet-only sources reporting the
// conflicting rates), independence 0 (no relied rate to corroborate),
// conflicts 0 (unresolved), freshness 40 (verification unknown)
// → Reliability 15. Fit: niche 100 + platform 100, price unavailable
// → 100. Risk: no verified unfavorable terms → 100.
// Index = .35(0) + .30(15) + .20(100) + .15(100) = 39.5 → 40.
// ---------------------------------------------------------------------------
const F5 = baseRecord({
  brandId: "f5",
  brandName: "F5",
  ratePct: null,
  rateConflicted: true,
  rateConflictResolved: false,
  cap: "unknown",
  attributionDays: null,
  paymentTerms: null,
  exclusivity: null,
  sources: [
    { tier: "snippet", origin: "snippet-a.example", statesRatePct: 15, statesCap: null, supportsTerms: true },
    { tier: "snippet", origin: "snippet-b.example", statesRatePct: 25, statesCap: null, supportsTerms: true },
  ],
  verifiedAt: null,
  priceSignal: null,
  platformScope: { kind: "specific", platforms: ["tiktok"] },
});

// ---------------------------------------------------------------------------
// Assertion harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed += 1;
    console.log(`  PASS  ${label} = ${a}`);
  } else {
    failed += 1;
    failures.push(`${label}: expected ${e}, got ${a}`);
    console.log(`  FAIL  ${label}: expected ${e}, got ${a}`);
  }
}

function showBrief(name: string, b: ReturnType<typeof computeBrief>) {
  console.log(
    `${name}: index=${b.index} factors=${JSON.stringify(b.factors)} ` +
      `rel=${JSON.stringify(b.subscores.reliability)} fit=${JSON.stringify(b.subscores.fit)} ` +
      `econ=${JSON.stringify(b.subscores.economic)} band=${b.band} floor=${JSON.stringify(b.floor)} ` +
      `verdict=${b.verdict} confidence=${b.confidence} stale=${b.staleWarning} freshness=${b.freshnessState}`
  );
}

console.log(`Campaign Match fixtures — spec ${SPEC_VERSION}, now=${NOW.toISOString()}\n`);

console.log("F1");
const b1 = computeBrief(F1, F1_INPUTS, NOW);
showBrief("F1", b1);
check("F1 index", b1.index, 96);
check("F1 floor pass", b1.floor.pass, true);
check("F1 verdict", b1.verdict, "Pursue");
check("F1 confidence", b1.confidence, "High");

console.log("F2");
const b2 = computeBrief(F2, BASE_INPUTS, NOW);
showBrief("F2", b2);
check("F2 index", b2.index, 78);
check("F2 floor pass", b2.floor.pass, false);
check("F2 floor failed conditions", b2.floor.failedConditions, ["b", "c"]);
check("F2 band (alone would be Pursue)", b2.band, "Pursue-eligible");
check("F2 verdict", b2.verdict, "Negotiate First");
check("F2 confidence", b2.confidence, "Low");

console.log("F3");
const b3 = computeBrief(F3, F3_INPUTS, NOW);
showBrief("F3", b3);
check("F3 index", b3.index, 78);
check("F3 floor pass", b3.floor.pass, true);
check("F3 verdict", b3.verdict, "Pursue");
check("F3 confidence", b3.confidence, "High");

console.log("F4");
const b4 = computeBrief(F4, F4_INPUTS, NOW);
showBrief("F4", b4);
check("F4 index", b4.index, 92);
check("F4 floor pass", b4.floor.pass, true);
check("F4 verdict", b4.verdict, "Pursue");
check("F4 stale warning", b4.staleWarning, true);
check("F4 confidence", b4.confidence, "Medium");

console.log("F5");
const b5 = computeBrief(F5, BASE_INPUTS, NOW);
showBrief("F5", b5);
check("F5 index", b5.index, 40);
check("F5 floor pass", b5.floor.pass, false);
check("F5 floor failed conditions", b5.floor.failedConditions, ["a", "b", "c"]);
check("F5 verdict (band governs)", b5.verdict, "Skip");
check("F5 confidence", b5.confidence, "Low");

console.log("\nEngine-level tests");

// Determinism: same inputs twice → identical brief.
const b1Again = computeBrief(F1, F1_INPUTS, NOW);
check("determinism (identical brief)", JSON.stringify(b1Again) === JSON.stringify(b1), true);
check("determinism (identical index)", b1Again.index, b1.index);

// Composite zero influence: records differing only in a total_score
// property produce identical briefs (the engine has no such input).
const withScore5 = { ...F1, totalScore: 5 } as unknown as BrandRecord;
const withScore95 = { ...F1, totalScore: 95 } as unknown as BrandRecord;
check(
  "composite zero influence (total_score 5 vs 95)",
  computeBrief(withScore95, F1_INPUTS, NOW).index,
  computeBrief(withScore5, F1_INPUTS, NOW).index
);

// Exclusion: excluded-category brand produces no brief.
check(
  "exclusion by primary category",
  isExcluded(F1, { ...BASE_INPUTS, hardExclusions: ["beauty"] }),
  true
);
check(
  "exclusion by secondary category",
  isExcluded(
    baseRecord({
      primaryCategory: { name: "Home", slug: "home" },
      secondaryCategories: [{ name: "Beauty", slug: "beauty" }],
    }),
    { ...BASE_INPUTS, hardExclusions: ["Beauty"] }
  ),
  true
);
check(
  "no exclusion when category not excluded",
  isExcluded(F1, { ...BASE_INPUTS, hardExclusions: ["pets"] }),
  false
);

// Copies of one source count as one independent source: three direct
// rows from the SAME origin corroborating the rate → independence 70.
const copies = computeBrief(
  baseRecord({
    ...F3,
    sources: [
      { tier: "direct", origin: "brand.example", statesRatePct: 10, statesCap: "capped", supportsTerms: true },
      { tier: "direct", origin: "brand.example", statesRatePct: 10, statesCap: "capped", supportsTerms: true },
      { tier: "direct", origin: "brand.example", statesRatePct: 10, statesCap: "capped", supportsTerms: true },
    ],
  }),
  F3_INPUTS,
  NOW
);
check("copies of one source = one independent source", copies.subscores.reliability.independence, 70);

// A direct source NOT supporting the rate/cap fails floor (c) even
// when (a) and (b) pass.
const directNotSupporting = computeBrief(
  baseRecord({
    ...F1,
    sources: [
      { tier: "direct", origin: "brand.example", statesRatePct: 12, statesCap: null, supportsTerms: true },
      { tier: "network", origin: "impact.example", statesRatePct: 20, statesCap: "uncapped", supportsTerms: true },
    ],
  }),
  F1_INPUTS,
  NOW
);
check("direct source not supporting → floor fails", directNotSupporting.floor.pass, false);
check("direct source not supporting → only (c) fails", directNotSupporting.floor.failedConditions, ["c"]);

// Unknown verification is never "fresh".
const unverified = computeBrief(baseRecord({ ...F1, verifiedAt: null }), F1_INPUTS, NOW);
check("unknown verification state", unverified.freshnessState, "unverified");
check("unknown verification freshness subscore", unverified.subscores.reliability.freshness, 40);
check("unknown verification has no stale warning", unverified.staleWarning, false);

// Missing views band / assumptions → scenario Unavailable.
const noAssumptions = computeBrief(F1, F1_INPUTS, NOW);
check("no assumption ranges → scenario unavailable", noAssumptions.earnings.realisticScenario.kind, "unavailable");
check(
  "no assumption ranges → spec reason string",
  noAssumptions.earnings.realisticScenario.kind === "unavailable"
    ? noAssumptions.earnings.realisticScenario.reason
    : null,
  "Unavailable — no assumption range selected"
);
const assumptionsNoViews = computeBrief(
  F1,
  {
    ...F1_INPUTS,
    assumptionRanges: { clickRatePct: [1, 3], conversionRatePct: [2, 5] },
  },
  NOW
);
check("assumptions but no views band → unavailable", assumptionsNoViews.earnings.realisticScenario.kind, "unavailable");
const withScenario = computeBrief(
  F1,
  {
    ...F1_INPUTS,
    viewsBand: "10-50k",
    assumptionRanges: { clickRatePct: [1, 3], conversionRatePct: [2, 5] },
  },
  NOW
);
check("assumptions + views band → scenario range", withScenario.earnings.realisticScenario.kind, "range");
if (withScenario.earnings.realisticScenario.kind === "range") {
  const s = withScenario.earnings.realisticScenario;
  check("scenario low < high", s.low < s.high, true);
  check("half-conversion sensitivity below base", s.halfConversion.low < s.low, true);
  check("double-conversion sensitivity above base", s.doubleConversion.low > s.low, true);
  console.log(`  scenario: low=${s.low} high=${s.high} half=${JSON.stringify(s.halfConversion)} double=${JSON.stringify(s.doubleConversion)}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log("FAILURES:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
