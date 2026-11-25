import Link from "next/link";
import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { ENG_CSS } from "@/lib/engine-css";
import { FEED_CSS, FEED2_CSS } from "@/lib/feed-css";
import MarketBoard, { type MarketListing, type MyApplication } from "@/components/MarketBoard";

export const dynamic = "force-dynamic";

/* MARKET (rebuild Phase 1) — Vestra Marketplace, where the
 * ecosystem does business: the kept worlds (Brands, Businesses,
 * Agencies) as one destination. Every card is a working door into
 * a real surface — the directory, open opportunities, or the
 * business workspace. Nothing here is a placeholder. */
export default async function MarketPage() {
  await requireSubscription("/market");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ count }, { data: prof }] = await Promise.all([
    supabase.from("brands").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle(),
  ]);
  const isBusiness =
    (prof as { account_type?: string } | null)?.account_type === "brand" ||
    (prof as { account_type?: string } | null)?.account_type === "agency";

  /* Every door must open for the person looking at it (his law:
   * if it's there, it leads to something). Business surfaces are
   * guarded to business accounts, so creators see the creator
   * doors plus registration — never a card that bounces them. */
  const directory = {
    t: "Brands directory",
    d: `${(count ?? 0).toLocaleString()} brands, agencies and small businesses with creator programs, published contacts and commission labels. Save the ones that fit and pitch from Deals.`,
    href: "/brands",
    go: "Browse the directory",
  };
  /* Phase 3 — the real listings board: businesses post into
   * public.market_listings; creators read the open ones here and
   * their own applications come from public.market_applications. */
  let board: { listings: MarketListing[]; apps: MyApplication[] } | null = null;
  if (!isBusiness) {
    const [{ data: listingRows }, { data: appRows }] = await Promise.all([
      supabase
        .from("market_listings")
        .select("id, company_name, title, description, category, compensation_cents, deliverables, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("market_applications")
        .select("id, listing_id, status")
        .eq("creator_user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    const listings = (listingRows ?? []) as {
      id: string;
      company_name: string;
      title: string;
      description: string;
      category: string;
      compensation_cents: number | null;
      deliverables: string;
      created_at: string;
    }[];
    const titleById = new Map(listings.map((l) => [l.id, l]));
    const appsRaw = (appRows ?? []) as { id: string; listing_id: string; status: string }[];
    const missing = appsRaw.filter((a) => !titleById.has(a.listing_id)).map((a) => a.listing_id);
    if (missing.length) {
      const { data: more } = await supabase
        .from("market_listings")
        .select("id, company_name, title, description, category, compensation_cents, deliverables, created_at")
        .in("id", missing);
      for (const l of (more ?? []) as typeof listings) titleById.set(l.id, l);
    }
    const fmt = (c: number | null) =>
      c === null ? null : `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: c % 100 ? 2 : 0 })}`;
    board = {
      listings: listings.map((l) => ({
        id: l.id,
        company: l.company_name || "UltraVestra business",
        title: l.title,
        description: l.description,
        category: l.category,
        pay: fmt(l.compensation_cents),
        deliverables: l.deliverables,
        createdAt: l.created_at,
      })),
      apps: appsRaw.map((a) => ({
        id: a.id,
        listingId: a.listing_id,
        listingTitle: titleById.get(a.listing_id)?.title ?? "Opportunity",
        company: titleById.get(a.listing_id)?.company_name || "UltraVestra business",
        status: a.status,
      })),
    };
  }

  const doors = isBusiness
    ? [
        directory,
        {
          t: "Your listings & applications",
          d: "Post an opportunity and decide the creator applications it receives. Accepting one creates the creator's deal — the marketplace loop, on real records.",
          href: "/business/listings",
          go: "Open listings",
        },
        {
          t: "Business workspace",
          d: "Your home for campaigns, creators and customers — the business side of the ecosystem, run from one place.",
          href: "/business/home",
          go: "Open the workspace",
        },
        {
          t: "Campaigns",
          d: "The campaigns you are running with creators — who is creating, what is due, and what it is producing.",
          href: "/business/campaigns",
          go: "Open campaigns",
        },
        {
          t: "Creators",
          d: "The creators working with your business — your roster, your top earners, and who to pitch next.",
          href: "/business/creators",
          go: "See creators",
        },
      ]
    : [
        directory,
        {
          t: "Opportunities",
          d: "Open opportunities matched to your creator profile — what you earn, why you match, and the brief. Applying starts a real collaboration.",
          href: "/me/opportunities",
          go: "See opportunities",
        },
        {
          t: "Register a business",
          d: "Bring a brand, agency or small business into the ecosystem — one registration, and it can hire creators and run campaigns.",
          href: "/business/register",
          go: "Register",
        },
      ];

  return (
    <div className="eng fd">
      <style>{ENG_CSS}</style>
      <style>{FEED_CSS}</style>
      <style>{FEED2_CSS}</style>
      <div className="wrap">
        <div className="label">Vestra Marketplace</div>
        <h2 className="eng-title">Market</h2>
        <p className="sub">
          Where the ecosystem does business — brands, agencies, businesses and the creators they
          work with, all on the same records.
        </p>
        <div className="mkt-grid">
          {doors.map((d) => (
            <Link className="mkt" href={d.href} key={d.href}>
              <p className="t">{d.t}</p>
              <p className="d">{d.d}</p>
              <span className="go2">{d.go} →</span>
            </Link>
          ))}
        </div>
        {board ? (
          <MarketBoard listings={board.listings} initialApplications={board.apps} />
        ) : null}
      </div>
    </div>
  );
}
