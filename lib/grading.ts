/**
 * IIT Madras BS evaluation engine.
 *
 *   T = max( 0.6*F + 0.3*max(Q1,Q2),  0.45*F + 0.25*Q1 + 0.3*Q2 ) + Bonus (Extra Activity, capped at 5)
 *
 * (Weekly assignments no longer add marks to T — they only decide eligibility to
 * sit the Final: best 5 of the first 7 must average >= 40, and at least one quiz
 * must be attended. Q1/Q2 count as 0 if not attempted.)
 *
 * T is monotonically increasing in F, so "T >= target" holds iff EITHER branch
 * of the max reaches the target: required F = min(F1, F2). On top of that the
 * Final itself must score >= RULES.finalMinToPass, otherwise the grade is U.
 */
import { RULES } from "./rules";

export type GradeLetter = "S" | "A" | "B" | "C" | "D" | "E" | "U";
export type TargetLetter = Exclude<GradeLetter, "E" | "U">;

export const TARGET_LETTERS: TargetLetter[] = ["S", "A", "B", "C", "D"];

/** Lower bound (inclusive) of T for each grade. */
export const GRADE_THRESHOLDS = { S: 90, A: 80, B: 70, C: 60, D: 50, E: 40 } as const;
export const PASS_THRESHOLD = GRADE_THRESHOLDS.E;

/** Grade points (assumed IITM scale). */
export const GRADE_POINTS: Record<GradeLetter, number> = { S: 10, A: 9, B: 8, C: 7, D: 6, E: 4, U: 0 };

export interface ScoreInputs {
  /** Assignment average (best 5 of first 7) — shown to the student, but NOT part of T. */
  gaa: number;
  q1: number;
  q2: number;
  /** Extra Activity bonus marks, 0–RULES.maxBonus. */
  bonus: number;
}

export type RequiredFinal =
  | { status: "floor"; score: number; label: string; note: string }
  | { status: "needed"; score: number; label: string }
  | { status: "impossible"; score: null; label: string; note: string };

export const IMPOSSIBLE_NOTE =
  "This target can't be reached with your current quiz scores. Try raising Quiz 2 or earn the Extra Activity bonus.";

const EPS = 1e-9;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Normalises raw inputs to their valid ranges (GAA float, quizzes integer). */
export function sanitizeInputs(i: ScoreInputs, q2Skipped = false): ScoreInputs {
  return {
    gaa: clamp(i.gaa, 0, 100),
    q1: Math.round(clamp(i.q1, 0, 100)),
    q2: q2Skipped ? 0 : Math.round(clamp(i.q2, 0, 100)),
    bonus: Math.round(clamp(i.bonus ?? 0, 0, RULES.maxBonus) * 10) / 10,
  };
}

/* ------------------------------------------------------------------ */
/* GAA: best K of the weekly assignments                               */
/* ------------------------------------------------------------------ */

export interface GaaResult {
  /** Average of the counted scores, 0–100 (unentered weeks count as 0). */
  gaa: number;
  /** Week indices (0-based) counted toward GAA. */
  counted: number[];
  /** Entered weeks that fell outside the best K — "Dropped from Average". */
  dropped: number[];
  /** How many weeks have a score entered. */
  entered: number;
}

export function computeGaa(weekly: (number | null)[], bestK: number = RULES.finalEligibility.best): GaaResult {
  const entries = weekly
    .map((v, i) => ({ v: v === null ? null : clamp(v, 0, 100), i }))
    .filter((e): e is { v: number; i: number } => e.v !== null)
    .sort((a, b) => b.v - a.v || a.i - b.i);
  const top = entries.slice(0, bestK);
  const sum = top.reduce((s, e) => s + e.v, 0);
  return {
    gaa: Math.round((sum / bestK) * 100) / 100,
    counted: top.map((e) => e.i),
    dropped: entries.slice(bestK).map((e) => e.i),
    entered: entries.length,
  };
}

/* ------------------------------------------------------------------ */
/* Eligibility windows (Quiz 1 qualifier, Final exam)                  */
/* ------------------------------------------------------------------ */

export type EligibilityStatus = "eligible" | "ineligible" | "pending";

export interface Eligibility {
  status: EligibilityStatus;
  /** Average of best `best` of first `ofFirst` weeks, unentered = 0. */
  avg: number;
  /** Same, if every unentered week in the window scored 100. */
  bestCase: number;
  min: number;
}

function bestAverage(values: (number | null)[], best: number, fill: number): number {
  const v = values.map((x) => (x === null ? fill : clamp(x, 0, 100))).sort((a, b) => b - a);
  return v.slice(0, best).reduce((s, x) => s + x, 0) / best;
}

/**
 * eligible   — already >= min even with unentered weeks as 0
 * ineligible — cannot reach min even if every unentered week scored 100
 * pending    — still depends on weeks not yet entered
 */
export function eligibilityFor(
  weekly: (number | null)[],
  rule: { best: number; ofFirst: number; min: number },
): Eligibility {
  const window = Array.from({ length: rule.ofFirst }, (_, i) => weekly[i] ?? null);
  const avg = bestAverage(window, rule.best, 0);
  const bestCase = bestAverage(window, rule.best, 100);
  const status: EligibilityStatus = avg >= rule.min ? "eligible" : bestCase < rule.min ? "ineligible" : "pending";
  return { status, avg: Math.round(avg * 100) / 100, bestCase: Math.round(bestCase * 100) / 100, min: rule.min };
}

/* ------------------------------------------------------------------ */
/* Scores and outcomes                                                 */
/* ------------------------------------------------------------------ */

/** Comprehensive course score T (out of 100) for a given final-exam mark F. */
export function computeT({ q1, q2, bonus }: ScoreInputs, f: number): number {
  const option1 = 0.6 * f + 0.3 * Math.max(q1, q2);
  const option2 = 0.45 * f + 0.25 * q1 + 0.3 * q2;
  return Math.max(option1, option2) + bonus;
}

export function gradeForScore(t: number): GradeLetter {
  if (t >= GRADE_THRESHOLDS.S) return "S";
  if (t >= GRADE_THRESHOLDS.A) return "A";
  if (t >= GRADE_THRESHOLDS.B) return "B";
  if (t >= GRADE_THRESHOLDS.C) return "C";
  if (t >= GRADE_THRESHOLDS.D) return "D";
  if (t >= GRADE_THRESHOLDS.E) return "E";
  return "U";
}

export interface Outcome {
  t: number;
  /** Letter on T alone. */
  rawGrade: GradeLetter;
  /** Letter after applying the Final-exam floor and eligibility. */
  grade: GradeLetter;
  /** Why the grade was forced to U, if it was. */
  reason: string | null;
}

export function finalOutcome(inputs: ScoreInputs, f: number, finalEligibility: EligibilityStatus): Outcome {
  const t = computeT(inputs, f);
  const rawGrade = gradeForScore(t);
  let reason: string | null = null;
  if (finalEligibility === "ineligible") reason = "Not eligible for the Final (assignment average below 40, or no quiz attended).";
  else if (f < RULES.finalMinToPass) reason = `Final is below ${RULES.finalMinToPass} — automatic U regardless of T.`;
  return { t, rawGrade, grade: reason ? "U" : rawGrade, reason };
}

/* ------------------------------------------------------------------ */
/* Reverse optimisation                                                */
/* ------------------------------------------------------------------ */

/** Raw (unrounded) F needed to reach `targetT`: min(F1, F2). */
export function rawRequiredFinal(targetT: number, { q1, q2, bonus }: ScoreInputs): number {
  const f1 = (targetT - bonus - 0.3 * Math.max(q1, q2)) / 0.6;
  const f2 = (targetT - bonus - 0.25 * q1 - 0.3 * q2) / 0.45;
  return Math.min(f1, f2);
}

export function requiredFinalForScore(targetT: number, inputs: ScoreInputs): RequiredFinal {
  const raw = rawRequiredFinal(targetT, inputs);
  const floor = RULES.finalMinToPass;

  if (raw > 100 + EPS) {
    return { status: "impossible", score: null, label: "Mathematically Impossible", note: IMPOSSIBLE_NOTE };
  }
  if (raw <= floor + EPS) {
    return {
      status: "floor",
      score: floor,
      label: `${floor} - Final minimum`,
      note: `Your composite already clears this bar — the Final only needs the mandatory ${floor}/100.`,
    };
  }
  // Round UP so the displayed mark is always sufficient.
  const score = Math.min(100, Math.ceil(raw * 100 - EPS) / 100);
  return { status: "needed", score, label: score.toFixed(2) };
}

export function requiredFinalForGrade(letter: Exclude<GradeLetter, "U">, inputs: ScoreInputs): RequiredFinal {
  return requiredFinalForScore(GRADE_THRESHOLDS[letter], inputs);
}
