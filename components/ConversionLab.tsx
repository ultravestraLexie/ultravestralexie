"use client";

import { useState } from "react";
import {
  LAB_DISCLAIMER,
  outcomeLabel,
  questionFor,
  styleFor,
  type LabReport,
  type LabVariant,
} from "@/lib/conversionlab";

/* THE CONVERSION LAB — the interactive tool.
 * One form (product, audience, price, current script) → one POST to
 * /api/buyer-brain/lab → four variant openings, each judged by the
 * same five buyers, plus the comparison: strongest version, who each
 * version wins, and the one test to run first. Everything shown is a
 * simulated buyer reaction — the owner's disclaimer rides on the
 * page and under the results. */

const buyerColors = [
  "from-fuchsia-500/20 to-transparent",
  "from-blue-500/20 to-transparent",
  "from-amber-500/20 to-transparent",
  "from-emerald-500/20 to-transparent",
  "from-violet-500/20 to-transparent",
];

const buyerIcons = ["♥", "◈", "⌕", "⚡", "✦"];

const versionAccents: Record<string, string> = {
  A: "text-fuchsia-300 border-fuchsia-400/40 bg-fuchsia-500/10",
  B: "text-cyan-300 border-cyan-400/40 bg-cyan-400/10",
  C: "text-violet-300 border-violet-400/40 bg-violet-500/10",
  D: "text-fuchsia-300 border-fuchsia-400/40 bg-fuchsia-500/10",
};

function ScoreCell({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] tracking-wider text-gray-400">
        <span>{label}</span>
        <span className="text-cyan-300">{value}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
        <div
          className="h-full bg-cyan-400 rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function VariantCard({
  variant,
  isStrongest,
}: {
  variant: LabVariant;
  isStrongest: boolean;
}) {
  return (
    <div className="glass-card rounded-3xl border border-white/10 bg-[#111827] p-6 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full border font-black ${versionAccents[variant.version] ?? versionAccents.A}`}
          >
            {variant.version}
          </span>
          <div>
            <div className="font-bold leading-tight">
              Version {variant.version}
            </div>
            <div className="text-sm text-gray-400">{variant.style}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] tracking-widest text-gray-400">
            PANEL AVERAGE
          </div>
          <div className="text-2xl font-black text-cyan-300">
            {variant.panelAverage}
            <span className="text-sm text-gray-500">/100</span>
          </div>
        </div>
      </div>

      {isStrongest && (
        <div className="mb-4 inline-block self-start rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[11px] tracking-widest text-cyan-300">
          ★ STRONGEST PANEL RESPONSE
        </div>
      )}

      <p className="text-lg font-semibold italic leading-relaxed mb-6">
        &ldquo;{variant.opening}&rdquo;
      </p>

      <div className="space-y-3 mt-auto">
        {variant.personas.map((buyer, i) => {
          const question = questionFor(buyer.name);
          return (
            <div
              key={buyer.name}
              className={`rounded-2xl border border-white/10 bg-gradient-to-r ${buyerColors[i % buyerColors.length]} bg-black/30 p-4`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-cyan-300">
                    {buyerIcons[i % buyerIcons.length]}
                  </span>
                  <span className="font-bold text-sm truncate">
                    {buyer.name}
                  </span>
                </div>
                <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] text-gray-300">
                  {outcomeLabel(buyer.outcome)}
                </span>
              </div>
              {question && (
                <p className="text-xs text-gray-500 italic mb-2">
                  &ldquo;{question}&rdquo;
                </p>
              )}
              <div className="grid grid-cols-3 gap-3 mb-2">
                <ScoreCell label="INTEREST" value={buyer.interestScore} />
                <ScoreCell label="TRUST" value={buyer.trustScore} />
                <ScoreCell label="DESIRE" value={buyer.desireScore} />
              </div>
              <p className="text-sm text-gray-300 italic">
                &ldquo;{buyer.oneLineReaction}&rdquo;
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ConversionLab() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [price, setPrice] = useState("");
  const [script, setScript] = useState("");
  const [report, setReport] = useState<LabReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runLab() {
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch("/api/buyer-brain/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          audience,
          price: price || "Not provided",
          script,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The lab run failed.");
      }

      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const strongest = report?.comparison.strongestVersion;

  return (
    <div>
      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
        <div className="text-cyan-400 text-xs tracking-widest mb-3">
          THE LAB BENCH
        </div>

        <h2 className="text-2xl font-bold mb-6">
          Bring the video you already have.
        </h2>

        <div className="grid md:grid-cols-2 gap-5">
          <label className="text-sm text-gray-300">
            Product or service
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="What are you selling?"
              className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
            />
          </label>

          <label className="text-sm text-gray-300">
            Target audience
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Who would buy this?"
              className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
            />
          </label>

          <label className="text-sm text-gray-300">
            Product price
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Example: $29.99"
              className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
            />
          </label>
        </div>

        <label className="block mt-7 text-sm text-gray-300">
          Your current video script
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={8}
            maxLength={8000}
            placeholder="Paste your entire video script here. The Lab rewrites only the opening — four different ways — and keeps the rest of your video exactly as it is..."
            className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 resize-y text-white"
          />
          <span className="block text-right text-xs text-gray-500 mt-2">
            {script.length}/8000
          </span>
        </label>

        {error && (
          <p role="alert" className="text-red-400 text-sm mt-4">
            {error}
          </p>
        )}

        <button
          onClick={runLab}
          disabled={
            loading ||
            product.trim().length < 2 ||
            audience.trim().length < 2 ||
            script.trim().length < 10
          }
          className="neon-btn mt-6 w-full rounded-xl p-5 font-bold text-white disabled:opacity-40 transition"
          style={{
            background: "linear-gradient(92deg, #a855f7, #d946ef)",
          }}
        >
          {loading
            ? "WRITING FOUR OPENINGS · CALLING THE FIVE BUYERS..."
            : "RUN THE CONVERSION LAB →"}
        </button>
      </section>

      {loading && (
        <div className="text-center py-16">
          <div className="text-4xl animate-pulse mb-4">◈</div>
          <h3 className="text-xl font-bold">The panel is watching</h3>
          <p className="text-gray-400 mt-2">
            Four openings, five buyers each — comparing their reactions...
          </p>
        </div>
      )}

      {report && (
        <section className="mt-12 space-y-8">
          <div>
            <div className="text-cyan-400 text-xs tracking-widest">
              LAB RESULTS
            </div>
            <h2 className="text-3xl md:text-4xl font-black mt-3">
              FOUR OPENINGS. FIVE BUYERS EACH.
            </h2>
            <p className="text-gray-400 mt-3 max-w-2xl">
              The same video, opened four different ways. Only the opening
              changes — everything after it is your script, untouched.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {report.variants.map((variant) => (
              <VariantCard
                key={variant.version}
                variant={variant}
                isStrongest={variant.version === strongest}
              />
            ))}
          </div>

          {/* COMPARISON STRIP */}
          <div className="rounded-3xl border border-cyan-400/30 bg-cyan-400/[.05] p-6 md:p-8">
            <div className="text-cyan-300 text-xs tracking-widest mb-5">
              THE COMPARISON
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-[11px] tracking-widest text-cyan-300 mb-2">
                  STRONGEST VERSION
                </div>
                <div className="text-xl font-black mb-2">
                  Version {report.comparison.strongestVersion} —{" "}
                  {styleFor(report.comparison.strongestVersion)}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {report.comparison.strongestWhy}
                </p>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/[.07] p-5">
                <div className="text-[11px] tracking-widest text-fuchsia-300 mb-2">
                  TEST THIS FIRST
                </div>
                <div className="text-xl font-black mb-2">
                  Version {report.comparison.recommendedFirstTest} —{" "}
                  {styleFor(report.comparison.recommendedFirstTest)}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {report.comparison.recommendedReasoning}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-[11px] tracking-widest text-cyan-300 mb-3">
                WHO EACH VERSION WINS
              </div>
              <div className="space-y-3">
                {report.comparison.wins.map((win) => (
                  <div key={win.version} className="flex gap-3 text-sm">
                    <span
                      className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full border font-black text-xs ${versionAccents[win.version] ?? versionAccents.A}`}
                    >
                      {win.version}
                    </span>
                    <p className="text-gray-300 leading-relaxed">
                      <strong className="text-white">{win.buyer}</strong>
                      {" — "}
                      {win.why}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-5">{LAB_DISCLAIMER}</p>
          </div>

          <button
            onClick={() => {
              setReport(null);
              setScript("");
            }}
            className="w-full border border-white/20 rounded-xl p-4 hover:bg-white/5"
          >
            RUN A NEW LAB TEST
          </button>
        </section>
      )}
    </div>
  );
}
