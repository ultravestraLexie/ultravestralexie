// ============================================================================
// Account security + notifications + customer feedback — acceptance
// fixtures for trust queue #3, #6 and #7 (owner order 2026-11-23):
// "Account security — protect contracts, financial records,
// personal information." / "Notifications — never miss a deadline,
// negotiation or payment." / "Customer feedback — identify why
// users stay or leave."
//
// The rules pinned here:
//  - Alerts are DERIVED, never stored: overdue / due-soon / quiet
//    come from the same deal fields the Creator Loop reads, with
//    the same 3-day clocks. Boundary days are pinned exactly
//    (due in 3 days alerts, due in 4 does not; 3 idle days is
//    quiet, 2 is not). A preference suppresses only its own type;
//    a dismissal suppresses only its own stable key.
//  - Security shows real auth facts and acts through the real
//    session (updateUser / global signOut) — and claims NOTHING
//    the app does not have: no extra sign-in factor is mentioned
//    anywhere in the settings UI files.
//  - Feedback's kind list is closed and shared (form, API, check
//    constraint), and it is not a ticket: no reference, no reply
//    promise, only the may-email opt-in.
//  - Both new APIs stand behind the member gate, and both
//    migrations are own-row RLS only.
//
// Run (from the repo root):
//   npx tsx scripts/trust-queue-2-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import { readFileSync } from "node:fs";
import {
  ALERT_DUE_SOON_DAYS,
  DEFAULT_NOTIFICATION_PREFS,
  FEEDBACK_KINDS,
  LOOP_FOLLOW_UP_DAYS,
  buildAlerts,
  feedbackKindLabel,
  isFeedbackKind,
  rowToFeedback,
  rowToNotificationPrefs,
  type GalaxyDeal,
  type NotificationPrefs,
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

const read = (p: string) => readFileSync(p, "utf8");
const count = (s: string, needle: string) => s.split(needle).length - 1;

/* ---------------- alert derivation ------------------------------ */

const TODAY = "2026-11-23";
const ALL_ON: NotificationPrefs = { overdue: true, dueSoon: true, quietDeals: true };

const deal = (over: Partial<GalaxyDeal>): GalaxyDeal => ({
  id: "d1",
  brandName: "Brand One",
  brandId: null,
  platform: null,
  stage: "invoiced",
  amountCents: 50000,
  receivedCents: 0,
  deliverables: "",
  notes: "",
  pitchedOn: "2026-11-01",
  lastContact: "2026-11-01",
  updatedAt: "2026-11-01T00:00:00.000Z",
  dueOn: null,
  invoiceSentOn: "2026-11-01",
  invoiceDue: null,
  paidOn: null,
  ...over,
});
const keys = (deals: GalaxyDeal[], prefs = ALL_ON, dismissed: string[] = [], activity?: Record<string, string>) =>
  buildAlerts(deals, prefs, dismissed, TODAY, activity).map((a) => a.key);

check("alerts: the due-soon window is 3 days", ALERT_DUE_SOON_DAYS, 3);
check(
  "alerts: quiet uses the Loop's own follow-up clock",
  LOOP_FOLLOW_UP_DAYS,
  3
);

check(
  "overdue: due yesterday with money owed alerts, critical, stable key",
  buildAlerts([deal({ invoiceDue: "2026-11-22" })], ALL_ON, [], TODAY).map(
    (a) => [a.key, a.kind, a.tone]
  ),
  [["overdue:d1:2026-11-22", "overdue", "critical"]]
);
check(
  "overdue: fully received invoice never alerts",
  keys([deal({ invoiceDue: "2026-11-20", receivedCents: 50000 })]),
  []
);
check(
  "overdue: a non-invoiced stage with a past due date never alerts",
  keys([deal({ stage: "contracted", invoiceDue: "2026-11-20" })]),
  []
);
check(
  "due-soon: due today is due-soon, not overdue",
  keys([deal({ invoiceDue: "2026-11-23" })]),
  ["due:d1:2026-11-23"]
);
check(
  "due-soon: due in exactly 3 days alerts (boundary)",
  keys([deal({ invoiceDue: "2026-11-26" })]),
  ["due:d1:2026-11-26"]
);
check(
  "due-soon: due in 4 days does not alert (boundary)",
  keys([deal({ invoiceDue: "2026-11-27" })]),
  []
);
check(
  "prefs: overdue off suppresses overdue only, due-soon still fires",
  keys(
    [
      deal({ id: "old", invoiceDue: "2026-11-20" }),
      deal({ id: "soon", invoiceDue: "2026-11-25" }),
    ],
    { ...ALL_ON, overdue: false }
  ),
  ["due:soon:2026-11-25"]
);
check(
  "prefs: due-soon off suppresses due-soon only, overdue still fires",
  keys(
    [
      deal({ id: "old", invoiceDue: "2026-11-20" }),
      deal({ id: "soon", invoiceDue: "2026-11-25" }),
    ],
    { ...ALL_ON, dueSoon: false }
  ),
  ["overdue:old:2026-11-20"]
);
check(
  "dismissal: suppresses only its own alert, the other still fires",
  keys(
    [
      deal({ id: "a", invoiceDue: "2026-11-20" }),
      deal({ id: "b", invoiceDue: "2026-11-21" }),
    ],
    ALL_ON,
    ["overdue:a:2026-11-20"]
  ),
  ["overdue:b:2026-11-21"]
);
check(
  "keys: identical inputs give identical keys (stable across calls)",
  keys([deal({ invoiceDue: "2026-11-22" })]),
  keys([deal({ invoiceDue: "2026-11-22" })])
);
check(
  "order: overdue before due-soon before quiet",
  buildAlerts(
    [
      deal({ id: "q", stage: "negotiating", invoiceDue: null }),
      deal({ id: "s", invoiceDue: "2026-11-25" }),
      deal({ id: "o", invoiceDue: "2026-11-20" }),
    ],
    ALL_ON,
    [],
    TODAY,
    { q: "2026-11-18T09:00:00.000Z" }
  ).map((a) => a.kind),
  ["overdue", "due-soon", "quiet"]
);

/* ---------------- quiet negotiations ---------------------------- */

check(
  "quiet: exactly 3 idle days is quiet (boundary), key carries the activity date",
  keys(
    [deal({ stage: "negotiating", invoiceDue: null })],
    ALL_ON,
    [],
    { d1: "2026-11-20T10:00:00.000Z" }
  ),
  ["quiet:d1:2026-11-20"]
);
check(
  "quiet: 2 idle days is not quiet yet (boundary)",
  keys(
    [deal({ stage: "pitched", invoiceDue: null })],
    ALL_ON,
    [],
    { d1: "2026-11-21T10:00:00.000Z" }
  ),
  []
);
check(
  "quiet: no history row falls back to the deal's updated_at",
  keys([
    deal({
      stage: "negotiating",
      invoiceDue: null,
      updatedAt: "2026-11-19T08:00:00.000Z",
      lastContact: "2026-11-19",
    }),
  ]),
  ["quiet:d1:2026-11-19"]
);
check(
  "quiet: prefs off suppresses quiet alerts",
  keys(
    [deal({ stage: "negotiating", invoiceDue: null })],
    { ...ALL_ON, quietDeals: false },
    [],
    { d1: "2026-11-10T10:00:00.000Z" }
  ),
  []
);
check(
  "quiet: an active-stage deal never reads as a quiet negotiation",
  keys(
    [deal({ stage: "contracted", invoiceDue: null })],
    ALL_ON,
    [],
    { d1: "2026-11-10T10:00:00.000Z" }
  ),
  []
);

/* ---------------- notification prefs ---------------------------- */

check(
  "prefs: defaults are all on",
  DEFAULT_NOTIFICATION_PREFS,
  { overdue: true, dueSoon: true, quietDeals: true }
);
check(
  "prefs: no row yet reads as the defaults",
  rowToNotificationPrefs(null),
  { overdue: true, dueSoon: true, quietDeals: true }
);
check(
  "prefs: a stored row maps snake_case to the app's shape",
  rowToNotificationPrefs({ overdue: false, due_soon: true, quiet_deals: false }),
  { overdue: false, dueSoon: true, quietDeals: false }
);

/* ---------------- feedback -------------------------------------- */

check(
  "feedback kinds: exactly the four, in the owner's order",
  [...FEEDBACK_KINDS],
  ["working", "missing", "hard", "leaving"]
);
check(
  "feedback kinds: labels are the words the creator picks from",
  FEEDBACK_KINDS.map((k) => feedbackKindLabel(k)),
  ["What's working", "What's missing", "Something is hard to use", "I'm thinking of leaving"]
);
check(
  "feedback kinds: the guard accepts the four and nothing else",
  [isFeedbackKind("leaving"), isFeedbackKind("bug"), isFeedbackKind("")],
  [true, false, false]
);
check(
  "feedback rows: the row mapper keeps the may-email opt-in",
  rowToFeedback({
    id: "f1",
    kind: "missing",
    message: "A calendar view",
    contact_ok: true,
    created_at: "2026-11-23T12:00:00.000Z",
  }),
  {
    id: "f1",
    kind: "missing",
    message: "A calendar view",
    contactOk: true,
    createdAt: "2026-11-23T12:00:00.000Z",
  }
);

/* ---------------- gate list ------------------------------------- */

check(
  "gate: /api/notifications is behind the member gate",
  (GATED_PREFIXES as readonly string[]).includes("/api/notifications"),
  true
);
check(
  "gate: /api/feedback is behind the member gate",
  (GATED_PREFIXES as readonly string[]).includes("/api/feedback"),
  true
);

/* ---------------- security surface (source) --------------------- */

const settingsPage = read("app/settings/page.tsx");
const security = read("components/SettingsSecurity.tsx");
const signupRoute = read("app/api/auth/signup/route.ts");

check(
  "security: the panel reads the real auth record (email, created, last sign-in)",
  [
    settingsPage.includes("user.email"),
    settingsPage.includes("user.created_at"),
    settingsPage.includes("user.last_sign_in_at"),
    settingsPage.includes("Security"),
  ],
  [true, true, true, true]
);
check(
  "security: the verified protection line ships verbatim",
  settingsPage.includes(
    "Your deals, money records and requests are stored under your account only — other creators cannot see them."
  ),
  true
);
check(
  "security: change password goes through the session's updateUser",
  security.includes("updateUser({ password })"),
  true
);
check(
  "security: sign out everywhere revokes every session (global scope)",
  security.includes('signOut({ scope: "global" })'),
  true
);
check(
  "security: the button and its consequence line are the owner's words",
  [
    security.includes("Sign out everywhere"),
    security.includes("Ends every session, including this one."),
  ],
  [true, true]
);
check(
  "security: the password minimum matches the signup rule exactly (6)",
  [
    signupRoute.includes("PASSWORD_MIN_LENGTH = 6"),
    security.includes("PASSWORD_MIN_LENGTH = 6"),
  ],
  [true, true]
);
check(
  "security: no extra sign-in factor is claimed anywhere in the settings UI",
  [
    /2fa/i.test(settingsPage),
    /two[- ]factor/i.test(settingsPage),
    /2fa/i.test(security),
    /two[- ]factor/i.test(security),
  ],
  [false, false, false, false]
);

/* ---------------- notifications surfaces (source) --------------- */

const notifRoute = read("app/api/notifications/route.ts");
const todayPage = read("app/today/page.tsx");
const todayClient = read("app/today/TodayClient.tsx");
const notifSettings = read("components/SettingsNotifications.tsx");

check(
  "notifications API: behind the gate, both actions, upserts for both writes",
  [
    notifRoute.includes("getGateState"),
    notifRoute.includes("z.discriminatedUnion"),
    notifRoute.includes('"dismiss"'),
    notifRoute.includes('"prefs"'),
    count(notifRoute, ".upsert("),
  ],
  [true, true, true, true, 2]
);
check(
  "notifications: Today derives alerts from deals + prefs + dismissals",
  [
    todayPage.includes("buildAlerts("),
    todayPage.includes("fetchNotificationState"),
    todayClient.includes('"/api/notifications"'),
  ],
  [true, true, true]
);
check(
  "notifications: the in-app-only honesty line ships on the Alerts card",
  todayClient.includes(
    "In-app alerts. Email alerts arrive when our sending domain is live."
  ),
  true
);
check(
  "notifications: the empty state is the plain sentence",
  todayClient.includes("Nothing needs your attention."),
  true
);
check(
  "notifications: Settings carries the three toggles with the owner's labels",
  [
    notifSettings.includes("Overdue invoices"),
    notifSettings.includes("Invoices due soon"),
    notifSettings.includes("Quiet negotiations"),
  ],
  [true, true, true]
);

/* ---------------- feedback surfaces (source) -------------------- */

const feedbackRoute = read("app/api/feedback/route.ts");
const feedbackForm = read("app/support/FeedbackForm.tsx");

check(
  "feedback API: behind the gate, kind enum shared with core, message 10..4000",
  [
    feedbackRoute.includes("getGateState"),
    feedbackRoute.includes("z.enum(FEEDBACK_KINDS)"),
    feedbackRoute.includes(".min(10)"),
    feedbackRoute.includes(".max(4000)"),
    feedbackRoute.includes(".limit(LIST_CAP)"),
  ],
  [true, true, true, true, true]
);
check(
  "feedback form: the owner's section title and confirmation ship verbatim",
  [
    feedbackForm.includes("Feedback — help us learn why creators stay or leave"),
    feedbackForm.includes("Thank you — this goes straight to the owner."),
    feedbackForm.includes("You may email me about this"),
  ],
  [true, true, true]
);
check(
  "feedback form: it is not a ticket — no reference number is ever shown",
  [
    feedbackForm.includes("supportTicketRef"),
    /reference number/i.test(feedbackForm),
  ],
  [false, false]
);
check(
  "feedback: Settings signposts the form on the Support page",
  settingsPage.includes('href="/support#feedback"'),
  true
);

/* ---------------- migrations (source) --------------------------- */

const notifSql = read("supabase/migrations/2026-11-23-notification-prefs.sql");
const feedbackSql = read("supabase/migrations/2026-11-23-feedback.sql");

check(
  "migration: both notification tables exist with RLS on",
  [
    notifSql.includes("create table if not exists public.notification_prefs"),
    notifSql.includes("create table if not exists public.notification_dismissals"),
    count(notifSql, "enable row level security"),
  ],
  [true, true, 2]
);
check(
  "migration: notification tables are own-row for all four verbs, both tables",
  [
    count(notifSql, "create policy"),
    count(notifSql, "auth.uid() = user_id"),
  ],
  [8, 10]
);
check(
  "migration: prefs columns default on, dismissals key on (user, alert)",
  [
    notifSql.includes("overdue boolean not null default true"),
    notifSql.includes("due_soon boolean not null default true"),
    notifSql.includes("quiet_deals boolean not null default true"),
    notifSql.includes("primary key (user_id, alert_key)"),
  ],
  [true, true, true, true]
);
check(
  "migration: feedback table, closed kind check, insert+select own only",
  [
    feedbackSql.includes("create table if not exists public.feedback"),
    feedbackSql.includes("'working'"),
    feedbackSql.includes("'missing'"),
    feedbackSql.includes("'hard'"),
    feedbackSql.includes("'leaving'"),
    count(feedbackSql, "create policy"),
    feedbackSql.includes("for update"),
    feedbackSql.includes("for delete"),
  ],
  [true, true, true, true, true, 2, false, false]
);

if (failures > 0) {
  console.log(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll trust queue #3/#6/#7 assertions passed.");
