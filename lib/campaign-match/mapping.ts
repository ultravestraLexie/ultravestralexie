// ============================================================================
// Campaign Match — data mapping: stored directory rows → BrandRecord.
//
// Every rule here is deterministic and documented. Where the stored
// directory cannot supply a spec input, the record follows the
// spec's UNKNOWN path — nothing is invented. See the build report
// for the full mapping table; the essentials:
//
// * Relied program/rate: public.affiliate_programs rows for the
//   brand. Exactly one distinct non-null commission_rate and no
//   recorded conflict → that rate is relied upon. Distinct rates
//   across rows, or a recorded rate conflict (below), → conflicted
//   and NO rate is relied upon.
// * Rate conflicts are recorded in public.brand_evidence as rows
//   with evidence_type='commission_rate' whose summary reports a
//   "Rate conflict:" — the directory's own convention (conflicted
//   rates are stored as NULL in affiliate_programs for the same
//   reason). A resolution counts only when an evidence summary
//   records the conflict as resolved; none is inferred.
// * Cap classification reads the relied program's commission_notes,
//   which follow a structured convention: they open with
//   "Commission cap: UNCAPPED — stated in the program terms…" or
//   "Commission cap: not stated in any published source…". UNCAPPED
//   is taken ONLY from that explicit statement (or an explicit
//   "uncapped" statement in a direct-tier evidence summary) — the
//   directory rule is that absence of a cap statement is unknown,
//   never uncapped. A recorded cap amount → capped.
// * Provenance tier: by evidence source_type, upgraded to direct
//   when the source URL's domain is the brand's own website domain.
//   official_site/brand_site → direct; affiliate_network → network;
//   listing/affiliate_directory/creator_report → third_party;
//   social and anything unrecognized → snippet (secondary).
// * "Supports the terms": evidence rows whose type is terms-bearing
//   (affiliate, affiliate_program, commission_rate, compensation,
//   creator_program) or whose summary states a rate or a cap.
// * Independence corroboration: an evidence summary states a rate
//   when a single unambiguous percentage is stated as a commission
//   (ranges like "5-10%" state no single rate → no corroboration).
// * Attribution window: parsed from terms-bearing evidence summaries
//   and the program notes ("30-day cookie" is the directory's
//   dominant convention). The value from the highest-tier source
//   wins; ties inside a tier go to the most recently checked row.
//   "Verified" = sourced from a direct or network tier.
// * Payment terms: public.payment_terms rows when present (the
//   loaded directory has none); otherwise Net days / payout
//   threshold patterns parsed from terms-bearing evidence and the
//   program notes; otherwise UNKNOWN.
// * Exclusivity: only from payment_terms.exclusivity. The loaded
//   directory stores no exclusivity anywhere else, so in practice
//   exclusivity is UNKNOWN in v1 — the spec's unknown path.
// * Dates (Correction A): verifiedAt is ALWAYS null. No stored
//   field records term verification (last_checked_at is a fetch
//   date, brand_contacts.last_verified_at concerns contacts, not
//   terms), so legacy rows are "unverified" and the 90-day clock
//   never starts. fetchedAt = latest last_checked_at across the
//   brand's program + evidence rows; ingestedAt = brands.created_at.
// * Platform scope: a TikTok Shop program is specific to TikTok;
//   any other recorded program is platform-agnostic (link-based
//   tracking); no program → no signal.
// * Price signal: min/max of public.brand_products.price.
// ============================================================================

import {
  poolP10,
  type BrandRecord,
  type CapClassification,
  type SourceRecord,
  type SourceTier,
} from "./engine";

export interface BrandRow {
  id: string;
  name: string;
  website: string | null;
  created_at: string;
}

export interface ProgramRow {
  id: string;
  brand_id: string;
  network: string | null;
  commission_rate: number | null;
  commission_notes: string | null;
  application_url: string | null;
  last_checked_at: string | null;
  created_at: string;
}

export interface EvidenceRow {
  brand_id: string;
  source_url: string;
  source_type: string | null;
  evidence_type: string | null;
  evidence_summary: string | null;
  last_checked_at: string | null;
  created_at: string;
}

export interface PaymentTermsRow {
  brand_id: string;
  exclusivity: string | null;
  payment_timeline: string | null;
  notes: string | null;
}

export interface ProductRow {
  brand_id: string;
  price: number | null;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryLinkRow {
  brand_id: string;
  category_id: string;
  is_primary: boolean;
}

const TERMS_TYPES = new Set([
  "affiliate",
  "affiliate_program",
  "commission_rate",
  "compensation",
  "creator_program",
]);

export function originOf(url: string | null | undefined): string {
  if (!url) return "unknown";
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function tierFor(
  sourceType: string | null,
  sourceUrl: string,
  brandDomain: string
): SourceTier {
  if (brandDomain !== "unknown" && originOf(sourceUrl) === brandDomain)
    return "direct";
  switch ((sourceType ?? "").toLowerCase()) {
    case "official_site":
    case "brand_site":
    case "direct":
      return "direct";
    case "affiliate_network":
      return "network";
    case "listing":
    case "affiliate_directory":
    case "creator_report":
      return "third_party";
    default:
      return "snippet";
  }
}

/** A single unambiguous commission rate stated in text. Ranges
 *  ("5-10%") state no single rate → null. */
export function parseRateFromText(text: string | null): number | null {
  if (!text) return null;
  if (/\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?\s*%/.test(text)) return null;
  const patterns = [
    /(\d+(?:\.\d+)?)\s*%\s*(?:base\s+)?commission/i,
    /commission\s*(?:of|at|is|:)?\s*(\d+(?:\.\d+)?)\s*%/i,
    /(\d+(?:\.\d+)?)\s*%\s*per sale/i,
    /earn\s+(?:a\s+)?(\d+(?:\.\d+)?)\s*%/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return Number(m[1]);
  }
  return null;
}

export function parseCapFromText(
  text: string | null
): { cap: CapClassification; amountUsd: number | null } | null {
  if (!text) return null;
  if (/\buncapped\b/i.test(text)) return { cap: "uncapped", amountUsd: null };
  const m =
    text.match(/(?:commission\s+)?cap[^.]{0,40}?\$\s*([\d,]+)/i) ??
    text.match(/capped\s+at\s+\$\s*([\d,]+)/i) ??
    text.match(/maximum\s+(?:earnings|commission)\s+of\s+\$\s*([\d,]+)/i);
  if (m) return { cap: "capped", amountUsd: Number(m[1].replace(/,/g, "")) };
  return null;
}

export function parseAttribution(
  text: string | null
): { days: number | null; sessionOnly: boolean } | null {
  if (!text) return null;
  if (/session[-\s]only|session\s+cookie/i.test(text))
    return { days: null, sessionOnly: true };
  const m =
    text.match(/(\d+)\s*-\s*day\s+(?:cookie|attribution)/i) ??
    text.match(/(\d+)\s+days?\s+(?:cookie|attribution)/i) ??
    text.match(
      /(?:cookie|attribution)\s*(?:window|duration|period)?\s*(?:of|:|is)?\s*(\d+)\s*days?/i
    );
  if (m) return { days: Number(m[1]), sessionOnly: false };
  return null;
}

export function parseNetDays(text: string | null): number | null {
  if (!text) return null;
  const m = text.match(/net[-\s]?(\d+)/i);
  return m ? Number(m[1]) : null;
}

export function parsePayoutThreshold(text: string | null): number | null {
  if (!text) return null;
  const m =
    text.match(/\$\s*([\d,]+)\s*(?:minimum\s+payout|payout\s+threshold|min\.?\s*payout)/i) ??
    text.match(/(?:minimum\s+payout|payout\s+threshold)\s*(?:of|:)?\s*\$\s*([\d,]+)/i);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

const TIER_RANK: Record<SourceTier, number> = {
  direct: 0,
  network: 1,
  third_party: 2,
  snippet: 3,
};

export interface BuildArgs {
  brand: BrandRow;
  programs: ProgramRow[];
  evidence: EvidenceRow[];
  paymentTermsRows: PaymentTermsRow[];
  products: ProductRow[];
  links: CategoryLinkRow[];
  categoriesById: Map<string, CategoryRow>;
  /** The percentile pool this brand is scored against (already
   *  category-or-global per the <5 rule) and its 10th percentile. */
  pool: number[];
  poolP10Value: number | null;
}

export function buildBrandRecord(args: BuildArgs): BrandRecord {
  const { brand, categoriesById } = args;
  const brandDomain = originOf(brand.website);

  // --- Categories: primary link (or first link) + secondaries.
  const catOf = (l: CategoryLinkRow) => {
    const c = categoriesById.get(l.category_id);
    return c ? { name: c.name, slug: c.slug } : null;
  };
  const primaryLink =
    args.links.find((l) => l.is_primary) ?? args.links[0] ?? null;
  const primaryCategory = primaryLink ? catOf(primaryLink) : null;
  const secondaryCategories = args.links
    .filter((l) => l !== primaryLink)
    .map(catOf)
    .filter((c): c is { name: string; slug: string } => c != null);

  // --- Relied program + rate, with recorded conflicts.
  const programs = [...args.programs].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
  const distinctRates = [
    ...new Set(
      programs
        .map((p) => p.commission_rate)
        .filter((r): r is number => r != null)
        .map(Number)
    ),
  ];
  const conflictRows = args.evidence.filter(
    (e) =>
      e.evidence_type === "commission_rate" &&
      /rate conflict/i.test(e.evidence_summary ?? "")
  );
  const resolutionRecorded = args.evidence.some((e) =>
    /(?:rate\s+)?conflict[^.]{0,80}resolved|resolved[^.]{0,80}(?:the\s+)?conflict/i.test(
      e.evidence_summary ?? ""
    )
  );
  const rateConflicted = distinctRates.length >= 2 || conflictRows.length > 0;
  const ratePct =
    !rateConflicted && distinctRates.length === 1 ? distinctRates[0] : null;
  const reliedProgram =
    programs.find((p) => p.commission_rate != null && Number(p.commission_rate) === ratePct) ??
    programs[0] ??
    null;

  // --- Sources from evidence rows.
  const sources: SourceRecord[] = args.evidence.map((e) => {
    const statesRatePct = parseRateFromText(e.evidence_summary);
    const statesCap = parseCapFromText(e.evidence_summary)?.cap ?? null;
    return {
      tier: tierFor(e.source_type, e.source_url, brandDomain),
      origin: originOf(e.source_url),
      statesRatePct,
      statesCap,
      supportsTerms:
        TERMS_TYPES.has(e.evidence_type ?? "") ||
        statesRatePct != null ||
        statesCap != null,
    };
  });

  // --- Cap classification (explicit statements only).
  const notes = reliedProgram?.commission_notes ?? "";
  let cap: CapClassification = "unknown";
  let capAmountUsd: number | null = null;
  let capFromNotes = false;
  if (/^\s*commission cap:\s*uncapped/i.test(notes)) {
    cap = "uncapped";
    capFromNotes = true;
  } else {
    const fromNotes = parseCapFromText(notes);
    if (fromNotes && fromNotes.cap === "capped") {
      cap = "capped";
      capAmountUsd = fromNotes.amountUsd;
      capFromNotes = true;
    } else if (
      args.evidence.some(
        (e) =>
          tierFor(e.source_type, e.source_url, brandDomain) === "direct" &&
          /\buncapped\b/i.test(e.evidence_summary ?? "")
      )
    ) {
      cap = "uncapped";
    }
  }

  // --- The relied program's own page is a fetched source too.
  if (reliedProgram?.application_url) {
    const appOrigin = originOf(reliedProgram.application_url);
    sources.push({
      tier:
        appOrigin === brandDomain && brandDomain !== "unknown"
          ? "direct"
          : reliedProgram.network
            ? "network"
            : "third_party",
      origin: appOrigin,
      statesRatePct: ratePct,
      // The commission_notes cap statement summarizes the program
      // terms at this URL ("stated in the program terms"), so this
      // source supports the cap when the classification came from
      // the notes.
      statesCap: capFromNotes ? cap : null,
      supportsTerms: true,
    });
  }

  // --- Attribution: highest-tier source wins; most recent in tier.
  let attributionDays: number | null = null;
  let attributionSessionOnly = false;
  let attributionVerified = false;
  {
    const candidates: {
      tier: SourceTier;
      at: string;
      parsed: { days: number | null; sessionOnly: boolean };
    }[] = [];
    for (const e of args.evidence) {
      if (!TERMS_TYPES.has(e.evidence_type ?? "")) continue;
      const parsed = parseAttribution(e.evidence_summary);
      if (parsed) {
        candidates.push({
          tier: tierFor(e.source_type, e.source_url, brandDomain),
          at: e.last_checked_at ?? e.created_at,
          parsed,
        });
      }
    }
    const fromNotes = parseAttribution(notes);
    if (fromNotes && reliedProgram) {
      candidates.push({
        tier:
          reliedProgram.application_url &&
          originOf(reliedProgram.application_url) === brandDomain
            ? "direct"
            : reliedProgram.network
              ? "network"
              : "third_party",
        at: reliedProgram.last_checked_at ?? reliedProgram.created_at,
        parsed: fromNotes,
      });
    }
    candidates.sort(
      (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || b.at.localeCompare(a.at)
    );
    const best = candidates[0];
    if (best) {
      attributionDays = best.parsed.days;
      attributionSessionOnly = best.parsed.sessionOnly;
      attributionVerified = best.tier === "direct" || best.tier === "network";
    }
  }

  // --- Payment terms: stored rows first, then text patterns.
  let paymentTerms: BrandRecord["paymentTerms"] = null;
  if (args.paymentTermsRows.length > 0) {
    const text = args.paymentTermsRows
      .map((r) => `${r.payment_timeline ?? ""} ${r.notes ?? ""}`)
      .join(" ");
    paymentTerms = {
      netDays: parseNetDays(text),
      payoutThresholdUsd: parsePayoutThreshold(text),
    };
  } else {
    const texts = [
      notes,
      ...args.evidence
        .filter((e) => TERMS_TYPES.has(e.evidence_type ?? ""))
        .map((e) => e.evidence_summary ?? ""),
    ];
    let netDays: number | null = null;
    let threshold: number | null = null;
    for (const t of texts) {
      if (netDays == null) netDays = parseNetDays(t);
      if (threshold == null) threshold = parsePayoutThreshold(t);
    }
    if (netDays != null || threshold != null) {
      paymentTerms = { netDays, payoutThresholdUsd: threshold };
    }
  }

  // --- Exclusivity: payment_terms rows only (see header).
  let exclusivity: BrandRecord["exclusivity"] = null;
  for (const r of args.paymentTermsRows) {
    const text = (r.exclusivity ?? "").trim();
    if (text) {
      exclusivity = {
        restrictive: !/non[-\s]?exclusive|no exclusivity|not exclusive/i.test(text),
      };
      break;
    }
  }

  // --- Dates (Correction A: verifiedAt is always null).
  const fetchedCandidates = [
    ...args.evidence.map((e) => e.last_checked_at ?? e.created_at),
    ...programs.map((p) => p.last_checked_at ?? p.created_at),
  ].sort();
  const fetchedAt =
    fetchedCandidates.length > 0
      ? fetchedCandidates[fetchedCandidates.length - 1]
      : null;

  // --- Price signal + platform scope.
  const prices = args.products
    .map((p) => p.price)
    .filter((v): v is number => v != null)
    .map(Number);
  const priceSignal =
    prices.length > 0
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : null;

  const platformScope: BrandRecord["platformScope"] = !reliedProgram
    ? null
    : /tiktok\s*shop/i.test(reliedProgram.network ?? "")
      ? { kind: "specific", platforms: ["tiktok"] }
      : { kind: "agnostic" };

  return {
    brandId: brand.id,
    brandName: brand.name,
    primaryCategory,
    secondaryCategories,
    ratePct,
    rateConflicted,
    rateConflictResolved: rateConflicted && resolutionRecorded,
    ratePool: args.pool,
    categoryRateP10: args.poolP10Value,
    rateCorroborated:
      ratePct != null &&
      sources.some((s) => s.statesRatePct === ratePct),
    cap,
    capAmountUsd,
    // No stored record establishes a cap's qualifying conditions.
    capQualifyingConditionsKnown: false,
    attributionDays,
    attributionSessionOnly,
    attributionVerified,
    paymentTerms,
    exclusivity,
    sources,
    verifiedAt: null,
    fetchedAt,
    ingestedAt: brand.created_at,
    priceSignal,
    platformScope,
  };
}

// ---------------------------------------------------------------------------
// Percentile pools (directory-wide)
// ---------------------------------------------------------------------------

export interface PoolContext {
  /** brand_id → the pool that brand is scored against. */
  poolByBrand: Map<string, number[]>;
  /** brand_id → 10th percentile of that pool. */
  p10ByBrand: Map<string, number | null>;
}

/** Pools hold known, non-conflicted rates: a brand contributes its
 *  rate when it has exactly one distinct non-null program rate and
 *  no recorded conflict (multi-rate brands and evidence-conflict
 *  brands are excluded, and are themselves scored against the pool
 *  without their own rate). Category pool = rates of brands whose
 *  primary category is that category; pools with <5 known rates
 *  fall back to the global pool. */
export function buildPools(args: {
  programs: Pick<ProgramRow, "brand_id" | "commission_rate">[];
  links: CategoryLinkRow[];
  categoriesById: Map<string, CategoryRow>;
  conflictedBrandIds: Set<string>;
  publishedBrandIds: Set<string>;
}): PoolContext {
  const ratesByBrand = new Map<string, Set<number>>();
  for (const p of args.programs) {
    if (p.commission_rate == null) continue;
    if (!ratesByBrand.has(p.brand_id)) ratesByBrand.set(p.brand_id, new Set());
    ratesByBrand.get(p.brand_id)?.add(Number(p.commission_rate));
  }
  const knownRateByBrand = new Map<string, number>();
  for (const [brandId, rates] of ratesByBrand) {
    if (rates.size === 1 && !args.conflictedBrandIds.has(brandId)) {
      knownRateByBrand.set(brandId, [...rates][0]);
    }
  }

  const primarySlugByBrand = new Map<string, string | null>();
  const linksByBrand = new Map<string, CategoryLinkRow[]>();
  for (const l of args.links) {
    if (!linksByBrand.has(l.brand_id)) linksByBrand.set(l.brand_id, []);
    linksByBrand.get(l.brand_id)?.push(l);
  }
  for (const [brandId, links] of linksByBrand) {
    const primary = links.find((l) => l.is_primary) ?? links[0];
    primarySlugByBrand.set(
      brandId,
      primary ? (args.categoriesById.get(primary.category_id)?.slug ?? null) : null
    );
  }

  const globalPool: number[] = [];
  const poolByCategory = new Map<string, number[]>();
  for (const [brandId, rate] of knownRateByBrand) {
    if (!args.publishedBrandIds.has(brandId)) continue;
    globalPool.push(rate);
    const slug = primarySlugByBrand.get(brandId);
    if (slug) {
      if (!poolByCategory.has(slug)) poolByCategory.set(slug, []);
      poolByCategory.get(slug)?.push(rate);
    }
  }

  const poolByBrand = new Map<string, number[]>();
  const p10ByBrand = new Map<string, number | null>();
  for (const brandId of args.publishedBrandIds) {
    const slug = primarySlugByBrand.get(brandId);
    const categoryPool = slug ? poolByCategory.get(slug) : undefined;
    const pool =
      categoryPool && categoryPool.length >= 5 ? categoryPool : globalPool;
    poolByBrand.set(brandId, pool);
    p10ByBrand.set(brandId, poolP10(pool));
  }
  return { poolByBrand, p10ByBrand };
}
