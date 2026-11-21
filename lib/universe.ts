/* ULTRAVESTRA — THE CREATOR PROBLEM-SOLVING UNIVERSE — structured
 * data for the homepage rebuild. The goal is not to give creators
 * more information; it is to help them get better results by
 * solving the problems stopping them from growing, creating, and
 * earning. This file carries his mission and promise, the brand
 * identity lines, the six departments (each built around one
 * creator problem), the six Solve My Problem challenges with their
 * starting-point first steps, the six-step solution pathway every
 * lesson follows, the five signature tools, the success measures
 * (creator outcomes, never article counts), and the ultimate-goal
 * quotes. Extracted faithfully from the source document in
 * content/creator-problem-solving-universe.md. Its honesty rule
 * matches UltraVestra's: never promise viral videos or guaranteed
 * sales — teach creators to make informed improvements. */

/* ---------- The mission & the promise ---------- */
export const MISSION = "Turn creator frustration into creator progress.";

export const PROMISE =
  "Every resource should help a creator understand a problem, identify what's causing it, and take action to improve it.";

/* ---------- The brand identity ---------- */
export interface Identity {
  beyond: string;
  dontJust: string;
  intelligence: string;
}

export const IDENTITY: Identity = {
  beyond: "BEYOND CREATING. INTO UNDERSTANDING.",
  dontJust: "Don't just create more. Understand what works.",
  intelligence: "THE INTELLIGENCE BEHIND BETTER CONTENT.",
};

/* ---------- THE ULTRA VESTRA PHILOSOPHY — the defining statement ---------- */
export interface Philosophy {
  line1: string;
  line2: string;
  sub: string;
  steps: string;
  tagline: string;
}

export const PHILOSOPHY: Philosophy = {
  line1: "OTHER PLATFORMS GIVE YOU TIPS.",
  line2: "WE HELP YOU SOLVE THE PROBLEM.",
  sub: "Don't just learn what to do. Understand WHY it works.",
  steps: "Diagnose. Understand. Improve. Apply. Grow.",
  tagline: "THE INTELLIGENCE BEHIND BETTER CONTENT.",
};

/* ---------- The page standard: what the philosophy means in practice ---------- */
export interface PageStandardPair {
  dont: string;
  instead: string;
}

export const PAGE_STANDARD: PageStandardPair[] = [
  {
    dont: "Don't just teach hooks.",
    instead: "Help creators understand why viewers scroll away.",
  },
  {
    dont: "Don't just give sales scripts.",
    instead: "Help creators understand why buyers hesitate.",
  },
  {
    dont: "Don't just show editing tips.",
    instead: "Help creators identify what's weakening their videos.",
  },
  {
    dont: "Don't just list brands.",
    instead: "Help creators find and evaluate worthwhile opportunities.",
  },
  {
    dont: "Don't just show analytics.",
    instead: "Help creators understand what the numbers might be telling them.",
  },
];

export const PAGE_STANDARD_LINE =
  "Every resource must solve a real creator problem or teach a skill that helps prevent one.";

/* ---------- The six departments ---------- */
export interface DepartmentTool {
  name: string;
  href: string;
}

export interface Department {
  n: string;
  name: string;
  problem: string;
  solutions: string;
  href: string;
  tools: DepartmentTool[];
}

export const DEPARTMENTS: Department[] = [
  {
    n: "01",
    name: "THE ATTENTION LAB",
    problem: "Nobody watches my videos.",
    solutions:
      "Hooks, first-three-second strategies, opening visuals, storytelling, retention, and scroll-stopping techniques.",
    href: "/creator-growth/first-3-seconds",
    tools: [
      { name: "First 3 Seconds", href: "/creator-growth/first-3-seconds" },
      { name: "Captivating Attention", href: "/creator-growth/art-of-captivating-attention" },
      { name: "Hook Decoder", href: "/secret-weapon" },
      { name: "Why Is My Video Not Working?", href: "/why-is-my-video-not-working" },
    ],
  },
  {
    n: "02",
    name: "THE SALES INTELLIGENCE LAB",
    problem: "People watch but don't buy.",
    solutions:
      "Creator videos, TikTok Shop videos, product demonstrations, buyer psychology, scripts, objections, and conversion improvement.",
    href: "/human-buying-lab",
    tools: [
      { name: "The Human Buying Lab", href: "/human-buying-lab" },
      { name: "The 10 Psychological Triggers", href: "/creator-growth/ten-psychological-triggers" },
      { name: "The Product-to-Purchase Lab", href: "/creator-growth/product-to-purchase-lab" },
      { name: "The Human Behind the View", href: "/creator-growth/human-behind-the-view" },
    ],
  },
  {
    n: "03",
    name: "THE BRAND OBSERVATORY",
    problem: "I can't find good brands to work with.",
    solutions:
      "Brand opportunities, affiliate programs, commission information, partnership requirements, and brand research.",
    href: "/discover",
    tools: [
      { name: "Opportunity Finder", href: "/discover" },
      { name: "Brand Opportunity Radar", href: "/radar" },
      { name: "Commission Intelligence", href: "/commissions" },
      { name: "Ask UltraVestra", href: "/ask" },
    ],
  },
  {
    n: "04",
    name: "THE CONTENT REPAIR CENTER",
    problem: "My videos aren't good enough, and I don't know how to improve them.",
    solutions:
      "Editing, lighting, sound, framing, pacing, captions, video audits, and before-and-after improvements.",
    href: "/why-is-my-video-not-working",
    tools: [
      { name: "Why Is My Video Not Working?", href: "/why-is-my-video-not-working" },
      { name: "Creator Diagnostic", href: "/coach" },
      { name: "Autopsy Worksheet", href: "/secret-weapon" },
      { name: "Product-to-Purchase Evaluator", href: "/creator-growth/product-to-purchase-lab" },
    ],
  },
  {
    n: "05",
    name: "THE CREATOR BUSINESS CENTER",
    problem: "I don't know how to turn content creation into a business.",
    solutions:
      "Pricing, negotiations, usage rights, contracts, brand communication, workflow, and growth.",
    href: "/academy",
    tools: [
      { name: "Creator Academy", href: "/academy" },
      { name: "The Art of Human Connection", href: "/creator-growth/art-of-human-connection" },
      { name: "The Audience First Protocol", href: "/creator-growth/audience-first-protocol" },
    ],
  },
  {
    n: "06",
    name: "THE CREATOR SIMULATOR",
    problem: "I understand the advice, but I don't know how to apply it.",
    solutions:
      "Interactive challenges, simulated buyer decisions, script exercises, content scenarios, and practical assignments.",
    href: "/secret-weapon",
    tools: [
      { name: "Buyer Brain Simulator", href: "/secret-weapon" },
      { name: "Idea Machine & Challenges", href: "/creator-growth/human-emotion-video-playbook" },
      { name: "Trigger Stack", href: "/human-buying-lab" },
      { name: "Challenge of the Day", href: "/secret-weapon" },
    ],
  },
];

/* ---------- SOLVE MY PROBLEM: the six challenges ---------- */
export interface Challenge {
  challenge: string;
  subline: string;
  department: string;
  href: string;
  first_steps: string[];
}

export const CHALLENGES: Challenge[] = [
  {
    challenge: "Nobody watches my videos",
    subline: "Improve hooks, openings and retention.",
    department: "THE ATTENTION LAB",
    href: "/creator-growth/first-3-seconds",
    first_steps: [
      "Run your last opening through the First 3 Seconds Chamber",
      "Diagnose where viewers leave with Why Is My Video Not Working?",
      "Rebuild the opening with a stronger first frame and a real reason to stay",
    ],
  },
  {
    challenge: "I get views but no sales",
    subline: "Improve product messaging and conversion.",
    department: "THE SALES INTELLIGENCE LAB",
    href: "/human-buying-lab",
    first_steps: [
      "Score your video in the Product-to-Purchase Evaluator",
      "Rebuild the script with the Ad Architect's six-stage framework",
      "Check the triggers: demonstration, honest proof, one objection answered, one clear next step",
    ],
  },
  {
    challenge: "I can't find brand opportunities",
    subline: "Discover and evaluate partnerships.",
    department: "THE BRAND OBSERVATORY",
    href: "/discover",
    first_steps: [
      "Search the Brand Intelligence Database for your niche",
      "Check the Opportunity Radar for brands accepting creators now",
      "Compare the commission terms before you apply — capped, uncapped, or unknown",
    ],
  },
  {
    challenge: "My content looks unprofessional",
    subline: "Improve filming, editing and presentation.",
    department: "THE CONTENT REPAIR CENTER",
    href: "/why-is-my-video-not-working",
    first_steps: [
      "Run the Content Diagnostic on your last video",
      "Break it down scene by scene with the Autopsy Worksheet",
      "Fix one thing at a time: framing, light, sound, pacing — then re-film",
    ],
  },
  {
    challenge: "I don't know how to grow",
    subline: "Build your audience and creator business.",
    department: "THE CREATOR BUSINESS CENTER",
    href: "/academy",
    first_steps: [
      "Take the Audience First Alignment Test — name exactly who the video is for",
      "Choose one Academy learning path and finish it before starting another",
      "Learn pricing, usage rights, and negotiation before your next brand pitch",
    ],
  },
  {
    challenge: "I don't know what to post",
    subline: "Find content angles and practical ideas.",
    department: "THE CREATOR SIMULATOR",
    href: "/secret-weapon",
    first_steps: [
      "Generate directions with the Idea Machine — subject, audience, emotion",
      "Take today's Challenge of the Day and film it",
      "Build a Trigger Stack for the video before you press record",
    ],
  },
];

/* ---------- The solution pathway: six steps, every lesson ---------- */
export interface PathwayStep {
  step: string;
  line: string;
}

export const PATHWAY: PathwayStep[] = [
  { step: "Identify", line: "Help the creator recognize the exact problem." },
  { step: "Diagnose", line: "Explain possible reasons it's happening." },
  { step: "Understand", line: "Teach the psychology, strategy, or skill behind it." },
  { step: "See It", line: "Show real examples of weak versus improved content." },
  { step: "Practice It", line: "Give them a script, exercise, challenge, or template." },
  { step: "Measure Improvement", line: "Help them evaluate what changed and what to try next." },
];

/* ---------- The five signature tools ---------- */
export interface SignatureTool {
  name: string;
  what: string;
  href: string;
  status: string;
}

export const SIGNATURE_TOOLS: SignatureTool[] = [
  {
    name: "Video Autopsy",
    what: "Break down a video scene by scene. Explain what attracts attention, what loses interest, and how to improve it.",
    href: "/secret-weapon",
    status: "Worksheet live",
  },
  {
    name: "Script Reconstruction Engine",
    what: "Turn weak product scripts into stronger, more relevant and persuasive scripts without inventing product claims.",
    href: "/creator-growth/human-behind-the-view",
    status: "Live — the Ad Architect",
  },
  {
    name: "Buyer Brain Simulator",
    what: "Explore what different buyers might question, value, or hesitate about before purchasing.",
    href: "/secret-weapon",
    status: "Live",
  },
  {
    name: "Content Diagnostic",
    what: "Choose your performance problem and learn which metrics and creative elements to investigate.",
    href: "/why-is-my-video-not-working",
    status: "Live",
  },
  {
    name: "Brand Intelligence Database",
    what: "Research brand partnerships with transparent commission terms, eligibility requirements, and verification dates.",
    href: "/discover",
    status: "Live",
  },
];

/* ---------- Success: measured in creator outcomes ---------- */
export interface SuccessMeasure {
  outcome: string;
  measure: string;
}

export const SUCCESS_MEASURES: SuccessMeasure[] = [
  { outcome: "Better videos", measure: "Skills practiced and video improvements" },
  { outcome: "Better retention", measure: "Changes in watch-time metrics" },
  { outcome: "Better sales content", measure: "Clicks and conversion learning" },
  { outcome: "More opportunities", measure: "Qualified brand applications" },
  { outcome: "Better business skills", measure: "Pricing and negotiation knowledge" },
  { outcome: "Greater confidence", measure: "Completed challenges and learning paths" },
];

export const HONESTY_LINE =
  "Never promise viral videos or guaranteed sales. Teach creators how to make informed improvements.";

/* ---------- The ultimate goal ---------- */
export const ULTIMATE_GOAL: string[] = [
  "My videos aren't working. Help me.",
  "I want to sell more. Teach me.",
  "I need brands to work with. Show me where to start.",
  "I want to become a better creator. Show me how.",
  "I don't understand why people aren't buying. Help me figure it out.",
];

export const THE_DIFFERENCE =
  "Other websites give creators tips. UltraVestra helps them solve the problems behind their results.";
