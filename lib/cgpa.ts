import { GRADE_POINTS, requiredFinalForGrade, type GradeLetter } from "./grading";
import { evaluate, scenarioFromCourse } from "./course";
import type { StudentCourse } from "./types";

export interface CourseOption {
  letter: GradeLetter;
  points: number;
  /** Final-exam mark needed (or actually scored when `fixed`). null = n/a. */
  finalNeeded: number | null;
  /** Result is already decided (Final taken, or barred from the Final). */
  fixed?: boolean;
}

export interface PlanRow extends CourseOption {
  id: number;
  name: string;
}

export interface TermPlan {
  /** True when the target GPA is reachable. */
  feasible: boolean;
  rows: PlanRow[];
  /** GPA the returned plan achieves (equal credits). */
  gpa: number;
}

const LETTERS = ["S", "A", "B", "C", "D", "E"] as const;

/** All letters a course can still end on, with the Final mark each would need. */
export function optionsForCourse(c: StudentCourse): CourseOption[] {
  const ev = evaluate(scenarioFromCourse(c), c.current_gaa);

  if (c.final_score !== null && ev.outcome) {
    return [{ letter: ev.outcome.grade, points: GRADE_POINTS[ev.outcome.grade], finalNeeded: c.final_score, fixed: true }];
  }
  if (ev.finalEligibility.status === "ineligible") {
    return [{ letter: "U", points: 0, finalNeeded: null, fixed: true }];
  }

  const options: CourseOption[] = [];
  for (const letter of LETTERS) {
    const r = requiredFinalForGrade(letter, ev.inputs);
    if (r.status !== "impossible") options.push({ letter, points: GRADE_POINTS[letter], finalNeeded: r.score });
  }
  return options.length ? options : [{ letter: "U", points: 0, finalNeeded: null, fixed: true }];
}

/**
 * Picks one letter per course so the term GPA reaches `targetGpa` while
 * minimising the total Final-exam marks you must score (exact DP over grade
 * points). Assumes equal credits per course.
 */
export function planTerm(courses: StudentCourse[], targetGpa: number): TermPlan {
  const n = courses.length;
  if (n === 0) return { feasible: true, rows: [], gpa: 0 };

  type Cell = { cost: number; picks: CourseOption[] };
  let dp = new Map<number, Cell>([[0, { cost: 0, picks: [] }]]);

  for (const course of courses) {
    const next = new Map<number, Cell>();
    for (const [pts, cell] of dp) {
      for (const o of optionsForCourse(course)) {
        const total = pts + o.points;
        const cost = cell.cost + (o.finalNeeded ?? 0);
        const existing = next.get(total);
        if (!existing || cost < existing.cost) next.set(total, { cost, picks: [...cell.picks, o] });
      }
    }
    dp = next;
  }

  const need = Math.ceil(targetGpa * n - 1e-9);
  const reachable = [...dp.entries()].filter(([pts]) => pts >= need);
  let chosen: [number, Cell];
  let feasible = true;
  if (reachable.length) {
    chosen = reachable.reduce((best, cur) => (cur[1].cost < best[1].cost || (cur[1].cost === best[1].cost && cur[0] < best[0]) ? cur : best));
  } else {
    feasible = false;
    chosen = [...dp.entries()].reduce((best, cur) => (cur[0] > best[0] || (cur[0] === best[0] && cur[1].cost < best[1].cost) ? cur : best));
  }

  return {
    feasible,
    gpa: chosen[0] / n,
    rows: chosen[1].picks.map((o, i) => ({ ...o, id: courses[i].id, name: courses[i].course_name })),
  };
}
