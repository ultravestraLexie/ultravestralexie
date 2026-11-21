import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import VideoTest from "@/components/VideoTest";

/* THE FIVE BUYER TEST — VIDEO MODE.
 *
 * The owner's distinction: the core Five Buyer Test is a SCRIPT
 * simulator. This mode takes the creator's ACTUAL VIDEO — frames
 * are sampled in the browser (the file never leaves the device) and
 * five simulated buyers react to the footage itself: the opening
 * seconds, the demonstration, the captions, the pacing, and the
 * call to action. Honest about its limits: sampled frames + the
 * supplied script, never face-emotion tracking, never retention
 * prediction, never audio analysis.
 *
 * Gate: members-only like the rest of /buyer-brain — the
 * subscription middleware prefix and the parent buyer-brain layout
 * both cover this subpath; requireSubscription is repeated here as
 * the house second layer. */

export const metadata: Metadata = {
  title: "The Five Buyer Test — Video Mode | UltraVestra",
  description:
    "Put your actual video in front of five simulated buyers. UltraVestra's Five Buyer Test — Video Mode samples frames from your video in your browser and shows you the visual read — opening seconds, demonstration, captions, pacing, call to action — plus five different buyer reactions. Simulated reactions, not real customer research or guaranteed sales predictions.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/buyer-brain/video-test",
  },
  openGraph: {
    title: "The Five Buyer Test — Video Mode | UltraVestra",
    description:
      "Your video, in front of five buyers — frames and all. See what the footage itself does to five different buyer minds.",
    url: "https://ultra-vestra.vercel.app/buyer-brain/video-test",
    type: "website",
  },
};

export default async function VideoTestPage() {
  await requireSubscription("/buyer-brain/video-test");
  return (
    <main className="min-h-screen bg-[#020008] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / INTELLIGENCE LAB
        </div>

        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          THE SAME VIDEO. FIVE DIFFERENT BUYERS.
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          ULTRA VESTRA — THE FIVE BUYER TEST
        </div>

        <div className="mb-10">
          <div className="text-cyan-400 text-sm mb-3">VIDEO MODE</div>

          <h1 className="wow-title text-5xl md:text-7xl font-black tracking-tight">
            THE FIVE BUYER TEST — VIDEO MODE
          </h1>

          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Your video, in front of five buyers — frames and all. A script
            can&rsquo;t tell us everything about a video, so this time the
            panel watches the footage itself.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            href="/buyer-brain"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-cyan-400/60 hover:text-cyan-300 transition"
          >
            ← Script mode — paste a script instead
          </Link>
          <Link
            href="/buyer-brain/conversion-lab"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-fuchsia-400/60 hover:text-fuchsia-300 transition"
          >
            Conversion Lab — test four openings →
          </Link>
        </div>

        <VideoTest />
      </div>
    </main>
  );
}
