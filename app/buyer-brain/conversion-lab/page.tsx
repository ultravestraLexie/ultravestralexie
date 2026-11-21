import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import ConversionLab from "@/components/ConversionLab";
import { LAB_DISCLAIMER, VERSION_STYLES } from "@/lib/conversionlab";

/* THE CONVERSION LAB — phase 3 of the owner's Five Buyer Test build
 * order (1 core simulation · 2 comparison dashboard · 3 Conversion
 * Lab · 4 Video Improvement Studio · 5 Save & Compare). After the
 * simulation tells a creator what is wrong, the Lab rewrites ONLY
 * the opening of their video four ways — Emotional, Problem-first,
 * Demonstration-first, Curiosity-driven — and runs each version past
 * the same five buyers. "Creators aren't just told what is wrong.
 * They get ideas for what to test next."
 *
 * Gating: middleware covers the /buyer-brain prefix, the parent
 * app/buyer-brain/layout.tsx runs the server guard for the whole
 * section, and this page calls requireSubscription itself as the
 * house second line of defense. */

export const metadata: Metadata = {
  title: "The Conversion Lab | UltraVestra",
  description:
    "UltraVestra's Conversion Lab: four openings for the same video — Emotional, Problem-first, Demonstration-first, Curiosity-driven — each tested against the same five simulated buyers. See which opening the panel responds to, who each version wins, and which one to test first.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/buyer-brain/conversion-lab",
  },
  openGraph: {
    title: "The Conversion Lab | UltraVestra",
    description:
      "Same five buyers. Four different openings. Ideas for what to test next — not just what is wrong.",
    url: "https://ultra-vestra.vercel.app/buyer-brain/conversion-lab",
    type: "article",
  },
};

export default async function ConversionLabPage() {
  await requireSubscription("/buyer-brain/conversion-lab");

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / INTELLIGENCE LAB
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          ULTRA VESTRA — THE FIVE BUYER TEST
        </div>

        <div className="mb-10">
          <h1 className="wow-title text-5xl md:text-7xl font-black tracking-tight">
            THE CONVERSION LAB
          </h1>

          <p className="text-xl md:text-2xl font-semibold text-gray-100 mt-5">
            Same five buyers. Four different openings.
          </p>

          <p className="text-gray-400 max-w-2xl mt-4 text-lg">
            The Five Buyer Test tells you what the panel thinks of your
            video. The Lab goes one step further: it rewrites only your
            opening — four different ways — and puts every version in
            front of the same five buyers, so you can see which door
            into your video each buyer walks through.
          </p>

          <p className="mt-5">
            <Link
              href="/buyer-brain"
              className="text-cyan-300 underline text-sm"
            >
              ← Back to the Five Buyer Test
            </Link>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {VERSION_STYLES.map((v) => (
            <div
              key={v.version}
              className="glass-card rounded-2xl bg-white/[.04] border border-white/10 p-5"
            >
              <div className="text-3xl font-bold text-cyan-400">
                {v.version}
              </div>
              <div className="text-gray-300 text-sm mt-2 font-semibold">
                {v.style}
              </div>
            </div>
          ))}
        </div>

        <ConversionLab />

        <p className="text-xs text-gray-500 text-center mt-12">
          {LAB_DISCLAIMER}
        </p>
      </div>
    </main>
  );
}
