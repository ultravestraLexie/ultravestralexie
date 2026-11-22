"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// UltraVestra Command Center — the creator's own numbers from
// across the platform on one page: revenue pending and received,
// alerts since their last check, growth in motion, proposals out
// the door, their Passport and brief counts, and the size of the
// directory they fish in.
//
// HONESTY RULE (binding): every figure here is computed server-side
// from the creator's own stored rows (or the public directory
// count) by lib/command-center/aggregate.ts — this page renders the
// cards it is given and never derives a number of its own. A
// feature with nothing stored shows a true zero. The Creator Lab
// card carries no number at all: the Lab keeps no history, and the
// card says so instead of inventing one.
//
// All reads go through /api/command-center (session + subscription
// gated, owner-only, read-only). This page holds no direct database
// access and writes nothing.

type CommandCenterCard = {
  key: string;
  title: string;
  href: string;
  primary: string;
  secondary: string;
};

export default function CommandCenterPage() {
  const [cards, setCards] = useState<CommandCenterCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/command-center");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.error || "Your command center could not be loaded."
          );
        }
        setCards((data.cards ?? []) as CommandCenterCard[]);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Your command center could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / COMMAND CENTER
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          ULTRA VESTRA — COMMAND CENTER
        </div>

        <div className="mb-12">
          <div className="text-cyan-400 text-sm mb-3">
            EVERYTHING YOURS, IN ONE PLACE.
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            COMMAND
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500">
              CENTER.
            </span>
          </h1>

          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Your creator business at a glance — every number from your
            own UltraVestra records.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm mb-6">
            {error}
          </p>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="text-4xl animate-pulse mb-4">◈</div>
            <h3 className="text-xl font-bold">Loading your command center</h3>
            <p className="text-gray-400 mt-2">Gathering your numbers...</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className="block rounded-3xl border border-white/10 bg-[#111827] p-6 hover:border-fuchsia-400/40 transition"
              >
                <div className="text-cyan-400 text-xs tracking-widest mb-3">
                  {card.title.toUpperCase()}
                </div>
                <div className="text-3xl font-black tracking-tight break-words">
                  {card.primary}
                </div>
                <p className="text-gray-400 text-sm mt-2">{card.secondary}</p>
                <div className="text-fuchsia-300 text-sm font-bold mt-5">
                  Open →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
