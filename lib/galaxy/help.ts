// ============================================================================
// Help Center corpus + local answering engine — the owner's "Support &
// About" prototype (ultra-vestra-help-center) ported into the app,
// 2026-11-24.
//
// CONTENT SOURCE OF TRUTH: ~/workspace/ultravestra-legal-protocol-
// 2026-11-24.md (owner-written, binding). Privacy and Terms articles
// follow the protocol's wording; where the prototype KB and the
// protocol differed, the protocol won. Help articles describe the
// app's REAL behavior (pay-first plans, the direct-download export,
// deletion by confirmed request) — corrections are listed in the
// build report.
//
// THE ENGINE is the prototype's own: tokenize → stem → synonym groups
// → TF-IDF-weighted field search over the embedded corpus, answered
// entirely on-device. No external or paid AI is called. Off-corpus
// questions fall back to the real support flow (/api/support, the
// support_tickets table) — the bot never guesses.
// ============================================================================

export const HELP_CONFIG = {
  supportEmail: "ultravestraacademy@gmail.com",
  privacyEmail: "ultravestraacademy@gmail.com",
  company: "Ultra Vestra",
  location: "the State of Iowa, United States",
  effectiveDate: "November 24, 2026",
  minAge: "18",
  deleteDays: "30",
  responseTime: "1–2 business days",
  pricingPath: "/pricing",
  version: "1.0.0",
} as const;

export type HelpSection = "help" | "privacy" | "terms";

export interface HelpArticle {
  id: string;
  s: HelpSection;
  cat: string;
  t: string;
  /** Short description, shown in the Terms and Policies list. */
  d?: string;
  /** Keyword string the search engine matches against. */
  k: string;
  /** Body: a string is a paragraph, an array of strings is a bullet list. */
  b: (string | string[])[];
}

export const SECTION_NAME: Record<HelpSection, string> = {
  help: "Help Center",
  privacy: "Privacy Center",
  terms: "Terms and Policies",
};

export const SECTION_PATH: Record<HelpSection, string> = {
  help: "/settings/help",
  privacy: "/settings/privacy",
  terms: "/settings/terms",
};

const TOKENS: Record<string, string> = {
  SUPPORT_EMAIL: HELP_CONFIG.supportEmail,
  PRIVACY_EMAIL: HELP_CONFIG.privacyEmail,
  COMPANY: HELP_CONFIG.company,
  LOCATION: HELP_CONFIG.location,
  DATE: HELP_CONFIG.effectiveDate,
  MIN_AGE: HELP_CONFIG.minAge,
  DELETE_DAYS: HELP_CONFIG.deleteDays,
  RESPONSE_TIME: HELP_CONFIG.responseTime,
  PRICING_LINK: HELP_CONFIG.pricingPath,
};

export function fillTokens(s: string): string {
  return s.replace(/\{([A-Z_]+)\}/g, (m, k: string) =>
    TOKENS[k] != null ? TOKENS[k] : m
  );
}

// ================= KNOWLEDGE BASE =================
// s: help | privacy | terms. {TOKENS} are replaced from HELP_CONFIG.
export const KB: HelpArticle[] = [
  // ---- Getting started
  { id: "what-is", s: "help", cat: "Getting started", t: "What is Ultra Vestra?", k: "about overview platform creator economy business what does do",
    b: ["Ultra Vestra is a platform for creators who want to run their content like a business. It helps you understand your business, find brand opportunities, manage campaigns, grow your income, build a professional identity, connect with other creators and measure your progress.", "Everything lives in five sections: Home, Brands, Deals, Studio and Me."] },
  { id: "sections", s: "help", cat: "Getting started", t: "What’s in each section of the app?", k: "home brands deals studio me tabs navigation sections where find",
    b: [["Home: know your business. Your insights and progress at a glance.", "Brands: find opportunities. Brand lists and matches.", "Deals: protect your money. Track every campaign, deliverable and payment.", "Studio: run your content business. Content DNA, the Human Emotion Video Lab and guides.", "Me: understand your growth. Your Passport, levels, rewards and settings."]] },
  { id: "start", s: "help", cat: "Getting started", t: "How do I create an account?", k: "sign up signup register join start free new account get started",
    b: ["Pick your plan on the Pricing page and check out — Starter is $29.99/month, Pro is $49.99/month and Elite is $99.99/month.", "After you pay, create your account with the same email you paid with. Your plan attaches automatically, and you can take the Creator DNA assessment in Studio."] },
  { id: "pricing", s: "help", cat: "Getting started", t: "How much does Ultra Vestra cost?", k: "price pricing cost free premium subscription plan pay monthly",
    b: ["Ultra Vestra is a paid subscription — there is no free plan. Starter is $29.99/month, Pro is $49.99/month and Elite is $99.99/month (USD), billed monthly through Stripe. Current plans and prices are on our Pricing page: {PRICING_LINK}.", "No refunds. You can cancel anytime — your plan stays active until the end of the current paid period and won't renew."] },

  // ---- Creator DNA & Studio
  { id: "dna", s: "help", cat: "Creator DNA & Studio", t: "What is my Creator DNA?", k: "creator dna content dna type visionary personality assessment quiz identity",
    b: ["Vestra Content DNA learns how your content works: your audience, topics, hooks, formats, goals and performance. It gives you a creator type (like The Visionary) and readiness scores.", "Your Content DNA lives in Studio, with insights on Home."] },
  { id: "scores", s: "help", cat: "Creator DNA & Studio", t: "How are my readiness scores calculated?", k: "score scores business readiness brand readiness calculate number accurate",
    b: ["Your scores come from your own data: posting consistency, your media kit, your deal history and any accounts you connect. We don’t make up numbers.", "Scores update as you add data. They’re guidance, not a promise of brand deals."] },
  { id: "share-dna", s: "help", cat: "Creator DNA & Studio", t: "How do I share my Creator DNA card?", k: "share card story post instagram tiktok dna card gold diamond tier",
    b: ["Open your Creator DNA and tap Share. Your card is sized for stories and includes your personal invite link, so friends who tap it can find their own DNA. Cards come in tiers, with Diamond the highest."] },
  { id: "emotion-lab", s: "help", cat: "Creator DNA & Studio", t: "What is the Human Emotion Video Lab?", k: "human emotion video lab script video studio audience feel",
    b: ["The Human Emotion Video Lab is in Studio. Before you film, it asks two human questions: who is this video for, and what should they feel or get from it? Then it helps you shape the hook, story and call to action around that person."] },
  { id: "challenge-30", s: "help", cat: "Creator DNA & Studio", t: "What is the 30-day Content DNA challenge?", k: "30 day thirty content dna challenge experiment lab test",
    b: ["It’s a 30-day plan that tests different hooks, formats and topics so your Content DNA learns what really works for your audience. The experiment lab tracks each test, so every result is based on evidence."] },

  // ---- Passport
  { id: "passport", s: "help", cat: "Creator Passport", t: "What is the Creator Passport?", k: "passport public profile portfolio link bio media kit page",
    b: ["Your Creator Passport is your public profile, one link you can share anywhere. It shows your portfolio, niche, audience, work samples, brand collaborations and achievements, so brands see you at your best."] },
  { id: "passport-hide", s: "help", cat: "Creator Passport", t: "Can I hide things on my Passport?", k: "hide private visible public passport earnings income show hidden",
    b: ["Yes. Go to Me › Settings › Privacy Center › Privacy controls. You choose whether your Passport is public and what it shows. Earnings are hidden by default."] },
  { id: "verified", s: "help", cat: "Creator Passport", t: "What do Verified and Self-reported mean?", k: "verified self reported proof real badge earnings label",
    b: [["Verified: confirmed through a connected account or proof, like a contract or payment record.", "Self-reported: you entered it yourself. We always label it clearly."], "Labels keep things honest for you, other creators and brands."] },

  // ---- Brands & Deals
  { id: "brand-list", s: "help", cat: "Brands & Deals", t: "How are brands in the Brands list chosen?", k: "brands list tiktok shop legit legitimate real chosen added directory",
    b: ["Brands are listed from their own published creator and affiliate programs — their program pages, affiliate networks and TikTok Shop. Each brand is labeled capped, uncapped or unknown commission, and “uncapped” is only used when the program’s own words say there is no cap.", "A listing is information, not an endorsement, and it isn’t a guarantee a brand will accept you or pay you. If something looks wrong, tell us through Report a problem in Settings."] },
  { id: "commission", s: "help", cat: "Brands & Deals", t: "What do capped, uncapped and unknown commission mean?", k: "commission capped uncapped unknown rate affiliate percent limit",
    b: [["Capped: there’s a limit on what you can earn.", "Uncapped: no stated limit.", "Unknown: the brand hasn’t confirmed it. Ask before you commit any work."]] },
  { id: "deals", s: "help", cat: "Brands & Deals", t: "How does Deals protect my money?", k: "deals track payment paid late unpaid owe invoice protect money campaign deliverables due",
    b: ["Deals keeps a record of every campaign: deliverables, due dates, how much you’re owed and whether it’s been paid. You get reminders when a payment is late, and your deal records and protection checklist stay in one place.", "Ultra Vestra doesn’t hold or send payments. Brands and platforms pay you directly."] },
  { id: "unpaid", s: "help", cat: "Brands & Deals", t: "A brand didn’t pay me. What can I do?", k: "brand didnt pay unpaid late payment owe money not paid chase",
    b: [["Check the deal in Deals: the agreed amount, the due date and your delivered work.", "Send the brand a polite reminder with that record attached.", "Use the platform’s support (for example TikTok Shop) if the deal ran there.", "Report the brand to us so we can warn other creators."]] },
  { id: "report-brand", s: "help", cat: "Brands & Deals", t: "How do I report a suspicious brand or deal?", k: "report suspicious brand deal fake scam flag problem",
    b: ["Go to Me › Settings › Report a problem, or open Support from Settings. Tell us what happened. Don’t include passwords or card numbers."] },

  // ---- Growth & rewards
  { id: "invites", s: "help", cat: "Growth & rewards", t: "How do invites and rewards work?", k: "invite invites referral refer friend link reward rewards premium",
    b: ["You get a personal invite link. An invite counts when your friend finishes their Creator DNA, not just when they sign up.", ["1 friend: glow profile frame", "3 friends: 1 month of Premium", "5 friends: Diamond card preview", "10 friends: “Connector” Hall of Fame badge"]] },
  { id: "levels", s: "help", cat: "Growth & rewards", t: "How do levels and tiers work?", k: "level levels tier tiers bronze silver gold diamond milestone milestones streak",
    b: ["You move up from Bronze to Silver, Gold and Diamond by hitting real milestones. Silver takes 1 campaign and $500 collected. Gold takes 5 campaigns and $2,500 collected. Diamond takes 10 campaigns and $5,000 collected. Your Levels screen in Me shows your real progress."] },
  { id: "challenges", s: "help", cat: "Growth & rewards", t: "What are Creator Challenges?", k: "challenge challenges weekly compete competition friends",
    b: ["Weekly challenges, like 7 days of consistent posting, getting your first brand deal, improving your hooks or building your media kit in 24 hours. Invite friends to compete with you."] },
  { id: "hof", s: "help", cat: "Growth & rewards", t: "How does the Hall of Fame work?", k: "hall of fame leaderboard rank ranking top best consistency improvement community favorite",
    b: ["The Hall of Fame recognizes creators each month for best consistency, best campaign performance, biggest improvement and community favorite. Rankings use verified activity only. You can opt out in the Privacy Center."] },
  // ---- What If
  { id: "whatif", s: "help", cat: "Vestra What If", t: "What is Vestra What If?", k: "what if simulator simulation scenario decision calculator future career move save invest car",
    b: ["Vestra What If is a life decision simulator. Pick a question, like changing careers or saving $300 a month, enter your numbers, and see both paths side by side: your current path, the alternative, the financial impact, the risks and where each could be in 1, 5 and 10 years."] },
  { id: "whatif-advice", s: "help", cat: "Vestra What If", t: "Is Vestra What If financial advice?", k: "financial advice advisor accurate guarantee prediction what if",
    b: ["No. It shows estimates based on the numbers and growth rates you enter. It isn’t a prediction, a guarantee or financial advice. For big decisions, talk to a qualified professional."] },

  // ---- Account
  { id: "password", s: "help", cat: "Account", t: "I forgot my password", k: "forgot password reset login sign in cant log in locked out access",
    b: ["On the Sign in screen, tap Forgot password. We’ll email you a reset link. We will never ask for your password in chat, by DM or by email."] },
  { id: "switch", s: "help", cat: "Account", t: "How do I switch accounts or log out?", k: "switch account log out logout sign out second account",
    b: ["Go to Me › Settings › Login. Tap Switch account to change accounts, or Log out to sign out on this device."] },
  { id: "delete", s: "help", cat: "Account", t: "How do I delete my account?", k: "delete account remove close cancel deactivate erase",
    b: ["Go to Me › Settings › Privacy Center › Delete my account and send the deletion request. The team confirms it by email, and your data is permanently deleted within {DELETE_DAYS} days of the confirmed request, except anything we must keep by law."] },
  { id: "download", s: "help", cat: "Account", t: "How do I download my data?", k: "download export copy data information get my data",
    b: ["Go to Me › Settings › Privacy Center › Download my data, or Settings › Your data. Your browser downloads one file with a copy of your account data right away — nothing is emailed."] },
  { id: "contact", s: "help", cat: "Account", t: "How do I contact a person?", k: "contact human person support team agent email talk someone help",
    b: ["Tap Talk to a person in Vestra Help, open Support from Settings, or email {SUPPORT_EMAIL}. We usually reply within {RESPONSE_TIME}."] },

  // ---- Safety
  { id: "scams", s: "help", cat: "Safety", t: "Stay safe from scams", k: "scam scams fraud fake phishing dm message asked password code pay upfront suspicious safe",
    b: ["Ultra Vestra will never ask for your password, login codes or card number, in chat, by DM or by email.", ["Real brands don’t ask you to pay to join a campaign.", "Be careful with links in DMs that ask you to log in.", "Look for the Verified label on brands and deals.", "If something feels off, stop and report it."]] },
  { id: "never-ask", s: "help", cat: "Safety", t: "Will Ultra Vestra ever ask for my password or card number?", k: "ask password card number code otp verification bank never",
    b: ["Never. Not in chat, not by DM, not by email. If someone claiming to be Ultra Vestra asks, it’s a scam. Don’t reply, and report it."] },

  // ---- Privacy Policy (legal protocol §1 — protocol wording wins)
  { id: "p-collect", s: "privacy", cat: "Privacy Policy", t: "What information we collect", k: "collect data information personal what gather store",
    b: [["Account info: your name, email and login details.", "Creator info you add: niche, portfolio, work samples and media kit.", "Connected account stats you approve, like followers, views and engagement.", "Deals and earnings you add, labeled Verified or Self-reported.", "App usage data, to keep the app working and improve it."]] },
  { id: "p-use", s: "privacy", cat: "Privacy Policy", t: "How we use your information", k: "use data information purpose why",
    b: [["To run your tools: Content DNA, Deals, Passport, levels and What If.", "To match you with brand opportunities.", "To keep your account safe and prevent fraud.", "To send messages you asked for. You can turn off tips and updates any time."]] },
  { id: "p-public", s: "privacy", cat: "Privacy Policy", t: "What’s public and what stays private", k: "public private visible who can see hidden earnings passport show",
    b: ["Public only if you choose: your Passport, your Hall of Fame entries and anything you share, like your DNA card.", "Private by default: your earnings, deal details, contracts and What If scenarios."] },
  { id: "p-connected", s: "privacy", cat: "Privacy Policy", t: "Connected accounts (TikTok, Instagram and more)", k: "connect connected tiktok instagram youtube account social permission post",
    b: ["When you connect an account, we read only the stats you approve. We never post for you without asking. You can disconnect any time, and we stop pulling new data."] },
  { id: "p-share", s: "privacy", cat: "Privacy Policy", t: "Who we share information with", k: "share sell selling sold third party brands advertisers data",
    b: ["We don’t sell your personal information, and we don’t share it for cross-context behavioral advertising.", ["Service providers who help us run the app (like hosting and email), under contract.", "Brands see only your public Passport or what you choose to send them.", "Authorities, when the law requires it."]] },
  { id: "p-rights", s: "privacy", cat: "Privacy Policy", t: "Your choices and rights", k: "rights access correct delete download choices control gdpr ccpa",
    b: ["You can see, download, correct or delete your data from the Privacy Center (Me › Settings › Privacy Center). Download gives you a copy of your account data. Depending on where you live, you may have extra rights. Contact {PRIVACY_EMAIL} and we’ll help."] },
  { id: "p-cookies", s: "privacy", cat: "Privacy Policy", t: "Cookies and similar technology", k: "cookies cookie local storage trackers tracking advertising browser",
    b: ["We use the cookies and local storage needed to keep you signed in, remember your settings and run the app’s on-device features. We don’t use third-party advertising trackers. You can clear cookies in your browser; some features may stop working until you sign in again."] },
  { id: "p-incident", s: "privacy", cat: "Privacy Policy", t: "If there’s a security incident", k: "breach security incident hack notify notification compromised",
    b: ["If a breach affects your personal information, we’ll notify you and the authorities as the law requires, without unreasonable delay, and tell you what happened and what we’re doing about it."] },
  { id: "p-security", s: "privacy", cat: "Privacy Policy", t: "How we protect your information", k: "security secure protect encryption safe hack breach",
    b: ["We use safeguards like encrypted connections and limited staff access. No system is perfect, so use a strong, unique password and never share your login codes."] },
  { id: "p-retention", s: "privacy", cat: "Privacy Policy", t: "How long we keep information", k: "keep retention how long store stored after delete",
    b: ["We keep your data while your account is open. After you delete your account, we remove it within {DELETE_DAYS} days, except anything we must keep by law."] },
  { id: "p-age", s: "privacy", cat: "Privacy Policy", t: "Age requirement", k: "age old minimum kids teen children young",
    b: ["You must be at least {MIN_AGE} to use Ultra Vestra."] },
  { id: "p-contact", s: "privacy", cat: "Privacy Policy", t: "Contact us about privacy", k: "privacy contact email question",
    b: ["Questions about your privacy? Email {PRIVACY_EMAIL}."] },

  // ---- Terms (legal protocol §2–§17 — protocol wording wins)
  { id: "t-tos", s: "terms", cat: "Terms", t: "Terms of Service", d: "The agreement for using Ultra Vestra", k: "terms service agreement rules legal contract tos own content license",
    b: ["These terms are an agreement between you and {COMPANY} for using Ultra Vestra.",
      ["Your account: keep your login safe. You’re responsible for activity on your account.", "Billing: paid plans are billed monthly in advance through Stripe at the prices shown on the Pricing page (Starter $29.99, Pro $49.99, Elite $99.99). Your plan renews automatically each month until you cancel. No refunds. You can cancel anytime — your plan stays active until the end of the current paid period and won't renew. If a payment fails, we may retry it and may pause paid features until it succeeds. Prices may change; we’ll tell you before a change applies to you, and it takes effect on your next renewal. Prices don’t include taxes that may apply where you live; any such taxes are added at checkout or are your responsibility.", "Your content: you own what you create. By making something public, you let us display it in the app.", "Brands and deals: agreements are between you and the brand. Ultra Vestra isn’t a party to them, doesn’t hold or send payments, and doesn’t guarantee payment. Brands and platforms pay you directly.", "Fair use: no fake accounts, fake stats, spam or scams.", "Ending things: you can delete your account any time. We may suspend accounts that break these terms.", "Changes: we’ll tell you before important changes take effect."],
      "These terms are governed by the laws of {LOCATION}. Questions: {SUPPORT_EMAIL}."] },
  { id: "t-community", s: "terms", cat: "Terms", t: "Community Guidelines", d: "How we treat each other here", k: "community guidelines rules behavior respect fake followers spam disclose ads",
    b: [["Be real: no bought followers, fake stats or fake reviews.", "Be respectful: no harassment or hate.", "No spam or scams, ever.", "Disclose paid partnerships as the law and each platform require.", "Respect other people’s work. Only share content you own or have rights to."]] },
  { id: "t-earnings", s: "terms", cat: "Terms", t: "Earnings & Claims Policy", d: "Keeping income numbers honest", k: "earnings claims income money verified self reported fake numbers policy",
    b: ["Every earnings figure in Ultra Vestra is labeled Verified or Self-reported. Don’t post false income claims. Hall of Fame rankings use verified activity only. We may remove claims we can’t support."] },
  { id: "t-rewards", s: "terms", cat: "Terms", t: "Invite & Rewards Terms", d: "How invites count, and what isn’t allowed", k: "invite rewards terms referral rules self referral fake accounts cash value",
    b: [["An invite counts when the invited friend finishes their Creator DNA.", "No self-invites, fake accounts or spam.", "Rewards have no cash value and can’t be transferred.", "We may change rewards, or remove rewards earned through abuse."]] },
  { id: "t-hof", s: "terms", cat: "Terms", t: "Hall of Fame & Challenges Rules", d: "Fair play for leaderboards and challenges", k: "hall of fame challenges rules leaderboard fair play disqualify",
    b: [["Rankings use verified activity only.", "You can opt out of the Hall of Fame any time (Privacy Center).", "Cheating, fake engagement or bought views means disqualification."]] },
  { id: "t-whatif", s: "terms", cat: "Terms", t: "Vestra What If Disclaimer", d: "Estimates, not advice", k: "what if disclaimer estimates advice financial",
    b: ["Vestra What If shows estimates from the numbers you enter. It isn’t financial, legal or tax advice, and it doesn’t predict or guarantee results."] },
  { id: "t-dna", s: "terms", cat: "Terms", t: "Creator DNA & Scores Disclaimer", d: "What scores can and can’t tell you", k: "dna scores disclaimer guarantee brand deals",
    b: ["Creator DNA types and readiness scores are guidance based on your data. They don’t guarantee brand deals, income or growth."] },
  { id: "t-safety", s: "terms", cat: "Terms", t: "Safety Commitment", d: "What we will never ask you for", k: "safety commitment never ask password codes card scam report",
    b: ["Ultra Vestra will never ask for your password, login codes or card number — not in chat, not by DM, not by email. If someone claiming to be Ultra Vestra asks, it’s a scam. Don’t reply, and report it (Me › Settings › Report a problem)."] },
  { id: "t-directory", s: "terms", cat: "Terms", t: "Brand Directory Disclaimer", d: "Listings are information, not a promise", k: "brand directory disclaimer listing endorsement commission labels legitimate guarantee accept pay",
    b: ["The Brands directory is information, not a promise. Commission labels (capped / uncapped / unknown) reflect what a brand or its program published when we checked; programs change without telling us, so confirm terms with the brand before you do work. A listing is not an endorsement, and Ultra Vestra doesn’t guarantee that any brand is legitimate, will accept you, or will pay you. Your agreements are with the brand, never with Ultra Vestra."] },
  { id: "t-ai", s: "terms", cat: "Terms", t: "AI & Analysis Disclaimer", d: "Automated reads are guidance, not guarantees", k: "ai artificial intelligence automated analysis buyer brain video lab output wrong guidance",
    b: ["Some features use AI and automated analysis (including the Video Lab / Buyer Brain reads, Content DNA patterns and readiness scores). Output is guidance generated from your data. It can be incomplete or wrong, and it doesn’t guarantee brand deals, income, growth or results. You decide what to act on."] },
  { id: "t-thirdparty", s: "terms", cat: "Terms", t: "Third-Party Platforms & Links", d: "Other platforms run under their own rules", k: "third party platforms links tiktok instagram shop responsible suspended account program",
    b: ["Ultra Vestra connects with and links to third-party platforms (including TikTok, Instagram and TikTok Shop). Those platforms are run by their own companies under their own terms and privacy policies. We’re not responsible for their content, availability, decisions or policies — including a platform suspending an account or a program."] },
  { id: "t-copyright", s: "terms", cat: "Terms", t: "Copyright & Takedown (DMCA)", d: "Report infringement, or answer a takedown", k: "copyright dmca takedown infringement infringe stolen video counter notice remove content rights",
    b: ["You may only upload or share content you own or have the rights to use. If you believe content in Ultra Vestra infringes your copyright, email {SUPPORT_EMAIL} with: your name, the work you own, where the infringing content appears, and a statement that you have a good-faith belief the use isn’t authorized. We’ll review and remove infringing content, and we may close repeat infringers’ accounts. If your content was removed by mistake, you may send a counter-notice to the same email."] },
  { id: "t-warranty", s: "terms", cat: "Terms", t: "Warranty Disclaimer", d: "The app is provided “as is”", k: "warranty warranties as is available implied fitness uninterrupted error free current",
    b: ["Ultra Vestra is provided “as is” and “as available”, without warranties of any kind, express or implied — including fitness for a particular purpose and non-infringement — to the fullest extent the law allows. We don’t warrant that the app will be uninterrupted, error-free, or that data (including brand program terms) is always current."] },
  { id: "t-liability", s: "terms", cat: "Terms", t: "Limitation of Liability & Indemnification", d: "How liability is limited, and what you cover", k: "liability liable damages indemnify indemnification limit claim lost income consequential",
    b: ["To the fullest extent the law allows, Ultra Vestra’s total liability for any claim arising from the app is limited to the amount you paid us in the 3 months before the claim, and we aren’t liable for indirect, incidental or consequential damages — including lost income from brand deals, which are agreements between you and the brand. You agree to indemnify Ultra Vestra against claims arising from your content, your deals, or your breaking of these terms. Nothing here limits liability that can’t be limited by law."] },
  { id: "t-disputes", s: "terms", cat: "Terms", t: "Disputes", d: "Talk to us first, then Iowa courts", k: "disputes dispute court courts iowa law venue arbitration class action sue legal",
    b: ["Talk to us first: email {SUPPORT_EMAIL} and we’ll try to resolve any dispute informally within 30 days. If we can’t, disputes are resolved in the state or federal courts located in Iowa, under Iowa law, and both sides consent to that venue."] },
  { id: "t-general", s: "terms", cat: "Terms", t: "General", d: "Severability, updates and notices", k: "general severability unenforceable entire agreement updates material changes notices version",
    b: ["If any part of this protocol is found unenforceable, the rest stands. These documents are the entire agreement about the app between you and Ultra Vestra and replace earlier versions. We may update this protocol; we’ll announce material changes in the app or by email before they take effect, and the version + effective date at the top always show the current text. Legal notices to Ultra Vestra go to {SUPPORT_EMAIL}."] },
];

export const articleById = new Map<string, HelpArticle>(
  KB.map((a) => [a.id, a])
);

export const HELP_POPULAR = [
  "invites",
  "deals",
  "commission",
  "passport-hide",
  "delete",
  "scams",
];

export const HELP_SUGGEST = [
  "How do invites work?",
  "Can I hide my earnings?",
  "What does capped commission mean?",
  "A brand didn’t pay me",
  "Do you sell my data?",
  "How do I delete my account?",
];

/** Related articles for the Article view: same category first, then
 *  the search engine's picks (the prototype's openArticle rule). */
export function relatedFor(a: HelpArticle): HelpArticle[] {
  const same = KB.filter((x) => x.cat === a.cat && x.id !== a.id).slice(0, 4);
  if (same.length >= 2) return same;
  return searchHelp(a.t + " " + a.k)
    .map((r) => r.a)
    .filter((x) => x.id !== a.id)
    .slice(0, 3);
}

// ================= SEARCH ENGINE (the prototype's, ported) =================
const STOP = new Set(
  "a an the i me my mine im i’m how do does did what whats is are was be been can could to of in on for it its and or with you your we our us be this that will if at by from about get got have has there when where why which who should would any some much many so as up all just want need know tell please ultra vestra app hi hey ok okay there one way thing things am also into like make sure only really still than then them they those very".split(
    /\s+/
  )
);

const SYN: string[][] = [
  ["delete", "remove", "close", "deactivate", "cancel", "erase"],
  ["password", "login", "signin", "locked", "reset", "forgot"],
  ["invite", "refer", "referral", "friend"],
  ["earning", "income", "money", "revenue", "salary"],
  ["pay", "paid", "payment", "payout", "owe", "unpaid", "invoice"],
  ["brand", "company", "sponsor"],
  ["deal", "campaign", "collab", "collaboration", "contract"],
  ["scam", "fraud", "fake", "phishing", "suspicious", "hack"],
  ["privacy", "private", "data", "information", "personal"],
  ["price", "cost", "pricing", "subscription", "premium", "plan", "fee"],
  ["dna", "assessment", "quiz", "personality"],
  ["passport", "profile", "portfolio", "bio"],
  ["level", "tier", "rank", "badge", "milestone"],
  ["hall", "fame", "leaderboard", "ranking"],
  ["whatif", "simulator", "simulation", "scenario", "calculator"],
  ["commission", "capped", "uncapped", "affiliate"],
  ["download", "export"],
  ["verify", "verified", "proof", "real", "legit", "legitimate"],
  ["hide", "hidden", "visible", "public", "show", "see"],
  ["contact", "human", "person", "agent", "support", "someone", "email"],
  ["sell", "sold", "selling", "share"],
];

export function stem(w: string): string {
  if (w.length > 5 && /ies$/.test(w)) return w.slice(0, -3) + "y";
  if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
  if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
  return w;
}

const SYNMAP: Record<string, string> = {};
SYN.forEach((g, i) => {
  g.forEach((w) => {
    SYNMAP[stem(w)] = "#g" + i;
  });
});

export function helpTokens(text: string): string[] {
  const out: string[] = [];
  String(text)
    .toLowerCase()
    .replace(/what if/g, "whatif")
    .replace(/log ?out|sign ?out/g, "logout")
    .replace(/log ?in|sign ?in/g, "login")
    .replace(/hall of fame/g, "hall fame")
    .replace(/[’']/g, "")
    .split(/[^a-z0-9$]+/)
    .forEach((w) => {
      if (!w || STOP.has(w) || w.length < 2) return;
      const s = stem(w);
      out.push(s);
      if (SYNMAP[s]) out.push(SYNMAP[s]);
    });
  return out;
}

function bodyText(a: HelpArticle): string {
  return a.b
    .map((x) => (Array.isArray(x) ? x.join(" ") : x))
    .join(" ");
}

interface IndexedArticle {
  a: HelpArticle;
  title: Set<string>;
  keys: Set<string>;
  body: Set<string>;
}

const INDEX: IndexedArticle[] = KB.map((a) => {
  const set = (arr: string[]) => new Set(arr);
  return {
    a,
    title: set(helpTokens(a.t)),
    keys: set(helpTokens(a.k + " " + a.cat)),
    body: set(helpTokens(fillTokens(bodyText(a)))),
  };
});

const DF: Record<string, number> = {};
INDEX.forEach((d) => {
  const all = new Set<string>([
    ...d.title,
    ...d.keys,
    ...d.body,
  ]);
  all.forEach((t) => {
    DF[t] = (DF[t] || 0) + 1;
  });
});

export interface HelpSearchResult {
  a: HelpArticle;
  score: number;
}

export function searchHelp(q: string): HelpSearchResult[] {
  const qt = helpTokens(q);
  const terms = [...new Set(qt)];
  if (!terms.length) return [];
  const res = INDEX.map((d) => {
    let score = 0;
    let hits = 0;
    terms.forEach((t) => {
      const idf = Math.log(1 + KB.length / (DF[t] || 0.5));
      const w =
        (d.title.has(t) ? 3 : 0) +
        (d.keys.has(t) ? 2.5 : 0) +
        (d.body.has(t) ? 1 : 0);
      if (w) {
        hits++;
        score += idf * w * (t.charAt(0) === "#" ? 0.6 : 1);
      }
    });
    return { a: d.a, score: score * (0.6 + (0.4 * hits) / terms.length) };
  }).filter((r) => r.score > 0);
  res.sort((x, y) => y.score - x.score);
  return res;
}

/** The chat's answer threshold (the prototype's THRESHOLD). */
export const HELP_THRESHOLD = 4.2;

/** Minimum score for a Help Center search result row (prototype: 1.5). */
export const HELP_LIST_MIN = 1.5;

// ================= SENSITIVE-INFO GUARD (the prototype's) =================
function luhn(num: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num.charAt(i), 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function sensitiveFinds(text: string): string[] {
  const found: string[] = [];
  const cards = text.match(/(?:\d[ -]?){13,19}/g) || [];
  if (
    cards.some((c) => {
      const d = c.replace(/\D/g, "");
      return d.length >= 13 && d.length <= 19 && luhn(d);
    })
  )
    found.push("a card number");
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) found.push("an ID number");
  if (/\b(pass(word|code)?|pwd|pin)\b\s*(is|:|=|-)\s*\S+/i.test(text))
    found.push("a password");
  if (/\b(code|otp|verification|2fa)\b[^\d]{0,12}\d{4,8}\b/i.test(text))
    found.push("a login code");
  if (
    /\b(routing|account|acct|iban)\b\s*(number|no\.?|#)?\s*(is|:)?\s*[a-z]{0,4}\d{6,}/i.test(
      text
    )
  )
    found.push("bank details");
  return found;
}

// ================= ASK VESTRA HELP — answer selection (pure) =================
export type HelpAnswer =
  | { kind: "sensitive"; found: string[] }
  | { kind: "smalltalk"; text: string }
  | { kind: "human" }
  | { kind: "article"; article: HelpArticle; related: HelpArticle[] }
  | { kind: "fallback" };

const HUMAN_RE =
  /\b(talk|speak|chat) (to|with) (a |an )?(person|human|someone|agent|real)|\breal person\b|\bhuman\b|\bagent\b/i;

/** The prototype's ask() decision, minus DOM/rate-limit side effects:
 *  sensitive guard → small talk → human handoff → corpus search with
 *  the threshold → honest fallback. */
export function answerFor(q: string): HelpAnswer {
  const risky = sensitiveFinds(q);
  if (risky.length) return { kind: "sensitive", found: risky };
  const low = q.toLowerCase();
  if (/^(hi|hey|hello|yo|good (morning|afternoon|evening))\b[!. ]*$/i.test(low))
    return {
      kind: "smalltalk",
      text: "Hi! Ask me anything about Ultra Vestra: invites, deals, your Passport, privacy and more.",
    };
  if (/^(thanks|thank you|thx|ty|appreciate it)\b/i.test(low))
    return {
      kind: "smalltalk",
      text: "Anytime! Anything else I can help with?",
    };
  if (HUMAN_RE.test(low)) return { kind: "human" };
  const res = searchHelp(q);
  if (!res.length || res[0].score < HELP_THRESHOLD)
    return { kind: "fallback" };
  const top = res[0].a;
  const related = res
    .slice(1)
    .filter((r) => r.score >= HELP_THRESHOLD * 0.7)
    .slice(0, 2)
    .map((r) => r.a);
  return { kind: "article", article: top, related };
}

// ================= PRIVACY CONTROLS (device-local preferences) =================
/** The Privacy Center toggles that govern on-device surfaces (the
 *  Hall of Fame and Challenges are device-local in this app). The
 *  Public Passport toggle is NOT here — it is the real server flag
 *  (PATCH /api/passport/share), wired in the Privacy Center itself. */
export interface PrivacyControl {
  id: string;
  t: string;
  s: string;
  on: boolean;
}

export const PRIVACY_CONTROLS: PrivacyControl[] = [
  { id: "hallOfFame", t: "Appear in the Hall of Fame", s: "Rankings use verified activity only.", on: true },
  { id: "friendChallenges", t: "Show me in friends’ challenges", s: "Friends can see your challenge progress.", on: true },
  { id: "brandMatches", t: "Personalized brand matches", s: "Use my Content DNA to suggest brands.", on: true },
];

export const PRIVACY_STORE_KEY = "uv.privacy";
