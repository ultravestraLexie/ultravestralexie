// ============================================================================
// Business registration (Brand & Agency accounts, v1) — acceptance
// fixtures for the pure module behind the whole system
// (lib/business-registration.ts): the account-type vocabulary, the
// website/email normalizers, and the registration + edit validation
// the API route and both forms share.
//
// Also pinned here, because they are the system's load-bearing
// placement decisions:
//   - the business routes are NOT behind the subscription gate
//     (business accounts hold no subscription), while the creator
//     /api/business prefix stays gated exactly as before;
//   - the migration file (written, not applied by the build) names
//     the same account-type vocabulary and own-row policies the
//     code assumes, so the two cannot drift apart silently.
//
// Run (from the repo root):
//   npx tsx scripts/business-registration-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "node:fs";
import {
  ACCOUNT_TYPES,
  BUSINESS_ACCOUNT_TYPES,
  BUSINESS_CATEGORIES,
  COMPANY_SIZE_BANDS,
  DESCRIPTION_MAX_LENGTH,
  LOOKING_FOR_OPTIONS,
  isBusinessAccountType,
  isValidWorkEmailShape,
  normalizeWebsite,
  resolveAccountType,
  validateBusinessFields,
  validateBusinessRegistration,
} from "../lib/business-registration";
import { isGatedPath } from "../lib/gate-paths";

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

// --- Account-type vocabulary ----------------------------------------------
check("account types are exactly creator/brand/agency", ACCOUNT_TYPES, [
  "creator",
  "brand",
  "agency",
]);
check("business types are exactly brand/agency", BUSINESS_ACCOUNT_TYPES, [
  "brand",
  "agency",
]);
check("isBusinessAccountType('brand')", isBusinessAccountType("brand"), true);
check("isBusinessAccountType('agency')", isBusinessAccountType("agency"), true);
check("isBusinessAccountType('creator')", isBusinessAccountType("creator"), false);
check("isBusinessAccountType(null)", isBusinessAccountType(null), false);
check("resolveAccountType('brand')", resolveAccountType("brand"), "brand");
check("resolveAccountType('agency')", resolveAccountType("agency"), "agency");
check("resolveAccountType('creator')", resolveAccountType("creator"), "creator");
check(
  "resolveAccountType(null) falls back to creator",
  resolveAccountType(null),
  "creator"
);
check(
  "resolveAccountType(garbage) falls back to creator",
  resolveAccountType("superadmin"),
  "creator"
);

// --- Option lists ------------------------------------------------------------
check(
  "categories include the Other fallback",
  BUSINESS_CATEGORIES.includes("Other"),
  true
);
check("size bands run from solo to 1,000+", [
  COMPANY_SIZE_BANDS[0],
  COMPANY_SIZE_BANDS[COMPANY_SIZE_BANDS.length - 1],
], ["Just me (1)", "1,000+"]);
check(
  "brand looking-for leads with campaign creators",
  LOOKING_FOR_OPTIONS.brand[0],
  "Creators for a campaign"
);
check(
  "agency looking-for leads with creators to represent",
  LOOKING_FOR_OPTIONS.agency[0],
  "Creators to represent"
);
check(
  "brand and agency option lists do not overlap",
  LOOKING_FOR_OPTIONS.brand.some((o) => LOOKING_FOR_OPTIONS.agency.includes(o)),
  false
);

// --- Email + website shapes ---------------------------------------------------
check("email: plain address ok", isValidWorkEmailShape("jane@acme.com"), true);
check("email: missing TLD rejected", isValidWorkEmailShape("jane@acme"), false);
check("email: spaces rejected", isValidWorkEmailShape("jane @acme.com"), false);
check("website: bare domain gains https", normalizeWebsite("acme.com"), "https://acme.com");
check(
  "website: full https kept as typed",
  normalizeWebsite("https://acme.com/about"),
  "https://acme.com/about"
);
check(
  "website: http kept as typed",
  normalizeWebsite("http://acme.co"),
  "http://acme.co"
);
check("website: no dot in host rejected", normalizeWebsite("acme"), null);
check("website: spaces rejected", normalizeWebsite("acme inc.com"), null);
check("website: empty rejected", normalizeWebsite("   "), null);

// --- Registration: happy paths -------------------------------------------------
const brandInput = {
  accountType: "brand",
  workEmail: "  Jane@Acme.com ",
  password: "secret1",
  companyName: " Acme Inc. ",
  website: "acme.com",
  contactName: "Jane Acme",
  category: "Beauty & Skincare",
  city: "Des Moines",
  country: "United States",
  companySize: "11–50",
  lookingFor: ["Creators for a campaign"],
  lookingForFreeText: "Sephora launches",
  description: "Skincare brand.",
};
const brandOk = validateBusinessRegistration(brandInput);
check("brand registration validates", brandOk.ok, true);
if (brandOk.ok) {
  check("brand email is normalized lowercase", brandOk.value.workEmail, "jane@acme.com");
  check("brand website is normalized", brandOk.value.website, "https://acme.com");
  check("brand company name is trimmed", brandOk.value.companyName, "Acme Inc.");
  check(
    "brand looking-for merges picks + free text",
    brandOk.value.lookingFor,
    ["Creators for a campaign", "Sephora launches"]
  );
  check("brand account type carried", brandOk.value.accountType, "brand");
}

const agencyOk = validateBusinessRegistration({
  ...brandInput,
  accountType: "agency",
  lookingFor: ["Brand clients"],
  lookingForFreeText: "",
});
check("agency registration validates", agencyOk.ok, true);

// --- Registration: refusals -----------------------------------------------------
const errOf = (input: Parameters<typeof validateBusinessRegistration>[0]) => {
  const r = validateBusinessRegistration(input);
  return r.ok ? {} : r.errors;
};
check(
  "creator cannot register as a business",
  "accountType" in errOf({ ...brandInput, accountType: "creator" }),
  true
);
check(
  "missing account type refused",
  "accountType" in errOf({ ...brandInput, accountType: undefined }),
  true
);
check(
  "bad email refused",
  "workEmail" in errOf({ ...brandInput, workEmail: "not-an-email" }),
  true
);
check(
  "5-character password refused",
  "password" in errOf({ ...brandInput, password: "12345" }),
  true
);
check(
  "6-character password accepted",
  validateBusinessRegistration({ ...brandInput, password: "123456" }).ok,
  true
);
check(
  "blank company name refused",
  "companyName" in errOf({ ...brandInput, companyName: "  " }),
  true
);
check(
  "bad website refused",
  "website" in errOf({ ...brandInput, website: "acme" }),
  true
);
check(
  "category outside the list refused",
  "category" in errOf({ ...brandInput, category: "Weapons" }),
  true
);
check(
  "size outside the list refused",
  "companySize" in errOf({ ...brandInput, companySize: "huge" }),
  true
);
check(
  "empty looking-for refused",
  "lookingFor" in errOf({ ...brandInput, lookingFor: [], lookingForFreeText: "" }),
  true
);
check(
  "free-text alone satisfies looking-for",
  validateBusinessRegistration({
    ...brandInput,
    lookingFor: [],
    lookingForFreeText: "Anything creator-related",
  }).ok,
  true
);
check(
  "an agency option on a brand registration refused",
  "lookingFor" in errOf({ ...brandInput, lookingFor: ["Brand clients"] }),
  true
);
check(
  "description over the cap refused",
  "description" in
    errOf({ ...brandInput, description: "x".repeat(DESCRIPTION_MAX_LENGTH + 1) }),
  true
);
check(
  "description exactly at the cap accepted",
  validateBusinessRegistration({
    ...brandInput,
    description: "x".repeat(DESCRIPTION_MAX_LENGTH),
  }).ok,
  true
);
check(
  "duplicate pick + identical free text stored once",
  (() => {
    const r = validateBusinessRegistration({
      ...brandInput,
      lookingFor: ["Creators for a campaign"],
      lookingForFreeText: "Creators for a campaign",
    });
    return r.ok ? r.value.lookingFor : null;
  })(),
  ["Creators for a campaign"]
);

// --- Edit-form validation shares the same rules ---------------------------------
check(
  "edit validation accepts the registered brand fields",
  validateBusinessFields("brand", brandInput).ok,
  true
);
check(
  "edit validation refuses a bad website",
  (() => {
    const r = validateBusinessFields("brand", { ...brandInput, website: "nope" });
    return !r.ok && "website" in r.errors;
  })(),
  true
);

// --- Gate placement (the routes a business account uses stay open; the
//     creator's gated surface is untouched) --------------------------------------
check("/business/register is not subscription-gated", isGatedPath("/business/register"), false);
check("/business/home is not subscription-gated", isGatedPath("/business/home"), false);
check(
  "/api/business-registration is not subscription-gated",
  isGatedPath("/api/business-registration"),
  false
);
check(
  "creator /api/business stays gated",
  isGatedPath("/api/business"),
  true
);
check(
  "creator /api/business-profile stays gated",
  isGatedPath("/api/business-profile"),
  true
);

// --- Migration agreement (file only — the build never applies it) ---------------
const migration = readFileSync(
  new URL(
    "../supabase/migrations/2026-11-24-business-accounts.sql",
    import.meta.url
  ),
  "utf8"
);
check(
  "migration checks the same account-type vocabulary",
  migration.includes("check (account_type in ('creator', 'brand', 'agency'))"),
  true
);
check(
  "migration defaults existing rows to creator",
  migration.includes("account_type text not null default 'creator'"),
  true
);
check(
  "migration creates business_profiles",
  migration.includes("create table if not exists public.business_profiles"),
  true
);
check(
  "migration enables RLS on business_profiles",
  migration.includes("alter table public.business_profiles enable row level security"),
  true
);
check(
  "migration carries select/insert/update own-row policies",
  [
    "business_profiles_select_own",
    "business_profiles_insert_own",
    "business_profiles_update_own",
  ].every((p) => migration.includes(p)),
  true
);
check(
  "migration caps description at the module's limit",
  migration.includes(`char_length(description) <= ${DESCRIPTION_MAX_LENGTH}`),
  true
);

console.log(
  failures === 0
    ? "\nALL BUSINESS-REGISTRATION FIXTURES PASS"
    : `\n${failures} BUSINESS-REGISTRATION FIXTURE(S) FAILED`
);
process.exit(failures === 0 ? 0 : 1);
