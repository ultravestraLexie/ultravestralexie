// The Nine Galactic Pillars — static content for /pillars.
// (Named galactic-pillars because lib/pillars.ts already holds the
// unrelated 12 Pillars of Creator Mastery for the LIVE mastery layer.)
//
// HONESTY RULE (binding, owner decisions 2026-11-22): every pillar's
// copy must describe the platform as it exists today. Tool links point
// only at real, live routes. Protection has NO tools and says so.
// Negotiation and Performance are presented as developing areas and
// say so. No fabricated data, no implied functionality.

export type PillarTool = {
  label: string;
  href: string;
};

export type GalacticPillar = {
  id: string;
  number: string;
  name: string;
  identity: string;
  promise: string;
  tagline: string;
  accent: string;
  description: string;
  whyItMatters: string;
  benefits: string[];
  tools: PillarTool[];
  statusNote?: string;
};

export const GALACTIC_PILLARS: GalacticPillar[] = [
  {
    id: "discovery",
    number: "01",
    name: "Discovery",
    identity: "The Search Portal",
    promise: "Find the right opportunities",
    tagline: "Find legitimate brands worth your time.",
    accent: "#EBC778",
    description:
      "Search a researched directory of 2,348 published brands, describe the opportunity you want in plain words, and see the picks the Opportunity Radar surfaces. Every brand carries its scores, evidence, contacts, and program details — discovery here starts from research, not guesswork.",
    whyItMatters:
      "Creators lose hours pitching brands that were never a fit. A researched directory turns cold outreach into a shortlist.",
    benefits: [
      "2,348 researched, published brands",
      "Plain-language opportunity search",
      "Scores and evidence on every brand profile",
      "Save the brands worth a second look",
    ],
    tools: [
      { label: "Opportunity Finder", href: "/discover" },
      { label: "Brand Directory", href: "/brands" },
      { label: "Opportunity Radar", href: "/radar" },
      { label: "Saved Brands", href: "/saved" },
    ],
  },
  {
    id: "intelligence",
    number: "02",
    name: "Intelligence",
    identity: "The Neural Brain",
    promise: "Know more. Decide better.",
    tagline: "Understand a brand before you commit.",
    accent: "#39CFFF",
    description:
      "Campaign Match scores a partnership against your niches, platform, and audience — with a reliability floor that names unknown or conflicted terms instead of hiding them. Trend Radar shows what the directory itself is doing, and the Creator Lab and Buyer Brain test your video against five simulated buyers before a brand ever sees it.",
    whyItMatters:
      "A bad partnership costs more than a missed one. Evidence first means the unknowns are on the table before you agree, not after.",
    benefits: [
      "Deterministic partnership briefs with named unknowns",
      "Directory trend aggregates — top categories, newest brands",
      "Five-buyer video diagnosis, traced to your script",
      "Commission structures compared across the directory",
    ],
    tools: [
      { label: "Campaign Match", href: "/campaign-match" },
      { label: "Trend Radar", href: "/trend-radar" },
      { label: "Creator Lab", href: "/creator-lab" },
      { label: "Buyer Brain Simulator", href: "/buyer-brain" },
      { label: "Commission Intelligence", href: "/commissions" },
    ],
    statusNote:
      "Trend Radar's live web layer is not connected yet — it reports directory data only, and says so on its page.",
  },
  {
    id: "relationships",
    number: "03",
    name: "Relationships",
    identity: "Connected Hands",
    promise: "Build lasting partnerships",
    tagline: "Your proof, ready when a brand asks.",
    accent: "#986BFF",
    description:
      "Your Reputation Passport holds your collaborations, portfolio, performance, testimonials, and credentials in one proof library. The Proposal Builder turns that proof into a partnership proposal — and tracks it from draft to sent, accepted, or declined.",
    whyItMatters:
      "Brands say yes to creators who make the decision easy. Proof that is organized and ready beats a media kit rebuilt from scratch every time.",
    benefits: [
      "One proof library: collaborations, portfolio, performance, testimonials, credentials",
      "Proposals composed from your own Passport proof points",
      "Proposal status tracked: draft, sent, accepted, declined",
    ],
    tools: [
      { label: "Reputation Passport", href: "/me#passport" },
      { label: "Proposal Builder", href: "/proposals" },
    ],
    statusNote:
      "Passport entries are creator-reported and labeled as such — UltraVestra does not verify them for you.",
  },
  {
    id: "negotiation",
    number: "04",
    name: "Negotiation",
    identity: "The Interface",
    promise: "Negotiate from evidence",
    tagline: "A developing pillar — support, not a dedicated tool.",
    accent: "#3ECF8E",
    description:
      "UltraVestra does not have a dedicated negotiation tool yet, and this page will not pretend otherwise. What exists today is negotiation support: Campaign Match briefs tell you Pursue, Negotiate First, or Skip — and name the unknown or conflicted terms to pin down before you agree. The Proposal Builder is where you state your own terms in writing, and the Academy's commission-negotiation lesson teaches the approach.",
    whyItMatters:
      "Most creators negotiate blind. Knowing which terms are unknown — and having your own terms in writing — is the strongest position available today.",
    benefits: [
      "Match verdicts that flag when to negotiate first",
      "Unknown and conflicted terms named before you agree",
      "Your terms stated in a written proposal",
      "A commission-negotiation lesson in the Academy",
    ],
    tools: [
      { label: "Campaign Match", href: "/campaign-match" },
      { label: "Proposal Builder", href: "/proposals" },
      { label: "Negotiation Lesson", href: "/creator-growth/commission-negotiation" },
    ],
    statusNote:
      "Developing area: a dedicated negotiation workflow is not part of the platform today.",
  },
  {
    id: "protection",
    number: "05",
    name: "Protection",
    identity: "The Shield",
    promise: "Protect what you've built",
    tagline: "A principle pillar — dedicated tools are not currently available.",
    accent: "#55E8E5",
    description:
      "Protection is one of the nine functions of a successful creator business: agreements, usage rights, deliverables, and deadlines deserve the same discipline as revenue. UltraVestra states this plainly — dedicated protection tools are not currently available on the platform. There is no agreement manager, no usage-rights monitor, and no deadline tracker behind this pillar today, and this page will not dress up another feature as one.",
    whyItMatters:
      "A creator's work is their business. Untracked usage rights and missed deadlines quietly cost money and ownership — which is why protection stands as a pillar even before it stands as a tool.",
    benefits: [
      "Agreements deserve written terms before work begins",
      "Usage rights are part of your compensation",
      "Deliverables and deadlines protect both sides",
      "Partnership briefs and proposals are stored records you can return to",
    ],
    tools: [],
    statusNote:
      "Dedicated protection tools are not currently available. This pillar states the principle; it does not offer a protection feature.",
  },
  {
    id: "revenue",
    number: "06",
    name: "Revenue",
    identity: "The Core",
    promise: "Track & grow your earnings",
    tagline: "Know what you're owed, and what has landed.",
    accent: "#EBC778",
    description:
      "The Revenue Tracker records the earnings you report — pending and received — and totals them for you, with monthly buckets computed from your own entries. Commission Intelligence shows what brands in the directory pay, so you can compare an offer against the market before you accept it.",
    whyItMatters:
      "Money you don't track is money you negotiate without. Clear pending-versus-received numbers keep every follow-up factual.",
    benefits: [
      "Pending and received totals from your own entries",
      "Monthly earnings buckets, computed in code",
      "Directory commission evidence to benchmark offers",
      "No estimates — if you didn't enter it, it isn't counted",
    ],
    tools: [
      { label: "Revenue Tracker", href: "/revenue" },
      { label: "Commission Intelligence", href: "/commissions" },
    ],
    statusNote:
      "UltraVestra does not receive your affiliate payouts and does not estimate earnings. Invoicing is not part of the platform today.",
  },
  {
    id: "growth",
    number: "07",
    name: "Growth",
    identity: "The Ascension",
    promise: "Grow with a plan",
    tagline: "Objectives, experiments, and gaps — yours to run.",
    accent: "#B26BFF",
    description:
      "The Growth Map is your planning workspace: set objectives, run experiments, and name the gaps in your business, each with a status you control. The Video Intelligence Lab and Creator Academy give you approaches to test inside those experiments, and the Creator Growth Center gathers your earnings, posting consistency, and connections into one hub.",
    whyItMatters:
      "Growth that isn't planned is luck. A written objective and a tracked experiment turn luck into a method.",
    benefits: [
      "Objectives, experiments, and gaps with clear statuses",
      "Experiment results recorded in your own words",
      "Lessons and coaching approaches in the Academy",
      "A plan that is yours — not platform analytics dressed as advice",
    ],
    tools: [
      { label: "Growth Map", href: "/growth-map" },
      { label: "Creator Growth Center", href: "/growth-center" },
      { label: "Video Intelligence Lab", href: "/coach" },
      { label: "Creator Academy", href: "/academy" },
    ],
  },
  {
    id: "performance",
    number: "08",
    name: "Performance",
    identity: "The Orbit",
    promise: "Measure what matters",
    tagline: "A developing pillar — your numbers in one place.",
    accent: "#2DD4BF",
    description:
      "UltraVestra does not offer dedicated performance analytics yet. What exists today is your own numbers gathered in one place: the Command Center brings together your revenue totals, new alerts, growth activity, proposal statuses, Passport entries, and match briefs — and the Revenue Tracker breaks your earnings down by month. The Creator Growth Center adds your posting log and your platform connection states to that picture — every figure from records you entered, not platform analytics. That is the honest extent of performance measurement on the platform today.",
    whyItMatters:
      "You cannot improve what you cannot see. A truthful roll-up of your own numbers beats a dashboard of invented metrics.",
    benefits: [
      "Eight cards of your own numbers, in one view",
      "Revenue totals with monthly breakdowns",
      "Counts drawn only from your stored records — nothing fabricated",
      "Every card links straight to the feature behind the number",
    ],
    tools: [
      { label: "Command Center", href: "/command-center" },
      { label: "Creator Growth Center", href: "/growth-center" },
      { label: "Revenue Tracker", href: "/revenue" },
    ],
    statusNote:
      "Developing area: partnership-performance analytics and profitability analysis are not part of the platform today.",
  },
  {
    id: "nexus",
    number: "09",
    name: "Intelligence & Automation",
    identity: "The Nexus",
    promise: "Turn insight into action.",
    tagline: "The Nexus — where the platform's intelligence connects.",
    accent: "#A855F7",
    description:
      "The Nexus is the operating layer across the other eight pillars. The Command Center gathers your business into one view, and Opportunity Alerts watch the directory for you — new brands and programs that match your niches, counted from the moment you last looked. Insight arrives as action items, not trivia.",
    whyItMatters:
      "Intelligence that sits still is trivia. Automation that watches the directory while you create is leverage.",
    benefits: [
      "One hub view across revenue, alerts, growth, proposals, and more",
      "Alerts for new brands and programs since your last check",
      "Filtered by your niches — or everything, your choice",
      "Every insight links to the tool that acts on it",
    ],
    tools: [
      { label: "Command Center", href: "/command-center" },
      { label: "Opportunity Alerts", href: "/alerts" },
      { label: "Dashboard", href: "/dashboard" },
    ],
    statusNote: "Alerts are in-app today; email delivery is not connected.",
  },
];
