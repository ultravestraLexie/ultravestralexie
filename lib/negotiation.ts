/* THE COMMISSION NEGOTIATION COACH — the data layer.
 * An UltraVestra Original serving the understanding moment:
 * "I understand how to negotiate better commissions."
 * An offer is eight terms, not one number. Each term below carries
 * what it means in one plain sentence, what strong looks like, what
 * a red flag looks like, and one exact counter line a creator can
 * send. "Strong" is grounded in what the UltraVestra directory
 * itself proves exists — verified-uncapped programs are published
 * in the Commission Intelligence Center (/commissions), and strong
 * published programs carry 30–90 day attribution windows and
 * written tier step-ups. Educational guidance only — never a claim
 * about industry averages, and never legal advice. */

export interface OfferTerm {
  id: string;
  name: string;
  meaning: string;
  strong: string;
  redFlag: string;
  counter: string;
}

export const TERMS: OfferTerm[] = [
  {
    id: "rate",
    name: "Commission rate",
    meaning: "The percentage of each sale you referred that the brand pays you.",
    strong:
      "The rate is published up front and reflects the work. The directory's own published programs include rates of 20% and higher on creator-focused brands, alongside single digits on big retail names — so a rate is judged against the whole deal, never alone.",
    redFlag:
      "A rate quoted only as “up to X%” with no base rate stated, or a rate the brand will not put in writing.",
    counter:
      "Thank you for the offer — based on the production time my videos take, could we start at a higher rate, or start at yours with a written review after my first three posts so the rate can grow with the results?",
  },
  {
    id: "cap",
    name: "Earnings cap",
    meaning: "A maximum total amount the program will pay you, no matter how much you sell.",
    strong:
      "No cap at all. Verified-uncapped programs exist and publish it in their own terms — a ceiling is a choice the brand makes, not a law of the industry.",
    redFlag:
      "A cap buried in the terms, or a cap low enough that one video that takes off could hit it and stop your earnings mid-series.",
    counter:
      "I build series around products that perform, so an earnings cap would stop me mid-run — could we remove the cap, or set it high enough that neither of us expects to reach it?",
  },
  {
    id: "cookie",
    name: "Cookie / attribution window",
    meaning: "How many days after a viewer clicks your link a purchase still counts as your sale.",
    strong:
      "Strong programs commonly publish 30–90 day windows, because videos keep getting discovered long after posting day.",
    redFlag:
      "A window under 14 days — especially a 24-hour or same-session window — which credits almost none of the sales your video actually causes.",
    counter:
      "My videos keep being discovered for weeks after they post — could we extend the attribution window to 30 days, so the sales the content causes still count for both of us?",
  },
  {
    id: "exclusivity",
    name: "Exclusivity",
    meaning:
      "A promise that you will not promote competing brands — sometimes one category, sometimes everything — for a set period.",
    strong:
      "No exclusivity, or narrow category exclusivity that is short (around a launch) and paid for as its own line item.",
    redFlag:
      "Total or open-ended exclusivity demanded for free, with no time limit and no extra fee — it quietly taxes every other deal you could have taken.",
    counter:
      "I can offer exclusivity in this category for 30 days around the launch — beyond that I would need to keep my options open, unless we agree a separate fee for a longer hold.",
  },
  {
    id: "usage",
    name: "Usage rights / paid media",
    meaning:
      "Permission for the brand to reuse your video — on their own channels, or as paid advertising (whitelisting / paid usage).",
    strong:
      "Organic posting on your own channels is what the commission covers; any paid use is licensed separately, for a named term and a separate fee.",
    redFlag:
      "“Full usage rights in perpetuity” bundled into a commission-only deal — the brand can run your face in ads forever while you earn only when your links convert.",
    counter:
      "My commission covers organic posting on my own channels — if you would like to run the video as paid media, I am glad to license it separately for a set term at a fair fee.",
  },
  {
    id: "payment",
    name: "Payment threshold & timing",
    meaning: "How much you must earn before the brand pays out, and how long after a sale the money actually reaches you.",
    strong:
      "Monthly payouts with a low or no minimum threshold, on a clear schedule — strong programs commonly pay within about 30 days of the period's end.",
    redFlag:
      "A high threshold plus slow timing: small balances sit locked for months, and “paid eventually” quietly becomes “paid never” if you stop promoting.",
    counter:
      "Could we pay out monthly without a high minimum threshold, on a net-30 schedule? Predictable timing helps me plan production, and I am flexible on almost everything else.",
  },
  {
    id: "tiers",
    name: "Tier step-ups",
    meaning: "Automatic rate increases when you pass agreed milestones — sales volume, revenue, or posts delivered.",
    strong:
      "Written step-ups you can plan around: the rate rises at stated milestones without you having to re-negotiate from zero.",
    redFlag:
      "“We will revisit the rate later” with nothing in writing — later usually means never, and your best-performing period gets paid at your starter rate.",
    counter:
      "I am happy to start at your rate if we write in a step-up — for example, the rate rises once my links pass an agreed sales milestone.",
  },
  {
    id: "seeding",
    name: "Product / seeding",
    meaning: "The product the brand sends you to create with — whether it is free, loaned, or something you are expected to buy yourself.",
    strong:
      "The product is provided free, in time to create properly, with no obligation to post a positive review — honest content is what converts.",
    redFlag:
      "Being asked to buy the product yourself, or seeding tied to a guaranteed positive review. Your audience's trust is the asset, and it is not the brand's to spend.",
    counter:
      "I create with product provided ahead of filming, and I keep my reviews honest either way — that honesty is exactly what makes my recommendations convert.",
  },
];

export interface Principle {
  title: string;
  text: string;
}

export const PRINCIPLES: Principle[] = [
  {
    title: "Negotiate the term, not just the rate",
    text: "The rate is the number everyone stares at, but the cap, the window, and the usage clause decide what the rate is actually worth. A deal is eight terms, not one.",
  },
  {
    title: "A cap removed can be worth more than 5% more rate",
    text: "Five points more on a capped program still stops at the ceiling. An uncapped program keeps paying on the video that takes off in month three — the one nobody can predict.",
  },
  {
    title: "Usage is a separate fee",
    text: "Commission pays for the sale your content causes. Paid media pays for the brand running your content as their ad. Two different products — priced separately, licensed for a set term.",
  },
  {
    title: "Get it in writing",
    text: "If a term is not in the agreement or the published program terms, it does not exist. Verbal promises do not survive a change of staff at the brand.",
  },
  {
    title: "Make it easy to say yes. Make it equally safe to say no.",
    text: "The UltraVestra standard. Every counter in this coach is written that way — a clear ask, a real alternative, and a door left open. Brands re-hire creators who negotiate like professionals.",
  },
];

export const HONESTY_NOTE =
  "Educational tool — not legal advice. Every counter line is a template: adapt the words to the brand, the deal, and your own voice before you send.";

export const CLOSING_LINE = "Don\u2019t just accept the offer. Understand the terms behind it.";
