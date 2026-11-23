import { CREATOR_EVENT_TYPES, type CreatorEventType } from "@/lib/events";

/** The North Star — Weekly Active Creators Completing Meaningful
 *  Business Actions (20/10 Master Product Strategy).
 *
 *  Pure computation over creator_events rows: a creator counts for a
 *  week when they completed at least one meaningful business action
 *  in it. Weeks are ISO weeks in UTC (Monday 00:00 UTC start).
 *
 *  HONESTY RULES:
 * - Events exist only since the Build 4 instrumentation shipped
 *  (2026-11-22). Weeks before that are NOT zero-activity weeks —
 *  they are unmeasured, and this module marks them so any report
 *  can label them instead of inventing history.
 * - "Meaningful business action" is exactly the CREATOR_EVENT_TYPES
 *  set: creating/advancing proposals and deals, recording revenue,
 *  generating a match brief, logging a post, creating a goal.
 *  Page views and sign-ins are not business actions and are never
 *  logged as events. */

export const INSTRUMENTATION_START_ISO = "2026-11-22T00:00:00.000Z";

export interface CreatorEventRow {
  user_id: string;
  event_type: string;
  created_at: string;
}

export interface WeeklyNorthStar {
  /** Monday 00:00 UTC of the week, ISO string. */
  weekStart: string;
  /** Distinct creators with ≥1 meaningful action that week. */
  activeCreators: number;
  /** Total meaningful actions that week. */
  totalActions: number;
  /** Per-event-type action counts for the week. */
  byType: Partial<Record<CreatorEventType, number>>;
  /** False for weeks up to and including the week instrumentation
   *  shipped — those weeks are unmeasured or only partly measured,
   *  never readable as zero-activity weeks. */
  measured: boolean;
}

const MEANINGFUL = new Set<string>(CREATOR_EVENT_TYPES);

export function weekStartUtc(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff)
  );
  return monday.toISOString();
}

/** Group event rows into weekly North Star buckets, oldest first.
 *  Only meaningful event types count; unknown types are ignored so
 *  a future event type never silently inflates the metric — it must
 *  be added to CREATOR_EVENT_TYPES deliberately. */
export function computeWeeklyNorthStar(
  rows: CreatorEventRow[]
): WeeklyNorthStar[] {
  const weeks = new Map<string, WeeklyNorthStar & { users: Set<string> }>();
  for (const row of rows) {
    if (!MEANINGFUL.has(row.event_type)) continue;
    const week = weekStartUtc(row.created_at);
    let bucket = weeks.get(week);
    if (!bucket) {
      bucket = {
        weekStart: week,
        activeCreators: 0,
        totalActions: 0,
        byType: {},
        measured: week > weekStartUtc(INSTRUMENTATION_START_ISO),
        users: new Set<string>(),
      };
      weeks.set(week, bucket);
    }
    bucket.users.add(row.user_id);
    bucket.totalActions += 1;
    const type = row.event_type as CreatorEventType;
    bucket.byType[type] = (bucket.byType[type] ?? 0) + 1;
  }
  return [...weeks.values()]
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .map(({ users, ...rest }) => ({
      ...rest,
      activeCreators: users.size,
    }));
}
