// ============================================================================
// Support path — acceptance fixtures for trust queue #1 (owner order
// 2026-11-23): "Users need somewhere to go when something breaks."
//
// The rules pinned here: the category list is CLOSED and shared —
// the form, the API validation, lib/galaxy/core.ts and the table's
// check constraint name exactly the same six categories; a filed
// request is a record (users can insert and read their own rows,
// never update or delete them); the API route stands behind the
// standard member gate and takes the caller's id from the session;
// the confirmation copy and the real academy inbox are on the page;
// the route is in the middleware gate list like every member API.
//
// Run (from the repo root):
//   npx tsx scripts/support-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "node:fs";
import {
  SUPPORT_CATEGORIES,
  isSupportCategory,
  rowToSupportTicket,
  supportCategoryLabel,
  supportStatusLabel,
  supportTicketRef,
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

/* ---------------- the closed category list ------------------------ */

check(
  "categories: exactly the six, in the owner's order",
  [...SUPPORT_CATEGORIES],
  ["billing", "account-access", "deals-money", "passport", "bug", "other"]
);
check(
  "categories: labels are the words the creator picks from",
  SUPPORT_CATEGORIES.map((c) => supportCategoryLabel(c)),
  [
    "Billing",
    "Account access",
    "Deals & money records",
    "Passport",
    "Bug — something is broken",
    "Something else",
  ]
);
check(
  "categories: an unknown value is not a category",
  isSupportCategory("refunds-please"),
  false
);
check(
  "categories: an unknown value still labels safely",
  supportCategoryLabel("refunds-please"),
  "Something else"
);

/* ---------------- row mapping, reference, status ------------------ */

const row = {
  id: "a1b2c3d4-e5f6-4789-abcd-0123456789ab",
  category: "bug",
  subject: "Deals board will not load",
  message: "It spins forever.",
  contact_email: "creator@example.com",
  status: "open",
  created_at: "2026-11-23T18:00:00.000Z",
};
check("row mapping: snake_case row becomes the ticket shape", rowToSupportTicket(row), {
  id: "a1b2c3d4-e5f6-4789-abcd-0123456789ab",
  category: "bug",
  subject: "Deals board will not load",
  message: "It spins forever.",
  contactEmail: "creator@example.com",
  status: "open",
  createdAt: "2026-11-23T18:00:00.000Z",
});
check(
  "reference: the first block of the row's own id",
  supportTicketRef(rowToSupportTicket(row)),
  "a1b2c3d4"
);
check("status: a fresh request reads Received", supportStatusLabel("open"), "Received");
check(
  "status: a later state shows its stored word",
  supportStatusLabel("answered"),
  "answered"
);

/* ---------------- the migration ----------------------------------- */

const sql = readFileSync(
  "supabase/migrations/2026-11-23-support-tickets.sql",
  "utf8"
);
check(
  "migration: creates the support_tickets table",
  sql.includes("create table if not exists public.support_tickets"),
  true
);
check(
  "migration: user_id is a foreign key to auth.users",
  sql.includes("references auth.users(id)"),
  true
);
check(
  "migration: status defaults to open",
  sql.includes("status text not null default 'open'"),
  true
);
check(
  "migration: created_at defaults to now",
  sql.includes("created_at timestamptz not null default now()"),
  true
);
check(
  "migration: row level security is enabled",
  sql.includes("alter table public.support_tickets enable row level security"),
  true
);
check(
  "migration: select policy is own-row only",
  sql.includes('"support_tickets_select_own"') &&
    sql.includes("for select using (auth.uid() = user_id)"),
  true
);
check(
  "migration: insert policy is own-row only",
  sql.includes('"support_tickets_insert_own"') &&
    sql.includes("for insert with check (auth.uid() = user_id)"),
  true
);
check(
  "migration: NO update or delete policy for users — a filed request is a record",
  !sql.includes("for update") && !sql.includes("for delete"),
  true
);
{
  const m = sql.match(/category in \(([\s\S]*?)\)/);
  const listed = m
    ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort()
    : [];
  check(
    "migration: the check constraint lists exactly the six categories",
    listed,
    [...SUPPORT_CATEGORIES].sort()
  );
}

/* ---------------- the API route ----------------------------------- */

const route = readFileSync("app/api/support/route.ts", "utf8");
check(
  "route: stands behind the member gate (401 logged out, 403 unsubscribed)",
  route.includes("getGateState") &&
    route.includes('gate === "login" ? 401 : 403'),
  true
);
check(
  "route: the caller's id comes from the session, never the request",
  route.includes("user_id: owner.userId") && route.includes("supabase.auth.getUser()"),
  true
);
check(
  "route: category validation is the shared closed list",
  route.includes("z.enum(SUPPORT_CATEGORIES)"),
  true
);
check(
  "route: reads and writes are scoped to the caller in code",
  route.includes('.eq("user_id", owner.userId)') &&
    route.includes('.from("support_tickets")'),
  true
);
check(
  "route: no update or delete handler exists",
  !route.includes(".update(") && !route.includes(".delete("),
  true
);
check(
  "gate: /api/support is in the middleware gate list",
  (GATED_PREFIXES as readonly string[]).includes("/api/support"),
  true
);

/* ---------------- the page and its entry points -------------------- */

const client = readFileSync("app/support/SupportClient.tsx", "utf8");
check(
  "page: the real academy inbox is the email fallback",
  client.includes("ultravestraacademy@gmail.com"),
  true
);
check(
  "page: the confirmation copy is exact",
  client.includes("Request received. We read every request and reply by email."),
  true
);
check(
  "page: the confirmation quotes the request's own reference",
  client.includes("supportTicketRef(confirmation)"),
  true
);
check(
  "page: self-help points at the real password reset",
  client.includes('href="/forgot-password"'),
  true
);
check(
  "page: own requests show the mapped status word",
  client.includes("supportStatusLabel(t.status)"),
  true
);

const page = readFileSync("app/support/page.tsx", "utf8");
check(
  "page: signed-out visitors keep the public help page",
  page.includes("PublicSupport") &&
    page.includes("ultravestraacademy@gmail.com"),
  true
);

const today = readFileSync("app/today/TodayClient.tsx", "utf8");
check(
  "entry point: Today carries the get-help link under the loop",
  today.includes("Something broken?") && today.includes('href="/support"'),
  true
);

const settings = readFileSync("app/settings/page.tsx", "utf8");
check(
  "entry point: Settings routes plan help to Support",
  settings.includes('href="/support"'),
  true
);

if (failures > 0) {
  console.log(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll support assertions passed.");
