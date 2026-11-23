// Supabase answers an unbounded select with at most 1,000 rows.
// The brand directory holds ~2,300 published brands (with one
// brand_scores row per brand and a matching affiliate_programs
// row for most), so a single fetch silently truncates every map,
// count or list built from it — the missing brands look exactly
// like brands with no data. fetchAllPages pages a query with
// .range() in PAGE_SIZE slices — same filters, same ordering —
// until a short page comes back, so callers always compute over
// the full result set. Same helper shape as the route-local
// copies in app/api/trend-radar, app/api/campaign-match,
// app/api/alerts and app/api/command-center, and as the
// dashboard's fetchAllRows.
const PAGE_SIZE = 1000;

export type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

export async function fetchAllPages<T>(
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
