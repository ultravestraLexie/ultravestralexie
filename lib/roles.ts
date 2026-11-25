/* ROLE EXPLAINERS — owner order 2026-11-24 ~11:39 CT: the four
 * "Who are you?" cards on the landing must ALL lead somewhere real —
 * in the prototype the agency and brand cards were dead "Soon" cards.
 * Each card now opens /roles/<role>, a page that explains what that
 * role is looking for and what it gets on UltraVestra, with one call
 * to action into the real flow (creator plan signup, or free business
 * registration with the type preselected).
 *
 * Pure data + helpers only — no server imports — so the regression
 * fixtures can pin the wiring without a database.
 *
 * Honesty rules for this copy:
 *  - Business / brand / agency registration is LIVE and free, so no
 *    "Soon" and no "Phase 5" anywhere.
 *  - The business home opens as an on-device preview on sample data
 *    while creator matching rolls out — the note on those three pages
 *    says exactly that, matching the status block on /business/home.
 *  - Directory counts are stated as floors ("3,500+") so the copy
 *    stays true as the directory grows. */

export interface RoleInfo {
  slug: string;
  label: string;
  title: string;
  desc: string;
  icon: string;
  bg: string;
  fg: string;
  lookingFor: string[];
  gets: string[];
  note: string;
  ctaLabel: string;
  ctaHref: string;
}

const BUSINESS_NOTE =
  "Honest note: your business home opens as a preview that runs on this device while matching with real creators rolls out. Registering today saves your details and your place — no card required.";

export const ROLES: RoleInfo[] = [
  {
    slug: "creator",
    label: "For creators",
    title: "I’m a creator",
    desc: "Find paid local gigs, get paid on time, and prove the customers you bring.",
    icon: "video",
    bg: "rgba(245,196,81,.16)",
    fg: "#F5C451",
    lookingFor: [
      "Paid local gigs from businesses near you",
      "Brand deals that fit your audience — no follower minimum",
      "Getting paid on time, and proof of the customers you bring",
    ],
    gets: [
      "Local opportunities posted by businesses looking for creators like you",
      "A directory of 3,500+ brands and agencies, with the real contact route for each one",
      "A pitch writer and a Deals board that tracks every pitch from sent to paid",
      "Money and a Passport that prove what you have earned",
      "Studio tools that sharpen every video before it goes out",
    ],
    note: "Creators join with a plan. Pick yours and your first pitch can go out today.",
    ctaLabel: "Start as a creator",
    ctaHref: "/get-started",
  },
  {
    slug: "business",
    label: "For local businesses",
    title: "I’m a business",
    desc: "Post what you need, find local creators, and turn views into loyal customers.",
    icon: "store",
    bg: "rgba(62,230,224,.14)",
    fg: "#3EE6E0",
    lookingFor: [
      "Local creators who put your business in front of nearby customers",
      "Content you can post, share and reuse",
      "A way to turn views into customers who come back",
    ],
    gets: [
      "Free registration — no card required",
      "A business home with campaigns, creators and customers in one place",
      "Post what you need and find local creators who fit",
      "Follow-up tools that bring customers back",
    ],
    note: BUSINESS_NOTE,
    ctaLabel: "Register your business — free",
    ctaHref: "/business/register?type=brand",
  },
  {
    slug: "agency",
    label: "For agencies",
    title: "I’m an agency",
    desc: "Represent creators, pitch them to opportunities, and run campaigns for your clients.",
    icon: "building",
    bg: "rgba(255,156,200,.14)",
    fg: "#FF9CC8",
    lookingFor: [
      "Creators to represent, grow and place",
      "Campaigns and clients managed in one place",
      "Brands looking for managed talent",
    ],
    gets: [
      "Free agency registration — no card required",
      "A business home for your campaigns, creators and clients",
      "A place in the directory creators browse — 530+ agencies are already listed",
      "One home for the work, instead of scattered messages",
    ],
    note: BUSINESS_NOTE,
    ctaLabel: "Register your agency — free",
    ctaHref: "/business/register?type=agency",
  },
  {
    slug: "brand",
    label: "For brands",
    title: "I’m a brand",
    desc: "Run campaigns with dozens of creators across cities, and keep your best as ambassadors.",
    icon: "crown",
    bg: "rgba(182,156,255,.16)",
    fg: "#B69CFF",
    lookingFor: [
      "Partnerships and influencer campaigns at scale",
      "Creators whose audiences actually trust them",
      "Proof that the spend brought customers",
    ],
    gets: [
      "Free brand registration — no card required",
      "A business home with campaigns, creators and customers in one place",
      "Campaigns that reach creators through the directory",
      "Follow-up tools that turn one post into repeat customers",
    ],
    note: BUSINESS_NOTE,
    ctaLabel: "Register your brand — free",
    ctaHref: "/business/register?type=brand",
  },
];

export function roleBySlug(slug: string): RoleInfo | null {
  return ROLES.find((r) => r.slug === slug) ?? null;
}

export function otherRoles(slug: string): RoleInfo[] {
  return ROLES.filter((r) => r.slug !== slug);
}
