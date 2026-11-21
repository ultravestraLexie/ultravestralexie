/* THE ULTRAVESTRA HUMAN EMOTION VIDEO PLAYBOOK — structured data.
 * Extracted faithfully from the source guide in
 * content/human-emotion-video-playbook.md. Powers the Human Emotion
 * Video Lab (components/EmotionLab.tsx) and the playbook page at
 * /creator-growth/human-emotion-video-playbook. Edit the guide first,
 * then mirror changes here — the words are the owner's, not invented. */

export interface Emotion {
  name: string;
  tagline: string;
  why: string;
  videoIdeas: string[];
  technique: string;
  commentInvitation: string;
}

export const EMOTIONS: Emotion[] = [
  {
    name: "Curiosity",
    tagline: "Make people need to know what happens next",
    why: "Curiosity makes people want an answer.",
    videoIdeas: [
      "I bought this because I wanted to know if it actually works.",
      "Nobody told me this was the feature I should look for.",
      "I tried three versions. The result surprised me.",
      "Wait until you see what happens when I use this.",
      "I thought this was useless until I discovered this.",
    ],
    technique: "Open with an unanswered question. Give viewers a reason to stay, then deliver the answer.",
    commentInvitation: "Would you have guessed this was the result?",
  },
  {
    name: "Surprise",
    tagline: "Give people something they didn't expect",
    why: "Surprise interrupts routine and makes ordinary subjects more interesting.",
    videoIdeas: [
      "A product has an unexpected second use.",
      "A cheap item performs better than an expensive one in a fair test.",
      "A simple before-and-after reveals a dramatic difference.",
      "A creator discovers a feature they never noticed.",
      "An ordinary object is used in an unusual but safe and practical way.",
    ],
    technique: "Establish what people expect, then reveal something genuinely unexpected.",
    commentInvitation: "Did you expect that?",
  },
  {
    name: "Humor",
    tagline: "Give people a reason to smile or laugh",
    why: "People enjoy content that makes them feel good.",
    videoIdeas: [
      "Things I thought would be easy until I actually tried them.",
      "Me before discovering this product versus me afterward.",
      "A funny reenactment of a common everyday problem.",
      "A product test with an unexpected, harmless failure.",
      "The five stages of trying to organize your home.",
      "A creator dramatically reacting to a very relatable situation.",
    ],
    technique: "Use recognizable situations, facial expressions, timing, and a funny payoff. Don't force a joke into every video.",
    commentInvitation: "Be honest. Have you ever done this?",
  },
  {
    name: "Desire",
    tagline: "Show people a result they would love to experience",
    why: "Desire is about showing a possibility, not simply displaying an object.",
    videoIdeas: [
      "Transform a messy desk into a beautiful workspace.",
      "Show a relaxing evening routine.",
      "Demonstrate how a product helps create a more organized home.",
      "Show a satisfying beauty or styling result.",
      "Create a \"little luxury on an everyday budget\" video.",
      "Show how a product makes a routine easier or more enjoyable.",
    ],
    technique: "Show the experience or outcome first. Then explain what helped create it.",
    commentInvitation: "Would this make your everyday routine better?",
  },
  {
    name: "Hunger and appetite",
    tagline: "Make people imagine the taste",
    why: "Food videos can activate imagination through sound, texture, color, and close-up visuals.",
    videoIdeas: [
      "A close-up of a crispy bite.",
      "The sound of cutting into fresh bread.",
      "A slow pour of chocolate or sauce.",
      "A recipe with a surprising ingredient.",
      "The snack I keep making when I want something sweet.",
      "A taste-test ranking of three flavors.",
      "A satisfying recipe transformation from ingredients to finished dish.",
    ],
    technique: "Use appetizing lighting, close-up shots, natural sound, and honest reactions. Never claim to taste something you have not tried.",
    commentInvitation: "Which one would you choose: sweet, salty, or spicy?",
  },
  {
    name: "Nostalgia",
    tagline: "Remind people of a feeling they recognize",
    why: "Nostalgia connects a new video with an old memory.",
    videoIdeas: [
      "Things that remind me of being a kid.",
      "Recreate a childhood snack or simple routine.",
      "Compare how people did something years ago with how they do it today.",
      "Show an old-fashioned item that is useful again.",
      "If you grew up doing this, you already know.",
    ],
    technique: "Use familiar details, sounds, objects, and stories that viewers can recognize.",
    commentInvitation: "What did this remind you of?",
  },
  {
    name: "Belonging",
    tagline: "Make people feel included",
    why: "People enjoy discovering a community where others understand them.",
    videoIdeas: [
      "For the people who love making their home feel peaceful.",
      "If you're a creator who works a full-time job too, this is for you.",
      "Things only people who love cooking understand.",
      "A little reminder for anyone starting over.",
      "The products I wish every first-time creator knew about.",
    ],
    technique: "Speak to a clear audience. Make viewers feel seen without making them feel excluded.",
    commentInvitation: "Who else understands this?",
  },
  {
    name: "Empathy",
    tagline: "Make people feel understood",
    why: "Empathy makes content personal and meaningful.",
    videoIdeas: [
      "If your mornings feel chaotic, try this simple routine.",
      "For anyone who feels overwhelmed by creating content.",
      "A small thing that made my day easier.",
      "You don't need a perfect home to make a beautiful video.",
      "What I wish I knew when I started.",
    ],
    technique: "Start with a real problem or feeling. Offer a helpful idea without judging the viewer.",
    commentInvitation: "What part of this do you find hardest?",
  },
  {
    name: "Satisfaction",
    tagline: "Give viewers a visual or mental reward",
    why: "Some videos are enjoyable because the result feels complete.",
    videoIdeas: [
      "Organizing a cluttered drawer.",
      "Cleaning a surface and revealing the result.",
      "Restocking a pantry.",
      "Assembling a useful item.",
      "A perfectly arranged desk setup.",
      "A transformation from beginning to finished result.",
    ],
    technique: "Make the steps easy to follow. Let the final result breathe on screen.",
    commentInvitation: "How satisfying was that from 1 to 10?",
  },
  {
    name: "Confidence",
    tagline: "Help people feel capable",
    why: "People like learning something that makes them feel more prepared.",
    videoIdeas: [
      "Three things I wish I knew before buying this.",
      "How to choose the right version for your needs.",
      "A beginner-friendly way to use this.",
      "What to check before spending your money.",
      "How I made my filming setup easier.",
    ],
    technique: "Explain one useful thing clearly. Avoid making viewers feel foolish for not knowing it.",
    commentInvitation: "What would you like me to explain next?",
  },
  {
    name: "Excitement",
    tagline: "Make an ordinary moment feel like an event",
    why: "An unboxing, a reveal, a first test — excitement turns an ordinary moment into an event people want to witness.",
    videoIdeas: [
      "Unbox something you have been waiting for.",
      "Reveal a room transformation.",
      "Test a new product for the first time.",
      "Create a countdown to a final result.",
      "Compare an expectation with the real experience.",
    ],
    technique: "Use energy, anticipation, and a clear payoff. Excitement should feel genuine.",
    commentInvitation: "Would you be excited to try this?",
  },
  {
    name: "Fear of missing useful information",
    tagline: "Make the value clear",
    why: "This is not about frightening people. It is about helping them avoid mistakes or missed opportunities.",
    videoIdeas: [
      "Three things to check before buying a blender.",
      "Read this before choosing a ring light.",
      "The detail I overlooked when ordering this.",
      "What I would compare before choosing between these two products.",
    ],
    technique: "Offer practical information. Do not invent danger, urgency, or scarcity.",
    commentInvitation: "What do you always check before buying?",
  },
  {
    name: "Pride",
    tagline: "Help viewers celebrate progress",
    why: "Pride helps viewers celebrate real progress, including small improvements.",
    videoIdeas: [
      "My first video versus my latest video.",
      "A small improvement I'm proud of.",
      "How I made my filming corner on a budget.",
      "A beginner's first successful product demonstration.",
      "What I learned after posting consistently.",
    ],
    technique: "Celebrate real progress, including small improvements.",
    commentInvitation: "What's one thing you've improved recently?",
  },
  {
    name: "Inspiration",
    tagline: "Make people imagine what they could create",
    why: "Inspiration shows achievable possibilities and gives viewers a starting point.",
    videoIdeas: [
      "A simple room makeover.",
      "A creative product demonstration.",
      "A beginner creator's filming setup.",
      "A low-cost way to improve a daily routine.",
      "You don't need expensive equipment to start.",
    ],
    technique: "Show achievable possibilities. Give viewers a starting point.",
    commentInvitation: "What would you create with this idea?",
  },
  {
    name: "Trust",
    tagline: "Make people believe you are worth listening to",
    why: "Trust is one of the most valuable emotions in creator marketing.",
    videoIdeas: [
      "What I liked and what I didn't like.",
      "Who I think this product is actually for.",
      "Three things I noticed after using it.",
      "What this product cannot do.",
      "Would I buy it again? Here's my honest answer.",
    ],
    technique: "Show evidence, disclose sponsorships and affiliate relationships, explain limitations, and never pretend a product is perfect.",
    commentInvitation: "What would you want to know before buying?",
  },
];

export const TEN_SECOND_STRUCTURE: [string, string][] = [
  ["Second 0–2: The interruption", "Show an interesting visual, ask a question, reveal a problem, or introduce an unexpected situation."],
  ["Second 2–4: The emotional connection", "Make the viewer recognize a feeling, desire, problem, or curiosity."],
  ["Second 4–7: The promise", "Tell the viewer what they will learn, see, or discover."],
  ["Second 7–10: The proof begins", "Start demonstrating, comparing, revealing, or telling the story. Don't spend the entire opening promising something."],
];

export const OPENING_LINES: string[] = [
  "I didn't expect this to be the part I loved most.",
  "If you struggle with this everyday problem, watch.",
  "I tested this so you can see what actually happens.",
  "This is one of those little things that makes a big difference.",
  "I have one question: why didn't I try this sooner?",
  "Before you buy one, look at this.",
  "I thought these two products would be the same.",
  "Let me show you the part nobody talks about.",
  "This looks ordinary, but watch what it does.",
  "I found a way to make this routine easier.",
  "Would you pay for this? Let's take a closer look.",
  "I wish someone had explained this to me earlier.",
  "Here is what happened when I tried it for the first time.",
  "Three things surprised me about this.",
  "I have a confession about this purchase.",
  "Let's see if the result matches the promise.",
  "If you're a beginner, start here.",
  "This is for anyone who loves a satisfying transformation.",
  "I found something I want to compare.",
  "The little detail that changed my mind was...",
  "Which one would you choose without knowing the price?",
  "I tried the popular option and the budget option.",
  "Here's what I would check before spending my money.",
  "Wait until you see the finished result.",
  "I want your honest opinion on this.",
];

export interface Concept {
  group: string;
  title: string;
  description: string;
}

export const CONCEPTS: Concept[] = [
  // The curiosity experiments
  { group: "The curiosity experiments", title: "The Mystery Object", description: "Start with a close-up that hides the product. Give three clues before revealing it." },
  { group: "The curiosity experiments", title: "The Blind Comparison", description: "Show two similar products without revealing their prices. Ask viewers which they think is better, then reveal the results." },
  { group: "The curiosity experiments", title: "The Unexpected Feature", description: "Choose one overlooked product feature and show why it matters in everyday life." },
  { group: "The curiosity experiments", title: "The 24-Hour Question", description: "Use a product throughout a normal day and report what you genuinely noticed." },
  { group: "The curiosity experiments", title: "The Prediction Challenge", description: "Ask viewers to predict the result before demonstrating it." },
  // The comedy laboratory
  { group: "The comedy laboratory", title: "The Dramatic Everyday Problem", description: "Turn a small everyday frustration into a funny mini-movie." },
  { group: "The comedy laboratory", title: "Expectation Versus Reality", description: "Show what you expected from a product or routine, then what really happened." },
  { group: "The comedy laboratory", title: "The Product Interview", description: "Pretend to interview an everyday object: \"What exactly do you bring to this household?\"" },
  { group: "The comedy laboratory", title: "The Overly Honest Review", description: "Use humor to explain the good, the bad, and the unexpected." },
  { group: "The comedy laboratory", title: "The Inner Voice", description: "Show the difference between what you say while shopping and what you think afterward." },
  // The satisfying visual studio
  { group: "The satisfying visual studio", title: "The Transformation Without Words", description: "Tell a complete before-and-after story using only visuals and natural sounds." },
  { group: "The satisfying visual studio", title: "The One-Minute Reset", description: "Turn a messy area into an organized space." },
  { group: "The satisfying visual studio", title: "The Texture Film", description: "Create a close-up visual experience featuring texture, movement, sound, and detail." },
  { group: "The satisfying visual studio", title: "The Perfect Sequence", description: "Film a series of actions that fit together beautifully: opening, pouring, arranging, finishing." },
  { group: "The satisfying visual studio", title: "The Tiny Upgrade", description: "Show one small change that improves a routine." },
  // The emotional storytelling studio
  { group: "The emotional storytelling studio", title: "The Memory Trigger", description: "Connect a product or activity to a personal memory." },
  { group: "The emotional storytelling studio", title: "The Small Joy Story", description: "Tell a short story about something ordinary that made your day better." },
  { group: "The emotional storytelling studio", title: "The Gift of Understanding", description: "Create a video for a person who has a specific challenge, hobby, or passion." },
  { group: "The emotional storytelling studio", title: "The First-Time Feeling", description: "Capture the genuine reaction of trying something new." },
  { group: "The emotional storytelling studio", title: "The Story Behind the Object", description: "Explain why an object matters to you, not just what it does." },
  // The conversation starters
  { group: "The conversation starters", title: "Pick a Side", description: "Compare two colors, flavors, styles, designs, or approaches." },
  { group: "The conversation starters", title: "The Viewer Becomes the Director", description: "Ask viewers to choose the next test or video topic." },
  { group: "The conversation starters", title: "Finish My Sentence", description: "Start a relatable statement and invite viewers to complete it." },
  { group: "The conversation starters", title: "The Unpopular Opinion", description: "Share a respectful, honest opinion about a common product or habit." },
  { group: "The conversation starters", title: "The Community Test", description: "Ask viewers to suggest a test, then create the next video using their ideas." },
  // The buying-confidence series
  { group: "The buying-confidence series", title: "The Honest Buyer Guide", description: "Explain who should consider a product, who may not need it, and what to check before buying." },
  { group: "The buying-confidence series", title: "The Three-Question Test", description: "Answer: What does it do? Who is it for? Is it worth considering?" },
  { group: "The buying-confidence series", title: "The Alternative Finder", description: "Compare a premium option with a more affordable alternative, using fair criteria." },
  { group: "The buying-confidence series", title: "The Problem-Solution Story", description: "Show a real problem, demonstrate the product, and explain whether it helped." },
  { group: "The buying-confidence series", title: "The Final Verdict", description: "After testing, give a clear recommendation with reasons and limitations." },
];

export interface Formula {
  id: string;
  name: string;
  steps: string[];
  example: string;
}

export const FORMULAS: Formula[] = [
  {
    id: "A",
    name: "Formula A: The Emotion-to-Action Video",
    steps: [
      "Start with a recognizable emotion.",
      "Introduce a relatable problem or desire.",
      "Show a visual that makes the viewer curious.",
      "Demonstrate a solution or experience.",
      "Explain what happened.",
      "Invite the viewer to respond.",
      "Give a relevant next step.",
    ],
    example: "Hook: \"If your kitchen always gets messy when you're cooking, I want to show you something.\"\nEmotion: Frustration and recognition.\nDemonstration: Show the product being used during a real cooking session.\nProof: Show whether it actually helped.\nConversation: \"Would this make cooking easier for you?\"\nAction: \"If you want to compare options, check the product details before deciding.\"",
  },
  {
    id: "B",
    name: "Formula B: The Smile-to-Story Video",
    steps: [
      "Open with a funny or relatable moment.",
      "Introduce the situation.",
      "Make the moment more entertaining.",
      "Reveal the product or solution naturally.",
      "Show the result.",
      "Finish with a memorable line.",
    ],
    example: "\"Me trying to organize my life with absolutely no plan. Then I found a simple way to organize my workspace. It isn't magic, but at least my desk knows where everything belongs now.\"",
  },
  {
    id: "C",
    name: "Formula C: The Hunger-to-Desire Video",
    steps: [
      "Start with a delicious close-up.",
      "Use sound and texture.",
      "Show the preparation.",
      "Reveal the finished food.",
      "Capture a genuine reaction.",
      "Ask viewers what they would choose.",
    ],
    example: "\"Listen to that crunch. I made this with three simple ingredients. Now the real question is whether you would eat it with honey or chocolate.\"",
  },
  {
    id: "D",
    name: "Formula D: The Curiosity-to-Trust Review",
    steps: [
      "Ask a question.",
      "Explain what you wanted to find out.",
      "Show the product or experience.",
      "Test it fairly.",
      "Reveal the result.",
      "Mention limitations.",
      "Explain who might find it useful.",
    ],
    example: "\"Does a more expensive ring light actually make a difference? I compared the lighting, setup, and ease of use. Here's what I noticed.\"",
  },
  {
    id: "E",
    name: "Formula E: The Viewer-to-Fan Series",
    steps: [
      "Address a specific audience.",
      "Share a recurring problem or interest.",
      "Give one useful tip.",
      "Ask the audience to contribute.",
      "Use their suggestions in a future video.",
      "Recognize their contributions.",
    ],
    example: "\"Welcome back to the beginner creator experiment. Today we're testing a new way to film product videos using only a phone. Tell me what you want us to test next.\"",
  },
];

export const CONVERSATION_TRIGGERS: string[] = [
  "Which one would you choose?",
  "What would you change?",
  "Have you tried something similar?",
  "What's your biggest challenge with this?",
  "Would you use this every day?",
  "What should I test next?",
  "What did I miss?",
  "What's your favorite version?",
  "Would you buy it at this price?",
  "What's one thing you wish this product did?",
  "Which result surprised you most?",
  "What's your experience been?",
  "Would you rather have option A or option B?",
  "What would you recommend instead?",
  "What's your best tip for beginners?",
  "Does this remind you of anything?",
  "What is one product you use all the time?",
  "Who would you send this to?",
  "Should I make part two?",
  "What question should I answer in the next video?",
];

export const COMMENT_LOOP: string[] = [
  "Publish a video with one clear question.",
  "Read the comments.",
  "Look for repeated questions and interesting opinions.",
  "Choose one useful comment.",
  "Create a follow-up video answering it.",
  "Mention the viewer's contribution when appropriate.",
  "Invite another question.",
];

export const WATCH_TIME_TECHNIQUES: [string, string][] = [
  ["Show the destination first", "Give viewers a glimpse of the final result."],
  ["Create a question", "Let the video answer something specific."],
  ["Remove unnecessary introductions", "Start where the interesting part begins."],
  ["Change the visual", "Use a new angle, close-up, demonstration, or relevant scene when it helps the story."],
  ["Keep the story moving", "Every section should add information, emotion, or progress."],
  ["Use real demonstrations", "Showing something is often more engaging than explaining it for too long."],
  ["Create a payoff", "Deliver the answer or result you promised."],
  ["Use natural sound", "A satisfying sound can make a demonstration more immersive."],
  ["Use captions", "Help people follow the story when sound is off."],
  ["Build anticipation honestly", "Don't promise a shocking reveal if there isn't one."],
  ["Make every second useful", "Remove repeated explanations and empty pauses."],
  ["End when the story is complete", "A short satisfying video can be better than a long video padded with unnecessary material."],
];

export const BUYING_JOURNEY: [string, string][] = [
  ["Recognition", "Show a problem or desire the viewer understands."],
  ["Possibility", "Introduce an idea or product that may help."],
  ["Demonstration", "Show how it works in a real situation."],
  ["Evidence", "Show results, details, comparisons, or your actual experience."],
  ["Honest evaluation", "Explain benefits and limitations."],
  ["Relevance", "Explain who may benefit and who may not need it."],
  ["Action", "Offer a clear next step, such as checking specifications, comparing options, or viewing the product link."],
];

export const PRODUCT_VIDEO_IDEAS: string[] = [
  "Before you buy, here are three things to check.",
  "Who this product is best suited for.",
  "What I liked, what I didn't, and what surprised me.",
  "How it works in a normal everyday routine.",
  "The difference between the two versions.",
  "What you get for the price.",
  "A beginner's guide to using it.",
  "The detail I wish I had noticed before purchasing.",
  "What I would compare before choosing.",
  "Would I recommend it? Here's my honest reasoning.",
];

export const SERIES: [string, string][] = [
  ["The Honest Test", "Test one product each episode."],
  ["Worth It or Not?", "Evaluate products using consistent criteria."],
  ["The Creator Experiment", "Try a new filming technique."],
  ["One-Minute Upgrade", "Improve one everyday routine."],
  ["The Budget Challenge", "Create something useful within a stated budget."],
  ["The Mystery Find", "Reveal an interesting product."],
  ["The Comment Decides", "Let viewers choose the next experiment."],
  ["Things I Wish I Knew", "Share lessons from experience."],
  ["The Beginner's Corner", "Explain something simply."],
  ["The Real-Life Test", "Use an item in an ordinary situation."],
  ["The Comparison Room", "Compare similar products fairly."],
  ["The Satisfying Reset", "Organize, clean, or transform."],
  ["The Creator Makeover", "Improve one video at a time."],
  ["The Fan Favorite", "Revisit the community's favorite ideas."],
  ["The Final Verdict", "Follow up on previous recommendations."],
];

export const CREATOR_IDENTITY: string[] = [
  "A recognizable opening phrase.",
  "A consistent type of content.",
  "A particular sense of humor or storytelling style.",
  "A recurring series name.",
  "A familiar visual approach.",
  "A genuine relationship with the audience.",
];

export const CHALLENGE: { days: [string, string, string][]; review: string[] } = {
  days: [
    ["Day 1", "Curiosity", "Make a video that opens with a question and answers it clearly."],
    ["Day 2", "Humor", "Create a funny video based on a relatable everyday situation."],
    ["Day 3", "Satisfaction", "Film a transformation, process, or visually satisfying sequence."],
    ["Day 4", "Storytelling", "Tell a short personal story connected to a product, experience, or lesson."],
    ["Day 5", "Conversation", "Create a video with a meaningful choice or question for viewers."],
    ["Day 6", "Trust", "Make an honest review that includes both strengths and limitations."],
    ["Day 7", "Community", "Use a viewer comment to create a follow-up video."],
  ],
  review: [
    "Which opening made people stay?",
    "Which video generated the most meaningful comments?",
    "Which video earned the most shares?",
    "Which video brought new followers?",
    "Which video led to product interest or clicks?",
    "Which video felt most natural to create?",
    "Which format would you like to repeat?",
  ],
};

export const SCORECARD: [string, string][] = [
  ["Stop scrolling", "Early retention and viewed-versus-swiped-away data, where available"],
  ["Keep watching", "Average watch time and completion rate"],
  ["Create conversation", "Comments and meaningful replies"],
  ["Encourage sharing", "Shares and sends"],
  ["Build an audience", "Follows and returning viewers"],
  ["Create buying interest", "Product clicks, saves, and questions"],
  ["Drive sales", "Attributed purchases and conversion rate"],
  ["Build loyalty", "Repeat engagement and returning viewers"],
];

export const IMPROVEMENT_RULES: [string, string][] = [
  ["If viewers leave early", "Improve the opening."],
  ["If viewers watch but don't understand", "Improve the explanation."],
  ["If people comment but don't follow", "Make the creator identity and series clearer."],
  ["If people click but don't buy", "Examine product relevance, price, product details, and trust."],
  ["If a video gets views but few useful interactions", "Test a stronger audience-specific angle."],
];

export const IDEA_GENERATOR = {
  formula: "Audience + Emotion + Situation + Visual + Payoff + Conversation",
  examples: [
    [
      ["Audience", "People who love cooking."],
      ["Emotion", "Hunger and curiosity."],
      ["Situation", "Choosing a quick evening snack."],
      ["Visual", "Close-up of a crispy finished recipe."],
      ["Payoff", "A simple recipe demonstration."],
      ["Conversation", "\"Would you add cheese or chili?\""],
    ],
    [
      ["Audience", "New content creators."],
      ["Emotion", "Confidence and belonging."],
      ["Situation", "Feeling overwhelmed by filming."],
      ["Visual", "A simple phone filming setup."],
      ["Payoff", "A beginner-friendly filming demonstration."],
      ["Conversation", "\"What part of making videos feels hardest?\""],
    ],
  ] as [string, string][][],
};

export const IDEA_PROMPTS: string[] = [
  "What everyday problem could I make entertaining?",
  "What product feature could surprise my audience?",
  "What would make someone smile today?",
  "What memory could this subject bring back?",
  "What would my audience love to compare?",
  "What could I demonstrate without explaining too much?",
  "What could I test fairly?",
  "What question do people repeatedly ask?",
  "What could I make more visually satisfying?",
  "What would a beginner want to know?",
  "What common mistake could I help people avoid?",
  "What could I explain in 30 seconds?",
  "What would make a funny mini-story?",
  "What could viewers choose for me?",
  "What would make a useful follow-up?",
  "What could I show instead of simply saying?",
  "What would make this product relevant to a real person?",
  "What is one honest limitation I should mention?",
  "What could make this video recognizable as mine?",
  "What would give viewers a reason to return?",
];

export const GOLDEN_RULES: string[] = [
  "Make the viewer the main character, not the product.",
  "Make the opening meaningful.",
  "Create curiosity, then deliver the answer.",
  "Use emotion naturally, never deceptively.",
  "Show real demonstrations whenever possible.",
  "Use humor to connect, not embarrass.",
  "Use appetite and desire through sensory storytelling.",
  "Give viewers something useful to remember.",
  "Ask questions people genuinely want to answer.",
  "Treat comments as the beginning of a conversation.",
  "Make series people can recognize.",
  "Be honest about sponsorships and affiliate relationships.",
  "Never fake a product test or result.",
  "Use analytics to learn, not to define your worth.",
  "Build trust before asking for a sale.",
  "Give people a reason to come back.",
  "Keep improving one creative skill at a time.",
];
