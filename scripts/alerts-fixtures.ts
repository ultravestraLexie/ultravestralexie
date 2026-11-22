// ============================================================================
// Opportunity Alert System — acceptance fixtures for the pure feed
// computation (lib/alerts/feed.ts).
//
// Synthetic directory rows with fixed timestamps assert the EXACT
// expected outputs: watermark strictness, niche filtering, type
// filtering, sort order, capping, and program detail fidelity.
//
// Run (from the repo root):
//   npx tsx scripts/alerts-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  computeFeed,
  type BrandAlertRow,
  type ProgramAlertRow,
} from "../lib/alerts/feed";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`PASS ${label}`);
  } else {
    failures += 1;
    console.log(`FAIL ${label}\n  expected: ${e}\n  actual:   ${a}`);
  }
}

const WATERMARK = "2026-11-20T00:00:00.000Z";
const ALL_TYPES = ["new_brand", "new_program"];

// --- Fixture rows -----------------------------------------------------------
// Timestamps: OLD is before the watermark, AT is exactly on it, and
// the rest are strictly after it.
const BRANDS: BrandAlertRow[] = [
  {
    id: "b-old",
    name: "Old Brand",
    created_at: "2026-11-19T23:59:59.000Z",
    categoryNames: ["Beauty"],
  },
  {
    id: "b-boundary",
    name: "Boundary Brand",
    created_at: WATERMARK,
    categoryNames: ["Beauty"],
  },
  {
    id: "b-beauty",
    name: "Glow Co",
    created_at: "2026-11-21T10:00:00.000Z",
    categoryNames: ["Beauty", "Skincare"],
  },
  {
    id: "b-travel",
    name: "Nomad Gear",
    created_at: "2026-11-21T12:00:00.000Z",
    categoryNames: ["Travel"],
  },
  {
    id: "b-tie",
    name: "Alpha Pets",
    created_at: "2026-11-21T10:00:00.000Z",
    categoryNames: ["Pets"],
  },
  {
    id: "b-nocat",
    name: "Mystery Brand",
    created_at: "2026-11-22T09:00:00.000Z",
    categoryNames: [],
  },
];

const PROGRAMS: ProgramAlertRow[] = [
  {
    id: "p-old",
    brand_id: "b-old",
    brand_name: "Old Brand",
    network: "Impact",
    commission_rate: 10,
    created_at: "2026-11-19T12:00:00.000Z",
    categoryNames: ["Beauty"],
  },
  {
    id: "p-glow",
    brand_id: "b-beauty",
    brand_name: "Glow Co",
    network: "ShareASale",
    commission_rate: 15,
    created_at: "2026-11-21T11:00:00.000Z",
    categoryNames: ["Beauty", "Skincare"],
  },
  {
    id: "p-nomad",
    brand_id: "b-travel",
    brand_name: "Nomad Gear",
    network: null,
    commission_rate: null,
    created_at: "2026-11-22T08:00:00.000Z",
    categoryNames: ["Travel"],
  },
];

// --- (a) Watermark: older rows excluded, boundary row excluded -------------
{
  const feed = computeFeed(BRANDS, PROGRAMS, { niches: [], types: ALL_TYPES }, WATERMARK, 100);
  const ids = feed.items.map((i) => `${i.type}:${i.brandId}`);
  check("(a) old brand row excluded", ids.includes("new_brand:b-old"), false);
  check("(a) boundary brand row (exactly at watermark) excluded", ids.includes("new_brand:b-boundary"), false);
  check("(a) old program row excluded", ids.includes("new_program:b-old"), false);
  check("(a) total matched after watermark", feed.totalMatched, 6);
}

// --- (b) Niche filter --------------------------------------------------------
{
  const beauty = computeFeed(BRANDS, PROGRAMS, { niches: ["beauty"], types: ALL_TYPES }, WATERMARK, 100);
  check(
    "(b) niche 'beauty' (lowercase vs stored 'Beauty') keeps only Beauty rows",
    beauty.items.map((i) => `${i.type}:${i.brandId}`),
    ["new_program:b-beauty", "new_brand:b-beauty"]
  );
  check(
    "(b) matched category reported with stored casing",
    beauty.items.map((i) => i.category),
    ["Beauty", "Beauty"]
  );

  const all = computeFeed(BRANDS, PROGRAMS, { niches: [], types: ALL_TYPES }, WATERMARK, 100);
  check("(b) empty niches = all categories (incl. uncategorized brand)", all.totalMatched, 6);

  const none = computeFeed(BRANDS, PROGRAMS, { niches: ["Automotive"], types: ALL_TYPES }, WATERMARK, 100);
  check("(b) niche with no matches yields empty feed", none, {
    items: [],
    totalMatched: 0,
    capped: false,
  });

  const second = computeFeed(BRANDS, PROGRAMS, { niches: ["SKINCARE"], types: ["new_brand"] }, WATERMARK, 100);
  check(
    "(b) second category of a brand also matches, case-insensitively",
    second.items.map((i) => [i.brandId, i.category]),
    [["b-beauty", "Skincare"]]
  );
}

// --- (c) Type filter ----------------------------------------------------------
{
  const brandsOnly = computeFeed(BRANDS, PROGRAMS, { niches: [], types: ["new_brand"] }, WATERMARK, 100);
  check(
    "(c) types=[new_brand] drops every program",
    brandsOnly.items.every((i) => i.type === "new_brand") && brandsOnly.totalMatched === 4,
    true
  );
  const programsOnly = computeFeed(BRANDS, PROGRAMS, { niches: [], types: ["new_program"] }, WATERMARK, 100);
  check(
    "(c) types=[new_program] drops every brand",
    programsOnly.items.every((i) => i.type === "new_program") && programsOnly.totalMatched === 2,
    true
  );
}

// --- (d) Sort order incl. name tiebreak ---------------------------------------
{
  const feed = computeFeed(BRANDS, PROGRAMS, { niches: [], types: ALL_TYPES }, WATERMARK, 100);
  check(
    "(d) created_at desc, brandName asc on ties",
    feed.items.map((i) => `${i.at}|${i.brandName}|${i.type}`),
    [
      "2026-11-22T09:00:00.000Z|Mystery Brand|new_brand",
      "2026-11-22T08:00:00.000Z|Nomad Gear|new_program",
      "2026-11-21T12:00:00.000Z|Nomad Gear|new_brand",
      "2026-11-21T11:00:00.000Z|Glow Co|new_program",
      "2026-11-21T10:00:00.000Z|Alpha Pets|new_brand",
      "2026-11-21T10:00:00.000Z|Glow Co|new_brand",
    ]
  );
  // Determinism: identical inputs → identical output.
  const again = computeFeed(BRANDS, PROGRAMS, { niches: [], types: ALL_TYPES }, WATERMARK, 100);
  check("(d) deterministic — same inputs, identical output", again, feed);
}

// --- (e) Cap + totalMatched + capped flag --------------------------------------
{
  const capped = computeFeed(BRANDS, PROGRAMS, { niches: [], types: ALL_TYPES }, WATERMARK, 2);
  check("(e) items cut to cap", capped.items.length, 2);
  check("(e) totalMatched counts everything before capping", capped.totalMatched, 6);
  check("(e) capped flag set", capped.capped, true);
  check(
    "(e) capped items are the newest two",
    capped.items.map((i) => i.brandName),
    ["Mystery Brand", "Nomad Gear"]
  );
  const uncapped = computeFeed(BRANDS, PROGRAMS, { niches: [], types: ALL_TYPES }, WATERMARK, 100);
  check("(e) capped flag clear when cap not hit", uncapped.capped, false);
}

// --- (f) Program detail fidelity ------------------------------------------------
{
  const feed = computeFeed(BRANDS, PROGRAMS, { niches: [], types: ["new_program"] }, WATERMARK, 100);
  const glow = feed.items.find((i) => i.brandId === "b-beauty");
  check(
    "(f) program detail carries network + rate verbatim",
    glow?.detail,
    { network: "ShareASale", commissionRate: 15 }
  );
  const nomad = feed.items.find((i) => i.brandId === "b-travel");
  check(
    "(f) null network and null rate stay null",
    nomad?.detail,
    { network: null, commissionRate: null }
  );
  const brandFeed = computeFeed(BRANDS, PROGRAMS, { niches: [], types: ["new_brand"] }, WATERMARK, 100);
  check(
    "(f) brand alerts carry no program detail",
    brandFeed.items.every((i) => i.detail === null),
    true
  );
  check(
    "(f) uncategorized brand's category is null",
    brandFeed.items.find((i) => i.brandId === "b-nocat")?.category,
    null
  );
}

console.log(failures === 0 ? "\nALL ASSERTIONS PASSED" : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
