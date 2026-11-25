import type { BrainAgent } from "@/lib/galaxy/engine";

/* VESTRA BRAIN — command routing (rebuild Phase 1).
 *
 * The Command Center's first language layer: deterministic intent
 * routing over the platform's REAL destinations. A command either
 * resolves to a real place with a real next action, or it does not
 * resolve at all — the UI then says plainly what the Brain can do
 * today instead of pretending. No invented answers, no fake data:
 * the numbers live on the pages this routes to.
 *
 * His law (2026-11-24): if it is there, it leads to something. */

export type BrainIntent = {
  key: string;
  agent: BrainAgent;
  title: string;
  blurb: string;
  href: string;
  cta: string;
};

export type BrainRoute = { intent: BrainIntent; query: string | null };

const FILLER = new Set([
  "find", "me", "show", "brands", "brand", "that", "fit", "fits",
  "my", "audience", "for", "the", "a", "an", "please", "search",
  "looking", "look", "get", "give", "list", "of", "in", "on",
]);

function brandQuery(text: string): string | null {
  const words = text
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !FILLER.has(w));
  return words.length ? words.join(" ") : null;
}

export function routeBrainCommand(raw: string): BrainRoute | null {
  const text = raw.toLowerCase().trim();
  if (!text) return null;
  const has = (...needles: string[]) => needles.some((n) => text.includes(n));

  if (has("follow up", "follow-up", "followup", "haven't booked", "havent booked", "win back", "customers who")) {
    return {
      query: null,
      intent: {
        key: "follow-ups",
        agent: "Retention Agent",
        title: "Customers due a follow-up",
        blurb: "Past customers whose last payment is 30+ days old with no active deal — your follow-up list, computed from your real payments.",
        href: "/retention",
        cta: "See follow-ups",
      },
    };
  }
  if (has("overdue", "collect", "owed to me", "who owes", "unpaid invoice")) {
    return {
      query: null,
      intent: {
        key: "collect",
        agent: "Financial Agent",
        title: "Collect what you are owed",
        blurb: "Your invoiced and overdue deals, with the amounts, in Deals — the same records behind your Money.",
        href: "/deals",
        cta: "Open Deals",
      },
    };
  }
  if (has("brand")) {
    const query = brandQuery(text);
    return {
      query,
      intent: {
        key: "find-brands",
        agent: "Brand Agent",
        title: query ? `Brands matching “${query}”` : "Find brands that fit you",
        blurb: "The directory — brands, agencies and small businesses with real creator programs and published contacts.",
        href: "/brands",
        cta: "Open the directory",
      },
    };
  }
  if (has("creators for my business", "find creators", "hire a creator", "hire creators")) {
    return {
      query: null,
      intent: {
        key: "find-creators",
        agent: "Business Agent",
        title: "Creators for your business",
        blurb: "Businesses hire and manage creators from the business side of the ecosystem — Market is where that starts: register the business, then its workspace holds campaigns and creators.",
        href: "/market",
        cta: "Open Market",
      },
    };
  }
  if (has("campaign")) {
    return {
      query: null,
      intent: {
        key: "campaigns",
        agent: "Marketing Agent",
        title: "Your campaigns",
        blurb: "Every campaign you are part of lives as a deal — pitched, negotiating, contracted, delivering — with its money attached. That is your campaign view.",
        href: "/deals",
        cta: "Open Deals",
      },
    };
  }
  if (has("best content", "performs best", "performing", "my content", "analytics")) {
    return {
      query: null,
      intent: {
        key: "best-content",
        agent: "Creator Agent",
        title: "What your content is doing",
        blurb: "Studio holds your content pipeline and your Content DNA — what you made, what is scheduled, and the patterns behind it.",
        href: "/studio",
        cta: "Open Studio",
      },
    };
  }
  if (has("prepare my video", "publish", "post a video", "upload")) {
    return {
      query: null,
      intent: {
        key: "prepare-video",
        agent: "Creator Agent",
        title: "Prepare your video in Studio",
        blurb: "Upload a real video and Studio's Brain checks it — pacing, pauses, hooks — before anything is published. You approve the final cut.",
        href: "/studio",
        cta: "Open Studio",
      },
    };
  }
  if (has("customer")) {
    return {
      query: null,
      intent: {
        key: "customers",
        agent: "Business Agent",
        title: "Your customers",
        blurb: "Brands that have paid you are your customers — the list is built from your paid deals and always current.",
        href: "/customers",
        cta: "Open Customers",
      },
    };
  }
  if (has("money", "revenue", "earnings", "earned", "income")) {
    return {
      query: null,
      intent: {
        key: "money",
        agent: "Financial Agent",
        title: "Your money",
        blurb: "Collected, owed and overdue — computed from your deals, never estimated.",
        href: "/me",
        cta: "Open My Universe",
      },
    };
  }
  if (has("opportunit")) {
    return {
      query: null,
      intent: {
        key: "opportunities",
        agent: "Brand Agent",
        title: "Your opportunities",
        blurb: "Open opportunities matched to your profile — apply from the opportunity itself.",
        href: "/me/opportunities",
        cta: "See opportunities",
      },
    };
  }
  return null;
}

/* The suggestion chips under the command box — every one of these
 * routes somewhere real (his law), and the fixtures pin that. */
export const BRAIN_SUGGESTIONS: string[] = [
  "Find brands that fit my audience",
  "Follow up with customers who haven't booked",
  "Show me which content performs best",
  "Prepare my video for publication",
  "Find creators for my business",
  "Analyze my campaign",
];
