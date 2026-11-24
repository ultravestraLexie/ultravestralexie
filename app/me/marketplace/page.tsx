import { requireSubscription } from "@/lib/gate";
import MarketProfileClient from "./MarketProfileClient";

export const dynamic = "force-dynamic";

/* LOCAL GIGS PROFILE — the creator's market profile (handle, niches,
 * area, followers, platforms, rate), behind an entry card on /me
 * (owner order 2026-11-24, the Creator Economy sub-route pattern).
 * It powers the Local opportunities section on /brands: matching
 * there reads exactly these fields. The profile lives in the same
 * device-local store as the rest of the local-gigs preview
 * ("uv-market.v1") — nothing is written to the database. */
export default async function MarketProfilePage() {
  await requireSubscription("/me/marketplace");
  return <MarketProfileClient />;
}
