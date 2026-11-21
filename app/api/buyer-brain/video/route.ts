import { generateText, Output } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { checkRateLimit, BUYER_BRAIN_RATE_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

/* THE FIVE BUYER TEST — VIDEO MODE (API).
 *
 * The owner's distinction: the core /buyer-brain route is a SCRIPT
 * simulator. This route takes sampled FRAMES from the creator's
 * actual video (extracted in the browser — the video file itself is
 * never uploaded) plus an optional script/transcript, and the model
 * reacts to what is actually visible. It is NOT face-emotion
 * tracking, NOT retention prediction, NOT audio analysis — the
 * system prompt below is written to keep it honest about that.
 *
 * Gate: subscription-gated like the rest of /buyer-brain — the
 * middleware prefix (/api/buyer-brain) blocks anonymous calls, and
 * this handler re-checks with getGateState() (mirroring
 * app/api/suggest): no session → 401 JSON, no active subscription
 * → 403 JSON. Rate limit: the shared Buyer Brain limiter from
 * lib/rate-limit.ts (10 runs per user per hour, IP fallback).
 * The AI key lives server-side only. */

/** ~12MB ceiling on the whole JSON payload (frames are data URLs). */
const MAX_BODY_BYTES = 12 * 1024 * 1024;

const RequestSchema = z.object({
  product: z.string().min(2).max(200),
  audience: z.string().min(2).max(300),
  price: z.string().max(50).default("Not provided"),
  script: z.string().max(8000).optional().default(""),
  durationSeconds: z.number().positive().max(60 * 60),
  frames: z
    .array(
      z
        .string()
        .max(4_000_000)
        .refine((s) => s.startsWith("data:image/"), {
          message: "Frames must be image data URLs.",
        })
    )
    .min(1)
    .max(10),
});

/* VISUAL VIDEO ANALYSIS — the owner's six examination areas:
 * the actual footage, the OPENING SECONDS, the product
 * demonstration, captions, pacing, and the CALL TO ACTION. */
const VisualReadSchema = z.object({
  /* The opening-seconds read: what the first frames show and
   * whether they earn attention, and why. */
  firstFrame: z.string(),
  productVisibility: z.string(),
  demonstrationClarity: z.string(),
  /* Captions / on-screen text actually seen in the frames. */
  onScreenText: z.string(),
  /* Pacing: variety and change across the frame sequence. */
  pacingNotes: z.string(),
  /* Trust cues visible in the actual footage. */
  trustCues: z.string(),
  /* The call to action: is one visible in the frames or stated in
   * the script, how clear is it, and where does it land? */
  callToAction: z.string(),
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
  improvementSuggestion: z.string(),
  outcome: z.enum([
    "likely_to_scroll_away",
    "curious_but_unconvinced",
    "needs_more_information",
    "considering_purchase",
    "likely_to_continue",
  ]),
});

const ResultSchema = z.object({
  visualRead: VisualReadSchema,
  personas: z.array(PersonaSchema).length(5),
  overall: z.object({
    biggestConversionBarrier: z.string(),
    strongestElement: z.string(),
    oneChangeFirst: z.string(),
  }),
});

export async function POST(request: Request) {
  /* Subscription gate (mirrors app/api/suggest): anonymous → 401,
   * signed-in without an active subscription → 403, both JSON. */
  const gate = await getGateState();
  if (gate !== "ok") {
    return Response.json(
      {
        error:
          gate === "login"
            ? "Please sign in to run the Five Buyer Test."
            : "An active UltraVestra subscription is required to run the Five Buyer Test.",
      },
      { status: gate === "login" ? 401 : 403 }
    );
  }

  /* Payload ceiling — reject before parsing a giant body. */
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return Response.json(
      { error: "That video's frames are too large to analyze. Please try a shorter or lower-resolution video." },
      { status: 413 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json(
      { error: "The request could not be read. Please try again." },
      { status: 400 }
    );
  }
  if (rawBody.length > MAX_BODY_BYTES) {
    return Response.json(
      { error: "That video's frames are too large to analyze. Please try a shorter or lower-resolution video." },
      { status: 413 }
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json(
      { error: "Please check your video and product details." },
      { status: 400 }
    );
  }

  /* Rate limit (owner's order, shared with the script simulator):
   * 10 runs per user per hour, keyed by the signed-in user's id;
   * falls back to client IP when no session is available. */
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
      `video:${rateKey}`,
      BUYER_BRAIN_RATE_LIMIT.limit,
      BUYER_BRAIN_RATE_LIMIT.windowMs
    )
  ) {
    return Response.json(
      {
        error:
          "You've reached the video test limit for now. Please try again in a little while.",
      },
      { status: 429 }
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your video frames and product details." },
      { status: 400 }
    );
  }

  if (!process.env.AI_GATEWAY_API_KEY || !process.env.AI_MODEL) {
    return Response.json(
      { error: "AI engine is not configured yet." },
      { status: 503 }
    );
  }

  const { product, audience, price, script, durationSeconds, frames } =
    parsed.data;
  const hasScript = script.trim().length > 0;

  try {
    const { output } = await generateText({
      // NOTE: process.env.AI_MODEL must be a vision-capable model —
      // the frames are sent as image parts. The configured gateway
      // model (openai/gpt-4o-mini) accepts image input.
      model: process.env.AI_MODEL,
      output: Output.object({
        schema: ResultSchema,
      }),
      system: `
You are ULTRA VESTRA's Buyer Psychology Intelligence Engine, running
the Five Buyer Test in VIDEO MODE.

You are shown sampled frames — evenly spaced still images — taken
from the creator's actual video, in order. The first frame is from
the opening seconds. You may also be given the video's script or
transcript. Five simulated buyers react to what they can actually
see and read.

Examine the video through the VISUAL VIDEO ANALYSIS:
- The actual footage: what is really shown — setting, people,
  product, production quality.
- The OPENING SECONDS: what the first frames show, and whether
  they earn attention or lose the viewer, and why.
- The product demonstration: is the product shown in use, and is
  what it does clear from the frames?
- Captions: what on-screen text or captions are actually visible?
- Pacing: how much variety and change is there across the frame
  sequence — or does it look like one static shot?
- The CALL TO ACTION: is a call to action visible in the frames
  or stated in the script? How clear is it, and where does it land?

The five buyer personalities, and the core question each one asks:
1. Emotional Buyer — "Will this make my life better?"
   Responds to identity, feelings, aspirations and personal relevance.
2. Logical Buyer — "Does this actually work, and is it worth the price?"
   Evaluates usefulness, price, features and evidence.
3. Skeptical Buyer — "Why should I believe you?"
   Questions exaggerated claims, credibility and missing proof.
4. Impulse Buyer — "Do I want this right now?"
   Responds to immediate relevance, simplicity and convenience.
5. Conscious Buyer — "Do I really need this, and is it the right choice?"
   Considers long-term value, quality, ethics and alternatives.

IMPORTANT HONESTY RULES:
- React ONLY to what is actually in the frames and, when provided,
  the script. Never invent dialogue, claims, reviews, statistics,
  results, or product facts that are not present.
- Sampled frames are NOT the whole video. You cannot hear audio,
  tone of voice, or music, and you cannot see motion between
  frames. This is not face-emotion tracking, not retention
  prediction, and not audio analysis — never claim or imply those.
  When a judgment depends on something frames cannot show, say so
  plainly inside the visual read.
- If no script was provided, the buyers are reacting to the
  visuals only — make that limitation clear.
- These are simulated perspectives, not actual customer research.
  Never claim to know what real people will purchase. Never
  guarantee conversion rates or sales.
- Do not assume the product works without evidence visible in the
  frames or stated in the script.
- Do not recommend fake scarcity or manipulative pressure.
- Make every observation and recommendation specific to the
  frames and script actually submitted.
      `,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
Run the Five Buyer Test — VIDEO MODE on this creator's video.

PRODUCT: ${product}
TARGET AUDIENCE: ${audience}
PRICE: ${price}
VIDEO LENGTH: about ${Math.round(durationSeconds)} seconds
FRAMES: ${frames.length} still frames follow, sampled evenly across
the video in order. Frame 1 is from the opening seconds.

${
  hasScript
    ? `SCRIPT / TRANSCRIPT PROVIDED BY THE CREATOR:\n${script}`
    : "NO SCRIPT OR TRANSCRIPT WAS PROVIDED. The buyers react to the visuals only — they cannot hear any voiceover, music, or spoken words."
}

First, complete the VISUAL VIDEO ANALYSIS (visualRead):
- firstFrame: the opening-seconds read — what the first frames
  show and whether they earn attention, and why.
- productVisibility: how visible and recognizable the product is.
- demonstrationClarity: whether the demonstration shows what the
  product does.
- onScreenText: the captions / on-screen text actually seen.
- pacingNotes: variety and change across the frame sequence.
- trustCues: trust signals visible in the actual footage.
- callToAction: whether a call to action is visible in the frames
  or stated in the script, how clear it is, and where it lands.

Then analyze all five buyer personalities independently: what each
buyer notices first in the frames, what they think, what creates
interest or doubt, the evidence they still need, the one change
that would move them, and their likely next action (outcome).

Finally give the overall read: the biggest conversion barrier, the
strongest element, and the ONE change to make first.

Do not invent anything that is not in the frames or the script.
              `,
            },
            ...frames.map((frame) => ({
              type: "image" as const,
              image: frame,
            })),
          ],
        },
      ],
    });

    if (!output) {
      throw new Error("The AI did not return a valid report.");
    }

    return Response.json({
      success: true,
      report: output,
    });
  } catch (error) {
    console.error("Buyer Brain video error:", error);

    return Response.json(
      { error: "The video test could not be completed. Please try again." },
      { status: 500 }
    );
  }
}
