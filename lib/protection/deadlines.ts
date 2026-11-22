// Partnership Protection Center — the deadline math, pure and
// isolated.
//
// HONESTY RULE (binding): every countdown here is exact date-only
// arithmetic over dates the creator entered — no estimates, no
// rounding, no model. Given the same stored agreements and the same
// "today", these functions always return the same deadlines and the
// same summary, and anyone can re-derive them from the rows by
// hand.
//
// "Today" is a 'YYYY-MM-DD' string for America/Chicago (the
// platform's home timezone), produced by todayInChicago() from an
// explicit instant so the math stays testable. All arithmetic is on
// whole days: a deadline date minus today, in days. A negative
// result means the date has passed — it is reported as overdue,
// never clamped to zero.
//
// This module has no imports and no I/O on purpose: the API route
// feeds it the caller's rows and today's date, and the math can be
// exercised in isolation (see the hand-check in the build report).

export type AgreementStatus = "active" | "ended";
export type Exclusivity = "none" | "exclusive";

export type DeadlineKind =
  | "contract_end"
  | "usage_rights_end"
  | "exclusivity_end";

export type ProtectionAgreementLike = {
  id: string;
  brand_name: string;
  status: AgreementStatus;
  exclusivity: Exclusivity;
  /** 'YYYY-MM-DD' or null */
  contract_end_date: string | null;
  /** 'YYYY-MM-DD' or null */
  usage_rights_end: string | null;
  /** 'YYYY-MM-DD' or null */
  exclusivity_end: string | null;
};

export type Deadline = {
  agreementId: string;
  brandName: string;
  kind: DeadlineKind;
  /** 'YYYY-MM-DD' */
  date: string;
  /** Whole days from today until the date; negative = past. */
  daysLeft: number;
};

export type ProtectionSummary = {
  activeAgreements: number;
  deadlinesNext30Days: number;
  overdueDeadlines: number;
  exclusivityActive: number;
};

/** Whole days since the epoch for a 'YYYY-MM-DD' date, via UTC —
 *  pure calendar arithmetic, immune to local timezones and DST. */
function dayNumber(dateString: string): number {
  const [year, month, day] = dateString.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/** Days from `today` until `date` (both 'YYYY-MM-DD'). Negative
 *  when the date is already past. */
export function daysLeft(date: string, today: string): number {
  return dayNumber(date) - dayNumber(today);
}

/** Today's date ('YYYY-MM-DD') in America/Chicago for the given
 *  instant. Uses Intl with an explicit timezone so the answer never
 *  depends on the server's own timezone. */
export function todayInChicago(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const byType = new Map(parts.map((p) => [p.type, p.value]));
  return `${byType.get("year")}-${byType.get("month")}-${byType.get("day")}`;
}

const DEADLINE_FIELDS: Array<{
  kind: DeadlineKind;
  field: "contract_end_date" | "usage_rights_end" | "exclusivity_end";
}> = [
  { kind: "contract_end", field: "contract_end_date" },
  { kind: "usage_rights_end", field: "usage_rights_end" },
  { kind: "exclusivity_end", field: "exclusivity_end" },
];

/**
 * Flatten the deadline dates of the creator's ACTIVE agreements
 * into one list, nearest first. Ended agreements contribute
 * nothing — their dates are history, not upcoming deadlines. Null
 * dates are skipped. Sort is by date ascending; ties break by brand
 * name then kind so the order is deterministic.
 */
export function buildDeadlines(
  agreements: ProtectionAgreementLike[],
  today: string
): Deadline[] {
  const deadlines: Deadline[] = [];

  for (const agreement of agreements) {
    if (agreement.status !== "active") continue;
    for (const { kind, field } of DEADLINE_FIELDS) {
      const date = agreement[field];
      if (!date) continue;
      deadlines.push({
        agreementId: agreement.id,
        brandName: agreement.brand_name,
        kind,
        date,
        daysLeft: daysLeft(date, today),
      });
    }
  }

  deadlines.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.brandName.localeCompare(b.brandName) ||
      a.kind.localeCompare(b.kind)
  );
  return deadlines;
}

/**
 * Summarize a creator's agreements against `today`:
 *
 * - activeAgreements: agreements with status 'active'.
 * - deadlinesNext30Days: deadlines (from active agreements) with
 *   0 ≤ daysLeft ≤ 30.
 * - overdueDeadlines: deadlines with daysLeft < 0 — dates that have
 *   already passed on agreements still marked active.
 * - exclusivityActive: active agreements where the creator is
 *   exclusive and the exclusivity has not ended — exclusivity_end
 *   is null (no end recorded) or today or later.
 */
export function computeProtectionSummary(
  agreements: ProtectionAgreementLike[],
  today: string
): ProtectionSummary {
  const deadlines = buildDeadlines(agreements, today);

  let activeAgreements = 0;
  let exclusivityActive = 0;
  for (const agreement of agreements) {
    if (agreement.status !== "active") continue;
    activeAgreements += 1;
    if (
      agreement.exclusivity === "exclusive" &&
      (agreement.exclusivity_end === null ||
        agreement.exclusivity_end >= today)
    ) {
      exclusivityActive += 1;
    }
  }

  return {
    activeAgreements,
    deadlinesNext30Days: deadlines.filter(
      (d) => d.daysLeft >= 0 && d.daysLeft <= 30
    ).length,
    overdueDeadlines: deadlines.filter((d) => d.daysLeft < 0).length,
    exclusivityActive,
  };
}
