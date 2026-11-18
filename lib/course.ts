import {
  GRADE_THRESHOLDS,
  PASS_THRESHOLD,
  computeGaa,
  computeT,
  eligibilityFor,
  finalOutcome,
  requiredFinalForScore,
  sanitizeInputs,
  type EligibilityStatus,
  type RequiredFinal,
  type ScoreInputs,
  type TargetLetter,
} from "./grading";
import { RULES } from "./rules";
import type { StudentCourse } from "./types";

/**
 * A Scenario is a plain, self-contained copy of a course's marks. The Official
 * Ledger renders one built from the DB row; the Playground renders an
 * independent clone, so experiments can never corrupt saved records.
 */
export interface Scenario {
  weekly: (number | null)[];
  q1: number | null;
  q2: number | null;
  skipQ2: boolean;
  final: number | null;
  /** Extra Activity bonus marks (0–5). */
  bonus: number;
  target: TargetLetter;
}

export function scenarioFromCourse(c: StudentCourse): Scenario {
  return {
    weekly: Array.from({ length: RULES.totalWeeks }, (_, i) => c.weekly_scores[i] ?? null),
    q1: c.quiz_1,
    q2: c.quiz_2,
    skipQ2: c.is_q2_skipped,
    final: c.final_score,
    bonus: c.bonus_marks ?? 0,
    target: c.target_grade_letter,
  };
}

/** Deep copy for the playground. A Final that hasn't been taken stays unset until the student drags it. */
export function cloneForPlayground(s: Scenario): Scenario {
  return { ...s, weekly: [...s.weekly] };
}

/** Everything derived from a scenario, computed in one pass. */
export function evaluate(s: Scenario, _legacyGaa = 0) {
  void _legacyGaa; // kept so older call sites still compile; stored GAA no longer feeds T
  const ofFirst = RULES.finalEligibility.ofFirst;
  // Assignment average = best 5 of the first 7 weeks (counts toward Final eligibility only, not T).
  const gaaResult = computeGaa(s.weekly.slice(0, ofFirst), RULES.finalEligibility.best);
  const anyWeekEntered = s.weekly.some((w) => w !== null);
  const inputs = sanitizeInputs({ gaa: gaaResult.gaa, q1: s.q1 ?? 0, q2: s.q2 ?? 0, bonus: s.bonus }, s.skipQ2);

  const assignmentEligibility = eligibilityFor(s.weekly, RULES.finalEligibility);
  // "Attend at least one of the two quizzes." Not-yet-taken stays pending; ticking Skip Q2 with no Q1 means none attended.
  const q2Attended = !s.skipQ2 && s.q2 !== null;
  const quizAttendance: EligibilityStatus = s.q1 !== null || q2Attended ? "eligible" : s.skipQ2 ? "ineligible" : "pending";
  const combined: EligibilityStatus =
    assignmentEligibility.status === "ineligible" || quizAttendance === "ineligible"
      ? "ineligible"
      : assignmentEligibility.status === "eligible" && quizAttendance === "eligible"
        ? "eligible"
        : "pending";
  const finalEligibility = { ...assignmentEligibility, status: combined };

  // Not eligible to sit the Final at all: no Final mark can earn any grade.
  const blocked = combined === "ineligible";
  const blockedResult: RequiredFinal = {
    status: "impossible",
    score: null,
    label: "Not eligible for the Final",
    note: "You don't meet the Final exam entry rules (assignment average ≥ 40 on the best 5 of the first 7, and at least one quiz attended), so no Final mark can earn this grade.",
  };
  return {
    gaaResult,
    anyWeekEntered,
    inputs,
    assignmentEligibility,
    quizAttendance,
    finalEligibility,
    blocked,
    outcome: s.final === null ? null : finalOutcome(inputs, s.final, finalEligibility.status),
    pass: blocked ? blockedResult : requiredFinalForScore(PASS_THRESHOLD, inputs),
    goal: blocked ? blockedResult : requiredFinalForScore(GRADE_THRESHOLDS[s.target], inputs),
  };
}

export type Evaluation = ReturnType<typeof evaluate>;

/** Strategic Quiz 2 numbers used by the advisor. */
export function quizAdvice(inputs: ScoreInputs, target: TargetLetter, assumedFinal: number) {
  const threshold = GRADE_THRESHOLDS[target];
  const skip = requiredFinalForScore(threshold, { ...inputs, q2: 0 });

  // Smallest Q2 that reaches the target at the assumed Final score.
  let q2Needed: number | null = null;
  for (let q2 = 0; q2 <= 100; q2++) {
    if (computeT({ ...inputs, q2 }, assumedFinal) >= threshold - 1e-9) {
      q2Needed = q2;
      break;
    }
  }
  // Final needed if Quiz 2 is taken and scores 60 / 80 / 100.
  const sit = [60, 80, 100].map((q2) => ({ q2, req: requiredFinalForScore(threshold, { ...inputs, q2 }) }));
  return { skip, q2Needed, sit };
}
