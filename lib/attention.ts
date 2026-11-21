/* ULTRAVESTRA — THE ART OF CAPTIVATING HUMAN ATTENTION — structured data.
 * The Human Attention Intelligence layer: the 15 attention triggers,
 * the Friendly Controversy Laboratory, the first-three-seconds capture
 * sequence, the emotional journey, the conversation starters, the
 * product video transformation, the 7-day challenge, the rule that
 * separates attention from manipulation, and the Creator Code.
 * Extracted faithfully from the source document in
 * content/art-of-captivating-attention.md.
 * Its rule matches UltraVestra's honesty standard throughout:
 * captivating content never depends on fake claims, manufactured
 * outrage, or insulting viewers. Don't manufacture attention. Earn it.
 * The Reactor templates use three placeholders — {topic}, {product},
 * {audience} — filled with the creator's own words. Nothing is invented. */

/* ---------- The philosophy ---------- */
export const PHILOSOPHY = {
  headline: "Don't just stop the scroll. Capture the imagination.",
  mantra: "Trigger curiosity. Create a feeling. Start a conversation. Make the experience memorable.",
  paragraphs: [
    "The most captivating creators understand something important: people don't watch videos simply because a product exists. They watch because something makes them curious, entertained, surprised, understood, excited, hungry, inspired, or eager to discover what happens next.",
    "Attention is not taken. It is earned — by giving the right person a genuine reason to stop, watch, and participate.",
    "This masterclass teaches creators how to create those experiences: honestly, and without ever crossing into manipulation.",
  ],
};

/* ---------- The 15 attention triggers ---------- */
export interface Trigger {
  name: string;
  /* What the trigger does, from the source. */
  does: string;
  /* The source's example, verbatim. */
  example: string;
  /* Opening-hook template for the Reactor. {topic} {product} {audience}. */
  hook: string;
  /* Why this could connect — Reactor explanation template. */
  why: string;
}

export const TRIGGERS: Trigger[] = [
  {
    name: "The curiosity gap",
    does: "Give viewers an interesting question they want answered.",
    example: "I didn't expect this little detail to make such a difference.",
    hook: "I didn't expect this one detail about {product} to make such a difference — watch.",
    why: "It opens a question {audience} already half-has about {topic} and only answers it inside the video, so staying feels like the natural next step.",
  },
  {
    name: "The unexpected twist",
    does: "Show something viewers weren't expecting.",
    example: "I thought this was going to be useless. I was wrong about one thing.",
    hook: "I thought {product} was going to be useless. I was wrong about one thing.",
    why: "A reversed expectation breaks the pattern {audience} expects from {topic} videos — surprise earns the next few seconds without a single exaggerated claim.",
  },
  {
    name: "The transformation",
    does: "Let people see a meaningful change.",
    example: "Watch what happens when I try this.",
    hook: "Watch what actually changes when I use {product}.",
    why: "Change is proof you can see. For {audience}, watching a real before-and-after unfold is more convincing than any description of {product}.",
  },
  {
    name: "Sensory attraction",
    does: "Use visuals and sounds that make people almost feel the experience.",
    example: "A close-up of a crispy bite, a satisfying click, or a smooth texture.",
    hook: "Open on the closest close-up of {product} — the texture, the sound, the exact moment it works. No talking for the first second.",
    why: "Senses arrive before arguments. A satisfying close-up lets {audience} almost feel {product} before they have decided anything about it.",
  },
  {
    name: "The comparison",
    does: "Give viewers something to judge.",
    example: "Would you choose the expensive one or the affordable one?",
    hook: "Would you choose the expensive one or the affordable one? Let's judge {product} honestly.",
    why: "People love to judge. Giving {audience} two real options to weigh turns passive watching into an active decision about {topic}.",
  },
  {
    name: "The unpopular opinion",
    does: "Challenge an ordinary assumption respectfully.",
    example: "I think we're reviewing this product the wrong way.",
    hook: "Unpopular opinion: we're judging {topic} the wrong way.",
    why: "A respectful challenge makes {audience} stop and think — and gives them a position to agree or disagree with, which is where real conversation starts.",
  },
  {
    name: "Relatable humor",
    does: "Make people recognize themselves in a situation.",
    example: "When you said you were only buying one thing...",
    hook: "When you told yourself you were done with {topic} for the month… and then {product} showed up.",
    why: "Recognition is instant connection. When {audience} sees their own behavior in the joke, they feel understood before they feel sold to.",
  },
  {
    name: "The mystery",
    does: "Turn the video into a discovery.",
    example: "There is one feature nobody told me to look for.",
    hook: "There is one thing about {product} nobody told me to look for.",
    why: "An unsolved discovery pulls {audience} forward through the video — they stay to find the thing, not because they were told to stay.",
  },
  {
    name: "Emotional connection",
    does: "Share an honest human experience.",
    example: "I wish somebody had shown me this when I first started.",
    hook: "I wish somebody had shown me {product} when I first started with {topic}.",
    why: "An honest personal moment tells {audience} this creator has stood where they stand — trust begins before the product is even explained.",
  },
  {
    name: "The useful secret",
    does: "Teach something viewers can immediately use.",
    example: "Before you buy this, check these three things.",
    hook: "Before you buy {product}, check these three things.",
    why: "Immediate usefulness is the fastest honest value there is. {audience} stays because the video will make their next {topic} decision better, whether they buy or not.",
  },
  {
    name: "The challenge",
    does: "Give viewers a reason to guess, test, or participate.",
    example: "Can I find the best option under $20?",
    hook: "Let's put {product} through a real test — guess the result before I start.",
    why: "A test with an unknown result gives {audience} a stake in the outcome. Guessing along is participation, and participation is attention.",
  },
  {
    name: "The reveal",
    does: "Build anticipation around a real result.",
    example: "Here's what was actually inside.",
    hook: "Here's what was actually inside {product}.",
    why: "Anticipation built around a real result — never a fake one — makes the payoff worth waiting for, and {audience} can feel the difference.",
  },
  {
    name: "The debate",
    does: "Give viewers two interesting perspectives.",
    example: "Is this genuinely worth the money, or is the alternative better?",
    hook: "Is {product} genuinely worth it — or is the alternative better? Let's argue it properly.",
    why: "Two honest perspectives invite {audience} to take a side. A real debate about {topic} generates the comments no 'comment below!' request ever will.",
  },
  {
    name: "Aspiration",
    does: "Show a possibility viewers would love to experience.",
    example: "Imagine making your morning routine this simple.",
    hook: "Imagine {topic} feeling this simple. That's the promise of {product} — let's see if it keeps it.",
    why: "A believable better version of their own routine is something {audience} wants to step into — aspiration works when it stays honest about what {product} can actually do.",
  },
  {
    name: "The participation trigger",
    does: "Make viewers feel like part of the experience.",
    example: "I need your honest opinion. Which one wins?",
    hook: "I need your honest opinion on {product}. Which way does this go?",
    why: "Asking {audience} to judge — and meaning it — turns viewers into participants. People return to creators who genuinely hand them a role.",
  },
];

/* Which triggers serve which desired viewer outcome (Reactor matching). */
export type ViewerOutcome = "learn" | "trust" | "comment" | "buy" | "follow";

export const OUTCOMES: { key: ViewerOutcome; label: string; line: string }[] = [
  { key: "learn", label: "Learn", line: "They leave knowing something useful." },
  { key: "trust", label: "Trust", line: "They believe you — and come back for your word." },
  { key: "comment", label: "Comment", line: "They join a real conversation." },
  { key: "buy", label: "Buy", line: "They make an informed decision, freely." },
  { key: "follow", label: "Follow", line: "They choose to see you again." },
];

export const OUTCOME_TRIGGERS: Record<ViewerOutcome, string[]> = {
  learn: ["The useful secret", "The curiosity gap", "The mystery", "The comparison"],
  trust: ["Emotional connection", "The transformation", "The reveal", "The useful secret"],
  comment: ["The debate", "The participation trigger", "The unpopular opinion", "The comparison"],
  buy: ["The comparison", "The transformation", "Sensory attraction", "The useful secret"],
  follow: ["Relatable humor", "Emotional connection", "Aspiration", "The mystery"],
};

/* ---------- The Friendly Controversy Laboratory ---------- */
export const CONTROVERSY_FORMULA: { step: string; meaning: string }[] = [
  { step: "Common belief", meaning: "Name what most people assume — fairly, without mocking anyone who believes it." },
  { step: "Unexpected opinion", meaning: "Offer your real, different view. Respectful, specific, and honestly held." },
  { step: "Reason", meaning: "Give the thinking behind it — something viewers can examine, not just react to." },
  { step: "Open discussion", meaning: "Hand the question to the room. Both sides stay welcome." },
];

export const CONTROVERSY_NOTE =
  "This is how creators can use the energy of rage bait without becoming offensive or dishonest. The goal is to create a difference of opinion that people can discuss without attacking one another.";

export const CONTROVERSY_PAIRS: { instead: string; say: string }[] = [
  { instead: "You're all buying the wrong products!", say: "Are we choosing products based on the brand instead of the value?" },
  { instead: "This product is terrible!", say: "I think there's one thing people should consider before buying this." },
  { instead: "Nobody knows how to make videos!", say: "Unpopular opinion: better editing won't fix an uninteresting video." },
  { instead: "You're wasting your money!", say: "Would you pay more for convenience, or would you choose the cheaper alternative?" },
  { instead: "Everyone is doing this wrong!", say: "What if the approach we've been using needs a rethink?" },
];

/* ---------- The first-three-seconds capture sequence ---------- */
export const CAPTURE_INTRO =
  "The first three seconds are an opportunity to earn attention. They do not guarantee that someone will stay.";

export const CAPTURE_SEQUENCE: { time: string; move: string; detail: string; example?: string }[] = [
  {
    time: "00–01",
    move: "Interrupt the scroll",
    detail: "Give the viewer something immediately interesting to see or hear. Visual: unexpected movement, a close-up, a striking result, or a human reaction.",
  },
  {
    time: "01–02",
    move: "Make it personal",
    detail: "Show why the subject matters to a particular audience.",
    example: "If you create product videos, watch this.",
  },
  {
    time: "02–03",
    move: "Open a curiosity loop",
    detail: "Give the viewer a clear reason to continue.",
    example: "Because this one change can make your demonstration much clearer.",
  },
];

/* ---------- The emotional journey of a captivating video ---------- */
export const JOURNEY_INTRO =
  "A great video doesn't have to use every emotion. It should deliberately guide the viewer through an experience.";

export interface JourneyStage {
  stage: string;
  viewer: string;
  job: string;
  /* Reactor: the creator's move at this stage, from the creator's inputs. */
  reactorMove: string;
}

export const JOURNEY: JourneyStage[] = [
  {
    stage: "Attention",
    viewer: "What's happening?",
    job: "Create an interesting opening",
    reactorMove: "Open with the lead hook — the strongest trigger line, in the first second.",
  },
  {
    stage: "Recognition",
    viewer: "This is relevant to me.",
    job: "Connect to a real need",
    reactorMove: "Name {audience} and their situation directly, so the right viewer knows this is for them.",
  },
  {
    stage: "Curiosity",
    viewer: "I want to know more.",
    job: "Develop the idea",
    reactorMove: "Deepen the open loop about {product} — one more layer of the question, not the answer yet.",
  },
  {
    stage: "Engagement",
    viewer: "I'm interested.",
    job: "Demonstrate, entertain, or teach",
    reactorMove: "Show {product} working in the {topic} situation — demonstrate, entertain, or teach with it.",
  },
  {
    stage: "Satisfaction",
    viewer: "That was worth watching.",
    job: "Deliver the promised payoff",
    reactorMove: "Deliver exactly what the opening promised about {product}. No delay, no detour.",
  },
  {
    stage: "Participation",
    viewer: "I have something to say.",
    job: "Invite a natural response",
    reactorMove: "Ask the comment prompt — a question {audience} genuinely has an answer to.",
  },
  {
    stage: "Trust",
    viewer: "I believe this creator.",
    job: "Be honest and consistent",
    reactorMove: "Close honestly: who {product} suits, who it might not, and what you don't know yet.",
  },
];

/* ---------- Make viewers want to comment ---------- */
export const STARTERS_INTRO =
  "Don't just ask people to comment. Give them something interesting to respond to. The best questions are easy to understand and genuinely worth answering.";

export interface ConversationStarter {
  /* The source starter, verbatim. */
  text: string;
  /* Reactor: the same starter personalized to the creator's inputs. */
  template: string;
}

export const CONVERSATION_STARTERS: ConversationStarter[] = [
  { text: "What's your experience with this?", template: "What's your experience with {topic}? Real answers only." },
  { text: "Which option would you choose, and why?", template: "Which would you choose — {product}, or the alternative — and why?" },
  { text: "What is one thing you would change?", template: "What is one thing you would change about {product}?" },
  { text: "Am I looking at this the wrong way?", template: "Am I looking at {topic} the wrong way? Tell me honestly." },
  { text: "What's something beginners should know?", template: "What's something beginners in {topic} should know before they start?" },
  { text: "What's your unpopular opinion about this?", template: "What's your unpopular opinion about {topic}? Keep it friendly." },
  { text: "What should I test next?", template: "What should I test next with {product}?" },
];

/* ---------- The product video transformation ---------- */
export const TRANSFORMATION = {
  stopThinking: "I'm making a video about a product.",
  startThinking:
    "I'm creating an experience that helps a particular person understand whether this product is useful to them.",
  exampleProduct: "a water bottle",
  closing: "The product becomes part of a story, not the entire story.",
  angles: [
    { angle: "Curiosity", line: "How long does this bottle actually keep water cold?" },
    { angle: "Challenge", line: "Test it under clearly explained conditions." },
    { angle: "Sensory", line: "Show the opening, pouring, and drinking experience." },
    { angle: "Comparison", line: "Compare size, features, and price." },
    { angle: "Debate", line: "Is a premium water bottle worth the extra money?" },
    { angle: "Story", line: "Show how it fits into a real daily routine." },
    { angle: "Verdict", line: "Explain who might benefit and who might not." },
  ],
};

/* ---------- The 7-day captivating-content challenge ---------- */
export const CHALLENGE: { day: string; task: string }[] = [
  { day: "Day 1", task: "Create a curiosity-driven opening." },
  { day: "Day 2", task: "Create a respectful unpopular opinion." },
  { day: "Day 3", task: "Make a funny, relatable video." },
  { day: "Day 4", task: "Create a satisfying product demonstration." },
  { day: "Day 5", task: "Build a mystery and reveal the answer." },
  { day: "Day 6", task: "Create a video that invites a real debate." },
  { day: "Day 7", task: "Combine emotion, value, storytelling, and a strong payoff." },
];

/* ---------- The rule that separates attention from manipulation ---------- */
export const NEVER_LIST: string[] = [
  "Fake claims or fabricated experiences.",
  "Misleading product demonstrations.",
  "Manufactured outrage.",
  "Insulting viewers to provoke comments.",
  "False scarcity or promises.",
  "Delaying a simple answer just to inflate watch time.",
];

export const NEVER_INTRO = "Captivating content should never depend on:";
export const NEVER_CLOSE = "Instead, give people something genuinely worth their attention.";

/* ---------- The Creator Code ---------- */
export const CREATOR_CODE: string[] = [
  "BE INTERESTING.",
  "BE UNEXPECTED.",
  "MAKE THEM FEEL.",
  "GIVE THEM VALUE.",
  "START A CONVERSATION.",
];

export const CREATOR_CODE_CLOSE = "Don't manufacture attention. Earn it.";
