/* ULTRAVESTRA — THE HUMAN-FIRST VIDEO INTELLIGENCE SYSTEM — structured data.
 * Extracted faithfully from the owner's source text in
 * content/human-first-video-intelligence.md. Powers the Human-First
 * Video Creator (components/HumanFirstCreator.tsx) and the Human-First
 * framework sections on the playbook page. The principle behind every
 * video tool on the platform: the human comes before the hook.
 * Edit the source text first, then mirror changes here. */

export const FOUNDATION_QUESTIONS: string[] = [
  "Why would somebody watch this video?",
  "Who exactly is this video for?",
  "What does that person care about?",
  "What are they feeling, wanting, struggling with, or curious about?",
  "What should they learn, experience, understand, or feel after watching?",
  "Why would they stay until the end?",
  "What would make them talk about it?",
  "What would make them share it?",
  "What would make them trust the creator?",
  "What would give them a reason to return?",
];

export interface AudienceSegment {
  label: string;
  want: string;
}

/* The owner's skincare example: the same product can require completely
 * different stories for different audiences. These are possible audience
 * segments, not assumptions about every person in those groups. */
export const AUDIENCE_SEGMENTS: AudienceSegment[] = [
  { label: "Beginners", want: "Understand where to start" },
  { label: "Busy professionals", want: "Find something convenient" },
  { label: "Budget-conscious shoppers", want: "Understand value for money" },
  { label: "Skincare enthusiasts", want: "Discover ingredients and techniques" },
  { label: "Skeptical shoppers", want: "See honest evidence" },
  { label: "Gift shoppers", want: "Find an appropriate gift" },
];

export interface DiscoveryInvestigation {
  area: string;
  question: string;
}

/* The Audience Emotion Discovery Engine — the ten investigations that
 * identify the human motivation behind an audience. */
export const DISCOVERY_ENGINE: DiscoveryInvestigation[] = [
  { area: "Their problem", question: "What are they trying to solve?" },
  { area: "Their desire", question: "What would they like to experience?" },
  { area: "Their curiosity", question: "What do they want to know?" },
  { area: "Their frustration", question: "What makes the situation difficult?" },
  { area: "Their fear", question: "What are they worried about?" },
  { area: "Their joy", question: "What makes them happy?" },
  { area: "Their identity", question: "What makes this subject relevant to them?" },
  { area: "Their knowledge", question: "Are they beginners or experienced?" },
  { area: "Their trust barriers", question: "What evidence would they need?" },
  { area: "Their next step", question: "What would genuinely help them?" },
];

export interface OutcomeType {
  label: string;
  description: string;
}

/* The Viewer Outcome Architect — a video can have several outcomes,
 * but it should have one primary outcome. */
export const OUTCOME_TYPES: OutcomeType[] = [
  {
    label: "Understand something",
    description: "Teach a new skill, explain an idea, answer a question, or make something easier to understand.",
  },
  {
    label: "Feel something",
    description: "Create happiness, laughter, inspiration, comfort, excitement, empathy, or connection.",
  },
  {
    label: "Discover something",
    description: "Reveal something surprising, interesting, useful, or unexpected.",
  },
  {
    label: "Participate in something",
    description: "Give viewers a reason to comment, vote, share an experience, or contribute an idea.",
  },
  {
    label: "Make a better decision",
    description: "Help viewers evaluate a product, compare options, understand value, or decide whether something suits their needs.",
  },
  {
    label: "Feel connected",
    description: "Help people feel recognized, included, understood, or part of a community.",
  },
];

/* The Emotion-to-Outcome Connection — the heart of the system:
 * Audience → Human need → Emotion → Video experience → Viewer outcome
 * → Next action. The owner's worked example, verbatim. */
export const CHAIN_EXAMPLE = {
  intro: "A creator is promoting a kitchen appliance.",
  audience: "People who enjoy cooking but have limited time.",
  humanNeed: "They want cooking to feel easier and less stressful.",
  emotions: "Relief, curiosity, and satisfaction.",
  videoExperience: "A real cooking challenge showing preparation, cooking, cleanup, and the result.",
  viewerOutcome: "Understand whether the appliance could make their routine easier.",
  nextAction: "Ask a question, explore product details, or consider whether it suits their needs.",
};

/* Quality control — never generate a video before understanding its
 * purpose. Before a script is generated, check these eight questions. */
export const QC_CHECKLIST: [string, string][] = [
  ["Who is it for?", "A recognizable audience, not everybody"],
  ["Why would they watch?", "A specific reason relevant to them"],
  ["What do they need?", "A real question, desire, problem, or interest"],
  ["What should they feel?", "A deliberate emotional direction"],
  ["What should they receive?", "A clear viewer benefit"],
  ["Why would they stay?", "Meaningful progression and payoff"],
  ["Why might they participate?", "A natural reason to respond"],
  ["What happens next?", "A relevant next step"],
];

export interface VagueGuidance {
  id: "everyone" | "views" | "buy";
  said: string;
  guidance: string;
  suggestion: string;
}

/* When an answer is vague, UltraVestra does not refuse — it helps the
 * creator sharpen the answer before anything is generated. */
export const VAGUE_GUIDANCE: VagueGuidance[] = [
  {
    id: "everyone",
    said: "“Everyone”",
    guidance:
      "UltraVestra never treats an audience as simply “everybody.” A video made for everyone is made for no one — narrow it to a recognizable group of people, and the whole strategy gets stronger.",
    suggestion:
      "Try a specific group instead — for example, “Beginners who want a simple skincare routine.” The quick-picks under the audience field are a starting point.",
  },
  {
    id: "views",
    said: "“Get views”",
    guidance:
      "Views are a result, not a purpose. Before the strategy is built: what kind of viewers do you want to attract — and what should those viewers gain from watching?",
    suggestion:
      "Name the gain instead — for example, “Understand what products are right for them.” The right viewers follow the value, not the other way around.",
  },
  {
    id: "buy",
    said: "“Make them buy”",
    guidance:
      "A strategy built on pressure breaks trust. Reframe it: what information would help these people make an informed decision — the honest evidence, the real limitations, who it suits and who it doesn't?",
    suggestion:
      "Try “See honest evidence before deciding” — a viewer who decides well becomes a viewer who returns.",
  },
];
