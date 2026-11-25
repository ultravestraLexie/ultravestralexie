// ============================================================================
// Business Engine Phase 4 — acceptance fixtures (owner-confirmed
// rebuild 2026-11-24; his law: if it's there, it leads to
// something).
//
// Pins the business workspace on real records:
//  - Campaigns, Creators and Creator payments read the SAME
//    marketplace + deals tables the Phase 3 loop writes — the
//    on-device sample clients are gone from these routes.
//  - Universe (/me) opens with a strip whose numbers come from
//    the real posts / follows / applications / deals tables and
//    whose every card leads to the destination that owns it.
//
// Run (from the repo root):
//   npx tsx scripts/business4-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync, existsSync } from "fs";

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

const campaigns = read("app/business/campaigns/page.tsx");
check("campaigns: business-guarded", campaigns.includes("requireBusinessAccount"), true);
check("campaigns: reads real listings", campaigns.includes('from("market_listings")'), true);
check("campaigns: reads real applications", campaigns.includes('from("market_applications")'), true);
check("campaigns: committed value from real deals", campaigns.includes('from("creator_deals")'), true);
check("campaigns: sample client gone", campaigns.includes("CampaignsClient"), false);

const creators = read("app/business/creators/page.tsx");
check("creators: business-guarded", creators.includes("requireBusinessAccount"), true);
check("creators: roster is accepted applications", creators.includes('a.status === "accepted"'), true);
check("creators: deal stage read from creator_deals", creators.includes('from("creator_deals")'), true);
check("creators: roster links to creator profiles", creators.includes("href={`/creator/${a.creator_user_id}`}"), true);
check("creators: sample client gone", creators.includes("CreatorsClient"), false);

const payments = read("app/business/customers/page.tsx");
check("payments: business-guarded", payments.includes("requireBusinessAccount"), true);
check("payments: honest title — creator payments", payments.includes("Creator payments"), true);
check("payments: reads real deals", payments.includes('from("creator_deals")'), true);
check("payments: received comes from amount_received_cents", payments.includes("amount_received_cents"), true);
check("payments: sample client gone", payments.includes("CustomersClient"), false);

check("campaigns client file deleted", existsSync("app/business/campaigns/CampaignsClient.tsx"), false);
check("creators client file deleted", existsSync("app/business/creators/CreatorsClient.tsx"), false);
check("customers client file deleted", existsSync("app/business/customers/CustomersClient.tsx"), false);

const me = read("app/me/page.tsx");
check("universe strip: posts counted from posts", me.includes('from("posts")') && me.includes('count: "exact"'), true);
check("universe strip: followers counted from follows", me.includes('from("follows")'), true);
check("universe strip: applications counted", me.includes('from("market_applications")'), true);
check("universe strip: every card leads somewhere", me.includes('href: "/deals"') && me.includes('href: "/market"'), true);

console.log(failures === 0 ? "\nBUSINESS4 FIXTURES: ALL PASS" : `\nBUSINESS4 FIXTURES: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
