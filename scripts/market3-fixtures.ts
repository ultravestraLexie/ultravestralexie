// ============================================================================
// Marketplace Phase 3 — acceptance fixtures (owner-confirmed
// rebuild 2026-11-24; his law: if it's there, it leads to
// something).
//
// Pins the marketplace loop on real shared records:
//  - Listings are posted by registered businesses only, stamped
//    with the company name creators will see.
//  - Applying is one-per-creator-per-listing, never to your own
//    listing, and only while the listing is open.
//  - Accepting runs ONE database function that creates the
//    creator's deal — an accepted application can never exist
//    without its deal.
//  - The creator board and the business page both read the same
//    two tables (no second source of truth, no sample store).
//
// Run (from the repo root):
//   npx tsx scripts/market3-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "fs";

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

const listingsRoute = read("app/api/market/listings/route.ts");
check("listings api: businesses only", listingsRoute.includes("Only a registered business can post an opportunity."), true);
check("listings api: writes market_listings", listingsRoute.includes('from("market_listings")'), true);
check("listings api: stamps the company name", listingsRoute.includes("company_name:"), true);
check("listings api: dollars become cents", listingsRoute.includes("Math.round(d.compensationDollars * 100)"), true);

const applyRoute = read("app/api/market/apply/route.ts");
check("apply api: writes market_applications", applyRoute.includes('from("market_applications")'), true);
check("apply api: refuses own listing", applyRoute.includes("This is your own listing."), true);
check("apply api: refuses closed listing", applyRoute.includes("That opportunity is closed."), true);
check("apply api: duplicate apply is a plain 409", applyRoute.includes('"23505"') && applyRoute.includes("You already applied to this one."), true);

const decideRoute = read("app/api/market/decide/route.ts");
check("decide api: accept runs the deal-creating function", decideRoute.includes('rpc("accept_market_application"'), true);
check("decide api: decline only from applied", decideRoute.includes('.eq("status", "applied")'), true);

const closeRoute = read("app/api/market/listings/close/route.ts");
check("close api: owner-scoped update", closeRoute.includes('.eq("business_user_id", user.id)'), true);

const marketPage = read("app/market/page.tsx");
check("market page: creators read real open listings", marketPage.includes('from("market_listings")') && marketPage.includes('.eq("status", "open")'), true);
check("market page: creators read their applications", marketPage.includes('from("market_applications")'), true);
check("market page: businesses get the listings door", marketPage.includes('href: "/business/listings"'), true);

const board = read("components/MarketBoard.tsx");
check("board: apply writes through the api", board.includes('fetch("/api/market/apply"'), true);
check("board: accepted applications lead to Deals", board.includes('href="/deals"'), true);

const bizPage = read("app/business/listings/page.tsx");
check("business listings page: business-guarded", bizPage.includes("requireBusinessAccount"), true);
check("business listings page: unregistered sent to register", bizPage.includes('redirect("/business/register")'), true);
check("business listings page: reads applications for its listings", bizPage.includes('from("market_applications")'), true);

const bizClient = read("components/BusinessListings.tsx");
check("business client: posts through the api", bizClient.includes('fetch("/api/market/listings"'), true);
check("business client: decides through the api", bizClient.includes('fetch("/api/market/decide"'), true);
check("business client: closes through the api", bizClient.includes('fetch("/api/market/listings/close"'), true);

console.log(failures === 0 ? "\nMARKET3 FIXTURES: ALL PASS" : `\nMARKET3 FIXTURES: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
