import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";

export const runtime = "nodejs";

// Trend Radar (v1, directory-data edition) — deterministic
// aggregates over the stored brand directory. Same gate pattern as
// the other member API routes (see app/api/passport/route.ts and
// lib/gate.ts): no session → 401, no active/trialing subscription →
// 403, enforced here AND by the middleware via lib/gate-paths.ts.
//
// WHAT THIS IS (and is not): every number below is a count or a
// stored value computed from THIS directory's own tables —
// public.brands, public.brand_categories + public.categories,
// public.affiliate_programs and public.brand_scores. Nothing here
// measures the wider market or the live web; the page labels it
// "directory activity" for exactly that reason. There are NO
// model/AI calls in this route — the aggregates are computed in
// code from fetched rows, the same reduction style the Brand
// Opportunity Radar (app/radar/page.tsx) uses.
//
// TIMESTAMPS: brands.created_at and affiliate_programs.created_at
// are timestamptz default now(), and the batch load files
// (supabase/data/batch*-brands.sql) never set them — so a row's
// created_at is when that brand/program was added to THIS
// directory. The response and the page both say exactly that
// wherever a date is shown.
//
// "Top scored new arrivals" cohort: the newest decile BY BRAND
// COUNT (the 10% most recently added published brands), not a
// calendar window. Ingestion happened in load batches, so
// created_at clusters on load days and a "last 7 days" window
// would be arbitrary — it could swallow most of the directory or
// almost none of it depending on when loads ran. A decile is
// always well-defined and the same size relative to the
// directory. The cohort size and its cutoff timestamp are returned
// with the section so the page can state them plainly.

type BrandRow = {
  id: string;
  name: string;
  created_at: string;
};

type CategoryLinkRow = {
  brand_id: string;
  is_primary: boolean;
  categories: { name: string; slug: string } | null;
};

type AffiliateRow = {
  brand_id: string;
  network: string | null;
  commission_rate: number | null;
  commission_notes: string | null;
  created_at: string;
};

type ScoreRow = {
  brand_id: string;
  total_score: number;
  scored_at: string;
};

// Supabase answers an unbounded select with at most 1,000 rows.
// The directory holds ~2,300 brands, so a single fetch would
// silently truncate every aggregate below while the page labels
// the numbers directory-wide. Every fetch here is therefore paged
// with .range() in PAGE_SIZE slices of the SAME query — same
// filters, same ordering — until a short page comes back, so each
// section computes over the full result set.
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

export async function GET() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return Response.json(
      {
        error:
          gate === "login"
            ? "Please log in to use Trend Radar."
            : "An active subscription is required to use Trend Radar.",
      },
      { status: gate === "login" ? 401 : 403 }
    );
  }

  const supabase = await createClient();

  const [brandsRes, linksRes, affiliatesRes, scoresRes] = await Promise.all([
    fetchAllPages<BrandRow>((from, to) =>
      supabase
        .from("brands")
        .select("id, name, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .range(from, to)
    ),
    // The embedded categories join is typed as an array by the
    // client but arrives as a single object — the same mismatch
    // the result cast below handled before pagination — so this
    // one factory normalizes its pages before handing them over.
    fetchAllPages<CategoryLinkRow>(async (from, to) => {
      const res = await supabase
        .from("brand_categories")
        .select("brand_id, is_primary, categories(name, slug)")
        .range(from, to);
      return {
        data: (res.data as unknown as CategoryLinkRow[] | null) ?? null,
        error: res.error,
      };
    }),
    fetchAllPages<AffiliateRow>((from, to) =>
      supabase
        .from("affiliate_programs")
        .select(
          "brand_id, network, commission_rate, commission_notes, created_at"
        )
        .order("created_at", { ascending: false })
        .range(from, to)
    ),
    fetchAllPages<ScoreRow>((from, to) =>
      supabase
        .from("brand_scores")
        .select("brand_id, total_score, scored_at")
        .order("scored_at", { ascending: false })
        .range(from, to)
    ),
  ]);

  const failed = [brandsRes, linksRes, affiliatesRes, scoresRes].find(
    (r) => r.error
  );
  if (failed?.error) {
    console.error("Trend Radar load error:", failed.error);
    return Response.json(
      { error: "Trend Radar could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  const brands = (brandsRes.data ?? []) as BrandRow[];
  const links = (linksRes.data ?? []) as unknown as CategoryLinkRow[];
  const affiliates = (affiliatesRes.data ?? []) as AffiliateRow[];
  const scores = (scoresRes.data ?? []) as ScoreRow[];

  const brandById = new Map(brands.map((b) => [b.id, b]));
  const publishedIds = new Set(brandById.keys());

  // --- Categories: primary (or first) category per brand, and a
  // distinct-brand count per category. A brand linked to two
  // categories counts once in each — these are per-category brand
  // counts, stated as such on the page.
  const primaryCategoryByBrand = new Map<string, string>();
  const firstCategoryByBrand = new Map<string, string>();
  const brandsPerCategory = new Map<
    string,
    { name: string; slug: string; brandIds: Set<string> }
  >();
  for (const link of links) {
    if (!link.categories || !publishedIds.has(link.brand_id)) continue;
    const { name, slug } = link.categories;
    if (!firstCategoryByBrand.has(link.brand_id)) {
      firstCategoryByBrand.set(link.brand_id, name);
    }
    if (link.is_primary) primaryCategoryByBrand.set(link.brand_id, name);
    let bucket = brandsPerCategory.get(slug);
    if (!bucket) {
      bucket = { name, slug, brandIds: new Set<string>() };
      brandsPerCategory.set(slug, bucket);
    }
    bucket.brandIds.add(link.brand_id);
  }
  const categoryOf = (brandId: string): string | null =>
    primaryCategoryByBrand.get(brandId) ??
    firstCategoryByBrand.get(brandId) ??
    null;

  const biggestCategories = [...brandsPerCategory.values()]
    .map((c) => ({ name: c.name, slug: c.slug, brandCount: c.brandIds.size }))
    .sort((a, b) => b.brandCount - a.brandCount || a.name.localeCompare(b.name))
    .slice(0, 8);

  // --- Newest in the directory: brands are already ordered by
  // created_at desc; name breaks ties so the list is stable.
  const newest = [...brands]
    .sort(
      (a, b) =>
        b.created_at.localeCompare(a.created_at) || a.name.localeCompare(b.name)
    )
    .slice(0, 10)
    .map((b) => ({
      brandId: b.id,
      name: b.name,
      category: categoryOf(b.id),
      addedAt: b.created_at,
    }));

  // --- Freshest programs: affiliate rows are already ordered by
  // created_at desc; keep the ones whose brand is published.
  const freshestPrograms = affiliates
    .filter((a) => publishedIds.has(a.brand_id))
    .slice(0, 10)
    .map((a) => ({
      brandId: a.brand_id,
      brandName: brandById.get(a.brand_id)?.name ?? "Unknown brand",
      network: a.network,
      commissionRate:
        a.commission_rate != null ? Number(a.commission_rate) : null,
      commissionNotes: a.commission_notes,
      addedAt: a.created_at,
    }));

  // --- Latest stored score per brand (rows arrive newest-first).
  const latestScoreByBrand = new Map<string, number>();
  for (const s of scores) {
    if (!latestScoreByBrand.has(s.brand_id)) {
      latestScoreByBrand.set(s.brand_id, Number(s.total_score));
    }
  }

  // --- Top scored new arrivals: newest decile by brand count.
  const cohortSize = Math.max(1, Math.ceil(brands.length * 0.1));
  const cohort = [...brands]
    .sort(
      (a, b) =>
        b.created_at.localeCompare(a.created_at) || a.name.localeCompare(b.name)
    )
    .slice(0, cohortSize);
  const cohortCutoff = cohort.length
    ? cohort[cohort.length - 1].created_at
    : null;
  const topScoredNewArrivals = cohort
    .map((b) => ({
      brandId: b.id,
      name: b.name,
      category: categoryOf(b.id),
      totalScore: latestScoreByBrand.get(b.id) ?? null,
      addedAt: b.created_at,
    }))
    .filter((r) => r.totalScore != null)
    .sort(
      (a, b) =>
        (b.totalScore as number) - (a.totalScore as number) ||
        b.addedAt.localeCompare(a.addedAt) ||
        a.name.localeCompare(b.name)
    )
    .slice(0, 5);

  return Response.json({
    success: true,
    totals: {
      brandCount: brands.length,
      categoryCount: brandsPerCategory.size,
      programCount: affiliates.filter((a) => publishedIds.has(a.brand_id))
        .length,
    },
    newest,
    biggestCategories,
    freshestPrograms,
    topScoredNewArrivals: {
      cohortSize,
      cohortCutoff,
      items: topScoredNewArrivals,
    },
  });
}
