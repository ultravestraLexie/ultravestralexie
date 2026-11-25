import StartHome from "@/components/StartHome";

/* LANDING — the owner's local-gigs prototype start screen, ordered
 * 2026-11-24: "Make sure the home page look exactly like this but
 * don't put marketplace put UltraVestra instead." The markup lives
 * in components/StartHome.tsx, shared with the signed-in Home
 * (/today), which opens with the same screen (owner order
 * 2026-11-24 ~19:39 CT: "Make home look like this. When someone
 * click home that's what they see"). */
export default function LandingPage() {
  return <StartHome />;
}
