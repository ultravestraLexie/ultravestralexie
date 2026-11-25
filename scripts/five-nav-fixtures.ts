// ============================================================================
// Navigation — acceptance fixtures for the REBUILD's five destinations
// (owner-confirmed 2026-11-24): Feed, Studio, Brain, Market, Universe.
//
// What is pinned here:
//  - The nav (one SIDE_NAV list feeding BOTH the desktop rail and
//    the mobile bottom bar) is exactly the five, in order, with the
//    Brain at the center and Universe on /me.
//  - SectionSync's world mapping: /me lives in the Passport world
//    (azure), /p/[slug] still does too; the new destinations fall
//    back to the Today world until their own worlds ship.
//  - /me composes BOTH existing halves — MoneyClient and
//    PassportClient, imported unchanged, each with its own data
//    load performed by the /me server page — under the "Me"
//    header and the two anchor ids (#money, #passport).
//  - /money and /passport redirect to /me (config map + route
//    stubs, the codebase's retired-route pattern); /revenue
//    follows them to /me.
//  - The public Passport /p/[slug] is untouched by the move.
//  - The internal-link sweep: no href-shaped "/money" or
//    "/passport" remains anywhere in app/, components/ or lib/
//    (the two redirect stubs and /p/ excluded; lib/gate-paths.ts
//    keeps the retired prefixes behind the gate, as it does for
//    /dashboard — those are route prefixes, not links).
//
// Run (from the repo root):
//   npx tsx scripts/five-nav-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { sectionForPath } from "../components/galaxy/SectionSync";
import { GATED_PREFIXES } from "../lib/gate-paths";

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

const read = (p: string) => readFileSync(p, "utf8");

/* ---------------- the nav list: exactly the five ----------------- */
/* SIDE_NAV is parsed from the AppNav source: the component module
 * builds its icons as JSX at module level, which the fixture
 * runner cannot import — the literal list in the shipped source
 * is the thing being pinned, in order. */

const appNav = read("components/AppNav.tsx");
const navBlock = appNav.slice(appNav.indexOf("export const SIDE_NAV"));
const navEntries = [...navBlock.matchAll(/\{ href: "([^"]+)", label: "([^"]+)"/g)].map(
  (m) => ({ href: m[1], label: m[2] })
);

check(
  "five nav: labels in order",
  navEntries.map((n) => n.label),
  ["Feed", "Studio", "Brain", "Market", "Universe"]
);
check(
  "five nav: hrefs in order",
  navEntries.map((n) => n.href),
  ["/feed", "/studio", "/brain", "/market", "/me"]
);
check("five nav: exactly five destinations", navEntries.length, 5);
check(
  "five nav: rail and bottom bar both render the one list (each maps it for active state + render)",
  (appNav.match(/SIDE_NAV\.map/g) ?? []).length,
  4
);
check(
  "five nav: no Money or Passport entries remain in the nav source",
  appNav.includes('"/money"') || appNav.includes('"/passport"'),
  false
);

/* ---------------- world mapping ---------------------------------- */

check("world: /today is the today world", sectionForPath("/today"), "today");
check("world: /brands is the brands world", sectionForPath("/brands"), "brands");
check("world: a brand dossier stays in the brands world", sectionForPath("/brands/b1"), "brands");
check("world: /deals is the deals world", sectionForPath("/deals"), "deals");
check("world: /studio is the studio world", sectionForPath("/studio"), "studio");
check("world: /me lives in the passport world (azure)", sectionForPath("/me"), "passport");
check("world: the public passport stays in the passport world", sectionForPath("/p/someone"), "passport");
check("world: unknown paths fall back to today", sectionForPath("/settings"), "today");
check("world: /feed falls back to the today world for now", sectionForPath("/feed"), "today");
check("world: /brain falls back to the today world for now", sectionForPath("/brain"), "today");
check("world: /market falls back to the today world for now", sectionForPath("/market"), "today");
check(
  "gate: the new destinations are gated prefixes",
  ["/feed", "/brain", "/market", "/api/feed", "/api/brain"].every((p) =>
    (GATED_PREFIXES as readonly string[]).includes(p)
  ),
  true
);

/* ---------------- /me composes both halves ------------------------ */

const me = read("app/me/page.tsx");
check(
  "me: header carries the owner's promise line",
  me.includes("Understand your growth — your income, audience and track record in one place."),
  true
);
check(
  "me: both existing clients are composed, not rewritten",
  me.includes('from "../money/MoneyClient"') && me.includes('from "../passport/PassportClient"'),
  true
);
check(
  "me: the two halves carry the anchor ids",
  me.includes('id="money"') && me.includes('id="passport"'),
  true
);
check(
  "me: page performs the Money half's data load",
  me.includes("fetchIncome") && me.includes("fetchExpenses") && me.includes("today={todayKey()}"),
  true
);
check(
  "me: page performs the Passport half's data load",
  me.includes("fetchAudienceSnapshots") &&
    me.includes('from("passport_entries")') &&
    me.includes("passportTrackRecord(deals)"),
  true
);
check("me: page is behind the subscription gate", me.includes('requireSubscription("/me")'), true);
check(
  "gate: /me is a gated prefix",
  (GATED_PREFIXES as readonly string[]).includes("/me"),
  true
);

/* ---------------- redirects for the retired routes ---------------- */

check(
  "redirect: /money stub redirects to /me",
  read("app/money/page.tsx").includes('redirect("/me")'),
  true
);
check(
  "redirect: /passport stub redirects to /me",
  read("app/passport/page.tsx").includes('redirect("/me")'),
  true
);
const config = read("next.config.mjs");
check(
  "redirect: config maps /money and /passport to /me",
  config.includes('["/money", "/me"]') && config.includes('["/passport", "/me"]'),
  true
);
check(
  "redirect: /revenue follows Money into /me",
  config.includes('["/revenue", "/me"]') && read("app/revenue/page.tsx").includes('redirect("/me")'),
  true
);

/* ---------------- the public passport is untouched ---------------- */

const pub = read("app/p/[slug]/page.tsx");
check(
  "public passport: still resolves by passport_slug, no /me redirect",
  pub.includes('.eq("passport_slug", slug)') && !pub.includes('redirect("/me")'),
  true
);

/* ---------------- page identity ----------------------------------- */

check(
  "home: the Today hero carries the Home eyebrow",
  read("app/today/TodayClient.tsx").includes("HOME — KNOW YOUR BUSINESS"),
  true
);
check(
  "brands: the promise leads the header sub-line",
  read("app/brands/BrandsClient.tsx").includes("Find opportunities. Programs you can apply to now."),
  true
);
check(
  "deals: the promise leads the header sub-line",
  read("app/deals/DealsClient.tsx").includes("Protect your money. Every partnership from first pitch to paid."),
  true
);

/* ---------------- internal-link sweep ------------------------------ */

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

const HREF_SHAPE = /(?:href|ctaHref)\s*[:=]\s*\{?\s*"\/(?:money|passport)"/;
const offenders: string[] = [];
for (const root of ["app", "components", "lib"]) {
  for (const file of walk(root)) {
    if (file === "app/money/page.tsx" || file === "app/passport/page.tsx") continue;
    if (file.startsWith("app/p/")) continue;
    if (HREF_SHAPE.test(read(file))) offenders.push(file);
  }
}
check("sweep: no href-shaped /money or /passport links remain", offenders, []);

if (failures > 0) {
  console.log(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll five-nav assertions passed.");
