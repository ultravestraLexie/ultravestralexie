/* ULTRAVESTRA — BEFORE-AND-AFTER CONTENT EXAMPLES — structured data.
 * The paired-examples library: the same piece of content, written the
 * weak way and the strong way, side by side, with the principle named
 * under each pair. Examples teach the eye — a creator who has SEEN the
 * difference twenty-seven times starts to hear it in their own scripts.
 *
 * Built on UltraVestra's own systems: the weak/strong work in the
 * Secret Weapon (lib/weapon.ts), Say It Better (lib/psychology.ts),
 * the First 3 Seconds beats and opening styles (lib/first3.ts), the
 * 10 Psychological Triggers (lib/triggers.ts), and the Art of Human
 * Connection for LIVE. A handful of pairs extend the Secret Weapon's
 * originals; the rest are new.
 *
 * HONESTY RULE: the "after" is a stronger CONSTRUCTION, never a
 * claimed outcome. No pair invents statistics, sales, or results.
 * Where an after-version mentions time, counts, or comparisons, it is
 * describing footage or copy the creator can truthfully produce —
 * proof is something you film, not something you claim. */

export interface BeforeAfterPair {
  category: string;
  before: string;
  after: string;
  principle: string;
  try_it: string;
}

export const CATEGORIES: string[] = [
  "Hooks",
  "First Frames",
  "Demonstrations",
  "Proof",
  "CTAs",
  "Captions",
  "Titles",
  "Brand Pitches",
  "LIVE Openers",
];

export const PAIRS: BeforeAfterPair[] = [
  /* ================= HOOKS ================= */
  {
    category: "Hooks",
    before: "“Hey guys, so today I wanted to talk about this new serum I got.”",
    after:
      "“I stopped using three products the week this serum showed up. Here's the one thing it does that they didn't.”",
    principle:
      "The greeting spends the most valuable seconds on the creator. The stronger line spends them on the viewer's curiosity: a countable change (three products) and one withheld detail (the one thing). Specificity opens the loop; the video closes it.",
    try_it:
      "Take your last hook and rewrite it so the first line names what changed — not what you're about to show.",
  },
  {
    category: "Hooks",
    before: "“This is a vegetable chopper. It has five blades and it's really easy to use.”",
    after: "“Onion. Ten seconds. No tears. Watch.”",
    principle:
      "A feature list describes the product; the stronger line promises a demonstration. It interrupts with the finished result, names the benefit the viewer actually wants (no tears), and issues a one-word invitation to see proof.",
    try_it:
      "If your hook lists a feature, flip it: state the result first, in the fewest words you can, and let the demo carry the features.",
  },
  {
    category: "Hooks",
    before: "“If you're looking for a good workout, you should check out these resistance bands.”",
    after: "“No gym. No weights. One door. This is my entire leg day now.”",
    principle:
      "“A good workout” could be for anyone, so it stops no one. The stronger line names the viewer's actual constraint — no gym, no equipment — so the right person hears themselves in the first second. Self-identification is the trigger.",
    try_it:
      "Write the constraint your viewer lives with (no gym, small kitchen, ten minutes, sensitive skin) and open with it.",
  },

  /* ================= FIRST FRAMES ================= */
  {
    category: "First Frames",
    before:
      "The video opens on the creator sitting on the couch, adjusting the camera, saying “okay, so…” while the pet-hair roller sits beside them.",
    after:
      "The video opens mid-action: the roller already pulling a clean stripe of dog hair off a black cushion in a single pass, before anyone says a word.",
    principle:
      "The first frame is the recognition moment — it has one job: give the right viewer a reason to give you the next second. Camera-adjusting is dead air. A demonstration already in progress is a visual interruption the viewer wants explained.",
    try_it:
      "Scrub your last video to frame one. If the product isn't already doing something, re-film the opening starting mid-action.",
  },
  {
    category: "First Frames",
    before:
      "The video opens on a slow zoom across a flat-lay of six skincare products while music plays and a title fades in.",
    after:
      "The video opens on an extreme close-up: a fingertip pressing into the cream, the texture stretching as it lifts away.",
    principle:
      "An establishing shot asks for patience the viewer hasn't agreed to give. A sensory close-up — texture, sound, movement — is one of the strongest opening styles there is: it makes the viewer feel something before they have to think anything.",
    try_it:
      "Find the most sensory moment in your product — the texture, the click, the sizzle — and move it to frame one.",
  },
  {
    category: "First Frames",
    before:
      "The video opens with the charger's box on a table. The creator slowly unboxes it while introducing themselves.",
    after:
      "The video opens on a phone screen showing 2% battery on a moving train. A hand reaches in and clicks the charger on.",
    principle:
      "Show the problem before the product. The viewer recognizes their own situation in the first frame — problem recognition — and the product arrives as the answer to a scene they're already inside, not as an object they're being sold.",
    try_it:
      "Film the moment of need first — the dead battery, the messy counter, the tangled drawer — then let the product enter that scene.",
  },

  /* ================= DEMONSTRATIONS ================= */
  {
    category: "Demonstrations",
    before:
      "The creator holds the knife up to the camera and describes its handle, weight, and steel for twenty seconds before cutting anything.",
    after:
      "The first shot is the knife gliding through a tomato in one smooth pass. Then: “That's why the blade shape matters — look at the edge.”",
    principle:
      "Demonstrate, then explain. The advertising framework puts demonstration before explanation for a reason: once the viewer has SEEN the thing work, every feature you name lands as evidence. Before it, features are just claims.",
    try_it:
      "In your next demo, move the single most impressive action to the front. Explain after the viewer has seen it.",
  },
  {
    category: "Demonstrations",
    before:
      "The creator rubs the cleanser on dry hands at the sink and says it “removes makeup really well.”",
    after:
      "The creator draws a line of waterproof eyeliner on her forearm, then removes one half of it on camera in a single pass — leaving the other half untouched, side by side.",
    principle:
      "Visual proof needs a visible test. “Really well” is an adjective; a half-cleaned line is evidence the viewer's own eyes can judge. Comparison inside the same frame is the most honest demonstration format there is.",
    try_it:
      "Give your next demonstration a built-in comparison: half and half, before and after in the same shot, old way beside new way.",
  },
  {
    category: "Demonstrations",
    before:
      "The creator vacuums an already-clean floor in a wide shot, narrating that the suction is “super powerful.”",
    after:
      "The creator pours a line of cereal and coffee grounds across the floor first, then vacuums it in one close-up pass.",
    principle:
      "A demonstration without a real test proves nothing — the viewer knows the floor was clean. Create an honest, visible challenge and let the product pass or fail in front of them. A test the product could fail is the only kind viewers believe.",
    try_it:
      "Before filming, ask: what could I put in front of this product that would make this demo a real test? Then film that.",
  },

  /* ================= PROOF ================= */
  {
    category: "Proof",
    before: "“This serum completely changed my skin, you guys. It's literally magic.”",
    after:
      "“Same mirror, same light, fourteen days apart. Left is day one, right is this morning. The spot on my cheek is lighter. Not gone — lighter.”",
    principle:
      "Proof over promises. The stronger version is dated, shot under the same conditions, and — this is the part that makes it believable — it admits a limit. A creator who tells you what a product didn't do has earned the right to be believed about what it did.",
    try_it:
      "Re-film one claim as a comparison: same place, same light, a real time gap, and one honest “not this” in the sentence.",
  },
  {
    category: "Proof",
    before: "“The noise cancelling on these earbuds is insane. Best ever, honestly.”",
    after:
      "The creator plays the same ten seconds twice: a mic beside a running blender with cancelling off, then on — and says nothing over either clip.",
    principle:
      "Let the viewer judge with their own senses instead of asking them to trust an adjective. “Insane” and “best ever” are conclusions the viewer didn't reach; a difference they can hear themselves is a conclusion they own.",
    try_it:
      "Find the claim in your video that rests on an adjective — insane, amazing, powerful — and replace the word with a way to show it.",
  },
  {
    category: "Proof",
    before: "“My dog is obsessed with this bed, he loves it so much, trust me.”",
    after:
      "The creator puts the new bed beside the old one, steps out of frame, and films which one the dog chooses — three evenings in a row, all three clips shown.",
    principle:
      "Behavior is evidence; a claim repeated is not. The stronger version doesn't ask for trust — it removes the creator from the frame and lets the subject's own choices make the case, more than once.",
    try_it:
      "Ask who or what can demonstrate your claim better than you can say it — the dog, the timer, the scale, the second wear. Then film that.",
  },

  /* ================= CTAs ================= */
  {
    category: "CTAs",
    before: "“Link in bio if you want it! Bye!”",
    after:
      "“If you run warm at events like I do, check the fabric details on the product page before you order — it lists the exact blend. The link is right there.”",
    principle:
      "A clear call to action names who it's for and what to do next. The stronger version also handles the objection (will I overheat in this?) by sending the viewer to verify a specific detail — an invitation to check, not a command to buy.",
    try_it:
      "Rewrite your CTA as: who it's for + one specific thing to check on the product page + where the link is.",
  },
  {
    category: "CTAs",
    before: "“Buy now before it sells out, seriously, hurry!”",
    after:
      "“Mine is the 6-quart size in the link — measure your air fryer basket first, because the 4-quart version won't fit it. If yours measures 6, this is the one I use.”",
    principle:
      "Fake urgency is on the never list; useful specificity does the same job honestly. Helping a viewer avoid the WRONG purchase is what earns trust — and trust, not pressure, is what makes the right purchase happen.",
    try_it:
      "Replace one urgency line with one measurement, size, or compatibility check that protects the viewer from a wrong order.",
  },
  {
    category: "CTAs",
    before: "“You NEED this. Link below.”",
    after:
      "“If your skin is dry and sensitive like mine, start with the smaller size — it's in the link, and the page lists every ingredient so you can check yours first.”",
    principle:
      "The Invite stage of the framework: make the next step clear AND safe to take. “Start small, check the ingredients” lowers the risk of saying yes — and makes it equally safe to say no, which is exactly why people trust the yes.",
    try_it:
      "Add a safety step to your CTA: the smaller size, the ingredient list, the size chart — one way the viewer can verify before they commit.",
  },

  /* ================= CAPTIONS ================= */
  {
    category: "Captions",
    before: "“New video 😍 love this product so much!! #skincare #beauty #fyp”",
    after:
      "“Day 14 with this serum: the dark spot is lighter, not gone. Full routine is in the comments. What should I test next — the texture, or how it layers under makeup?”",
    principle:
      "A caption can carry proof and start a conversation; hashtags do neither. The stronger caption adds evidence (day 14, honest limit), delivers value (the routine), and ends with a question the viewer can actually answer — a conversation trigger.",
    try_it:
      "Rewrite your last caption with three parts: one piece of evidence, one piece of value, one answerable question.",
  },
  {
    category: "Captions",
    before: "“Yummy dinner ideas 🍳✨ #cooking #dinner”",
    after:
      "“One pan, 12 minutes, and the sauce is three ingredients I already had. The step everyone asks about — how the eggs stay soft — is at 0:09.”",
    principle:
      "Specificity makes a caption worth reading, and pointing back into the video (“at 0:09”) gives viewers a reason to rewatch and comment. The weak caption describes the creator's feelings; the strong one serves the viewer's next action.",
    try_it:
      "Put one number, one time stamp, and one “the part everyone asks about” into your next caption.",
  },
  {
    category: "Captions",
    before: "“OOTD 💅 #fashion #style #outfit”",
    after:
      "“Same dress, two ways: with the belt it reads formal, without it, it's a Sunday dress. Which one would you actually wear? Be honest.”",
    principle:
      "Self-identification: the viewer can't place themselves in “OOTD,” but they can instantly place themselves in a choice. A question about the viewer's own life gets answered; a label about the creator's outfit gets scrolled past.",
    try_it:
      "Turn your next caption into a choice between two real options from the video, and ask which one the viewer would pick.",
  },

  /* ================= TITLES ================= */
  {
    category: "Titles",
    before: "“My Review of the X200 Wireless Earbuds (Honest Review!!)”",
    after: "“I Wore These Earbuds on a Construction Site for a Week”",
    principle:
      "The weak title is a label — it announces a category the viewer has seen a hundred times. The stronger title is a test with stakes: a hard environment, a real duration, and an unanswered question (did they survive?) that only the video can close.",
    try_it:
      "Rewrite your title as the hardest honest test your product actually went through: where, how long, against what.",
  },
  {
    category: "Titles",
    before: "“Full Body Workout Routine for Beginners at Home”",
    after: "“The 10-Minute Routine I Actually Did 5 Days in a Row”",
    principle:
      "Generic promises are easy to make and easy to ignore. The stronger title claims something smaller and more believable — consistency. “Actually did” speaks to the viewer's real problem, which was never finding a routine; it's sticking to one.",
    try_it:
      "Shrink your title's claim until it's something you can prove on camera — then notice how much stronger it sounds.",
  },
  {
    category: "Titles",
    before: "“Best Dog Toy Ever?? You Won't Believe This”",
    after: "“My Dog Ignores Every Toy. This One He Carries to Bed.”",
    principle:
      "“You won't believe this” is on the avoid list when nothing surprising follows — and here nothing is even specified. The stronger title states a specific, checkable behavior, and the contrast (ignores every toy / carries this one to bed) creates the curiosity honestly.",
    try_it:
      "Delete every “you won't believe” from your titles and replace it with the specific observed behavior the video shows.",
  },

  /* ================= BRAND PITCHES ================= */
  {
    category: "Brand Pitches",
    before:
      "“Hi! I love your brand so much. I have 12k followers and I'd love to collab — let me know if you're interested!”",
    after:
      "“Hi — I make 20-second routine videos for women over 40, and the comments on my last three are full of viewers asking which moisturizer I used. I'd open with your cream's texture in the first second, like this 15-second sample I filmed with a similar product: [link]. My rate card for one video plus usage is attached.”",
    principle:
      "Brands don't buy followers; they buy the right viewers and a creator who understands them. The stronger pitch leads with audience fit, shows evidence of buying intent, and arrives with a demonstration idea already formed — it sells the outcome, not the creator.",
    try_it:
      "Rewrite your pitch opening: replace your follower count with who your viewers are and one thing they already ask you to buy.",
  },
  {
    category: "Brand Pitches",
    before:
      "Brand offers $150 against a $300 rate. Reply: “Okay, I can do $150.”",
    after:
      "“For $150 I can do one video with 30 days of usage. The $300 package adds a second hook version — so you can test which opening performs better — plus 90 days of usage. Which one serves the campaign better?”",
    principle:
      "Never drop the price for the same package — change the package. The stronger reply protects the rate, gives the brand a real choice, and frames the higher tier around THEIR benefit: a second hook is a testing asset, not a favor. This is how creators negotiate better commissions without bluffing.",
    try_it:
      "Before your next negotiation, write your two packages: what the lower price removes, and what the full price adds that helps the brand sell.",
  },
  {
    category: "Brand Pitches",
    before: "“Hi, just following up! Let me know if you're interested 🙂”",
    after:
      "“Following up with one new thing: since my last message I posted a routine video in your category, and it's the one other brands keep saving. I can send the format breakdown — or just film the sample for your product this week, same format.”",
    principle:
      "A follow-up that only repeats the ask gives the brand nothing new to say yes to. The stronger follow-up adds fresh evidence and ends with a small, concrete next step — new information is the only polite reason to be back in someone's inbox.",
    try_it:
      "Never send a bare follow-up. Attach one new thing: a recent result, a new sample, a format idea specific to their product.",
  },

  /* ================= LIVE OPENERS ================= */
  {
    category: "LIVE Openers",
    before:
      "“Hey everyone, welcome in! Let me know where you're watching from — we'll get started in a few minutes once more people join…”",
    after:
      "Holding two foundations up to the camera: “In the next ten minutes I'm swatching these two on the same hand — one costs half the price of the other. Stay for the close-up at the end; that's where the difference actually shows.”",
    principle:
      "Don't just go LIVE — become the reason people stay. Waiting for a crowd that isn't there punishes the people who ARE. The stronger opener starts the event immediately and plants a payoff at the end, so every new arrival lands inside something already happening.",
    try_it:
      "Script your first LIVE sentence as an event with a finish line: what will happen, and what the viewer gets by staying to the end.",
  },
  {
    category: "LIVE Openers",
    before: "“Hi guys, today we're going to cook something. Let me just set up my kitchen first…”",
    after:
      "The pan is already sizzling as the LIVE starts: “Hear that? That's tonight's entire dinner in one pan. Tell me in the comments what you always burn — I'll show you the heat mistake that causes it.”",
    principle:
      "A LIVE opening obeys the same first-second law as a video: interrupt, connect, give a reason to stay. Sound and motion interrupt; a question aimed at the viewer's own kitchen connects; a named mistake they'll learn creates the reason.",
    try_it:
      "Start your next LIVE mid-action — something already cooking, swatching, or unboxing — and ask a question about the viewer's version of the problem.",
  },
  {
    category: "LIVE Openers",
    before: "“Welcome to my live, everyone. Today I'll be trying on some clothes for you.”",
    after:
      "“Three dresses — all three together cost less than one I returned last month. I'm starting with the one I expected to hate. Watch the fit at the waist; that's the whole story with this one.”",
    principle:
      "Pattern interruption (starting with the expected failure) plus a viewing job (“watch the waist”) turns passive viewers into witnesses. People stay for a verdict they helped watch for — and a specific thing to watch for is a promise the LIVE then gets to keep.",
    try_it:
      "Give your LIVE audience one specific thing to watch for in the first minute — a fit point, a sound, a before-and-after — and name it out loud.",
  },
];

export const INTRO_LINE =
  "Don't just read the difference. See it. Every pair below is the same content, written two ways — and the principle under each pair is the part that transfers to your videos.";

export const CLOSING_LINE =
  "Now look at your own last video the same way — one pair at a time, weakest first.";
