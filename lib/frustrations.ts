/* ULTRAVESTRA — THE PROBLEM-FIRST LAYER — structured data.
 * Creators don't just complain about getting views. Their biggest
 * frustration is spending hours creating content and still having
 * no idea why it's not growing, getting engagement, or making
 * money. UltraVestra is organized around the problems creators
 * came to solve — not around random articles. This file carries
 * his 12 frustrations (with the creators' own words), the five
 * problem worlds they map to, and the troubleshooter data behind
 * the signature feature "WHY IS MY VIDEO NOT WORKING?" — every
 * diagnosis framed as an investigation: possibilities to check,
 * not automatic explanations. Extracted faithfully from the
 * source document in content/creator-frustrations.md. */

/* ---------- The framing ---------- */
export const CORE_FRUSTRATION =
  "Creators can spend hours creating content and still have no idea why it's not growing, getting engagement, or making money.";

export const OPPORTUNITY_LINE =
  "Build resources around the problems creators are already desperate to solve, not just topics that sound interesting.";

export const PRINCIPLES: string[] = [
  "Don't just tell creators what to do. Teach them how to identify the problem themselves.",
  "Build UltraVestra around solving creator problems, not publishing generic creator tips.",
];

export const VISION_LINE =
  "A place creators return to whenever they get stuck.";

/* ---------- The five problem worlds ---------- */
export interface WorldTool {
  name: string;
  href: string;
  note: string;
}

export interface World {
  n: number;
  theme: string;
  name: string;
  promise: string;
  topics: string[];
  tools: WorldTool[];
}

export const WORLDS: World[] = [
  {
    n: 1,
    theme: "Attention",
    name: "The Scroll Stop Lab",
    promise: "How to get people to stop, watch, and stay.",
    topics: ["Hooks", "First-frame psychology", "Retention", "Storytelling", "Video breakdowns"],
    tools: [
      {
        name: "First 3 Seconds",
        href: "/creator-growth/first-3-seconds",
        note: "Win the scroll or lose the viewer — the first frame, the hook, the reason to stay.",
      },
      {
        name: "The Art of Captivating Attention",
        href: "/creator-growth/art-of-captivating-attention",
        note: "The attention triggers, plus the Human Attention Reactor to build an opening.",
      },
      {
        name: "Hook Decoder & Scroll Stop Score",
        href: "/secret-weapon#psychology-lab",
        note: "Decode what your hook is doing and score its scroll-stopping power.",
      },
      {
        name: "Human Emotion Video Playbook",
        href: "/creator-growth/human-emotion-video-playbook",
        note: "The emotion labs — concepts, formulas, and openings built to hold watch time.",
      },
    ],
  },
  {
    n: 2,
    theme: "Sales",
    name: "The Conversion Lab",
    promise: "How to turn attention into buying interest.",
    topics: ["TikTok Shop", "Creator scripts", "Product demonstrations", "Buyer psychology", "Sales objections"],
    tools: [
      {
        name: "The Human Buying Lab",
        href: "/human-buying-lab",
        note: "Practice what makes people pay attention, develop interest, and decide.",
      },
      {
        name: "The 10 Psychological Triggers",
        href: "/creator-growth/ten-psychological-triggers",
        note: "The signature lesson behind videos that sell — plus the Pre-Publishing Test.",
      },
      {
        name: "The Product-to-Purchase Lab",
        href: "/creator-growth/product-to-purchase-lab",
        note: "Evaluate a video from first frame to purchase decision, question by question.",
      },
      {
        name: "The Human Behind the View",
        href: "/creator-growth/human-behind-the-view",
        note: "Audience psychology and advertising intelligence — the Ad Architect and Ad Diagnostic.",
      },
      {
        name: "Conversion Clinic",
        href: "/secret-weapon#sales-vault",
        note: "Bring a symptom — leave with the stage to repair.",
      },
    ],
  },
  {
    n: 3,
    theme: "Opportunity",
    name: "The Brand Observatory",
    promise: "Where creators discover worthwhile partnerships.",
    topics: [
      "Brand opportunities",
      "Affiliate programs",
      "Commission terms",
      "Application requirements",
      "Partnership education",
    ],
    tools: [
      {
        name: "Opportunity Finder",
        href: "/discover",
        note: "Search verified brand programs scored for creator fit.",
      },
      {
        name: "Brand Opportunity Radar",
        href: "/radar",
        note: "Fresh and emerging opportunities worth a closer look.",
      },
      {
        name: "Commission Intelligence",
        href: "/commissions",
        note: "Compare commission terms — capped, uncapped, or honestly unknown.",
      },
      {
        name: "Ask UltraVestra",
        href: "/ask",
        note: "Describe your niche and get matched to programs that fit.",
      },
    ],
  },
  {
    n: 4,
    theme: "Improvement",
    name: "The Creator Diagnostic",
    promise: "Find out what's wrong with your content and how to fix it.",
    topics: ["Video audits", "Editing", "Lighting", "Audio", "Analytics", "Content improvement"],
    tools: [
      {
        name: "Why Is My Video Not Working?",
        href: "/why-is-my-video-not-working",
        note: "The signature troubleshooter — pick the symptom, learn to investigate it.",
      },
      {
        name: "Creator Video Intelligence Lab",
        href: "/coach",
        note: "Video coaching tools and the creator curriculum in one place.",
      },
      {
        name: "Ad Diagnostic",
        href: "/creator-growth/human-behind-the-view",
        note: "Symptom in, investigation out — possibilities to check, not verdicts.",
      },
      {
        name: "Autopsy Worksheet",
        href: "/secret-weapon#experiment-room",
        note: "Autopsy a real video stage by stage and find exactly where it broke.",
      },
      {
        name: "Audience First Alignment Test",
        href: "/creator-growth/audience-first-protocol",
        note: "Five questions that check whether the video is truly about them.",
      },
    ],
  },
  {
    n: 5,
    theme: "Growth",
    name: "The Creator Business School",
    promise: "Learn how to build a sustainable creator business.",
    topics: ["Negotiation", "Pricing", "Usage rights", "Brand relationships", "Workflow", "Audience growth"],
    tools: [
      {
        name: "Creator Academy",
        href: "/academy",
        note: "The structured curriculum — learn the business in order.",
      },
      {
        name: "The Art of Human Connection & Conversion",
        href: "/creator-growth/art-of-human-connection",
        note: "Don't just go LIVE. Become the reason people stay.",
      },
      {
        name: "Audience First Protocol",
        href: "/creator-growth/audience-first-protocol",
        note: "Create for the human, not the algorithm — the philosophy behind growth that lasts.",
      },
      {
        name: "The Creator's Secret Weapon",
        href: "/secret-weapon",
        note: "The full arsenal: psychology lab, sales vault, and experiment room.",
      },
    ],
  },
];

/* ---------- The 12 frustrations ---------- */
export interface FrustrationTool {
  name: string;
  href: string;
}

export interface Frustration {
  n: number;
  title: string;
  quote: string;
  need: string;
  world: number; // index into WORLDS
  first_tool: FrustrationTool;
}

export const FRUSTRATIONS: Frustration[] = [
  {
    n: 1,
    title: "Low views and unpredictable algorithms",
    quote: "Why did my video get 200 views when I worked so hard on it?",
    need: "Understand why some videos perform and others don't — starting with the opening and the audience match, not the algorithm.",
    world: 0,
    first_tool: { name: "First 3 Seconds", href: "/creator-growth/first-3-seconds" },
  },
  {
    n: 2,
    title: "Getting people to stop scrolling",
    quote: "I don't know how to make my first three seconds interesting.",
    need: "Better hooks, opening visuals, storytelling, and retention strategies.",
    world: 0,
    first_tool: { name: "The Art of Captivating Attention", href: "/creator-growth/art-of-captivating-attention" },
  },
  {
    n: 3,
    title: "Getting views but no sales",
    quote: "People watch my videos, but nobody buys.",
    need: "Know how to communicate product value, build trust, handle objections, and create effective calls to action.",
    world: 1,
    first_tool: { name: "The Human Buying Lab", href: "/human-buying-lab" },
  },
  {
    n: 4,
    title: "Finding legitimate brand deals",
    quote: "Where do I find brands that actually want to work with smaller creators?",
    need: "Opportunities, clear requirements, fair commissions, and trustworthy partnerships.",
    world: 2,
    first_tool: { name: "Opportunity Finder", href: "/discover" },
  },
  {
    n: 5,
    title: "Not knowing what they're doing wrong",
    quote: "I keep posting, but I don't know what to improve.",
    need: "Honest feedback, video breakdowns, and specific ways to fix weak content.",
    world: 3,
    first_tool: { name: "Why Is My Video Not Working?", href: "/why-is-my-video-not-working" },
  },
  {
    n: 6,
    title: "Running out of content ideas",
    quote: "What am I supposed to post tomorrow?",
    need: "Repeatable content formats, creative prompts, and ideas for different audiences.",
    world: 0,
    first_tool: { name: "Human Emotion Video Playbook", href: "/creator-growth/human-emotion-video-playbook" },
  },
  {
    n: 7,
    title: "Being underpaid by brands",
    quote: "They're asking me to make five videos for almost nothing.",
    need: "Understand rates, negotiation, usage rights, exclusivity, and licensing — and what a commission is really worth before signing.",
    world: 4,
    first_tool: { name: "Commission Intelligence", href: "/commissions" },
  },
  {
    n: 8,
    title: "Not knowing how to grow an audience",
    quote: "How do I get people to follow me instead of just watching one video?",
    need: "Positioning, audience understanding, content series, and community-building skills.",
    world: 4,
    first_tool: { name: "The Art of Human Connection & Conversion", href: "/creator-growth/art-of-human-connection" },
  },
  {
    n: 9,
    title: "Understanding different platforms",
    quote: "Should I make the same video for TikTok, Instagram, and YouTube?",
    need: "Platform-specific content strategies and repurposing techniques — different platforms reward different creative decisions.",
    world: 4,
    first_tool: { name: "Creator Academy", href: "/academy" },
  },
  {
    n: 10,
    title: "Burnout and pressure to post constantly",
    quote: "If I stop posting, I feel like I'm falling behind.",
    need: "Efficient workflows, planning systems, and sustainable creation habits.",
    world: 4,
    first_tool: { name: "Creator Academy", href: "/academy" },
  },
  {
    n: 11,
    title: "Difficult brand relationships",
    quote: "The brand keeps changing what they want after I've made the video.",
    need: "Understand briefs, deliverables, revisions, deadlines, and agreements — before the camera turns on.",
    world: 4,
    first_tool: { name: "Creator Academy", href: "/academy" },
  },
  {
    n: 12,
    title: "Not knowing which skills to learn",
    quote: "Everybody gives different advice. Who should I listen to?",
    need: "Clear, practical education instead of endless generic tips — a path, in order.",
    world: 4,
    first_tool: { name: "Creator Academy", href: "/academy" },
  },
];

/* ---------- The troubleshooter: WHY IS MY VIDEO NOT WORKING? ---------- */
export const TROUBLESHOOTER_INTRO =
  "Choose the problem you're experiencing — and learn how to investigate it.";

export const HONESTY_NOTE =
  "These are investigations, not verdicts. A symptom can have more than one cause — work the checks, compare your retention, clicks, comments, and conversions, and change one thing at a time before you conclude.";

export interface DiagnosisLab {
  name: string;
  href: string;
}

export interface Diagnosis {
  symptom: string;
  examine: string;
  checks: string[];
  first_fix: string;
  lab: DiagnosisLab;
  core?: boolean; // one of his four original example diagnoses
}

export const DIAGNOSES: Diagnosis[] = [
  {
    symptom: "People scroll away immediately",
    examine: "Examine the opening.",
    checks: [
      "Is the first frame worth looking at — movement, a close-up, a result — or are you adjusting the camera and introducing yourself?",
      "Does the first second give the right viewer a reason to stop, in words or in the visual?",
      "Would a stranger know within three seconds who this video is for and why it matters to them?",
      "Compare the first-three-second retention of this video against your last few — is the drop at the opening or later?",
    ],
    first_fix:
      "Rebuild the opening before anything else: open on the most interesting frame you have, and test the new first three seconds against the old.",
    lab: { name: "First 3 Seconds Chamber", href: "/creator-growth/first-3-seconds" },
    core: true,
  },
  {
    symptom: "People watch but don't click",
    examine: "Examine product relevance and offer clarity.",
    checks: [
      "Is this product genuinely relevant to the exact person the video is for — or interesting to watch but not theirs to buy?",
      "Can a viewer say, in one sentence, what the offer actually is?",
      "Did you demonstrate the value, or only describe it?",
      "Is the next step obvious — where to find it, what to check, how to learn more?",
    ],
    first_fix:
      "Rewrite the middle of the video around one clear offer: who it's for, what it does, shown — not just said.",
    lab: { name: "The Human Buying Lab", href: "/human-buying-lab" },
    core: true,
  },
  {
    symptom: "People click but don't purchase",
    examine: "Examine price, trust, product details, and the checkout experience.",
    checks: [
      "Does the price feel justified by the value the video demonstrated — or does the video promise more than the price page delivers?",
      "Is there honest evidence — a real demonstration, genuine reviews — or only claims?",
      "Are the details a buyer needs (size, material, how it works, limitations) answered before they have to ask?",
      "Click through your own link: does the product page match what the video said, and is checkout simple?",
    ],
    first_fix:
      "Add the missing trust piece first: one specific detail and one honest limitation, stated plainly in the video.",
    lab: { name: "Conversion Clinic", href: "/secret-weapon#sales-vault" },
    core: true,
  },
  {
    symptom: "People buy but return the product",
    examine: "Examine whether the video set accurate expectations.",
    checks: [
      "Did the video show the product as it actually is — real size, real texture, real results — or a polished version of it?",
      "Were limitations, sizing quirks, or setup steps mentioned, or quietly skipped?",
      "Read the return reasons and reviews: what did buyers expect that they didn't get?",
      "Would your own video have prepared you for what arrived?",
    ],
    first_fix:
      "Film the honest version: show the product unfiltered, name the limitation out loud, and let the right buyer self-select.",
    lab: { name: "The Product-to-Purchase Lab", href: "/creator-growth/product-to-purchase-lab" },
    core: true,
  },
  {
    symptom: "My videos get very few views at all",
    examine: "Examine the opening, the audience match, and relevance.",
    checks: [
      "Who exactly is this video for? If the honest answer is 'everyone', the video is for no one.",
      "Does the opening name or show that person in the first seconds — self-identification, not a general announcement?",
      "Is the topic something that audience already cares about, or something you wanted to post?",
      "Run the Audience First Alignment Test on the video before blaming the algorithm.",
    ],
    first_fix:
      "Pick one specific person and remake the video for them: their situation in the opening, their outcome as the promise.",
    lab: { name: "Audience First Alignment Test", href: "/creator-growth/audience-first-protocol" },
  },
  {
    symptom: "People watch but don't comment or engage",
    examine: "Examine conversation triggers and emotional connection.",
    checks: [
      "Does the video give viewers anything to respond to — a question, a choice, a relatable moment?",
      "Is there an experience or story they recognize themselves in, or only information?",
      "Did you ask one clear question a viewer can actually answer?",
      "Do you reply to early comments and build the conversation, or post and disappear?",
    ],
    first_fix:
      "End the next video with one genuine question tied to the viewer's own experience — and answer the first comments yourself.",
    lab: { name: "Human Emotion Video Playbook", href: "/creator-growth/human-emotion-video-playbook" },
  },
  {
    symptom: "Views are fine but nobody follows me",
    examine: "Examine your series, your positioning, and the promise of the next video.",
    checks: [
      "Could a new viewer say what your account is about after one video?",
      "Is this video part of a series or a recognizable format — or a one-off they'll never see again?",
      "Did the video give a reason to return: a next part, an ongoing test, a promise you'd keep?",
      "Does your profile tell a visitor, in one line, what following you gets them?",
    ],
    first_fix:
      "Turn your best-performing video into part one of a series, and say so on camera before it ends.",
    lab: { name: "The Art of Human Connection & Conversion", href: "/creator-growth/art-of-human-connection" },
  },
  {
    symptom: "I keep posting but don't know what to improve",
    examine: "Examine the video itself — run a structured evaluation instead of guessing.",
    checks: [
      "Run the Product-to-Purchase evaluation: first frame, hook, demonstration, benefits, proof, next step, policies — where is it weakest?",
      "Run the Pre-Publishing Test on your last video and count the honest no's.",
      "Pick the single weakest stage — attention, interest, understanding, trust, or decision — instead of 'everything'.",
      "Compare this video's numbers stage by stage against one that worked. Where did people leave?",
    ],
    first_fix:
      "Score your last video today, fix only the weakest point in the next one, and compare the two.",
    lab: { name: "The Product-to-Purchase Lab", href: "/creator-growth/product-to-purchase-lab" },
  },
  {
    symptom: "Brands keep changing what they want",
    examine: "Examine the brief, the deliverables, and the agreement — before filming.",
    checks: [
      "Did you get the brief in writing: deliverables, talking points, deadlines, revision rounds?",
      "Were usage rights, exclusivity, and approval steps agreed before you filmed — or assumed?",
      "When the ask changed, did you confirm the change in writing before re-filming?",
      "Is there a simple agreement you both signed, or only a chat thread?",
    ],
    first_fix:
      "Before the next shoot, send one written summary — deliverables, revisions, deadline, usage — and get a 'yes' in writing.",
    lab: { name: "Creator Academy — Creator Business School", href: "/academy" },
  },
  {
    symptom: "I'm burning out posting constantly",
    examine: "Examine your workflow, your batching, and whether your formats repeat.",
    checks: [
      "Are you inventing every video from zero, or do you have formats that repeat with new material?",
      "Could you film several videos in one session — same setup, same light, back to back?",
      "Which of your videos took the least effort and performed fine? That format is a system, not luck.",
      "Is your posting pace one you chose, or one you're afraid to slow down?",
    ],
    first_fix:
      "Pick your most repeatable format and batch-film three of them in a single session this week.",
    lab: { name: "Creator Academy — Creator Business School", href: "/academy" },
  },
];
