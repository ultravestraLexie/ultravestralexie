import { generateText, Output } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimitShared, BUYER_BRAIN_RATE_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  product: z.string().min(2).max(200),
  audience: z.string().min(2).max(300),
  price: z.string().max(50).default("Not provided"),
  script: z.string().min(10).max(8000),
  stage: z.enum(["cold", "curious", "skeptical", "ready"]),
});

const PersonaSchema = z.object({
  name: z.string(),
  personality: z.string(),
  firstReaction: z.string(),
  innerThought: z.string(),
  interestScore: z.number().min(0).max(100),
  trustScore: z.number().min(0).max(100),
  desireScore: z.number().min(0).max(100),
  biggestObjection: z.string(),
  missingEvidence: z.string(),
  improvement: z.string(),
  outcome: z.enum([
    "likely_to_continue",
    "needs_more_information",
    "likely_to_leave",
    "considering_purchase"
  ]),
});

const ResultSchema = z.object({
  overallAnalysis: z.string(),
  buyerSummary: z.string(),
  personas: z.array(PersonaSchema).length(5),
  biggestConversionBarrier: z.string(),
  strongestElement: z.string(),
  improvedHook: z.string(),
  improvedScript: z.string(),
  proofToShow: z.array(z.string()).max(5),
  experimentPlan: z.array(z.string()).max(5),
  finalAdvice: z.string(),
});

// The combined report sections, without the personas — produced by the
// Phase 2 synthesis call and merged with the Phase 1 persona results.
const SynthesisSchema = z.object({
  overallAnalysis: z.string(),
  buyerSummary: z.string(),
  biggestConversionBarrier: z.string(),
  strongestElement: z.string(),
  improvedHook: z.string(),
  improvedScript: z.string(),
  proofToShow: z.array(z.string()).max(5),
  experimentPlan: z.array(z.string()).max(5),
  finalAdvice: z.string(),
});

// The five buyers, in canonical report order. The trait line for each
// buyer is the one-line characterization from the engine system text.
const PERSONAS = [
  {
    name: "Emotional Buyer",
    trait:
      "Responds to identity, feelings, aspirations and personal relevance.",
  },
  {
    name: "Logical Buyer",
    trait: "Evaluates usefulness, price, features and evidence.",
  },
  {
    name: "Skeptical Buyer",
    trait: "Questions exaggerated claims, credibility and missing proof.",
  },
  {
    name: "Impulse Buyer",
    trait: "Responds to immediate relevance, simplicity and convenience.",
  },
  {
    name: "Conscious Buyer",
    trait: "Considers long-term value, quality, ethics and alternatives.",
  },
] as const;

const ENGINE_SYSTEM = `
You are ULTRA VESTRA's Buyer Psychology Intelligence Engine.

Your job is to analyze marketing messages from five different
simulated buyer perspectives.

The five buyer personalities are:

1. Emotional Buyer:
Responds to identity, feelings, aspirations and personal relevance.

2. Logical Buyer:
Evaluates usefulness, price, features and evidence.

3. Skeptical Buyer:
Questions exaggerated claims, credibility and missing proof.

4. Impulse Buyer:
Responds to immediate relevance, simplicity and convenience.

5. Conscious Buyer:
Considers long-term value, quality, ethics and alternatives.

IMPORTANT RULES:

- These are simulated perspectives, not actual customer research.
- Never claim to know what real people will purchase.
- Never invent product reviews, statistics or test results.
- Do not assume the product works without evidence.
- Do not recommend fake scarcity or manipulative pressure.
- Explain the buyer's likely questions and hesitation.
- Make every recommendation specific to the submitted script.
- Never guarantee conversion rates or sales.
- If the script lacks information, identify what is missing.
- Keep the advice practical and understandable.
- Do not confuse attention with purchase intent.
      `;

// Per-attempt timeouts for one generation piece. Each piece runs well
// under the route's 60-second cap, so a slow call is aborted and
// retried instead of timing out the whole request.
const PERSONA_TIMEOUT_MS = 30_000;
const SYNTHESIS_TIMEOUT_MS = 40_000;

// Runs one generation piece with an abort timeout, retrying it exactly
// once on any failure (including abort/timeout). Returns the piece's
// value and its total wall time, including the failed first attempt
// when a retry was needed. Throws if the retry also fails.
async function runPiece<T>(
  attempt: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<{ value: T; ms: number }> {
  const start = Date.now();
  let lastError: unknown = null;
  for (let i = 0; i < 2; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const value = await attempt(controller.signal);
      return { value, ms: Date.now() - start };
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("The AI did not return a valid report.");
}

export async function POST(request: Request) {
  // Rate limit (owner's order): 10 simulations per user per hour,
  // keyed by the signed-in user's id; falls back to client IP when
  // no session is available. In-memory limiter — see lib/rate-limit.ts.
  let rateKey: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) rateKey = `user:${user.id}`;
  } catch {
    // No session available — fall through to the IP key.
  }
  if (!rateKey) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    rateKey = `ip:${ip}`;
  }
  if (
    !(await checkRateLimitShared(
      rateKey,
      BUYER_BRAIN_RATE_LIMIT.limit,
      BUYER_BRAIN_RATE_LIMIT.windowMs
    ))
  ) {
    return Response.json(
      {
        error:
          "You've reached the simulation limit for now. Please try again in a little while.",
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Please check your product and script details." },
        { status: 400 }
      );
    }

    if (!process.env.AI_GATEWAY_API_KEY || !process.env.AI_MODEL) {
      return Response.json(
        { error: "AI engine is not configured yet." },
        { status: 503 }
      );
    }

    const { product, audience, price, script, stage } = parsed.data;

    // The 503 check above guarantees AI_MODEL is set; capture it in a
    // local so the generation closures below see it as a plain string.
    const model = process.env.AI_MODEL;

    const contextBlock = `
PRODUCT: ${product}
TARGET AUDIENCE: ${audience}
PRICE: ${price}
BUYER STAGE: ${stage}

VIDEO SCRIPT:
${script}
`;

    const generationStart = Date.now();

    // Phase 1 — the five buyers, one smaller call each, in parallel.
    const personaResults = await Promise.all(
      PERSONAS.map((persona) =>
        runPiece(async (signal) => {
          const { output } = await generateText({
            model,
            output: Output.object({
              schema: PersonaSchema,
            }),
            abortSignal: signal,
            system: `${ENGINE_SYSTEM}
For this call, analyze the video from the perspective of ONLY ONE
buyer: the ${persona.name}.

${persona.name}:
${persona.trait}

Return one buyer report for this buyer only. Set the name field to
exactly "${persona.name}". Do not analyze, quote, or speak for any
other buyer.
      `,
            prompt: `
Analyze this creator's sales video from the perspective of the
${persona.name} only.
${contextBlock}
Explain, from this buyer's perspective only:
- What this buyer notices first.
- What they might think while watching.
- What makes them interested or uninterested.
- What creates doubt.
- What evidence they need.
- What the creator should change.
- Their likely next action.

Do not invent facts about the product.
      `,
          });

          if (!output) {
            throw new Error("The AI did not return a valid report.");
          }

          return output;
        }, PERSONA_TIMEOUT_MS)
      )
    );

    const personaOutputs = personaResults.map((result) => result.value);
    const personaMs = personaResults.map((result) => result.ms);

    // Phase 2 — one synthesis call for the combined report sections,
    // reflecting the five persona results from Phase 1.
    const synthesisResult = await runPiece(async (signal) => {
      const { output } = await generateText({
        model,
        output: Output.object({
          schema: SynthesisSchema,
        }),
        abortSignal: signal,
        system: `${ENGINE_SYSTEM}
For this call, the five buyers have already been analyzed
individually, and their reports are provided in the prompt. Your job
is to produce the combined sections of the report — the overall
analysis, the buyer summary, the biggest conversion barrier, the
strongest element, the improved hook, the rewritten script, the
proof to show, the experiment plan, and the final advice —
reflecting those five buyer reports. Do not re-analyze the buyers
individually.
      `,
        prompt: `
Analyze this creator's sales video.
${contextBlock}
Five simulated buyers have already analyzed this video
independently. Their individual reports:

${JSON.stringify(personaOutputs, null, 2)}

Based on the script and these five buyer reports, provide:
- Overall analysis.
- A summary of the five buyers.
- Biggest conversion barrier.
- Strongest element.
- Improved opening hook.
- A rewritten sales script.
- Evidence or demonstrations the creator should show.
- Five practical experiments to test.
- Final advice.

Do not invent facts about the product.
      `,
      });

      if (!output) {
        throw new Error("The AI did not return a valid report.");
      }

      return output;
    }, SYNTHESIS_TIMEOUT_MS);

    // Assemble the full report in the exact shape the page expects and
    // validate it before returning — a partial report is never sent.
    const report = ResultSchema.parse({
      ...synthesisResult.value,
      personas: personaOutputs,
    });

    console.log(
      JSON.stringify({
        evt: "buyer-brain-timing",
        personaMs,
        synthesisMs: synthesisResult.ms,
        totalMs: Date.now() - generationStart,
      })
    );

    return Response.json({
      success: true,
      report,
    });

  } catch (error) {
    console.error("Buyer Brain error:", error);

    return Response.json(
      { error: "The simulation could not be completed. Please try again." },
      { status: 500 }
    );
  }
}
