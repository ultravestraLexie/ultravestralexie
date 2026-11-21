import { generateText, Output } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { checkRateLimit, BUYER_BRAIN_RATE_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

/* THE CONVERSION LAB — one call, two jobs:
 * (a) write four variant OPENINGS of the creator's script — A
 *     Emotional, B Problem-first, C Demonstration-first,
 *     D Curiosity-driven — keeping the script's own claims and
 *     inventing nothing about the product;
 * (b) judge each opening against the SAME five buyer perspectives
 *     as the Five Buyer Test, then compare the four versions.
 * Simulated buyer reactions only — never real customer research,
 * never a prediction of sales. Members-only (subscription gate,
 * mirroring app/api/suggest) + the shared Buyer Brain rate limit. */

const RequestSchema = z.object({
  product: z.string().min(2).max(200),
  audience: z.string().min(2).max(300),
  price: z.string().max(50).default("Not provided"),
  script: z.string().min(10).max(8000),
});

const PersonaReactionSchema = z.object({
  name: z.string(),
  interestScore: z.number().min(0).max(100),
  trustScore: z.number().min(0).max(100),
  desireScore: z.number().min(0).max(100),
  outcome: z.enum([
    "likely_to_scroll_away",
    "curious_but_unconvinced",
    "needs_more_information",
    "considering_purchase",
    "likely_to_continue",
  ]),
  oneLineReaction: z.string(),
});

const VariantSchema = z.object({
  version: z.enum(["A", "B", "C", "D"]),
  style: z.string(),
  opening: z.string(),
  personas: z.array(PersonaReactionSchema).length(5),
});

const ComparisonSchema = z.object({
  strongestVersion: z.enum(["A", "B", "C", "D"]),
  strongestWhy: z.string(),
  wins: z
    .array(
      z.object({
        version: z.enum(["A", "B", "C", "D"]),
        buyer: z.string(),
        why: z.string(),
      })
    )
    .max(4),
  recommendedFirstTest: z.enum(["A", "B", "C", "D"]),
  recommendedReasoning: z.string(),
});

const ResultSchema = z.object({
  variants: z.array(VariantSchema).length(4),
  comparison: ComparisonSchema,
});

export async function POST(request: Request) {
  // Subscription gate (mirrors app/api/suggest): no session → 401,
  // session without an active/trialing subscription → 403.
  const gate = await getGateState();
  if (gate !== "ok") {
    return Response.json(
      {
        error:
          gate === "login"
            ? "Please sign in to use the Conversion Lab."
            : "The Conversion Lab is for members with an active subscription.",
      },
      { status: gate === "login" ? 401 : 403 }
    );
  }

  // Rate limit (owner's order, shared with the Five Buyer Test):
  // 10 AI runs per user per hour, keyed by the signed-in user's id;
  // falls back to client IP. In-memory — see lib/rate-limit.ts.
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
    !checkRateLimit(
      rateKey,
      BUYER_BRAIN_RATE_LIMIT.limit,
      BUYER_BRAIN_RATE_LIMIT.windowMs
    )
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

    const { product, audience, price, script } = parsed.data;

    const { output } = await generateText({
      model: process.env.AI_MODEL,
      output: Output.object({
        schema: ResultSchema,
      }),
      system: `
You are ULTRA VESTRA's Buyer Psychology Intelligence Engine,
running the Conversion Lab.

The creator gives you ONE video script. Your job has two steps.

STEP 1 — WRITE FOUR VARIANT OPENINGS.
Rewrite ONLY the opening of the script — the first lines a viewer
hears and sees, roughly the first 3 to 7 seconds — in four styles:
- Version A: Emotional opening. Lead with the feeling, the identity,
  the life this product is part of.
- Version B: Problem-first opening. Lead with the problem, friction
  or frustration the product addresses.
- Version C: Demonstration-first opening. Lead by SHOWING the product
  in action, using only demonstrations the script itself supports.
- Version D: Curiosity-driven opening. Lead with an honest open loop
  or unexpected angle that the rest of the script genuinely pays off.
Everything after the opening stays exactly the creator's video. Each
variant opening must keep the script's own claims and invent NOTHING
about the product — no new features, results, reviews, statistics,
certifications or endorsements. If the script gives no demonstrable
claim for Version C, open with the closest honest visual the script
itself describes.

STEP 2 — JUDGE EVERY OPENING WITH THE SAME FIVE BUYERS.
Each buyer judges the variant opening as the doorway into the SAME
video (the rest of the script is unchanged). Return the five buyers
in this exact order, with these exact names:
1. "Emotional Buyer" — core question: "Will this make my life better?"
   Responds to identity, feelings, aspirations and personal relevance.
2. "Logical Buyer" — core question: "Does this actually work, and is
   it worth the price?" Evaluates usefulness, price, features, evidence.
3. "Skeptical Buyer" — core question: "Why should I believe you?"
   Questions exaggerated claims, credibility and missing proof.
4. "Impulse Buyer" — core question: "Do I want this right now?"
   Responds to immediate relevance, simplicity and convenience.
5. "Conscious Buyer" — core question: "Do I really need this, and is
   it the right choice?" Considers long-term value, quality, ethics
   and alternatives.
For each buyer give interestScore, trustScore and desireScore
(0–100 simulated reaction strengths — NOT probabilities), one
likely outcome, and a oneLineReaction in that buyer's own voice.

Then COMPARE the four versions: which version earns the strongest
overall panel response and why; for each version, which buyer
responds best to it and why; and which single version the creator
should test first, with the reasoning.

IMPORTANT RULES:
- These are simulated buyer reactions, not real customer research
  or guaranteed sales predictions.
- Never claim to know what real people will purchase.
- Never invent product reviews, statistics, certifications or
  test results — about the product or about any opening's effect.
- Do not recommend fake scarcity, false urgency or manipulative
  pressure in any variant opening.
- Never guarantee conversion, sales or virality.
- Keep every judgement specific to the submitted script.
- Do not confuse attention with purchase intent.
      `,
      prompt: `
Run the Conversion Lab on this creator's video.

PRODUCT: ${product}
TARGET AUDIENCE: ${audience}
PRICE: ${price}

CURRENT VIDEO SCRIPT:
${script}

Write the four variant openings (A Emotional, B Problem-first,
C Demonstration-first, D Curiosity-driven), judge each one with
all five buyers, and compare the versions as instructed.
      `,
    });

    if (!output) {
      throw new Error("The AI did not return a valid report.");
    }

    // Panel averages are computed here, from the returned scores —
    // deterministic arithmetic, never the model's own math.
    const variants = output.variants.map((v) => {
      const scores = v.personas.flatMap((p) => [
        p.interestScore,
        p.trustScore,
        p.desireScore,
      ]);
      const panelAverage = Math.round(
        scores.reduce((s, n) => s + n, 0) / scores.length
      );
      return { ...v, panelAverage };
    });

    return Response.json({
      success: true,
      report: { variants, comparison: output.comparison },
    });
  } catch (error) {
    console.error("Conversion Lab error:", error);

    return Response.json(
      { error: "The lab run could not be completed. Please try again." },
      { status: 500 }
    );
  }
}
