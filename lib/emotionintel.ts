/* ULTRAVESTRA — HUMAN EMOTION & CONVERSION INTELLIGENCE — structured data.
 * The conversion layer that sits on top of the Human-First system
 * (lib/humanfirst.ts), the Human Emotion Video Playbook
 * (lib/playbook.ts) and Lexie Viral Base 1 (lib/viralbase.ts): the
 * 14-emotion library, emotion fusion, the twelve creative directions,
 * sales video intelligence, UGC intelligence, three complete worked
 * concepts, conversion hook families, diagnostics, the Creative
 * Intelligence scorecard and the Human Response Dashboard. Extracted
 * faithfully from the source document in
 * content/human-emotion-conversion-intelligence.md.
 * Its honesty rules match UltraVestra's: hooks must match what the
 * video delivers, claims must be supported, and product accuracy and
 * disclosure are mandatory gates — never trade-offs. */

/* ---------- The master formula: five steps, in order ---------- */
export interface MasterFormulaStep {
  step: string;
  question: string;
}

export const MASTER_FORMULA: MasterFormulaStep[] = [
  { step: "Human Audience", question: "Who are we speaking to?" },
  { step: "Human Motivation", question: "What matters to them?" },
  { step: "Emotion", question: "What should they feel?" },
  { step: "Content Experience", question: "What should they see, hear, learn, and experience?" },
  { step: "Viewer Value & Next Action", question: "Learn · Trust · Comment · Save · Explore · Buy" },
];

export const MASTER_FORMULA_NOTE =
  "One skincare product can support many different creative experiences. A creator might teach with it, tell a personal story, demonstrate it, compare it, make viewers laugh, or create a cinematic product commercial. The product stays the same. The human experience changes.";

/* ---------- The human emotion library: 14 creative directions ---------- */
export interface LibraryEmotion {
  name: string;
  /* Short token used by the Emotion Fusion Reactor and combinations. */
  short: string;
  humanThought: string;
  content: string;
  hook: string;
  bestFor: string;
}

export const EMOTION_LIBRARY: LibraryEmotion[] = [
  {
    name: "Curiosity",
    short: "Curiosity",
    humanThought: "What is this? What am I missing?",
    content: "Reveal an overlooked skincare fact, ingredient explanation, or product demonstration.",
    hook: "Before you buy another skincare product, there's something you should understand.",
    bestFor: "Discovery, education, product introductions.",
  },
  {
    name: "Happiness and joy",
    short: "Happiness",
    humanThought: "This feels enjoyable.",
    content: "A satisfying routine, cheerful morning ritual, or relatable skincare moment.",
    hook: "A little self-care moment before the day gets busy.",
    bestFor: "Lifestyle UGC, positive brand association, community.",
  },
  {
    name: "Confidence",
    short: "Confidence",
    humanThought: "I understand this better now. I can make a choice.",
    content: "Explain what a product does, how to use it, and what to consider before choosing.",
    hook: "You don't need a complicated routine to make informed skincare choices.",
    bestFor: "Education, trust-building, conversion.",
  },
  {
    name: "Trust",
    short: "Trust",
    humanThought: "This person is being honest with me.",
    content: "Transparent reviews, real product demonstrations, limitations, who the product may not suit.",
    hook: "Let me show you exactly what this product does—and what it doesn't do.",
    bestFor: "UGC reviews, consideration, purchase decisions.",
  },
  {
    name: "Frustration and relief",
    short: "Frustration",
    humanThought: "Finally, someone understands how confusing this is.",
    content: "Show the problem of too many choices, then simplify the decision.",
    hook: "Why does choosing a moisturizer have to feel so complicated?",
    bestFor: "Problem-solution videos and beginner education.",
  },
  {
    name: "Desire and aspiration",
    short: "Desire",
    humanThought: "I would enjoy having this in my routine.",
    content: "Texture, packaging, ritual, sensory details, and verified product benefits.",
    hook: "If you love a simple, enjoyable skincare routine, look at this.",
    bestFor: "Product showcases, lifestyle campaigns, sales videos.",
  },
  {
    name: "Humor and amusement",
    short: "Humor",
    humanThought: "That's so relatable!",
    content: "Skincare mistakes, funny routines, exaggerated product confusion, playful storytelling.",
    hook: "Me trying to understand 17 skincare products when I only wanted a face wash.",
    bestFor: "Reach, shares, relatability, creator personality.",
  },
  {
    name: "Empathy and understanding",
    short: "Empathy",
    humanThought: "I'm not the only person who feels this way.",
    content: "Acknowledge beginner concerns without judgment, shame, or pressure.",
    hook: "If skincare has ever made you feel overwhelmed, this is for you.",
    bestFor: "Connection, community, beginner-focused UGC.",
  },
  {
    name: "Surprise",
    short: "Surprise",
    humanThought: "I didn't expect that.",
    content: "Reveal a useful product detail, ingredient fact, texture, or unexpected way of demonstrating a feature.",
    hook: "I thought this product was for one thing. Here's what I learned.",
    bestFor: "Demonstrations, product discovery, storytelling.",
  },
  {
    name: "Calm and reassurance",
    short: "Calm",
    humanThought: "I don't have to rush. I can take my time.",
    content: "Gentle demonstrations, uncomplicated explanations, soothing routine videos.",
    hook: "Let's take the stress out of building your first skincare routine.",
    bestFor: "Routine demonstrations, sensitive-audience communication, brand identity.",
  },
  {
    name: "Belonging",
    short: "Belonging",
    humanThought: "These are people who understand me.",
    content: "Beginner communities, shared experiences, audience questions, creator stories.",
    hook: "Skincare beginners, let's learn this together.",
    bestFor: "Comments, community building, returning viewers.",
  },
  {
    name: "Hope and possibility",
    short: "Hope",
    humanThought: "I can make a better start.",
    content: "A realistic beginner plan, simple steps, educational progress.",
    hook: "Your first skincare routine can start with understanding three basics.",
    bestFor: "Educational series and customer confidence.",
  },
  {
    name: "Satisfaction",
    short: "Satisfaction",
    humanThought: "That was useful. I got something out of this.",
    content: "Clear before-and-after explanations where truthful, a completed routine, a satisfying texture demonstration, or a simple takeaway.",
    hook: "Here's the simplest way to understand these three skincare steps.",
    bestFor: "Saves, repeat viewing, product understanding.",
  },
  {
    name: "Control and empowerment",
    short: "Control",
    humanThought: "I can make my own informed decision.",
    content: "Teach viewers how to read labels, compare product purposes, and ask better questions.",
    hook: "Three questions to ask before adding a skincare product to your routine.",
    bestFor: "High-trust education and informed buying.",
  },
];

export const EMOTION_LIBRARY_NOTE =
  "These are creative directions—not buttons that guarantee a particular psychological response. Each emotion should be grounded in the audience, the actual product, and the video's purpose.";

/* Other useful emotional dimensions — creators may combine emotions
 * rather than forcing every video into one category. */
export const EXTRA_DIMENSIONS: string[] = [
  "Nostalgia",
  "Pride",
  "Admiration",
  "Anticipation",
  "Wonder",
  "Inspiration",
  "Playfulness",
  "Intimacy",
  "Achievement",
];

/* ---------- Emotion Fusion Reactor: proven combinations ---------- */
export interface FusionCombination {
  /* Short emotion tokens, e.g. ["Curiosity", "Surprise"]. */
  pair: string[];
  experience: string;
  example: string;
}

export const FUSION_COMBINATIONS: FusionCombination[] = [
  { pair: ["Curiosity", "Surprise"], experience: "Discovery", example: "The skincare label detail beginners overlook." },
  { pair: ["Humor", "Empathy"], experience: "Relatable entertainment", example: "Trying to understand skincare for the first time." },
  { pair: ["Confidence", "Trust"], experience: "Reassuring education", example: "How to choose a moisturizer thoughtfully." },
  { pair: ["Desire", "Satisfaction"], experience: "Sensory product experience", example: "A beautiful, honest moisturizer demonstration" },
  { pair: ["Hope", "Belonging"], experience: "Community", example: "Let's build our first simple routines together." },
  { pair: ["Curiosity", "Desire"], experience: "Product discovery", example: "What does this serum actually do?" },
  { pair: ["Frustration", "Relief"], experience: "Problem-solving", example: "Stop making your routine more complicated than it needs to be." },
  { pair: ["Surprise", "Humor"], experience: "Entertainment", example: "A funny, unexpected skincare demonstration" },
  { pair: ["Empathy", "Confidence"], experience: "Personal connection", example: "You aren't behind just because you're new to skincare." },
  { pair: ["Anticipation", "Satisfaction"], experience: "Storytelling", example: "An honest routine walkthrough with a clear conclusion" },
];

export const FUSION_RULE =
  "Don't combine emotions just because the combination sounds exciting. The emotions must serve the audience and the video's purpose.";

/* ---------- One product, twelve creative directions ---------- */
export interface CreativeDirection {
  name: string;
  description: string;
}

export const CREATIVE_DIRECTIONS: CreativeDirection[] = [
  { name: "Educational", description: "Teach what the product does." },
  { name: "Honest UGC review", description: "Share a genuine experience." },
  { name: "Product commercial", description: "Showcase verified features and benefits." },
  { name: "Sensory demonstration", description: "Let viewers see the texture and application." },
  { name: "Comedy", description: "Turn beginner confusion into a funny story." },
  { name: "Lifestyle", description: "Show how the product fits into a routine." },
  { name: "Ingredient explainer", description: "Explain verified ingredients in accessible language." },
  { name: "Comparison", description: "Compare product types or features fairly." },
  { name: "Personal story", description: "Explain a genuine learning experience." },
  { name: "Unboxing", description: "Show packaging, contents, and first impressions." },
  { name: "Beginner tutorial", description: "Give clear, actionable steps." },
  { name: "Brand storytelling", description: "Connect the product to a real human need and brand values." },
];

/* ---------- Sales Video Intelligence: six stages ---------- */
export interface SalesStage {
  name: string;
  job: string;
  detail: string;
  example?: string;
}

export const SALES_STAGES: SalesStage[] = [
  {
    name: "Attention",
    job: "Make the product relevant",
    detail: "Show a real audience problem or a desirable product experience.",
    example: "Confused about which moisturizer to choose?",
  },
  {
    name: "Recognition",
    job: "Help the viewer identify their need",
    detail: "Explain the problem without making the viewer feel inadequate.",
    example: "Different moisturizers can have different textures and purposes.",
  },
  {
    name: "Understanding",
    job: "Explain the product",
    detail: "Show its purpose, ingredients, texture, directions, and verified features.",
  },
  {
    name: "Evidence",
    job: "Demonstrate, don't just claim",
    detail: "Show the packaging, amount, application, texture, and any substantiated results. Clearly label personal experience versus independently established facts.",
  },
  {
    name: "Confidence",
    job: "Address buying questions",
    detail: "Explain who it may suit, who should check with a professional, what it costs if known, and any relevant limitations.",
  },
  {
    name: "Action",
    job: "Give a natural next step",
    detail: "Invite viewers to explore the product details, compare options, read ingredients, or ask a question.",
  },
];

export const SALES_INTRO =
  "A sales video is not simply a video that says “Buy this.” It should help a person understand why the product might be relevant, what it actually offers, whether it fits their needs, and where to find reliable information before deciding.";

/* ---------- The seven sales-video formats ---------- */
export interface SalesFormat {
  format: string;
  primaryEmotion: string;
  mainJob: string;
}

export const SALES_FORMATS: SalesFormat[] = [
  { format: "Problem → solution", primaryEmotion: "Relief", mainJob: "Explain relevance" },
  { format: "Product demonstration", primaryEmotion: "Curiosity", mainJob: "Show how it works or is used" },
  { format: "Honest review", primaryEmotion: "Trust", mainJob: "Reduce uncertainty" },
  { format: "Product comparison", primaryEmotion: "Confidence", mainJob: "Help choose" },
  { format: "Lifestyle integration", primaryEmotion: "Desire", mainJob: "Show how it fits daily life" },
  { format: "Objection answer", primaryEmotion: "Reassurance", mainJob: "Address hesitation" },
  { format: "Offer/product showcase", primaryEmotion: "Excitement", mainJob: "Explain a genuine offer and next step" },
];

/* ---------- Sales intelligence: why someone may hesitate ---------- */
export const OBJECTIONS: string[] = [
  "Is this suitable for my skin type?",
  "What does this product actually do?",
  "How do I use it?",
  "Is it fragranced?",
  "What are the ingredients?",
  "Can I use it with my existing products?",
  "How much does it cost?",
  "Is there a return policy?",
  "Are the advertised results supported?",
];

export const OBJECTIONS_CAVEAT =
  "These are potential buying objections, not proof that every viewer has them. The creator should answer only what can be verified.";

/* ---------- UGC Intelligence: three styles ---------- */
export interface UgcStyle {
  style: string;
  looksLike: string;
  builds: string;
}

export const UGC_STYLES: UgcStyle[] = [
  { style: "Organic UGC", looksLike: "A creator shares a real experience naturally", builds: "Relatability" },
  { style: "Educational UGC", looksLike: "A creator explains a product or category", builds: "Understanding" },
  { style: "Paid UGC advertisement", looksLike: "A creator produces content for a brand's marketing", builds: "Product consideration and action" },
];

export const UGC_NOTE =
  "A paid UGC video does not have to look like a hard sell. It can still feel conversational, useful, and authentic. But it must not pretend the creator independently purchased or used something if that is untrue.";

/* ---------- The UGC authenticity checklist ---------- */
export const AUTHENTICITY_CHECKLIST: string[] = [
  "Is the creator's experience genuine?",
  "Are personal opinions separated from product facts?",
  "Is the product shown clearly?",
  "Are all product claims supported?",
  "Is the content relevant to a defined audience?",
  "Does the video answer a real viewer question?",
  "Does it disclose a material brand relationship when required?",
  "Does it avoid fake reviews, fabricated results, or misleading before-and-after imagery?",
  "Is the call to action appropriate?",
  "Does the content respect the viewer's intelligence?",
];

/* ---------- Three complete creative executions ---------- */
export interface ExampleConcept {
  id: string;
  name: string;
  emotions: string;
  audience: string;
  hook: string;
  script: string;
  visualDirection: string;
  conversionPurpose: string;
}

export const EXAMPLE_CONCEPTS: ExampleConcept[] = [
  {
    id: "A",
    name: "Educational UGC",
    emotions: "Curiosity + Confidence + Trust",
    audience: "Skincare beginners who don't understand moisturizer.",
    hook: "What does moisturizer actually do? Let's make it simple.",
    script:
      "If you're new to skincare, you might hear everyone talking about moisturizer, but what does it actually do? A moisturizer helps keep your skin hydrated. But different formulas can feel very different. Some are lighter, while others are richer. So instead of buying something just because it's trending, think about your skin's needs, the formula, and how it feels when used as directed. Skincare isn't about owning everything. It's about understanding what you're choosing. What's your biggest moisturizer question?",
    visualDirection: "Creator speaking directly to camera, close-up of product texture, simple labels, application demonstration.",
    conversionPurpose: "Build product-category understanding and invite questions.",
  },
  {
    id: "B",
    name: "Sales UGC",
    emotions: "Desire + Curiosity + Reassurance",
    audience: "People already considering a moisturizer.",
    hook: "Before you choose your next moisturizer, look at these three things.",
    script:
      "First, look at the formula. Does it fit what you're looking for? Second, understand the ingredients and product directions. Third, consider the texture and how it fits into your routine. Here's the moisturizer I'm featuring. Let's look at its actual formula, texture, and instructions so you can decide whether it deserves a place in yours. I'll leave the product information here so you can explore it yourself.",
    visualDirection: "Product hero shot, label close-up, texture demonstration, creator explanation, product details on screen.",
    conversionPurpose: "Move interested viewers toward informed product exploration.",
  },
  {
    id: "C",
    name: "Entertainment UGC",
    emotions: "Humor + Surprise + Belonging",
    audience: "Beginners overwhelmed by skincare trends.",
    hook: "Me trying to build a skincare routine after watching 47 skincare videos.",
    script:
      "Video one says I need a serum. Video two says I need an exfoliator. Video three says I need five different creams. Me? I just wanted to understand what moisturizer does! So today we're keeping it simple. Let's learn what the product is, what it does, and how to choose something that makes sense for our own routine. Skincare beginners, we're learning together.",
    visualDirection: "Quick comedic cuts, exaggerated confused expression, then a calm product explanation.",
    conversionPurpose: "Build affinity and make viewers comfortable exploring skincare content.",
  },
];

export const EXAMPLE_CONCEPTS_NOTE =
  "These examples use a hypothetical moisturizer. They are concept demonstrations, not claims about a real product.";

/* ---------- Conversion hook intelligence: twelve families ---------- */
export interface HookFamily {
  family: string;
  example: string;
}

export const HOOK_FAMILIES: HookFamily[] = [
  { family: "Curiosity", example: "Have you ever wondered what this ingredient actually does?" },
  { family: "Problem recognition", example: "If choosing skincare feels confusing, start here." },
  { family: "Demonstration", example: "Let's see what this formula looks like." },
  { family: "Education", example: "Three things to understand before choosing a moisturizer." },
  { family: "Personal experience", example: "Here's what I noticed when I tried this product." },
  { family: "Comparison", example: "What's the difference between a light and rich moisturizer?" },
  { family: "Humor", example: "Why does my skincare routine need its own instruction manual?" },
  { family: "Trust", example: "Here's what this product claims, and what you should check for yourself." },
  { family: "Desire", example: "A closer look at this simple skincare ritual." },
  { family: "Objection handling", example: "Wondering whether this moisturizer fits your routine? Let's examine its details." },
  { family: "Community", example: "Skincare beginners, what do you want explained next?" },
  { family: "Storytelling", example: "I used to think every skincare product did the same thing." },
];

export const HOOK_ACCURACY_RULE =
  "The hook must accurately match what the video delivers. Never use an exaggerated promise just to attract attention.";

/* ---------- Diagnose why a video isn't converting ---------- */
export interface Diagnostic {
  symptom: string;
  possibleExplanation: string;
  recommendation: string;
}

export const DIAGNOSTICS: Diagnostic[] = [
  {
    symptom: "People scroll past quickly",
    possibleExplanation: "Opening may not identify their interest",
    recommendation: "Test a more audience-specific opening",
  },
  {
    symptom: "People watch but don't understand",
    possibleExplanation: "Explanation may be too complicated",
    recommendation: "Simplify and demonstrate",
  },
  {
    symptom: "People watch but don't trust the claims",
    possibleExplanation: "Not enough evidence or transparency",
    recommendation: "Show product details and qualify claims",
  },
  {
    symptom: "People comment but don't explore",
    possibleExplanation: "Content may be entertaining but not explain product relevance",
    recommendation: "Add a natural product explanation",
  },
  {
    symptom: "People click but don't purchase",
    possibleExplanation: "Price, product fit, offer, or product-page issues may matter",
    recommendation: "Investigate the full buying journey",
  },
  {
    symptom: "People purchase but don't return",
    possibleExplanation: "Product experience, expectations, or customer experience may need investigation",
    recommendation: "Examine feedback and customer questions",
  },
];

export const DIAGNOSTICS_NOTE =
  "These are diagnostic possibilities, not conclusions. Actual video analytics, product-page data, and customer feedback are needed to identify causes.";

/* ---------- The Creative Intelligence scorecard ---------- */
export interface ScorecardDimension {
  dimension: string;
  evaluates: string;
}

export const SCORECARD_DIMENSIONS: ScorecardDimension[] = [
  { dimension: "Audience precision", evaluates: "Is the intended viewer clearly defined?" },
  { dimension: "Human relevance", evaluates: "Does the content address a genuine need?" },
  { dimension: "Emotional clarity", evaluates: "Is the intended emotional experience clear?" },
  { dimension: "Originality", evaluates: "Does the concept offer a distinctive angle?" },
  { dimension: "Hook relevance", evaluates: "Does the opening speak to the audience?" },
  { dimension: "Content value", evaluates: "Does the viewer receive something useful?" },
  { dimension: "Product accuracy", evaluates: "Are claims supported?" },
  { dimension: "Visual storytelling", evaluates: "Can the idea be communicated visually?" },
  { dimension: "Trustworthiness", evaluates: "Is the content transparent?" },
  { dimension: "Conversion path", evaluates: "Is the next action natural and clear?" },
  { dimension: "Platform fit", evaluates: "Does it suit Instagram Reels?" },
  { dimension: "UGC authenticity", evaluates: "Does it feel truthful and human?" },
];

export const SCORECARD_NOTE =
  "Illustrative scoring framework, not a prediction of views or sales.";

export const SCORECARD_GATES =
  "A strong concept should not be allowed to compensate for false claims with a high creativity score. Product accuracy and disclosure are mandatory quality gates, not trade-offs.";

/* ---------- The Human Response Dashboard: measure after publishing ---------- */
export interface ResponseLayer {
  layer: string;
  measures: string;
}

export const RESPONSE_DASHBOARD: ResponseLayer[] = [
  { layer: "Attention", measures: "Views, average watch time, retention, initial viewing behavior." },
  { layer: "Interest", measures: "Shares, saves, profile visits, relevant repeat viewing." },
  { layer: "Connection", measures: "Meaningful comments, questions, replies, community participation." },
  { layer: "Consideration", measures: "Product-page visits, link clicks, product-detail exploration." },
  { layer: "Conversion", measures: "Attributed purchases, conversion rate, revenue, where measurable." },
  { layer: "Long-term value", measures: "Returning viewers, repeat purchases, customer feedback, trust." },
];

export const RESPONSE_DASHBOARD_NOTE =
  "Connect each creative concept to its intended objective. An educational Reel might succeed through saves and questions without generating immediate sales. A product advertisement may be judged by qualified clicks and attributed purchases. Don't compare every video using the same success measure.";

/* ---------- Creative Mission Builder: the choices (source section 14) ---------- */
export const MISSION_TYPES: string[] = [
  "Educational content",
  "Sales video",
  "UGC that builds trust",
  "Entertainment and connection",
  "Community-building content",
];

export const CONTENT_FORMATS: string[] = [
  "Natural UGC",
  "Cinematic product commercial",
  "Creator talking to camera",
  "Product demonstration",
  "Storytelling",
  "Comedy/skit",
];
