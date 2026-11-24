import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { fetchDeals } from "@/lib/galaxy/server";
import { computeLevel, levelFacts, levelMilestones, levelNextText } from "@/lib/galaxy/economy";
import LevelsClient from "./LevelsClient";

export const dynamic = "force-dynamic";

/* UNLOCK YOUR NEXT LEVEL — one of the Creator Economy frames the
 * owner ordered into Me (2026-11-24). The level, the ring and every
 * milestone are computed from the creator's REAL deals (paid deals,
 * collected money via core's helpers, distinct brands) — a new
 * creator starts at Bronze with honest zeros. */
export default async function LevelsPage() {
  await requireSubscription("/me/levels");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const deals = await fetchDeals(supabase, user.id);
  const facts = levelFacts(deals);
  const state = computeLevel(facts);
  const milestones = levelMilestones(deals);
  const nextText = levelNextText(state);

  const shareRes = await supabase
    .from("profiles")
    .select("passport_slug, passport_public")
    .eq("id", user.id)
    .maybeSingle();
  const share = shareRes.data as {
    passport_slug: string | null;
    passport_public: boolean;
  } | null;
  const passportPath =
    share?.passport_slug && share?.passport_public ? `/p/${share.passport_slug}` : null;

  return (
    <LevelsClient
      facts={facts}
      state={state}
      milestones={milestones}
      nextText={nextText}
      passportPath={passportPath}
    />
  );
}
