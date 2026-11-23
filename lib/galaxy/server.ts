/* Galaxy redesign — server-side data assembly for the six views.
 * Every read runs through the caller's session client (RLS
 * applies) and is scoped to the caller's user_id in code, the
 * codebase's standing pattern. Directory reads ALWAYS go through
 * fetchAllPages — a bare select silently truncates at 1,000 rows
 * (proven defect, 2026-11-23). */

import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import {
  brandIsVerified,
  capFromNotes,
  rowToDeal,
  rowToProtection,
  type DealProtection,
  type DealRowLike,
  type ProtectionRowLike,
  type GalaxyBrand,
  type GalaxyDeal,
  type GalaxyExpense,
  type GalaxyIncome,
  type GalaxyProfile,
} from "./core";
import { rowToProfile } from "@/lib/business-profile";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export const DEAL_COLUMNS =
  "id, brand_name, platform, stage, compensation_cents, deliverables, deadline, proposal_id, notes, invoice_sent_date, payment_terms, payment_due_date, payment_received_date, amount_received_cents, created_at, updated_at";

export async function fetchProfile(
  supabase: ServerClient,
  userId: string
): Promise<GalaxyProfile> {
  const [{ data: bp }, { data: prefs }] = await Promise.all([
    supabase
      .from("creator_business_profiles")
      .select(
        "platforms, content_categories, audience_size, average_views, engagement_rate, audience_demographics, past_partnerships, revenue_streams, business_objectives, creator_name, business_description, unique_selling_proposition, differentiator, professional_experience, business_goals"
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("growth_prefs")
      .select("weekly_post_goal")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  const profile = bp ? rowToProfile(bp as never) : null;
  return {
    name: profile?.creatorName ?? "",
    niche: profile?.contentCategories[0] ?? "",
    categories: profile?.contentCategories ?? [],
    platforms: profile?.platforms ?? [],
    audience: profile?.audienceDemographics ?? "",
    weeklyGoal:
      (prefs as { weekly_post_goal: number } | null)?.weekly_post_goal ?? 5,
  };
}

export async function fetchDeals(
  supabase: ServerClient,
  userId: string
): Promise<GalaxyDeal[]> {
  const { data } = await supabase
    .from("creator_deals")
    .select(DEAL_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return ((data ?? []) as DealRowLike[]).map((r) => rowToDeal(r));
}

/** Brand Deal Protection records (System #2) for the caller's
 *  deals, keyed by deal id. Deals without a record simply have no
 *  entry — core.ts treats a missing record as nothing checked. */
export async function fetchProtections(
  supabase: ServerClient,
  userId: string
): Promise<Record<string, DealProtection>> {
  const { data } = await supabase
    .from("deal_protection")
    .select(
      "deal_id, contract_reviewed, deliverables_agreed, payment_terms_agreed, usage_rights_set, exclusivity_checked, usage_rights_note, exclusivity_note, terms_note"
    )
    .eq("user_id", userId);
  const out: Record<string, DealProtection> = {};
  for (const r of (data ?? []) as ProtectionRowLike[]) {
    out[r.deal_id] = rowToProtection(r);
  }
  return out;
}

export async function fetchPosts(
  supabase: ServerClient,
  userId: string
): Promise<{ date: string; state: string }[]> {
  const { data } = await supabase
    .from("creator_posts")
    .select("posted_date, state")
    .eq("user_id", userId)
    .order("posted_date", { ascending: false });
  return ((data ?? []) as { posted_date: string; state: string }[]).map((p) => ({
    date: p.posted_date,
    state: p.state,
  }));
}

/** Money's payout entries: revenue_entries the creator recorded
 *  as received (status 'paid') that are NOT linked to a deal —
 *  deal money is read from the deals themselves, so nothing is
 *  counted twice. */
export async function fetchIncome(
  supabase: ServerClient,
  userId: string
): Promise<GalaxyIncome[]> {
  const { data } = await supabase
    .from("revenue_entries")
    .select("id, brand_name, amount_cents, earned_date")
    .eq("user_id", userId)
    .eq("status", "paid")
    .is("deal_id", null)
    .order("earned_date", { ascending: false });
  return ((data ?? []) as {
    id: string;
    brand_name: string;
    amount_cents: number;
    earned_date: string;
  }[]).map((r) => ({
    id: r.id,
    source: r.brand_name,
    amountCents: r.amount_cents,
    date: r.earned_date,
  }));
}

export async function fetchExpenses(
  supabase: ServerClient,
  userId: string
): Promise<GalaxyExpense[]> {
  const { data } = await supabase
    .from("creator_expenses")
    .select("id, description, amount_cents, spent_date")
    .eq("user_id", userId)
    .order("spent_date", { ascending: false });
  return ((data ?? []) as {
    id: string;
    description: string;
    amount_cents: number;
    spent_date: string;
  }[]).map((r) => ({
    id: r.id,
    label: r.description,
    amountCents: r.amount_cents,
    date: r.spent_date,
  }));
}

export async function fetchSavedBrandIds(
  supabase: ServerClient,
  userId: string
): Promise<Set<string>> {
  const { data } = await fetchAllPages((from, to) =>
    supabase
      .from("saved_brands")
      .select("brand_id")
      .eq("user_id", userId)
      .order("brand_id", { ascending: true })
      .range(from, to)
  );
  return new Set(((data ?? []) as { brand_id: string }[]).map((r) => r.brand_id));
}

export async function fetchScriptCount(
  supabase: ServerClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("script_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

/** The full published directory with the Galaxy row shape.
 *  Accepting = the brand has a live application route (an
 *  affiliate-program application URL, or an open opportunity with
 *  one) — the derivation the directory surfaces have always used.
 *  Program = affiliate network; rate = commission_rate; cap from
 *  the research notes; checked = program last_checked_at. */
export async function fetchDirectory(
  supabase: ServerClient,
  savedIds: Set<string>
): Promise<GalaxyBrand[]> {
  const [{ data: brands }, { data: affiliates }, { data: opps }, { data: links }, { data: evidence }] =
    await Promise.all([
      fetchAllPages((from, to) =>
        supabase
          .from("brands")
          .select("id, name, created_at")
          .eq("status", "published")
          .order("name", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to)
      ),
      fetchAllPages((from, to) =>
        supabase
          .from("affiliate_programs")
          .select("brand_id, network, commission_rate, commission_notes, application_url, last_checked_at")
          .order("id", { ascending: true })
          .range(from, to)
      ),
      fetchAllPages((from, to) =>
        supabase
          .from("opportunities")
          .select("brand_id, status, application_url")
          .order("id", { ascending: true })
          .range(from, to)
      ),
      fetchAllPages((from, to) =>
        supabase
          .from("brand_categories")
          .select("brand_id, categories(name)")
          .order("brand_id", { ascending: true })
          .order("category_id", { ascending: true })
          .range(from, to)
      ),
      fetchAllPages((from, to) =>
        supabase
          .from("brand_evidence")
          .select("brand_id")
          .order("id", { ascending: true })
          .range(from, to)
      ),
    ]);

  type Aff = {
    network: string | null;
    rate: number | null;
    notes: string | null;
    appUrl: string | null;
    checked: string | null;
  };
  const affMap = new Map<string, Aff>();
  for (const a of (affiliates ?? []) as Record<string, unknown>[]) {
    const id = a.brand_id as string;
    if (!affMap.has(id))
      affMap.set(id, {
        network: (a.network as string) ?? null,
        rate: a.commission_rate != null ? Number(a.commission_rate) : null,
        notes: (a.commission_notes as string) ?? null,
        appUrl: (a.application_url as string) ?? null,
        checked: (a.last_checked_at as string) ?? null,
      });
  }
  const openSet = new Set<string>();
  for (const o of (opps ?? []) as Record<string, unknown>[]) {
    if (o.status === "open" && o.application_url) openSet.add(o.brand_id as string);
  }
  const catsByBrand = new Map<string, string[]>();
  for (const l of (links ?? []) as unknown as {
    brand_id: string;
    categories: { name: string } | null;
  }[]) {
    if (!l.categories) continue;
    const arr = catsByBrand.get(l.brand_id) ?? [];
    arr.push(l.categories.name);
    catsByBrand.set(l.brand_id, arr);
  }
  /* Verified identity (System #3): a brand is verified only when
   * at least one brand_evidence row is on file for it. Presence
   * is counted here; the rule itself lives in core.brandIsVerified. */
  const evidenceCount = new Map<string, number>();
  for (const e of (evidence ?? []) as { brand_id: string }[]) {
    evidenceCount.set(e.brand_id, (evidenceCount.get(e.brand_id) ?? 0) + 1);
  }

  return ((brands ?? []) as { id: string; name: string; created_at: string }[]).map(
    (b) => {
      const aff = affMap.get(b.id);
      const categories = catsByBrand.get(b.id) ?? [];
      return {
        id: b.id,
        name: b.name,
        category: categories[0] ?? null,
        categories,
        program: aff?.network ?? null,
        rate: aff?.rate ?? null,
        cap: capFromNotes(aff?.notes),
        accepting: Boolean(aff?.appUrl) || openSet.has(b.id),
        checked: aff?.checked ? String(aff.checked).slice(0, 10) : null,
        added: String(b.created_at).slice(0, 10),
        saved: savedIds.has(b.id),
        verified: brandIsVerified(evidenceCount.get(b.id) ?? 0),
      } satisfies GalaxyBrand;
    }
  );
}

/** Brand names for pickers (Add deal) — id + name only, paginated. */
export async function fetchBrandOptions(
  supabase: ServerClient
): Promise<{ id: string; name: string }[]> {
  const { data } = await fetchAllPages((from, to) =>
    supabase
      .from("brands")
      .select("id, name")
      .eq("status", "published")
      .order("name", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  );
  return (data ?? []) as { id: string; name: string }[];
}
