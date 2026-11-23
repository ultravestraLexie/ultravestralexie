import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { fetchDeals, fetchDirectory, fetchProfile, fetchSavedBrandIds } from "@/lib/galaxy/server";
import BrandsClient from "./BrandsClient";

export const dynamic = "force-dynamic";

/* BRANDS — Find money. The verified directory with capped /
 * uncapped / unknown commission labels, accepting status, save
 * and the pitch writer. NO opportunity scores in this view (the
 * prototype removes them). Directory reads are paginated through
 * fetchAllPages — the full ~2,300-brand set, never truncated.
 *
 * System #3 (Verified Brand Opportunities): the directory rows
 * also carry the verified-identity flag (brand_evidence on file)
 * from fetchDirectory, and the creator's own deals are passed
 * down so each row can show its real application state and the
 * payment history from the creator's own paid deals — nothing
 * platform-wide is claimed, because no such data exists. */
export default async function BrandsPage() {
  await requireSubscription("/brands");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, deals, savedIds] = await Promise.all([
    fetchProfile(supabase, user.id),
    fetchDeals(supabase, user.id),
    fetchSavedBrandIds(supabase, user.id),
  ]);
  const brands = await fetchDirectory(supabase, savedIds);
  const paidCount = deals.filter((d) => d.stage === "paid").length;

  return (
    <BrandsClient
      brands={brands}
      profile={profile}
      deals={deals}
      paidCount={paidCount}
    />
  );
}
