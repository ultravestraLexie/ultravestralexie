"use client";

import { useState } from "react";

const buyerColors = [
  "from-fuchsia-500/20 to-transparent",
  "from-blue-500/20 to-transparent",
  "from-amber-500/20 to-transparent",
  "from-emerald-500/20 to-transparent",
  "from-violet-500/20 to-transparent",
];

const buyerIcons = ["♥", "◈", "⌕", "⚡", "✦"];

const GOAL_OPTIONS = [
  { value: "", label: "No goal — balanced" },
  { value: "audience_growth", label: "Audience growth" },
  { value: "credibility", label: "Credibility" },
  { value: "engagement", label: "Engagement" },
  { value: "affiliate_clicks", label: "Affiliate clicks" },
  { value: "product_conversions", label: "Product conversions" },
  { value: "brand_building", label: "Brand building" },
] as const;

type EvidenceRef = {
  kind: "inventory_element" | "script_quote" | "omission" | "inference";
  elementId?: string;
  quote?: string;
  detail: string;
  absenceStatus?: "absent_confirmed" | "not_found_extraction_may_have_missed";
};

type Improvement = {
  dimension: string;
  problem: string;
  evidence: string;
  whyItMatters: string;
  concreteChange: string;
  test: { action: string; metric: string };
};

type DimensionFinding = {
  dimension: string;
  rating: "strong" | "adequate" | "weak" | "insufficient_evidence";
  summary: string;
  evidence: EvidenceRef[];
  improvement: Improvement | null;
};

type Report = {
  overallAnalysis: string;
  buyerSummary: string;
  personas: {
    name: string;
    personality: string;
    firstReaction: string;
    innerThought: string;
    interestScore: number;
    trustScore: number;
    desireScore: number;
    biggestObjection: string;
    missingEvidence: string;
    improvement: string;
    outcome: string;
  }[];
  biggestConversionBarrier: string;
  strongestElement: string;
  improvedHook: string;
  improvedScript: string;
  proofToShow: string[];
  experimentPlan: string[];
  finalAdvice: string;
  dimensions: DimensionFinding[];
  topImprovements: Improvement[];
  goalApplied: string;
  headlineFraming: string;
};

const RATING_STYLES: Record<DimensionFinding["rating"], string> = {
  strong: "border-emerald-400/40 text-emerald-300",
  adequate: "border-cyan-400/40 text-cyan-300",
  weak: "border-amber-400/40 text-amber-300",
  insufficient_evidence: "border-white/20 text-gray-400",
};

const RATING_LABELS: Record<DimensionFinding["rating"], string> = {
  strong: "STRONG",
  adequate: "ADEQUATE",
  weak: "WEAK",
  insufficient_evidence: "INSUFFICIENT EVIDENCE",
};

function EvidenceList({ evidence }: { evidence: EvidenceRef[] }) {
  return (
    <ul className="space-y-2">
      {evidence.map((ref, i) => (
        <li key={i} className="text-sm text-gray-300 flex gap-2">
          <span className="text-cyan-400 shrink-0">✦</span>
          <span>
            {ref.kind === "inventory_element" && (
              <>
                <span className="text-cyan-300">Proof {ref.elementId}: </span>
                {ref.detail}
              </>
            )}
            {ref.kind === "script_quote" && (
              <>
                <span className="italic text-gray-200">
                  &ldquo;{ref.quote}&rdquo;
                </span>{" "}
                — {ref.detail}
              </>
            )}
            {ref.kind === "omission" && (
              <>
                {ref.detail}{" "}
                <span className="text-xs text-gray-500">
                  {ref.absenceStatus === "absent_confirmed"
                    ? "(confirmed absent from the script)"
                    : "(not found — the extraction may have missed it)"}
                </span>
              </>
            )}
            {ref.kind === "inference" && (
              <>
                <span className="text-gray-400">Inference: </span>
                {ref.detail}
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ImprovementCard({
  improvement,
  index,
}: {
  improvement: Improvement;
  index: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
      <div className="text-[11px] tracking-widest text-cyan-300 mb-2">
        IMPROVEMENT 0{index + 1} — {improvement.dimension.toUpperCase()}
      </div>
      <div className="space-y-3 text-sm">
        <p>
          <strong className="text-gray-100">What isn&rsquo;t working:</strong>{" "}
          <span className="text-gray-300">{improvement.problem}</span>
        </p>
        <p>
          <strong className="text-gray-100">The evidence:</strong>{" "}
          <span className="text-gray-300">{improvement.evidence}</span>
        </p>
        <p>
          <strong className="text-gray-100">Why it matters:</strong>{" "}
          <span className="text-gray-300">{improvement.whyItMatters}</span>
        </p>
        <p>
          <strong className="text-gray-100">The change:</strong>{" "}
          <span className="text-gray-300">{improvement.concreteChange}</span>
        </p>
        <p>
          <strong className="text-gray-100">How to test it:</strong>{" "}
          <span className="text-gray-300">{improvement.test.action}</span>
        </p>
        <p>
          <strong className="text-gray-100">What to measure:</strong>{" "}
          <span className="text-gray-300">{improvement.test.metric}</span>
        </p>
      </div>
    </div>
  );
}

export default function CreatorLabPage() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [price, setPrice] = useState("");
  const [script, setScript] = useState("");
  const [stage, setStage] = useState("cold");
  const [goal, setGoal] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(0);

  async function analyze() {
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch("/api/creator-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          audience,
          price: price || "Not provided",
          script,
          stage,
          ...(goal ? { goal } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      setReport(data.report);
      setExpanded(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / INTELLIGENCE LAB
        </div>

        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          UNDERSTAND THE VIDEO. FIX THE VIDEO.
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          ULTRA VESTRA — CREATOR LAB
        </div>

        <div className="mb-12">
          <div className="text-cyan-400 text-sm mb-3">
            THE VIDEO IMPROVEMENT STUDIO
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            MAKE THE VIDEO
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
              WORK HARDER.
            </span>
          </h1>

          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Five simulated buyers react to your script, ten quality
            dimensions are judged on evidence, and you leave with the
            exact changes most worth testing next.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          {[
            ["05", "Buyer personalities"],
            ["10", "Quality dimensions"],
            ["03", "Priority improvements"],
          ].map(([number, label]) => (
            <div
              key={label}
              className="rounded-2xl bg-white/[.04] border border-white/10 p-5"
            >
              <div className="text-3xl font-bold text-cyan-400">{number}</div>
              <div className="text-gray-400 text-sm mt-2">{label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          <div className="text-cyan-400 text-xs tracking-widest mb-4">
            THE EXPERIENCE
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              "Paste one video script.",
              "Enter the product, price, and target audience.",
              "Pick the goal this video has to serve.",
              "See the buyer panel and the ten dimension findings.",
              "Get the top improvements, each with a test to run.",
            ].map((step, i) => (
              <div key={step} className="flex gap-3">
                <span className="text-cyan-400 font-bold shrink-0">
                  0{i + 1}
                </span>
                <span className="text-sm text-gray-300">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
          <div className="text-cyan-400 text-xs tracking-widest mb-3">
            MISSION 01
          </div>

          <h2 className="text-2xl font-bold mb-6">
            Give the lab a video to improve.
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

            <label className="text-sm text-gray-300">
              Buyer&rsquo;s starting mindset
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
              >
                <option value="cold">Cold — doesn&rsquo;t know the product</option>
                <option value="curious">Curious — interested but unsure</option>
                <option value="skeptical">
                  Skeptical — doesn&rsquo;t trust the pitch
                </option>
                <option value="ready">Ready — considering purchasing</option>
              </select>
            </label>

            <label className="text-sm text-gray-300 md:col-span-2">
              What is this video for?
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
              >
                {GOAL_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="block text-xs text-gray-500 mt-2">
                The goal only re-ranks your top improvements — the findings
                themselves never change with it.
              </span>
            </label>
          </div>

          <label className="block mt-7 text-sm text-gray-300">
            Your video script, hook or sales pitch
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={8}
              maxLength={8000}
              placeholder="Paste your entire video script here. Include your opening hook, product demonstration, benefits and call to action..."
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
            onClick={analyze}
            disabled={
              loading ||
              product.trim().length < 2 ||
              audience.trim().length < 2 ||
              script.trim().length < 10
            }
            className="mt-6 w-full rounded-xl p-5 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
          >
            {loading ? "RUNNING THE LAB..." : "IMPROVE MY VIDEO →"}
          </button>
        </section>

        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl animate-pulse mb-4">◈</div>
            <h3 className="text-xl font-bold">Running the Creator Lab</h3>
            <p className="text-gray-400 mt-2">
              Five buyers, ten dimensions, one improvement plan...
            </p>
          </div>
        )}

        {report && (
          <section className="mt-12 space-y-8">
            <div>
              <div className="text-cyan-400 text-xs tracking-widest">
                MISSION 02 / CREATOR LAB REPORT
              </div>
              <h2 className="text-3xl md:text-4xl font-black mt-3">
                WHAT THE AUDIENCE EXPERIENCES
              </h2>
              <p className="text-gray-400 mt-3">{report.headlineFraming}</p>
              <p className="text-gray-400 mt-2">{report.buyerSummary}</p>
            </div>

            {/* THE FIVE BUYERS */}
            <div>
              <div className="text-cyan-400 text-xs tracking-widest mb-3">
                THE FIVE BUYERS
              </div>
              <div className="space-y-4">
                {report.personas.map((buyer, i) => (
                  <div
                    key={buyer.name}
                    className={`rounded-2xl border border-white/10 bg-gradient-to-r ${buyerColors[i]} bg-[#111827] overflow-hidden`}
                  >
                    <button
                      onClick={() =>
                        setExpanded(expanded === i ? null : i)
                      }
                      className="w-full p-5 text-left flex justify-between items-center gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl text-cyan-300">
                          {buyerIcons[i]}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{buyer.name}</h3>
                          <p className="text-sm text-gray-400">
                            {buyer.personality}
                          </p>
                        </div>
                      </div>
                      <span className="text-cyan-300 text-xl">
                        {expanded === i ? "−" : "+"}
                      </span>
                    </button>

                    {expanded === i && (
                      <div className="px-5 pb-6 space-y-5">
                        <div className="p-4 rounded-xl bg-black/30">
                          <div className="text-xs text-cyan-300 mb-2">
                            FIRST REACTION
                          </div>
                          {buyer.firstReaction}
                        </div>

                        <div className="p-4 rounded-xl bg-black/30">
                          <div className="text-xs text-cyan-300 mb-2">
                            INSIDE THEIR HEAD
                          </div>
                          <p className="italic text-gray-200">
                            &quot;{buyer.innerThought}&quot;
                          </p>
                        </div>

                        {[
                          ["INTEREST", buyer.interestScore],
                          ["TRUST", buyer.trustScore],
                          ["DESIRE", buyer.desireScore],
                        ].map(([label, score]) => (
                          <div key={label as string}>
                            <div className="flex justify-between text-xs mb-2">
                              <span>{label}</span>
                              <span className="text-cyan-300">{score}/10</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-400 rounded-full"
                                style={{ width: `${Number(score) * 10}%` }}
                              />
                            </div>
                          </div>
                        ))}

                        <div className="space-y-3 text-sm">
                          <p>
                            <strong>Biggest objection:</strong>{" "}
                            {buyer.biggestObjection}
                          </p>
                          <p>
                            <strong>Missing evidence:</strong>{" "}
                            {buyer.missingEvidence}
                          </p>
                          <p>
                            <strong>What to change:</strong> {buyer.improvement}
                          </p>
                          <p>
                            <strong>Possible next action:</strong>{" "}
                            {buyer.outcome.replaceAll("_", " ")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* THE TEN DIMENSIONS */}
            <div>
              <div className="text-cyan-400 text-xs tracking-widest mb-3">
                THE TEN DIMENSIONS
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {report.dimensions.map((finding) => (
                  <div
                    key={finding.dimension}
                    className="rounded-2xl border border-white/10 bg-white/[.04] p-5"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="font-bold">{finding.dimension}</div>
                      <span
                        className={`text-[11px] tracking-widest border rounded-full px-3 py-1 ${RATING_STYLES[finding.rating]}`}
                      >
                        {RATING_LABELS[finding.rating]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">
                      {finding.summary}
                    </p>
                    <EvidenceList evidence={finding.evidence} />
                  </div>
                ))}
              </div>
            </div>

            {/* TOP IMPROVEMENTS */}
            {report.topImprovements.length > 0 && (
              <div>
                <div className="text-cyan-400 text-xs tracking-widest mb-3">
                  YOUR TOP IMPROVEMENTS
                </div>
                <div className="space-y-3">
                  {report.topImprovements.map((improvement, i) => (
                    <ImprovementCard
                      key={`${improvement.dimension}-${i}`}
                      improvement={improvement}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ["STRONGEST ELEMENT", report.strongestElement],
                ["BIGGEST BARRIER", report.biggestConversionBarrier],
              ].map(([title, content]) => (
                <div
                  key={title}
                  className="bg-white/[.04] border border-white/10 rounded-2xl p-5"
                >
                  <div className="text-cyan-400 text-xs tracking-widest mb-3">
                    {title}
                  </div>
                  <p className="text-gray-200">{content}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/[.06] p-6">
              <div className="text-cyan-300 text-xs tracking-widest mb-3">
                MISSION 03 / REBUILD THE PITCH
              </div>

              <h3 className="text-2xl font-bold mb-3">A stronger opening</h3>

              <p className="text-xl font-semibold mb-4">
                &quot;{report.improvedHook}&quot;
              </p>

              <button
                onClick={() => copy(report.improvedHook)}
                className="text-sm text-cyan-300 underline"
              >
                Copy hook
              </button>

              <h3 className="text-xl font-bold mt-8 mb-3">
                Improved sales script
              </h3>

              <p className="text-gray-300 whitespace-pre-wrap leading-7">
                {report.improvedScript}
              </p>

              <button
                onClick={() => copy(report.improvedScript)}
                className="mt-4 px-5 py-3 rounded-xl bg-cyan-400 text-black font-bold"
              >
                Copy improved script
              </button>
            </div>

            <div className="rounded-2xl bg-[#111827] border border-white/10 p-6">
              <h3 className="text-xl font-bold mb-5">
                What should the creator show?
              </h3>

              {report.proofToShow.map((item, i) => (
                <div key={i} className="flex gap-3 mb-4 text-gray-300">
                  <span className="text-cyan-400">✦</span>
                  {item}
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-[#111827] border border-white/10 p-6">
              <h3 className="text-xl font-bold mb-5">Your experiment plan</h3>

              {report.experimentPlan.map((item, i) => (
                <div key={i} className="flex gap-3 mb-4">
                  <span className="text-cyan-400 font-bold">0{i + 1}</span>
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white/[.04] p-6">
              <div className="text-cyan-400 text-xs tracking-widest mb-3">
                FINAL INTELLIGENCE
              </div>
              <p className="text-gray-200 leading-7">
                {report.overallAnalysis}
              </p>
              <p className="mt-5 font-semibold text-cyan-300">
                {report.finalAdvice}
              </p>
            </div>

            <p className="text-xs text-gray-500 text-center">
              These are simulated buyer reactions, not real customer research
              or guaranteed sales predictions.
            </p>

            <button
              onClick={() => {
                setReport(null);
                setScript("");
              }}
              className="w-full border border-white/20 rounded-xl p-4 hover:bg-white/5"
            >
              START A NEW VIDEO
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
