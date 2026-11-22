// Opportunity Alert System — the feed computation, pure and isolated.
//
// HONESTY RULE (binding): every alert here is a real directory row
// with its real created_at timestamp — a brand row or an affiliate
// program row that was ADDED to the directory after the creator's
// stored watermark (alert_prefs.last_seen_at). Nothing is estimated,
// predicted, or invented. Changes INSIDE an existing row (a rate
// edited in place) leave no trace in this data — no change-history
// exists — so they are not, and cannot be, alerts; the page says so.
//
// This module has no imports and no I/O on purpose: the API route
// feeds it the directory rows it fetched, and the exact same code is
// exercised by the fixture run (scripts/alerts-fixtures.ts), so the
// API and the test share one brain.

export type AlertType = "new_brand" | "new_program";

export type BrandAlertRow = {
  id: string;
  name: string;
  /** ISO timestamptz from brands.created_at. */
  created_at: string;
  /** Every category name linked to this brand (may be empty). */
  categoryNames: string[];
};

export type ProgramAlertRow = {
  id: string;
  brand_id: string;
  brand_name: string;
  network: string | null;
  /** The rate exactly as stored (numeric or null); never re-derived. */
  commission_rate: number | null;
  /** ISO timestamptz from affiliate_programs.created_at. */
  created_at: string;
  /** The program's brand's category names (may be empty). */
  categoryNames?: string[];
};

export type AlertPrefsLike = {
  /** Free category names, matched case-insensitively. Empty = all. */
  niches: string[];
  /** Subset of ['new_brand', 'new_program']. */
  types: string[];
};

export type AlertDetail = {
  network: string | null;
  commissionRate: number | null;
} | null;

export type AlertItem = {
  type: AlertType;
  brandId: string;
  brandName: string;
  /** First category (in the row's own order) that matched the niche
   *  filter — or, when no niche filter is set, the brand's first
   *  category. Null when the brand has no categories or none match. */
  category: string | null;
  /** Programs only: network + rate exactly as stored. Brands: null. */
  detail: AlertDetail;
  /** ISO timestamp of the row's created_at. */
  at: string;
};

export type AlertFeed = {
  items: AlertItem[];
  /** Everything that matched, counted BEFORE the cap was applied. */
  totalMatched: number;
  /** True when totalMatched exceeded the cap and items were cut. */
  capped: boolean;
};

function matchesNiches(categoryNames: string[], nichesLower: string[]): boolean {
  if (nichesLower.length === 0) return true;
  return categoryNames.some((name) => nichesLower.includes(name.toLowerCase()));
}

function firstMatchingCategory(
  categoryNames: string[],
  nichesLower: string[]
): string | null {
  if (categoryNames.length === 0) return null;
  if (nichesLower.length === 0) return categoryNames[0];
  return (
    categoryNames.find((name) => nichesLower.includes(name.toLowerCase())) ??
    null
  );
}

/**
 * Compute a creator's alert feed.
 *
 * - Only rows with created_at STRICTLY AFTER `watermarkISO` count —
 *   a row exactly at the watermark was already seen.
 * - Niche filter: case-insensitive match of any of the brand's
 *   category names against prefs.niches; empty niches = all
 *   categories pass.
 * - Type filter: prefs.types decides which of 'new_brand' /
 *   'new_program' rows are considered at all.
 * - Sort: created_at descending; ties broken by brandName ascending
 *   (then type, then brandId) so the output is fully deterministic.
 * - `cap` limits items; totalMatched counts every match first.
 */
export function computeFeed(
  brandRows: BrandAlertRow[],
  programRows: ProgramAlertRow[],
  prefs: AlertPrefsLike,
  watermarkISO: string,
  cap: number
): AlertFeed {
  const nichesLower = prefs.niches.map((n) => n.toLowerCase());
  const wantBrands = prefs.types.includes("new_brand");
  const wantPrograms = prefs.types.includes("new_program");
  const watermarkMs = Date.parse(watermarkISO);

  const matched: AlertItem[] = [];

  if (wantBrands) {
    for (const row of brandRows) {
      if (!(Date.parse(row.created_at) > watermarkMs)) continue;
      if (!matchesNiches(row.categoryNames, nichesLower)) continue;
      matched.push({
        type: "new_brand",
        brandId: row.id,
        brandName: row.name,
        category: firstMatchingCategory(row.categoryNames, nichesLower),
        detail: null,
        at: row.created_at,
      });
    }
  }

  if (wantPrograms) {
    for (const row of programRows) {
      if (!(Date.parse(row.created_at) > watermarkMs)) continue;
      const categoryNames = row.categoryNames ?? [];
      if (!matchesNiches(categoryNames, nichesLower)) continue;
      matched.push({
        type: "new_program",
        brandId: row.brand_id,
        brandName: row.brand_name,
        category: firstMatchingCategory(categoryNames, nichesLower),
        detail: {
          network: row.network,
          commissionRate: row.commission_rate,
        },
        at: row.created_at,
      });
    }
  }

  matched.sort(
    (a, b) =>
      Date.parse(b.at) - Date.parse(a.at) ||
      a.brandName.localeCompare(b.brandName) ||
      a.type.localeCompare(b.type) ||
      a.brandId.localeCompare(b.brandId)
  );

  const totalMatched = matched.length;
  const items = matched.slice(0, Math.max(0, cap));
  return { items, totalMatched, capped: totalMatched > items.length };
}
