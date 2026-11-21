/* Creator Academy — UltraVestra's searchable library of creator lessons:
 * hooks, scripts, filming, pitching, money and growth. Original teaching
 * written for creators. Searchable from /academy and linked from
 * Discover results. */

export interface Lesson {
  id: string;
  title: string;
  category: "Hooks" | "Scripts" | "Filming" | "Pitching" | "Money" | "Growth";
  minutes: number;
  summary: string;
  points: string[];
}

export const LESSONS: Lesson[] = [
  {
    id: "hook-formula",
    title: "The 3-Second Hook Formula",
    category: "Hooks",
    minutes: 4,
    summary: "The first three seconds decide whether a brand video lives or dies. This formula builds a hook from a problem, a promise and proof.",
    points: [
      "Second 0–1: show the product or the problem — never a logo, never 'hey guys'.",
      "Say the problem out loud in the viewer's own words: 'If your foundation always separates…'",
      "Promise the payoff with a time stamp: 'watch what happens by day three.'",
      "Put the most visual moment first, even if it happens later in filming. Edit backwards.",
      "Test two hooks on the same footage. The hook is a variable, not an opinion.",
    ],
  },
  {
    id: "hook-patterns",
    title: "10 Hook Patterns That Stop the Scroll",
    category: "Hooks",
    minutes: 6,
    summary: "Ten proven opening patterns for creator ads and organic product videos, with the exact first line for each.",
    points: [
      "The confession: 'I was wrong about this product.'",
      "The mistake: 'You are using this wrong — here is the fix.'",
      "The comparison: 'Expensive version vs this one. Watch.'",
      "The countdown: 'Three things nobody tells you about…'",
      "The result first: show the after, then rewind to the before.",
      "The objection killer: 'Yes, it works on sensitive skin too. Here is proof.'",
      "The story open: 'This ruined my morning — until I tried…'",
      "The test: 'I used it every day for a week. Honest results.'",
      "The question: 'Why does nobody talk about this?'",
      "The direct call-out: 'If you are over 35 and your makeup settles into lines, watch this.'",
    ],
  },
  {
    id: "script-structure",
    title: "The 60-Second Script Structure",
    category: "Scripts",
    minutes: 5,
    summary: "Hook, problem, demo, proof, honest line, call to action — the six beats of a creator video that brands renew.",
    points: [
      "Hook (0–3s): the pattern from the hook lessons. One idea only.",
      "Problem (3–10s): name the pain in one sentence, on camera, in a real setting.",
      "Demo (10–35s): show the product working. Hands in frame. No cuts during the key moment.",
      "Proof (35–45s): a result, a comparison, a number, a before/after in the same light.",
      "Honest line (45–52s): one real limitation. It makes everything else believable.",
      "CTA (52–60s): one action only — 'link below', said while the product is on screen.",
    ],
  },
  {
    id: "honest-review",
    title: "The Honest Review Framework",
    category: "Scripts",
    minutes: 4,
    summary: "How to review a product so viewers trust you and brands trust you more — including how to handle a product you do not love.",
    points: [
      "Use it before you film. A first impression is content; a fake one is a liability.",
      "Structure: what it promises, what you tested, what worked, what did not, who it is for.",
      "Name one downside in every review. Zero-downside reviews read as ads and convert worse.",
      "If you cannot recommend it, tell the brand privately first — professionalism gets remembered.",
      "Keep receipts: dates, photos, results. Proof protects you if a claim is ever questioned.",
    ],
  },
  {
    id: "pitch-that-replies",
    title: "Writing a Pitch Brands Reply To",
    category: "Pitching",
    minutes: 5,
    summary: "Brands ignore copy-paste pitches. This structure — researched, specific, one idea — is what gets opened and answered.",
    points: [
      "Subject line: 'Partnership idea for [Brand] — [platform] [niche] creator'. Specific beats clever.",
      "Line one proves research: name their product, their audience or a gap you noticed.",
      "Give ONE video idea with its hook written out. Ideas are the currency.",
      "Make the first step tiny: product seeding or their affiliate program, results first, rates later.",
      "End with one question and a deadline-free door: 'Open to a short intro this week?'",
      "UltraVestra writes this pitch for you in every Ask report — use it, then personalize one line.",
    ],
  },
  {
    id: "follow-up",
    title: "Follow Up Without Being Annoying",
    category: "Pitching",
    minutes: 3,
    summary: "Most deals close on the follow-up. The rule: every follow-up must add value, never just 'checking in'.",
    points: [
      "Wait 4–5 business days. Brands run on calendars, not on your anxiety.",
      "Add something new each time: a fresh idea, a result from another video, a seasonal angle.",
      "Two follow-ups, then move on gracefully. Silence is information, not rejection of you.",
      "Track every pitch: brand, contact, date, reply, next step. Memory is not a system.",
      "When a brand says 'not now', ask when to reconnect — and actually reconnect then.",
    ],
  },
  {
    id: "film-anywhere",
    title: "Film Anywhere: Light, Sound, Background",
    category: "Filming",
    minutes: 5,
    summary: "No studio needed. The three things that make phone footage look professional, in priority order.",
    points: [
      "Light first: face a window, never put the window behind you. Soft daylight beats any ring light.",
      "Sound second: a quiet room and a phone close to you beats an expensive camera far away.",
      "Background third: one clean surface, the product's world visible (bathroom for skincare, kitchen for food).",
      "Wipe the lens. Every time. It is the cheapest quality upgrade that exists.",
      "Film at arm's length or on a tripod — shaky footage makes honest reviews look careless.",
    ],
  },
  {
    id: "demo-that-sells",
    title: "The Product Demo That Sells",
    category: "Filming",
    minutes: 4,
    summary: "A demo is not showing a product — it is showing a change. How to film the change so viewers feel it.",
    points: [
      "Show the problem state first, in the same shot the product will fix.",
      "One continuous take for the key moment. Cuts during the magic read as tricks.",
      "Hands in frame, product label readable, real quantities — no pea-size amounts for a whole face.",
      "End on the result held for two full seconds. Let the viewer arrive.",
      "Film the B-roll while you demo: texture close-up, packaging, size next to a hand. Editors and brands love options.",
    ],
  },
  {
    id: "what-to-charge",
    title: "What to Charge: Rates, Usage and Whitelisting",
    category: "Money",
    minutes: 6,
    summary: "How creator pricing actually works — base rate, usage rights, whitelisting, exclusivity — so you stop leaving money on the table.",
    points: [
      "Separate the three prices: creating the video, the brand posting it (usage), the brand advertising with it (whitelisting).",
      "Usage is time-boxed: 3, 6 or 12 months. Perpetual usage costs much more — or is declined.",
      "Exclusivity (not working with competitors) is a paid add-on, priced by category and months.",
      "Affiliate-first deals are fine for a first video — with a date to revisit paid terms after results.",
      "Get it in writing before you film: deliverables, revisions, payment terms, usage. A friendly email counts.",
      "Raise rates with proof: keep a results folder — views, clicks, sales — and attach it to pitches.",
    ],
  },
  {
    id: "read-the-offer",
    title: "Reading an Affiliate Offer Before You Join",
    category: "Money",
    minutes: 5,
    summary: "Commission rate is only one number. The five terms that decide what you actually earn from an affiliate program.",
    points: [
      "Rate: percent of what — sale price, net revenue, or the platform's profit share? The basis changes everything.",
      "Cap: is there a ceiling on earnings? UltraVestra marks verified UNCAPPED programs — look for the badge.",
      "Cookie window: 24 hours and 90 days are different businesses. Longer windows pay creators more.",
      "Attribution: last click, first click, or lifetime customer value — know which one you signed.",
      "Payout terms: threshold, schedule, and method. Store credit is not cash — price it differently.",
    ],
  },
  {
    id: "three-platforms",
    title: "One Video, Three Platforms",
    category: "Growth",
    minutes: 4,
    summary: "Shoot once, publish everywhere — correctly. What to change per platform so one video does triple duty.",
    points: [
      "Film vertical, clean, with captions burned or sidecar — every platform rewards watch time and clarity.",
      "TikTok: raw and fast, hook in the first second, trending audio low under your voice.",
      "YouTube Shorts: title carries the search words; the first frame must read as a thumbnail.",
      "Instagram: polish matters more; save-worthy content (lists, routines) travels furthest.",
      "Remove other platforms' watermarks before cross-posting — reach penalties are real.",
    ],
  },
  {
    id: "first-30-days",
    title: "Your First 30 Days as a Creator",
    category: "Growth",
    minutes: 6,
    summary: "A realistic month-one plan: portfolio first, pitches second, proof always. No audience required.",
    points: [
      "Week 1: film three spec videos for products you already own. These are your portfolio.",
      "Week 2: build your list — 20 brands in one niche from the UltraVestra directory, scored and contacted properly.",
      "Week 3: pitch daily, five a day, each with one written-out video idea. Track everything.",
      "Week 4: take affiliate-first deals, film fast, deliver early, and collect your first results.",
      "This is a business of evidence: every video you deliver makes the next pitch stronger.",
      "Smaller creators win on speed, specificity and honesty — the three things big accounts cannot copy.",
    ],
  },
];
