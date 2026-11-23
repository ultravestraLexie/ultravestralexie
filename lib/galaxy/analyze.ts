/* Studio (Video Lab) — the prototype's in-browser script checks,
 * ported faithfully. Deterministic, no model calls: the instant
 * preview. The full Buyer Brain V3 read comes from
 * /api/creator-lab and is layered on top, never replaced by this. */

export type LabForm = {
  audience: string;
  feel: string;
  product: string;
  price: string;
  script: string;
};

export type LabCheck = {
  id: string;
  name: string;
  pass: boolean;
  skip?: boolean;
  note: string;
  fix: string;
};

export type LabBuyer = { name: string; yes: boolean; y: string; n: string };

export type LabResult = {
  passed: number;
  total: number;
  checks: LabCheck[];
  fixes: LabCheck[];
  buyers: LabBuyer[];
  secs: number;
  firstLine: string;
};

export const SAMPLE_SCRIPT: LabForm = {
  audience: "Women 25 to 34 with tired-looking skin",
  feel: "Relief that one product fixes the 3pm dull look",
  product: "Lumen Glow Serum",
  price: "28",
  script:
    "Stop scrolling if your skin looks tired by 3pm. I was so frustrated with makeup sliding off my face. I've used this Lumen serum every morning for 3 weeks and now my skin actually looks awake in photos. It's under $30, which is less than my coffee habit. Tap the orange cart to grab yours before it sells out again.",
};

const plural = (n: number, w: string) => `${n} ${n === 1 ? w : w + "s"}`;

export function analyzeScript(f: LabForm): LabResult {
  const text = (f.script || "").trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const sentences = (text.match(/[^.!?\n]+[.!?]*/g) || [])
    .map((s) => s.trim())
    .filter(Boolean);
  const first = sentences[0] || "";
  const firstLower = first.toLowerCase();
  const firstWords = first.split(/\s+/).filter(Boolean).length;
  const youCount = (lower.match(/\byou(rs?|'re|’re|rself)?\b/g) || []).length;
  const secs = Math.round(wc / 2.6);
  const has = (re: RegExp) => re.test(lower);
  const price = String(f.price || "").trim();

  const c: LabCheck[] = [
    {
      id: "hook",
      name: "The hook lands in the first line",
      pass:
        firstWords > 0 &&
        firstWords <= 14 &&
        /\b(you|your|stop|never|why|how|this|wish|secret|finally|nobody|pov)\b|\?|\d/.test(firstLower),
      note: `Your first line is ${plural(firstWords, "word")}.`,
      fix: 'Open with the problem or the result in under 12 words, spoken straight to "you".',
    },
    {
      id: "feel",
      name: "It names a feeling",
      pass: has(
        /\b(tired|frustrat\w*|obsess\w*|love|confident|embarrass\w*|stress\w*|relie\w*|happy|worried|insecure|proud|annoy\w*|hate|scared|calm|overwhelm\w*|finally|excited)\b/
      ),
      note: "People buy the feeling first and justify it after.",
      fix: `Say how ${f.audience ? "your viewer" : "the viewer"} feels before, then how they feel after${
        f.feel ? `: ${f.feel.toLowerCase()}` : ""
      }.`,
    },
    {
      id: "one",
      name: "It talks to one person",
      pass: youCount >= 3,
      note: `"You" appears ${plural(youCount, "time")}.`,
      fix: 'Swap "people" and "everyone" for "you". Aim for at least three.',
    },
    {
      id: "result",
      name: "It shows a result, not just features",
      pass: has(/\b(after|now|finally|results?|changed|difference|before|actually|in \d+ (days|weeks))\b/),
      note: "A result is what the viewer gets. A feature is what the product has.",
      fix: "Add one line about what changed for you after using it.",
    },
    {
      id: "proof",
      name: "It gives proof",
      pass: has(
        /(\d+\s*(days?|weeks?|months?)|i('ve| have) (used|tried|tested)|reviews|sold out|before and after|every (day|morning|night))/
      ),
      note: "Skeptical viewers need one concrete detail.",
      fix: "Say how long you have used it, or show a before and after.",
    },
    {
      id: "price",
      name: "It answers the price question",
      skip: !price,
      pass:
        !price ||
        has(/(\$|price|worth|cost|cheaper|deal|save|under|less than|discount|sale|only)/),
      note: price ? `Price given: $${price}.` : "No price given, so this check is skipped.",
      fix: "Frame the price against something they already spend money on.",
    },
    {
      id: "cta",
      name: "It ends with a clear next step",
      pass: has(/\b(link|tap|click|shop|cart|basket|grab|buy|order|get yours|check out)\b/),
      note: "Tell them exactly where to tap.",
      fix: 'End with one action: "Tap the orange cart to grab yours."',
    },
    {
      id: "length",
      name: "It is the right length for short video",
      pass: secs >= 15 && secs <= 60,
      note: `About ${secs} seconds read aloud.`,
      fix:
        secs < 15
          ? "Add a proof moment so it runs at least 15 seconds."
          : "Cut to under 60 seconds. Lose any line that does not move the viewer.",
    },
  ];

  const counted = c.filter((x) => !x.skip);
  const passed = counted.filter((x) => x.pass).length;
  const ok = (id: string) => c.find((x) => x.id === id)?.pass ?? false;
  const buyers: LabBuyer[] = [
    {
      name: "The scroller",
      yes: ok("hook") && ok("length"),
      y: "\"Okay, you got me. I'll watch.\"",
      n: '"Swiped. Nothing grabbed me in the first second."',
    },
    {
      name: "The skeptic",
      yes: ok("proof") && ok("result"),
      y: '"Three weeks of use and a real result. I believe it."',
      n: '"Every ad says this. Where is the proof?"',
    },
    {
      name: "The bargain hunter",
      yes: !price ? false : ok("price"),
      y: '"Cheaper than my coffee? Easy yes."',
      n: price ? '"How much is it, and is it worth it?"' : '"No price? Add one so I can decide."',
    },
    {
      name: "The heart buyer",
      yes: ok("feel") && ok("one"),
      y: '"That is exactly how I feel. It\'s talking to me."',
      n: '"This feels like it\'s for someone else."',
    },
    {
      name: "The ready buyer",
      yes: ok("cta"),
      y: '"Tapping the cart now."',
      n: '"I want it, but where do I buy it?"',
    },
  ];

  return {
    passed,
    total: counted.length,
    checks: c,
    fixes: c.filter((x) => !x.skip && !x.pass).slice(0, 3),
    buyers,
    secs,
    firstLine: first,
  };
}
