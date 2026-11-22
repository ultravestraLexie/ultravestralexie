// Proposal Builder — the composition, pure and isolated.
//
// HONESTY RULE (binding): this module ASSEMBLES a proposal document
// from pieces the creator entered or selected — deliverables and
// prices they typed, their own audience summary, their campaign
// ideas, and proof points snapshotted from their own Reputation
// Passport entries. It writes nothing of its own: no invented
// claims, no embellished numbers, no estimated results. Money is
// integer cents end to end, and every total is an exact sum that
// can be re-derived from the deliverable rows by hand.
//
// This module has no imports and no I/O on purpose: the API route
// stores the pieces, the page renders documents with this exact
// function, and the fixtures (scripts/proposals-fixtures.ts)
// exercise it in isolation — so what is tested is what ships.

export type ProposalDeliverable = {
  item: string;
  quantity: number;
  /** Unit price, integer cents. */
  priceCents: number;
};

export type ProposalProofPoint = {
  title: string;
  platform: string;
  metric: string;
  timeframe: string;
};

export type ProposalRecord = {
  brandName: string;
  title: string;
  deliverables: ProposalDeliverable[];
  audienceSummary: string;
  campaignIdeas: string[];
  proofPoints: ProposalProofPoint[];
  notes: string;
  creatorName?: string;
};

export type ProposalTotals = {
  lineTotalsCents: number[];
  totalCents: number;
};

/** Exact integer formatting: cents → $X,XXX.XX. No float division —
 *  the dollar and cent parts come from integer math on the cents
 *  (the Revenue Tracker's formatter, same convention). */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = String(abs % 100).padStart(2, "0");
  return `${sign}$${dollars.toLocaleString("en-US")}.${remainder}`;
}

/** Line total = quantity × unit price; grand total = the exact sum
 *  of the line totals. Pure integer arithmetic — no rounding. */
export function proposalTotals(
  deliverables: ProposalDeliverable[]
): ProposalTotals {
  const lineTotalsCents = deliverables.map((d) => d.quantity * d.priceCents);
  const totalCents = lineTotalsCents.reduce((sum, n) => sum + n, 0);
  return { lineTotalsCents, totalCents };
}

/**
 * Compose the copy-ready proposal document. Fixed section order:
 * headline, About my audience, What I propose, Investment, Campaign
 * ideas, Proof points, Notes. A section with no content is omitted
 * entirely — no empty headings. Deterministic: the same record
 * always produces the same string.
 */
export function composeProposal(record: ProposalRecord): string {
  const sections: string[] = [];

  // Headline — always present (title and brand are required).
  const headline = [record.title, `Prepared for ${record.brandName}`];
  const creatorName = (record.creatorName ?? "").trim();
  if (creatorName !== "") {
    headline.push(`Prepared by ${creatorName}`);
  }
  sections.push(headline.join("\n"));

  const audienceSummary = record.audienceSummary.trim();
  if (audienceSummary !== "") {
    sections.push(`ABOUT MY AUDIENCE\n${audienceSummary}`);
  }

  if (record.deliverables.length > 0) {
    const { lineTotalsCents, totalCents } = proposalTotals(
      record.deliverables
    );
    const lines = record.deliverables.map(
      (d, i) =>
        `- ${d.item} — ${d.quantity} × ${formatMoney(d.priceCents)} = ${formatMoney(lineTotalsCents[i])}`
    );
    sections.push(`WHAT I PROPOSE\n${lines.join("\n")}`);
    sections.push(`INVESTMENT\nTotal: ${formatMoney(totalCents)}`);
  }

  const ideas = record.campaignIdeas
    .map((idea) => idea.trim())
    .filter((idea) => idea !== "");
  if (ideas.length > 0) {
    sections.push(`CAMPAIGN IDEAS\n${ideas.map((i) => `- ${i}`).join("\n")}`);
  }

  if (record.proofPoints.length > 0) {
    const lines = record.proofPoints.map((point) => {
      let line = `- ${point.title}`;
      if (point.metric.trim() !== "") {
        line += ` — ${point.metric}`;
      }
      const detail = [point.platform, point.timeframe]
        .map((part) => part.trim())
        .filter((part) => part !== "");
      if (detail.length > 0) {
        line += ` (${detail.join(", ")})`;
      }
      return line;
    });
    sections.push(`PROOF POINTS\n${lines.join("\n")}`);
  }

  const notes = record.notes.trim();
  if (notes !== "") {
    sections.push(`NOTES\n${notes}`);
  }

  return sections.join("\n\n");
}
