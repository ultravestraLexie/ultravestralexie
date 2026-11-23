import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { fetchBrandOptions, fetchDeals, fetchProfile, fetchProtections } from "@/lib/galaxy/server";
import DealsClient from "./DealsClient";

export const dynamic = "force-dynamic";

/* DEALS — Win deals. The pipeline board over the creator's own
 * creator_deals rows, in the Galaxy stage vocabulary (pitched →
 * negotiating → contracted → delivering → invoiced → paid, plus
 * lost). Closing a deal is a stage change — nothing here ever
 * hard-deletes a deal. */
export default async function DealsPage() {
  await requireSubscription("/deals");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, deals, brandOptions, protections] = await Promise.all([
    fetchProfile(supabase, user.id),
    fetchDeals(supabase, user.id),
    fetchBrandOptions(supabase),
    fetchProtections(supabase, user.id),
  ]);

  return (
    <DealsClient
      profile={profile}
      deals={deals}
      brandOptions={brandOptions}
      protections={protections}
    />
  );
}
