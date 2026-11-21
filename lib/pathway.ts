/* ULTRAVESTRA — THE PERSONAL PATHWAY ENGINE — structured data.
 * A pathway is not another article. The creator answers four
 * questions — their #1 frustration, their main platform, their
 * level, and the time they honestly have — and UltraVestra turns
 * those answers into a sequenced four-week plan built on the
 * six-step method every lesson follows: IDENTIFY → DIAGNOSE →
 * UNDERSTAND → SEE IT → PRACTICE IT → MEASURE IMPROVEMENT
 * (lib/universe.ts). Every action links to the real page or tool
 * that does the work. Every week ends with one measurable
 * checkpoint — because success here is measured in creator
 * progress, never in promises. No viral guarantees, no guaranteed
 * sales: a starting plan, adjusted as the creator's own results
 * come in. Built from the 12 frustrations (lib/frustrations.ts),
 * the five problem worlds, and the six departments. */

import { FRUSTRATIONS, WORLDS } from "@/lib/frustrations";
import { PATHWAY } from "@/lib/universe";

/* ---------- The four inputs ---------- */
export const PLATFORMS: string[] = [
  "TikTok",
  "TikTok Shop",
  "YouTube long-form",
  "YouTube Shorts",
  "Instagram Reels",
  "Facebook",
  "Amazon",
  "eBay",
  "Trybe",
];

export type LevelId = "starting" | "stuck" | "growing" | "selling";

export interface Level {
  id: LevelId;
  label: string;
  note: string;
}

export const LEVELS: Level[] = [
  {
    id: "starting",
    label: "Just starting",
    note: "Your pathway starts with foundations — who the video is for, and how a video earns attention — before anything advanced.",
  },
  {
    id: "stuck",
    label: "Posting but stuck",
    note: "You already post. Your pathway skips the basics and goes straight at diagnosis: find the exact stage where your videos lose people.",
  },
  {
    id: "growing",
    label: "Growing",
    note: "Your audience is responding. Your pathway turns what already works into repeatable systems — and starts treating content as a business.",
  },
  {
    id: "selling",
    label: "Selling already",
    note: "Money is already moving. Your pathway focuses on the terms behind the money — commissions, caps, and negotiation — alongside the craft.",
  },
];

export type TimeId = "under2" | "mid" | "plus";

export interface TimeOption {
  id: TimeId;
  label: string;
  tier: 0 | 1 | 2;
  pace: string;
}

export const TIME_OPTIONS: TimeOption[] = [
  {
    id: "under2",
    label: "Under 2 hours",
    tier: 0,
    pace: "Built for one focused session a week. Two core actions per week — do them well instead of doing more.",
  },
  {
    id: "mid",
    label: "2–5 hours",
    tier: 1,
    pace: "Two core actions plus one deeper action per week — enough to learn the lesson and apply it in the same week.",
  },
  {
    id: "plus",
    label: "5+ hours",
    tier: 2,
    pace: "The full plan plus a stretch action each week. More time buys reps — the checkpoints matter more, not less.",
  },
];

/* ---------- The pathway shape ---------- */
export interface PlanAction {
  text: string;
  tool: string;
  href: string;
  /* 0 = core (every time budget), 1 = deeper (2h+), 2 = stretch (5h+) */
  tier: 0 | 1 | 2;
}

export interface PlanWeek {
  focus: string;
  actions: PlanAction[];
  checkpoint: string;
}

export interface FrustrationPlan {
  n: number; // matches FRUSTRATIONS n
  department: string;
  departmentHref: string;
  weeks: PlanWeek[]; // exactly 4
}

export interface PathwayWeek {
  week: number;
  focus: string;
  methodStep: string;
  methodLine: string;
  actions: PlanAction[];
  checkpoint: string;
}

export interface Pathway {
  frustrationTitle: string;
  frustrationQuote: string;
  need: string;
  worldName: string;
  department: string;
  departmentHref: string;
  platform: string;
  platformLine: string;
  levelLabel: string;
  levelNote: string;
  timeLabel: string;
  pace: string;
  weeks: PathwayWeek[];
}

const a = (text: string, tool: string, href: string, tier: 0 | 1 | 2 = 0): PlanAction => ({
  text,
  tool,
  href,
  tier,
});

/* ---------- The method steps, week by week ---------- */
export const WEEK_METHOD: { step: string; line: string }[] = [
  { step: `${PATHWAY[0].step} · ${PATHWAY[1].step}`, line: PATHWAY[1].line },
  { step: PATHWAY[2].step, line: PATHWAY[2].line },
  { step: `${PATHWAY[3].step} · ${PATHWAY[4].step}`, line: PATHWAY[4].line },
  { step: PATHWAY[5].step, line: PATHWAY[5].line },
];

/* ---------- Platform guidance ---------- */
interface PlatformFocus {
  line: string;
  action?: PlanAction;
}

export const PLATFORM_FOCUS: Record<string, PlatformFocus> = {
  TikTok: {
    line: "On TikTok, the first second is the audition and the audience is a stranger. Your pathway weights openings and self-identification — the viewer must know instantly that the video is for them.",
    action: a(
      "Run your next TikTok opening through the First 3 Seconds Chamber before you post it",
      "First 3 Seconds Chamber",
      "/creator-growth/first-3-seconds",
    ),
  },
  "TikTok Shop": {
    line: "On TikTok Shop, the video and the product page are one experience. Your pathway weights the full chain — first frame to purchase decision — and the commission terms behind every product you push.",
    action: a(
      "Evaluate your next product video question by question, from first frame to purchase decision",
      "Product-to-Purchase Evaluator",
      "/creator-growth/product-to-purchase-lab",
    ),
  },
  "YouTube long-form": {
    line: "On long-form YouTube, the click is only the door — watch time is the room. Your pathway weights storytelling, retention, and reasons to stay past the first minute.",
    action: a(
      "Build your next long-form video around one emotion and a watch-time technique from the Playbook",
      "Human Emotion Video Playbook",
      "/creator-growth/human-emotion-video-playbook",
    ),
  },
  "YouTube Shorts": {
    line: "On Shorts, there is no title doing the work for you — the first frame is the title. Your pathway weights the opening above everything else.",
    action: a(
      "Test two different first frames for the same Short and keep the one that holds more viewers",
      "First 3 Seconds",
      "/creator-growth/first-3-seconds",
    ),
  },
  "Instagram Reels": {
    line: "On Reels, people share what says something about them. Your pathway weights self-identification and the lines a viewer would send to a friend.",
    action: a(
      "Rebuild one Reel opening with an attention trigger your audience would share",
      "The Art of Captivating Attention",
      "/creator-growth/art-of-captivating-attention",
    ),
  },
  Facebook: {
    line: "On Facebook, community and LIVE presence compound. Your pathway weights connection — becoming the reason people stay, not just another post in the feed.",
    action: a(
      "Run the Pillar Self-Diagnostic before your next LIVE or community post",
      "The Art of Human Connection & Conversion",
      "/creator-growth/art-of-human-connection",
    ),
  },
  Amazon: {
    line: "On Amazon, trust and terms decide what a creator earns. Your pathway weights verified commission information and honest product evaluation over volume.",
    action: a(
      "Compare the commission terms of every brand you promote before your next video",
      "Commission Intelligence",
      "/commissions",
    ),
  },
  eBay: {
    line: "On eBay, the creator's job is matching the right buyer to the right listing. Your pathway weights audience fit and clear, honest next steps.",
    action: a(
      "Search the Brand Intelligence Database for programs that fit your niche and pay fairly",
      "Opportunity Finder",
      "/discover",
    ),
  },
  Trybe: {
    line: "On Trybe, the opportunity is the partnership itself. Your pathway weights finding legitimate programs and understanding their terms before you create.",
    action: a(
      "Describe your niche to Ask UltraVestra and get matched to programs that fit",
      "Ask UltraVestra",
      "/ask",
    ),
  },
};

/* ---------- Level extras: one added action per week, by level ---------- */
export const LEVEL_EXTRAS: Record<LevelId, (PlanAction | null)[]> = {
  starting: [
    a(
      "Start with the frustration map — see where your problem sits and what solves it",
      "Start Here",
      "/start-here",
    ),
    a(
      "Take the first Creator Academy lessons in order, so the vocabulary of every tool makes sense",
      "Creator Academy",
      "/academy",
    ),
    null,
    a(
      "Save the brands and tools you used — your pathway for next month starts from what worked",
      "Saved",
      "/saved",
    ),
  ],
  stuck: [
    null,
    a(
      "Run a second symptom in the Troubleshooter — stuck videos usually break at two stages, not one",
      "Why Is My Video Not Working?",
      "/why-is-my-video-not-working",
    ),
    null,
    null,
  ],
  growing: [
    null,
    null,
    a(
      "Check the Opportunity Radar — a growing audience is worth more to brands than it was last month",
      "Brand Opportunity Radar",
      "/radar",
    ),
    a(
      "Turn this month's winning format into a named series in the Playbook, so growth compounds",
      "Human Emotion Video Playbook",
      "/creator-growth/human-emotion-video-playbook",
    ),
  ],
  selling: [
    a(
      "Pull up every brand you currently promote and check its commission terms in one sitting",
      "Commission Intelligence",
      "/commissions",
    ),
    a(
      "Study how buyer hesitation actually works — it is the psychology behind every negotiation you will have",
      "The Human Behind the View",
      "/creator-growth/human-behind-the-view",
    ),
    null,
    a(
      "Before your next deal, re-check the terms — and negotiate from verified numbers, not hope",
      "Commission Intelligence",
      "/commissions",
    ),
  ],
};

/* ---------- The 12 plans, one per frustration ---------- */
export const PLANS: FrustrationPlan[] = [
  {
    n: 1,
    department: "THE ATTENTION LAB",
    departmentHref: "/creator-growth/first-3-seconds",
    weeks: [
      {
        focus: "Find out where viewers actually leave — before blaming the algorithm",
        actions: [
          a("Run the symptom “My videos get very few views at all” and work its checks honestly", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Run the Alignment Test on your last video: who exactly was it for, and would they know in three seconds?", "Audience First Alignment Test", "/creator-growth/audience-first-protocol"),
          a("Score the same video's opening with the Scroll Stop Score to get a baseline number", "Scroll Stop Score", "/secret-weapon#psychology-lab", 1),
          a("Decode the hooks of your three best-performing videos — what did the ones that worked do in second one?", "Hook Decoder", "/secret-weapon#psychology-lab", 2),
        ],
        checkpoint:
          "you can name the exact moment most viewers leave your last video, and the one specific person it should have been made for.",
      },
      {
        focus: "Understand why the opening decides everything",
        actions: [
          a("Learn the three beats of the first three seconds — Interrupt, Connect, Create a Reason to Stay", "The First 3 Seconds", "/creator-growth/first-3-seconds"),
          a("Study the attention triggers and why each one connects with a human, not an algorithm", "The Art of Captivating Attention", "/creator-growth/art-of-captivating-attention"),
          a("Learn the four-stage journey — Attention, Relevance, Desire, Action — and where your videos end it early", "Audience First Protocol", "/creator-growth/audience-first-protocol", 1),
          a("Read the first Academy lessons on hooks and audience in order", "Creator Academy", "/academy", 2),
        ],
        checkpoint:
          "you can explain, in one sentence, why a stranger would stop on your first frame — and why they would stay for the second one.",
      },
      {
        focus: "Rebuild one opening, and see the difference side by side",
        actions: [
          a("Rebuild your weakest opening in the Chamber: Opening A on the three beats, Opening B in a contrasting style", "First 3 Seconds Chamber", "/creator-growth/first-3-seconds"),
          a("Compare weak versus strong openings and name what changed — the frame, the words, or the promise", "Hook Decoder & Weak-vs-Strong Pairs", "/secret-weapon#psychology-lab"),
          a("Rebuild the full script around the new opening so the rest of the video deserves the attention it earns", "Script Studio", "/studio", 1),
          a("Generate two alternate concepts for the same topic with the Idea Machine and film the stronger opening", "The Idea Machine", "/creator-growth/human-emotion-video-playbook", 2),
        ],
        checkpoint:
          "the rebuilt video is posted, and its first-three-second retention is written down next to the original's.",
      },
      {
        focus: "Compare the numbers and keep what worked",
        actions: [
          a("Autopsy both videos stage by stage — where did each one gain and lose people?", "Autopsy Worksheet", "/secret-weapon#experiment-room"),
          a("Re-run the Scroll Stop Score on the new opening and compare it with your Week 1 baseline", "Scroll Stop Score", "/secret-weapon#psychology-lab"),
          a("Apply the winning opening style to your next two videos — one variable changed, everything else held", "First 3 Seconds", "/creator-growth/first-3-seconds", 1),
          a("Take today's Challenge of the Day to keep the reps going", "Challenge of the Day", "/secret-weapon", 2),
        ],
        checkpoint:
          "first-three-second retention, new opening versus original — and a named opening style you will reuse because your own numbers chose it.",
      },
    ],
  },
  {
    n: 2,
    department: "THE ATTENTION LAB",
    departmentHref: "/creator-growth/art-of-captivating-attention",
    weeks: [
      {
        focus: "Diagnose the scroll-away — what your first three seconds are really doing",
        actions: [
          a("Run the symptom “People scroll away immediately” and check your last opening against its list", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Put your current opening in the Chamber and see it judged on the three beats", "First 3 Seconds Chamber", "/creator-growth/first-3-seconds"),
          a("Score three recent openings with the Scroll Stop Score — find the pattern, not the exception", "Scroll Stop Score", "/secret-weapon#psychology-lab", 1),
          a("Run the Alignment Test: does the opening name or show the exact person it is for?", "Audience First Alignment Test", "/creator-growth/audience-first-protocol", 2),
        ],
        checkpoint:
          "you know which of the three beats your openings are missing — Interrupt, Connect, or a Reason to Stay.",
      },
      {
        focus: "Understand the triggers that make a human stop",
        actions: [
          a("Learn the 15 attention triggers and the why behind each one", "The Art of Captivating Attention", "/creator-growth/art-of-captivating-attention"),
          a("Study the timed sequence — what seconds 0–3 must do, and what 3–7 must do next", "The First 3 Seconds", "/creator-growth/first-3-seconds"),
          a("Learn the hook families in the Psychology Lab and the principle each family runs on", "Hook Decoder", "/secret-weapon#psychology-lab", 1),
          a("Work the Human Emotion Playbook's opening lines and ten-second structure", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook", 2),
        ],
        checkpoint:
          "for your next three videos, you can name the trigger each opening uses — before you film, not after.",
      },
      {
        focus: "Build openings with the Reactor, then film them",
        actions: [
          a("Run your topic through the Human Attention Reactor: four strategies, hooks, and the journey map", "Human Attention Reactor", "/creator-growth/art-of-captivating-attention"),
          a("Build A/B openings in the Chamber — one safe, one in a contrasting style — and film both", "First 3 Seconds Chamber", "/creator-growth/first-3-seconds"),
          a("Check each opening against the Never List before it goes out", "The Art of Captivating Attention", "/creator-growth/art-of-captivating-attention", 1),
          a("Complete one day of the 7-day attention Challenge Tracker", "Challenge Tracker", "/creator-growth/art-of-captivating-attention", 2),
        ],
        checkpoint:
          "two versions of one opening are filmed and posted, with the trigger each one uses written down.",
      },
      {
        focus: "Let your own retention numbers pick the winner",
        actions: [
          a("Compare the two openings' first-seconds retention and comments — which one actually held people?", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Autopsy the losing opening: which beat failed?", "Autopsy Worksheet", "/secret-weapon#experiment-room"),
          a("Lock the winning pattern into your next three openings", "First 3 Seconds", "/creator-growth/first-3-seconds", 1),
          a("Finish the week of the Challenge Tracker", "Challenge Tracker", "/creator-growth/art-of-captivating-attention", 2),
        ],
        checkpoint:
          "one opening pattern, proven on your own videos, that you now open with on purpose.",
      },
    ],
  },
  {
    n: 3,
    department: "THE SALES INTELLIGENCE LAB",
    departmentHref: "/human-buying-lab",
    weeks: [
      {
        focus: "Find the exact stage where watching stops becoming buying",
        actions: [
          a("Run both symptoms — “People watch but don't click” and “People click but don't purchase” — and work the checks", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Evaluate your best-viewed sales video question by question, first frame to purchase decision", "Product-to-Purchase Evaluator", "/creator-growth/product-to-purchase-lab"),
          a("Bring your symptom to the Conversion Clinic and identify the stage to repair", "Conversion Clinic", "/secret-weapon#sales-vault", 1),
          a("Run the Pre-Publishing Test on the same video and count the honest no's", "Pre-Publishing Test", "/creator-growth/ten-psychological-triggers", 2),
        ],
        checkpoint:
          "you can name the one weakest stage of your chain — attention, interest, understanding, trust, or decision — with evidence, not a feeling.",
      },
      {
        focus: "Understand why buyers hesitate",
        actions: [
          a("Learn the 10 Psychological Triggers and the chain they build: attention → interest → understanding → trust → decision", "The 10 Psychological Triggers", "/creator-growth/ten-psychological-triggers"),
          a("Study audience psychology — what a viewer is thinking at each second of an ad", "The Human Behind the View", "/creator-growth/human-behind-the-view"),
          a("Learn the nine objections and how honest answers work — verify-only, never invented claims", "Creative Mission Builder", "/coach", 1),
          a("Read the Sales Vault's principles, including the key lesson on urgency without lying", "The Creator's Secret Weapon", "/secret-weapon#sales-vault", 2),
        ],
        checkpoint:
          "you can say, for your product, the top two reasons the right buyer hesitates — and what honest proof answers each one.",
      },
      {
        focus: "Rebuild one sales video and rehearse the buyer",
        actions: [
          a("Run your buyer through the Buyer Brain Simulator with your real message — see where it lands", "Buyer Brain Simulator", "/secret-weapon"),
          a("Rebuild the script with the Ad Architect's six stages: Hook, Relate, Demonstrate, Explain, Prove, Invite", "Ad Architect", "/creator-growth/human-behind-the-view"),
          a("Build a Trigger Stack for the video before you press record", "Trigger Stack", "/human-buying-lab", 1),
          a("Rebuild the full script in Script Studio on the five-beat structure", "Script Studio", "/studio", 2),
        ],
        checkpoint:
          "the rebuilt video is filmed with one clear offer, one honest proof, one objection answered, and one clear next step.",
      },
      {
        focus: "Compare clicks and decisions — then repair the next stage",
        actions: [
          a("Re-run the Product-to-Purchase Evaluator on the rebuilt video and compare scores with Week 1", "Product-to-Purchase Evaluator", "/creator-growth/product-to-purchase-lab"),
          a("Return to the Conversion Clinic with the new symptom — the chain breaks at the next stage now", "Conversion Clinic", "/secret-weapon#sales-vault"),
          a("Change exactly one stage in the next video and hold the rest constant", "The Human Buying Lab", "/human-buying-lab", 1),
          a("Make over one weak line with the Makeover Studio pairs as your guide", "Makeover Studio", "/secret-weapon", 2),
        ],
        checkpoint:
          "clicks (and sales, where you can see them) on the rebuilt video versus the original — and the next stage you will repair, named.",
      },
    ],
  },
  {
    n: 4,
    department: "THE BRAND OBSERVATORY",
    departmentHref: "/discover",
    weeks: [
      {
        focus: "Identify what a worthwhile partnership looks like for you",
        actions: [
          a("Describe your niche, audience, and platform to Ask UltraVestra and review what it matches you to", "Ask UltraVestra", "/ask"),
          a("Search the Brand Intelligence Database for your niche and sort by Opportunity Score", "Opportunity Finder", "/discover"),
          a("Open three brand profiles and read the score reasons — not just the number", "Brand Intelligence", "/brands", 1),
          a("Save every plausible candidate — this week is a longlist, not a decision", "Saved", "/saved", 2),
        ],
        checkpoint:
          "a saved longlist of at least ten candidate programs, each with its Opportunity Score and reasons read.",
      },
      {
        focus: "Understand the terms before you want the deal",
        actions: [
          a("Learn how to read commission terms — capped, uncapped, or honestly unknown — and why it changes what you earn", "Commission Intelligence", "/commissions"),
          a("Check the Radar lanes: which brands are accepting creators now, and which are emerging", "Brand Opportunity Radar", "/radar"),
          a("For each longlisted brand, open its profile and find the evidence behind its rate", "Brand Intelligence", "/brands", 1),
          a("Take the Academy lessons on partnerships and what a fair deal looks like", "Creator Academy", "/academy", 2),
        ],
        checkpoint:
          "for every brand on your shortlist, you can state its rate, its cap status, and where the number was verified.",
      },
      {
        focus: "Apply to a few, properly",
        actions: [
          a("Pick three programs from Opportunities that are accepting creators and fit your niche", "Opportunities", "/opportunities"),
          a("Check each one's requirements and evidence one final time before applying", "Opportunity Finder", "/discover"),
          a("Write each pitch from the Audience First principle: what their audience gets, not what you want", "Audience First Protocol", "/creator-growth/audience-first-protocol", 1),
          a("Track every application in Saved so nothing disappears into a chat thread", "Saved", "/saved", 2),
        ],
        checkpoint:
          "three applications or pitches sent — each to a program whose terms you verified yourself first.",
      },
      {
        focus: "Measure replies, and judge the deal before you sign",
        actions: [
          a("Compare every reply against the brand's published terms in Commission Intelligence", "Commission Intelligence", "/commissions"),
          a("Search the Radar for the next round — partnerships are a pipeline, not a lottery ticket", "Brand Opportunity Radar", "/radar"),
          a("Ask UltraVestra for two alternative brands in the same niche to strengthen your position", "Ask UltraVestra", "/ask", 1),
          a("Save the brands that said no — terms change, and a saved brand is a future opportunity", "Saved", "/saved", 2),
        ],
        checkpoint:
          "applications sent, replies received, and at least one partnership whose terms you can defend line by line.",
      },
    ],
  },
  {
    n: 5,
    department: "THE CONTENT REPAIR CENTER",
    departmentHref: "/why-is-my-video-not-working",
    weeks: [
      {
        focus: "Stop guessing — run a structured diagnosis",
        actions: [
          a("Pick the symptom that is actually true and work its checks, in order", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Evaluate the same video in the Product-to-Purchase Evaluator and find its weakest question", "Product-to-Purchase Evaluator", "/creator-growth/product-to-purchase-lab"),
          a("Run the Video Lab's self-diagnostic: symptom → cause → fix", "Creator Video Intelligence Lab", "/coach", 1),
          a("Run the Pre-Publishing Test on the video and count the honest no's", "Pre-Publishing Test", "/creator-growth/ten-psychological-triggers", 2),
        ],
        checkpoint:
          "one named weakest point — a stage, a question, a moment in the video — not “everything.”",
      },
      {
        focus: "Understand the system behind the symptom",
        actions: [
          a("Learn the Ad Diagnostic method: compare first, conclude second", "The Human Behind the View", "/creator-growth/human-behind-the-view"),
          a("Study the trigger chain so you can see which link your video is missing", "The 10 Psychological Triggers", "/creator-growth/ten-psychological-triggers"),
          a("Work the Video Lab curriculum topic that matches your weakest point", "Creator Video Intelligence Lab", "/coach", 1),
          a("Read the diagnoses for two neighbouring symptoms — weak videos usually fail at adjacent stages", "Why Is My Video Not Working?", "/why-is-my-video-not-working", 2),
        ],
        checkpoint:
          "you can explain why the weakest point loses people — the psychology or the structure, in plain words.",
      },
      {
        focus: "Autopsy one video and fix exactly one thing",
        actions: [
          a("Autopsy the video stage by stage and write down where it broke", "Autopsy Worksheet", "/secret-weapon#experiment-room"),
          a("Use the Makeover Studio pairs to rewrite the weakest moment before you re-film", "Makeover Studio", "/secret-weapon"),
          a("Re-film with exactly one change — everything else the same", "Script Studio", "/studio", 1),
          a("Run the Alignment Test on the re-film before posting", "Audience First Alignment Test", "/creator-growth/audience-first-protocol", 2),
        ],
        checkpoint:
          "the re-filmed video is posted with one change, and you know exactly which change it was.",
      },
      {
        focus: "Run the same diagnostic again and compare honestly",
        actions: [
          a("Re-run the Product-to-Purchase Evaluator and compare every question with Week 1", "Product-to-Purchase Evaluator", "/creator-growth/product-to-purchase-lab"),
          a("Re-run the Troubleshooter — has the symptom moved to the next stage?", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Name the next single fix — improvement is a queue, not a overhaul", "Creator Video Intelligence Lab", "/coach", 1),
          a("Record both scores where you keep your pathway notes", "Dashboard", "/dashboard", 2),
        ],
        checkpoint:
          "evaluator score before versus after — and the next fix already chosen from evidence.",
      },
    ],
  },
  {
    n: 6,
    department: "THE CREATOR SIMULATOR",
    departmentHref: "/creator-growth/human-emotion-video-playbook",
    weeks: [
      {
        focus: "Diagnose the dry spell — it is a system problem, not a talent problem",
        actions: [
          a("Generate directions with the Idea Machine: subject, exact audience, emotion — three directions to start", "The Idea Machine", "/creator-growth/human-emotion-video-playbook"),
          a("Take today's Challenge of the Day and film it before you feel ready", "Challenge of the Day", "/secret-weapon"),
          a("Mine your own comments and best videos for the questions your audience already asks", "Audience First Protocol", "/creator-growth/audience-first-protocol", 1),
          a("Browse the Playbook's 15 series concepts and mark the two that fit your audience", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook", 2),
        ],
        checkpoint:
          "a written list of ten filmable ideas, each naming who it is for and what they get from watching.",
      },
      {
        focus: "Understand where repeatable ideas come from",
        actions: [
          a("Learn the Playbook's formulas and conversation triggers — formats that generate ideas on demand", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook"),
          a("Study the Audience First psychology steps: ideas start from their world, not your product", "Audience First Protocol", "/creator-growth/audience-first-protocol"),
          a("Work the emotion library — pair an audience problem with an emotion and a format", "Emotion Fusion Reactor", "/coach", 1),
          a("Take the Academy lessons on content formats and series", "Creator Academy", "/academy", 2),
        ],
        checkpoint:
          "two repeatable formats chosen — formats you can return to weekly without starting from zero.",
      },
      {
        focus: "Turn formats into finished scripts",
        actions: [
          a("Draft three scripts in Script Studio on the five-beat structure", "Script Studio", "/studio"),
          a("Build a Trigger Stack for the first script before filming", "Trigger Stack", "/human-buying-lab"),
          a("Generate a full production sheet for one idea — scenes, camera, sound, on-screen text", "The Idea Machine", "/creator-growth/human-emotion-video-playbook", 1),
          a("Complete three days of the Playbook's 7-day challenge", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook", 2),
        ],
        checkpoint:
          "three scripts finished and ready to film — not outlines, scripts.",
      },
      {
        focus: "Film the batch, then let performance choose the series",
        actions: [
          a("Batch-film the three scripts in one session, same setup", "Script Studio", "/studio"),
          a("Compare their retention and comments — which format held people longest?", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Turn the winner into part one of a series and say so on camera", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook", 1),
          a("Refill the idea list from this week's comments before it runs dry again", "Audience First Protocol", "/creator-growth/audience-first-protocol", 2),
        ],
        checkpoint:
          "one repeatable format, chosen by your own numbers, that becomes your series.",
      },
    ],
  },
  {
    n: 7,
    department: "THE CREATOR BUSINESS CENTER",
    departmentHref: "/commissions",
    weeks: [
      {
        focus: "Identify what your current deals actually pay",
        actions: [
          a("Look up every brand you promote in Commission Intelligence and record its rate and cap status", "Commission Intelligence", "/commissions"),
          a("Open your brands' profiles and read the evidence behind their terms", "Brand Intelligence", "/brands"),
          a("Find two better-paying alternatives in your niche in the Opportunity Finder", "Opportunity Finder", "/discover", 1),
          a("Ask UltraVestra which uncapped programs exist in your niche", "Ask UltraVestra", "/ask", 2),
        ],
        checkpoint:
          "a written list: every current deal, its real rate, and whether it is capped — no guesses.",
      },
      {
        focus: "Understand rates, usage rights, and what a commission is worth",
        actions: [
          a("Take the Academy lessons on pricing, negotiation, usage rights, and exclusivity", "Creator Academy", "/academy"),
          a("Compare similar brands' terms side by side so your expectations come from the market, not hope", "Commission Intelligence", "/commissions"),
          a("Study why buyers hesitate — a brand negotiates the same way a buyer decides", "The Human Behind the View", "/creator-growth/human-behind-the-view", 1),
          a("Check the Radar for brands actively looking for creators — timing is leverage", "Brand Opportunity Radar", "/radar", 2),
        ],
        checkpoint:
          "your rate floor and walk-away number, written down, with the market evidence behind them.",
      },
      {
        focus: "Practice the negotiation before the money is on the table",
        actions: [
          a("Prepare one counter-offer or new pitch using verified terms as your evidence", "Commission Intelligence", "/commissions"),
          a("Build the pitch Audience First: what their audience gains, stated before what you charge", "Audience First Protocol", "/creator-growth/audience-first-protocol"),
          a("Line up one alternative brand so you are never negotiating from need", "Opportunities", "/opportunities", 1),
          a("Rehearse the conversation with the Buyer Brain Simulator's hesitation patterns in mind", "Buyer Brain Simulator", "/secret-weapon", 2),
        ],
        checkpoint:
          "one counter-offer or pitch sent, citing real terms — not “other creators charge more.”",
      },
      {
        focus: "Measure the new deal against the old one",
        actions: [
          a("Before signing anything, re-check the final terms against Commission Intelligence", "Commission Intelligence", "/commissions"),
          a("Get usage rights, exclusivity, and revision rounds in writing — the Academy checklist, applied", "Creator Academy", "/academy"),
          a("Save the brand and its terms so next quarter's comparison takes one minute", "Saved", "/saved", 1),
          a("Set your next target: the rate your growing audience will justify", "Brand Opportunity Radar", "/radar", 2),
        ],
        checkpoint:
          "the effective rate and cap status of your newest deal versus the one before it — improvement you can point to.",
      },
    ],
  },
  {
    n: 8,
    department: "THE CREATOR BUSINESS CENTER",
    departmentHref: "/creator-growth/art-of-human-connection",
    weeks: [
      {
        focus: "Diagnose why viewers watch once and never return",
        actions: [
          a("Run the symptom “Views are fine but nobody follows me” and work its checks", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Run the Alignment Test on your profile itself: could a stranger say what following you gets them?", "Audience First Alignment Test", "/creator-growth/audience-first-protocol"),
          a("Check your last five videos: series or one-offs? Count them honestly", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook", 1),
          a("Score your connection habits with the Pillar Self-Diagnostic", "Pillar Self-Diagnostic", "/creator-growth/art-of-human-connection", 2),
        ],
        checkpoint:
          "a one-line promise for your account — what a follower gets, in words a stranger understands.",
      },
      {
        focus: "Understand connection — why people stay",
        actions: [
          a("Learn the 12 Pillars of Creator Mastery and the transformation they describe", "The Art of Human Connection & Conversion", "/creator-growth/art-of-human-connection"),
          a("Study the four-stage journey and what turns a viewer into a participant", "Audience First Protocol", "/creator-growth/audience-first-protocol"),
          a("Learn the audience signals — how to tell interest from loyalty", "The Art of Human Connection & Conversion", "/creator-growth/art-of-human-connection", 1),
          a("Take the Academy lessons on positioning and community", "Creator Academy", "/academy", 2),
        ],
        checkpoint:
          "you can name the difference between a video people watch and a video people return for — in your own niche's words.",
      },
      {
        focus: "Turn your best video into a series with a promise",
        actions: [
          a("Pick a series format from the Playbook's series concepts and plan three parts", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook"),
          a("Film part one and state the promise on camera before it ends", "Script Studio", "/studio"),
          a("If you go LIVE, run the Host Checklist before and the LIVE Cycle after", "LIVE Cycle Builder", "/creator-growth/art-of-human-connection", 1),
          a("End each video with one genuine question tied to the viewer's own experience", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook", 2),
        ],
        checkpoint:
          "part one of a series posted, the promise stated on camera, and parts two and three planned.",
      },
      {
        focus: "Measure follows, not just views",
        actions: [
          a("Compare follows per 1,000 views: series videos versus your one-offs", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Re-run the Pillar Self-Diagnostic and compare with Week 1", "Pillar Self-Diagnostic", "/creator-growth/art-of-human-connection"),
          a("Double down on the series format your numbers chose", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook", 1),
          a("Write next month's promise: the series, the cadence, the audience", "Audience First Protocol", "/creator-growth/audience-first-protocol", 2),
        ],
        checkpoint:
          "follows per 1,000 views, before versus after — and a series you keep because it earns followers, not just views.",
      },
    ],
  },
  {
    n: 9,
    department: "THE CREATOR BUSINESS CENTER",
    departmentHref: "/academy",
    weeks: [
      {
        focus: "Identify what your main platform actually rewards",
        actions: [
          a("Take the Academy's platform lessons and write down what your platform rewards that the others don't", "Creator Academy", "/academy"),
          a("Run the Troubleshooter on a video you cross-posted — did it fail the same way on both platforms?", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Set your main platform in the Human-First Creator and note its format expectations", "Creator Growth Center", "/coach", 1),
          a("Compare your last cross-post's numbers platform by platform — same video, different verdicts", "Dashboard", "/dashboard", 2),
        ],
        checkpoint:
          "one sentence you can defend: what your main platform rewards, and what it ignores.",
      },
      {
        focus: "Understand the creative decisions each platform changes",
        actions: [
          a("Study the First 3 Seconds for your platform's context — feed, search, or suggested", "The First 3 Seconds", "/creator-growth/first-3-seconds"),
          a("Learn the platform thinking in the Human Behind the View — the same ad, five platforms", "The Human Behind the View", "/creator-growth/human-behind-the-view"),
          a("Work the Human-First foundation questions for your platform's audience specifically", "Creator Growth Center", "/coach", 1),
          a("Take the Academy lessons on repurposing without reposting", "Creator Academy", "/academy", 2),
        ],
        checkpoint:
          "a short list of the three creative decisions you will make differently per platform — opening, length, and next step.",
      },
      {
        focus: "Repurpose one video two ways — natively",
        actions: [
          a("Rebuild the script in Script Studio for your main platform's format", "Script Studio", "/studio"),
          a("Build the second platform's version as its own video, not a copy — different opening, different promise", "First 3 Seconds Chamber", "/creator-growth/first-3-seconds"),
          a("Run the Alignment Test on both versions — each must be for that platform's viewer", "Audience First Alignment Test", "/creator-growth/audience-first-protocol", 1),
          a("Build a Trigger Stack matched to the platform where buying happens", "Trigger Stack", "/human-buying-lab", 2),
        ],
        checkpoint:
          "both versions posted, each native to its platform — no watermarks, no recycled openings.",
      },
      {
        focus: "Let the two sets of numbers allocate your next month",
        actions: [
          a("Compare retention and engagement per platform for the same idea", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Decide your primary platform for next month and write down why — the numbers, not the habit", "Creator Academy", "/academy"),
          a("Plan one platform-native series for the winner", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook", 1),
          a("Keep the second platform as a repurposing channel only, with its own opening rules", "The First 3 Seconds", "/creator-growth/first-3-seconds", 2),
        ],
        checkpoint:
          "a platform decision backed by two sets of your own numbers — and a native series planned for the winner.",
      },
    ],
  },
  {
    n: 10,
    department: "THE CREATOR BUSINESS CENTER",
    departmentHref: "/academy",
    weeks: [
      {
        focus: "Diagnose the workflow, not your discipline",
        actions: [
          a("Run the symptom “I'm burning out posting constantly” and work its checks honestly", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Identify your most repeatable format — the video that took least effort and performed fine", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook"),
          a("Time your last video end to end and write down where the hours went", "Dashboard", "/dashboard", 1),
          a("Run the Alignment Test on your pace itself: is it one you chose, or one you're afraid to slow?", "Audience First Protocol", "/creator-growth/audience-first-protocol", 2),
        ],
        checkpoint:
          "your lowest-effort decent format named — and the honest number of hours one video currently costs you.",
      },
      {
        focus: "Understand systems: formats repeat, effort shouldn't multiply",
        actions: [
          a("Take the Academy lessons on workflow, planning, and sustainable creation", "Creator Academy", "/academy"),
          a("Study the Playbook's repeatable formats and series structures", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook"),
          a("Learn the Idea Machine's production sheets — planning once, filming fast", "The Idea Machine", "/creator-growth/human-emotion-video-playbook", 1),
          a("Design your weekly template: same setup, same light, new material", "Script Studio", "/studio", 2),
        ],
        checkpoint:
          "a weekly template on paper: one filming session, one setup, formats that repeat.",
      },
      {
        focus: "Batch-film three videos in one session",
        actions: [
          a("Write all three scripts first in Script Studio — no filming until the words exist", "Script Studio", "/studio"),
          a("Film all three back to back in the single session your template describes", "The Idea Machine", "/creator-growth/human-emotion-video-playbook"),
          a("Take one Challenge of the Day as a low-effort fourth piece", "Challenge of the Day", "/secret-weapon", 1),
          a("Schedule the posts across the week and close the apps", "Dashboard", "/dashboard", 2),
        ],
        checkpoint:
          "three videos banked from one session — and the session's total time written down.",
      },
      {
        focus: "Measure hours, not just output",
        actions: [
          a("Post from the bank at your chosen pace — no new filming this week", "Human Emotion Video Playbook", "/creator-growth/human-emotion-video-playbook"),
          a("Compare performance: batched videos versus your usual ones — did quality actually drop?", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Tighten the template: cut the step that cost the most time for the least gain", "Creator Academy", "/academy", 1),
          a("Refill the script bank for next week before it empties", "Script Studio", "/studio", 2),
        ],
        checkpoint:
          "hours spent creating this week versus Week 1 — at the same posting pace, with performance held or explained.",
      },
    ],
  },
  {
    n: 11,
    department: "THE CREATOR BUSINESS CENTER",
    departmentHref: "/academy",
    weeks: [
      {
        focus: "Identify where the last deal went sideways",
        actions: [
          a("Run the symptom “Brands keep changing what they want” and check your last deal against its list", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Write your one-page pre-film brief: deliverables, talking points, deadlines, revision rounds, usage rights", "Creator Academy", "/academy"),
          a("Check how the brand's terms were published — was anything ever in writing?", "Brand Intelligence", "/brands", 1),
          a("Note every mid-project change from the last deal and what each one cost you", "Dashboard", "/dashboard", 2),
        ],
        checkpoint:
          "a one-page brief template exists — and you can point to the exact moment the last deal went off it.",
      },
      {
        focus: "Understand briefs, deliverables, and agreements",
        actions: [
          a("Take the Academy lessons on briefs, revisions, deadlines, and agreements — before the camera turns on", "Creator Academy", "/academy"),
          a("Learn what usage rights and exclusivity are worth before a brand prices them for you", "Commission Intelligence", "/commissions"),
          a("Study the Audience First principle applied to brands: clarity is respect for both sides", "Audience First Protocol", "/creator-growth/audience-first-protocol", 1),
          a("Review how clear-term brands present their programs in the Opportunity Finder", "Opportunity Finder", "/discover", 2),
        ],
        checkpoint:
          "you can explain deliverables, revision rounds, usage, and exclusivity in plain words — before your next negotiation, not during it.",
      },
      {
        focus: "Run the next deal on the template",
        actions: [
          a("Send the written summary before filming and get a “yes” in writing — deliverables, revisions, deadline, usage", "Creator Academy", "/academy"),
          a("When the ask changes, confirm the change in writing before re-filming — every time", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Choose your next brand from programs with clear published terms", "Opportunity Finder", "/discover", 1),
          a("Save the agreement thread and the brand together, so the record survives the chat", "Saved", "/saved", 2),
        ],
        checkpoint:
          "your next brand video starts only after a written yes — and any change is confirmed in writing before you re-film.",
      },
      {
        focus: "Count the change requests — that is the metric",
        actions: [
          a("Compare revision rounds on this deal versus the last one", "Creator Academy", "/academy"),
          a("Review the relationship honestly: clear brands get your best work first", "Brand Opportunity Radar", "/radar"),
          a("Update the brief template with the one clause this deal taught you", "Creator Academy", "/academy", 1),
          a("Line up your next partnership from the Radar while this one is fresh", "Opportunities", "/opportunities", 2),
        ],
        checkpoint:
          "revision rounds and mid-project changes, this deal versus the last — fewer, or you know exactly why not.",
      },
    ],
  },
  {
    n: 12,
    department: "THE CREATOR BUSINESS CENTER",
    departmentHref: "/academy",
    weeks: [
      {
        focus: "Identify your one first skill — not twelve",
        actions: [
          a("Start with the frustration map and locate the problem your first skill must solve", "Start Here", "/start-here"),
          a("Solve My Problem: pick your challenge on the homepage and read your starting point", "Solve My Problem", "/"),
          a("Run the Troubleshooter once — your true symptom usually names the skill", "Why Is My Video Not Working?", "/why-is-my-video-not-working", 1),
          a("Browse the Academy paths and mark the one that matches — finish order matters more than choice", "Creator Academy", "/academy", 2),
        ],
        checkpoint:
          "one first skill, named, with the problem it solves — and a list of everything you are deliberately not learning yet.",
      },
      {
        focus: "Understand it properly, in order",
        actions: [
          a("Work your chosen Academy path in order — no skipping to the advanced lesson", "Creator Academy", "/academy"),
          a("Use the Coach curriculum grid to see where your skill sits among the ten topics", "Creator Video Intelligence Lab", "/coach"),
          a("Read the philosophy once: understand WHY it works, not just what to do", "Audience First Protocol", "/creator-growth/audience-first-protocol", 1),
          a("Take notes in the form of rules you can test, not quotes you can forget", "Dashboard", "/dashboard", 2),
        ],
        checkpoint:
          "you can teach the core idea of your skill to another creator in two minutes, from understanding — not from memory of a tip.",
      },
      {
        focus: "Practice it where practice is safe",
        actions: [
          a("Take the Challenge of the Day built around your skill area", "Challenge of the Day", "/secret-weapon"),
          a("Rebuild one of your own scripts with the new skill in Script Studio", "Script Studio", "/studio"),
          a("Run a Simulator session — Buyer Brain or a Trigger Stack — and feel the skill applied", "The Creator's Secret Weapon", "/secret-weapon", 1),
          a("Generate practice concepts with the Idea Machine, filtered through your new skill", "The Idea Machine", "/creator-growth/human-emotion-video-playbook", 2),
        ],
        checkpoint:
          "one challenge completed and one real script rebuilt with the skill — practice on your own content, not exercises about strangers.",
      },
      {
        focus: "Measure what the skill changed, then choose skill two",
        actions: [
          a("Re-run the diagnostic you started with and compare the result", "Why Is My Video Not Working?", "/why-is-my-video-not-working"),
          a("Compare the metric your skill targets — retention, clicks, follows, or terms — before and after", "Creator Video Intelligence Lab", "/coach"),
          a("Choose skill number two from the evidence: the next weakest stage, not the next trend", "Start Here", "/start-here", 1),
          a("Save your pathway and your scores so the next month starts from proof", "Saved", "/saved", 2),
        ],
        checkpoint:
          "a before-and-after on the metric your first skill targets — and skill two chosen from that evidence.",
      },
    ],
  },
];

/* ---------- The builder ---------- */
export interface PathwayInput {
  frustrationN: number;
  platform: string;
  level: LevelId;
  time: TimeId;
}

export function buildPathway(input: PathwayInput): Pathway {
  const frustration = FRUSTRATIONS.find((f) => f.n === input.frustrationN) ?? FRUSTRATIONS[0];
  const plan = PLANS.find((p) => p.n === frustration.n) ?? PLANS[0];
  const level = LEVELS.find((l) => l.id === input.level) ?? LEVELS[1];
  const time = TIME_OPTIONS.find((t) => t.id === input.time) ?? TIME_OPTIONS[1];
  const platformFocus = PLATFORM_FOCUS[input.platform] ?? PLATFORM_FOCUS["TikTok"];
  const world = WORLDS[frustration.world];

  const weeks: PathwayWeek[] = plan.weeks.map((week, i) => {
    /* Priority order: core actions first, then the level extra and
     * (in Week 3) the platform action, then deeper, then stretch.
     * The time budget decides how many survive. */
    const core = week.actions.filter((x) => x.tier === 0);
    const deeper = week.actions.filter((x) => x.tier === 1);
    const stretch = week.actions.filter((x) => x.tier === 2);
    const candidates: PlanAction[] = [...core];
    const extra = LEVEL_EXTRAS[level.id][i];
    if (extra) candidates.push(extra);
    if (i === 2 && platformFocus.action) candidates.push(platformFocus.action);
    candidates.push(...deeper, ...stretch);

    let max = time.tier === 0 ? 2 : time.tier === 1 ? 3 : 4;
    if (time.tier === 0 && (extra || (i === 2 && platformFocus.action))) max = 3;

    return {
      week: i + 1,
      focus: week.focus,
      methodStep: WEEK_METHOD[i].step,
      methodLine: WEEK_METHOD[i].line,
      actions: candidates.slice(0, max),
      checkpoint: week.checkpoint,
    };
  });

  return {
    frustrationTitle: frustration.title,
    frustrationQuote: frustration.quote,
    need: frustration.need,
    worldName: world ? `${world.name} — ${world.theme}` : "",
    department: plan.department,
    departmentHref: plan.departmentHref,
    platform: input.platform,
    platformLine: platformFocus.line,
    levelLabel: level.label,
    levelNote: level.note,
    timeLabel: time.label,
    pace: time.pace,
    weeks,
  };
}

/* ---------- Plain-text version, for the copy button ---------- */
export function pathwayToText(p: Pathway): string {
  const base = "https://ultra-vestra.vercel.app";
  const lines: string[] = [
    "MY ULTRAVESTRA PATHWAY",
    `Problem: ${p.frustrationTitle} — “${p.frustrationQuote}”`,
    `What I need: ${p.need}`,
    `Department: ${p.department} · Platform: ${p.platform} · Level: ${p.levelLabel} · Time: ${p.timeLabel} per week`,
    "",
  ];
  for (const w of p.weeks) {
    lines.push(`WEEK ${w.week} — ${w.methodStep}`);
    lines.push(w.focus);
    for (const act of w.actions) lines.push(`  □ ${act.text} (${act.tool}: ${base}${act.href})`);
    lines.push(`  Measure improvement: ${w.checkpoint}`);
    lines.push("");
  }
  lines.push("Built from my answers — a starting plan. I adjust it as my results come in.");
  lines.push("Don't just create more. Understand what works.");
  return lines.join("\n");
}

export const PATHWAY_HONESTY =
  "This pathway is built from your answers — a starting plan, not a prescription. Your numbers outrank it: when a checkpoint tells you something different, adjust the plan and keep the evidence.";

export const PATHWAY_CLOSING = "Don't just create more. Understand what works.";
