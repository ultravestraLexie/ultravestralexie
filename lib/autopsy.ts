/* ULTRAVESTRA — THE VIDEO AUTOPSY — structured data and diagnosis
 * logic. The analysis layer of creator training: a guided,
 * step-by-step autopsy of the creator's OWN video, stage by stage,
 * ending in ONE change for the next video — never a pile of tips.
 *
 * The stages are not a new method. They are assembled from the
 * owner's existing systems already in this codebase:
 *  - the First 3 Seconds three beats (lib/first3.ts: Interrupt /
 *    Connect / Create a Reason to Stay),
 *  - the seven Product-to-Purchase evaluation questions
 *    (lib/purchaselab.ts),
 *  - the trigger chain (lib/triggers.ts: Attention → Interest →
 *    Understanding → Trust → Decision),
 *  - the Autopsy Worksheet stages (lib/weapon.ts: AUTOPSY_STAGES).
 *
 * HONESTY: this is a guided self-analysis built from the creator's
 * own answers. The tool never watched their video, never predicts
 * virality, and never guarantees an outcome. Automatic analysis of
 * an uploaded video arrives only when an analysis provider is
 * connected — the page says so plainly. */

import { THREE_BEATS } from "./first3";
import { EVALUATION } from "./purchaselab";
import { CHAIN } from "./triggers";
import { AUTOPSY_STAGES } from "./weapon";

/* ---------- The form vocabulary ---------- */
export const PLATFORMS = [
  "TikTok",
  "TikTok Shop",
  "YouTube long-form",
  "YouTube Shorts",
  "Instagram Reels",
  "Instagram Stories",
  "Facebook",
  "Trybe",
  "Amazon",
  "eBay",
];

export const VIDEO_TYPES = [
  "Product demonstration",
  "Product review",
  "Tutorial / how-to",
  "Unboxing / first impressions",
  "Before-and-after",
  "Personal story / experience",
  "LIVE clip",
  "Other",
];

export interface DropoffPoint {
  key: string;
  label: string;
}

export const DROPOFF_POINTS: DropoffPoint[] = [
  { key: "first3", label: "In the first 3 seconds — they swipe almost immediately" },
  { key: "beforeProduct", label: "Before the product appears" },
  { key: "duringDemo", label: "During the demonstration" },
  { key: "atOffer", label: "When the offer / price appears" },
  { key: "atCta", label: "At the call to action" },
  { key: "watchNoAct", label: "They watch to the end — but don't act" },
  { key: "unknown", label: "I don't know where they leave" },
];

export const PRODUCT_TIMINGS = [
  { key: "first3", label: "In the first 3 seconds" },
  { key: "early", label: "Between 3 and 10 seconds" },
  { key: "late", label: "After 10 seconds" },
  { key: "never", label: "It never really appears — I mostly hold it up or talk about it" },
];

export const PROOF_OPTIONS = [
  { key: "yes", label: "Yes — a visible result, comparison, or real-use moment" },
  { key: "partly", label: "Partly — I claim results, but I don't show them clearly" },
  { key: "no", label: "No — there is no proof moment" },
];

export const BENEFIT_OPTIONS = [
  { key: "yes", label: "Yes — I say what changes for the person using it" },
  { key: "partly", label: "Partly — I mostly list features and specs" },
  { key: "no", label: "No — I never really say what it does for them" },
];

/* ---------- The inputs ---------- */
export interface AutopsyInputs {
  platform: string;
  videoType: string;
  audience: string;
  hook: string;
  firstFrame: string;
  dropoff: string;
  productTiming: string;
  proof: string;
  benefits: string;
  cta: string;
}

/* ---------- Grades ---------- */
export type Grade = "strong" | "weak" | "missing";

export const GRADE_META: Record<Grade, { label: string; accent: string }> = {
  strong: { label: "STRONG", accent: "#22d3ee" },
  weak: { label: "WEAK", accent: "#e879f9" },
  missing: { label: "MISSING", accent: "#fb7185" },
};

/* ---------- The six autopsy stages ---------- */
export interface AutopsyStageDef {
  id: string;
  name: string;
  focus: string;
  chain_stage: string; // the trigger-chain stage this autopsy stage serves
  source: string; // which owner system this stage is built from
  look_for: string[]; // what good looks like — the re-film standard
  cause_weak: string;
  cause_missing: string;
  first_fix: string;
  refilm: string[];
}

export const STAGES: AutopsyStageDef[] = [
  {
    id: "stop",
    name: "The Stop — First 3 Seconds",
    focus: AUTOPSY_STAGES[0].focus,
    chain_stage: `${CHAIN[0].stage} — ${CHAIN[0].line}`,
    source: `Built from the First 3 Seconds beats (${THREE_BEATS.map((b) => b.name).join(" / ")}) and the Autopsy Worksheet's "${AUTOPSY_STAGES[0].stage}" stage.`,
    look_for: AUTOPSY_STAGES[0].what_to_look_for,
    cause_weak:
      "The opening spends its first seconds on you instead of the viewer — a greeting, a warm-up, or a product name before a promise. The three beats never fire: nothing interrupts, nothing connects, and no reason to stay is created. Viewers decide before your real content arrives.",
    cause_missing:
      "There is effectively no opening: no spoken promise and no meaningful first frame. The scroll never stops, so nothing later in the video gets a chance to work.",
    first_fix:
      "Re-film the opening only. Frame one: the product or the problem, already in motion. First line: a spoken promise to a specific viewer — what they will see, learn, or be able to decide. No greeting, no introduction, no logo.",
    refilm: [
      "Frame one shows the product or the problem — already in action, not being set up.",
      "The first spoken line is a promise, not a greeting: it names the viewer or their situation.",
      "By second three, the viewer has a clear reason to stay — a payoff the video will deliver.",
      "A stranger could say what this video is about by second three.",
    ],
  },
  {
    id: "hold",
    name: "The Hold — Seconds 3–10",
    focus: AUTOPSY_STAGES[1].focus,
    chain_stage: `${CHAIN[1].stage} — ${CHAIN[1].line}`,
    source: `Built from the Autopsy Worksheet's "${AUTOPSY_STAGES[1].stage}" and "${AUTOPSY_STAGES[2].stage}" stages.`,
    look_for: [...AUTOPSY_STAGES[1].what_to_look_for, ...AUTOPSY_STAGES[2].what_to_look_for.slice(0, 1)],
    cause_weak:
      "Curiosity dies after the stop. The opening loop gets repeated instead of deepened, the product takes too long to arrive, or a self-introduction steals the momentum. A half-interested viewer has no new information to hold onto — so they leave before the video starts proving anything.",
    cause_missing:
      "Nothing new arrives after the opening. The video explains itself instead of deepening the promise, and the product never enters the story in time to matter.",
    first_fix:
      "Rebuild seconds 3–10: deepen the opening loop with one new piece of information, and bring the product — or the first proof of it — into the frame inside the first ten seconds. Cut every second spent introducing yourself.",
    refilm: [
      "Something new arrives between seconds 3 and 7 — the loop deepens, it is not repeated.",
      "The first piece of proof or demonstration appears early — the video starts proving, not explaining itself.",
      "No self-introduction or backstory detour before the product appears.",
      "A pattern change lands every few seconds: angle, zoom, text, or action.",
    ],
  },
  {
    id: "reveal",
    name: "The Reveal & Demonstration",
    focus: AUTOPSY_STAGES[3].focus,
    chain_stage: `${CHAIN[2].stage} — ${CHAIN[2].line}`,
    source: `Built from the Autopsy Worksheet's "${AUTOPSY_STAGES[3].stage}" stage and the Product-to-Purchase question: "${EVALUATION[2].question}"`,
    look_for: AUTOPSY_STAGES[3].what_to_look_for,
    cause_weak:
      "The product arrives late, or arrives as a description instead of a demonstration. Talking about a product is an advertisement; showing it is evidence. If viewers leave during the demo, the demo is not clear enough to follow without guessing.",
    cause_missing:
      "The product is never really demonstrated — it is held up and talked about. The viewer is asked to take your word for everything, and most won't.",
    first_fix:
      "Put the product to work on camera. Film the real use, close enough to see what happens, and let the key demonstration moment play uncut. The product should arrive as the answer to the question your opening already built.",
    refilm: [
      "The product arrives as the answer to a question the video already built.",
      "It is shown working — the key moment plays uncut — not just held up and described.",
      "A first-time viewer can follow the demonstration with the sound off.",
      "One honest limitation or condition is stated near the reveal.",
    ],
  },
  {
    id: "understanding",
    name: "Understanding — The Benefit",
    focus: "Whether a first-time viewer can say, in their own words, what this product does for them.",
    chain_stage: `${CHAIN[2].stage} — ${CHAIN[2].line}`,
    source: `Built from the Product-to-Purchase question: "${EVALUATION[3].question}"`,
    look_for: [EVALUATION[3].what_good_looks_like],
    cause_weak:
      "The video lists features instead of translating them into outcomes. The viewer ends up informed about the product and unmoved about owning it — if they can't repeat the benefit, they can't want it.",
    cause_missing:
      "The benefit is never said out loud. The viewer sees a product and hears details, but nobody tells them what changes for them if they own it — so nothing connects the demonstration to their life.",
    first_fix:
      "Add one outcome sentence, spoken while the product is on screen: not what the product has, but what changes for the person using it — said the way the buyer would say it to a friend.",
    refilm: [
      "One clear benefit is spoken in outcome language while the product is visible.",
      "Every feature mentioned is translated: what becomes easier, better, or more enjoyable.",
      "A first-time viewer could repeat the benefit in their own words after one watch.",
    ],
  },
  {
    id: "proof",
    name: "Proof & Trust",
    focus: "Whether the video gives the viewer honest reasons to believe — visible evidence, not just claims.",
    chain_stage: `${CHAIN[3].stage} — ${CHAIN[3].line}`,
    source: `Built from the Product-to-Purchase question: "${EVALUATION[4].question}"`,
    look_for: [EVALUATION[4].what_good_looks_like],
    cause_weak:
      "Claims are made but not shown. The viewer hears that it works without seeing the result, the comparison, or the detail that would make it believable — and unsupported claims train viewers to distrust the next video too.",
    cause_missing:
      "There is no proof moment at all. Every reason to believe rests on your say-so. “Trust me” is not proof — and viewers who watch to the end but don't act are usually stuck exactly here.",
    first_fix:
      "Add one proof moment and film it in the same light as the claim: the real result, the honest comparison, the detail that makes the claim believable. Remove any claim you can't demonstrate.",
    refilm: [
      "The video shows the evidence on camera: the result, the comparison, or the telling detail.",
      "Every claim matches what the product actually does — nothing exaggerated, nothing invented.",
      "An honest limit is said plainly: who this may not be right for.",
    ],
  },
  {
    id: "decision",
    name: "The Decision — Offer & Call to Action",
    focus: AUTOPSY_STAGES[4].focus,
    chain_stage: `${CHAIN[4].stage} — ${CHAIN[4].line}`,
    source: `Built from the Autopsy Worksheet's "${AUTOPSY_STAGES[4].stage}" stage and the Product-to-Purchase question: "${EVALUATION[5].question}"`,
    look_for: AUTOPSY_STAGES[4].what_to_look_for,
    cause_weak:
      "The ending asks for too much, too vaguely, or too late. Several competing asks — or one generic “check it out” — land after belief has already faded, and the biggest objection (price, doubt, fit) was never answered while the product was on screen. Interested viewers drift away simply because nobody told them what happens next.",
    cause_missing:
      "The video ends without a next step. All the attention it earned is spent with nowhere to go — the viewer has to invent the action themselves, and almost none of them will.",
    first_fix:
      "End with exactly one specific next step, spoken while the product is on screen at the moment belief is highest: what to check, where to find it, and the one objection answered honestly before you ask.",
    refilm: [
      "The payoff promised in the opening is delivered in full before the ask.",
      "Exactly one action is asked for — specific, simple, and tied to what was shown.",
      "The ask lands at the moment belief is highest, not after it fades.",
      "No fake urgency, no fake scarcity — an invitation, not pressure.",
    ],
  },
];

/* ---------- The diagnosis ---------- */
export interface StageResult {
  def: AutopsyStageDef;
  grade: Grade;
  cause: string; // "" when strong
  evidence: string; // which of their answers produced this grade
}

const GREETING_PATTERNS = [
  /^\s*(hey|hi|hello)\s+(guys|everyone|everybody|y'?all|there)\b/i,
  /^\s*welcome\b/i,
  /^\s*what'?s up\b/i,
  /^\s*(so\s+)?today\s+i('?m| am)\s+going to\b/i,
  /^\s*in this video\b/i,
  /^\s*let me introduce\b/i,
];

const WEAK_FRAME_WORDS = [
  "logo", "intro", "black", "blank", "adjusting", "setting up", "my face", "talking head",
  "nothing", "just me", "room", "wall",
];

const VAGUE_CTA_PHRASES = [
  "check it out", "link in bio", "buy now", "shop now", "get yours", "click the link",
  "go buy", "check the link", "see link",
];

function gradeStop(i: AutopsyInputs): { grade: Grade; evidence: string } {
  const hook = i.hook.trim();
  const frame = i.firstFrame.trim().toLowerCase();
  const greeting = GREETING_PATTERNS.some((re) => re.test(hook));
  const weakFrame = WEAK_FRAME_WORDS.some((w) => frame.includes(w));
  if (greeting && weakFrame)
    return { grade: "missing", evidence: "Your first line is a greeting or warm-up, and your first frame carries no product, problem, or action." };
  if (i.dropoff === "first3")
    return { grade: "weak", evidence: "Your own drop-off point is the first 3 seconds — viewers are leaving before the promise lands." };
  if (greeting)
    return { grade: "weak", evidence: "Your first spoken line is a greeting or an introduction, not a promise — the Interrupt beat never fires." };
  if (weakFrame)
    return { grade: "weak", evidence: "Your first frame has no product, problem, or action in it — nothing interrupts the scroll visually." };
  return { grade: "strong", evidence: "Your first line is a direct promise and your first frame carries the product, the problem, or the action." };
}

function gradeHold(i: AutopsyInputs): { grade: Grade; evidence: string } {
  if (i.dropoff === "beforeProduct")
    return { grade: "weak", evidence: "Your viewers leave before the product appears — the hold between the stop and the reveal is where they go." };
  if (i.productTiming === "never")
    return { grade: "missing", evidence: "The product never really appears, so there is nothing for the hold to build toward." };
  if (i.productTiming === "late")
    return { grade: "weak", evidence: "The product first appears after 10 seconds — a long hold with no proof arriving to sustain it." };
  return { grade: "strong", evidence: "The product arrives early, so curiosity gets fed with proof instead of more setup." };
}

function gradeReveal(i: AutopsyInputs): { grade: Grade; evidence: string } {
  if (i.productTiming === "never")
    return { grade: "missing", evidence: "By your own answer, the product is mostly held up or talked about — it is never demonstrated working." };
  if (i.dropoff === "duringDemo")
    return { grade: "weak", evidence: "Your viewers leave during the demonstration — the demo itself is where clarity breaks down." };
  if (i.productTiming === "late")
    return { grade: "weak", evidence: "The demonstration starts after 10 seconds, so many viewers never reach the moment that does the selling." };
  return { grade: "strong", evidence: "The product appears early enough to be demonstrated while attention is still high." };
}

function gradeUnderstanding(i: AutopsyInputs): { grade: Grade; evidence: string } {
  if (i.benefits === "no")
    return { grade: "missing", evidence: "By your own answer, the video never says what the product does for the person watching." };
  if (i.benefits === "partly")
    return { grade: "weak", evidence: "By your own answer, the video mostly lists features and specs instead of outcomes." };
  if (i.dropoff === "watchNoAct")
    return { grade: "weak", evidence: "Viewers watch to the end but don't act — they understood the product, but not what it changes for them." };
  return { grade: "strong", evidence: "The benefit is spoken as an outcome — what changes for the person using it." };
}

function gradeProof(i: AutopsyInputs): { grade: Grade; evidence: string } {
  if (i.proof === "no")
    return { grade: "missing", evidence: "By your own answer, the video has no proof moment — belief rests entirely on your say-so." };
  if (i.proof === "partly")
    return { grade: "weak", evidence: "By your own answer, results are claimed but not shown clearly — the claim arrives without its evidence." };
  return { grade: "strong", evidence: "The video shows a visible result, comparison, or real-use moment — the claim travels with its evidence." };
}

function gradeDecision(i: AutopsyInputs): { grade: Grade; evidence: string } {
  const cta = i.cta.trim().toLowerCase();
  if (!cta)
    return { grade: "missing", evidence: "The video ends with no call to action at all." };
  if (i.dropoff === "atOffer" || i.dropoff === "atCta")
    return { grade: "weak", evidence: "Your viewers leave exactly at the offer / call to action — the ask is where the video loses them." };
  if (VAGUE_CTA_PHRASES.some((p) => cta === p || cta.startsWith(p)))
    return { grade: "weak", evidence: "Your call to action is a generic phrase — it names no specific step and gives no reason tied to what was shown." };
  if (i.dropoff === "watchNoAct")
    return { grade: "weak", evidence: "Viewers watch to the end but don't act — the next step either isn't landing or the objection was never answered before it." };
  return { grade: "strong", evidence: "The video ends with one specific next step tied to what was shown." };
}

const GRADERS: Record<string, (i: AutopsyInputs) => { grade: Grade; evidence: string }> = {
  stop: gradeStop,
  hold: gradeHold,
  reveal: gradeReveal,
  understanding: gradeUnderstanding,
  proof: gradeProof,
  decision: gradeDecision,
};

const GRADE_ORDER: Record<Grade, number> = { missing: 0, weak: 1, strong: 2 };

/* Run the autopsy. Results come back weakest-first: Missing before
 * Weak before Strong, and inside the same grade the earlier stage
 * wins — nothing downstream matters if nobody stops, and nothing
 * sells if the product never appears. */
export function runAutopsy(inputs: AutopsyInputs): StageResult[] {
  const results = STAGES.map((def, idx) => {
    const { grade, evidence } = GRADERS[def.id](inputs);
    return {
      def,
      grade,
      cause: grade === "strong" ? "" : grade === "weak" ? def.cause_weak : def.cause_missing,
      evidence,
      idx,
    };
  });
  results.sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.idx - b.idx);
  return results.map(({ def, grade, cause, evidence }) => ({ def, grade, cause, evidence }));
}

/* When no stage is broken, the one change is a test, not a fix —
 * the loop's rule: change one variable, publish, compare. */
export const ALL_STRONG_CHANGE = {
  fix: "No broken stage — so your one change is a test, not a fix. Keep the video and change exactly one variable in the next one: film the same product with a contrasting opening style (if this one opened on the problem, open the next on the demonstration), publish it to a similar audience, and compare retention and product clicks before changing anything else.",
  refilm: [
    "Change one variable only — the opening style. Everything else stays the same.",
    "Publish to a similar audience in similar conditions, so the comparison means something.",
    "Compare initial retention, average watch time, and product clicks — not views alone.",
  ],
};

/* ---------- The honesty labels ---------- */
export const HONESTY_NOTE =
  "This report is a guided self-analysis built from your answers — the Autopsy did not watch your video. It shows you where your video is most likely breaking and the one change to make first. Only real audience behavior tells you whether the change worked.";

export const UPLOAD_NOTE =
  "Automatic analysis of an uploaded video is coming when an analysis provider is connected. Until then, nothing here pretends to have watched your video — this autopsy runs on your honest answers, and it works on every video you make.";

export const CLOSING_LINE = "Diagnose. Understand. Improve. Apply. Grow.";
