// ============================================================================
// Data export + brand provenance — acceptance fixtures for trust
// queue #2 ("Creators must be able to retrieve their business
// records") and #5 ("Creators need to know where brand information
// comes from"), owner order 2026-11-23.
//
// Export rules pinned here: the payload always carries every
// section (empty when the creator has no rows — never a silent
// omission); secret-looking keys are stripped by the builder even
// when a raw row carries them; the route stands behind the member
// gate, scopes every query to the session user_id, and answers
// with a download disposition; Settings and Support link to it.
//
// Provenance rules pinned here: three honest branches — evidence
// (source + recorded date from the real rows; only a 'verified'
// row earns the word "Verified"), program (a listing stated as a
// listing), unknown (absence stated plainly). Evidence always
// beats a program listing, and the strongest evidence row wins.
//
// Run (from the repo root):
//   npx tsx scripts/export-provenance-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "node:fs";
import {
  EXPORT_SECTIONS,
  brandProvenance,
  buildExport,
  moneyLedger,
  stripSecretKeys,
} from "../lib/galaxy/core";
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

/* ---------------- export: shape ---------------------------------- */

const empty = buildExport({
  exportedAt: "2026-11-24T00:00:00.000Z",
  profile: null,
  creatorProfile: null,
  deals: [],
  dealProtection: [],
  dealStageHistory: [],
  expenses: [],
  revenueEntries: [],
  ledger: moneyLedger([], []),
  audienceSnapshots: [],
  savedBrands: [],
  supportTickets: [],
  subscription: null,
});

check(
  "export: every section key present",
  Object.keys(empty).sort(),
  [
    "audience",
    "deals",
    "export",
    "money",
    "profile",
    "savedBrands",
    "subscription",
    "supportTickets",
  ]
);
check(
  "export: header labels every section, in order",
  empty.export.sections.map((s) => s.key),
  EXPORT_SECTIONS.map((s) => s.key)
);
check(
  "export: header carries the export timestamp",
  empty.export.exportedAt,
  "2026-11-24T00:00:00.000Z"
);
check(
  "export: empty sections are present and empty, never omitted",
  [
    empty.audience,
    empty.savedBrands,
    empty.supportTickets,
    empty.deals.deals,
    empty.deals.protection,
    empty.deals.stageHistory,
    empty.money.expenses,
    empty.money.revenueEntries,
    empty.profile.account,
    empty.profile.creatorProfile,
    empty.subscription,
  ],
  [[], [], [], [], [], [], [], [], null, null, null]
);
check(
  "export: money section carries the separated ledger",
  [
    empty.money.ledger.reconciles,
    empty.money.ledger.keptCents,
    typeof empty.money.ledger.projected,
    typeof empty.money.ledger.invoiced,
    typeof empty.money.ledger.collected,
  ],
  [true, 0, "object", "object", "object"]
);

/* ---------------- export: secrets never ride along --------------- */

const dirty = buildExport({
  exportedAt: "2026-11-24T00:00:00.000Z",
  profile: {
    id: "user-1",
    email: "creator@example.com",
    stripe_secret_key: "sk_live_must_not_ship",
    nested: { api_key: "must_not_ship", keep_me: 7 },
  },
  creatorProfile: null,
  deals: [{ id: "deal-1", brand_name: "Acme", access_token: "must_not_ship" }],
  dealProtection: [],
  dealStageHistory: [],
  expenses: [],
  revenueEntries: [],
  ledger: moneyLedger([], []),
  audienceSnapshots: [],
  savedBrands: [],
  supportTickets: [],
  subscription: {
    status: "active",
    stripe_customer_id: "cus_own_record",
    stripe_subscription_id: "sub_own_record",
    client_secret: "must_not_ship",
  },
});
const dirtyJson = JSON.stringify(dirty);
check(
  "export: secret-looking values never appear in the payload",
  [
    dirtyJson.includes("must_not_ship"),
    dirtyJson.includes("stripe_secret_key"),
    dirtyJson.includes("api_key"),
    dirtyJson.includes("client_secret"),
    dirtyJson.includes("access_token"),
  ],
  [false, false, false, false, false]
);
check(
  "export: the creator's own non-secret fields survive stripping",
  [
    (dirty.profile.account as { email?: string })?.email,
    (dirty.profile.account as { nested?: { keep_me?: number } })?.nested
      ?.keep_me,
    dirty.subscription?.stripe_customer_id,
    dirty.subscription?.stripe_subscription_id,
    dirty.subscription?.status,
  ],
  ["creator@example.com", 7, "cus_own_record", "sub_own_record", "active"]
);
check(
  "stripSecretKeys: primitives and arrays pass through untouched",
  stripSecretKeys([{ a: 1 }, "x", 3, null]),
  [{ a: 1 }, "x", 3, null]
);

/* ---------------- export: route + entry points ------------------- */

const route = readFileSync("app/api/export/route.ts", "utf8");
check(
  "route: stands behind the member gate",
  route.includes("getGateState") && route.includes("401") && route.includes("403"),
  true
);
check(
  "route: every table read is scoped to the session user_id",
  (route.match(/userId/g) ?? []).length >= 10 &&
    route.includes('.eq("user_id", userId)') &&
    route.includes('.eq("id", userId)'),
  true
);
check(
  "route: answers as a dated JSON download built by buildExport",
  route.includes("Content-Disposition") &&
    route.includes("ultravestra-export-") &&
    route.includes("buildExport("),
  true
);
check(
  "gate: /api/export is in the middleware gate list",
  GATED_PREFIXES.includes("/api/export"),
  true
);

const settings = readFileSync("app/settings/page.tsx", "utf8");
check(
  "settings: Your data section with the owner's copy and the download",
  settings.includes("Your data") &&
    settings.includes(
      "Download everything UltraVestra holds about your business"
    ) &&
    settings.includes('href="/api/export"'),
  true
);

const supportClient = readFileSync("app/support/SupportClient.tsx", "utf8");
check(
  "support: signed-in view links the same download",
  supportClient.includes('href="/api/export"') &&
    supportClient.includes("Download everything we hold about your business"),
  true
);

/* ---------------- provenance: the three branches ----------------- */

check(
  "provenance: verified evidence names its source and recorded date",
  brandProvenance({ program: "Impact" }, [
    {
      source_type: "official_site",
      source_url: "https://brand.example.com/creators",
      confidence: "verified",
      last_checked_at: "2026-11-20T10:00:00Z",
      observed_at: "2026-11-01T10:00:00Z",
    },
  ]),
  {
    kind: "evidence",
    line: "Verified from the brand's official site · recorded Nov 20, 2026.",
  }
);
check(
  "provenance: reported evidence beats a program and is not called verified",
  brandProvenance({ program: "Impact" }, [
    {
      source_type: "listing",
      source_url: "https://directory.example.com/brand",
      confidence: "publicly_reported",
      last_checked_at: null,
      observed_at: "2026-10-26T10:00:00Z",
    },
  ]),
  {
    kind: "evidence",
    line: "Recorded from a public listing · recorded Oct 26, 2026.",
  }
);
check(
  "provenance: the strongest evidence row wins over a newer weak one",
  brandProvenance({ program: null }, [
    {
      source_type: "affiliate_network",
      confidence: "needs_review",
      last_checked_at: "2026-11-22T10:00:00Z",
    },
    {
      source_type: "official_site",
      confidence: "verified",
      last_checked_at: "2026-11-02T10:00:00Z",
    },
  ]).line,
  "Verified from the brand's official site · recorded Nov 2, 2026."
);
check(
  "provenance: an unlabelled source falls back to the source host",
  brandProvenance({ program: null }, [
    {
      source_type: null,
      source_url: "https://www.example.com/brands/acme",
      confidence: "verified",
      last_checked_at: null,
      observed_at: null,
    },
  ]),
  { kind: "evidence", line: "Verified from example.com." }
);
check(
  "provenance: a program with no evidence is stated as a listing",
  brandProvenance({ program: "ShareASale" }, []),
  {
    kind: "program",
    line: "Listed from the ShareASale affiliate program. No independent evidence on file yet.",
  }
);
check(
  "provenance: neither evidence nor program states the absence",
  brandProvenance({ program: null }, []),
  { kind: "unknown", line: "Source not recorded for this listing." }
);

/* ---------------- provenance: wired into the surfaces ------------ */

const dossier = readFileSync("app/brands/[id]/page.tsx", "utf8");
check(
  "dossier: carries the Where-this-comes-from block from brandProvenance",
  dossier.includes("Where this comes from") &&
    dossier.includes("brandProvenance("),
  true
);

const server = readFileSync("lib/galaxy/server.ts", "utf8");
check(
  "directory: fetchDirectory derives provenance from the evidence rows",
  server.includes("brandProvenance(") &&
    server.includes("source_type, source_url, confidence, last_checked_at, observed_at"),
  true
);

const brandsClient = readFileSync("app/brands/BrandsClient.tsx", "utf8");
check(
  "directory: brand rows show the provenance line",
  brandsClient.includes("b.provenance") && brandsClient.includes("provenance.line"),
  true
);

if (failures > 0) {
  console.log(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll export + provenance assertions passed.");
