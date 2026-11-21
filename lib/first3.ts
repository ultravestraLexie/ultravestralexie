/* ULTRAVESTRA — THE FIRST 3 SECONDS INTELLIGENCE SYSTEM — structured data.
 * The opening layer of creator training: the three-second breakdown
 * (Interrupt / Connect / Create a reason to stay), the 15 powerful
 * opening styles, five complete worked hooks, the HOOK → PROOF →
 * VALUE → PAYOFF → ACTION sequence, what to measure, and THE
 * ULTRAVESTRA RULE. Extracted faithfully from the source document in
 * content/first-3-seconds.md.
 * Its honesty rules match UltraVestra's: an opening is a creative
 * testing hypothesis, never a guaranteed attention formula — and a
 * hook must be truthful, because the rest of the video must deserve
 * the attention the first three seconds earn. */

/* ---------- The mission ---------- */
export const MISSION = {
  headline: "Win the Scroll or Lose the Viewer.",
  paragraphs: [
    "The viewer is scrolling through hundreds of competing pieces of content. They don't know you. They don't know your product. And they haven't decided to give you their attention.",
    "Your opening has one mission: give the right person a compelling reason to stop.",
    "Not by shouting. Not by begging for attention. Not by making unrealistic promises. By making the viewer immediately recognize something interesting, useful, surprising, or relevant.",
  ],
};

/* ---------- The three-second breakdown ---------- */
export interface ThreeBeat {
  second: string;
  name: string;
  tagline: string;
  description: string;
  examples: string[];
}

export const THREE_BEATS: ThreeBeat[] = [
  {
    second: "Second 1",
    name: "INTERRUPT",
    tagline: "Get noticed",
    description: "Show something visually interesting or say something immediately relevant.",
    examples: [
      "A product demonstration already in progress.",
      "A surprising visual.",
      "A recognizable customer problem.",
      "A bold but truthful statement.",
    ],
  },
  {
    second: "Second 2",
    name: "CONNECT",
    tagline: "Make it relevant",
    description: "Make the viewer understand why this matters to them.",
    examples: [
      "\u201cIf you're new to skincare...\u201d",
      "\u201cIf you struggle with...\u201d",
      "\u201cBefore choosing your next...\u201d",
    ],
  },
  {
    second: "Second 3",
    name: "CREATE A REASON TO STAY",
    tagline: "Open curiosity",
    description: "Introduce a clear payoff that the video will deliver.",
    examples: [
      "\u201cHere's what to look for.\u201d",
      "\u201cLet me show you the difference.\u201d",
      "\u201cWatch how this works.\u201d",
    ],
  },
];

/* ---------- The 15 powerful opening styles ---------- */
export interface OpeningStyle {
  style: string;
  example: string;
}

export const OPENING_STYLES: OpeningStyle[] = [
  { style: "Problem", example: "Struggling to find the right moisturizer?" },
  { style: "Curiosity", example: "There's something you should check before buying this." },
  { style: "Demonstration", example: "Start by showing the product in action." },
  { style: "Surprise", example: "I didn't expect this detail." },
  { style: "Transformation", example: "Show a truthful, relevant result or completed process." },
  { style: "Question", example: "Are you choosing skincare based on your actual needs?" },
  { style: "Comparison", example: "Let's compare these two product textures." },
  { style: "Relatable moment", example: "When you want a simple routine but skincare has 20 steps." },
  { style: "Mistake", example: "One thing beginners often forget when choosing skincare." },
  { style: "Personal story", example: "Here's what I learned when I tried this." },
  { style: "Sensory", example: "Show a close-up of the product texture or sound." },
  { style: "Mystery", example: "Can you guess what this product is designed for?" },
  { style: "Challenge", example: "Let's see if this product is as easy to use as it looks." },
  { style: "Benefit", example: "Here's a simple way to make your morning routine easier." },
  { style: "Direct audience callout", example: "Skincare beginners, this one's for you." },
];

/* ---------- Five complete three-second hooks (skincare) ---------- */
export interface ExampleHook {
  letter: string;
  style: string;
  spoken: string;
  visual: string;
  why: string;
}

export const EXAMPLE_HOOKS: ExampleHook[] = [
  {
    letter: "A",
    style: "Problem",
    spoken: "Still confused about which moisturizer to choose?",
    visual: "Creator holds two products up to the camera.",
    why: "The viewer recognizes a familiar decision.",
  },
  {
    letter: "B",
    style: "Demonstration",
    spoken: "Look at the texture of this moisturizer.",
    visual: "Start with the cream already being dispensed.",
    why: "The viewer immediately sees the product experience.",
  },
  {
    letter: "C",
    style: "Curiosity",
    spoken: "Before buying this, here's what you should know.",
    visual: "Show the product label, then turn it toward the camera.",
    why: "It promises useful buying information.",
  },
  {
    letter: "D",
    style: "Humor",
    spoken: "I just wanted a simple skincare routine!",
    visual: "Creator looks at a mountain of products.",
    why: "It creates a relatable, entertaining moment.",
  },
  {
    letter: "E",
    style: "Direct benefit",
    spoken: "Let's make choosing skincare easier.",
    visual: "Remove unnecessary products from the frame and introduce the featured product.",
    why: "It promises clarity to beginners.",
  },
];

/* ---------- HOOK → PROOF → VALUE → PAYOFF → ACTION ---------- */
export interface SequenceStep {
  step: string;
  question: string;
}

export const SEQUENCE: SequenceStep[] = [
  { step: "Hook", question: "Why should I watch?" },
  { step: "Proof", question: "Show me something real." },
  { step: "Value", question: "What does it mean for me?" },
  { step: "Payoff", question: "What did I learn or discover?" },
  { step: "Action", question: "What can I do next?" },
];

export interface TimedExample {
  time: string;
  step: string;
  content: string;
}

export const TIMED_EXAMPLE: TimedExample[] = [
  { time: "0–3 sec", step: "Hook", content: "\u201cStill confused about choosing a moisturizer?\u201d" },
  { time: "3–7 sec", step: "Proof", content: "Show the product and its actual texture." },
  { time: "7–14 sec", step: "Value", content: "Explain its purpose and relevant features." },
  { time: "14–22 sec", step: "Payoff", content: "Explain what to check when choosing one." },
  { time: "22–28 sec", step: "Action", content: "Give a clear conclusion and invite viewers to explore the product details." },
];

export const MISTAKE_NOTE =
  "A strong opening is not enough. If you make someone curious and then spend the next ten seconds introducing yourself, repeating the product name, or delaying the demonstration, you risk losing their interest.";

/* ---------- What to measure ---------- */
export const MEASURE: string[] = [
  "Initial retention or the available opening-view metric.",
  "Average watch time.",
  "Percentage of video watched.",
  "Rewatches.",
  "Product clicks.",
  "Attributed purchases.",
];

export const MEASURE_NOTE =
  "The first three seconds are a creative testing hypothesis, not a guaranteed attention formula. Compare versions with similar audiences and traffic conditions where possible. Don't judge a hook only by views.";

/* ---------- THE ULTRAVESTRA RULE ---------- */
export const RULE = {
  headline: "The first three seconds earn the opportunity. The rest of the video must deserve the attention.",
  lines: [
    "Stop the scroll with relevance.",
    "Keep attention with storytelling.",
    "Build confidence with evidence.",
    "Earn action with value.",
  ],
  closing: "UltraVestra — Don't just make them watch. Give them a reason to care.",
};
