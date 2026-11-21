/* THE CONVERSION LAB — shared types and canon constants.
 *
 * The companion to the Five Buyer Test (app/buyer-brain): after the
 * core simulation tells a creator what is wrong, the Lab tests four
 * different openings of the same video against the SAME five buyer
 * perspectives, so the creator leaves with ideas for what to test
 * next — not just a diagnosis.
 *
 * Everything the AI returns is a simulated buyer reaction. Nothing
 * here is real customer research, and no score is a probability of
 * purchase. The owner's disclaimer, verbatim wherever the Lab is
 * presented: "These are simulated buyer reactions, not real
 * customer research or guaranteed sales predictions."
 */

export const LAB_DISCLAIMER =
  "These are simulated buyer reactions, not real customer research or guaranteed sales predictions.";

export type LabOutcome =
  | "likely_to_scroll_away"
  | "curious_but_unconvinced"
  | "needs_more_information"
  | "considering_purchase"
  | "likely_to_continue";

export type PersonaReaction = {
  name: string;
  interestScore: number;
  trustScore: number;
  desireScore: number;
  outcome: LabOutcome;
  oneLineReaction: string;
};

export type LabVariant = {
  version: "A" | "B" | "C" | "D";
  style: string;
  opening: string;
  personas: PersonaReaction[];
  /** Mean of the variant's 15 persona scores, computed server-side
   *  from the returned scores — never the model's own arithmetic. */
  panelAverage: number;
};

export type LabComparison = {
  strongestVersion: "A" | "B" | "C" | "D";
  strongestWhy: string;
  wins: { version: "A" | "B" | "C" | "D"; buyer: string; why: string }[];
  recommendedFirstTest: "A" | "B" | "C" | "D";
  recommendedReasoning: string;
};

export type LabReport = {
  variants: LabVariant[];
  comparison: LabComparison;
};

/** The four openings under test — the owner's canon. */
export const VERSION_STYLES: { version: "A" | "B" | "C" | "D"; style: string }[] = [
  { version: "A", style: "Emotional opening" },
  { version: "B", style: "Problem-first opening" },
  { version: "C", style: "Demonstration-first opening" },
  { version: "D", style: "Curiosity-driven opening" },
];

export function styleFor(version: string): string {
  return VERSION_STYLES.find((v) => v.version === version)?.style ?? "";
}

/** The five buyers and the core question each one asks — the
 *  owner's canon wording, matched by name substring the same way
 *  the Five Buyer Test page matches its persona profiles. */
export const PERSONA_QUESTIONS: { match: string; question: string }[] = [
  { match: "emotional", question: "Will this make my life better?" },
  {
    match: "logical",
    question: "Does this actually work, and is it worth the price?",
  },
  { match: "skeptical", question: "Why should I believe you?" },
  { match: "impulse", question: "Do I want this right now?" },
  {
    match: "conscious",
    question: "Do I really need this, and is it the right choice?",
  },
];

export function questionFor(name: string): string | undefined {
  const n = name.toLowerCase();
  return PERSONA_QUESTIONS.find((p) => n.includes(p.match))?.question;
}

export const OUTCOME_LABELS: Record<LabOutcome, string> = {
  likely_to_scroll_away: "Likely to scroll away",
  curious_but_unconvinced: "Curious, not convinced",
  needs_more_information: "Needs more information",
  considering_purchase: "Considering purchase",
  likely_to_continue: "Likely to keep watching",
};

export function outcomeLabel(outcome: string): string {
  return (
    OUTCOME_LABELS[outcome as LabOutcome] ??
    outcome.replaceAll("_", " ")
  );
}
