import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { checkRateLimitShared } from "@/lib/rate-limit";
import {
  computeBrief,
  isExcluded,
  verdictRank,
  SPEC_VERSION,
  type Brief,
  type CreatorInputs,
} from "@/lib/campaign-match/engine";
import {
  buildBrandRecord,
  buildPools,
  type BrandRow,
  type CategoryLinkRow,
  type CategoryRow,
  type EvidenceRow,
  type PaymentTermsRow,
  type ProductRow,
  type ProgramRow,
} from "@/lib/campaign-match/mapping";

export const runtime = "nodejs";

// Campaign Match Engine — Brand Brain Phase 2 (spec "phase2-v1").
//
// POST only. Answers the anchor question — "Of the brands I could
// work with, which partnership gives me the best realistic
// opportunity, and what should I know before committing?" — with a
// deterministic partnership brief per requested brand, computed by
// the pure engine in lib/campaign-match/engine.ts from RAW stored
// fields (never brand_scores.total_score; see the spec's Decision 4).
//
// Gate: same pattern as the other member API routes — no session →
// 401, no active/trialing subscription → 403, enforced here AND by
// the middleware via lib/gate-paths.ts. Rate limit: the shared
// limiter (lib/rate-limit.ts, untouched) under this route's OWN key
// bucket "campaign-match:user:<id>", 10 requests per hour.
//
// EVIDENCE BEFORE VERDICT: each computed brief is stored as a row in
// public.partnership_briefs BEFORE the response is sent. If the
// store fails, the request fails — no brief is ever returned that
// was not recorded first. Hard exclusions are applied BEFORE
// scoring: an excluded brand produces no brief and no stored row.
//
// NO model/AI calls in v1 (the spec ceiling is 3, for narrative
// only). The brief's "what to know" section is the engine's
// deterministic itemization: floor failures, deductions, unknown
// terms, freshness state.

const AUDIENCE_BANDS = [
  "<1k",
  "1-10k",
  "10-50k",
  "50-250k",
  "250k-1M",
  ">1M",
] as const;

const RatePair = z
  .tuple([z.number().min(0).max(100), z.number().min(0).max(100)])
  .refine(([lo, hi]) => lo <= hi, {
    message: "Range low must not exceed range high.",
  });

const RequestSchema = z.object({
  niches: z.array(z.string().min(1).max(100)).min(1).max(3),
  primaryPlatform: z.string().min(1).max(100),
  audienceBand: z.enum(AUDIENCE_BANDS),
  viewsBand: z.enum(AUDIENCE_BANDS).optional().nullable(),
  priceBand: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
    })
    .refine((b) => b.max >= b.min, {
      message: "Price band max must not be below min.",
    })
    .optional()
    .nullable(),
  formats: z.array(z.string().min(1).max(60)).max(10).optional(),
  region: z.string().max(100).optional().nullable(),
  hardExclusions: z.array(z.string().min(1).max(100)).max(12).default([]),
  assumptionRanges: z
    .object({
      clickRatePct: RatePair,
      conversionRatePct: RatePair,
    })
    .optional()
    .nullable(),
  brandIds: z.array(z.string().uuid()).min(1).max(5),
});

// Supabase answers an unbounded select with at most 1,000 rows; the
// directory-wide fetches below are paged with .range() in PAGE_SIZE
// slices of the same query (same pattern as Trend Radar) so the
// percentile pools cover the full directory.
const PAGE_SIZE = 1000;

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<PageResult<T>> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    const page = data ?? [];
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return { data: all, error: null };
}

export async function POST(request: Request) {
  // --- Gate: 401 signed out, 403 no active/trialing subscription.
  const gate = await getGateState();
  if (gate !== "ok") {
    return Response.json(
      {
        error:
          gate === "login"
            ? "Please log in to use Campaign Match."
            : "An active subscription is required to use Campaign Match.",
      },
      { status: gate === "login" ? 401 : 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json(
      { error: "Please log in to use Campaign Match." },
      { status: 401 }
    );
  }

  // --- Shared limiter, this route's own bucket, 10/hour.
  const rateKey = `campaign-match:user:${user.id}`;
  if (!(await checkRateLimitShared(rateKey, 10, 60 * 60 * 1000))) {
    return Response.json(
      {
        error:
          "You've reached the brief limit for now. Please try again in a little while.",
      },
      { status: 429 }
    );
  }

  // --- Validate the request.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your brief request details." },
      { status: 400 }
    );
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your brief request details." },
      { status: 400 }
    );
  }
  const req = parsed.data;

  // --- Directory reference data.
  const { data: categoryData, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, slug");
  if (categoryError) {
    console.error("Campaign Match categories error:", categoryError);
    return Response.json(
      { error: "The directory could not be loaded. Please try again." },
      { status: 500 }
    );
  }
  const categories = (categoryData ?? []) as CategoryRow[];
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  // Niches must come from the directory's category list.
  const nicheKnown = (n: string) =>
    categories.some(
      (c) =>
        c.name.toLowerCase() === n.trim().toLowerCase() ||
        c.slug.toLowerCase() === n.trim().toLowerCase()
    );
  if (!req.niches.every(nicheKnown)) {
    return Response.json(
      {
        error:
          "Each niche must be one of the directory's categories. Please pick from the category list.",
      },
      { status: 400 }
    );
  }

  const inputs: CreatorInputs = {
    niches: req.niches,
    primaryPlatform: req.primaryPlatform,
    audienceBand: req.audienceBand,
    viewsBand: req.viewsBand ?? null,
    priceBand: req.priceBand ?? null,
    formats: req.formats ?? [],
    region: req.region ?? null,
    hardExclusions: req.hardExclusions,
    assumptionRanges: req.assumptionRanges ?? null,
  };

  // --- The requested brands (published directory only).
  const { data: brandData, error: brandError } = await supabase
    .from("brands")
    .select("id, name, website, created_at")
    .in("id", req.brandIds)
    .eq("status", "published");
  if (brandError) {
    console.error("Campaign Match brands error:", brandError);
    return Response.json(
      { error: "The directory could not be loaded. Please try again." },
      { status: 500 }
    );
  }
  const brands = (brandData ?? []) as BrandRow[];
  if (brands.length !== req.brandIds.length) {
    return Response.json(
      {
        error:
          "One or more selected brands are not in the published directory.",
      },
      { status: 400 }
    );
  }
  const brandById = new Map(brands.map((b) => [b.id, b]));
  const requestedIds = [...new Set(req.brandIds)];

  // --- Per-brand records + directory-wide pool data (paginated).
  const [
    linksRes,
    programsRes,
    evidenceRes,
    termsRes,
    productsRes,
    allProgramsRes,
    allLinksRes,
    publishedRes,
    conflictEvidenceRes,
  ] = await Promise.all([
    fetchAllPages<CategoryLinkRow>((from, to) =>
      supabase
        .from("brand_categories")
        .select("brand_id, category_id, is_primary")
        .in("brand_id", requestedIds)
        .range(from, to)
    ),
    fetchAllPages<ProgramRow>((from, to) =>
      supabase
        .from("affiliate_programs")
        .select(
          "id, brand_id, network, commission_rate, commission_notes, application_url, last_checked_at, created_at"
        )
        .in("brand_id", requestedIds)
        .range(from, to)
    ),
    fetchAllPages<EvidenceRow>((from, to) =>
      supabase
        .from("brand_evidence")
        .select(
          "brand_id, source_url, source_type, evidence_type, evidence_summary, last_checked_at, created_at"
        )
        .in("brand_id", requestedIds)
        .range(from, to)
    ),
    fetchAllPages<PaymentTermsRow>((from, to) =>
      supabase
        .from("payment_terms")
        .select("brand_id, exclusivity, payment_timeline, notes")
        .in("brand_id", requestedIds)
        .range(from, to)
    ),
    fetchAllPages<ProductRow>((from, to) =>
      supabase
        .from("brand_products")
        .select("brand_id, price")
        .in("brand_id", requestedIds)
        .range(from, to)
    ),
    fetchAllPages<Pick<ProgramRow, "brand_id" | "commission_rate">>(
      (from, to) =>
        supabase
          .from("affiliate_programs")
          .select("brand_id, commission_rate")
          .range(from, to)
    ),
    fetchAllPages<CategoryLinkRow>((from, to) =>
      supabase
        .from("brand_categories")
        .select("brand_id, category_id, is_primary")
        .range(from, to)
    ),
    fetchAllPages<{ id: string }>((from, to) =>
      supabase
        .from("brands")
        .select("id")
        .eq("status", "published")
        .range(from, to)
    ),
    fetchAllPages<{ brand_id: string; evidence_summary: string | null }>(
      (from, to) =>
        supabase
          .from("brand_evidence")
          .select("brand_id, evidence_summary")
          .eq("evidence_type", "commission_rate")
          .range(from, to)
    ),
  ]);

  const failed = [
    linksRes,
    programsRes,
    evidenceRes,
    termsRes,
    productsRes,
    allProgramsRes,
    allLinksRes,
    publishedRes,
    conflictEvidenceRes,
  ].find((r) => r.error);
  if (failed?.error) {
    console.error("Campaign Match load error:", failed.error);
    return Response.json(
      { error: "The directory could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  const groupBy = <T extends { brand_id: string }>(rows: T[]) => {
    const map = new Map<string, T[]>();
    for (const row of rows) {
      if (!map.has(row.brand_id)) map.set(row.brand_id, []);
      map.get(row.brand_id)?.push(row);
    }
    return map;
  };
  const linksByBrand = groupBy(linksRes.data ?? []);
  const programsByBrand = groupBy(programsRes.data ?? []);
  const evidenceByBrand = groupBy(evidenceRes.data ?? []);
  const termsByBrand = groupBy(termsRes.data ?? []);
  const productsByBrand = groupBy(productsRes.data ?? []);

  const conflictedBrandIds = new Set<string>(
    (conflictEvidenceRes.data ?? [])
      .filter((r) => /rate conflict/i.test(r.evidence_summary ?? ""))
      .map((r) => r.brand_id)
  );
  const publishedBrandIds = new Set((publishedRes.data ?? []).map((b) => b.id));

  const { poolByBrand, p10ByBrand } = buildPools({
    programs: allProgramsRes.data ?? [],
    links: allLinksRes.data ?? [],
    categoriesById,
    conflictedBrandIds,
    publishedBrandIds,
  });

  // --- Exclusions BEFORE scoring; then the engine.
  const now = new Date();
  const briefs: Brief[] = [];
  const recordsByBrand = new Map<string, ReturnType<typeof buildBrandRecord>>();
  let excludedCount = 0;
  for (const brandId of requestedIds) {
    const brand = brandById.get(brandId);
    if (!brand) continue;
    const record = buildBrandRecord({
      brand,
      programs: programsByBrand.get(brandId) ?? [],
      evidence: evidenceByBrand.get(brandId) ?? [],
      paymentTermsRows: termsByBrand.get(brandId) ?? [],
      products: productsByBrand.get(brandId) ?? [],
      links: linksByBrand.get(brandId) ?? [],
      categoriesById,
      pool: poolByBrand.get(brandId) ?? [],
      poolP10Value: p10ByBrand.get(brandId) ?? null,
    });
    if (isExcluded(record, inputs)) {
      excludedCount += 1;
      continue;
    }
    recordsByBrand.set(brandId, record);
    briefs.push(computeBrief(record, inputs, now));
  }

  // Comparison ordering: final verdict rank, then Index, then name.
  briefs.sort(
    (a, b) =>
      verdictRank(a.verdict) - verdictRank(b.verdict) ||
      b.index - a.index ||
      a.brandName.localeCompare(b.brandName)
  );

  // --- Evidence before verdict: store every brief BEFORE responding.
  if (briefs.length > 0) {
    const rows = briefs.map((brief) => ({
      user_id: user.id,
      brand_id: brief.brandId,
      creator_inputs: {
        niches: inputs.niches,
        primaryPlatform: inputs.primaryPlatform,
        audienceBand: inputs.audienceBand,
        viewsBand: inputs.viewsBand ?? null,
        priceBand: inputs.priceBand ?? null,
        formats: inputs.formats ?? [],
        region: inputs.region ?? null,
        hardExclusions: inputs.hardExclusions,
        assumptionRanges: inputs.assumptionRanges ?? null,
        brandIds: requestedIds,
      },
      evidence_snapshot: recordsByBrand.get(brief.brandId) ?? null,
      factor_breakdown: {
        factors: brief.factors,
        subscores: brief.subscores,
        band: brief.band,
        floor: brief.floor,
        freshnessState: brief.freshnessState,
        staleWarning: brief.staleWarning,
        unknownTerms: brief.unknownTerms,
        earnings: brief.earnings,
        dates: brief.dates,
      },
      index: brief.index,
      verdict: brief.verdict,
      confidence: brief.confidence,
      floor_pass: brief.floor.pass,
      spec_version: SPEC_VERSION,
    }));
    const { error: storeError } = await supabase
      .from("partnership_briefs")
      .insert(rows);
    if (storeError) {
      console.error("Campaign Match brief store error:", storeError);
      return Response.json(
        {
          error:
            "Your briefs could not be recorded, so they were not shown. Please try again.",
        },
        { status: 500 }
      );
    }
  }

  return Response.json({
    success: true,
    specVersion: SPEC_VERSION,
    briefs,
    comparisonOrder: briefs.map((b) => b.brandId),
    excludedCount,
  });
}
