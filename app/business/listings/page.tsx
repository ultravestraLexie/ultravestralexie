import { redirect } from "next/navigation";
import { requireBusinessAccount } from "@/lib/business-guard";
import { createClient } from "@/lib/supabase/server";
import { ENG_CSS } from "@/lib/engine-css";
import { FEED_CSS, FEED2_CSS } from "@/lib/feed-css";
import BusinessListings, { type BizListing } from "@/components/BusinessListings";

export const dynamic = "force-dynamic";

/* BUSINESS LISTINGS (rebuild Phase 3) — where a business runs
 * its side of the real marketplace: post opportunities, read
 * applications, accept or decline. Guarded exactly like the
 * other business routes (business accounts hold no
 * subscription). A business account without a completed
 * registration is sent to finish it first — a listing needs a
 * company behind it. */
export default async function BusinessListingsPage() {
  await requireBusinessAccount("/business/listings");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: biz } = await supabase
    .from("business_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!biz) redirect("/business/register");

  const { data: listingRows } = await supabase
    .from("market_listings")
    .select("id, title, category, compensation_cents, status, created_at")
    .eq("business_user_id", user.id)
    .order("created_at", { ascending: false });
  const listings = (listingRows ?? []) as {
    id: string;
    title: string;
    category: string;
    compensation_cents: number | null;
    status: string;
  }[];
  const ids = listings.map((l) => l.id);

  const { data: appRows } = ids.length
    ? await supabase
        .from("market_applications")
        .select("id, listing_id, creator_user_id, pitch, status, created_at")
        .in("listing_id", ids)
        .order("created_at", { ascending: true })
    : { data: [] };
  const apps = (appRows ?? []) as {
    id: string;
    listing_id: string;
    creator_user_id: string;
    pitch: string;
    status: string;
    created_at: string;
  }[];

  const creatorIds = [...new Set(apps.map((a) => a.creator_user_id))];
  const { data: nameRows } = creatorIds.length
    ? await supabase
        .from("creator_business_profiles")
        .select("user_id, creator_name")
        .in("user_id", creatorIds)
    : { data: [] };
  const names = new Map<string, string>();
  for (const r of (nameRows ?? []) as { user_id: string; creator_name: string | null }[]) {
    if (r.creator_name) names.set(r.user_id, r.creator_name);
  }

  const fmt = (c: number | null) =>
    c === null ? null : `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: c % 100 ? 2 : 0 })}`;
  const initial: BizListing[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    category: l.category,
    pay: fmt(l.compensation_cents),
    status: l.status,
    applications: apps
      .filter((a) => a.listing_id === l.id)
      .map((a) => ({
        id: a.id,
        creatorName: names.get(a.creator_user_id) ?? "UltraVestra creator",
        pitch: a.pitch,
        status: a.status,
        createdAt: a.created_at,
      })),
  }));

  return (
    <div className="eng fd">
      <style>{ENG_CSS}</style>
      <style>{FEED_CSS}</style>
      <style>{FEED2_CSS}</style>
      <div className="wrap">
        <div className="label">Vestra Marketplace</div>
        <h2 className="eng-title">Listings & applications</h2>
        <p className="sub">
          Post an opportunity and creators across UltraVestra can apply. Accepting an
          application creates that creator's deal at Contracted with your pay and
          deliverables — no separate paperwork step.
        </p>
        <BusinessListings initial={initial} />
      </div>
    </div>
  );
}
