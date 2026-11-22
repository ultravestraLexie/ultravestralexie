import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  computeFeed,
  type BrandAlertRow,
  type ProgramAlertRow,
} from "@/lib/alerts/feed";

export const runtime = "nodejs";

// Opportunity Alert System — a creator's feed of what was ADDED to
// the brand directory since their stored watermark
// (public.alert_prefs.last_seen_at), filtered by the categories and
// alert types they chose. Same gate pattern as the other member API
// routes (see app/api/revenue/route.ts and lib/gate.ts): no session
// → 401, no active/trialing subscription → 403, enforced here AND
// by the middleware via lib/gate-paths.ts. All queries run through
// the session client (lib/supabase/server), so RLS applies as the
// signed-in user; every prefs query is additionally scoped to the
// caller's own user_id in code.
//
// HONESTY RULE (binding): every alert is a real directory row with
// its real created_at — a brand or affiliate program ADDED after
// the watermark. The filtering/sorting/capping itself lives in the
// pure module lib/alerts/feed.ts, shared with the fixture run, so
// what is tested is what runs. Nothing is estimated, predicted, or
// invented. Changes INSIDE an existing program (a rate edited in
// place) are NOT tracked — no change-history exists — and the page
// says so plainly. Email delivery is not connected in v1.
//
// TIMESTAMPS: brands.created_at and affiliate_programs.created_at
// are when the row was added to THIS directory (the same reading
// Trend Radar documents). The watermark comparison is STRICTLY
// after: a row exactly at last_seen_at was already seen.
//
// No model/AI calls. No rate limiter: the shared limiter in
// lib/rate-limit.ts is frozen and untouched; authenticated,
// subscription-gated reads/writes of the caller's own prefs row are
// the v1 scope (the Revenue Tracker precedent).

const ALERT_TYPES = ["new_brand", "new_program"] as const;
const FEED_CAP = 100;

const PatchSchema = z.object({
  niches: z
    .array(z.string().max(60))
    .max(10)
    .transform((list) => {
      // Trim, drop empties, dedupe (exact string after trim) —
      // matching itself is case-insensitive in lib/alerts/feed.ts.
      const seen = new Set<string>();
      const out: string[] = [];
      for (const raw of list) {
        const value = raw.trim();
        if (value === "" || seen.has(value)) continue;
        seen.add(value);
        out.push(value);
      }
      return out;
    }),
  types: z
    .array(z.enum(ALERT_TYPES))
    .min(1)
    .transform((list) => [...new Set(list)]),
});

type AlertPrefsRow = {
  id: string;
  user_id: string;
  niches: string[];
  types: string[];
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

const PREFS_COLUMNS =
  "id, user_id, niches, types, last_seen_at, created_at, updated_at";

// Supabase answers an unbounded select with at most 1,000 rows; the
// directory-wide fetches below are paged with .range() in PAGE_SIZE
// slices of the same query (same pattern as Trend Radar and
// Campaign Match) so nothing after the watermark is silently cut.
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

// An .in() filter puts every id in the request URL, so an unbounded
// id list — thousands of UUIDs when the watermark is days old and
// the whole directory is "in play" — builds a URL so long the
// request itself dies (observed in production as an HTTP/2 frame
// error on the brand_categories fetch). Id-based lookups are
// therefore chunked into CHUNK_SIZE slices and accumulated; for the
// brand_categories links this supersedes .range() paging, since a
// brand has only a handful of category links.
const CHUNK_SIZE = 100;

function chunkIds(ids: string[]): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

/** Gate + identity for every handler: 401 when signed out, 403 when
 *  not subscribed, otherwise the session client and the caller's id. */
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

/** The caller's prefs row, created with defaults on first sight:
 *  niches {} (all categories), both alert types, and last_seen_at =
 *  now — so a brand-new user starts with an EMPTY feed instead of
 *  2,348 historical "alerts". */
async function getOrCreatePrefs(owner: Owner): Promise<
  | { ok: true; prefs: AlertPrefsRow }
  | { ok: false; response: Response }
> {
  const { data, error } = await owner.supabase
    .from("alert_prefs")
    .select(PREFS_COLUMNS)
    .eq("user_id", owner.userId)
    .maybeSingle();

  if (error) {
    console.error("Alerts prefs load error:", error);
    return {
      ok: false,
      response: Response.json(
        { error: "Your alert settings could not be loaded. Please try again." },
        { status: 500 }
      ),
    };
  }
  if (data) return { ok: true, prefs: data as AlertPrefsRow };

  const { data: created, error: insertError } = await owner.supabase
    .from("alert_prefs")
    .insert({ user_id: owner.userId })
    .select(PREFS_COLUMNS)
    .single();

  if (insertError || !created) {
    console.error("Alerts prefs create error:", insertError);
    return {
      ok: false,
      response: Response.json(
        { error: "Your alert settings could not be loaded. Please try again." },
        { status: 500 }
      ),
    };
  }
  return { ok: true, prefs: created as AlertPrefsRow };
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const prefsResult = await getOrCreatePrefs(owner);
  if (!prefsResult.ok) return prefsResult.response;
  const prefs = prefsResult.prefs;
  const watermark = prefs.last_seen_at;

  // --- Directory rows added strictly after the watermark. The .gt
  // filter is applied server-side; pagination covers the full set.
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
    console.error("Alerts directory load error:", failed.error);
    return Response.json(
      { error: "Your alerts could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  const brandRowsDb = brandsRes.data ?? [];
  const programRowsDb = programsRes.data ?? [];

  // Program alerts need their brand's name (and the brand must be a
  // published directory brand — an unpublished brand's new program
  // is not an alert). Fetch any program brands not already in the
  // new-brands set.
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
      console.error("Alerts brand lookup error:", extraError);
      return Response.json(
        { error: "Your alerts could not be loaded. Please try again." },
        { status: 500 }
      );
    }
    for (const b of extraBrands) {
      brandNameById.set(b.id, b.name);
    }
  }

  // Categories for every brand in play (new brands + program brands),
  // via brand_categories joined to categories by id in code — the
  // Campaign Match mapping pattern.
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
      console.error("Alerts category load error:", catFailed.error);
      return Response.json(
        { error: "Your alerts could not be loaded. Please try again." },
        { status: 500 }
      );
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
    FEED_CAP
  );

  return Response.json({
    success: true,
    prefs,
    feed: {
      items: feed.items,
      totalMatched: feed.totalMatched,
      capped: feed.capped,
    },
    watermark,
  });
}

export async function PATCH(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your alert settings." },
      { status: 400 }
    );
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your alert settings." },
      { status: 400 }
    );
  }

  const prefsResult = await getOrCreatePrefs(owner);
  if (!prefsResult.ok) return prefsResult.response;

  const { data, error } = await owner.supabase
    .from("alert_prefs")
    .update({
      niches: parsed.data.niches,
      types: parsed.data.types,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", owner.userId)
    .select(PREFS_COLUMNS)
    .single();

  if (error) {
    console.error("Alerts prefs update error:", error);
    return Response.json(
      { error: "Your alert settings could not be saved. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({ success: true, prefs: data as AlertPrefsRow });
}

export async function POST() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const prefsResult = await getOrCreatePrefs(owner);
  if (!prefsResult.ok) return prefsResult.response;

  // "Mark all seen": the watermark jumps to now, so everything in
  // the current feed is behind it on the next read.
  const now = new Date().toISOString();
  const { data, error } = await owner.supabase
    .from("alert_prefs")
    .update({ last_seen_at: now, updated_at: now })
    .eq("user_id", owner.userId)
    .select(PREFS_COLUMNS)
    .single();

  if (error) {
    console.error("Alerts watermark update error:", error);
    return Response.json(
      { error: "Your alerts could not be marked as seen. Please try again." },
      { status: 500 }
    );
  }

  const prefs = data as AlertPrefsRow;
  return Response.json({ success: true, last_seen_at: prefs.last_seen_at });
}
