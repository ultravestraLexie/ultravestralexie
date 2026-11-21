/* ULTRAVESTRA — THE CREATOR'S SECRET WEAPON — structured data.
 * The interactive learning universe from the owner's vision document
 * (content/creator-secret-weapon.md): the 3-Second Psychology Lab
 * (50+ hooks in 7 families, weak-vs-strong decoding), the Sales
 * Psychology Vault (buyer types, message styles, the Conversion
 * Clinic), the Content Failure Museum, the Creator Script Laboratory,
 * the Viral Video Autopsy worksheet, the Creator Makeover Studio and
 * the 30-Second Challenge.
 * Its honesty rules match UltraVestra's: every tool here teaches and
 * structures the creator's own judgment. Scores are educational, never
 * predictions; simulator responses are teaching hypotheses, never
 * measured audience data; the autopsy is a worksheet the creator runs
 * on their own video — nothing here claims to analyze a video for them. */

/* ---------- Positioning ---------- */
export const POSITIONING =
  "Most platforms teach you how to post. UltraVestra teaches you how to make people stop, watch, trust, and buy.";

export const MISSION_LINE = "Don't just create content. Understand the power behind it.";

export const FORMULA: { step: string; line: string }[] = [
  { step: "Understand", line: "Explain the concept — what is actually happening in the viewer's mind." },
  { step: "Analyze", line: "Show real examples and explain why they work." },
  { step: "Improve", line: "Show how to correct the mistakes that destroy content." },
  { step: "Apply", line: "Give an exercise, a template, or a practical challenge." },
];

/* ---------- The Knowledge Universe ---------- */
export interface UniverseWorld {
  name: string;
  tagline: string;
  href: string;
}

export const UNIVERSE: UniverseWorld[] = [
  { name: "Psychology Lab", tagline: "Understand human attention.", href: "/secret-weapon#psychology-lab" },
  { name: "Video Lab", tagline: "Master content creation.", href: "/coach" },
  { name: "Sales Vault", tagline: "Turn attention into action.", href: "/secret-weapon#sales-vault" },
  { name: "Brand Observatory", tagline: "Discover brand opportunities.", href: "/discover" },
  { name: "Experiment Room", tagline: "Test and improve content.", href: "/secret-weapon#experiment-room" },
  { name: "Creator Academy", tagline: "Learn advanced strategies.", href: "/academy" },
];

/* ---------- 1. The 3-Second Psychology Lab — hook families ---------- */
export interface HookFamily {
  name: string;
  principle: string;
  formula: string;
  hooks: string[];
}

export const HOOK_FAMILIES: HookFamily[] = [
  {
    name: "Curiosity",
    principle:
      "The brain cannot leave an open question alone. A curiosity hook names just enough to make the answer feel necessary — and withholds the one detail that completes it.",
    formula: "There's one thing about [product / topic] nobody tells you — [the gap the video will close].",
    hooks: [
      "There's one thing about this nobody told me to look for.",
      "Before you buy this, check the one detail on the back nobody reads.",
      "I almost returned this — then I noticed what it actually does.",
      "This looks ordinary. Wait until you see what happens at the end.",
      "Nobody talks about the second thing this does.",
      "I read the instructions wrong for a month. Here's what I missed.",
      "There's a reason this costs half of the famous one — and it's not quality.",
      "What I found inside this surprised me more than the product itself.",
    ],
  },
  {
    name: "Pattern Interrupt",
    principle:
      "Feeds are rhythm. A pattern interrupt breaks the expected opening — mid-action, mid-sentence, mid-failure — and the break itself earns the next two seconds.",
    formula: "Open in the middle of the moment: '[the middle of the action]…' — explain after.",
    hooks: [
      "— and THAT is why I stopped buying the expensive one.",
      "Stop. Put the other one back. Watch this first.",
      "POV: you finally test the thing everyone argues about.",
      "Okay. We need to talk about this.",
      "Day 30 of testing this so you don't have to. Here's the verdict.",
      "No intro. Just watch what happens when I press this.",
      "I'm not supposed to compare these two, but here we go.",
      "Three seconds. That's all I need to change your mind about this.",
    ],
  },
  {
    name: "Unexpected Statement",
    principle:
      "A claim that contradicts what the viewer expected to hear forces a re-evaluation. Surprise is attention you don't have to beg for — as long as the statement is true.",
    formula: "I thought [the expected thing]. I was wrong about [one specific thing].",
    hooks: [
      "I thought this was going to be useless. I was wrong about one thing.",
      "The cheapest option won. I didn't want it to, but it did.",
      "I bought this as a joke. It's now the most-used thing I own.",
      "Expensive doesn't mean better — and this proves it in ten seconds.",
      "I hated this the first day. By day seven I understood.",
      "This product does less than the others. That's exactly why it works.",
      "I returned the famous one and kept this instead.",
      "Everything I believed about this category was backwards.",
    ],
  },
  {
    name: "Visual",
    principle:
      "The eye decides before the ear hears a word. A visual hook puts the most striking frame first — the texture, the result, the mess — and lets the picture make the promise.",
    formula: "Open on [the most striking visual] — no talking for the first second.",
    hooks: [
      "Open on the closest close-up: the texture, the pour, the snap — full frame, no talking.",
      "Start with the finished result in frame. Then rewind: 'Here's how it got there.'",
      "Show the before state at its worst — then begin.",
      "Hold two options side by side and let the difference speak first.",
      "Open mid-demonstration: hands already working, product already in action.",
      "Fill the frame with the satisfying moment — the click, the peel, the reveal.",
      "Start with the mess, the pile, the problem — at its most recognizable.",
      "Show the product somewhere it doesn't belong — then explain why it's there.",
    ],
  },
  {
    name: "Emotional",
    principle:
      "Feelings create memory and trust. An emotional hook names an honest human moment the viewer has lived, so the video feels like recognition instead of advertising.",
    formula: "I wish somebody had [honest moment] when I [starting point].",
    hooks: [
      "I wish somebody had shown me this when I first started.",
      "This is for everyone who's ever felt embarrassed by this problem.",
      "I got emotional opening this — here's why it mattered to me.",
      "My grandmother taught me this. The product just makes it easier.",
      "If you've ever given up on this, watch — I had too.",
      "This one's for the beginners who feel behind. You're not.",
      "I didn't buy this for the features. I bought it for mornings like this.",
      "The moment this worked, I thought of everyone who needs to see it.",
    ],
  },
  {
    name: "Controversial-But-Respectful",
    principle:
      "Respectful disagreement starts conversations that attacks never can. Challenge the assumption, never the person — and always bring your reason.",
    formula: "Unpopular opinion: [a respectful challenge]. Here's my reason.",
    hooks: [
      "Unpopular opinion: we're judging this product the wrong way.",
      "I think the expensive version is a mistake — and I'll show you why.",
      "Are we choosing this because of the brand, or because of the value?",
      "Hot take: more features made this worse, not better.",
      "I disagree with every review I've seen of this. Respectfully — here's mine.",
      "What if the routine everyone recommends is the problem?",
      "The popular choice isn't the right choice for beginners. Here's the one that is.",
      "People argue about this constantly. Both sides are missing the same thing.",
    ],
  },
  {
    name: "Direct Challenge",
    principle:
      "A test, a guess, or a verdict to deliver gives the viewer a role. Participation is attention — people stay to find out whether they were right.",
    formula: "Let's test [the claim] — guess [the result] before I start.",
    hooks: [
      "Let's see if this is as easy to use as it looks.",
      "Guess the result before I start — most people get it wrong.",
      "Can this survive a real week in my actual routine? Day one.",
      "You be the judge: worth it, or not? Watch, then decide.",
      "I need your honest opinion — which one wins?",
      "Thirty seconds. One test. No edits. Let's go.",
      "Think you know which one's better? Prove it after you watch this.",
      "Try to spot the moment it fails. Most people miss it.",
    ],
  },
];

export const HOOK_COUNT = HOOK_FAMILIES.reduce((n, f) => n + f.hooks.length, 0);

/* ---------- Weak vs strong — the Hook Decoder pairs ---------- */
export interface WeakStrong {
  weak: string;
  strong: string;
  why: string;
}

export const WEAK_STRONG: WeakStrong[] = [
  {
    weak: "Today I'm going to show you this product.",
    strong: "I genuinely thought this product was a waste of money until I tried THIS.",
    why: "The weak line announces a presentation — the viewer has no question to stay for. The strong line opens two loops at once: why did a skeptic change their mind, and what is THIS? Doubt first also builds trust: a creator who resisted is more believable than a creator who only praises.",
  },
  {
    weak: "Hey guys, welcome back — today we're going to be talking about this.",
    strong: "Your routine has ten steps. This replaced nine of them.",
    why: "The greeting spends the most valuable seconds on the creator. The strong line spends them on the viewer's life: it names their burden (ten steps) and promises a specific, countable relief (nine gone) — a claim the viewer now wants verified.",
  },
  {
    weak: "This is a really great product that I love so much.",
    strong: "I didn't expect this little detail to make such a difference.",
    why: "'Great' and 'love' are conclusions the viewer didn't reach — they read as advertising. The strong line points at one specific detail and withholds it, so the viewer's own curiosity does the persuading.",
  },
  {
    weak: "Let me tell you about all the features of this item.",
    strong: "Before you buy this, check these three things.",
    why: "A feature lecture serves the seller. 'Check these three things' serves the buyer — it promises protection against a bad purchase, which is useful even to a viewer who never buys. Usefulness is the fastest honest attention there is.",
  },
  {
    weak: "This product is amazing, you should definitely buy it.",
    strong: "Is this genuinely worth the money — or is the alternative better? Let's find out honestly.",
    why: "A command to buy triggers resistance. A fair question triggers judgment — and people stay to judge. Promising an honest verdict, including the possibility that the alternative wins, is what makes the eventual recommendation believable.",
  },
  {
    weak: "I've been using this for a while and it's pretty good.",
    strong: "Day 30 with this. Here's what nobody mentions.",
    why: "'A while' and 'pretty good' carry no evidence. A day count is proof of real use, and 'what nobody mentions' promises the one thing reviews usually hide — the detail that only shows up with time.",
  },
  {
    weak: "Check out this new thing I got in the mail.",
    strong: "Watch what happens when I try this for the first time.",
    why: "The weak line is about the creator's mail. The strong line makes the viewer a witness to an event with an unknown outcome — and an unscripted first reaction is the most trusted footage a creator can post.",
  },
  {
    weak: "This will change your life, trust me, it's incredible.",
    strong: "Imagine your morning routine taking four minutes instead of twenty. Let's test whether this gets you there.",
    why: "Huge promises with no mechanism read as hype, and 'trust me' asks for faith the creator hasn't earned. The strong line paints a specific, imaginable outcome — then immediately offers to test it instead of demanding belief.",
  },
];

/* ---------- The Scroll Stop Score ---------- */
export interface ScoreItem {
  item: string;
  fix: string;
}

export const SCORE_ITEMS: ScoreItem[] = [
  {
    item: "Names a specific person or problem",
    fix: "Open by naming exactly who this is for, or the problem they already recognize. 'Everyone' stops no one — a named person hears themselves and stays.",
  },
  {
    item: "Opens a curiosity gap",
    fix: "Withhold one completing detail: the result, the reason, the second thing it does. If the opening answers everything, nothing pulls the viewer forward.",
  },
  {
    item: "First visual changes or moves",
    fix: "Start on movement or change — the product in action, a close-up, a before state. A static talking head in second one is the easiest swipe in the feed.",
  },
  {
    item: "No greeting or filler",
    fix: "Cut 'hey guys', the channel welcome, and the warm-up. Every filler word spends the viewer's patience before the promise arrives.",
  },
  {
    item: "Product or problem tension is present",
    fix: "Something must be at stake in the opening: a problem unsolved, a claim untested, a choice unmade. No tension, no reason to continue.",
  },
  {
    item: "Spoken in under three seconds",
    fix: "Read the opening line out loud and time it. If the promise lands after second three, shorten the line — the decision window closes fast.",
  },
  {
    item: "Specific, not generic",
    fix: "Replace adjectives ('amazing', 'great', 'incredible') with one concrete detail: a number, a day count, a comparison, a named feature. Specifics are believable; adjectives are advertising.",
  },
  {
    item: "A payoff is promised",
    fix: "End the opening with what the viewer will get: the verdict, the check, the difference. A promise made clearly is a promise the rest of the video must keep.",
  },
];

export const SCORE_LABEL = "Educational score — not a prediction of virality.";

/* ---------- 2. The Sales Psychology Vault ---------- */
export const KEY_LESSON =
  "Don't just show people what a product does. Show them what becomes easier, better, or more enjoyable when they own it.";

export const SALES_PRINCIPLES: { title: string; line: string }[] = [
  {
    title: "Why people buy",
    line: "People rarely buy a product. They buy the easier morning, the solved embarrassment, the saved hour, the version of the day that goes right. Sell the change in their life, truthfully — the product is how it happens.",
  },
  {
    title: "Create desire without begging",
    line: "Desire comes from a viewer imagining their own life improved, not from a creator asking harder. Show the outcome vividly and honestly, then let the viewer want it on their own.",
  },
  {
    title: "Demonstrate product value",
    line: "Value is proven, not described. Put the product to work on the real job, in real conditions, uncut at the moment that matters — value the viewer can see needs no adjectives.",
  },
  {
    title: "Build trust",
    line: "Trust is built in the moments that cost you: the honest limitation, the comparison your product loses, the 'who should skip this'. A creator who will talk a viewer out of the wrong purchase earns the right to recommend the right one.",
  },
  {
    title: "Overcome buying objections",
    line: "Name the objection before the viewer types it — price, doubt, fit, effort — and answer it on camera while the product is on screen. An objection answered converts; an objection ignored leaks into the comments.",
  },
  {
    title: "Create urgency without lying",
    line: "Urgency is only honest when it is real: a genuine deadline, a true stock fact, a real price change. When none exists, the honest urgency is the cost of waiting — name what staying stuck costs the viewer. Never invent a countdown.",
  },
  {
    title: "Make viewers imagine owning it",
    line: "Walk the viewer through their own moment: 'Picture your counter, your bag, your 6 a.m.' Ownership imagined honestly — in their real routine, with their real problem — is the strongest sales force that doesn't feel like selling.",
  },
];

/* ---------- Buyer Brain Simulator ---------- */
export interface BuyerType {
  type: string;
  mindset: string;
  responds_to: string;
  turned_off_by: string;
}

export const BUYER_TYPES: BuyerType[] = [
  {
    type: "The Skeptic",
    mindset: "Assumes every creator is paid to praise, and watches mainly to find the catch.",
    responds_to: "Honest limitations, uncut demonstrations, and comparisons where the featured product sometimes loses.",
    turned_off_by: "Hype, superlatives, and pressure — anything that sounds like a script written by the brand.",
  },
  {
    type: "The Researcher",
    mindset: "Decides slowly and on evidence: specs, prices, alternatives, and how things hold up over time.",
    responds_to: "Numbers, fair tests, side-by-side evidence, and day-count proof of real use.",
    turned_off_by: "Vague claims, missing details, and 'just trust me' in place of information.",
  },
  {
    type: "The Impulse Viewer",
    mindset: "Buys the feeling of the outcome. Decides in seconds, on emotion first and logic later.",
    responds_to: "Vivid outcome imagery, sensory demonstrations, and one simple, clear next step.",
    turned_off_by: "Long explanations and technical detail before the payoff — the feeling cools while you talk.",
  },
  {
    type: "The Loyal Fan",
    mindset: "Trusts this creator personally and buys on their word — but notices instantly when the word changes.",
    responds_to: "Personal story, consistency with past advice, and being told honestly who a product is NOT for.",
    turned_off_by: "A stranger's sales script in a familiar voice, and recommendations that contradict what the creator said before.",
  },
  {
    type: "The Bargain Hunter",
    mindset: "Price-first. Wants maximum value per dollar and proof the spend beats the alternatives.",
    responds_to: "Cost-per-use math, honest comparison against the expensive option, and real discount facts.",
    turned_off_by: "Premium language without proof, and fake scarcity invented to rush the decision.",
  },
];

export interface MessageStyle {
  style: string;
  example_line: string;
}

export const MESSAGE_STYLES: MessageStyle[] = [
  {
    style: "The Hard Sell",
    example_line: "You NEED this. Link below — it sells out fast, so don't wait!",
  },
  {
    style: "The Honest Review",
    example_line: "Here's what it does well, here's where it falls short, and here's who should skip it.",
  },
  {
    style: "The Story",
    example_line: "Three weeks ago I was dealing with this every single morning. Then a friend handed me this…",
  },
  {
    style: "The Demonstration",
    example_line: "No pitch. Watch it handle the exact job — uncut, start to finish.",
  },
];

/* Likely responses: SIM_RESPONSES[buyer type][message style]. Teaching
 * scenarios — hypotheses about viewer psychology, never measured data. */
export const SIM_RESPONSES: Record<string, Record<string, { reaction: string; lesson: string }>> = {
  "The Skeptic": {
    "The Hard Sell": {
      reaction: "Leaves or comments 'ad'. Pressure confirms every suspicion this viewer walked in with.",
      lesson: "With a skeptic, pressure is proof of the catch. Remove it entirely.",
    },
    "The Honest Review": {
      reaction: "Stays. The stated limitation is the first thing this viewer has believed all week.",
      lesson: "One honest weakness buys credibility for everything else you say.",
    },
    "The Story": {
      reaction: "Watches, but fact-checks the story mentally and discounts the emotional parts.",
      lesson: "Stories open skeptics; only evidence closes them. Pair the story with proof.",
    },
    "The Demonstration": {
      reaction: "Watches closely, looking for the edit. An uncut key moment earns real respect.",
      lesson: "For skeptics, the uncut demonstration is the argument. Let it run.",
    },
  },
  "The Researcher": {
    "The Hard Sell": {
      reaction: "Ignores the pitch and goes looking for a spec sheet and three comparison videos.",
      lesson: "Urgency without data sends researchers to someone else's video.",
    },
    "The Honest Review": {
      reaction: "Engages seriously, but wants the numbers behind the verdict before deciding.",
      lesson: "Give researchers the review AND the measurements — verdict plus evidence.",
    },
    "The Story": {
      reaction: "Listens politely, then scrolls to find the facts the story skipped.",
      lesson: "A story earns a researcher's attention for about ten seconds. Feed the analysis.",
    },
    "The Demonstration": {
      reaction: "The happiest viewer in the room — especially with a fair comparison beside it.",
      lesson: "Demonstrations with comparisons are a researcher's native language.",
    },
  },
  "The Impulse Viewer": {
    "The Hard Sell": {
      reaction: "May actually buy — once. If the product disappoints, the regret attaches to you.",
      lesson: "Pressure converts impulse viewers today and costs you their trust tomorrow.",
    },
    "The Honest Review": {
      reaction: "The balanced tone cools the impulse; this viewer may save the video instead of buying.",
      lesson: "Honesty is right — but lead with the vivid outcome, then be honest, so the feeling survives the facts.",
    },
    "The Story": {
      reaction: "Fully in. This viewer buys the morning in the story, not the object in your hand.",
      lesson: "For impulse viewers, story IS the sales mechanism. Make the outcome imaginable.",
    },
    "The Demonstration": {
      reaction: "Buys when the demonstration is sensory and fast; drifts if it turns technical.",
      lesson: "Keep demos for this viewer vivid and short — sensation first, specifications later.",
    },
  },
  "The Loyal Fan": {
    "The Hard Sell": {
      reaction: "Feels the voice change immediately. May buy once out of loyalty — and trust you less.",
      lesson: "Fans are lending you trust, not giving it. A hard sell spends it.",
    },
    "The Honest Review": {
      reaction: "Buys with confidence, and defends you in the comments. This is the fan's favorite format.",
      lesson: "Honesty compounds with fans: every straight review makes the next recommendation stronger.",
    },
    "The Story": {
      reaction: "Deeply engaged — fans came for you, and the story is you. Buys to support and to share the outcome.",
      lesson: "With fans, your real experience is the product's best evidence. Tell it fully.",
    },
    "The Demonstration": {
      reaction: "Watches because it's you, and trusts the result because they saw it happen.",
      lesson: "Fans believe your demonstrations more than anyone's. Protect that by never staging one.",
    },
  },
  "The Bargain Hunter": {
    "The Hard Sell": {
      reaction: "'Sells out fast' reads as a tactic. This viewer checks three other listings for the real price.",
      lesson: "Fake scarcity insults the bargain hunter's core skill: knowing what things actually cost.",
    },
    "The Honest Review": {
      reaction: "Listens for the value verdict. Buys when the review proves the spend beats the alternatives.",
      lesson: "For this viewer, 'worth it' must be demonstrated against the cheaper and pricier options.",
    },
    "The Story": {
      reaction: "Enjoys it, then asks the only question that matters to them: 'Okay — but what does it cost per use?'",
      lesson: "Stories warm bargain hunters; arithmetic closes them. Do the cost-per-use math out loud.",
    },
    "The Demonstration": {
      reaction: "Watches the test like an inspector. A product that survives a hard job earns the spend.",
      lesson: "Show the bargain hunter the toughest use case — durability is value they can calculate.",
    },
  },
};

export const SIM_LABEL = "Teaching scenarios — hypotheses about viewer psychology, not measured data.";

/* ---------- The Conversion Clinic ---------- */
export interface ClinicSymptom {
  symptom: string;
  likely_causes: string[];
  fixes: string[];
}

export const CLINIC_SYMPTOMS: ClinicSymptom[] = [
  {
    symptom: "High views, almost no product clicks",
    likely_causes: [
      "The product appears late — most viewers left before it arrived.",
      "The video entertains but never proves anything, so curiosity never turns into intent.",
      "No reason to click is ever given: the viewer doesn't know what the link would show them.",
    ],
    fixes: [
      "Product or problem in frame in the first second; the demonstration starts immediately.",
      "Include one uncut proof moment the viewer wants to verify for themselves.",
      "Say what clicking shows: the exact variant, the price check, the comparison — a reason, not a command.",
    ],
  },
  {
    symptom: "Clicks happen, purchases don't",
    likely_causes: [
      "Price shock: the video never prepared the viewer for what the product costs.",
      "The biggest objection (fit, quality, effort) was never answered, so it wins at checkout.",
      "The product page doesn't match the video's promise, and the mismatch kills trust at the last step.",
    ],
    fixes: [
      "Anchor the price honestly in the video — against the alternative, or per use — before the click.",
      "Name and answer the top objection on camera while the product is on screen.",
      "Check that the link lands on exactly the product and variant the video showed.",
    ],
  },
  {
    symptom: "Comments are full of questions",
    likely_causes: [
      "Key facts are missing: price, sizing, how it works, who it's for.",
      "The objection the audience cares about most leaked into the comments instead of being handled in the video.",
      "The video raised curiosity but the payoff never fully landed.",
    ],
    fixes: [
      "Treat every repeated comment question as a missing video beat — answer it in the video itself next time, and pin the answer now.",
      "Build the objection into the script: say it out loud, then test it on camera.",
      "Deliver the promised payoff completely, then summarize it in one line before the call to action.",
    ],
  },
  {
    symptom: "One video sold well, the next ones don't",
    likely_causes: [
      "The hit reached a wide audience of non-buyers; the follow-ups inherited the wrong crowd.",
      "A borrowed format fit the first product and audience, but not the next ones.",
      "The first video's fit — creator, product, moment — was the real cause, and it wasn't repeated.",
    ],
    fixes: [
      "Decode the hit before repeating it: which audience, which objection, which proof moment drove the sales?",
      "Rebuild the structure around each new product's own fit instead of copying the surface.",
      "Judge follow-ups by clicks and purchases per view, not by views — the audiences are different.",
    ],
  },
  {
    symptom: "Viewers say 'this feels like an ad'",
    likely_causes: [
      "Brand language and feature lists replaced the creator's own words and real use.",
      "Everything is praise; no limitation, friction, or real condition ever appears.",
      "The setting is too perfect — studio light, scripted lines, a product that never meets a mess.",
    ],
    fixes: [
      "Demonstrate in your real space, in your own words, on the real job the product does for you.",
      "Say one honest limitation out loud. It is what makes the praise believable.",
      "Show the friction: the setup, the learning curve, the part that isn't effortless.",
    ],
  },
  {
    symptom: "Strong watch time, but no saves or shares",
    likely_causes: [
      "The video is pleasant but contains nothing reusable — no check, list, or verdict worth keeping.",
      "The payoff arrives but is never packaged into a takeaway the viewer can repeat.",
      "Nothing in the video speaks to anyone beyond the viewer, so there's no one to send it to.",
    ],
    fixes: [
      "Build in one keepable asset: a three-point check, a comparison verdict, a rule of thumb.",
      "End with the takeaway stated in one clean line — the sentence a viewer would forward.",
      "Name who else needs it: 'send this to anyone choosing their first…' gives sharing a reason.",
    ],
  },
];

/* ---------- 6. The Content Failure Museum ---------- */
export interface FailureLesson {
  title: string;
  mistake: string;
  explanation: string;
  correction: string;
}

export const FAILURE_LESSONS: FailureLesson[] = [
  {
    title: "The product arrives too late",
    mistake: "Spending the first half of the video on introductions, context and backstory while the product waits off-screen.",
    explanation: "Viewers came for the product or the problem. Every second before it appears is a second spent on faith — and most viewers leave before the faith runs out, so the demonstration plays to an empty room.",
    correction: "Product or problem in frame in the first second. Introductions come later, or never — the work introduces you better than a welcome does.",
  },
  {
    title: "Talking too much kills the hook",
    mistake: "Front-loading explanations, disclaimers and backstory right after a strong opening line.",
    explanation: "A hook creates a question with a short shelf life. Talking delays the answer until the question expires — the viewer feels the stall and swipes, even though the opening was good.",
    correction: "Promise, then prove, then explain. The first thing after the hook should be the demonstration starting, not the story of how you got the product.",
  },
  {
    title: "Beautiful videos don't always sell",
    mistake: "Cinematic, polished footage — perfect light, perfect angles — with no real demonstration, proof, or reason to buy.",
    explanation: "Beauty earns admiration, not decisions. A buyer needs to see the product work in conditions like theirs; a film they admire gives them nothing to decide with, so they compliment it and scroll on.",
    correction: "Keep the craft, add the evidence: one uncut working moment, real conditions, and one honest limitation. Sellable beats beautiful.",
  },
  {
    title: "The demo that feels like an advertisement",
    mistake: "Reading the feature list in brand language, in perfect conditions, with zero friction or failure.",
    explanation: "Viewers recognize advertising grammar instantly — the cadence, the adjectives, the flawless demo — and discount everything said in it, including the true parts.",
    correction: "Demonstrate in your real space, in your own words, on your real job — including what the product doesn't do. Your voice is the difference between a review and a commercial.",
  },
  {
    title: "Viewers watch but never purchase",
    mistake: "An entertaining video where the product is a guest star: no objection answered, no value proven, no clear next step.",
    explanation: "Watching and buying are two different decisions. The video served the first beautifully and never built the second — belief, value and a reason to act were never assembled.",
    correction: "Answer the biggest objection on camera, prove the value moment uncut, and give one clear action at the moment belief peaks.",
  },
  {
    title: "Copying viral creators doesn't guarantee results",
    mistake: "Recreating a hit video beat-for-beat — same hook, same pacing, same reveal — with a different product and audience.",
    explanation: "The original worked because of fit: that creator, that audience, that product, that moment. Copying reproduces the surface while discarding every reason it worked.",
    correction: "Steal the structure, not the video. Decode why each beat worked, then rebuild those beats around your audience, your product and your honest experience.",
  },
  {
    title: "The hook the video never pays off",
    mistake: "A curiosity opening the video never answers — or answers in the final second with nothing behind it.",
    explanation: "Viewers learn. One unpaid loop teaches them this creator's openings lie, and retention quietly drops on every future video, even the honest ones.",
    correction: "Promise only what the video delivers, and deliver it while attention is still high. The payoff is the deposit that makes the next hook spendable.",
  },
  {
    title: "Three calls to action",
    mistake: "Asking the viewer to like, comment, follow, share AND buy — all in one video, usually at the end.",
    explanation: "Every additional action dilutes the one that matters. Faced with five requests, viewers do the easiest one — a like — or none at all, and the purchase the video was built for evaporates.",
    correction: "One video, one action, chosen before filming. If the video's job is sales, every other request waits for another video.",
  },
];

/* ---------- 4. The Creator Makeover Studio ---------- */
export interface Makeover {
  before: string;
  after: string;
  what_changed: string[];
}

export const MAKEOVERS: Makeover[] = [
  {
    before: "This is my new skincare product. I love it.",
    after: "If your skincare routine takes 10 steps, you might want to see what I replaced mine with.",
    what_changed: [
      "Names the viewer's situation — a 10-step routine — instead of the creator's purchase.",
      "Replaces an opinion ('I love it') with a curiosity gap: replaced it with WHAT?",
      "Gives the viewer a personal reason to keep watching: their own routine might get simpler.",
    ],
  },
  {
    before: "This blender is really powerful and it has a lot of settings.",
    after: "This blender just crushed ice quieter than my old one crushed a banana. Watch.",
    what_changed: [
      "A feature claim ('powerful') becomes a testable demonstration the viewer can hear.",
      "The comparison is concrete and slightly funny — a banana is a unit everyone understands.",
      "'Watch' turns the sentence into an event with an outcome, not a description.",
    ],
  },
  {
    before: "These are my new running shoes, they're super comfortable.",
    after: "I ran 10K in shoes I bought as a joke. My feet have opinions now.",
    what_changed: [
      "Comfort is claimed by every shoe ever sold; a 10K is evidence with a number in it.",
      "The joke purchase creates a story — low expectations meeting a real test.",
      "The unresolved verdict ('opinions') keeps the viewer for the result.",
    ],
  },
  {
    before: "This lamp has three brightness levels and a USB charging port.",
    after: "My desk at 9 p.m. used to look like a cave. Then I changed exactly one thing.",
    what_changed: [
      "Leads with the viewer's recognizable scene (the cave of a desk) instead of a spec sheet.",
      "'Exactly one thing' opens a precise curiosity gap — which thing?",
      "The features still appear, but later, as the answer instead of the announcement.",
    ],
  },
  {
    before: "This sauce is delicious, you should definitely try it.",
    after: "I put this on plain rice and my family asked what restaurant it came from.",
    what_changed: [
      "'Delicious' is the creator's opinion; the family's question is a witnessed reaction.",
      "Plain rice is the hardest test a sauce can face — the demo is built into the line.",
      "A real third-party reaction does the persuading no adjective can.",
    ],
  },
  {
    before: "Link in bio! Don't forget to like, subscribe, and go check it out!",
    after: "If your mornings look like mine did, the link shows the exact one I tested. Decide after you see the test.",
    what_changed: [
      "Four competing commands become one action, tied to the viewer's own situation.",
      "'The exact one I tested' connects the link to the proof the viewer just watched.",
      "'Decide after you see the test' respects the viewer's judgment — and respect converts better than pressure.",
    ],
  },
];

/* ---------- 7. The Creator Script Laboratory ---------- */
export interface ScriptBeat {
  beat: string;
  say: string;
  show: string;
  why: string;
}

export interface ScriptStructure {
  name: string;
  promise: string;
  beats: ScriptBeat[];
}

export const SCRIPT_STRUCTURES: ScriptStructure[] = [
  {
    name: "The Curiosity Script",
    promise: "One open question carries the whole video — the answer is the payoff.",
    beats: [
      { beat: "Open the gap", say: "There's one thing about this nobody tells you.", show: "The product, with the telling detail hidden or turned away.", why: "Names a gap the viewer cannot close without watching." },
      { beat: "Deepen the question", say: "And it's the reason most people use it wrong.", show: "The common mistake, demonstrated briefly.", why: "Raises the stakes — the gap now affects the viewer personally." },
      { beat: "Reveal in stages", say: "First, look at what happens here…", show: "The detail, revealed step by step, never all at once.", why: "Staged reveals renew attention at every step." },
      { beat: "Close the loop", say: "So that's the thing — and here's my honest verdict.", show: "The full picture, plus who it suits and who it doesn't.", why: "A loop closed completely is what makes the next video's hook believable." },
    ],
  },
  {
    name: "The Problem-Solution Script",
    promise: "A recognized problem, honestly costed, then solved on camera.",
    beats: [
      { beat: "Name the problem", say: "If this keeps happening to you, it's not your fault — it's this.", show: "The problem happening, at its most recognizable.", why: "Recognition in second one is the strongest relevance signal there is." },
      { beat: "Show the cost", say: "Here's what it costs you every week — time, money, mornings like this.", show: "The consequences, concretely: the mess, the delay, the workaround.", why: "A problem with a visible cost creates honest urgency without inventing any." },
      { beat: "Demonstrate the solution", say: "Watch what changes when I use this instead.", show: "The product solving the exact problem shown, uncut at the key moment.", why: "The demonstration answers the problem in the same terms the problem was shown." },
      { beat: "The result, honestly", say: "That's the difference. Here's who it's for — and who should skip it.", show: "The after state, beside the before.", why: "Naming who should skip it makes the recommendation trustworthy for everyone else." },
    ],
  },
  {
    name: "The Unexpected Discovery Script",
    promise: "The creator's own wrong expectation is the story — the discovery is the product's proof.",
    beats: [
      { beat: "My wrong expectation", say: "I bought this expecting it to be a gimmick.", show: "The product arriving; your skepticism on your face.", why: "A doubting creator is the most credible salesperson on the platform." },
      { beat: "The moment it changed", say: "Then this happened — watch my actual first reaction.", show: "The real first-use moment, unscripted.", why: "Genuine surprise cannot be faked convincingly, and viewers know it." },
      { beat: "What I found", say: "Here's what it actually does that I didn't expect.", show: "The discovery demonstrated, close up.", why: "The discovery is now evidence, not a claim." },
      { beat: "What it means for you", say: "If you're where I was, here's what I'd check first.", show: "The viewer's likely situation, and the check to run.", why: "Turns one creator's surprise into the viewer's own decision tool." },
    ],
  },
  {
    name: "The Product Comparison Script",
    promise: "Two real options, one fair test, an honest verdict — including when yours loses.",
    beats: [
      { beat: "The two contenders", say: "The famous one versus this one. Same job, honest test.", show: "Both products side by side from the first frame.", why: "Comparison gives viewers something to judge — judgment is attention." },
      { beat: "The fair test", say: "Same conditions, same amount, no edits at the moment that matters.", show: "The test run identically on both.", why: "Fairness stated and shown is what separates a comparison from an ambush." },
      { beat: "Where each one wins", say: "This one wins on this. The other wins on that. No pretending otherwise.", show: "Each product's genuine strength, demonstrated.", why: "Conceding real points to the rival makes your verdict believable." },
      { beat: "The honest verdict", say: "For most people in this situation, I'd pick this one — here's why.", show: "The winner in use, in the viewer's likely situation.", why: "A verdict tied to a situation respects viewers whose situation differs." },
    ],
  },
  {
    name: "The Storytelling Sales Script",
    promise: "A real before, a real struggle, a turning point — the product enters as part of a life, not a pitch.",
    beats: [
      { beat: "Where I started", say: "Three months ago, my mornings looked like this.", show: "The before state, honestly unflattering.", why: "A true starting point lets the viewer locate themselves in the story." },
      { beat: "The struggle", say: "I tried the obvious fixes. Here's what each one cost me.", show: "The failed attempts, briefly and specifically.", why: "Struggle is what makes the turning point earned instead of advertised." },
      { beat: "The turning point", say: "Then someone showed me this — and I tested it like a skeptic.", show: "The product entering the routine, tested on camera.", why: "The product inherits the story's credibility because it had to survive it." },
      { beat: "Life after, with limits", say: "Now it looks like this. It's not magic — here's what it doesn't fix.", show: "The after state, plus the honest remaining limitation.", why: "Limits keep the story in the real world, where purchasing decisions live." },
    ],
  },
  {
    name: "The Demonstration Script",
    promise: "Almost no selling at all — the product's work, witnessed, is the entire argument.",
    beats: [
      { beat: "The claim", say: "They say it can do this. Let's see — no edits.", show: "The job set up, conditions stated clearly.", why: "A claim stated before the test gives the viewer something to verify." },
      { beat: "The live test", say: "(Mostly silence, or honest narration of what's happening.)", show: "The full test, uncut, at real speed where it matters.", why: "Uncut footage is the one proof format viewers cannot discount." },
      { beat: "The close look", say: "Look at this part — this is where you'd see it fail.", show: "The stress point, the seam, the finish — close up.", why: "Inviting inspection at the weakest point is maximum-confidence selling." },
      { beat: "The verdict", say: "It did the job. Here's the one thing I'd change about it.", show: "The result, and the honest imperfection.", why: "A verdict with one flaw reads as a review; a flawless verdict reads as an ad." },
    ],
  },
  {
    name: "The Objection-Breaking Script",
    promise: "The viewer's biggest doubt, said out loud by the creator — then tested, not argued.",
    beats: [
      { beat: "Name the objection", say: "You're probably thinking: it's too expensive / it won't last / it won't work for me.", show: "Face to camera, the product in hand, no dodging.", why: "An objection the creator voices loses its power as a reason to leave." },
      { beat: "Agree with the fair part", say: "Honestly? That concern makes sense — here's the part that's true.", show: "The legitimate weakness, shown plainly.", why: "Agreement disarms. Arguing with the viewer's doubt never does." },
      { beat: "Test it on camera", say: "So let's actually test it instead of debating it.", show: "The objection put to a real, visible test.", why: "Evidence ends arguments that rhetoric can't." },
      { beat: "The honest answer", say: "Here's where I land — and here's who should still walk away.", show: "The verdict, with the walk-away case stated fairly.", why: "Permission to walk away is what makes staying meaningful." },
    ],
  },
  {
    name: "The Testimonial Script",
    promise: "One real user's experience, told with specifics — including the parts that weren't perfect.",
    beats: [
      { beat: "My situation before", say: "Before this, my situation was exactly this — and it cost me this.", show: "Your real before: the space, the routine, the problem.", why: "Specifics are what separate a testimony from a slogan." },
      { beat: "Why I chose it", say: "I picked this one because of one specific reason.", show: "The deciding feature or moment.", why: "A single honest reason is more persuasive than ten generic ones." },
      { beat: "What actually happened", say: "Week one was this. By week four, this. And this part never got better.", show: "The timeline, with evidence at each stage.", why: "A timeline with a flaw in it is the most believable structure in selling." },
      { beat: "Who I'd tell", say: "I'd recommend it to people in my exact situation. Not to these people — here's why.", show: "The product in your real routine, one last time.", why: "Boundaries turn a testimonial into advice, and advice is what viewers act on." },
    ],
  },
];

/* ---------- 3. The Viral Video Autopsy — self-autopsy worksheet ---------- */
export interface AutopsyStage {
  stage: string;
  focus: string;
  what_to_look_for: string[];
  questions: string[];
}

export const AUTOPSY_STAGES: AutopsyStage[] = [
  {
    stage: "First 3 seconds",
    focus: "Why people stopped scrolling — or didn't.",
    what_to_look_for: [
      "The product or the problem is visible in the first frame.",
      "A spoken promise is made — not a greeting, logo or warm-up.",
      "Something moves or changes on screen immediately.",
    ],
    questions: [
      "Could a stranger say what this video is about by second three?",
      "What exactly gave the right viewer a reason to stop?",
      "Is any part of the opening spent on me instead of the viewer?",
    ],
  },
  {
    stage: "Seconds 3–7",
    focus: "How curiosity was maintained after the stop.",
    what_to_look_for: [
      "The opening loop gets deeper, not merely repeated.",
      "The first piece of proof or demonstration appears.",
      "No self-introduction or backstory detour steals the momentum.",
    ],
    questions: [
      "What new information arrives between seconds 3 and 7?",
      "Does the video start proving, or start explaining itself?",
      "Where exactly would a half-interested viewer leave?",
    ],
  },
  {
    stage: "Middle",
    focus: "How the creator held attention through the body of the video.",
    what_to_look_for: [
      "A pattern change every few seconds: angle, zoom, text, action.",
      "New information keeps arriving — no beat merely restates the last.",
      "The key demonstration moment plays uncut.",
    ],
    questions: [
      "What changes on screen at least every five seconds?",
      "Which middle beat could be deleted without losing anything?",
      "Is the most interesting moment placed where viewers actually reach it?",
    ],
  },
  {
    stage: "Product reveal",
    focus: "How the product entered the story.",
    what_to_look_for: [
      "The product arrives as the answer to a question the video already built.",
      "It is shown working, not just held up and described.",
      "One honest limitation or condition is stated near the reveal.",
    ],
    questions: [
      "Did the video earn the reveal before it happened?",
      "Does the viewer see it work, or only hear that it works?",
      "What would a skeptic say at this exact moment — and does the video answer it?",
    ],
  },
  {
    stage: "Ending",
    focus: "How viewers were encouraged to act.",
    what_to_look_for: [
      "The payoff promised in the opening is fully delivered.",
      "Exactly one clear action is asked for.",
      "The ask lands at the moment belief is highest, not after it fades.",
    ],
    questions: [
      "Did the ending pay the opening's promise in full?",
      "Is there one action — or several competing ones?",
      "What does the viewer know now that they didn't at second one?",
    ],
  },
];

export const AUTOPSY_COMPLETE = "Autopsy complete — now apply one fix and re-film";

/* ---------- 10. The 30-Second Challenge ---------- */
export interface Challenge {
  title: string;
  skill: string;
  instructions: string;
}

export const CHALLENGES: Challenge[] = [
  {
    title: "The One-Second Product",
    skill: "Visual hooks",
    instructions: "Film a 30-second video where the product is in the frame within the first second — already in use, no unboxing, no introduction. Say nothing for the first second. Let the picture make the promise.",
  },
  {
    title: "No Hello Allowed",
    skill: "Hook discipline",
    instructions: "Your video may not contain 'hey', 'welcome', your name, or your channel. Open with the viewer's problem or the product's most interesting moment. Notice how much time you just bought back.",
  },
  {
    title: "Say It In Seven Words",
    skill: "Compression",
    instructions: "Write your opening line, then cut it to seven words or fewer without losing the promise. Film both versions back to back and feel which one you'd stop for.",
  },
  {
    title: "The Skeptic's Opening",
    skill: "Trust",
    instructions: "Open by stating your honest doubt about the product before you tested it. Then test it. A creator who doubted first is the most believable salesperson on the platform.",
  },
  {
    title: "Show, Don't Describe",
    skill: "Demonstration",
    instructions: "Make a video where you never say the product is good, strong, easy or amazing. You may only show it working. If a claim creeps in, refilm that beat with the camera doing the talking.",
  },
  {
    title: "One Objection, Answered",
    skill: "Objection handling",
    instructions: "Pick the single biggest reason someone wouldn't buy. Say it out loud, agree with the fair part, then test it on camera. Thirty seconds, one objection, honestly settled.",
  },
  {
    title: "The Honest Limitation",
    skill: "Trust",
    instructions: "Feature one real limitation of the product, prominently — not buried, not joked away. Watch what it does to the credibility of everything else you say.",
  },
  {
    title: "Before, Interrupted",
    skill: "Pattern interrupts",
    instructions: "Open mid-action: mid-pour, mid-bite, mid-failure, mid-sentence. No setup, no context for the first two seconds. Then explain. Feel how the break earns attention your introductions never did.",
  },
  {
    title: "The Comparison Frame",
    skill: "Comparison",
    instructions: "Put two options side by side in the very first frame and let the viewer judge before you speak. Then run one fair test. Concede at least one real point to the option you don't pick.",
  },
  {
    title: "Payoff By Second Ten",
    skill: "Pacing",
    instructions: "Whatever your opening promises, deliver the first real piece of it by second ten — not the whole payoff, but undeniable progress toward it. Cut every beat that delays it.",
  },
  {
    title: "One CTA Only",
    skill: "Conversion focus",
    instructions: "Choose the video's single job before filming: one action, asked once, at the moment belief peaks. Likes, follows and shares wait for another video. Compare the result to your usual ending.",
  },
  {
    title: "The Stranger Test",
    skill: "Clarity",
    instructions: "Show your first three seconds to someone who knows nothing about the product — or imagine them ruthlessly. They must be able to say who it's for and what's at stake. If they can't, the opening isn't finished.",
  },
  {
    title: "Imagine Owning It",
    skill: "Sales psychology",
    instructions: "Sell nothing about the product itself. Spend 30 seconds walking the viewer through their own moment with it — their kitchen, their bag, their 6 a.m. — describing what becomes easier, better or more enjoyable.",
  },
  {
    title: "Steal The Structure",
    skill: "Analysis",
    instructions: "Take a video you admire and map its five autopsy stages on paper. Then film your own product through the same skeleton with completely different words. Structure is transferable; copying is not.",
  },
];
