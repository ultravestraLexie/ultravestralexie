import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  computeFeed,
  type BrandAlertRow,
  type ProgramAlertRow,
} from "@/lib/alerts/feed";
import type { RevenueEntryLike } from "@/lib/revenue/summary";
import { buildCards } from "@/lib/command-center/aggregate";

export const runtime = "nodejs";

// UltraVestra Command Center — a READ-ONLY aggregation over the
// caller's own stored rows, shaped into dashboard cards by
// lib/command-center/aggregate.ts. Same gate pattern as the other
// member API routes (see app/api/alerts/route.ts and lib/gate.ts):
// no session → 401, no active/trialing subscription → 403, enforced
// here AND by the middleware via lib/gate-paths.ts. All queries run
// through the session client (lib/supabase/server), so RLS applies
// as the signed-in user; every owner query is additionally scoped
// to the caller's own user_id in code.
//
// READ-ONLY means read-only: this route creates nothing. In
// particular it does NOT create an alert_prefs row for a caller who
// has none (the Alerts route creates one on first sight; here the
// alerts card simply reports "not set up yet").
//
// HONESTY RULE (binding): every number is the caller's own stored
// data or the public directory's published-brand count — nothing
// estimated, projected, or invented. The alerts figure is computed
// with the SAME logic as the Alerts route (same prefs, same
// watermark, same paginated directory fetches, same chunked id
// lookups, same computeFeed — called with cap 1 because only the
// total is needed). The Creator Lab contributes no number: it
// stores nothing, and its card says so.
//
// No model/AI calls. No rate limiter: the shared limiter in
// lib/rate-limit.ts is frozen and untouched; an authenticated,
// subscription-gated read of the caller's own rows is the v1 scope
// (the Revenue Tracker precedent).

/** Gate + identity: 401 when signed out, 403 when not subscribed,
 *  otherwise the session client and the caller's id. */
async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        { error: gate === "login" ? "Not authenticated" : "Subscription required" },
        { status: gate === "login" ? 401 : 403 }
      ),
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

type Owner = Extract<Awaited<ReturnType<typeof requireOwner>>, { ok: true }>;

function loadError() {
  return Response.json(
    { error: "Your command center could not be loaded. Please try again." },
    { status: 500 }
  );
}

// --- The alerts computation, mirroring app/api/alerts/route.ts ---
// Supabase answers an unbounded select with at most 1,000 rows, so
// directory-wide fetches are paged with .range(); and an .in()
// filter puts every id in the request URL, so id lookups are
// chunked into CHUNK_SIZE slices — an unbounded list (thousands of
// UUIDs) builds a URL so long the request itself dies, as observed
// in production on the Alerts route. Both patterns are copied from
// the Alerts route so this total is computed the same way.
const PAGE_SIZE = 1000;
const CHUNK_SIZE = 100;

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

function chunkIds(ids: string[]): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

type AlertPrefsRow = {
  niches: string[];
  types: string[];
  last_seen_at: string;
};

/** computeFeed's totalMatched for the caller's stored prefs — the
 *  Alerts route's GET computation with cap 1, since the Command
 *  Center needs only the count, never the items. */
async function alertTotalMatched(
  owner: Owner,
  prefs: AlertPrefsRow
): Promise<{ ok: true; totalMatched: number } | { ok: false }> {
  const watermark = prefs.last_seen_at;

  type BrandDbRow = { id: string; name: string; created_at: string };
  type ProgramDbRow = {
    id: string;
    brand_id: string;
    network: string | null;
    commission_rate: number | null;
    created_at: string;
  };
  type LinkDbRow = { brand_id: string; category_id: string };
  type CategoryDbRow = { id: string; name: string };

  const [brandsRes, programsRes] = await Promise.all([
    fetchAllPages<BrandDbRow>((from, to) =>
      owner.supabase
        .from("brands")
        .select("id, name, created_at")
        .eq("status", "published")
        .gt("created_at", watermark)
        .order("created_at", { ascending: false })
        .range(from, to)
    ),
    fetchAllPages<ProgramDbRow>((from, to) =>
      owner.supabase
        .from("affiliate_programs")
        .select("id, brand_id, network, commission_rate, created_at")
        .gt("created_at", watermark)
        .order("created_at", { ascending: false })
        .range(from, to)
    ),
  ]);

  const failed = [brandsRes, programsRes].find((r) => r.error);
  if (failed?.error) {
    console.error("Command Center alerts directory load error:", failed.error);
    return { ok: false };
  }

  const brandRowsDb = brandsRes.data ?? [];
  const programRowsDb = programsRes.data ?? [];

  // Program alerts need their brand's name (and the brand must be a
  // published directory brand). Fetch any program brands not
  // already in the new-brands set — chunked, as on the Alerts route.
  const brandNameById = new Map(brandRowsDb.map((b) => [b.id, b.name]));
  const missingBrandIds = [
    ...new Set(
      programRowsDb
        .map((p) => p.brand_id)
        .filter((id) => !brandNameById.has(id))
    ),
  ];
  if (missingBrandIds.length > 0) {
    const extraBrands: { id: string; name: string }[] = [];
    let extraError: { message: string } | null = null;
    for (const chunk of chunkIds(missingBrandIds)) {
      const { data, error } = await owner.supabase
        .from("brands")
        .select("id, name")
        .eq("status", "published")
        .in("id", chunk);
      if (error) {
        extraError = error;
        break;
      }
      extraBrands.push(...((data ?? []) as { id: string; name: string }[]));
    }
    if (extraError) {
      console.error("Command Center alerts brand lookup error:", extraError);
      return { ok: false };
    }
    for (const b of extraBrands) {
      brandNameById.set(b.id, b.name);
    }
  }

  // Categories for every brand in play, via brand_categories joined
  // to categories by id in code — links fetched in chunks.
  const relevantBrandIds = [...brandNameById.keys()];
  const categoryNamesByBrand = new Map<string, string[]>();
  if (relevantBrandIds.length > 0) {
    const fetchLinksInChunks = async (): Promise<PageResult<LinkDbRow>> => {
      const all: LinkDbRow[] = [];
      for (const chunk of chunkIds(relevantBrandIds)) {
        const { data, error } = await owner.supabase
          .from("brand_categories")
          .select("brand_id, category_id")
          .in("brand_id", chunk);
        if (error) return { data: null, error };
        all.push(...((data ?? []) as LinkDbRow[]));
      }
      return { data: all, error: null };
    };
    const [categoriesRes, linksRes] = await Promise.all([
      fetchAllPages<CategoryDbRow>((from, to) =>
        owner.supabase.from("categories").select("id, name").range(from, to)
      ),
      fetchLinksInChunks(),
    ]);
    const catFailed = [categoriesRes, linksRes].find((r) => r.error);
    if (catFailed?.error) {
      console.error("Command Center alerts category load error:", catFailed.error);
      return { ok: false };
    }
    const categoryNameById = new Map(
      (categoriesRes.data ?? []).map((c) => [c.id, c.name])
    );
    for (const link of linksRes.data ?? []) {
      const name = categoryNameById.get(link.category_id);
      if (!name) continue;
      const list = categoryNamesByBrand.get(link.brand_id) ?? [];
      if (!list.includes(name)) list.push(name);
      categoryNamesByBrand.set(link.brand_id, list);
    }
  }

  const brandRows: BrandAlertRow[] = brandRowsDb.map((b) => ({
    id: b.id,
    name: b.name,
    created_at: b.created_at,
    categoryNames: categoryNamesByBrand.get(b.id) ?? [],
  }));

  const programRows: ProgramAlertRow[] = programRowsDb
    .filter((p) => brandNameById.has(p.brand_id))
    .map((p) => ({
      id: p.id,
      brand_id: p.brand_id,
      brand_name: brandNameById.get(p.brand_id) as string,
      network: p.network,
      commission_rate:
        p.commission_rate != null ? Number(p.commission_rate) : null,
      created_at: p.created_at,
      categoryNames: categoryNamesByBrand.get(p.brand_id) ?? [],
    }));

  const feed = computeFeed(
    brandRows,
    programRows,
    { niches: prefs.niches, types: prefs.types },
    watermark,
    1
  );
  return { ok: true, totalMatched: feed.totalMatched };
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;
  const { supabase, userId } = owner;

  // The caller's own rows, plus the directory's published count.
  // The prefs read is a plain read: no row is created here.
  const [
    revenueRes,
    prefsRes,
    growthRes,
    proposalsRes,
    passportRes,
    briefsRes,
    brandsRes,
  ] = await Promise.all([
    supabase
      .from("revenue_entries")
      .select("brand_name, amount_cents, status, earned_date")
      .eq("user_id", userId),
    supabase
      .from("alert_prefs")
      .select("niches, types, last_seen_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("growth_items")
      .select("kind, status")
      .eq("user_id", userId),
    supabase.from("proposals").select("status").eq("user_id", userId),
    supabase
      .from("passport_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("partnership_briefs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("brands")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  const failed = [
    revenueRes,
    prefsRes,
    growthRes,
    proposalsRes,
    passportRes,
    briefsRes,
    brandsRes,
  ].find((r) => r.error);
  if (failed?.error) {
    console.error("Command Center load error:", failed.error);
    return loadError();
  }

  // Alerts: only computed when a prefs row exists. No row → the
  // card reports "not set up yet" with a true zero.
  const prefs = (prefsRes.data ?? null) as AlertPrefsRow | null;
  let alertsTotal = 0;
  let alertsWatermark: string | null = null;
  if (prefs) {
    const alerts = await alertTotalMatched(owner, prefs);
    if (!alerts.ok) return loadError();
    alertsTotal = alerts.totalMatched;
    alertsWatermark = prefs.last_seen_at;
  }

  const cards = buildCards({
    revenueEntries: (revenueRes.data ?? []) as RevenueEntryLike[],
    alertTotalMatched: alertsTotal,
    alertWatermark: alertsWatermark,
    growthItems: (growthRes.data ?? []) as { kind: string; status: string }[],
    proposals: (proposalsRes.data ?? []) as { status: string }[],
    passportCount: passportRes.count ?? 0,
    briefsCount: briefsRes.count ?? 0,
    directoryBrandCount: brandsRes.count ?? 0,
  });

  return Response.json({ success: true, cards });
}
