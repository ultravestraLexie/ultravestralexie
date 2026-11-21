/* ULTRAVESTRA — THE HUMAN BEHIND THE VIEW — structured data.
 * Audience Psychology & Advertising Intelligence: the permanent
 * signature subject of the UltraVestra Original Curriculum. The
 * psychology of the person watching, the first second, what to say
 * versus what not to say, the one-product/five-audiences matrix, the
 * six-stage advertising framework, the diagnostic, the testing
 * psychology, the advertising philosophy, and UltraVestra's own
 * brand advertisement. Extracted faithfully from the source document
 * in content/audience-psychology-intelligence.md.
 * Its honesty rules match UltraVestra's: never teach manipulation —
 * communicate value honestly, because a sale achieved through
 * misleading promises can cost more in lost trust than it earns. */

/* ---------- The tagline ---------- */
export const TAGLINE =
  "Stop making videos just to show products. Start making videos that make people understand why they matter.";

export const SUBJECT_INTRO =
  "Learn how people think, what captures their attention, why they trust, how they evaluate products, and what influences their decisions.";

/* ---------- One important truth ---------- */
export const TRUTH = {
  statement:
    "A good video is not necessarily a video that makes people buy. A good advertising video makes the right person understand the value, believe the message, and feel confident enough to take the next step.",
  stages: [
    { term: "Views", meaning: "attention" },
    { term: "Watch time", meaning: "engagement" },
    { term: "Trust", meaning: "creates consideration" },
    { term: "A purchase", meaning: "happens when the offer, need, timing, and confidence come together" },
  ],
  closing: "Ultra Vestra teaches creators to understand all of these stages, not just how to get views.",
};

/* ---------- 1. The psychology of the person watching ---------- */
export interface AudienceQuestion {
  question: string;
  understand: string;
}

export const AUDIENCE_QUESTIONS: AudienceQuestion[] = [
  { question: "What do they want?", understand: "Their desires and goals" },
  { question: "What frustrates them?", understand: "Their problems and obstacles" },
  { question: "What are they afraid of?", understand: "Their doubts and purchase concerns" },
  { question: "What do they value?", understand: "Convenience, quality, price, results, identity" },
  { question: "What makes them act?", understand: "Evidence, relevance, trust, timing and value" },
];

export const BIGGEST_MISTAKE =
  "The biggest mistake creators make: They start with what they want to say instead of what the viewer wants to know.";

export const BLENDER_THINKING = {
  product: "a portable blender",
  creatorCentered: "\u201cI want to tell everyone about this blender.\u201d",
  audienceCentered:
    "\u201cWho would actually find this blender useful? Someone who travels, goes to work, exercises, or wants to make smoothies quickly?\u201d",
  result: "Now the video has a specific audience and a reason to exist.",
};

/* ---------- 2. The first second: win attention, not the sale ---------- */
export const FIRST_SECOND_JOB = {
  headline: "The first second has one primary job: give the right viewer a reason to pay attention to the next second.",
  notTheJob: "Not to explain everything. Not to introduce your entire product. Not to beg for a purchase.",
  shouldCreate: "It should create immediate relevance, curiosity, surprise, recognition, or visual interest.",
};

export interface OpeningTechnique {
  technique: string;
  example: string;
}

export const OPENING_TECHNIQUES: OpeningTechnique[] = [
  { technique: "Problem recognition", example: "\u201cStill struggling to keep your kitchen organized?\u201d" },
  { technique: "Curiosity", example: "\u201cI didn't expect this little gadget to solve that problem.\u201d" },
  { technique: "Demonstration", example: "Start with the product already performing its most interesting function." },
  { technique: "Audience identification", example: "\u201cIf you travel frequently, watch this.\u201d" },
  { technique: "Unexpected discovery", example: "\u201cI wish I had discovered this before spending money on the other one.\u201d" },
  { technique: "Visual interruption", example: "Show a surprising transformation before explaining it." },
];

export const HOOK_MATCH_RULE =
  "The important part is that the hook must match the actual video. Don't promise a dramatic result and then deliver an ordinary product demonstration.";

export interface FirstSecondMoment {
  window: string;
  name: string;
  description: string;
  viewer_thoughts: string[];
}

export const FIRST_SECOND: FirstSecondMoment[] = [
  {
    window: "00:00–00:01",
    name: "The recognition moment",
    description: "The viewer should have a reason to think:",
    viewer_thoughts: [
      "\u201cThat's relevant to me.\u201d",
      "\u201cI want to know what happens.\u201d",
      "\u201cI've experienced that problem.\u201d",
      "\u201cI need to see how that works.\u201d",
    ],
  },
  {
    window: "00:01–00:03",
    name: "The curiosity moment",
    description:
      "Give them a reason to continue. Show the product, introduce the situation, or begin demonstrating the solution.",
    viewer_thoughts: [],
  },
  {
    window: "00:03–00:06",
    name: "The value moment",
    description:
      "Make it clear what the video will deliver. Don't make the viewer wait through an unnecessary introduction.",
    viewer_thoughts: [],
  },
];

export const FIRST_SECOND_NOTE =
  "These are practical creative guidelines, not scientifically fixed deadlines. TikTok's own advertising guidance recommends communicating value early, using a hook-body-close structure, and capturing attention within the opening seconds.";

/* ---------- 3. What to say versus what NOT to say ---------- */
export interface SayPair {
  category: string;
  weak: string;
  why_weak: string | null;
  stronger: string;
  why_stronger: string | null;
}

export const SAY_PAIRS: SayPair[] = [
  {
    category: "Product Introduction",
    weak: "\u201cHey guys, I just wanted to show you this product.\u201d",
    why_weak: "It gives no immediate reason for the viewer to care.",
    stronger: "\u201cIf you struggle with keeping your everyday essentials organized, look at this.\u201d",
    why_stronger: "It identifies a particular audience and a relevant situation.",
  },
  {
    category: "Selling a Product",
    weak: "\u201cYou NEED to buy this. It's the best thing ever.\u201d",
    why_weak: null,
    stronger:
      "\u201cHere's what I like about this product, what it actually does, and who I think would benefit from it.\u201d",
    why_stronger: null,
  },
  {
    category: "Creating Urgency",
    weak: "\u201cBuy now before it's gone!\u201d",
    why_weak: null,
    stronger: "\u201cIf you've been considering this, check the current price and availability before deciding.\u201d",
    why_stronger: null,
  },
  {
    category: "Building Trust",
    weak: "\u201cTrust me, this will change your life.\u201d",
    why_weak: null,
    stronger:
      "\u201cLet me show you exactly how I use it, what I noticed, and what you should consider before buying.\u201d",
    why_stronger: null,
  },
];

export const AVOID_PHRASES: string[] = [
  "\u201cGuaranteed results\u201d without a genuine guarantee.",
  "\u201cEverybody needs this.\u201d",
  "\u201cThis works for everyone.\u201d",
  "\u201cThe best product ever\u201d without support.",
  "Fake countdowns and fake scarcity.",
  "Fake personal experiences.",
  "Unsupported medical, financial, or performance claims.",
  "\u201cYou won't believe this\u201d when nothing surprising follows.",
];

export const USE_INSTEAD: string[] = [
  "\u201cHere's who this may be useful for.\u201d",
  "\u201cLet me show you how it works.\u201d",
  "\u201cOne thing I noticed...\u201d",
  "\u201cHere's what makes it different.\u201d",
  "\u201cIf this is something you've been looking for...\u201d",
  "\u201cHere's what you should know before purchasing.\u201d",
];

export const HONESTY_RULE =
  "Don't teach creators to manipulate people into buying things they don't need. Teach them to communicate value honestly. A sale achieved through misleading promises can cost more in lost trust than it earns in revenue.";

/* ---------- 4. The advertisement must match the audience ---------- */
export interface MatrixRow {
  audience: string;
  matters: string;
  angle: string;
}

export const BLENDER_MATRIX: MatrixRow[] = [
  { audience: "Busy professionals", matters: "Convenience", angle: "\u201cMake your smoothie at work.\u201d" },
  { audience: "Fitness enthusiasts", matters: "Routine and portability", angle: "\u201cTake your smoothie routine with you.\u201d" },
  { audience: "Travelers", matters: "Space and convenience", angle: "\u201cA compact option for your travel bag.\u201d" },
  { audience: "Parents", matters: "Ease of preparation", angle: "\u201cA simple way to prepare a quick smoothie.\u201d" },
  { audience: "Students", matters: "Price and practicality", angle: "\u201cA compact blender for your dorm or small space.\u201d" },
];

export const MATRIX_INTRO =
  "One product can require five completely different advertisements because five different groups of people have different reasons to buy it.";

export const MATRIX_NOTE =
  "The product hasn't changed. The audience's motivation has. A creator should not assume that one advertisement will connect with everyone.";

export const MATRIX_RULE = "One product. Different audiences. Different motivations. Different stories.";

/* ---------- 5. The six-stage advertising framework ---------- */
export interface FrameworkStage {
  stage: string;
  action: string;
}

export const AD_FRAMEWORK: FrameworkStage[] = [
  { stage: "Hook", action: "Give the right viewer a reason to stop." },
  { stage: "Relate", action: "Introduce a recognizable need or situation." },
  { stage: "Demonstrate", action: "Show the product doing something useful." },
  { stage: "Explain", action: "Connect features to meaningful benefits." },
  { stage: "Prove", action: "Give honest evidence and address objections." },
  { stage: "Invite", action: "Make the next step clear." },
];

export interface ScriptSegment {
  window: string;
  stage: string;
  visual: string;
  say: string;
}

export const EXAMPLE_SCRIPT: ScriptSegment[] = [
  {
    window: "0–3 seconds",
    stage: "Hook",
    visual: "Show someone struggling to carry a large blender.",
    say: "\u201cWish you could make a smoothie without carrying that entire machine?\u201d",
  },
  {
    window: "3–7 seconds",
    stage: "Relate",
    visual: "Show the portable blender in a real everyday setting.",
    say: "\u201cI wanted something more convenient for busy days.\u201d",
  },
  {
    window: "7–13 seconds",
    stage: "Demonstrate",
    visual: "Add ingredients, operate the blender, show the result.",
    say: "\u201cHere's how this one works.\u201d",
  },
  {
    window: "18–22 seconds",
    stage: "Prove",
    visual: "Show the actual finished drink and product details.",
    say: "\u201cHere's the result. Just remember to check its capacity and battery specifications before buying.\u201d",
  },
  {
    window: "22–25 seconds",
    stage: "Invite",
    visual: "Product and clear on-screen CTA.",
    say: "\u201cIf portability matters to you, take a closer look at the details.\u201d",
  },
];

export const SCRIPT_DISCLAIMER =
  "This is an example script, not a promise of sales performance. The claims must match the actual product.";

/* ---------- 6. Make the advertisement visually stronger ---------- */
export interface VisualElement {
  title: string;
  text: string;
}

export const VISUAL_ELEMENTS: VisualElement[] = [
  {
    title: "Show, don't just talk",
    text: "If you're selling a blender, show it blending. If you're selling shoes, show them being worn. Let the viewer see the product in action.",
  },
  {
    title: "Improve the first frame",
    text: "Avoid starting with a blank screen, a long logo animation, or someone adjusting their camera. Start with a meaningful visual.",
  },
  {
    title: "Make editing serve the story",
    text: "Remove unnecessary pauses, repeated information, and irrelevant footage. Change shots when the story benefits from it, not just to make everything fast.",
  },
  {
    title: "Improve lighting and audio",
    text: "Use clear lighting, understandable speech, and music that doesn't overpower the message.",
  },
  {
    title: "Make it easy to understand without sound",
    text: "Use readable captions, simple on-screen explanations, and clear product shots.",
  },
];

export const VISUAL_NOTE =
  "TikTok's own creative guidance recommends vertical, platform-native content, clear sound, captions, movement, and product demonstrations.";

/* ---------- 7. The advertising diagnostic ---------- */
export const DIAGNOSTIC_INTRO =
  "Don't tell creators every unsuccessful video needs better editing. Sometimes the real problem is the message, audience, offer, or product.";

export interface DiagnosticRow {
  happens: string;
  investigate: string;
}

export const DIAGNOSTIC: DiagnosticRow[] = [
  { happens: "People scroll immediately", investigate: "Opening relevance and visual" },
  { happens: "People watch but don't click", investigate: "Offer clarity and motivation" },
  { happens: "People click but don't buy", investigate: "Price, trust, product page, shipping" },
  { happens: "People comment with questions", investigate: "Missing information or unclear claims" },
  { happens: "People watch but seem confused", investigate: "Message complexity and demonstration" },
  { happens: "People buy but return products", investigate: "Expectation versus actual experience" },
];

export const DIAGNOSTIC_CAVEAT =
  "These are diagnostic possibilities, not automatic explanations. Compare audience retention, clicks, comments, conversions, and customer feedback before deciding what to change.";

/* ---------- 8. The psychology of testing ---------- */
export interface TestVersion {
  version: string;
  hook_type: string;
}

export const TESTING_VERSIONS: TestVersion[] = [
  { version: "Version A", hook_type: "Problem-based hook" },
  { version: "Version B", hook_type: "Demonstration hook" },
  { version: "Version C", hook_type: "Transformation hook" },
];

export const TESTING_RULE =
  "Teach creators not to guess what works. Make three versions of the same advertisement. Keep the audience, offer, and other important variables as consistent as possible. Test different openings first.";

export const TESTING_METRICS: string[] = [
  "First-second and first-three-second retention.",
  "Average watch time.",
  "Video completion rate.",
  "Click-through rate.",
  "Conversion rate.",
  "Cost per purchase, when running paid advertising.",
];

export const TESTING_CLOSING =
  "A video with fewer views may generate more purchases than one with millions of views. Don't confuse popularity with profitability.";

/* ---------- 9. Different platforms, different creative ---------- */
export interface PlatformRow {
  platform: string;
  priority: string;
}

export const PLATFORMS: PlatformRow[] = [
  { platform: "TikTok", priority: "Native-feeling, entertaining, relevant storytelling" },
  { platform: "Instagram Reels", priority: "Visual appeal, identity, shareability" },
  { platform: "YouTube Shorts", priority: "Immediate context, curiosity, satisfying payoff" },
  { platform: "YouTube long-form", priority: "Strong opening promise, depth, sustained storytelling" },
  { platform: "Paid social ads", priority: "Audience relevance, clear value, proof, action" },
];

export const PLATFORMS_NOTE =
  "Don't teach creators to copy one video everywhere without adapting it. Different audiences, placements, and viewing behaviors require different creative decisions.";

/* ---------- 10. The UltraVestra advertising philosophy ---------- */
export const PHILOSOPHY: string[] = [
  "We don't teach creators to chase customers. We teach them to understand customers.",
  "We don't teach creators to shout louder. We teach them to communicate better.",
  "We don't teach creators to manufacture urgency. We teach them to communicate genuine value.",
  "We don't teach creators to make videos for everybody. We teach them to make relevant videos for the right people.",
];

/* ---------- 11. How UltraVestra advertises itself ---------- */
export const BRAND_AD_CONTEXT =
  "Ultra Vestra is not selling a physical product. It's introducing creators to a better way of thinking about content. Its advertisement must sell the value of understanding content creation.";

export const BRAND_AD_WEAK = {
  line: "\u201cWelcome to Ultra Vestra, the ultimate platform for content creators. Visit our website today!\u201d",
  why_weak: "It introduces the brand before explaining why the viewer should care.",
};

export interface BrandAdSegment {
  window: string;
  name: string;
  visual: string;
  voice: string;
}

export const BRAND_AD: BrandAdSegment[] = [
  {
    window: "0–1 second",
    name: "THE HOOK",
    visual: "A creator staring at a phone, watching their video get skipped.",
    voice: "\u201cYou're creating videos. But are you creating videos people actually want to watch?\u201d",
  },
  {
    window: "1–5 seconds",
    name: "THE PROBLEM",
    visual: "Quick scenes of weak openings, people scrolling, and product videos getting ignored.",
    voice:
      "\u201cMore editing, more posting, more products... but none of that matters if your audience doesn't connect with your message.\u201d",
  },
  {
    window: "5–11 seconds",
    name: "THE REALIZATION",
    visual: "The screen transforms into a futuristic intelligence interface.",
    voice:
      "\u201cWhat if you understood why people stop scrolling, what makes them trust you, and what makes them interested in buying?\u201d",
  },
  {
    window: "11–19 seconds",
    name: "THE SOLUTION",
    visual: "Show the Ultra Vestra learning universe and its educational resources.",
    voice:
      "\u201cMeet Ultra Vestra. Explore audience psychology, sales strategies, video improvement, advertising techniques, and brand opportunities.\u201d",
  },
  {
    window: "19–25 seconds",
    name: "THE INVITATION",
    visual: "Ultra Vestra logo appears with a glowing futuristic portal.",
    voice: "\u201cStop guessing what makes content work. Start understanding the people watching it. Discover Ultra Vestra.\u201d",
  },
];

/* ---------- 12. The permanent signature subject ---------- */
export const CURRICULUM: string[] = [
  "Understanding consumer behavior.",
  "The psychology of the first second.",
  "Writing hooks that attract the right audience.",
  "Storytelling that sells without sounding pushy.",
  "Product positioning and demonstrations.",
  "Advertising mistakes that destroy trust.",
  "Persuasion versus manipulation.",
  "Understanding buyer objections.",
  "Video retention and creative testing.",
  "Turning audience insights into better advertisements.",
];

export interface Principle {
  name: string;
  explanation: string;
}

export const NEVER_COMPROMISE: Principle[] = [
  {
    name: "Relevance over cleverness",
    explanation: "A clever hook that attracts the wrong audience is not necessarily a good hook.",
  },
  {
    name: "Proof over promises",
    explanation: "Demonstrate what a product actually does instead of making exaggerated claims.",
  },
  {
    name: "Learning over assumptions",
    explanation: "Test creative ideas against real audience behavior.",
  },
];

/* ---------- Engraved ---------- */
export const ENGRAVED = {
  headline: "THE VIEWER IS NOT WAITING FOR YOUR VIDEO. YOUR VIDEO MUST GIVE THEM A REASON TO CARE.",
  firstSecond:
    "The first second is not supposed to sell the entire product. It is supposed to earn the opportunity to communicate the value.",
  closing: "That's the difference between teaching someone to make videos and teaching someone to understand advertising.",
};

/* ---------- Further study ---------- */
export interface Resource {
  label: string;
  url: string;
}

export const RESOURCES: Resource[] = [
  { label: "TikTok's video advertising guide", url: "https://ads.tiktok.com/business/en/guides/video-advertising-guide" },
  {
    label: "TikTok's creative best practices",
    url: "https://ads.tiktok.com/business/en/blog/creative-best-practices-top-performing-ads/",
  },
  { label: "TikTok's six creative principles", url: "https://ads.tiktok.com/business/en/creative-codes" },
];
