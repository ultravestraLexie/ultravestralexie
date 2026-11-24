import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import ChallengesClient from "./ChallengesClient";

export const dynamic = "force-dynamic";

/* CREATOR CHALLENGES — one of the Creator Economy frames the owner
 * ordered into Me (2026-11-24). The prototype's challenges are a
 * social layer (a weekly posting race with friends, a joinable
 * challenge list). The app holds no friends data, so the frame keeps
 * the prototype's own presentation as device-local demo state,
 * exactly as modeled; Join toggles persist on the device. This is a
 * different feature from Studio's solo 30-Day Content DNA Challenge
 * (an experiment tracker) — neither replaces the other. */
export default async function ChallengesPage() {
  await requireSubscription("/me/challenges");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return <ChallengesClient />;
}
