// ============================================================================
// UltraVestra North Star — acceptance fixtures for the pure weekly
// computation (lib/metrics/north-star.ts), Phase 1 Build 4.
//
// Fixed event rows assert the EXACT weekly buckets: distinct-creator
// counting, per-type counts, unknown event types ignored (a future
// type must never silently inflate the metric), ISO-week boundaries
// in UTC, and the honesty flag — weeks before the instrumentation
// shipped (2026-11-22) are marked measured=false, never read as zero.
//
// Run (from the repo root):
//   npx tsx scripts/north-star-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  computeWeeklyNorthStar,
  weekStartUtc,
  type CreatorEventRow,
} from "../lib/metrics/north-star";

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

// --- Week boundaries (ISO, UTC, Monday start) -------------------------------
// 2026-11-22 is a Sunday; its week starts Monday 2026-11-16.
check("sunday belongs to the monday before", weekStartUtc("2026-11-22T17:00:00.000Z"), "2026-11-16T00:00:00.000Z");
// 2026-11-23 is a Monday; it starts its own week.
check("monday starts its own week", weekStartUtc("2026-11-23T00:00:00.000Z"), "2026-11-23T00:00:00.000Z");
check("midweek day maps to its monday", weekStartUtc("2026-11-25T23:59:59.000Z"), "2026-11-23T00:00:00.000Z");

// --- Weekly buckets -----------------------------------------------------------
const rows: CreatorEventRow[] = [
  // Week of Mon 2026-11-23: two creators, one acts twice.
  { user_id: "u1", event_type: "proposal_created", created_at: "2026-11-23T10:00:00.000Z" },
  { user_id: "u1", event_type: "deal_created", created_at: "2026-11-24T10:00:00.000Z" },
  { user_id: "u2", event_type: "revenue_recorded", created_at: "2026-11-29T23:00:00.000Z" },
  // An unknown type must be ignored entirely.
  { user_id: "u9", event_type: "page_viewed", created_at: "2026-11-24T10:00:00.000Z" },
  // Week of Mon 2026-11-30: one creator.
  { user_id: "u2", event_type: "post_logged", created_at: "2026-11-30T00:00:00.000Z" },
  // A pre-instrumentation week (Mon 2026-11-16): present in the data
  // only hypothetically — must be flagged unmeasured, not zero.
  { user_id: "u1", event_type: "goal_created", created_at: "2026-11-16T09:00:00.000Z" },
];

const weeks = computeWeeklyNorthStar(rows);
check("three weeks produced", weeks.length, 3);
check(
  "pre-instrumentation week flagged unmeasured",
  weeks[0],
  {
    weekStart: "2026-11-16T00:00:00.000Z",
    activeCreators: 1,
    totalActions: 1,
    byType: { goal_created: 1 },
    measured: false,
  }
);
check(
  "first measured week: distinct creators, unknown type ignored",
  weeks[1],
  {
    weekStart: "2026-11-23T00:00:00.000Z",
    activeCreators: 2,
    totalActions: 3,
    byType: { proposal_created: 1, deal_created: 1, revenue_recorded: 1 },
    measured: true,
  }
);
check(
  "second measured week",
  weeks[2],
  {
    weekStart: "2026-11-30T00:00:00.000Z",
    activeCreators: 1,
    totalActions: 1,
    byType: { post_logged: 1 },
    measured: true,
  }
);
check("empty input gives no weeks", computeWeeklyNorthStar([]), []);

if (failures > 0) {
  console.log(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll North Star fixtures passed");
