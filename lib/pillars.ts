/* ULTRAVESTRA — THE ART OF HUMAN CONNECTION & CONVERSION — structured data.
 * The LIVE mastery layer: a philosophy for TikTok LIVE hosting, not a
 * list of selling tips. The 12 Pillars of Creator Mastery, the
 * 60-second attention & conversion cycle, the professional host
 * checklist, the transformation table and the Creator Code. Extracted
 * faithfully from the source document in
 * content/art-of-human-connection-conversion.md.
 * Its rule matches UltraVestra's honesty standard throughout: never
 * invent reassurance, never manufacture scarcity, make it easy to say
 * yes and equally safe to say no. */

/* ---------- The philosophy ---------- */
export const PHILOSOPHY = {
  headline: "Don't Just Go LIVE. Become the Reason People Stay.",
  mantra: "Capture attention. Create connection. Build trust. Inspire action.",
  paragraphs: [
    "A successful TikTok LIVE is more than a camera, a product, and a presenter. It is a living experience.",
    "People enter your room with different questions, different expectations, different emotions, and different reasons for watching. Some are curious. Some are comparing products. Some are ready to purchase. Others simply want to feel welcomed before they decide whether to stay.",
    "Your job is to understand the room, guide the experience, and give people a reason to remain.",
    "Because selling live is not about talking louder, repeating the price, or constantly asking people to buy. It is about knowing how to hold attention, create meaningful interaction, communicate value, and make purchasing decisions feel informed and comfortable.",
    "At UltraVestra, we believe the greatest creators don't simply present products. They create experiences people want to be part of.",
  ],
};

/* ---------- The 12 Pillars of Creator Mastery ---------- */
export interface Pillar {
  number: string;
  name: string;
  /* The line after the em dash in the pillar's title. */
  essence: string;
  /* The pillar's defining paragraph, condensed faithfully. */
  intro: string;
  /* The pillar's key points, from the source. */
  points: string[];
  /* The "UltraVestra principle:" line, verbatim. */
  principle: string;
  /* Plain-language prompt for the Pillar Self-Diagnostic. */
  diagnostic: string;
  /* One concrete practice focus, derived from the pillar's own points. */
  practice: string;
}

export const PILLARS: Pillar[] = [
  {
    number: "01",
    name: "Authenticity",
    essence: "Become Someone People Feel Comfortable Trusting",
    intro:
      "Authenticity isn't about revealing everything about yourself. It is about making sure your words, actions, and intentions belong to the same person. You don't need to pretend to be someone else — and you don't need to make a product sound extraordinary if its real value can speak for itself.",
    points: [
      "Speaks honestly about products.",
      "Shares genuine experiences.",
      "Explains what is known and what isn't.",
      "Makes room for questions and concerns.",
      "Respects a viewer's decision, even when they don't buy.",
    ],
    principle: "Your personality attracts attention. Your integrity gives people a reason to trust you.",
    diagnostic: "I say what I actually believe about the products I show — including what I don't know.",
    practice: "In your next LIVE, say one thing you don't know about the product out loud — and say how you will find out.",
  },
  {
    number: "02",
    name: "Confidence",
    essence: "Lead With Clarity, Not Noise",
    intro:
      "Confidence isn't about being the loudest person in the room. It comes from knowing what you're presenting, understanding its value, and having a clear direction for the conversation. Preparation creates freedom: when you understand your subject, you speak naturally instead of searching for your next sentence.",
    points: [
      "Which product you're introducing.",
      "Who the product may be suitable for.",
      "What information viewers need.",
      "What questions may arise.",
      "What demonstration you will show.",
      "What action you want viewers to take.",
    ],
    principle: "Confidence is knowledge expressed with calm certainty.",
    diagnostic: "Before I go LIVE, I know my product, who it suits, and the questions viewers will ask.",
    practice: "Before your next LIVE, write down all six preparation answers: the product, who it suits, what viewers need, the likely questions, your demonstration, and your next step.",
  },
  {
    number: "03",
    name: "Warmth",
    essence: "Make Every Viewer Feel Welcome",
    intro:
      "People aren't just entering a livestream. They're entering a conversation. A great host understands that a viewer is a person, not a number on a screen. Small moments of recognition can make a room feel more welcoming.",
    points: [
      "\u201cWelcome in! We're looking at this product right now.\u201d",
      "\u201cThat's a really good question. Let me explain.\u201d",
      "\u201cIf you're just joining, here's what we've discovered so far.\u201d",
      "\u201cI appreciate you being here.\u201d",
    ],
    principle: "Don't just manage an audience. Host an experience.",
    diagnostic: "I welcome people as they arrive and catch newcomers up, so nobody feels lost or invisible.",
    practice: "Use all four welcome lines in your next LIVE — greet arrivals, thank questioners, and recap for anyone who joins halfway through.",
  },
  {
    number: "04",
    name: "Momentum",
    essence: "Give the Room a Reason to Keep Watching",
    intro:
      "Attention is earned moment by moment. If the conversation becomes repetitive, viewers may lose interest; if everything happens at once, they may become confused. The answer is intentional pacing — a repeatable rhythm. Avoid long stretches of silence, but don't rush through important explanations.",
    points: [
      "Hook — Give people a reason to pay attention.",
      "Demonstrate — Show the product.",
      "Explain — Make its value understandable.",
      "Connect — Relate it to a real viewer need.",
      "Answer — Address questions and concerns.",
      "Invite — Give a clear next step.",
      "Reset — Welcome newcomers and introduce the topic again.",
    ],
    principle: "Keep the experience moving without making the viewer feel hurried.",
    diagnostic: "My LIVE keeps moving through a rhythm — hook, demo, explain, answer, invite, reset — without long dead stretches.",
    practice: "Run your next segment on the seven-beat rhythm: hook, demonstrate, explain, connect, answer, invite, reset.",
  },
  {
    number: "05",
    name: "Storytelling",
    essence: "Let People Imagine the Product in Their Lives",
    intro:
      "Features explain what a product has. Stories help people understand why those features might matter. Instead of simply listing specifications, show how the product fits into a real situation — then demonstrate it, explain its actual purpose, and show how it is used.",
    points: [
      "The situation: What is happening in someone's life?",
      "The need: What are they trying to accomplish?",
      "The discovery: What product or solution are we exploring?",
      "The demonstration: How does it work or fit into the situation?",
      "The decision: What should the viewer consider before choosing?",
    ],
    principle: "Don't just describe the product. Help the viewer understand its place in their world.",
    diagnostic: "I show how the product fits into a real life, instead of only listing what it does.",
    practice: "For your next product, prepare one story in five parts: situation, need, discovery, demonstration, decision.",
  },
  {
    number: "06",
    name: "Energy",
    essence: "Bring Life to the Experience",
    intro:
      "Energy doesn't mean shouting, moving constantly, or pretending to be excited. It means bringing presence and intention to what you're doing. A good host knows when to become enthusiastic, when to slow down, when to demonstrate something carefully, and when to let a meaningful moment breathe.",
    points: [
      "Become enthusiastic when the moment calls for it.",
      "Slow down and demonstrate carefully when detail matters.",
      "Let a meaningful moment breathe.",
      "Use voice, facial expressions, and body language to support the message.",
      "If the room goes quiet, introduce another useful detail, demonstrate something, or ask a thoughtful question.",
    ],
    principle: "Your energy should elevate the experience, not exhaust the audience.",
    diagnostic: "I bring presence and intention — enthusiastic when it helps, calm when the moment needs it.",
    practice: "Pick one moment in your next LIVE to slow down on purpose — demonstrate carefully and let it breathe instead of filling it with talk.",
  },
  {
    number: "07",
    name: "Resilience",
    essence: "Learn to Lead Even When the Room Is Quiet",
    intro:
      "Not every LIVE will be busy. Sometimes viewers come and go. Sometimes questions slow down. Sometimes technology decides to become your biggest challenge. None of these moments defines your ability as a creator — the strongest hosts learn to adjust without losing their composure.",
    points: [
      "Reintroduce the product.",
      "Share another useful detail.",
      "Try a different demonstration.",
      "Answer a question from earlier.",
      "Invite viewers to suggest what they'd like to see.",
      "Review what worked afterward.",
    ],
    principle: "A quiet moment is not the end of the experience. It is an opportunity to lead it differently.",
    diagnostic: "When the room goes quiet, I keep leading instead of panicking or reaching for pressure.",
    practice: "Prepare three quiet-room moves in advance: reintroduce the product, share a new useful detail, and invite viewers to choose what they see next.",
  },
  {
    number: "08",
    name: "Intelligent Improvisation",
    essence: "Adapt Without Losing Direction",
    intro:
      "A LIVE is unpredictable. You can prepare the experience, but you cannot script every human interaction. Someone may ask a question you didn't expect; a demonstration may reveal something worth exploring. The secret is having a clear structure — and the freedom to adapt within it.",
    points: [
      "If people are confused, explain more simply.",
      "If people want to see the product, demonstrate it.",
      "If several people ask the same question, address it for everyone.",
      "If viewers compare two options, explain their verified differences.",
      "If interest increases, make the purchasing instructions clear.",
    ],
    principle: "Prepare your direction. Stay flexible with the journey.",
    diagnostic: "When the LIVE goes off-script, I adapt without losing the point of the session.",
    practice: "Keep your segment structure in front of you while you host — when a surprise question lands, answer it fully, then return to the next beat.",
  },
  {
    number: "09",
    name: "Emotional Connection",
    essence: "Understand What Matters to the Viewer",
    intro:
      "People don't always express their real concerns directly. Someone asking about a moisturizer may actually be trying to avoid wasting money; someone asking about delivery may need reassurance before purchasing. Learn to hear the human question behind the product question — treat every comment as an opportunity to understand, not just to sell.",
    points: [
      "\u201cAre you looking for something simple for everyday use?\u201d",
      "\u201cWhat matters most to you when choosing a product?\u201d",
      "\u201cWould you like me to explain the difference?\u201d",
      "\u201cLet's look at the ingredients and directions together.\u201d",
    ],
    principle: "Engagement gets people talking. Understanding gives the conversation meaning.",
    diagnostic: "I listen for the real concern behind a viewer's question before I answer it.",
    practice: "In your next LIVE, answer three product questions with a question first — start with \u201cWhat matters most to you when choosing?\u201d",
  },
  {
    number: "10",
    name: "Trust & Barrier Intelligence",
    essence: "Make Decisions Easier",
    intro:
      "Sometimes a person is interested but still uncertain. They may need to understand the price, product details, delivery expectations, return policy, ingredients, sizing, compatibility, or how to place an order. A great creator doesn't ignore those questions — they make the information easier to find. Never invent reassurance: if you don't know, say so and find the correct information.",
    points: [
      "What the product is designed to do.",
      "What its ingredients are.",
      "How to use it.",
      "What skin types the manufacturer identifies.",
      "What precautions are listed.",
      "Where viewers can find full product details.",
    ],
    principle: "Remove confusion, not the viewer's freedom to choose.",
    diagnostic: "I find the questions standing between interest and a decision — price, details, delivery, returns — and answer them with verified information.",
    practice: "List the barriers for your product — price, details, delivery, returns, ingredients, sizing, ordering — and prepare a verified answer for each before you go LIVE.",
  },
  {
    number: "11",
    name: "Audience Intelligence",
    essence: "Read the Room, Not Just the Numbers",
    intro:
      "A LIVE host must learn to observe. The audience is constantly providing information through its questions, comments, reactions, and behavior. These signals are clues, not proof of what someone is thinking.",
    points: [
      "Explain more clearly when the same questions repeat.",
      "State the accurate price when viewers ask \u201cHow much?\u201d",
      "Show the steps when viewers ask how to use it.",
      "Explain verified differences when viewers compare options.",
      "Clarify delivery details when purchase uncertainty appears.",
      "Participate and acknowledge viewers as the conversation develops.",
      "Review pacing and clarity when viewers leave during explanations.",
    ],
    principle: "A great host doesn't just speak to the room. A great host learns from the room.",
    diagnostic: "I read the room's signals — repeated questions, comparisons, drop-offs — and adjust what I do.",
    practice: "After your next LIVE, match what you saw against the signal table below: which signals appeared, and what will you change because of them?",
  },
  {
    number: "12",
    name: "Natural Conversion",
    essence: "Sell Without Losing Yourself",
    intro:
      "There is nothing wrong with asking someone to purchase a product you genuinely believe is relevant — the difference is how you approach the decision. A pushy host focuses only on getting an order. A thoughtful host helps the viewer understand the product, its value, and whether it fits their needs.",
    points: [
      "Be clear about what you are offering.",
      "Explain how to access it.",
      "State real incentives accurately.",
      "Give viewers enough information to decide.",
      "Explain genuine promotions with their actual terms and timing.",
      "Never manufacture scarcity or pressure people with false urgency.",
    ],
    principle: "Make it easy to say yes. Make it equally safe to say no.",
    diagnostic: "My calls to action are honest and pressure-free — easy to say yes to, and safe to say no to.",
    practice: "Rewrite your call to action in the natural pattern: name who it fits, point to the full details, and leave the decision with the viewer.",
  },
];

/* ---------- Pillar 11's signal table ---------- */
export interface AudienceSignal {
  signal: string;
  indicates: string;
  action: string;
}

export const AUDIENCE_SIGNALS: AudienceSignal[] = [
  { signal: "Repeated product questions", indicates: "Information is missing", action: "Explain more clearly" },
  { signal: "\u201cHow much?\u201d", indicates: "Price interest", action: "State the accurate price" },
  { signal: "\u201cHow do I use it?\u201d", indicates: "Need for demonstration", action: "Show the steps" },
  { signal: "Comparison questions", indicates: "Product evaluation", action: "Explain verified differences" },
  { signal: "Questions about delivery", indicates: "Purchase uncertainty", action: "Clarify available delivery details" },
  { signal: "More comments", indicates: "Conversation is developing", action: "Participate and acknowledge viewers" },
  { signal: "Viewers leaving during explanations", indicates: "The section may be losing relevance", action: "Review pacing and clarity" },
];

/* ---------- The 60-second attention & conversion cycle ---------- */
export interface LiveCycleSegment {
  time: string;
  action: string;
}

export const LIVE_CYCLE: LiveCycleSegment[] = [
  { time: "0–8 sec", action: "Open with a strong, relevant reason to watch" },
  { time: "8–18 sec", action: "Introduce the product and viewer need" },
  { time: "18–32 sec", action: "Demonstrate and explain" },
  { time: "32–42 sec", action: "Answer a common question" },
  { time: "42–52 sec", action: "Explain product details and relevant evidence" },
  { time: "52–60 sec", action: "Give the next step and welcome new viewers" },
];

export const LIVE_CYCLE_NOTE =
  "This is a flexible practice framework, not a mandatory TikTok format. Repeat the cycle with new information, demonstrations, and questions rather than repeating the same sales pitch.";

/* ---------- The professional host checklist ---------- */
export const HOST_CHECKLIST: { before: string[]; during: string[]; after: string[] } = {
  before: [
    "Know the product and its verified details.",
    "Prepare your demonstration.",
    "Check lighting, camera framing, and audio.",
    "Have your key talking points ready.",
    "Know the product link and ordering process.",
    "Prepare answers to common questions.",
    "Know the real promotional terms, if any.",
  ],
  during: [
    "Welcome new viewers.",
    "Speak clearly and naturally.",
    "Maintain an engaging pace.",
    "Demonstrate rather than simply describe.",
    "Read and answer comments.",
    "Give clear calls to action.",
    "Respect questions and purchasing decisions.",
  ],
  after: [
    "Review viewer retention.",
    "Review questions and comments.",
    "Identify confusing explanations.",
    "Examine clicks and attributed purchases, if available.",
    "Record what to improve in the next session.",
  ],
};

/* ---------- The transformation ---------- */
export interface TransformationPair {
  uncertain: string;
  developing: string;
}

export const TRANSFORMATION: TransformationPair[] = [
  { uncertain: "Hopes someone will watch", developing: "Understands how to earn attention" },
  { uncertain: "Repeats product features", developing: "Explains why features matter" },
  { uncertain: "Talks continuously", developing: "Creates a conversation" },
  { uncertain: "Panics when the room is quiet", developing: "Knows how to reset the experience" },
  { uncertain: "Pushes for a sale", developing: "Guides an informed decision" },
  { uncertain: "Guesses what viewers want", developing: "Studies audience signals" },
  { uncertain: "Copies another host", developing: "Develops an authentic presentation style" },
  { uncertain: "Measures only sales", developing: "Learns from the entire audience journey" },
];

/* ---------- The Creator Code ---------- */
export const CREATOR_CODE = {
  motto: "Be Human. Lead With Intelligence. Sell With Integrity.",
  statements: [
    "We do not teach creators to become louder versions of everyone else.",
    "We teach them to become more observant, more confident, more creative, more knowledgeable, and more intentional.",
    "We believe attention should be earned.",
    "Trust should be respected.",
    "Emotion should create connection, not manipulation.",
    "Products should be presented honestly.",
    "And conversion should be the natural result of helping the right person make the right decision.",
    "You are not here merely to fill a livestream. You are here to create an experience worth staying for.",
  ],
  closing: "ULTRAVESTRA — THE INTELLIGENCE BEHIND YOUR CREATOR BUSINESS.",
};
