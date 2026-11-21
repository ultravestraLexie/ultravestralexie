/* UltraVestra search engine — turns a plain-words creator question into
 * ranked brand matches from the researched database.
 * Pure functions only: tokenize the question, expand synonyms, extract
 * structured intent (uncapped, smaller creators, platform, minimum rate),
 * then score every brand by how well its name, categories, network,
 * country and description match the words. Nothing is invented — a brand
 * only ranks for words its own researched record actually contains. */

export interface SearchIntent {
  uncapped: boolean;
  small: boolean;
  platform: string;
  minRate: number | null;
  tokens: string[];
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "want", "wants", "need", "needs",
  "show", "make", "makes", "making", "better", "best", "good", "great", "work",
  "works", "working", "brand", "brands", "creator", "creators", "affiliate",
  "commission", "commissions", "program", "programs", "video", "videos",
  "content", "please", "find", "give", "get", "got", "can", "could", "would",
  "should", "i'm", "im", "i", "me", "my", "a", "an", "of", "to", "in", "on",
  "is", "are", "be", "am", "who", "how", "what", "which", "any", "all", "only",
  "them", "they", "their", "it", "its", "do", "does", "like", "love", "really",
  "very", "just", "also", "more", "most", "some", "into", "about", "help",
]);

const SYNONYMS: Record<string, string[]> = {
  makeup: ["beauty", "cosmetic", "cosmetics"],
  cosmetics: ["beauty", "makeup", "cosmetic"],
  cosmetic: ["beauty", "makeup"],
  skincare: ["skin", "beauty"],
  skin: ["skincare"],
  hair: ["beauty"],
  nails: ["beauty"],
  fragrance: ["beauty", "perfume"],
  perfume: ["fragrance", "beauty"],
  dogs: ["dog", "pet", "pets"],
  dog: ["pets", "pet"],
  cats: ["cat", "pet", "pets"],
  cat: ["pets", "pet"],
  pet: ["pets"],
  clothes: ["clothing", "fashion", "apparel"],
  clothing: ["fashion", "apparel"],
  apparel: ["fashion", "clothing"],
  shoes: ["footwear", "fashion"],
  footwear: ["shoes", "fashion"],
  jewelry: ["fashion", "accessories"],
  watches: ["watch", "fashion"],
  watch: ["watches"],
  gym: ["fitness", "workout"],
  workout: ["fitness", "gym"],
  exercise: ["fitness"],
  food: ["food-drink"],
  drink: ["food-drink", "beverage"],
  beverage: ["drink", "food-drink"],
  coffee: ["food-drink"],
  tea: ["food-drink"],
  supplement: ["supplements", "wellness", "health"],
  supplements: ["supplement", "wellness"],
  vitamins: ["supplement", "health", "wellness"],
  protein: ["supplement", "fitness", "nutrition"],
  nutrition: ["health", "food", "supplement"],
  tech: ["technology", "gadget", "gadgets"],
  gadget: ["technology"],
  gadgets: ["technology", "gadget"],
  gaming: ["technology"],
  electronics: ["technology"],
  decor: ["home"],
  household: ["home"],
  cleaning: ["home"],
  mattress: ["sleep", "home"],
  sleep: ["mattress", "wellness"],
  trip: ["travel"],
  trips: ["travel"],
  vacation: ["travel"],
  outdoors: ["travel", "fitness"],
  camping: ["travel", "outdoors"],
};

export function tokenize(text: string): string[] {
  const raw = text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const w of raw) {
    if (w.length < 3 || STOPWORDS.has(w)) continue;
    out.push(w);
    for (const s of SYNONYMS[w] ?? []) if (!out.includes(s)) out.push(s);
  }
  return out;
}

export function extractIntent(q: string): SearchIntent {
  const text = q.toLowerCase();
  let minRate: number | null = null;
  const pct = text.match(/(\d{1,3})\s*%/g);
  if (pct) {
    for (const p of pct) {
      const n = parseInt(p, 10);
      const idx = text.indexOf(p);
      const before = text.slice(Math.max(0, idx - 22), idx);
      const after = text.slice(idx + p.length, idx + p.length + 14);
      if (/at least|over|above|minimum|min\.?|more than|higher than/.test(before) || /or more|or higher|\+|and up/.test(after)) {
        minRate = minRate == null ? n : Math.max(minRate, n);
      }
    }
  }
  return {
    uncapped: text.includes("uncapped") || text.includes("no cap") || text.includes("unlimited earning"),
    small:
      text.includes("smaller creator") || text.includes("small creator") || text.includes("beginner") ||
      text.includes("new creator") || text.includes("micro") || text.includes("small audience") ||
      text.includes("few followers") || text.includes("small following"),
    platform: text.includes("trybe")
      ? "Trybe"
      : text.includes("youtube")
        ? "YouTube"
        : text.includes("instagram")
          ? "Instagram"
          : text.includes("tiktok") || text.includes("tik tok")
            ? "TikTok"
            : "",
    minRate,
    tokens: tokenize(q),
  };
}

export interface BrandSearchFields {
  name: string;
  description: string | null;
  categoryNames: string[];
  categorySlugs: string[];
  network: string | null;
  country: string | null;
}

export function scoreBrand(fields: BrandSearchFields, tokens: string[]): { relevance: number; reasons: string[] } {
  if (!tokens.length) return { relevance: 0, reasons: [] };
  let relevance = 0;
  const reasons: string[] = [];
  const nameWords = fields.name.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const nameFull = fields.name.toLowerCase();
  const catWords = fields.categoryNames.map((c) => c.toLowerCase());
  const catSlugs = fields.categorySlugs.map((s) => s.toLowerCase());
  const network = (fields.network ?? "").toLowerCase();
  const country = (fields.country ?? "").toLowerCase();
  const desc = (fields.description ?? "").toLowerCase();

  for (const t of tokens) {
    if (nameWords.includes(t)) {
      relevance += 50;
      if (!reasons.includes("Name match")) reasons.push("Name match");
    } else if (t.length >= 4 && nameFull.includes(t)) {
      relevance += 30;
      if (!reasons.includes("Name match")) reasons.push("Name match");
    }
    for (let i = 0; i < catWords.length; i++) {
      if (catWords[i] === t || catSlugs[i] === t || catWords[i].split(/\s+/).includes(t)) {
        relevance += 40;
        const label = fields.categoryNames[i];
        if (!reasons.includes(label)) reasons.push(label);
      }
    }
    if (network && (network === t || network.split(/\s+/).includes(t))) {
      relevance += 25;
      const label = `On ${fields.network}`;
      if (!reasons.includes(label)) reasons.push(label);
    }
    if (country && country.split(/[\s,]+/).includes(t)) {
      relevance += 10;
      if (!reasons.includes(fields.country as string)) reasons.push(fields.country as string);
    }
    if (desc && new RegExp(`\\b${t.replace(/[^a-z0-9-]/g, "")}\\b`).test(desc)) {
      relevance += 8;
    }
  }
  return { relevance, reasons: reasons.slice(0, 3) };
}
