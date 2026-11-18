"use client";

import { useMemo } from "react";
import Link from "next/link";
import Ring from "@/components/Ring";
import { evaluate, scenarioFromCourse } from "@/lib/course";
import { GRADE_THRESHOLDS } from "@/lib/grading";
import type { StudentCourse } from "@/lib/types";

/** "Where should I spend today?" — the course whose target needs the highest Final, plus a quick term snapshot. */
export default function FocusCard({ courses }: { courses: StudentCourse[] }) {
  const rows = useMemo(
    () =>
      courses.map((c) => {
        const ev = evaluate(scenarioFromCourse(c), c.current_gaa);
        const hasData = c.quiz_1 !== null || c.quiz_2 !== null || ev.anyWeekEntered;
        const done = c.final_score !== null;
        const need = ev.goal.status === "impossible" ? 101 : ev.goal.score;
        return { c, ev, hasData, done, need };
      }),
    [courses],
  );

  const open = rows.filter((r) => r.hasData && !r.done && !r.ev.blocked);
  const focus = open.length ? open.reduce((a, b) => (b.need > a.need ? b : a)) : null;
  const easy = open.filter((r) => r.need < 60).length;
  const hard = open.filter((r) => r.need >= 85).length;
  const noData = rows.filter((r) => !r.hasData).length;

  return (
    <section className="card p-5" aria-label="Today's focus">
      <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-400">Today&apos;s focus</h2>

      {focus ? (
        <Link
          href={`/dashboard/simulator/${focus.c.id}`}
          className="mt-3 flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 transition-colors hover:border-violet-500/40"
        >
          <Ring
            value={focus.need > 100 ? 100 : focus.need}
            tone={focus.need > 100 ? "text-rose-400" : focus.need >= 85 ? "text-orange-400" : focus.need >= 60 ? "text-amber-300" : "text-emerald-400"}
            size={68}
            label="Final mark needed"
          >
            <span className="text-lg font-bold tabular-nums">{focus.need > 100 ? "100+" : Math.ceil(focus.need)}</span>
          </Ring>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-zinc-100">{focus.c.course_name}</span>
            <span className="block text-[13px] text-zinc-400">
              {focus.need > 100
                ? `${focus.c.target_grade_letter} (T ≥ ${GRADE_THRESHOLDS[focus.c.target_grade_letter]}) is out of reach as things stand — open it to see options`
                : `Hardest target right now: need ${focus.need.toFixed(focus.need % 1 ? 1 : 0)}/100 on the Final for ${focus.c.target_grade_letter}`}
            </span>
          </span>
        </Link>
      ) : (
        <p className="mt-3 text-sm text-zinc-400">
          {courses.length === 0
            ? "Add a course to see where to focus first."
            : noData > 0
              ? "Open a course and enter your assignment and quiz marks — your focus course shows up here."
              : "Every course is settled or locked. Nice work."}
        </p>
      )}

      {open.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2 text-xs">
          <li className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-emerald-300">{easy} comfortable</li>
          <li className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-amber-200">{open.length - easy - hard} demanding</li>
          <li className="rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-1 text-orange-300">{hard} very hard</li>
        </ul>
      )}
    </section>
  );
}
