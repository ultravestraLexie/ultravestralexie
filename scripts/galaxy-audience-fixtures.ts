// ============================================================================
// Galaxy Audience Independence Center — acceptance fixtures for the
// pure audience logic added to lib/galaxy/core.ts for System #6
// (Audience Independence Center, 2026-11-23).
//
// The owner's rules, asserted exactly: every figure comes from the
// creator's own entered snapshots; the latest snapshot per platform
// wins (captured_on, ties by created_at — the later entry is the
// correction); the email list is EXCLUDED from platform reach and
// from the dependency share but INCLUDED in total reach and the
// owned share; growth needs two snapshots (a single snapshot's
// growth is null, never zero-by-default); the engagement trend is
// null when either side is missing; empty input yields nulls
// throughout, never invented zeros.
//
// Run (from the repo root):
//   npx tsx scripts/galaxy-audience-fixtures.ts
// Exits non-zero if any assertion fails.
// ============================================================================

import {
  audiencePlatformLabel,
  audiencePlatformOptions,
  audienceStandings,
  audienceSummary,
  dependencyVerdict,
  latestPerPlatform,
  onePercentMove,
  rowToSnapshot,
  type AudienceSnapshot,
} from "../lib/galaxy/core";

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

let seq = 0;
const snap = (over: Partial<AudienceSnapshot>): AudienceSnapshot => ({
  id: `s${++seq}`,
  platform: "tiktok",
  followers: 0,
  engagementPct: null,
  capturedOn: "2026-11-01",
  createdAt: "2026-11-01T10:00:00.000Z",
  ...over,
});

// --- rowToSnapshot -----------------------------------------------------------

check(
  "row mapping: numeric engagement string coerces, date slices to the day",
  rowToSnapshot({
    id: "r1",
    platform: "instagram",
    followers: 4200,
    engagement_pct: "4.5",
    captured_on: "2026-11-20",
    created_at: "2026-11-20T12:00:00.000Z",
  }),
  {
    id: "r1",
    platform: "instagram",
    followers: 4200,
    engagementPct: 4.5,
    capturedOn: "2026-11-20",
    createdAt: "2026-11-20T12:00:00.000Z",
  }
);
check(
  "row mapping: null engagement stays null",
  rowToSnapshot({
    id: "r2",
    platform: "email",
    followers: 10,
    engagement_pct: null,
    captured_on: "2026-11-20",
    created_at: "2026-11-20T12:00:00.000Z",
  }).engagementPct,
  null
);

// --- latestPerPlatform ---------------------------------------------------------

const tie = [
  snap({ platform: "tiktok", followers: 900, capturedOn: "2026-11-22", createdAt: "2026-11-22T08:00:00.000Z" }),
  snap({ platform: "tiktok", followers: 920, capturedOn: "2026-11-22", createdAt: "2026-11-22T09:00:00.000Z" }),
  snap({ platform: "tiktok", followers: 800, capturedOn: "2026-11-01", createdAt: "2026-11-01T10:00:00.000Z" }),
];
check(
  "latest per platform: same-day tie broken by newest created_at (the correction wins)",
  latestPerPlatform(tie).get("tiktok")?.followers,
  920
);
check(
  "latest per platform: an unlogged platform is absent, not zero",
  latestPerPlatform(tie).has("youtube"),
  false
);

// --- standings: growth ---------------------------------------------------------

const history = [
  snap({ platform: "tiktok", followers: 800, capturedOn: "2026-11-01", createdAt: "2026-11-01T10:00:00.000Z" }),
  snap({ platform: "tiktok", followers: 1000, capturedOn: "2026-11-15", createdAt: "2026-11-15T10:00:00.000Z" }),
  snap({ platform: "tiktok", followers: 950, capturedOn: "2026-11-22", createdAt: "2026-11-22T10:00:00.000Z" }),
  snap({ platform: "email", followers: 500, capturedOn: "2026-11-20", createdAt: "2026-11-20T10:00:00.000Z" }),
  snap({ platform: "youtube", followers: 300, capturedOn: "2026-11-10", createdAt: "2026-11-10T10:00:00.000Z" }),
];
const standings = audienceStandings(history);
check(
  "standings sort biggest first, email among them by size",
  standings.map((s) => s.platform),
  ["tiktok", "email", "youtube"]
);
check(
  "growth since last entry can be negative (1000 -> 950)",
  standings[0].growthSinceLast,
  -50
);
check(
  "growth since first entry spans the whole history (800 -> 950)",
  standings[0].growthSinceFirst,
  150
);
check(
  "single snapshot: growth since last is null, never zero-by-default",
  standings[1].growthSinceLast,
  null
);
check(
  "single snapshot: growth since first is null too",
  standings[1].growthSinceFirst,
  null
);
check(
  "standings carry the latest date",
  standings[0].capturedOn,
  "2026-11-22"
);

// --- engagement trend ------------------------------------------------------------

const trendSnaps = [
  snap({ platform: "instagram", followers: 100, engagementPct: 4.0, capturedOn: "2026-11-01", createdAt: "2026-11-01T10:00:00.000Z" }),
  snap({ platform: "instagram", followers: 110, engagementPct: 4.5, capturedOn: "2026-11-20", createdAt: "2026-11-20T10:00:00.000Z" }),
  snap({ platform: "x", followers: 100, engagementPct: 3.0, capturedOn: "2026-11-01", createdAt: "2026-11-01T10:00:00.000Z" }),
  snap({ platform: "x", followers: 90, engagementPct: 2.5, capturedOn: "2026-11-20", createdAt: "2026-11-20T10:00:00.000Z" }),
  snap({ platform: "twitch", followers: 100, engagementPct: 5, capturedOn: "2026-11-01", createdAt: "2026-11-01T10:00:00.000Z" }),
  snap({ platform: "twitch", followers: 100, engagementPct: 5, capturedOn: "2026-11-20", createdAt: "2026-11-20T10:00:00.000Z" }),
  snap({ platform: "podcast", followers: 100, engagementPct: null, capturedOn: "2026-11-01", createdAt: "2026-11-01T10:00:00.000Z" }),
  snap({ platform: "podcast", followers: 100, engagementPct: 3, capturedOn: "2026-11-20", createdAt: "2026-11-20T10:00:00.000Z" }),
  snap({ platform: "facebook", followers: 100, engagementPct: 3, capturedOn: "2026-11-01", createdAt: "2026-11-01T10:00:00.000Z" }),
  snap({ platform: "facebook", followers: 100, engagementPct: null, capturedOn: "2026-11-20", createdAt: "2026-11-20T10:00:00.000Z" }),
  snap({ platform: "other", followers: 50, engagementPct: 2, capturedOn: "2026-11-20", createdAt: "2026-11-20T10:00:00.000Z" }),
];
const trendOf = (p: string) =>
  audienceStandings(trendSnaps).find((s) => s.platform === p)?.engagementTrend;
check("engagement trend: rising", trendOf("instagram"), "up");
check("engagement trend: falling", trendOf("x"), "down");
check("engagement trend: unchanged is flat", trendOf("twitch"), "flat");
check("engagement trend: previous missing -> null", trendOf("podcast"), null);
check("engagement trend: latest missing -> null", trendOf("facebook"), null);
check("engagement trend: single snapshot -> null", trendOf("other"), null);

// --- summary: dependency excludes email, owned includes it ----------------------

const summary = audienceSummary(history);
check(
  "total reach includes the email list (950 + 500 + 300)",
  summary.totalReach,
  1750
);
check(
  "platform reach excludes the email list (950 + 300)",
  summary.platformReach,
  1250
);
check("biggest platform is the largest platform, never email", summary.biggestPlatform, "tiktok");
check(
  "dependency share divides by platform reach only (950 / 1250)",
  summary.dependencyPct,
  76
);
check("second platform is the hedge (300 / 1250)", [summary.secondPlatform, summary.secondPct], ["youtube", 24]);
check("email followers read from the latest email snapshot", summary.emailFollowers, 500);
check(
  "owned share divides the list by TOTAL reach (500 / 1750)",
  summary.ownedPct,
  29
);

const emailOnly = audienceSummary([
  snap({ platform: "email", followers: 250, capturedOn: "2026-11-20" }),
]);
check(
  "email only: no platform reach, no biggest platform, no dependency",
  [emailOnly.platformReach, emailOnly.biggestPlatform, emailOnly.dependencyPct],
  [null, null, null]
);
check(
  "email only: the whole tracked audience is owned",
  [emailOnly.totalReach, emailOnly.ownedPct],
  [250, 100]
);

const zeroReach = audienceSummary([
  snap({ platform: "tiktok", followers: 0, capturedOn: "2026-11-20" }),
]);
check(
  "a platform tracked at zero: dependency is null, not a divide-by-zero",
  [zeroReach.platformReach, zeroReach.dependencyPct, zeroReach.ownedPct],
  [0, null, null]
);

// --- empty input ------------------------------------------------------------------

check("empty input: no standings", audienceStandings([]), []);
check(
  "empty input: every summary figure is null",
  audienceSummary([]),
  {
    totalReach: null,
    platformReach: null,
    emailFollowers: null,
    biggestPlatform: null,
    biggestFollowers: null,
    dependencyPct: null,
    secondPlatform: null,
    secondPct: null,
    ownedPct: null,
  }
);

// --- verdict thresholds -------------------------------------------------------------

check("verdict at 70%: one platform controls the reach", dependencyVerdict(70), "One platform controls most of your reach");
check("verdict at 85%: one platform controls the reach", dependencyVerdict(85), "One platform controls most of your reach");
check("verdict at 69%: half the reach rides on one platform", dependencyVerdict(69), "Half your reach rides on one platform");
check("verdict at 50%: half the reach rides on one platform", dependencyVerdict(50), "Half your reach rides on one platform");
check("verdict at 49%: the reach is spread", dependencyVerdict(49), "Your reach is spread across platforms");

// --- the 1%-move next step ------------------------------------------------------------

check("1% move: 12,345 followers -> ~123 owned subscribers", onePercentMove(12345), 123);
check("1% move: 999 followers -> ~10", onePercentMove(999), 10);
check("1% move: 100,000 followers -> 1,000", onePercentMove(100000), 1000);

// --- form options + labels --------------------------------------------------------------

check(
  "options: the creator's own platforms first, then the rest of the enum, email always present",
  audiencePlatformOptions(["youtube", "tiktok"]),
  ["youtube", "tiktok", "instagram", "x", "facebook", "twitch", "podcast", "email", "other"]
);
check(
  "options: a profile platform outside the enum is not offered (it cannot be stored)",
  audiencePlatformOptions(["linkedin", "tiktok"]).includes("linkedin"),
  false
);
check(
  "options: no profile platforms -> the canonical enum order",
  audiencePlatformOptions([]),
  ["tiktok", "instagram", "youtube", "x", "facebook", "twitch", "podcast", "email", "other"]
);
check("the email list is labelled as what it is", audiencePlatformLabel("email"), "Email list");
check("platforms keep their normal labels", audiencePlatformLabel("tiktok"), "TikTok");

console.log(
  failures === 0 ? "\nALL GALAXY AUDIENCE FIXTURES PASS" : `\n${failures} FAILURES`
);
process.exit(failures === 0 ? 0 : 1);
