/**
 * Single place for programme rules, taken from the official course grading
 * document: T = max(0.6F + 0.3·max(Q1,Q2), 0.45F + 0.25·Q1 + 0.3·Q2) + bonus (≤ 5);
 * to sit the Final you need an average >= 40 on the best 5 of the first 7 weekly
 * assignments AND at least one of the two quizzes attended.
 *
 * Still to confirm against the document: the 40-mark floor on the Final, and
 * grade points / equal credits (used only by the term GPA projector).
 */
export const RULES = {
  totalWeeks: 12,
  /** Final exam eligibility: avg of best 5 of the first 7 weekly assignments must be >= 40. */
  finalEligibility: { best: 5, ofFirst: 7, min: 40 },
  /** Extra Activity bonus is capped at this many marks. */
  maxBonus: 5,
  /** Absolute minimum on the in-person Final, regardless of T. Below it => U. */
  finalMinToPass: 40,
  /** Default what-if Final score when a playground is opened before the Final is taken. */
  defaultPlaygroundFinal: 60,
} as const;
