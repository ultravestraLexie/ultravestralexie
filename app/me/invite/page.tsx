import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import InviteClient from "./InviteClient";

export const dynamic = "force-dynamic";

/* THE CREATOR INVITATION — one of the Creator Economy frames the
 * owner ordered into Me (2026-11-24). The invite link is the
 * creator's real public Passport address (/p/[slug]) when they have
 * one — the same link their Passport already shares. Referral
 * progress and rewards are the prototype's own mechanics, held in
 * device-local state; nothing here touches plans, prices, Stripe or
 * the subscription. */
export default async function InvitePage() {
  await requireSubscription("/me/invite");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

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

  return <InviteClient passportPath={passportPath} />;
}
