import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import HallClient from "./HallClient";

export const dynamic = "force-dynamic";

/* CREATOR HALL OF FAME — one of the Creator Economy frames the
 * owner ordered into Me (2026-11-24). The prototype's rankings are
 * sample presentation: the app has no cross-creator data, so the
 * frame ports the prototype's own boards as device-local demo
 * state, exactly as modeled. It is not a real leaderboard and is
 * never wired to a backend. */
export default async function HallPage() {
  await requireSubscription("/me/hall");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return <HallClient />;
}
