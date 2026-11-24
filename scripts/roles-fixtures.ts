// ===========================================================================
// Role explainers (owner order 2026-11-24 ~11:39 CT) — acceptance fixtures.
//
// Pins:
//   1. Exactly four roles, in landing order, each with a "looking for"
//      list, a "what you get" list, an honest note and one CTA.
//   2. The CTAs are the real flows: creator -> /get-started; business
//      and brand -> free registration preselected as a brand; agency
//      -> free registration preselected as an agency.
//   3. No "Soon" and no "Phase 5" anywhere in the role copy — brand
//      and agency registration is live, so the prototype's dead cards
//      stay dead nowhere.
//   4. The business-family pages carry the honesty note (the business
//      home is an on-device preview while matching rolls out).
//   5. The explainer page renders from lib/roles and 404s unknown
//      slugs; /roles is not subscription-gated.
//   6. The prototype's product name appears nowhere in the new code.
//
// Run (from the repo root):
//   npx tsx scripts/roles-fixtures.ts
// Exits non-zero if any assertion fails.
// ===========================================================================

import { readFileSync } from "node:fs";
import { ROLES, otherRoles, roleBySlug } from "../lib/roles";

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = Object.is(actual, expected);
  if (!ok) {
    failures += 1;
    console.log(`FAIL ${name}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

check("four roles", ROLES.length, 4);
check(
  "role order",
  ROLES.map((r) => r.slug).join(","),
  "creator,business,agency,brand"
);
for (const r of ROLES) {
  check(`${r.slug} looking-for has 3+ lines`, r.lookingFor.length >= 3, true);
  check(`${r.slug} gets has 4+ lines`, r.gets.length >= 4, true);
  check(`${r.slug} note present`, r.note.length > 20, true);
  check(`${r.slug} resolves by slug`, roleBySlug(r.slug)?.slug, r.slug);
  check(`${r.slug} has 3 other roles`, otherRoles(r.slug).length, 3);
}
check("unknown slug is null", roleBySlug("nobody"), null);
check("creator CTA", roleBySlug("creator")?.ctaHref, "/get-started");
check("business CTA", roleBySlug("business")?.ctaHref, "/business/register?type=brand");
check("brand CTA", roleBySlug("brand")?.ctaHref, "/business/register?type=brand");
check("agency CTA", roleBySlug("agency")?.ctaHref, "/business/register?type=agency");

const allCopy = ROLES.map((r) =>
  [r.desc, r.note, ...r.lookingFor, ...r.gets].join(" ")
).join(" ");
check("no Soon in role copy", allCopy.includes("Soon"), false);
check("no Phase 5 in role copy", allCopy.includes("Phase 5"), false);
check("no prototype product name in role copy", allCopy.includes("Vestra Marketplace"), false);
for (const slug of ["business", "agency", "brand"]) {
  check(
    `${slug} carries the preview honesty note`,
    roleBySlug(slug)?.note.includes("opens as a preview"),
    true
  );
}

const page = readFileSync("app/roles/[role]/page.tsx", "utf8");
check("explainer renders looking-for", page.includes("What you’re looking for"), true);
check("explainer renders gets", page.includes("What you get on UltraVestra"), true);
check("explainer 404s unknown roles", page.includes("notFound()"), true);
check("explainer links the CTA", page.includes("info.ctaHref"), true);
check("explainer offers the other roles", page.includes("otherRoles(info.slug)"), true);

const gatePaths = readFileSync("lib/gate-paths.ts", "utf8");
check("/roles is not gated", gatePaths.includes('"/roles"'), false);

console.log(failures === 0 ? "ALL ROLE FIXTURES PASS" : `${failures} ROLE FIXTURE(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
