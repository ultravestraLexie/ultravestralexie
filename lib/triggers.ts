/* ULTRAVESTRA — THE 10 PSYCHOLOGICAL TRIGGERS — structured data.
 * A signature lesson of Ultra Vestra Creator Sales Intelligence:
 * how to make people stop scrolling, keep watching, trust your
 * message, and consider buying. The ten triggers with his instead /
 * try lines, the final lesson chain, the creator's cheat sheet, and
 * the 7-item Pre-Publishing Test — plus the map of THE HUMAN BUYING
 * LAB, the signature section where creators practice the triggers
 * instead of just reading them. Extracted faithfully from the
 * source document in content/ten-psychological-triggers.md.
 * Its honesty rules match Ultra Vestra's: never invent
 * testimonials, sales numbers, or popularity — proof is honest or
 * it is not proof. */

/* ---------- The opening (0–5 seconds, verbatim) ---------- */
export const OPENING =
  "Want to know why some product videos make people stop scrolling while others get ignored? It's not always the product. It's the psychology behind how you present it.";

export const SUBTITLE =
  "How to make people stop scrolling, keep watching, trust your message, and consider buying.";

export const SIGN_OFF = "Understand the psychology. Master the content. Earn the attention.";

/* ---------- The chain: his final-lesson order ---------- */
export interface ChainStage {
  stage: string;
  line: string;
}

export const CHAIN: ChainStage[] = [
  { stage: "Attention", line: "The first second earns attention." },
  { stage: "Interest", line: "The story creates interest." },
  { stage: "Understanding", line: "The demonstration builds understanding." },
  { stage: "Trust", line: "The evidence builds trust." },
  { stage: "Decision", line: "The offer gives people a reason to consider buying." },
];

/* ---------- The 10 triggers ---------- */
export interface Trigger {
  n: number;
  name: string;
  objective: string;
  teaching: string[];
  chain_stage: number; // index into CHAIN — where this trigger works in the video
  instead?: string;
  try_line?: string;
  examples?: string[];
  key_line?: string;
}

export const TRIGGERS: Trigger[] = [
  {
    n: 1,
    name: "Curiosity",
    objective: "Make them want to know more",
    teaching: [
      "Make people want to discover what happens next.",
      "Give viewers a genuine reason to stay. Make sure you deliver on the curiosity you create.",
    ],
    chain_stage: 0,
    instead: "Today I'm showing you a product.",
    try_line: "I didn't expect this little feature to be the most useful part.",
  },
  {
    n: 2,
    name: "Problem Recognition",
    objective: "Make the video relevant",
    teaching: [
      "Help viewers recognize a situation they actually experience.",
      "People pay attention when they recognize something relevant to their lives.",
    ],
    chain_stage: 1,
    instead: "Look at this amazing product.",
    try_line: "If you've ever struggled with ..., you might want to see this.",
  },
  {
    n: 3,
    name: "Pattern Interruption",
    objective: "Interrupt predictable scrolling",
    teaching: [
      "Break the expected visual pattern.",
      "Start with movement, a close-up, an unexpected demonstration, or an interesting result.",
      "Don't waste the opening seconds adjusting your camera or introducing yourself.",
    ],
    chain_stage: 0,
    key_line: "Make the first frame worth looking at.",
  },
  {
    n: 4,
    name: "Self-Identification",
    objective: "Attract the right audience",
    teaching: [
      "Make the intended audience recognize themselves.",
      "Speak to a real audience instead of trying to sell to everybody.",
    ],
    chain_stage: 0,
    examples: [
      "If you're always on the go...",
      "If you love keeping your home organized...",
      "If you're someone who prefers a simple routine...",
    ],
  },
  {
    n: 5,
    name: "Visual Proof",
    objective: "Demonstrate the value",
    teaching: [
      "Don't just tell people something works. Show them.",
      "Demonstrate the product. Show the details. Explain what viewers are seeing.",
    ],
    chain_stage: 2,
    key_line: "A convincing demonstration is often stronger than ten exaggerated compliments.",
  },
  {
    n: 6,
    name: "Social Proof",
    objective: "Build confidence honestly",
    teaching: [
      "People often look for reassurance before making a decision.",
      "Use genuine customer feedback, verified reviews, or real experiences with permission.",
    ],
    chain_stage: 3,
    key_line: "Never invent testimonials, sales numbers, or popularity.",
  },
  {
    n: 7,
    name: "Specificity",
    objective: "Make claims understandable",
    teaching: [
      "Vague statements are difficult to trust.",
      "Specific details help people understand what they're considering.",
    ],
    chain_stage: 2,
    instead: "This is really good quality.",
    try_line: "Here's the material, how it feels, and the feature I noticed.",
  },
  {
    n: 8,
    name: "Objection Handling",
    objective: "Address hesitation",
    teaching: [
      "Think about what might make someone hesitate.",
      "Is it the price? Size? Quality? How to use it? Whether it fits their needs?",
      "Answer those questions before the viewer has to ask.",
    ],
    chain_stage: 4,
    key_line: "Don't hide product limitations.",
  },
  {
    n: 9,
    name: "Emotional Connection",
    objective: "Make the message relatable",
    teaching: [
      "People connect with situations, experiences, and stories.",
      "Show how the product fits into a real routine.",
    ],
    chain_stage: 1,
    key_line: "Make the viewer understand the experience, not just the object.",
  },
  {
    n: 10,
    name: "Clear Call to Action",
    objective: "Guide the next step",
    teaching: [
      "Don't leave viewers wondering what to do next.",
      "If they're interested, explain where they can find the product, what details to check, or how to learn more.",
    ],
    chain_stage: 4,
    key_line: "Make the next step simple without pressuring them.",
  },
];

/* ---------- The final lesson ---------- */
export const FINAL_LESSON = {
  intro:
    "You don't need to use all ten triggers in every video. Choose the ones that make sense for your product and audience.",
  chain: CHAIN,
  closing: "Create for the person watching, not just for the product you're selling.",
};

/* ---------- The Pre-Publishing Test (verbatim) ---------- */
export const PRE_PUBLISHING_TEST: string[] = [
  "My opening gives the right audience a reason to stop.",
  "My video addresses a real need or interest.",
  "I demonstrate the product instead of just talking about it.",
  "I explain specific benefits.",
  "I provide honest evidence.",
  "I address at least one possible buying objection.",
  "My call to action is clear.",
];

export const PRE_PUBLISHING_NOTE =
  "Use this checklist before publishing a TikTok Shop, creator, or affiliate advertisement.";

/* ---------- THE HUMAN BUYING LAB ---------- */
export const LAB_INTRO =
  "Understand what makes people pay attention, develop interest, evaluate products, and make purchasing decisions.";

export const LAB_PRINCIPLE =
  "A creator's job isn't to make everybody buy. It's to help the right person understand why a product might be worth buying.";

export interface LabTool {
  name: string;
  href: string;
}

export interface LabArea {
  area: string;
  inside: string;
  tools: LabTool[];
}

export const LAB_AREAS: LabArea[] = [
  {
    area: "Hook psychology experiments",
    inside:
      "Put openings head to head: decode what a hook is doing psychologically, then build your first three seconds two ways and let the stronger structure win.",
    tools: [
      { name: "Hook Decoder", href: "/secret-weapon#psychology-lab" },
      { name: "First 3 Seconds Chamber", href: "/creator-growth/first-3-seconds" },
    ],
  },
  {
    area: "Buyer behavior breakdowns",
    inside:
      "Break down the person watching: what they want, what frustrates them, what they are afraid of — and diagnose why a video's numbers look the way they do.",
    tools: [
      { name: "Audience Lens", href: "/creator-growth/human-behind-the-view" },
      { name: "Ad Diagnostic", href: "/creator-growth/human-behind-the-view" },
    ],
  },
  {
    area: "Weak versus strong advertising examples",
    inside:
      "Place a weak line next to its stronger version and study exactly what changed — then run your own lines through a makeover.",
    tools: [
      { name: "Say It Better", href: "/creator-growth/human-behind-the-view" },
      { name: "Makeover Studio", href: "/secret-weapon#sales-vault" },
    ],
  },
  {
    area: "Product demonstration challenges",
    inside:
      "Grade your video against the seven product-to-purchase questions, fix the weakest point first, and take on a daily filming challenge.",
    tools: [
      { name: "Product-to-Purchase Evaluator", href: "/creator-growth/product-to-purchase-lab" },
      { name: "Challenge of the Day", href: "/secret-weapon#experiment-room" },
    ],
  },
  {
    area: "Sales script transformations",
    inside:
      "Rebuild a loose script on the six-stage advertising framework — hook, relate, demonstrate, explain, prove, invite — timed to the second.",
    tools: [
      { name: "Ad Architect", href: "/creator-growth/human-behind-the-view" },
      { name: "Script Laboratory", href: "/secret-weapon#sales-vault" },
    ],
  },
  {
    area: "Real-world ad analysis",
    inside:
      "Autopsy a real video stage by stage — attention, interest, understanding, trust, decision — and find exactly where it broke.",
    tools: [{ name: "Autopsy Worksheet", href: "/secret-weapon#experiment-room" }],
  },
  {
    area: "Ethical persuasion techniques",
    inside:
      "The honesty rules that govern every UltraVestra lesson: never invent proof, never fake urgency, never hide limitations. Persuasion that respects the viewer.",
    tools: [{ name: "The honesty rules", href: "/creator-growth/human-behind-the-view" }],
  },
  {
    area: "Video conversion diagnostics",
    inside:
      "Start from the symptom — views without clicks, clicks without purchases — investigate the cause, and repair the stage where buyers drop off.",
    tools: [
      { name: "Conversion Clinic", href: "/secret-weapon#sales-vault" },
      { name: "Product-to-Purchase Evaluator", href: "/creator-growth/product-to-purchase-lab" },
    ],
  },
];

/* ---------- Goal → trigger sets (for the Trigger Stack tool) ---------- */
export interface GoalTriggers {
  goal: string;
  triggers: string[]; // trigger names, in recommended order
  how: string;
}

export const GOAL_TRIGGERS: GoalTriggers[] = [
  {
    goal: "Stop the scroll",
    triggers: ["Pattern Interruption", "Curiosity", "Self-Identification"],
    how: "Open on a first frame worth looking at, name the right viewer in the first seconds, and open a loop they want to see closed.",
  },
  {
    goal: "Keep them watching",
    triggers: ["Curiosity", "Problem Recognition", "Emotional Connection"],
    how: "Make the situation instantly recognizable, keep a genuine question open, and let a real story or routine carry the middle of the video.",
  },
  {
    goal: "Build trust",
    triggers: ["Visual Proof", "Social Proof", "Specificity"],
    how: "Show the product working instead of praising it, use only genuine feedback and verified reviews, and replace vague claims with specific details.",
  },
  {
    goal: "Help them decide",
    triggers: ["Objection Handling", "Specificity", "Clear Call to Action"],
    how: "Answer the hesitation before the viewer has to ask, state the specifics plainly, and end with one simple next step — no pressure.",
  },
];
