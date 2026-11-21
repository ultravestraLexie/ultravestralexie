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

    const { output } = await generateText({
      model: process.env.AI_MODEL,
      output: Output.object({
        schema: ResultSchema,
      }),
      system: `
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
      `,
      prompt: `
Analyze this creator's sales video.

PRODUCT: ${product}
TARGET AUDIENCE: ${audience}
PRICE: ${price}
BUYER STAGE: ${stage}

VIDEO SCRIPT:
${script}

Analyze all five personalities independently.

Explain:
- What each buyer notices first.
- What they might think while watching.
- What makes them interested or uninterested.
- What creates doubt.
- What evidence they need.
- What the creator should change.
- Their likely next action.

Then provide:
- Overall analysis.
- Biggest conversion barrier.
- Strongest element.
- Improved opening hook.
- A rewritten sales script.
- Evidence or demonstrations the creator should show.
- Five practical experiments to test.

Do not invent facts about the product.
      `,
    });

    if (!output) {
      throw new Error("The AI did not return a valid report.");
    }

    return Response.json({
      success: true,
      report: output,
    });

  } catch (error) {
    console.error("Buyer Brain error:", error);

    return Response.json(
      { error: "The simulation could not be completed. Please try again." },
      { status: 500 }
    );
  }
}
