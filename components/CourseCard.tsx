"use client";

import Link from "next/link";
import Ring from "@/components/Ring";
import { evaluate, scenarioFromCourse } from "@/lib/course";
import { optionsForCourse } from "@/lib/cgpa";
import { difficultyClass, difficultyWord } from "@/lib/ui";
import type { StudentCourse } from "@/lib/types";

const show = (v: number | null) => (v === null ? "—" : String(v));

export default function CourseCard({ course, onRemove }: { course: StudentCourse; onRemove: () => void }) {
  const ev = evaluate(scenarioFromCourse(course), course.current_gaa);
  const blocked = ev.finalEligibility.status === "ineligible";

  return (
    <article className="card flex flex-col p-5 transition-colors duration-200 [@media(hover:hover)]:hover:border-violet-500/40">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug text-zinc-100">{course.course_name}</h3>
        <button
          onClick={onRemove}
          aria-label={`Remove ${course.course_name}`}
          className="-mr-2 -mt-2 min-h-[44px] min-w-[44px] rounded-md p-2.5 text-zinc-400 transition-colors hover:text-rose-400"
        >
          ✕
        </button>
      </div>

      <dl className="grid grid-cols-4 gap-2 text-center">
        <Metric label="GAA" value={ev.anyWeekEntered ? ev.inputs.gaa.toFixed(1) : "—"} />
        <Metric label="Q1" value={show(course.quiz_1)} />
        <Metric label="Q2" value={course.is_q2_skipped ? "Skip" : show(course.quiz_2)} />
        <Metric label="Final" value={show(course.final_score)} />
      </dl>

      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-zinc-400">
        {ev.outcome ? (
          <p>
            Official grade: <span className="font-semibold text-zinc-100">{ev.outcome.grade}</span> · T {ev.outcome.t.toFixed(1)}
          </p>
        ) : blocked ? (
          <p className="font-medium text-rose-400">Not eligible for the Final</p>
        ) : course.quiz_1 === null && !ev.anyWeekEntered ? (
          <p>Open this course and add your marks to see what you need.</p>
        ) : (
          <>
            <div className="min-w-0">
              <p>Final needed for {course.target_grade_letter}</p>
              <span className={`mt-1 inline-block rounded-full border border-current/30 px-2 py-0.5 font-medium ${difficultyClass(ev.goal)}`}>
                {difficultyWord(ev.goal)}
              </span>
              {ev.goal.status === "impossible" && <p className="mt-1 text-xs text-zinc-400">Best possible: {optionsForCourse(course)[0].letter}</p>}
            </div>
            <Ring
              value={ev.goal.status === "impossible" ? 100 : ev.goal.score}
              tone={difficultyClass(ev.goal)}
              size={60}
              label={ev.goal.status === "impossible" ? "Out of reach" : `Need ${ev.goal.score} on the Final`}
            >
              <span className="text-base font-bold tabular-nums">
                {ev.goal.status === "impossible" ? "100+" : Math.ceil(ev.goal.score)}
              </span>
            </Ring>
          </>
        )}
      </div>

      <Link href={`/dashboard/simulator/${course.id}`} className="btn-primary mt-4 w-full">
        Open Course →
      </Link>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-1 py-2.5">
      <dt className="text-xs font-medium text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold tabular-nums text-zinc-100">{value}</dd>
    </div>
  );
}
