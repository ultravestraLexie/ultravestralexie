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

// One buyer's treatment of one inventory proof element (Proof Fix V2).
// Every buyer must return one entry per inventory element — this is
// what makes the completeness gate checkable in code rather than by
// reading prose after the fact.
const ProofTreatmentSchema = z.object({
  elementId: z.string(),
  stance: z.enum(["credited", "questioned", "needs_substantiation"]),
  note: z.string(),
});

const PersonaSchema = z.object({
  name: z.string(),
  personality: z.string(),
  firstReaction: z.string(),
  innerThought: z.string(),
  interestScore: z.number().min(0).max(10),
  trustScore: z.number().min(0).max(10),
  desireScore: z.number().min(0).max(10),
  biggestObjection: z.string(),
  missingEvidence: z.string(),
  improvement: z.string(),
  proofTreatment: z.array(ProofTreatmentSchema).max(20),
  outcome: z.enum([
    "likely_to_continue",
    "needs_more_information",
    "likely_to_leave",
    "considering_purchase"
  ]),
});

type PersonaOutput = z.infer<typeof PersonaSchema>;

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

// Proof Fix V2 — Stage 1: evidence extraction. A structured proof
// inventory is built from the script BEFORE any buyer reacts, so buyer
// synthesis consumes a validated inventory instead of rereading the
// marketing script and anchoring on its lead claim. Exact wording is
// preserved verbatim; ids are assigned in script order (P1, P2, ...).
const ProofElementSchema = z.object({
  id: z.string(),
  category: z.enum([
    "statistic_or_study",
    "named_expert_or_customer",
    "review_count_or_rating",
    "guarantee_or_risk_reversal",
    "product_claim",
    "other",
  ]),
  exactWording: z.string(),
  source: z.string(),
});

const ExtractionSchema = z.object({
  elements: z.array(ProofElementSchema).max(20),
  // Extraction is itself model-generated and can miss evidence. The
  // confidence and the ambiguity flags are recorded, never hidden:
  // completeness against known test fixtures is measurable exactly;
  // in uncontrolled production scripts it can only be estimated.
  confidence: z.enum(["high", "medium", "low"]),
  ambiguities: z.array(z.string()).max(5),
});

// Proof Fix V2 — Stage 2: evidence evaluation. Each extracted element
// is classified by provenance and weighed. The hierarchy is a
// weighting, NOT a truth detector: independently verified > manufacturer
// declared > self-run study > unsupported assertion. A named source is
// not automatically independent; a guarantee is a risk reversal, not
// scientific proof.
const EvaluatedElementSchema = ProofElementSchema.extend({
  provenance: z.enum([
    "independently_verified",
    "manufacturer_declared",
    "self_run_study",
    "unsupported_assertion",
  ]),
  weight: z.enum(["highest", "moderate", "lower", "lowest"]),
  limitations: z.string(),
  substantiationNeeded: z.string(),
});

const EvaluationSchema = z.object({
  elements: z.array(EvaluatedElementSchema).max(20),
});

// The combined report sections, without the personas — produced by the
// synthesis call in Stage 3 and merged with the persona results.
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
const EXTRACTION_TIMEOUT_MS = 15_000;
const EVALUATION_TIMEOUT_MS = 15_000;
const PERSONA_TIMEOUT_MS = 30_000;
const SYNTHESIS_TIMEOUT_MS = 40_000;

// ------------------------------------------------------------------
// Pacing layer (Phase 1 Build 5 — ported verbatim from the Creator
// Lab route, where this exact pattern repaired the same failure).
// The AI Gateway quota is 5 model requests per minute; V3's parallel
// burst is what produced 429s in the proof battery (beauty/food 200,
// tech/pets/fashion 500). Every model invocation in this route passes
// through this pacer:
//   - the persona stage runs at most PERSONA_MAX_IN_FLIGHT persona
//     tasks concurrently (a counting semaphore below);
//   - when an attempt fails with a 429, the next attempt waits for
//     the provider's retry-after when one is supplied, otherwise a
//     bounded backoff — and the wait happens INSIDE the piece's
//     existing attempt budget (runPiece retries), never in addition
//     to it;
//   - a wait that would cross the route's cumulative deadline is
//     refused: the piece fails and the route answers with its
//     standard error (fail-closed), exactly as V3 fails on deadline.
// The engine itself — prompts, schemas, stages, coverage gates — is
// unchanged; only the invocation pattern is paced.
// ------------------------------------------------------------------
const PERSONA_MAX_IN_FLIGHT = 2;
const MAX_429_WAIT_MS = 15_000;
const BACKOFF_BASE_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Returns the wait (ms) before retrying a failed attempt, or null
// when the error is not a rate-limit error. retry-after is honored
// in both of its forms (delta-seconds and HTTP-date) and every wait
// is bounded by MAX_429_WAIT_MS; without a header, a bounded
// exponential backoff is used.
function rateLimitWaitMs(error: unknown, attemptIndex: number): number | null {
  const e = error as {
    status?: unknown;
    statusCode?: unknown;
    name?: unknown;
    responseHeaders?: Record<string, string>;
    headers?: Record<string, string>;
  } | null;
  const status =
    typeof e?.status === "number"
      ? e.status
      : typeof e?.statusCode === "number"
        ? e.statusCode
        : undefined;
  const name = typeof e?.name === "string" ? e.name : "";
  const message = error instanceof Error ? error.message : String(error);
  const isRateLimit =
    status === 429 ||
    /rate.?limit/i.test(name) ||
    /\b429\b|too many requests|rate limit/i.test(message);
  if (!isRateLimit) return null;

  const headers = e?.responseHeaders ?? e?.headers ?? {};
  const retryAfter = headers["retry-after"] ?? headers["Retry-After"];
  if (typeof retryAfter === "string" && retryAfter.trim().length > 0) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
      return Math.min(Math.max(0, seconds * 1000), MAX_429_WAIT_MS);
    }
    const at = Date.parse(retryAfter);
    if (!Number.isNaN(at)) {
      return Math.min(Math.max(0, at - Date.now()), MAX_429_WAIT_MS);
    }
  }
  return Math.min(BACKOFF_BASE_MS * 2 ** attemptIndex, MAX_429_WAIT_MS);
}

// Runs one generation piece with an abort timeout, retrying it on any
// failure (including abort/timeout) up to maxRetries times (default 1,
// the route's standard reliability retry). Returns the piece's value
// and its total wall time, including failed attempts when a retry was
// needed. Throws if every attempt fails. The timeout may be a factory,
// re-evaluated per attempt, so callers can bound an attempt by a
// shared cumulative deadline rather than a fixed budget.
//
// Pacing: when an attempt fails with a 429 and attempts remain, the
// pacer waits (retry-after or bounded backoff) before the next
// attempt — but only if the wait itself fits before `deadlineAt`;
// otherwise the piece fails immediately rather than letting total
// elapsed time cross the cumulative deadline.
async function runPiece<T>(
  attempt: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number | (() => number),
  maxRetries = 1,
  deadlineAt?: number
): Promise<{ value: T; ms: number }> {
  const start = Date.now();
  let lastError: unknown = null;
  for (let i = 0; i <= maxRetries; i++) {
    const attemptTimeout =
      typeof timeoutMs === "function" ? timeoutMs() : timeoutMs;
    if (attemptTimeout <= 0) {
      lastError = new Error("The generation deadline was reached.");
      break;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), attemptTimeout);
    try {
      const value = await attempt(controller.signal);
      return { value, ms: Date.now() - start };
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        const wait = rateLimitWaitMs(error, i);
        if (wait !== null && wait > 0) {
          // Fail closed: never let a pacing wait push the request
          // past its cumulative deadline.
          if (deadlineAt !== undefined && Date.now() + wait >= deadlineAt) {
            break;
          }
          await sleep(wait);
        }
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("The AI did not return a valid report.");
}

// Counting semaphore capping how many persona tasks run at once.
// Persona-stage concurrency is the burst the gateway quota cannot
// absorb; every other stage is sequential by construction.
function createSemaphore(max: number) {
  let active = 0;
  const waiters: (() => void)[] = [];
  return {
    async acquire(): Promise<void> {
      if (active < max) {
        active += 1;
        return;
      }
      await new Promise<void>((resolve) => waiters.push(resolve));
      active += 1;
    },
    release(): void {
      active -= 1;
      const next = waiters.shift();
      if (next) next();
    },
  };
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

    // Cumulative deadline (owner's safeguard): per-piece timeouts
    // alone cannot guarantee the route's 60-second cap, because the
    // stages are sequential — extraction, evaluation and synthesis
    // could otherwise stack past it. Every attempt's timeout is the
    // smaller of its configured timeout and the time left before
    // this deadline, which sits 5 seconds under the cap so the route
    // answers with its own error instead of a platform timeout.
    const GENERATION_DEADLINE_MS = 55_000;
    const deadlineAt = generationStart + GENERATION_DEADLINE_MS;
    const budget = (configured: number) =>
      Math.min(configured, deadlineAt - Date.now());

    // Proof Fix V2, Stage 1 — evidence extraction. Build the complete
    // proof inventory from the script before any buyer reacts.
    const extractionResult = await runPiece(async (signal) => {
      const { output } = await generateText({
        model,
        output: Output.object({
          schema: ExtractionSchema,
        }),
        abortSignal: signal,
        system: `${ENGINE_SYSTEM}
For this call, do not analyze the video and do not speak for any
buyer. Your only job is EVIDENCE EXTRACTION: build a complete,
structured proof inventory from the script in the prompt.

Extract EVERY element the script uses as proof or persuasion:
statistics, studies and trials, named experts or customers, review
counts and ratings, guarantees, warranties, refunds and exchanges,
and specific product claims. For each element record:
- id: "P1", "P2", ... in the order the elements appear in the script.
- category: what kind of proof it is.
- exactWording: the element's wording, copied verbatim from the script.
- source: who asserts it, exactly as the script presents it (for
  example "the brand", or a named person).

Also record:
- confidence: how confident you are that the inventory is complete.
- ambiguities: anything that might be proof but is vague or unclear,
  and any proof the script hints at without actually stating.

Extract only what the script actually contains. Do not invent proof
that is not there, and do not evaluate or react to the proof yet.
      `,
        prompt: `
Build the proof inventory for this creator's sales video.
${contextBlock}
      `,
      });

      if (!output) {
        throw new Error("The AI did not return a valid report.");
      }

      // Inventory validation (owner's safeguards): ids must be unique,
      // wording must be non-empty, and exact duplicates are dropped.
      // Ids are reassigned in script order so downstream stages can
      // rely on them regardless of what the extraction returned.
      const seen = new Set<string>();
      const elements = output.elements
        .filter((el) => el.exactWording.trim().length > 0)
        .filter((el) => {
          const key = el.exactWording.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((el, i) => ({ ...el, id: `P${i + 1}` }));

      return { ...output, elements };
    }, () => budget(EXTRACTION_TIMEOUT_MS), 1, deadlineAt);

    const extraction = extractionResult.value;

    // Proof Fix V2, Stage 2 — evidence evaluation. Classify every
    // extracted element by provenance and weight before the buyers
    // see it. The evaluated inventory must cover exactly the same
    // element ids as the extraction; a mismatch fails the attempt
    // and runPiece retries it.
    const evaluationResult = await runPiece(async (signal) => {
      const { output } = await generateText({
        model,
        output: Output.object({
          schema: EvaluationSchema,
        }),
        abortSignal: signal,
        system: `${ENGINE_SYSTEM}
For this call, do not analyze the video and do not speak for any
buyer. Your only job is EVIDENCE EVALUATION: classify each element
of the proof inventory in the prompt by provenance, and weigh it.

Provenance hierarchy (a weighting, NOT a truth detector):
- independently_verified — third-party or verifiable evidence, such
  as verified-buyer ratings or independent reviews. Weight: highest.
- manufacturer_declared — specs and claims the brand itself states.
  Weight: moderate.
- self_run_study — a study or trial the brand ran itself. Weight:
  lower. It can still be useful; state its methodology limits.
- unsupported_assertion — a claim with no identifiable source or
  checkable basis. Weight: lowest.

Rules:
- A named expert or customer is NOT automatically independent or
  credible just because they are named.
- A guarantee, warranty, refund or exchange is a risk reversal, not
  scientific proof of effectiveness.
- For every element return the same id, category, exactWording and
  source you were given, plus its provenance, its weight, its
  limitations, and what substantiation would strengthen it.
- Return exactly the same set of element ids you were given — no
  element added, none dropped.
      `,
        prompt: `
Evaluate this proof inventory.
${contextBlock}
PROOF INVENTORY (from the extraction stage):
${JSON.stringify(extraction.elements, null, 2)}
      `,
      });

      if (!output) {
        throw new Error("The AI did not return a valid report.");
      }

      const expectedIds = extraction.elements.map((el) => el.id);
      const returnedIds = output.elements.map((el) => el.id);
      const coversExactly =
        returnedIds.length === expectedIds.length &&
        expectedIds.every((id) => returnedIds.includes(id));
      if (!coversExactly) {
        throw new Error(
          "The evaluation did not cover the extracted inventory exactly."
        );
      }

      return output;
    }, () => budget(EVALUATION_TIMEOUT_MS), 1, deadlineAt);

    const evaluation = evaluationResult.value;

    const inventoryBlock = `
PROOF INVENTORY (evaluated — AUTHORITATIVE for all proof judgments):
${JSON.stringify(evaluation.elements, null, 2)}
Extraction confidence: ${extraction.confidence}${
      extraction.ambiguities.length > 0
        ? `\nExtraction ambiguities flagged for review: ${extraction.ambiguities.join(
            "; "
          )}`
        : ""
    }
`;

    // Proof Fix V2, Stage 3 — the five buyers, one smaller call each,
    // in parallel. Each buyer receives the script (hooks, tone,
    // wording, emotional context) AND the evaluated inventory, which
    // is authoritative for proof: the buyer must treat every element
    // in proofTreatment, and a buyer that skips an element is retried
    // once with the missed elements named.
    const inventoryIds = evaluation.elements.map((el) => el.id);

    // Exact-set coverage (owner's correction): a buyer's treatment is
    // complete only when its element ids are unique and their set
    // equals the inventory id set — exactly one treatment per element.
    // Duplicate or unknown ids never count as coverage.
    const assessCoverage = (p: PersonaOutput) => {
      const ids = p.proofTreatment.map((t) => t.elementId);
      const uniqueIds = new Set(ids);
      const missing = inventoryIds.filter((id) => !uniqueIds.has(id));
      const unknown = ids.filter((id) => !inventoryIds.includes(id));
      const validCount = inventoryIds.length - missing.length;
      const exact =
        missing.length === 0 &&
        unknown.length === 0 &&
        ids.length === inventoryIds.length;
      return { exact, validCount, missing, unknown };
    };

    // Build 5 pacing: at most PERSONA_MAX_IN_FLIGHT persona tasks run
    // concurrently (V3 ran all five in parallel — the burst that hit
    // the gateway's 5-requests-per-minute quota in the battery).
    const personaSemaphore = createSemaphore(PERSONA_MAX_IN_FLIGHT);

    const personaResults = await Promise.all(
      PERSONAS.map((persona) => {
        const attemptPersona = async (
          signal: AbortSignal,
          problems: string
        ) => {
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
other buyer. Score interestScore, trustScore and desireScore from 0
to 10 — 0 means none at all, 10 means the strongest possible
reaction. Never score above 10.

PROOF RULES for this call:
- The evaluated PROOF INVENTORY in the prompt is the authoritative
  source for what proof the script contains. The script itself
  supplies hooks, tone and wording — you may interpret the script,
  but you may not silently override or omit the inventory.
- In proofTreatment, return exactly one entry for EVERY inventory
  element: its elementId, your stance (credited, questioned, or
  needs_substantiation), and a note explaining why that element
  matters or does not matter to you, this specific buyer.
  Mentioning an element without judging it does not count.
- Weigh proof by its provenance: independently verified evidence
  deserves more trust than manufacturer-declared claims, which
  deserve more than a self-run study, which deserves more than an
  unsupported assertion. Let that ordering show in your trustScore
  and your reasoning.
- Never cite proof that is not in the inventory, and never treat a
  claim in the inventory as an independently established fact.${
              problems
                ? `
- Your previous attempt had coverage problems: ${problems}.
  This time return exactly one treatment per inventory element —
  no omissions, no duplicates, no ids outside the inventory.`
                : ""
            }
      `,
            prompt: `
Analyze this creator's sales video from the perspective of the
${persona.name} only.
${contextBlock}
${inventoryBlock}
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
        };

        return (async (): Promise<{ value: PersonaOutput; ms: number }> => {
          await personaSemaphore.acquire();
          try {
          const start = Date.now();
          const first = await runPiece(
            (signal) => attemptPersona(signal, ""),
            () => budget(PERSONA_TIMEOUT_MS),
            1,
            deadlineAt
          );
          const firstCoverage = assessCoverage(first.value);
          if (firstCoverage.exact) {
            return { value: first.value, ms: Date.now() - start };
          }
          // Completeness gate: one corrective retry naming the exact
          // problems — but only when the remaining deadline budget
          // leaves real room for it. Otherwise the first attempt
          // stands and its coverage failure is recorded as-is.
          if (deadlineAt - Date.now() <= 8_000) {
            return { value: first.value, ms: Date.now() - start };
          }
          const duplicateCount =
            first.value.proofTreatment.length -
            new Set(first.value.proofTreatment.map((t) => t.elementId)).size;
          const problems = [
            firstCoverage.missing.length > 0
              ? `these inventory elements received no treatment: ${firstCoverage.missing.join(", ")}`
              : "",
            firstCoverage.unknown.length > 0
              ? `these treatment elementIds are not in the inventory: ${firstCoverage.unknown.join(", ")}`
              : "",
            duplicateCount > 0
              ? "some elements received duplicate treatments"
              : "",
          ]
            .filter(Boolean)
            .join("; ");
          // Invocation policy (owner's qualification, resolved): the
          // corrective generation is a SINGLE attempt — runPiece is
          // called with maxRetries 0, so it cannot stack its own
          // reliability retry on top of the corrective one. Per buyer
          // the ceiling is therefore 2 invocations for the initial
          // generation (1 + 1 reliability retry) plus 1 corrective
          // invocation = 3, all inside the shared deadline. And the
          // corrective is best-effort: if it fails outright, the
          // first attempt stands instead of failing the request.
          let chosen = first.value;
          try {
            const second = await runPiece(
              (signal) => attemptPersona(signal, problems),
              () => budget(PERSONA_TIMEOUT_MS),
              0,
              deadlineAt
            );
            const secondCoverage = assessCoverage(second.value);
            // Selection: prefer exact coverage; if neither attempt
            // is exact, retain the greater valid coverage. A
            // malformed retry can never displace a fuller first
            // attempt.
            if (
              secondCoverage.exact ||
              secondCoverage.validCount >= firstCoverage.validCount
            ) {
              chosen = second.value;
            }
          } catch {
            // First attempt stands; its coverage is recorded as-is.
          }
          return { value: chosen, ms: Date.now() - start };
          } finally {
            personaSemaphore.release();
          }
        })();
      })
    );

    const personaOutputs = personaResults.map((result) => result.value);
    const personaMs = personaResults.map((result) => result.ms);
    // Final coverage per buyer, recorded explicitly with the timing
    // line: exact-set success, plus any missing and unknown ids that
    // remain after the corrective retry.
    const coverage = personaOutputs.map((p) => {
      const c = assessCoverage(p);
      return { exact: c.exact, missing: c.missing, unknown: c.unknown };
    });

    // Stage 3, synthesis — one call for the combined report sections,
    // reflecting the five persona results and the evaluated inventory.
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

PROOF RULES for this call:
- The evaluated PROOF INVENTORY in the prompt is authoritative for
  what proof the script contains. In the overall analysis, state
  explicitly which inventory elements the panel credited most and
  which it discounted most, and why — including how the elements'
  provenance (independently verified, manufacturer-declared,
  self-run study, unsupported assertion) drove that difference.
- Never describe a claim from the inventory as an independently
  established fact, and never cite proof that is not in the
  inventory.
      `,
        prompt: `
Analyze this creator's sales video.
${contextBlock}
${inventoryBlock}
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
    }, () => budget(SYNTHESIS_TIMEOUT_MS), 1, deadlineAt);

    // Assemble the full report in the exact shape the page expects and
    // validate it before returning — a partial report is never sent.
    const report = ResultSchema.parse({
      ...synthesisResult.value,
      personas: personaOutputs,
    });

    console.log(
      JSON.stringify({
        evt: "buyer-brain-timing",
        extractionMs: extractionResult.ms,
        evaluationMs: evaluationResult.ms,
        inventorySize: inventoryIds.length,
        extractionConfidence: extraction.confidence,
        personaMs,
        coverage,
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
