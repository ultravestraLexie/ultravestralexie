/* LEXIE VIRAL BASE 1 — structured data.
 * The tactical selling layer that sits alongside the Human Emotion
 * Video Playbook (lib/playbook.ts): the first 3 seconds, the selling
 * formula, why people share, the testing loop, the hook bank and the
 * before-you-post checklist. Extracted faithfully from the source
 * document in content/lexie-viral-base-1.md — built from 27 real
 * selling videos plus Lexie's notes; the six share reasons and the
 * Trojan horse come from Jonah Berger's "Contagious". Its honesty
 * rules match UltraVestra's: only if it is true, and one fake claim
 * and the trust is gone. */

/* ---------- The first 3 seconds decide the video ---------- */
export const FIRST_3_SECONDS: {
  steps: [string, string][];
  rule: string;
  lesson: string;
  patterns: string[];
  movementRule: string;
} = {
  steps: [
    ["0 to 1 second", "Open on something odd, surprising or annoying. Show something unusual. No hello. No intro."],
    ["1 to 2 seconds", "Let them think \u201Cwait, what is happening?\u201D Make them wonder. Do not explain yet."],
    ["2 to 3 seconds", "Hint at a result, a secret or an ending they need to see. Give a reason to stay."],
  ],
  rule: "Make the viewer curious before you explain anything. Always.",
  lesson:
    "The most important lesson: don't tell people what they are about to learn. Make them wonder what they are about to discover. Curiosity gets the click. The video still has to keep its promise.",
  patterns: [
    "Words on screen right away. All 27 show a headline or captions in the first second. You could follow them with the sound off.",
    "A number in the headline. About half use one: money made, views, followers, \u201C5 hooks\u201D.",
    "Hands are busy. Several creators do makeup, hold a product or open a snack while they talk. It looks like real life, not an ad.",
    "The result comes first. In the clips with captions, the first line is a money number, a view count or a bold promise. None opens with a greeting.",
    "Something is always moving.",
    "Proof shows up fast. About half flash a sales screenshot, a view count or the viral clip itself before second 3.",
  ],
  movementRule:
    "One creator, breaking down a video she says earned her about $18,000, gives this rule: always keep movement in the frame.",
};

/* ---------- The selling formula: three stages, in order ---------- */
export interface SellingStage {
  stage: string;
  name: string;
  aka: string;
  tactics: string[];
}

export const SELLING_FORMULA: SellingStage[] = [
  {
    stage: "1",
    name: "Stop the scroll",
    aka: "the hook",
    tactics: [
      "Call out who it is for. Speak right away to one group, one problem, one wish or one frustration. The right person should think \u201Cthis is for me.\u201D",
      "Start with their pain. Name the exact problem they have. Do not open with general benefits.",
      "Open bold. Use a surprise, a question people are already asking, or a daring claim. Tie it to the problem the product solves.",
      "Pair a bold picture with punchy words. Show a live demo or a surprising test, and put a short line of text on screen. If you don't earn attention in the first few seconds, people scroll away.",
      "Tease the payoff. Within 10 seconds they should know what they get for staying. A clear promise keeps people from dropping off.",
    ],
  },
  {
    stage: "2",
    name: "Show the value fast",
    aka: "the hold",
    tactics: [
      "Show, don't just tell. People trust what they see. Show the product working, fix one main problem, or show the before and after.",
      "Film the power moments. Pick the standout feature that solves a real problem. Show it close up so nobody can miss it.",
      "Be direct and specific. Say the problem, then your fix. Talk about the best parts of the product and what they do for the buyer, not only how it works.",
      "Build trust with proof. Real reviews, review screenshots, customer stories and results. Put a happy customer's story right after you show the feature.",
      "Feeling plus proof takes away doubt.",
      "Inspire, don't shout. Skip the pushy sales pitch. Mix useful tips with your story so it never feels like a commercial.",
    ],
  },
  {
    stage: "3",
    name: "Give a clear buying cue",
    aka: "the convert",
    tactics: [
      "Pick the moment. Ask right after they have seen it work.",
      "Be very specific. Drop \u201Cclick the link in bio.\u201D Say exactly what to do and why: \u201CTap the orange cart to grab the flash sale\u201D or \u201CTap below to book your free consultation.\u201D",
      "Give a real reason to act now. Low stock, a live discount, or a coupon code that ends soon. Only if it is true.",
      "Fix the page they land on. After the tap, the page must match the promise and the offer in the video.",
    ],
  },
];

/* ---------- The 4 C check ---------- */
export const FOUR_C: [string, string][] = [
  ["Connection", "Start with their challenge or their goal. Make them feel you are talking straight to them."],
  ["Clarity", "One message. Cut every distraction. Say what you offer, why it matters and how it helps."],
  ["Confidence", "Back up what you say with numbers, testimonials and demos that show a real result. Confidence spreads to the viewer."],
  ["Call to action", "Wait for the right moment. Then give one simple, direct next step that is easy to say yes to."],
];

/* ---------- A ready script: "I was skeptical, but…" ---------- */
export const READY_SCRIPT: { parts: [string, string][]; examples: string } = {
  parts: [
    ["Stop the scroll", "\u201CI didn't believe the hype on this one.\u201D or \u201CI almost returned this. Then I tried it on ___.\u201D"],
    ["Give reasons to trust", "\u201C___ people bought this last month.\u201D Show review screenshots while you say it. Use the real number."],
    ["Tell them exactly what to do", "\u201CTap the orange bag before it sells out.\u201D"],
  ],
  examples:
    "A video ranked number 1 on a Top 100 list opens with \u201CI'm so mad\u201D on screen while the creator squeezes foundation onto what looks like a leek. By second 7 the product is on her face, and she keeps blending it for most of the video. The shop tag and the deal only come in the last 20 seconds. A hair spray video opens with \u201CDon't waste your money\u2026\u201D and the bottle pushed right up to the lens. She holds up two bottles side by side and shows where it goes on her hair. The price under the video shows a 45% off flash sale.",
};

/* ---------- One video, start to finish (30–45 seconds) ---------- */
export const VIDEO_TIMELINE: [string, string, string][] = [
  ["0 to 3 sec", "The hook", "An unusual picture, words on screen, a reason to stay."],
  ["3 to 8 sec", "Trust", "Who this is for, a flash of proof, or why you would know."],
  ["8 to 20 sec", "The everyday problem", "Tell it as a real moment. Let them feel the frustration."],
  ["20 to 35 sec", "The fix, in use", "Show it working. Keep the benefits inside the story."],
  ["35 to 40 sec", "The wow", "The before and after, or the thing they did not expect."],
  ["Last 5 sec", "The convert", "Keep the promise the hook made. Then say exactly what to tap, and one real reason to do it today."],
];

/* ---------- What kills the sale ---------- */
export const KILLS_THE_SALE: string[] = [
  "A slow pace. Pauses and \u201Cums\u201D left in, no fast cuts, a flat voice.",
  "The product shows up late, and you never touch it.",
  "Sounding salesy, bored or hard to hear.",
  "A messy frame. Odd lighting, a busy background, your head half out of the shot.",
  "Rambling about ingredients you can't explain.",
  "Pushing the bundle before the problem it solves.",
  "Listing features one after another. It overloads people, and they scroll.",
  "A weak, slow call to action.",
];

/* ---------- What makes the sale ---------- */
export const MAKES_THE_SALE: string[] = [
  "The product is in use in the first 5 seconds, with a strong spoken hook.",
  "Fast cuts and busy hands. Keep touching and using the product.",
  "Talk like you are telling a friend. Warm, real, not salesy. Change your tone and keep your energy up.",
  "Lean on the pain it fixes or the result it brings. Pain points are why anyone buys anything.",
  "Get specific about the pain. Skip \u201Cdo you have dry skin?\u201D Say \u201Cmy heels were so cracked I stopped wearing sandals.\u201D",
  "Turn each feature into what it does for them. Not \u201C12-hour wear.\u201D Say \u201CI put it on at 7am and it was still there after the gym.\u201D",
  "Show the feature working. Don't describe it. It puts the product in their hands through the screen.",
  "Pick the 3 or 4 things that make it different. Skip what they can see for themselves.",
  "Know the product. Research it, then explain what the ingredients do in a way that is interesting.",
  "Show how to use it, casually. They will picture themselves using it.",
  "Use it again later for a fresh visual. It keeps them watching.",
  "Prove it works. Reviews, customer stories, before and after. This is the step most people skip.",
  "Close fast. Repeat the quality and the value against store price, say casually where to buy, and give a reason to tap: \u201Ctap the link to see all the colors.\u201D",
];

/* ---------- Fix a weak line: skip this → say this ---------- */
export const LINE_FIXES: [string, string, string][] = [
  ["This serum brightens skin.", "It took my skin from this\u2026 to this.", "Show the change"],
  ["I love this bag.", "If your laptop never fits in your bag, watch this.", "Make it about them"],
  ["Everyone needs this.", "If you're over 30 and wake up puffy, this is for you.", "Name who it is for"],
  ["It's really cheap.", "It costs less than the coffee you bought today.", "Compare the price to something small"],
  ["Buy it now!", "My last video on this cleared the shelf in a weekend.", "Show that other people want it"],
];

/* ---------- How the app picks winners ---------- */
export const APP_PICKS_WINNERS: { intro: string; steps: [string, string][]; trend: string } = {
  intro: "The app cannot tell if your video is good. It only watches what people do with it.",
  steps: [
    ["A small test", "Your new video goes to a small group first."],
    ["Reactions get counted", "The app does not measure respect or approval. It counts what people do right away: watch to the end, comment fast, argue, share, save."],
    ["The snowball", "If the first group reacts fast, the app shows it to a bigger group. Then a bigger one. That is how a video takes off."],
  ],
  trend:
    "The shortcut: ride a trend. Use a sound, format or challenge that is already popular. People already know how to react to it, so they react faster.",
};

/* ---------- Test small changes until one jumps ---------- */
export const TESTING_LOOP: { intro: string; steps: string[]; notes: string[]; watchNumbers: [string, string] } = {
  intro:
    "A coach broke down how two creators got to videos with millions of views. It was not a secret product. Both were selling things everyone else was selling. They tested.",
  steps: [
    "Pick one main idea.",
    "Post about five versions. Change one small thing each time: the hook words, the opening picture, or where you film.",
    "Most get a few hundred views. Watch for the one that jumps.",
    "Make five more versions of the winner. Then do it again.",
  ],
  notes: [
    "Tiny changes count. In his examples, one new word in the hook, a bolder opening picture, or a new room was enough to start a fresh winner.",
    "A script shortcut: find a video that already went viral in your niche. Write down what it says. Then rewrite it in your own words, shorter, in your style.",
    "Reuse a winning hook. One breakdown is called \u201CSame hook, different products.\u201D It shows three videos with about 1 to 2 million views each. A hook that works on one product can open a video for the next.",
    "Make the version nobody made yet. One creator took a comparison format that was already hot and pointed at the twist no one had tried.",
    "Post more. Every post is one more test and one more chance to hit. Posted and good beats perfect and stuck in drafts.",
    "Keep your personality in every video. People follow you for your energy and how you make them feel.",
    "Each post is a test, not a make-or-break moment. That is how you keep going without burning out.",
  ],
  watchNumbers: ["Watch time", "How many people are still there at 5 seconds"],
};

/* ---------- Why people hit share: Berger's six reasons ---------- */
export interface ShareReason {
  name: string;
  quote: string;
  text: string;
}

export const SHARE_REASONS: ShareReason[] = [
  {
    name: "Social currency",
    quote: "This makes me look good.",
    text: "People share things that make them look smart, funny or first to know. What we share tells others who we are.",
  },
  {
    name: "Triggers",
    quote: "I keep getting reminded of it.",
    text: "Tie your video to everyday things like morning coffee, Mondays or laundry day. Then daily life brings it back to mind.",
  },
  {
    name: "Emotion",
    quote: "I felt that.",
    text: "Big feelings make people act fast. Good ones like awe, joy and excitement. Bad ones too, like anger, shock and worry. Called high-energy emotion.",
  },
  {
    name: "Public visibility",
    quote: "Everyone is doing it.",
    text: "When a trend is easy to see, it is easy to copy.",
  },
  {
    name: "Practical value",
    quote: "More useful means more shared.",
    text: "Tips, hacks and helpful facts get passed on, because people like to help.",
  },
  {
    name: "Stories",
    quote: "Wait till you hear this.",
    text: "Plain facts get forgotten. A story gets told again.",
  },
];

/* ---------- What the viewer feels → what the viewer thinks ---------- */
export const FEELINGS_TABLE: [string, string][] = [
  ["Curiosity", "I need to see this!"],
  ["Frustration", "Why hasn't anyone fixed this?"],
  ["Surprise", "I didn't expect that!"],
  ["Amazement", "That's incredible!"],
  ["Satisfaction", "Finally, someone improved it!"],
  ["Inspiration", "I want to try that!"],
];

/* ---------- Hide the brand inside a story: the Trojan horse ---------- */
export const TROJAN_HORSE: { intro: string; tactics: string[]; trustLine: string } = {
  intro:
    "Nobody wants to sound like a walking ad. But people will happily pass on a good story. So build a Trojan horse: tell a story people want to share, and let the brand ride along inside it.",
  tactics: [
    "Sell the wish, not the thing. Nobody is buying a cream. They are buying looking fresh at the wedding.",
    "Name the pains they already feel. Tired eyes, stress, no sleep.",
    "Answer the quiet question before they ask. \u201CCan I use it on my neck too?\u201D",
    "Open with a real person and proof. Show someone's before and after while you use it yourself.",
    "After the hook, build trust. Do not jump into a list of ingredients. Say why you would know, then admit you doubted it. Doubt first makes the praise easy to believe.",
    "If the product is already everywhere, talk to people who have seen it and only need a push.",
    "Use the words they already know.",
    "Tell a true story with a deadline. Put the benefits inside the story instead of listing them.",
    "End with a real reason to act today. It sold out before, or the price goes back up. Only say it if it is true.",
  ],
  trustLine: "One fake claim and the trust is gone.",
};

/* ---------- The hook bank: fill in the blank ---------- */
export interface HookPattern {
  name: string;
  template: string;
  blanks: string[];
}

export const HOOK_BANK: HookPattern[] = [
  { name: "Problem solved", template: "I finally stopped my ___ from ___.", blanks: ["the product or thing", "the annoying thing it kept doing"] },
  { name: "Attack a common belief", template: "Stop ___. It's why your ___ keeps ___.", blanks: ["the common habit", "the thing", "the problem it causes"] },
  { name: "The silent show", template: "Day 1 next to day 14. Say nothing for one second.", blanks: [] },
  { name: "Authority", template: "I've tried 14 of these. Only one worked.", blanks: [] },
  { name: "The bad-news opener", template: "Read the reviews before you buy ___.", blanks: ["the product"] },
  { name: "The skeptic", template: "I didn't believe the hype on this one.", blanks: [] },
  { name: "The common question", template: "Does ___ really work? I tested it for 2 weeks.", blanks: ["the product"] },
  { name: "The relief", template: "You don't need ___. You need this.", blanks: ["the complicated thing they think they need"] },
  { name: "The almost-returned", template: "I almost returned this. Then I tried it on ___.", blanks: ["where you tried it"] },
  { name: "The unspoken doubt", template: "I thought this was a scam too. Look.", blanks: [] },
  { name: "The bold confession", template: "Yes, I ___ at ___.", blanks: ["what you did", "when or where"] },
  { name: "The warning", template: "Don't waste your money on ___.", blanks: ["the product or category"] },
  { name: "The near miss", template: "I was this close to ___. Then I tried this.", blanks: ["what almost happened"] },
  { name: "The strong feeling", template: "\u201CI'm so mad.\u201D Then show why.", blanks: [] },
  { name: "The skeptic lines", template: "I didn't believe the hype on this ___.", blanks: ["the product"] },
];

export const HOOK_BANK_NOTE =
  "The first five hook types are named in one of the videos. The two skeptic lines are from Lexie's notes. The rest are patterns the videos kept pointing at, with fill-in lines written for you. Say it in the first second and put the same words on screen.";

/* ---------- Before you post: the 15 checks ---------- */
export const PRE_POST_CHECKLIST: string[] = [
  "The first second shows something unusual.",
  "Words are on screen from frame one, and they make sense with the sound off.",
  "I made them curious before I explained anything.",
  "The hook is about them, not about me.",
  "The product is in my hands and in use by second 5.",
  "Every feature I mention says what it does for them.",
  "There is proof on screen: a review, a real number, or a before and after.",
  "I cut every pause and every \u201Cum\u201D.",
  "There is one strong feeling: curiosity, frustration or amazement.",
  "The product rides inside a story.",
  "There is something useful worth sending to a friend.",
  "The video keeps the promise the hook made.",
  "The ending says exactly what to tap, and one true reason to do it today.",
  "The page they land on matches what the video promised.",
  "I have 3 to 5 versions of the hook ready to test.",
];
