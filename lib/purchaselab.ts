/* ULTRAVESTRA — VIDEO INTELLIGENCE: THE PRODUCT-TO-PURCHASE LAB —
 * structured data. The evaluation layer of creator training: the
 * seven questions every product video must answer before it can be
 * judged — first frame, intended-buyer hook, demonstration, benefits,
 * proof, next step, policies — and the loop that turns evaluation
 * into improvement: Don't guess. Diagnose. Improve. Test.
 * Source: the owner's UltraVestra Original card (content transcribed
 * in the build brief). Its honesty rules match UltraVestra's: this
 * is an educational self-check, never a prediction of sales or
 * virality, and proof means honest evidence — never unsupported
 * claims. */

/* ---------- The seven evaluation questions ---------- */
export interface EvaluationQuestion {
  question: string;
  what_it_checks: string;
  what_good_looks_like: string;
  if_weak: string;
  fix: string;
}

export const EVALUATION: EvaluationQuestion[] = [
  {
    question: "Is the first frame interesting?",
    what_it_checks:
      "Whether the very first thing on screen earns the next second of attention — a meaningful visual the viewer can read instantly.",
    what_good_looks_like:
      "The video opens mid-action or on a striking, relevant image: the product already in use, a recognizable problem, a result in progress. No blank screen, no logo animation, no camera adjusting.",
    if_weak:
      "A weak first frame means the scroll never stops — the best hook in the world cannot save a video nobody starts watching. The viewer decides before your first sentence lands.",
    fix:
      "Re-film or re-edit the opening so frame one is the most interesting honest moment: the demonstration already happening, the problem on screen, or the product close up. Cut every intro frame that is not doing work.",
  },
  {
    question: "Does the hook attract the intended buyer?",
    what_it_checks:
      "Whether the opening speaks to the specific person the product is for — not just to anyone who might stop scrolling.",
    what_good_looks_like:
      "The right viewer recognizes themselves in the first seconds: their situation, their problem, their desire. Relevance over cleverness — and the hook matches what the video actually delivers.",
    if_weak:
      "A hook that attracts everyone attracts no buyer. Curiosity from the wrong audience inflates views, kills watch-through, and teaches the platform to show your video to people who will never purchase.",
    fix:
      "Rewrite the opening around the intended buyer's exact situation. Ask who this is for, and what they already want, need, or struggle with — then open on that, and promise only what the video proves.",
  },
  {
    question: "Is the product demonstrated clearly?",
    what_it_checks:
      "Whether the viewer actually sees the product doing its job, in a way they can follow without guessing.",
    what_good_looks_like:
      "Show, don't just talk. The product is in action on camera — used the way a real person would use it — with clear shots the viewer can understand even without sound.",
    if_weak:
      "Talking about a product is an advertisement; showing it is evidence. Without a clear demonstration, the viewer has to take your word for everything — and most won't.",
    fix:
      "Put the product to work on camera. Film the real use, close enough to see what happens, and cut any talking segment that repeats what the demonstration already shows.",
  },
  {
    question: "Are the benefits understandable?",
    what_it_checks:
      "Whether a first-time viewer can say, in their own words, what this product does for them.",
    what_good_looks_like:
      "Benefits are spoken in outcome language: what becomes easier, better, or more enjoyable when they own it — not a list of features or specs. One clear benefit lands harder than five vague ones.",
    if_weak:
      "If the viewer can't repeat the benefit, they can't want it. Feature lists and vague praise leave the viewer informed about the product and unmoved about owning it.",
    fix:
      "Translate every feature into an outcome: not what the product has, but what changes for the person using it. Say it the way the buyer would say it to a friend.",
  },
  {
    question: "Is there enough proof?",
    what_it_checks:
      "Whether the video gives the viewer honest reasons to believe — visible evidence, not just claims.",
    what_good_looks_like:
      "The demonstration itself is the proof: real use, real results shown as they are, honest limits mentioned. Every claim matches what the product actually does.",
    if_weak:
      "Unsupported claims train viewers to distrust you — and a sale made on an exaggerated promise costs more in lost trust than it earns in revenue. \u201cTrust me\u201d is not proof.",
    fix:
      "Show the evidence on camera: the result, the comparison, the detail that makes the claim believable. Remove any claim you can't demonstrate, and say plainly who the product may not be right for.",
  },
  {
    question: "Does the ending give a clear next step?",
    what_it_checks:
      "Whether the viewer knows exactly what to do next when the video ends — and has an honest reason to do it.",
    what_good_looks_like:
      "One clear next step: check the details, see the current price and availability, take a closer look. It follows naturally from the value the video delivered — an invitation, not pressure.",
    if_weak:
      "A video that ends without direction wastes the attention it earned. Interested viewers drift away simply because nobody told them what happens next.",
    fix:
      "End with a single, specific next step tied to what you showed. If they've been considering it, tell them what to check before deciding — honestly, without fake urgency or fake scarcity.",
  },
  {
    question: "Does the video meet advertising and platform policies?",
    what_it_checks:
      "Whether every claim, disclosure, and piece of content in the video is allowed — by advertising standards and by the platform it will live on.",
    what_good_looks_like:
      "Claims are supportable, sponsorship and affiliate relationships are disclosed, and nothing promises what can't be promised — no guaranteed results, no fake scarcity, no unsupported medical, financial, or performance claims.",
    if_weak:
      "A policy problem can remove the video, restrict the account, and destroy the trust the video was built to create. No single sale is worth the channel.",
    fix:
      "Audit the video before publishing: disclose the partnership, check every claim against what you can prove, and remove anything the platform or advertising rules would not allow you to say.",
  },
];

/* ---------- The loop: Don't guess. Diagnose. Improve. Test. ---------- */
export interface LoopStep {
  step: string;
  text: string;
}

export const THE_LOOP: LoopStep[] = [
  {
    step: "Don't guess",
    text: "Never judge a video by feeling. A video you love can fail, and a video you doubt can sell — your opinion is not data.",
  },
  {
    step: "Diagnose",
    text: "Run the seven questions and find the weakest point. The diagnosis tells you what to fix — and just as importantly, what to leave alone.",
  },
  {
    step: "Improve",
    text: "Fix the weakest point first, and change one thing at a time. If you change everything at once, you will never know what worked.",
  },
  {
    step: "Test",
    text: "Publish the improved version and compare real audience behavior — retention, clicks, comments, conversions — before changing anything else.",
  },
];

/* ---------- The honesty note ---------- */
export const SCORING_NOTE =
  "This evaluator is an educational self-check, not a prediction of sales or virality. It shows you where your video is weakest — only real audience behavior tells you whether the fix worked.";

export const CLOSING_LINE = "Don't guess. Diagnose. Improve. Test.";
