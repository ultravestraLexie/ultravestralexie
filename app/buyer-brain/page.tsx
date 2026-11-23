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
};

type Persona = Report["personas"][number];

/* STATIC PERSONA PROFILES — who each buyer is, the core question
 * they ask (the owner's canon wording), what they care about, and
 * what makes them decide. Written once from each persona's
 * psychology; never fabricated per run. */
const PERSONA_PROFILES: {
  match: string;
  question: string;
  who: string;
  cares: string;
  decides: string;
  budget: string;
}[] = [
  {
    match: "emotional",
    question: "Will this make my life better?",
    who: "Buys the feeling first — the product is a path to a better version of their life.",
    cares: "Story, feeling, identity, transformation — they want to see themselves in the outcome.",
    decides: "Emotional payoff, backed by honest social proof.",
    budget: "Price is secondary to the payoff they feel.",
  },
  {
    match: "logical",
    question: "Does this actually work, and is it worth the price?",
    who: "Compares before they commit — value has to survive the math.",
    cares: "Specs, comparisons, value math, durability — what it does, and what it costs over time.",
    decides: "Evidence, plus a price that feels justified.",
    budget: "Price must be justified by evidence and value for money.",
  },
  {
    match: "skeptical",
    question: "Why should I believe you?",
    who: "Assumes every claim is marketing until it is proven otherwise.",
    cares: "Proof, reviews, guarantees, the fine print — everything a pitch might be hiding.",
    decides: "When the risk feels removed.",
    budget: "Price doesn't matter until the risk feels removed.",
  },
  {
    match: "impulse",
    question: "Do I want this right now?",
    who: "Decides in seconds — if it is not instantly clear, it is gone.",
    cares: "Novelty, simplicity, immediate benefit — the payoff has to land now.",
    decides: "Fast, when friction is low.",
    budget: "Price friction kills the moment — simple and clear wins.",
  },
  {
    match: "conscious",
    question: "Do I really need this, and is it the right choice?",
    who: "Buys deliberately — every purchase has to earn its place.",
    cares: "Ingredients, sourcing, sustainability, long-term value — what it is, and what it costs the world.",
    decides: "Alignment with their values, plus transparency.",
    budget: "Pays more when values align; walks away when they don't.",
  },
];

function profileFor(name: string) {
  const n = name.toLowerCase();
  return PERSONA_PROFILES.find((p) => n.includes(p.match));
}

/* PER-BUYER DIAGNOSTIC LENSES (owner's canon) — each buyer's card
 * is read through one lens, surfaced from the card's own fields.
 * The Emotional Buyer has no separate lens: its card already leads
 * with its core question and first reaction. */
function lensFor(buyer: Persona): { lens: string; value: string } | null {
  const n = buyer.name.toLowerCase();
  if (n.includes("logical"))
    return { lens: "What information is missing", value: buyer.missingEvidence };
  if (n.includes("skeptical"))
    return { lens: "What proof is needed", value: buyer.missingEvidence };
  if (n.includes("impulse"))
    return { lens: "What grabs immediate attention", value: buyer.firstReaction };
  if (n.includes("conscious"))
    return { lens: "What could stop the purchase", value: buyer.biggestObjection };
  return null;
}

/* THE THREE REVEALS — strongest buyer, biggest lost sale, next
 * improvement. All computed from the returned report. Note: the
 * API's outcome value for a leaving buyer is "likely_to_leave". */
function ThreeReveals({ report }: { report: Report }) {
  const personas = report.personas;
  if (!personas.length) return null;

  const strongest = personas.reduce(
    (b, p) =>
      p.interestScore + p.desireScore > b.interestScore + b.desireScore ? p : b,
    personas[0]
  );
  const leavers = personas.filter((p) => p.outcome === "likely_to_leave");
  const lostPool = leavers.length ? leavers : personas;
  const lost = lostPool.reduce(
    (b, p) =>
      p.interestScore + p.trustScore < b.interestScore + b.trustScore ? p : b,
    lostPool[0]
  );
  const strongestProf = profileFor(strongest.name);

  return (
    <div>
      <div className="text-cyan-400 text-xs tracking-widest mb-3">
        THE THREE REVEALS
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/[.06] p-5">
          <div className="text-[11px] tracking-widest text-cyan-300 mb-2">
            YOUR STRONGEST BUYER
          </div>
          <div className="font-bold mb-1">{strongest.name}</div>
          {strongestProf && (
            <p className="text-xs text-gray-500 italic mb-2">
              &ldquo;{strongestProf.question}&rdquo;
            </p>
          )}
          <p className="text-sm text-gray-300 italic">
            &ldquo;{strongest.innerThought}&rdquo;
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <div className="text-[11px] tracking-widest text-cyan-300 mb-2">
            YOUR BIGGEST LOST SALE
          </div>
          <div className="font-bold mb-1">{lost.name}</div>
          <p className="text-sm text-gray-300">{lost.biggestObjection}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <div className="text-[11px] tracking-widest text-cyan-300 mb-2">
            YOUR NEXT IMPROVEMENT
          </div>
          <p className="text-sm text-gray-300 mb-2">
            {report.biggestConversionBarrier}
          </p>
          <p className="text-sm text-gray-300">{lost.improvement}</p>
        </div>
      </div>
    </div>
  );
}

/* REACTION RADAR — one buyer's simulated Interest / Trust / Desire
 * as a three-axis radar (inline SVG, no dependencies). */
function ReactionRadar({
  interest,
  trust,
  desire,
}: {
  interest: number;
  trust: number;
  desire: number;
}) {
  const cx = 70;
  const cy = 62;
  const r = 42;
  const axes = [
    { label: "INTEREST", value: interest, angle: -90 },
    { label: "TRUST", value: trust, angle: 150 },
    { label: "DESIRE", value: desire, angle: 30 },
  ];
  const clamp = (v: number) => Math.max(0, Math.min(10, v)) / 10;
  const point = (angle: number, frac: number) => {
    const rad = (angle * Math.PI) / 180;
    return [cx + r * frac * Math.cos(rad), cy + r * frac * Math.sin(rad)] as const;
  };
  const ring = (frac: number) =>
    axes.map((a) => point(a.angle, frac).join(",")).join(" ");
  const shape = axes
    .map((a) => point(a.angle, clamp(a.value)).join(","))
    .join(" ");
  return (
    <div className="flex items-center gap-4">
      <svg width="140" height="124" viewBox="0 0 140 124" className="shrink-0" aria-label="Simulated reaction radar">
        <polygon points={ring(1)} fill="none" stroke="rgba(255,255,255,0.15)" />
        <polygon points={ring(0.5)} fill="none" stroke="rgba(255,255,255,0.08)" />
        {axes.map((a) => {
          const [x, y] = point(a.angle, 1);
          return (
            <line key={a.label} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" />
          );
        })}
        <polygon points={shape} fill="rgba(34,211,238,0.25)" stroke="#22d3ee" strokeWidth="1.5" />
        {axes.map((a) => {
          const [x, y] = point(a.angle, clamp(a.value));
          return <circle key={a.label} cx={x} cy={y} r="2.5" fill="#22d3ee" />;
        })}
        {axes.map((a) => {
          const [x, y] = point(a.angle, 1.3);
          return (
            <text key={a.label} x={x} y={y + 3} textAnchor="middle" fontSize="8" fill="#9ca3af">
              {a.label}
            </text>
          );
        })}
      </svg>
      <div>
        <div className="text-xs text-cyan-300 mb-1">SIMULATED REACTION</div>
        <p className="text-xs text-gray-500">
          Interest · Trust · Desire — this buyer&rsquo;s simulated reaction to your script.
        </p>
      </div>
    </div>
  );
}

/* PANEL VERDICT — the signature strip. Maps the five returned
 * personas to the owner's five questions, computed deterministically
 * from the simulation's own data (no extra API call). A buyer may
 * appear under more than one verdict. */
function PanelVerdict({ personas }: { personas: Persona[] }) {
  if (!personas.length) return null;

  const extreme = (pick: (p: Persona) => number, dir: "max" | "min") =>
    personas.reduce(
      (best, p) => ((dir === "max" ? pick(p) > pick(best) : pick(p) < pick(best)) ? p : best),
      personas[0]
    );

  const pricey =
    personas.find((p) => /price|cost|expensive|value/i.test(p.biggestObjection)) ??
    personas.find((p) => p.name === "Logical Buyer");

  const consideringPool = personas.filter((p) => p.outcome === "considering_purchase");
  const considering = consideringPool.length
    ? consideringPool.reduce(
        (best, p) =>
          p.interestScore + p.desireScore > best.interestScore + best.desireScore ? p : best,
        consideringPool[0]
      )
    : undefined;

  const verdicts = (
    [
      { label: "ATTRACTED IMMEDIATELY", buyer: extreme((p) => p.interestScore, "max") },
      { label: "NEEDS MORE PROOF", buyer: extreme((p) => p.trustScore, "min") },
      { label: "THINKS IT'S TOO EXPENSIVE", buyer: pricey },
      { label: "DOESN'T UNDERSTAND THE BENEFIT", buyer: extreme((p) => p.desireScore, "min") },
      { label: "CONSIDERING PURCHASE", buyer: considering },
    ] as { label: string; buyer?: Persona }[]
  ).filter((v): v is { label: string; buyer: Persona } => Boolean(v.buyer));

  if (!verdicts.length) return null;

  const avg = (pick: (p: Persona) => number) =>
    Math.round(personas.reduce((s, p) => s + pick(p), 0) / personas.length);
  const outcomeText: Record<string, string> = {
    considering_purchase: "considering purchase",
    likely_to_leave: "likely to scroll away",
    likely_to_continue: "likely to keep watching",
    needs_more_information: "needs more information",
  };
  const outcomeCounts = personas.reduce<Record<string, number>>((m, p) => {
    m[p.outcome] = (m[p.outcome] ?? 0) + 1;
    return m;
  }, {});
  const outcomeLine = Object.entries(outcomeCounts)
    .map(([k, n]) => `${n} of ${personas.length} ${outcomeText[k] ?? k.replaceAll("_", " ")}`)
    .join(" · ");

  return (
    <div>
      <div className="text-cyan-400 text-xs tracking-widest mb-3">
        PANEL VERDICT
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {verdicts.map((v) => {
          const prof = profileFor(v.buyer.name);
          return (
            <div
              key={v.label}
              className="rounded-2xl border border-white/10 bg-white/[.04] p-4"
            >
              <div className="text-[11px] tracking-widest text-cyan-300 mb-2">
                {v.label}
              </div>
              <div className="font-bold text-sm mb-1">{v.buyer.name}</div>
              {prof && (
                <p className="text-xs text-gray-500 italic mb-2">
                  &ldquo;{prof.question}&rdquo;
                </p>
              )}
              <p className="text-sm text-gray-400 italic">
                &ldquo;{v.buyer.innerThought}&rdquo;
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        The panel&rsquo;s verdict — a summary of the simulation, not real customers.
      </p>

      {/* PANEL SUMMARY — aggregates from this simulation only */}
      <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 mt-4">
        <div className="text-[11px] tracking-widest text-cyan-300 mb-3">
          PANEL SUMMARY
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <span className="text-gray-300">
            Average interest <strong className="text-cyan-300">{avg((p) => p.interestScore)}/10</strong>
          </span>
          <span className="text-gray-300">
            Average trust <strong className="text-cyan-300">{avg((p) => p.trustScore)}/10</strong>
          </span>
          <span className="text-gray-300">
            Average desire <strong className="text-cyan-300">{avg((p) => p.desireScore)}/10</strong>
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-3">{outcomeLine}</p>
        <p className="text-xs text-gray-500 mt-2">
          Simulation summary — averages and outcomes from this simulated panel only, not real-world rates.
        </p>
      </div>
    </div>
  );
}

export default function BuyerBrainPage() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [price, setPrice] = useState("");
  const [script, setScript] = useState("");
  const [stage, setStage] = useState("cold");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(0);

  async function analyze() {
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch("/api/buyer-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          audience,
          price: price || "Not provided",
          script,
          stage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      setReport(data.report);
      setExpanded(0);

    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong."
      );
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
          THE SAME VIDEO. FIVE DIFFERENT BUYERS.
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          ULTRA VESTRA — THE FIVE BUYER TEST
        </div>

        <div className="mb-12">
          <div className="text-cyan-400 text-sm mb-3">
            THE BUYER PSYCHOLOGY ENGINE
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            INSIDE THE
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
              BUYER'S MIND.
            </span>
          </h1>

          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Five different minds. One sales message.
            Discover what attracts, convinces and makes
            potential customers hesitate.
          </p>

          <div className="mt-6 max-w-xl rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3">
            <p className="text-amber-300 text-xs font-bold tracking-widest">
              SIMULATED BUYERS — NOT REAL CUSTOMER RESEARCH
            </p>
            <p className="text-gray-300 text-sm mt-1">
              The five buyers are AI-generated perspectives built to
              pressure-test your message. Use their reactions as informed
              opinion to test against — never as market evidence.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          {[
            ["05", "Buyer personalities"],
            ["03", "Psychology scores"],
            ["01", "Sales strategy"],
          ].map(([number, label]) => (
            <div key={label}
              className="rounded-2xl bg-white/[.04] border border-white/10 p-5">
              <div className="text-3xl font-bold text-cyan-400">
                {number}
              </div>
              <div className="text-gray-400 text-sm mt-2">{label}</div>
            </div>
          ))}
        </div>

        {/* THE EXPERIENCE — his five steps, verbatim */}
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          <div className="text-cyan-400 text-xs tracking-widest mb-4">
            THE EXPERIENCE
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              "Upload or paste one video script.",
              "Enter the product, price, and target audience.",
              "Run the five-buyer simulation.",
              "See how each buyer responds differently.",
              "Get specific changes that could make the video more persuasive.",
            ].map((step, i) => (
              <div key={step} className="flex gap-3">
                <span className="text-cyan-400 font-bold shrink-0">0{i + 1}</span>
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
            Give the simulator a product.
          </h2>

          <div className="grid md:grid-cols-2 gap-5">

            <label className="text-sm text-gray-300">
              Product or service
              <input
                value={product}
                onChange={e => setProduct(e.target.value)}
                placeholder="What are you selling?"
                className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
              />
            </label>

            <label className="text-sm text-gray-300">
              Target audience
              <input
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="Who would buy this?"
                className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
              />
            </label>

            <label className="text-sm text-gray-300">
              Product price
              <input
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Example: $29.99"
                className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
              />
            </label>

            <label className="text-sm text-gray-300">
              Buyer's starting mindset
              <select
                value={stage}
                onChange={e => setStage(e.target.value)}
                className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
              >
                <option value="cold">Cold — doesn't know the product</option>
                <option value="curious">Curious — interested but unsure</option>
                <option value="skeptical">Skeptical — doesn't trust the pitch</option>
                <option value="ready">Ready — considering purchasing</option>
              </select>
            </label>
          </div>

          <label className="block mt-7 text-sm text-gray-300">
            Your video script, hook or sales pitch
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
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
            disabled={loading || product.trim().length < 2 ||
              audience.trim().length < 2 || script.trim().length < 10}
            className="mt-6 w-full rounded-xl p-5 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
          >
            {loading
              ? "SIMULATING FIVE BUYER MINDS..."
              : "ENTER THE BUYER'S MIND →"}
          </button>
        </section>

        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl animate-pulse mb-4">◈</div>
            <h3 className="text-xl font-bold">
              Running buyer simulations
            </h3>
            <p className="text-gray-400 mt-2">
              Examining five different perspectives...
            </p>
          </div>
        )}

        {report && (
          <section className="mt-12 space-y-8">

            <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3">
              <p className="text-amber-300 text-xs font-bold tracking-widest">
                SIMULATED RESULTS — FIVE AI BUYER PERSPECTIVES, NOT REAL CUSTOMER RESEARCH
              </p>
            </div>

            <div>
              <div className="text-cyan-400 text-xs tracking-widest">
                MISSION 02 / INTELLIGENCE REPORT
              </div>
              <h2 className="text-3xl md:text-4xl font-black mt-3">
                THE FIVE BUYER MINDS
              </h2>
              <p className="text-gray-400 mt-3">
                {report.buyerSummary}
              </p>
            </div>

            <PanelVerdict personas={report.personas} />

            <ThreeReveals report={report} />

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ["STRONGEST ELEMENT", report.strongestElement],
                ["BIGGEST BARRIER", report.biggestConversionBarrier],
              ].map(([title, content]) => (
                <div key={title}
                  className="bg-white/[.04] border border-white/10 rounded-2xl p-5">
                  <div className="text-cyan-400 text-xs tracking-widest mb-3">
                    {title}
                  </div>
                  <p className="text-gray-200">{content}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {report.personas.map((buyer, i) => (
                <div key={buyer.name}
                  className={`rounded-2xl border border-white/10 bg-gradient-to-r ${buyerColors[i]} bg-[#111827] overflow-hidden`}>

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
                        <h3 className="text-lg font-bold">
                          {buyer.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {buyer.personality}
                        </p>
                        {lensFor(buyer) && (
                          <p className="text-xs text-cyan-300 mt-1">
                            Lens: {lensFor(buyer)?.lens}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-cyan-300 text-xl">
                      {expanded === i ? "−" : "+"}
                    </span>
                  </button>

                  {expanded === i && (
                    <div className="px-5 pb-6 space-y-5">
                      {(() => {
                        const prof = profileFor(buyer.name);
                        const lens = lensFor(buyer);
                        if (!prof) return null;
                        return (
                          <div className="p-4 rounded-xl bg-black/30">
                            <div className="text-xs text-cyan-300 mb-2">
                              THEIR CORE QUESTION
                            </div>
                            <p className="font-semibold text-gray-100 mb-3">
                              &ldquo;{prof.question}&rdquo;
                            </p>
                            <p className="text-sm text-gray-300 mb-3">{prof.who}</p>
                            <p className="text-sm text-gray-400">
                              <strong className="text-gray-200">What they care about:</strong>{" "}
                              {prof.cares}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              <strong className="text-gray-200">What makes them decide:</strong>{" "}
                              {prof.decides}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              <strong className="text-gray-200">Budget:</strong>{" "}
                              {prof.budget}
                            </p>
                            {lens && (
                              <p className="text-sm text-gray-300 mt-3 border-t border-white/10 pt-3">
                                <strong className="text-cyan-300">
                                  Lens — {lens.lens}:
                                </strong>{" "}
                                {lens.value}
                              </p>
                            )}
                          </div>
                        );
                      })()}

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
                          "{buyer.innerThought}"
                        </p>
                      </div>

                      <ReactionRadar
                        interest={buyer.interestScore}
                        trust={buyer.trustScore}
                        desire={buyer.desireScore}
                      />

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
                        <p><strong>Biggest objection:</strong> {buyer.biggestObjection}</p>
                        <p><strong>Missing evidence:</strong> {buyer.missingEvidence}</p>
                        <p><strong>What to change:</strong> {buyer.improvement}</p>
                        <p><strong>Possible next action:</strong> {buyer.outcome.replaceAll("_", " ")}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/[.06] p-6">
              <div className="text-cyan-300 text-xs tracking-widest mb-3">
                MISSION 03 / REBUILD THE PITCH
              </div>

              <h3 className="text-2xl font-bold mb-3">
                A stronger opening
              </h3>

              <p className="text-xl font-semibold mb-4">
                "{report.improvedHook}"
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
              <h3 className="text-xl font-bold mb-5">
                Your experiment plan
              </h3>

              {report.experimentPlan.map((item, i) => (
                <div key={i} className="flex gap-3 mb-4">
                  <span className="text-cyan-400 font-bold">
                    0{i + 1}
                  </span>
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
              Simulated buyer perspectives are AI-generated hypotheses,
              not actual customer feedback or guaranteed purchase outcomes.
            </p>

            <button
              onClick={() => {
                setReport(null);
                setScript("");
              }}
              className="w-full border border-white/20 rounded-xl p-4 hover:bg-white/5"
            >
              START A NEW SIMULATION
            </button>

          </section>
        )}
      </div>
    </main>
  );
}
