/* THE IDEA ENGINE — creative directions, no AI required.
 * Adapted from the owner's kit into the Human Emotion Video Lab:
 * it turns one subject into distinct creative directions (classic /
 * unexpected / experimental), each with emotions, an angle, hooks, a
 * first visual and a full scene-by-scene production sheet, plus
 * visual and audio direction. Self-contained — it invents nothing
 * about the subject; it arranges proven creative structures around
 * the creator's own words.
 * Everything here is a creative hypothesis, never a prediction of
 * real audience behavior. */

export type Mode = "classic" | "unexpected" | "experimental";

export interface Scene {
  label: string;
  seconds: number;
  show: string;
  say: string;
  camera: string;
  sound: string;
  text: string;
}

export interface Direction {
  id: string;
  name: string;
  emotions: [string, string];
  angle: string;
  why: string;
  originality: string;
  difficulty: "Easy" | "Medium" | "Ambitious";
  audience: string;
  hooks: string[];
  firstVisual: string;
  scenes: Scene[];
  visualDirection: string[];
  audioDirection: string[];
  share: string;
  followUp: string;
  experimental?: boolean;
}

// ---------------------------------------------------------------------------
// Subject handling
// ---------------------------------------------------------------------------
export function cleanSubject(input: string): string {
  let s = input.trim().replace(/[.!?]+$/, "");
  s = s.replace(/^(i\s+(want|would like|wanna|need)\s+to\s+(make|create|film|do)\s+)?(a\s+)?(video|reel|short|tiktok)s?\s+(about|on|for|of)\s+/i, "");
  s = s.replace(/^(about|on)\s+/i, "");
  s = s.replace(/^(a|an|the)\s+/i, "");
  return s.trim() || "your idea";
}

function the(s: string): string {
  if (/^(the|a|an|my|your|our|this)\s/i.test(s)) return s.replace(/^(a|an|my|your|our|this)\s/i, "the ");
  return `the ${s}`;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const FOOD = /\b(food|snack|recipe|coffee|tea|drink|chocolate|candy|sauce|bread|cake|cookie|meal|dinner|lunch|breakfast|pasta|pizza|chips|gum|protein|juice|soda|spice|kitchen|cook|bake)\b/i;

// ---------------------------------------------------------------------------
// Direction templates
// ---------------------------------------------------------------------------
type Tpl = (S: string, T: string, A: string) => Omit<Direction, "id">;

const CLASSIC: Record<string, Tpl> = {
  "curiosity-test": (S, T, A) => ({
    name: "The All-Day Question", emotions: ["Curiosity", "Trust"],
    angle: `Ask one specific question about ${T} that ${A} genuinely wonder about — then answer it with a real test across a normal day.`,
    why: "An open question feels unfinished, so people stay for the answer. A fair test also builds trust.",
    originality: "Turns a feature list into a single question with a real answer.", difficulty: "Easy", audience: A,
    hooks: [`Can ${T} actually do what everyone says? I tested it all day.`, "I had one question — and the answer surprised me.", `Would you guess how ${T} held up by tonight?`, "Here's what happened when I tried it for the first time.", "Let's see if the result matches the promise."],
    firstVisual: `A close-up of ${T} with a timer or clock in frame.`,
    scenes: [
      { label: "The question", seconds: 3, show: `${cap(T)} next to a clock, close up.`, say: `"Can ${T} really do this? Let's find out."`, camera: "Close-up, eye level", sound: "Natural room sound", text: "Does it actually work?" },
      { label: "The setup", seconds: 5, show: "How you'll test it — fair and simple.", say: "Explain the test in one sentence.", camera: "Top-down or medium shot", sound: "Voice only", text: "The test" },
      { label: "Check-ins", seconds: 10, show: "Quick check-ins through the day.", say: "One short observation each time.", camera: "Same angle every check-in", sound: "A soft tick or natural sound at each cut", text: "Morning · Afternoon · Night" },
      { label: "The reveal", seconds: 5, show: "The final result, clearly.", say: "Say exactly what happened.", camera: "Close-up, steady", sound: "A pause before the reveal", text: "The result" },
      { label: "Honest verdict", seconds: 5, show: "You at eye level.", say: "Who it's for, and one real limitation.", camera: "Medium, eye level", sound: "Voice only", text: "Worth it if…" },
    ],
    visualDirection: ["Begin with a close-up", "Keep the same framing for each check-in", "Reveal the result in one clear shot"],
    audioDirection: ["Natural sounds", "Controlled pauses before the reveal", "No loud music over the answer"],
    share: "The result — people send it to a friend who's been wondering the same thing.",
    followUp: "Run the same test against a cheaper or pricier alternative.",
  }),
  "humor-coworker": (S, T, A) => ({
    name: "The Most Demanding Coworker", emotions: ["Humor", "Belonging"],
    angle: `Treat ${T} as a character in your day — a demanding coworker, a needy roommate or a loyal sidekick — in a short, relatable comedy.`,
    why: "Viewers laugh at situations they recognize, and giving an object a personality makes an ordinary video memorable.",
    originality: "The object becomes a character instead of a product on a table.", difficulty: "Medium", audience: A,
    hooks: [`${cap(T)} has become my most demanding coworker.`, `Me and ${T}: a relationship in five stages.`, "Things I thought would be easy until I actually tried them.", "Be honest — have you ever done this?", "I have a confession about this purchase."],
    firstVisual: `${cap(T)} placed like it's sitting at a desk or waiting for you, with you giving it a look.`,
    scenes: [
      { label: "Meet the character", seconds: 3, show: `${cap(T)} 'waiting' for you.`, say: `"This is ${T}. It has opinions."`, camera: "Medium, slightly low angle", sound: "Natural room sound", text: "My coworker:" },
      { label: "Escalation 1", seconds: 5, show: "A small, relatable moment.", say: "A quick line or just a reaction.", camera: "Reaction close-up", sound: "Comedic pause", text: "9:00 am" },
      { label: "Escalation 2", seconds: 5, show: "The moment gets bigger.", say: "Short line, perfect timing.", camera: "Quick cut, new angle", sound: "Natural sound", text: "12:00 pm" },
      { label: "The twist", seconds: 5, show: `${cap(T)} actually saving the day.`, say: "The funny-but-true payoff.", camera: "Close-up of the real use", sound: "A small satisfying sound", text: "Okay… fine." },
      { label: "The relatable ending", seconds: 4, show: "You and it, 'at peace'.", say: '"Who else has a relationship like this?"', camera: "Medium", sound: "Light music, low", text: "Tag your coworker" },
    ],
    visualDirection: ["Genuine facial expressions", "Cut right after each funny beat", "Bright, comfortable light"],
    audioDirection: ["Natural laughter or reactions", "Comedic pauses", "Music that fits the mood, kept quiet"],
    share: "The most relatable moment — people tag the friend who does exactly this.",
    followUp: "Episode 2: the coworker gets a rival (a competing product or an old version).",
  }),
  "satisfaction-sequence": (S, T, A) => ({
    name: "The Perfect Sequence", emotions: ["Satisfaction", "Desire"],
    angle: `Film ${T} in one smooth, visually satisfying sequence — unpacking, filling, cleaning, arranging, finishing — with almost no talking.`,
    why: "Progress toward a complete result is rewarding to watch, and people often rewatch satisfying sequences.",
    originality: "Replaces explanation with rhythm, texture and a clean finish.", difficulty: "Medium", audience: A,
    hooks: ["Wait until you see the finished result.", "This is for anyone who loves a satisfying transformation.", "No talking. Just this.", "This is one of those little things that makes a big difference.", "Watch it come together."],
    firstVisual: `The messy or unfinished starting point, with ${T} entering the frame.`,
    scenes: [
      { label: "The start", seconds: 3, show: "The unfinished, messy or empty starting point.", say: "No words — let it breathe.", camera: "Top-down, locked off", sound: "Natural textures", text: "Before" },
      { label: "Step rhythm", seconds: 8, show: `Each step with ${T}, one smooth movement at a time.`, say: "No words.", camera: "Consistent framing, close-ups", sound: "Every sound recorded close", text: "" },
      { label: "The detail", seconds: 4, show: "One close-up detail that feels great to watch.", say: "No words.", camera: "Macro close-up", sound: "The most satisfying sound", text: "" },
      { label: "The finish", seconds: 5, show: "The complete, finished result — hold it.", say: "Optional: one short line.", camera: "Same angle as the start", sound: "A soft final sound", text: "After" },
    ],
    visualDirection: ["Consistent framing", "Close-up details", "Smooth, complete movements", "A clear final result"],
    audioDirection: ["Natural textures recorded close", "Relevant sound effects only", "Minimal narration"],
    share: "The final reveal — people send it because it just feels good to watch.",
    followUp: "Speed-run version: the same sequence in half the time.",
  }),
  "desire-cinematic": (S, T, A) => ({
    name: "The Cinematic Routine", emotions: ["Desire", "Inspiration"],
    angle: `Show the experience of using ${T} as a calm, cinematic routine — the life ${A} would love to have — before explaining anything.`,
    why: "People are drawn to an experience they can imagine for themselves, not just to an object.",
    originality: "Sells a feeling and a routine instead of a spec sheet.", difficulty: "Medium", audience: A,
    hooks: ["This is one of those little things that makes a big difference.", "A little luxury on an everyday budget.", "My favorite five minutes of the day.", "I found a way to make this routine easier.", "Would this make your everyday routine better?"],
    firstVisual: `Soft morning or evening light, ${T} in a beautiful, real setting.`,
    scenes: [
      { label: "The mood", seconds: 3, show: "A beautiful, real moment in soft light.", say: "No words, or one quiet line.", camera: "Slow push-in", sound: "Ambient room tone", text: "" },
      { label: "The ritual", seconds: 8, show: `Using ${T} step by step, gracefully.`, say: "Voiceover: why this moment matters to you.", camera: "Macro close-ups, slow movement", sound: "Natural textures", text: "My 5-minute reset" },
      { label: "The result", seconds: 5, show: "How you feel / how it looks after.", say: "One honest sentence.", camera: "Medium, warm light", sound: "Soft music, low", text: "" },
      { label: "The honest note", seconds: 4, show: `${cap(T)} on its own.`, say: "What it is, what it isn't, and who it suits.", camera: "Still life", sound: "Voice only", text: "Details below" },
    ],
    visualDirection: ["Soft window light", "Slow, deliberate movement", "Warm, uncluttered frames"],
    audioDirection: ["Ambient sound", "Quiet music that fits the mood", "Calm voiceover"],
    share: "The routine itself — people save or send it as 'goals'.",
    followUp: "The same routine on a budget, or a 'real-life' unfiltered version.",
  }),
  "trust-investigation": (S, T, A) => ({
    name: "The Honest Investigation", emotions: ["Trust", "Curiosity"],
    angle: `Investigate ${T} like a careful reviewer: what it claims, how you tested it, what you found, and who should skip it.`,
    why: "Viewers deciding whether to buy want proof and honesty. Naming a real limitation makes the rest believable.",
    originality: "Structures a review as evidence and a verdict, not a pitch.", difficulty: "Easy", audience: A,
    hooks: ["I tested this so you can see what actually happens.", "What I liked, what I didn't, and what surprised me.", "Before you buy one, look at this.", "Would I buy it again? Here's my honest answer.", "Let me show you the part nobody talks about."],
    firstVisual: `${cap(T)} on a clean surface with your test setup visible.`,
    scenes: [
      { label: "The claim", seconds: 3, show: `${cap(T)} and what it's supposed to do.`, say: '"Here\'s what it claims — let\'s check."', camera: "Close-up", sound: "Voice only", text: "Claim:" },
      { label: "The test", seconds: 10, show: "A fair, simple test of the main claim.", say: "Explain what you're testing and why it's fair.", camera: "Over-the-shoulder + close-up", sound: "Natural sound", text: "Test 1" },
      { label: "The evidence", seconds: 6, show: "The result, clearly visible.", say: "Exactly what you saw.", camera: "Steady close-up", sound: "Pause before showing", text: "Result" },
      { label: "The limitation", seconds: 4, show: "The weak spot.", say: "One honest downside.", camera: "Close-up", sound: "Voice only", text: "Not perfect:" },
      { label: "The verdict", seconds: 5, show: "You at eye level.", say: "Who it's for and who should skip it. Disclose any commission.", camera: "Medium, eye level", sound: "Voice only", text: "Worth it if…" },
    ],
    visualDirection: ["Show proof on screen for every claim", "Clean, well-lit setup", "Eye-level talking shots"],
    audioDirection: ["Clear voice, close mic", "No distracting music", "Natural sounds during tests"],
    share: "The verdict — people send it to a friend who was thinking of buying.",
    followUp: "A 30-day follow-up: does it still hold up?",
  }),
  "belonging-for-people": (S, T, A) => ({
    name: "For the People Who Understand", emotions: ["Belonging", "Empathy"],
    angle: `Speak directly to one group — ${A} — and show the small, specific moments only they recognize, with ${T} as part of their world.`,
    why: "People enjoy feeling seen. A clearly named audience makes the right viewers stop and feel the video is for them.",
    originality: "Makes the viewer the main character, not the product.", difficulty: "Easy", audience: A,
    hooks: [`For the people who never go anywhere without their ${S}.`, `Things only ${A} understand.`, `If you're one of us, you already know.`, "This is for anyone who's been there.", "Who else understands this?"],
    firstVisual: `A moment from everyday life that ${A} instantly recognize.`,
    scenes: [
      { label: "Call them in", seconds: 3, show: "A recognizable moment.", say: `"For ${A} — you'll get this."`, camera: "POV or eye level", sound: "Natural sound", text: `For ${A}` },
      { label: "The details", seconds: 10, show: "Three quick, specific moments they live every day.", say: "Short, knowing lines.", camera: "Quick cuts, varied angles", sound: "Natural sound", text: "1 · 2 · 3" },
      { label: "The helper", seconds: 5, show: `${cap(T)} quietly making one moment easier.`, say: "Mention it naturally.", camera: "Close-up of real use", sound: "Natural sound", text: "" },
      { label: "Invite them in", seconds: 4, show: "You, smiling at camera.", say: '"What would you add to this list?"', camera: "Eye level", sound: "Light music", text: "Add yours ↓" },
    ],
    visualDirection: ["Real, lived-in settings", "Specific details over generic shots", "Warm, friendly framing"],
    audioDirection: ["Natural sound", "Friendly conversational tone", "Light music"],
    share: "The detail that makes someone say 'this is so us' and send it to their group.",
    followUp: "Part 2 built entirely from viewers' comments.",
  }),
  "surprise-second-use": (S, T, A) => ({
    name: "The Unexpected Second Life", emotions: ["Surprise", "Confidence"],
    angle: `Set up what everyone expects ${T} to be for, then show a genuinely useful, safe second use most people never noticed.`,
    why: "Breaking an expectation makes an ordinary subject interesting — and a practical discovery is worth saving.",
    originality: "Shows a new side of something people think they already know.", difficulty: "Easy", audience: A,
    hooks: ["This looks ordinary, but watch what it does.", "I thought this was useless until I discovered this.", "Nobody told me this was the feature I should look for.", "I didn't expect this to be the part I loved most.", "Three things surprised me about this."],
    firstVisual: `${cap(T)} being used the 'normal' way — about to be flipped.`,
    scenes: [
      { label: "The expectation", seconds: 3, show: "The usual way people use it.", say: '"Everyone uses it like this…"', camera: "Medium", sound: "Natural sound", text: "The usual way" },
      { label: "The flip", seconds: 3, show: "You doing something different.", say: '"…but watch this."', camera: "Quick push-in", sound: "A small reveal sound", text: "But…" },
      { label: "The discovery", seconds: 10, show: "The second use, clearly demonstrated.", say: "Explain why it works — only if it's true and safe.", camera: "Close-ups", sound: "Natural sound", text: "" },
      { label: "The payoff", seconds: 4, show: "The useful result.", say: '"Did you know this?"', camera: "Steady close-up", sound: "Natural sound", text: "Save this" },
    ],
    visualDirection: ["Clear before/after framing", "A visible 'flip' moment", "Close-ups of the new use"],
    audioDirection: ["Natural sound", "A small sound at the reveal", "Short voice lines"],
    share: "The surprise — people send it with 'did you know this?!'",
    followUp: "Three more hidden uses, voted on by viewers.",
  }),
  "nostalgia-memory": (S, T, A) => ({
    name: "A Memory, Recreated", emotions: ["Nostalgia", "Happiness"],
    angle: `Connect ${T} to a memory many ${A} share — how this was done years ago versus now — and recreate the feeling in modern life.`,
    why: "Familiar memories create instant recognition and warmth, and people love adding their own version in the comments.",
    originality: "Gives a modern subject an emotional past.", difficulty: "Medium", audience: A,
    hooks: ["If you grew up doing this, you already know.", "Things that remind me of being a kid.", "This is how we used to do it…", "I recreated something from my childhood.", "What did this remind you of?"],
    firstVisual: "An old-fashioned detail or a 'then' version of the same moment.",
    scenes: [
      { label: "Then", seconds: 5, show: "The old way — a familiar detail, sound or object.", say: '"Remember this?"', camera: "Warm, slightly soft framing", sound: "A familiar sound", text: "Then" },
      { label: "Now", seconds: 5, show: `The same moment today, with ${T}.`, say: "What's changed.", camera: "Crisp, modern framing", sound: "Natural sound", text: "Now" },
      { label: "The feeling", seconds: 6, show: "The part that still feels the same.", say: "A short personal line.", camera: "Close-up of hands or faces", sound: "Gentle music", text: "" },
      { label: "Invite memories", seconds: 4, show: "You, smiling.", say: '"What did this remind you of?"', camera: "Eye level", sound: "Music fades", text: "Your memory ↓" },
    ],
    visualDirection: ["Warm tones for 'then', crisp for 'now'", "Familiar objects and details", "Genuine expressions"],
    audioDirection: ["A recognizable sound from the past", "Gentle music", "Personal voiceover"],
    share: "The memory — people send it to someone who 'grew up with this too'.",
    followUp: "Recreate a memory a viewer shares in the comments.",
  }),
  "inspiration-beginner": (S, T, A) => ({
    name: "The Beginner Can Do This", emotions: ["Inspiration", "Confidence"],
    angle: `Show a complete beginner getting a real result with ${T} — honest starting point, simple steps, achievable finish.`,
    why: "People want to believe they can do it too. Seeing a beginner succeed makes the result feel achievable.",
    originality: "Shows the honest learning curve instead of an expert's polished result.", difficulty: "Easy", audience: A,
    hooks: ["If you're a beginner, start here.", "You don't need expensive equipment to start.", "My first try versus my third try.", "I wish someone had explained this to me earlier.", "What I learned after trying this for a week."],
    firstVisual: "Your honest first attempt — not perfect.",
    scenes: [
      { label: "The honest start", seconds: 4, show: "Your first, imperfect attempt.", say: '"This was my first try."', camera: "Eye level", sound: "Natural sound", text: "Attempt 1" },
      { label: "The one fix", seconds: 8, show: `The single change that made the difference with ${T}.`, say: "Explain it simply.", camera: "Over-the-shoulder close-up", sound: "Voice only", text: "The fix" },
      { label: "The result", seconds: 5, show: "The improved attempt.", say: '"Same person, one change."', camera: "Same angle as attempt 1", sound: "Small satisfying sound", text: "Attempt 3" },
      { label: "Encouragement", seconds: 4, show: "You at eye level.", say: '"What would you like me to explain next?"', camera: "Eye level", sound: "Light music", text: "Your turn" },
    ],
    visualDirection: ["Same angle for before and after", "Clear close-ups of the key step", "Friendly, natural light"],
    audioDirection: ["Encouraging, natural voice", "No hype", "Light music"],
    share: "The before/after — people send it to a friend who's just starting.",
    followUp: "A viewer tries the same fix and shares their result.",
  }),
  "hunger-taste": (S, T, A) => ({
    name: "The Close-Up Craving", emotions: ["Hunger", "Satisfaction"],
    angle: `Make people imagine the taste of ${T}: the crunch, the pour, the steam — sound and texture first, explanation last.`,
    why: "Close-up sound and texture let viewers imagine the taste, which is a powerful reason to keep watching.",
    originality: "Lets the senses lead instead of the recipe card.", difficulty: "Easy", audience: A,
    hooks: ["Listen to that.", "The snack I keep making when I want something sweet.", "Three ingredients. Ten minutes.", "Sweet, salty or spicy — pick one.", "Wait until you see the finished result."],
    firstVisual: `The most appetizing close-up of ${T} — a bite, a pour or rising steam.`,
    scenes: [
      { label: "The craving", seconds: 3, show: "The money shot: bite, pour or steam.", say: "No words — let the sound work.", camera: "Macro close-up", sound: "The crunch or pour, recorded close", text: "" },
      { label: "Rewind", seconds: 10, show: "How it comes together, step by step.", say: "Short, simple steps.", camera: "Top-down + close-ups", sound: "Sizzle, chop, stir", text: "3 ingredients" },
      { label: "The finish", seconds: 4, show: "The finished result, beautifully plated.", say: "One honest line.", camera: "Slow push-in", sound: "Natural sound", text: "" },
      { label: "The reaction", seconds: 4, show: "Your genuine first bite.", say: '"Which would you choose?"', camera: "Close-up reaction", sound: "Natural reaction", text: "Pick one ↓" },
    ],
    visualDirection: ["Appetizing natural light", "Macro close-ups of texture", "Steam, pours and bites"],
    audioDirection: ["Crunch, sizzle and pour recorded close", "Music low or off", "Honest reactions only — never fake a taste"],
    share: "The close-up — people send it with 'we need to make this'.",
    followUp: "A taste-test ranking of three variations.",
  }),
};

// The Impossible Idea Machine — experimental formats with a practical filming method.
const EXPERIMENTAL: Record<string, Tpl> = {
  trailer: (S, T, A) => xp("The Movie Trailer", ["Excitement", "Humor"], `Make ${T} the star of a dramatic movie trailer — epic captions, slow motion, a booming 'coming soon' — for a completely everyday task.`,
    "Treating something ordinary with epic seriousness is funny and unexpected.", A, `"In a world where… one ${S} changed everything."`,
    [["Opening title card over slow motion", "Slow-motion close-up", "Dramatic pause"], ["Three quick 'action' shots of everyday use", "Fast cuts, low angles", "Whooshes timed to cuts"], ["The 'hero moment': the real result", "Slow push-in", "Silence, then a beat"], ["'Coming soon to a kitchen near you'", "Wide shot", "Final sound hit"]]),
  mystery: (S, T, A) => xp("The Mystery Object", ["Curiosity", "Surprise"], `Hide ${T}. Give three visual clues before revealing it — let viewers guess in the comments.`,
    "A guessing game turns viewers into participants and keeps them watching for the reveal.", A, '"Three clues. Can you guess what this is?"',
    [["Clue 1: an extreme close-up of a texture", "Macro", "Quiet tick"], ["Clue 2: a sound it makes", "Partial shot", "The sound, close"], ["Clue 3: it in use, partly hidden", "Over-the-shoulder", "Natural sound"], ["The reveal + what it does", "Pull back to wide", "Reveal sound"]]),
  courtroom: (S, T, A) => xp("The Courtroom Trial", ["Humor", "Trust"], `Put ${T} on trial. Present the 'charges' (common complaints), the 'evidence' (your real tests) and deliver an honest verdict.`,
    "A playful format that still delivers a fair, evidence-based review.", A, `"${cap(T)}, you stand accused of being overrated."`,
    [["The charges: common complaints", "Medium, you as 'judge'", "Gavel tap"], ["Exhibit A: test the first claim", "Close-up", "Natural sound"], ["Exhibit B: the weak spot", "Close-up", "Natural sound"], ["The verdict: who it's for and who should skip it", "Eye level", "Gavel tap"]]),
  documentary: (S, T, A) => xp("The Nature Documentary", ["Humor", "Curiosity"], `Narrate a day in the life of ${T} like a hushed wildlife documentary.`,
    "The contrast between serious narration and an everyday object is memorable and shareable.", A, `"Here, in its natural habitat, we observe the ${S}…"`,
    [["Establishing shot: its 'habitat'", "Wide, slow pan", "Hushed narration"], ["It 'feeding' or at work", "Close-up, long lens feel", "Narration whisper"], ["A dramatic 'encounter'", "Handheld", "Tense pause"], ["The narrator's reflection", "Golden-hour shot", "Gentle music"]]),
  "main-character": (S, T, A) => xp("The Object Is the Main Character", ["Empathy", "Humor"], `Tell the story from ${T}'s point of view — what does its day look like?`,
    "A fresh perspective makes viewers see a familiar object completely differently.", A, `"POV: you're ${the(S)}."`,
    [["POV shot from the object's position", "Low, fixed angle", "Room sound"], ["What it 'sees' during use", "POV handheld", "Natural sound"], ["Its proudest moment", "Close-up", "Small triumphant sound"], ["Back on the shelf, waiting", "Wide", "Quiet"]]),
  "five-closeups": (S, T, A) => xp("Five Close-Up Shots", ["Satisfaction", "Desire"], `Tell the whole story of ${T} in exactly five close-up shots — no wide shots, no talking.`,
    "A strict visual rule forces beautiful, focused storytelling.", A, "Five shots. One story.",
    [["Close-up 1: the beginning", "Macro", "Texture sound"], ["Close-up 2: first touch", "Macro", "Natural sound"], ["Close-up 3: the key moment", "Macro", "The best sound"], ["Close-up 4: the change", "Macro", "Natural sound"], ["Close-up 5: the result", "Macro, hold", "Soft final sound"]]),
  "start-at-end": (S, T, A) => xp("Start at the Ending", ["Curiosity", "Satisfaction"], `Open on the final result with ${T}, then rewind to show how you got there.`,
    "Showing the destination first gives viewers a reason to watch the journey.", A, '"How did we get here? Let\'s rewind."',
    [["The finished result", "Hero shot", "Rewind sound"], ["Rewind: the starting point", "Same angle", "Natural sound"], ["The key steps", "Close-ups", "Natural sound"], ["Back to the result, now earned", "Hero shot", "Soft final sound"]]),
  "viewer-chooses": (S, T, A) => xp("The Viewer Chooses the Next Scene", ["Belonging", "Excitement"], `Stop at a decision point with ${T} and let comments choose what happens next — then film the winning choice.`,
    "Participation turns viewers into co-creators who come back to see the result.", A, '"You decide what happens next."',
    [["Set up the situation", "Medium", "Natural sound"], ["Reach the decision point", "Close-up", "Pause"], ["Show option A and option B", "Split frame", "Natural sound"], ['"Comment A or B — I\'ll film the winner"', "Eye level", "Light music"]]),
  "no-words": (S, T, A) => xp("The No-Words Story", ["Empathy", "Satisfaction"], `Tell a complete story with ${T} using only visuals, expressions, movement and sound — no speaking, no text until the end.`,
    "Pure visual storytelling works with the sound off and feels distinctive.", A, "(No words — just the first image.)",
    [["A problem shown through expression", "Close-up of face", "Room sound"], ["Trying and failing", "Medium", "Natural sound"], [`Discovering ${T}`, "Close-up", "Small sound"], ["The relief / joy", "Close-up of face", "Soft music"]]),
  "miniature-adventure": (S, T, A) => xp("The Miniature Adventure", ["Excitement", "Inspiration"], `Turn a simple demonstration of ${T} into a tiny adventure across your home — a journey with obstacles and a finish line.`,
    "Giving a demo a story structure makes viewers want to see the finish.", A, '"Can it make it all the way to the finish line?"',
    [["The starting line", "Low angle", "Countdown"], ["Obstacle 1", "Close tracking shot", "Natural sound"], ["Obstacle 2", "Top-down", "Natural sound"], ["The finish line", "Low angle, slow motion", "Victory sound"]]),
  "unexpected-connection": (S, T, A) => xp("The Unexpected Connection", ["Surprise", "Curiosity"], `Connect ${T} to something completely unrelated — what does it have in common with a chess game, a recipe or a road trip? — and make the connection genuinely insightful.`,
    "An unusual comparison makes people think about the subject in a new way.", A, `"What ${the(S)} and a chess game have in common."`,
    [["Show the unrelated thing", "Medium", "Natural sound"], [`Show ${T}`, "Medium", "Natural sound"], ["The surprising parallel", "Split screen", "Reveal sound"], ["The insight", "Eye level", "Voice only"]]),
  "guess-ending": (S, T, A) => xp("Guess the Ending", ["Curiosity", "Belonging"], `Ask viewers to predict the outcome of a fair test with ${T} before you show it.`,
    "A prediction gives viewers a personal stake in the result.", A, '"Before I show you — what do you think happens?"',
    [["The test setup", "Medium", "Natural sound"], ["Pause: 'make your guess'", "Close-up", "Ticking"], ["The test", "Close-ups", "Natural sound"], ["The answer + 'did you guess right?'", "Close-up", "Reveal sound"]]),
};

function xp(name: string, emotions: [string, string], angle: string, why: string, A: string, hook: string, beats: [string, string, string][]): Omit<Direction, "id"> {
  return {
    name, emotions, angle, why, experimental: true,
    originality: "Deliberately avoids the familiar product-video format.",
    difficulty: beats.length > 4 ? "Ambitious" : "Medium",
    audience: A,
    hooks: [hook, "I tried something completely different with this.", "You've never seen this done like this.", "Stay for the ending.", "Tell me if this works."],
    firstVisual: beats[0][0] + ".",
    scenes: beats.map(([show, camera, sound], i) => ({
      label: `Beat ${i + 1}`, seconds: i === 0 ? 3 : 5, show, say: i === 0 ? hook : "Keep lines short — let the format do the work.",
      camera, sound, text: "",
    })),
    visualDirection: ["Commit fully to the format", "Keep each shot simple and clear", "Make the payoff obvious"],
    audioDirection: ["Sound that supports the format", "Clean voice if speaking", "Silence where it adds tension"],
    share: "The format itself — people share it because it's unlike other videos on the subject.",
    followUp: "Run the same format with a viewer-suggested subject.",
  };
}

// ---------------------------------------------------------------------------
// Emotion DNA Scanner + Fusion Reactor
// ---------------------------------------------------------------------------
export const DNA_EMOTIONS = ["Curiosity", "Humor", "Satisfaction", "Desire", "Trust", "Belonging", "Surprise", "Nostalgia", "Inspiration", "Hunger"] as const;

const CLASSIC_BY_EMOTION: Record<string, string> = {
  Curiosity: "curiosity-test", Humor: "humor-coworker", Satisfaction: "satisfaction-sequence", Desire: "desire-cinematic",
  Trust: "trust-investigation", Belonging: "belonging-for-people", Surprise: "surprise-second-use", Nostalgia: "nostalgia-memory",
  Inspiration: "inspiration-beginner", Hunger: "hunger-taste",
};

export const STRANGE_PAIRS: [string, string, string][] = [
  ["Nostalgia", "Humor", "documentary"], ["Trust", "Humor", "courtroom"], ["Satisfaction", "Curiosity", "start-at-end"],
  ["Empathy", "Humor", "main-character"], ["Excitement", "Humor", "trailer"], ["Surprise", "Curiosity", "unexpected-connection"],
  ["Belonging", "Excitement", "viewer-chooses"], ["Curiosity", "Belonging", "guess-ending"],
];

export interface DnaLine { emotion: string; direction: string; why: string }

export function emotionDNA(input: string, audience?: string): { subject: string; audience: string; lines: DnaLine[]; motivations: string[]; trust: string[] } {
  const S = cleanSubject(input);
  const T = the(S);
  const A = audience?.trim() || `people interested in ${S}`;
  const food = FOOD.test(S);
  const short: Record<string, string> = {
    Curiosity: `“Can ${T} really live up to the hype? I tested it all day.”`,
    Humor: `“${cap(T)} has become my most demanding coworker.”`,
    Satisfaction: `A visually beautiful sequence with ${T} — unpacking, using, cleaning, finishing.`,
    Desire: `A cinematic routine that shows the experience of ${T}, not just the object.`,
    Trust: `An honest test of ${T}: the claims, the evidence, a real limitation and a verdict.`,
    Belonging: `“For the people who never go anywhere without their ${S}.”`,
    Surprise: `A genuinely useful second use of ${T} most people never noticed.`,
    Nostalgia: `How people did this years ago versus with ${T} today.`,
    Inspiration: `A beginner gets a real result with ${T} — honest first try to achievable finish.`,
    Hunger: `Close-up sound and texture that make people imagine the taste of ${T}.`,
  };
  const lines: DnaLine[] = DNA_EMOTIONS.filter((e) => e !== "Hunger" || food).map((e) => {
    const d = CLASSIC[CLASSIC_BY_EMOTION[e]](S, T, A);
    return { emotion: e, direction: short[e], why: d.why };
  });
  return {
    subject: S,
    audience: A,
    lines,
    motivations: [
      `What problem might ${A} want ${T} to solve?`,
      `What would they want to see before believing it works?`,
      `In what everyday moment does ${T} actually matter to them?`,
      `What question do they type into search about ${S}?`,
    ],
    trust: [
      "Every claim about results needs proof on screen — show it, don't just say it.",
      "Only describe features you have checked yourself; never invent capabilities or results.",
      "Name at least one real limitation.",
      "Disclose any paid, gifted or affiliate relationship clearly.",
      "Viewers may be skeptical of before/after results — film both in the same light and angle.",
    ],
  };
}

function build(key: string, tpl: Tpl, S: string, A: string): Direction {
  return { id: key, ...tpl(S, the(S), A) };
}

/** Returns three distinct directions for a subject. `round` lets creators regenerate. */
export function discoverDirections(input: string, opts: { mode: Mode; emotions?: string[]; audience?: string; round?: number }): Direction[] {
  const S = cleanSubject(input);
  const A = opts.audience?.trim() || `people interested in ${S}`;
  const round = opts.round ?? 0;
  const food = FOOD.test(S);

  if (opts.mode === "experimental") {
    const keys = Object.keys(EXPERIMENTAL);
    return [0, 1, 2].map((i) => keys[(round * 3 + i) % keys.length]).map((k) => build(k, EXPERIMENTAL[k], S, A));
  }
  if (opts.mode === "unexpected") {
    return [0, 1, 2].map((i) => STRANGE_PAIRS[(round * 3 + i) % STRANGE_PAIRS.length]).map(([, , k]) => build(k, EXPERIMENTAL[k], S, A));
  }
  const chosen = (opts.emotions?.length ? opts.emotions : ["Curiosity", "Humor", "Trust", "Satisfaction", "Desire", "Belonging", "Surprise", "Nostalgia", "Inspiration", ...(food ? ["Hunger"] : [])])
    .map((e) => CLASSIC_BY_EMOTION[e]).filter(Boolean);
  const pool = [...new Set(chosen)];
  // Fill with related directions so there are always three.
  const all = Object.keys(CLASSIC).filter((k) => food || k !== "hunger-taste");
  for (const k of all) if (pool.length < 3 && !pool.includes(k)) pool.push(k);
  return [0, 1, 2].map((i) => pool[(round * 3 + i) % pool.length]).filter((k, i, arr) => arr.indexOf(k) === i).map((k) => build(k, CLASSIC[k], S, A));
}

// ---------------------------------------------------------------------------
// First-three-seconds experiment chamber
// ---------------------------------------------------------------------------
export function tenOpenings(input: string): { type: string; line: string; why: string }[] {
  const S = cleanSubject(input);
  const T = the(S);
  return [
    { type: "Question", line: `Is ${T} actually worth it?`, why: "Invites a guess, so viewers stay to check their answer." },
    { type: "Visual surprise", line: `(Show ${T} doing something unexpected in the first frame.)`, why: "Works with the sound off; the image does the hooking." },
    { type: "Funny", line: `${cap(T)} and I need to talk.`, why: "Personality and a relatable tone make people smile and stay." },
    { type: "Dramatic", line: "I almost gave up on this.", why: "Stakes create tension viewers want resolved." },
    { type: "Relatable problem", line: `If ${S} always lets you down, watch this.`, why: "Recognition makes the right viewers feel it's for them." },
    { type: "Satisfying visual", line: "(Open on the cleanest, most satisfying moment.)", why: "A visual reward earns the next few seconds." },
    { type: "Personal confession", line: `I have a confession about ${T}.`, why: "Honesty feels intimate and creates curiosity." },
    { type: "Direct demonstration", line: "Watch how fast this works.", why: "Proof first — ideal for buyers who want to see it work." },
    { type: "Storytelling", line: `The day ${T} saved my morning…`, why: "Starting mid-story makes people need the ending." },
    { type: "Respectful opinion", line: `Unpopular opinion: most people use ${T} wrong.`, why: "A respectful take invites discussion — keep it fair and true." },
  ];
}

// ---------------------------------------------------------------------------
// Human Reaction Simulator (hypotheses only)
// ---------------------------------------------------------------------------
export function reactionPerspectives(d: Direction, subject: string) {
  const T = the(subject);
  return [
    { who: "The Curious Viewer", asks: "What makes me want to know more?", check: `Is there a clear question or reveal? Hook: “${d.hooks[0]}”` },
    { who: "The Entertained Viewer", asks: "What makes me smile or enjoy this?", check: d.emotions.includes("Humor") ? "Is the funniest beat early and cut tight?" : "Is there at least one moment of personality, beauty or delight?" },
    { who: "The Skeptical Viewer", asks: "What would I question?", check: `Is every claim about ${T} shown on screen? Is there a real limitation?` },
    { who: "The Busy Viewer", asks: "What would make me leave?", check: "Any intro, dead air, filler or tangent before the first scene? Cut it." },
    { who: "The Interested Buyer", asks: "What do I still need to know?", check: "Price range, who it's for, who it's not for, and where the details are." },
    { who: "The Community Viewer", asks: "What would make me join in?", check: "Is there one specific question, choice or invitation to contribute?" },
  ];
}

export const READINESS = [
  "Opening strength — does the first second give a reason to stay?",
  "Clarity of the idea — can you say the video in one sentence?",
  "Emotional connection — which feeling does it create, and where?",
  "Story progression — does every scene add information, emotion or progress?",
  "Visual interest — does the shot change every few seconds?",
  "Credibility — is every claim shown, not just said?",
  "Comment opportunity — is there one question worth answering?",
  "Potential confusion — is anything unclear with the sound off?",
];

// ---------------------------------------------------------------------------
// Comment psychology + comment-to-video
// ---------------------------------------------------------------------------
export function commentPrompts(subject: string) {
  const T = the(subject);
  return [
    { type: "Choice", prompt: `Which would you pick — ${T} or the alternative?` },
    { type: "Experience", prompt: `What's your experience been with ${subject}?` },
    { type: "Memory", prompt: "What did this remind you of?" },
    { type: "Opinion", prompt: `Honest opinion: is ${T} worth it?` },
    { type: "Participation", prompt: "What should I test next? Most-liked comment decides." },
  ];
}

export function commentToVideo(comment: string) {
  const c = comment.trim().replace(/\s+/g, " ").slice(0, 200);
  const q = c ? `“${c}”` : "the comment";
  return [
    { kind: "Response video", idea: `Pin ${q} on screen and answer it in under 30 seconds.` },
    { kind: "Direct answer", idea: `Start with: Someone asked ${q} — here's the honest answer.` },
    { kind: "Funny response", idea: `Act out the situation in ${q} as a short, kind comedy beat — never mock the commenter.` },
    { kind: "Demonstration", idea: `Show, don't tell: demonstrate exactly what ${q} is asking about.` },
    { kind: "Follow-up experiment", idea: `Turn ${q} into a fair test and film the result.` },
    { kind: "New community question", idea: "End by asking viewers what they'd add — and promise to answer the best one next." },
  ];
}

export const FAN_STAGES: [string, string][] = [
  ["Discover", "Strong hooks and clear topics help new people find you."],
  ["Recognize", "A recurring opening, series name or visual style makes you recognizable."],
  ["Enjoy", "Deliver the payoff every time so watching you feels worth it."],
  ["Trust", "Honest reviews, real limitations and clear disclosures."],
  ["Participate", "Questions, choices and viewer-suggested tests."],
  ["Return", "Series, follow-ups and progress updates give a reason to come back."],
  ["Recommend", "Share-worthy moments people send to someone they know."],
];

// ---------------------------------------------------------------------------
// Production sheet (23 parts)
// ---------------------------------------------------------------------------
export function productionSheet(d: Direction, subject: string, opts: { platform: string; goalTrigger: string; ending: string; metric: string; change: string; caption?: string; terms: string[]; platformNote: string; isProduct: boolean }) {
  const S = subject;
  const title = `${d.name}: ${cap(S)}`;
  const secs = d.scenes.reduce((a, s) => a + s.seconds, 0);
  const tags = opts.terms.slice(0, 5).map((t) => "#" + t.replace(/[^a-z0-9]+/gi, ""));
  const parts: [string, string | string[]][] = [
    ["1. Video title", title],
    ["2. Target audience", d.audience],
    ["3. Human insight", d.why],
    ["4. Primary emotion", d.emotions[0]],
    ["5. Secondary emotion", d.emotions[1]],
    ["6. Original creative concept", d.angle],
    ["7. Why the concept may connect (hypothesis)", `${d.why} ${d.originality} This is a creative hypothesis, not a prediction.`],
    ["8. Five opening hook options", d.hooks.map((h) => `“${h}”`)],
    ["9. First visual", d.firstVisual],
    ["10. Scene-by-scene script", d.scenes.map((s) => `${s.label} (~${s.seconds}s) — SHOW: ${s.show} SAY: ${s.say}`)],
    ["11. Camera & filming instructions", [...d.scenes.map((s) => `${s.label}: ${s.camera}`), ...d.visualDirection]],
    ["12. Audio & sound direction", [...d.scenes.map((s) => `${s.label}: ${s.sound}`), ...d.audioDirection, "Clean audio first: record close, in a quiet room with soft furnishings."]],
    ["13. On-screen text", d.scenes.filter((s) => s.text).map((s) => `${s.label}: “${s.text}”`).concat(d.scenes.some((s) => s.text) ? [] : ["Keep text minimal — add captions to any speech."])],
    ["14. Emotional progression", `${d.emotions[0]} → ${d.emotions[1]} → payoff. Estimated length: ~${secs} seconds.`],
    ["15. Natural comment prompt", opts.goalTrigger],
    ["16. Share-worthy moment", d.share],
    ["17. Trust & accuracy checklist", ["Only show results you actually got.", "Never invent product capabilities.", "Mention at least one real limitation.", "Before/after in the same light and angle.", ...(opts.isProduct ? ["Disclose any paid, gifted or affiliate relationship."] : [])]],
    ["18. Honest call to action", opts.ending],
    ["19. Search-friendly title & caption", [`Title: ${title}`, `Caption: ${opts.caption ?? `${d.hooks[0]} ${opts.goalTrigger}`}`]],
    ["20. Keywords & hashtags", [`Keywords: ${opts.terms.join(", ")}`, `Hashtags: ${tags.join(" ")}`, "Check these in the platform's own search bar before posting."]],
    ["21. Platform adaptation", opts.platformNote],
    ["22. Performance metrics to review", `${opts.metric}. ${opts.change}`],
    ["23. One follow-up video idea", d.followUp],
  ];
  return { title, parts, seconds: secs };
}

export function sheetToText(title: string, parts: [string, string | string[]][]): string {
  return [`ULTRAVESTRA PRODUCTION SHEET — ${title}`, "", ...parts.flatMap(([h, v]) => [h.toUpperCase(), ...(Array.isArray(v) ? v.map((x) => `- ${x}`) : [v]), ""]),
    "Made with the UltraVestra Human Emotion Video Lab. Creative hypotheses, not guarantees."].join("\n");
}
