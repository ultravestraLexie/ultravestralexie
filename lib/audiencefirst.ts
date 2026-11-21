/* ULTRAVESTRA — THE AUDIENCE FIRST PROTOCOL — structured data.
 * Extracted faithfully from the owner's defining message in
 * content/audience-first-protocol.md. Powers the Audience First
 * tools (components/AudienceFirst.tsx) and the Audience First
 * Protocol page. The message behind every video tool on the
 * platform: your video is not about you. It's about them.
 * Edit the source text first, then mirror changes here. */

/* The message UltraVestra teaches creators — where sales
 * psychology begins. */
export const CORE_MESSAGE =
  "Your video is not about what YOU want to sell. It's about what YOUR audience wants, needs, feels, or is trying to solve.";

export const CORE_MESSAGE_NOTE =
  "That's where sales psychology begins. A creator who understands the audience has an advantage over someone who simply keeps posting products.";

/* The headline, and the one question to ask before recording. */
export const HEADLINE = "YOUR VIDEO IS NOT ABOUT YOU. IT'S ABOUT THEM.";

export const HEADLINE_SUB = "Stop creating for yourself. Start creating for the person watching.";

export const ONE_QUESTION = "Why would someone care about what I'm about to show them?";

export const ONE_QUESTION_CONTEXT =
  "People don't open TikTok, YouTube, or Instagram hoping to watch another advertisement. They're looking for entertainment, solutions, inspiration, information, discoveries, or something that speaks to their interests. Your job as a creator is to connect what you're presenting with what your audience actually cares about.";

export interface PsychologyStep {
  number: number;
  name: string;
  explanation: string;
  examples: string[];
}

/* THE PSYCHOLOGY OF GETTING PEOPLE TO CARE — the owner's five
 * steps, with his explanations and his step-3 examples verbatim. */
export const PSYCHOLOGY_STEPS: PsychologyStep[] = [
  {
    number: 1,
    name: "Understand their world",
    explanation:
      "What frustrates them? What do they wish were easier? What are they curious about? What problem are they trying to solve?",
    examples: [],
  },
  {
    number: 2,
    name: "Make the video relevant",
    explanation: "Don't just introduce a product. Show why it matters to the person watching.",
    examples: [],
  },
  {
    number: 3,
    name: "Sell the outcome, not just the object",
    explanation: "People want to understand what a product can do for them.",
    examples: [
      "Don't simply show a cleaning product. Show how it can make cleaning easier.",
      "Don't simply show skincare. Explain who it may benefit and what it is designed to do.",
      "Don't simply show a gadget. Demonstrate the problem it helps solve.",
    ],
  },
  {
    number: 4,
    name: "Create an emotional connection",
    explanation:
      "Use relatable situations, storytelling, curiosity, humor, surprise, and honest demonstrations. Make viewers feel that you understand what they're looking for.",
    examples: [],
  },
  {
    number: 5,
    name: "Give them a reason to act",
    explanation:
      "Explain the value. Answer their questions. Address their doubts. Let them make an informed decision.",
    examples: [],
  },
];

export interface JourneyStage {
  stage: string;
  viewerSays: string;
  description: string;
}

/* The four-stage psychological journey — how audience psychology
 * works, in the order a viewer lives it. */
export const JOURNEY: JourneyStage[] = [
  {
    stage: "ATTENTION",
    viewerSays: "Make me stop.",
    description:
      "The opening must connect to something the audience recognizes, wants, fears missing out on, or finds interesting.",
  },
  {
    stage: "RELEVANCE",
    viewerSays: "This is for me.",
    description: "Make the viewer recognize their own situation in the video.",
  },
  {
    stage: "DESIRE",
    viewerSays: "I can see the value.",
    description: "Demonstrate how the product or information could improve their situation.",
  },
  {
    stage: "ACTION",
    viewerSays: "I know what to do next.",
    description: "Give them a clear, honest reason to click, learn more, or purchase.",
  },
];

export interface CenterExample {
  niche: string;
  creator_centered: string;
  audience_centered: string;
  why: string;
}

/* Same product, completely different psychology. Pair #1 is the
 * owner's serum example, verbatim. The rest follow his pattern:
 * the audience-centered line gives the viewer a reason to care
 * before asking them to care about the product. */
export const CENTER_EXAMPLES: CenterExample[] = [
  {
    niche: "Skincare serum",
    creator_centered: "Look what I bought! This serum is amazing.",
    audience_centered:
      "Want to simplify your skincare routine? Here's what this serum is designed to do and how I use it.",
    why: "The second example gives the viewer a reason to care before asking them to care about the product. It names their situation — a routine that feels too complicated — and promises an answer, instead of asking them to admire a purchase.",
  },
  {
    niche: "Cleaning spray",
    creator_centered: "Check out this new cleaning spray I got. It smells so good.",
    audience_centered:
      "If scrubbing your shower feels like a workout, watch what this spray does to soap scum with almost no scrubbing.",
    why: "The creator-centered line talks about the product. The audience-centered line talks about the viewer's frustration — and sells the outcome, an easier clean, not the bottle.",
  },
  {
    niche: "Kitchen gadget",
    creator_centered: "Unboxing my new gadget! I've wanted one of these forever.",
    audience_centered:
      "Chopping onions without crying or uneven pieces — this little gadget is designed to solve exactly that. Let me show you.",
    why: "The audience-centered version demonstrates the problem it helps solve. The viewer recognizes their own kitchen struggle in the first seconds and stays to see it solved.",
  },
  {
    niche: "Home fitness",
    creator_centered: "My new resistance bands arrived! Gym haul time.",
    audience_centered:
      "No gym, no commute, twenty minutes at home — here's the band workout I use on the days I almost skip training.",
    why: "The viewer isn't asked to care about a delivery. They're shown a situation they already live — wanting to train without the gym — and a way through it.",
  },
  {
    niche: "Snack food",
    creator_centered: "Trying this new snack I ordered. I love snacks, guys.",
    audience_centered:
      "If your 3 p.m. snack is usually whatever's in the vending machine, here's a protein option that actually tastes like dessert.",
    why: "The audience-centered line starts inside the viewer's day — the afternoon slump they already know — and positions the product as the answer to it, not as the creator's order.",
  },
  {
    niche: "Beauty tool",
    creator_centered: "Look at this hair tool I just got! It's so pretty.",
    audience_centered:
      "Frizzy hair on humid mornings? Here's what this brush is designed to do, and how it works on my hair type.",
    why: "The audience-centered version explains who it may benefit and what it is designed to do. Viewers can see themselves in it — and decide for themselves.",
  },
];

export interface AlignmentQuestion {
  question: string;
  guidance: string;
}

/* THE AUDIENCE ALIGNMENT TEST — the UltraVestra challenge. Before
 * publishing, make sure your video has a purpose for the person
 * watching. Questions and guidance are the owner's, verbatim. */
export const ALIGNMENT_TEST: AlignmentQuestion[] = [
  { question: "Who am I creating this video for?", guidance: "Define the audience." },
  { question: "What does this audience care about?", guidance: "Identify an interest, need, or problem." },
  { question: "Why would they stop scrolling?", guidance: "Find the most relevant opening." },
  { question: "What value will they receive?", guidance: "Show the benefit or useful information." },
  { question: "Why should they trust me?", guidance: "Use evidence, honesty, and demonstration." },
];

/* THE ULTRAVESTRA RULE — the audience is the reason the video
 * exists. */
export const THE_RULE = {
  intro: [
    "Your audience is the reason your video exists.",
    "If your content doesn't connect with their interests, needs, questions, or desires, you may be creating a video that only makes sense to you.",
  ],
  bold: "Create with them in mind. Speak their language. Show them the value.",
  closing: [
    "Don't interrupt their scrolling with another advertisement.",
    "Give them a reason to stop, watch, understand, and care.",
  ],
};

/* THE ULTRAVESTRA PHILOSOPHY — the message that defines
 * UltraVestra. */
export const PHILOSOPHY = {
  headline: "CREATE FOR THE HUMAN. NOT THE ALGORITHM.",
  lines: ["Understand their needs. Earn their attention. Deliver real value."],
  closing:
    "Because the best content isn't simply content people see. It's content that makes people feel understood.",
};
