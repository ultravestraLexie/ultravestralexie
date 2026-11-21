import { requireSubscription } from "@/lib/gate";

/* Server-side subscription guard for the Buyer Brain Simulator.
 * The page itself is the owner's client component, so the house
 * page guard (lib/gate.ts requireSubscription) runs here in the
 * server layout — the same two-layer pattern as every other gated
 * tool: middleware (lib/gate-paths.ts) first, server guard second. */
export default async function BuyerBrainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSubscription("/buyer-brain");
  return <>{children}</>;
}
