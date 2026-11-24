import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/galaxy/server";
import DnaClient from "./DnaClient";
import DnaCardSection from "./DnaCardSection";

export const dynamic = "force-dynamic";

/* CONTENT DNA — the owner's pattern-finder prototype (2026-11-23),
 * living inside Studio (the content business section) on its own
 * sub-route: it is a six-tab module (My DNA / Opportunities / Lab /
 * 30-Day / Share / Data), too large to sit under the five-stage
 * video flow. All of its data is the creator's own posts, kept on
 * this device only (localStorage "uv-content-dna") — the
 * prototype's own storage model. The analysis is deterministic
 * (lib/galaxy/dna); no model calls, nothing is posted anywhere.
 *
 * Below it sits the CREATOR DNA CARD section (the owner's second
 * prototype, v2 with six card tiers, 2026-11-24): its own analysis
 * core and store (lib/galaxy/dna-card, localStorage
 * "uv.dna.card.v1"), mounted here per the prototype's integration
 * note — inside Studio › Content DNA, under the app's own
 * navigation. */
export default async function DnaPage() {
  await requireSubscription("/studio/dna");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await fetchProfile(supabase, user.id);

  return (
    <>
      <DnaClient creatorName={profile?.name ?? ""} />
      <DnaCardSection />
    </>
  );
}
