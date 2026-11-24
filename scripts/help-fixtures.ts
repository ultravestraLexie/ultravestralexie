// ============================================================================
// Support & About (Help Center package) — acceptance fixtures, 2026-11-24.
//
// The rules pinned here:
//  - The corpus is the owner's legal protocol made searchable: privacy
//    and terms articles carry the protocol's wording (verbatim refund
//    sentence, real plan prices, real inbox, Iowa law, 30-day deletion
//    window, 1–2 business day response time), plus the protocol's
//    full-coverage additions (§10–§17) as Terms articles.
//  - Ask Vestra Help answers ONLY from that corpus, through the
//    prototype's own local matching: a question with a known answer
//    returns its article; an off-corpus question returns the honest
//    fallback (never a guess); a human request routes to the handoff;
//    the sensitive-info guard fires before anything else.
//  - No prototype placeholder survives: every {TOKEN} resolves and no
//    [BRACKET] text ships.
//
// Run (from the repo root):
//   npx tsx scripts/help-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  HELP_CONFIG,
  HELP_POPULAR,
  HELP_SUGGEST,
  KB,
  answerFor,
  articleById,
  fillTokens,
  relatedFor,
  searchHelp,
  sensitiveFinds,
} from "../lib/galaxy/help";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`PASS ${label}`);
  } else {
    failures += 1;
    console.log(`FAIL ${label}\n  expected: ${e}\n  actual:   ${a}`);
  }
}

function bodyOf(id: string): string {
  const a = articleById.get(id);
  if (!a) return "";
  return fillTokens(
    a.b.map((x) => (Array.isArray(x) ? x.join(" ") : x)).join(" ")
  );
}

/* ------------------------------ Corpus integrity ------------------------------ */

check("corpus: article ids are unique", new Set(KB.map((a) => a.id)).size, KB.length);
check(
  "corpus: popular ids all exist",
  HELP_POPULAR.every((id) => articleById.has(id)),
  true
);
check(
  "corpus: privacy articles = protocol §1 (12 sections)",
  KB.filter((a) => a.s === "privacy").length,
  12
);
check(
  "corpus: terms articles = protocol §2–§17 (16 articles)",
  KB.filter((a) => a.s === "terms").length,
  16
);
check(
  "corpus: no unresolved {TOKEN} in any filled body",
  KB.every((a) => !bodyOf(a.id).includes("{")),
  true
);
check(
  "corpus: no [BRACKET] placeholder in any filled body",
  KB.every((a) => !/\[[A-Z][A-Z /–-]+\]/.test(bodyOf(a.id))),
  true
);
check(
  "corpus: every article has keywords",
  KB.every((a) => a.k.trim().length > 0),
  true
);
check(
  "corpus: every terms article has a list description",
  KB.filter((a) => a.s === "terms").every((a) => !!a.d),
  true
);

/* ------------------------------ Protocol facts ------------------------------ */

check("config: support email is the real academy inbox", HELP_CONFIG.supportEmail, "ultravestraacademy@gmail.com");
check("config: privacy email is the real academy inbox", HELP_CONFIG.privacyEmail, "ultravestraacademy@gmail.com");
check("config: company is the operating name", HELP_CONFIG.company, "Ultra Vestra");
check("config: effective date", HELP_CONFIG.effectiveDate, "November 24, 2026");
check("config: minimum age", HELP_CONFIG.minAge, "18");
check("config: deletion window", HELP_CONFIG.deleteDays, "30");
check("config: response time", HELP_CONFIG.responseTime, "1–2 business days");

const REFUND =
  "No refunds. You can cancel anytime — your plan stays active until the end of the current paid period and won't renew.";
check("protocol: pricing article carries the verbatim refund sentence", bodyOf("pricing").includes(REFUND), true);
check("protocol: terms of service carries the verbatim refund sentence", bodyOf("t-tos").includes(REFUND), true);
check("protocol: pricing names all three real prices",
  ["$29.99", "$49.99", "$99.99"].every((p) => bodyOf("pricing").includes(p)), true);
check("protocol: pricing has no free plan claim", bodyOf("pricing").includes("there is no free plan"), true);
check("protocol: governing law is Iowa", bodyOf("t-tos").includes("the State of Iowa, United States"), true);
check("protocol: deletion window in the delete article", bodyOf("delete").includes("within 30 days"), true);
check("protocol: retention window", bodyOf("p-retention").includes("within 30 days"), true);
check("protocol: age requirement is 18", bodyOf("p-age").includes("at least 18"), true);
check("protocol: no data selling", bodyOf("p-share").includes("don’t sell your personal information"), true);
check("protocol: cookies article exists", articleById.has("p-cookies"), true);
check("protocol: security-incident article exists", articleById.has("p-incident"), true);
check("protocol: download is a direct download, not an email", bodyOf("download").includes("nothing is emailed"), true);
check("protocol: contact carries the response time", bodyOf("contact").includes("1–2 business days"), true);

/* ------------------------------ Search ------------------------------ */

check("search: top hit for 'commission' is the commission article",
  searchHelp("commission")[0]?.a.id, "commission");
check("search: top hit for 'invites' is the invites article",
  searchHelp("how do invites work")[0]?.a.id, "invites");
check("search: empty query returns nothing", searchHelp(""), []);
check("search: results are score-ordered", (() => {
  const r = searchHelp("brand deal payment");
  return r.every((x, i) => i === 0 || r[i - 1].score >= x.score);
})(), true);

/* ------------------------------ Ask: answer selection ------------------------------ */

function kindOf(q: string): string {
  const a = answerFor(q);
  return a.kind === "article" ? `article:${a.article.id}` : a.kind;
}

check("ask: 'How do invites work?' → invites article", kindOf("How do invites work?"), "article:invites");
check("ask: 'Can I hide my earnings?' → passport-hide", kindOf("Can I hide my earnings?"), "article:passport-hide");
check("ask: 'What does capped commission mean?' → commission", kindOf("What does capped commission mean?"), "article:commission");
check("ask: 'A brand didn’t pay me' → unpaid", kindOf("A brand didn’t pay me"), "article:unpaid");
check("ask: 'Do you sell my data?' → p-share", kindOf("Do you sell my data?"), "article:p-share");
check("ask: 'How do I delete my account?' → delete", kindOf("How do I delete my account?"), "article:delete");
check("ask: takedown question → copyright article (§13)", kindOf("Someone stole my video — how do I file a copyright takedown?"), "article:t-copyright");
check("ask: liability question → liability article (§15)", kindOf("What is your liability limit if I lose income from a deal?"), "article:t-liability");
check("ask: dispute question → disputes article (§16)", kindOf("How are disputes resolved — which courts?"), "article:t-disputes");
check("ask: directory question → directory disclaimer (§10)", kindOf("Is a brand in the directory guaranteed legitimate?"), "article:t-directory");
check("ask: scam question → never-ask or scams", ["article:never-ask", "article:scams"].includes(kindOf("Someone in a DM asked for my password — is that a scam?")), true);
check("ask: greeting is small talk", kindOf("hi"), "smalltalk");
check("ask: thanks is small talk", kindOf("thank you"), "smalltalk");
check("ask: 'talk to a person' → human handoff", kindOf("Can I talk to a person?"), "human");
check("ask: off-corpus question → honest fallback", kindOf("What is the weather in Paris tomorrow?"), "fallback");
check("ask: nonsense → honest fallback", kindOf("zqx jkvb wobble"), "fallback");
check("ask: every suggestion chip resolves to an answer", HELP_SUGGEST.every((q) => answerFor(q).kind === "article"), true);
check("ask: article answers carry related suggestions", (() => {
  const a = answerFor("How do invites work?");
  return a.kind === "article" && Array.isArray(a.related);
})(), true);

/* ------------------------------ Sensitive-info guard ------------------------------ */

check("guard: detects a Luhn-valid card number", sensitiveFinds("my card is 4242 4242 4242 4242"), ["a card number"]);
check("guard: detects a password statement", sensitiveFinds("my password is hunter2"), ["a password"]);
check("guard: detects an ID number", sensitiveFinds("my ssn is 123-45-6789"), ["an ID number"]);
check("guard: clean question finds nothing", sensitiveFinds("how do invites work"), []);
check("guard: sensitive input short-circuits the answer", answerFor("my card is 4242 4242 4242 4242").kind, "sensitive");

/* ------------------------------ Related articles ------------------------------ */

check("related: same-category picks exclude the article itself",
  relatedFor(articleById.get("invites")!).every((x) => x.id !== "invites"), true);
check("related: invites relates within Growth & rewards",
  relatedFor(articleById.get("invites")!).length > 0, true);

console.log(failures === 0 ? "\nALL HELP FIXTURES PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
