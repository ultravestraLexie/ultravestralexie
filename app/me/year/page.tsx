import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { fetchDeals } from "@/lib/galaxy/server";
import { yearInReview } from "@/lib/galaxy/economy";
import YearClient from "./YearClient";

export const dynamic = "force-dynamic";

/* CREATOR YEAR IN REVIEW — one of the Creator Economy frames the
 * owner ordered into Me (2026-11-24). Every number is the creator's
 * real record: paid deals from their own deal board (money via
 * core's helpers only, through lib/galaxy/economy's yearInReview),
 * plus the count of videos they marked posted this year in the
 * Studio pipeline on this device. A creator with no paid deals yet
 * sees honest zeros and a "not yet" milestones row — never sample
 * numbers dressed as theirs. */
export default async function YearPage() {
  await requireSubscription("/me/year");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const deals = await fetchDeals(supabase, user.id);
  const year = new Date().getFullYear();
  const review = yearInReview(deals, year);

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

  return <YearClient review={review} passportPath={passportPath} />;
}
