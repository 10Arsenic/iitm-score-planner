"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { planTerm } from "@/lib/cgpa";
import type { StudentCourse } from "@/lib/types";

/** Term-wide GPA projector: one slider, minimum letter per course to reach it. */
export default function TermProjector({ courses }: { courses: StudentCourse[] }) {
  const [target, setTarget] = useState(9);
  const [showPlan, setShowPlan] = useState(false); // phones: summary first, plan on demand
  const plan = useMemo(() => planTerm(courses, target), [courses, target]);
  /** When the target is out of reach, the lowest-grade undecided course is what holds the term back. */
  const blocker = useMemo(() => {
    if (plan.feasible) return null;
    const open = plan.rows.filter((r) => !r.fixed);
    return open.length ? open.reduce((a, b) => (b.points < a.points ? b : a)) : null;
  }, [plan]);

  return (
    <section className="card mb-6 p-6" aria-label="Term GPA projector">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-400">Term GPA projector</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {courses.length} active course{courses.length === 1 ? "" : "s"} · cheapest grade mix that hits your target
          </p>
        </div>
        <div className="text-right">
          <label htmlFor="term-gpa" className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Target Term GPA
          </label>
          <p className="text-4xl font-bold tabular-nums text-zinc-50">{target.toFixed(1)}</p>
        </div>
      </div>

      <input
        id="term-gpa"
        type="range"
        min={4}
        max={10}
        step={0.1}
        value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
        className="mt-3 w-full accent-violet-500"
      />

      {courses.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">Add courses below to project your term.</p>
      ) : (
        <>
          {!plan.feasible && (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-200">
              {target.toFixed(1)} isn&apos;t reachable with your current marks — the best possible is <b>{plan.gpa.toFixed(2)}</b>.
              {blocker && (
                <>
                  {" "}
                  Biggest drag: <b>{blocker.name}</b> tops out at <b>{blocker.letter}</b>. Lifting it (Quiz 2, assignments) is the fastest way up.
                </>
              )}
            </p>
          )}
          <button className="btn-ghost mt-4 w-full sm:hidden" onClick={() => setShowPlan((s) => !s)} aria-expanded={showPlan}>
            {showPlan ? "Hide plan" : `Show plan · ${plan.rows.map((r) => r.letter).join(" ")}`}
          </button>
          <ul className={`mt-4 gap-2 sm:grid sm:grid-cols-2 xl:grid-cols-3 ${showPlan ? "grid" : "hidden"}`}>
            {plan.rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/simulator/${r.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 py-2.5 transition-colors hover:border-violet-500/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-zinc-200">{r.name}</span>
                    <span className="block text-xs text-zinc-400">
                      {r.fixed
                        ? r.finalNeeded === null
                          ? "Locked — not eligible for Final"
                          : `Final scored ${r.finalNeeded}`
                        : `Needs ${r.finalNeeded === null ? "—" : r.finalNeeded.toFixed(r.finalNeeded % 1 ? 2 : 0)} on the Final`}
                    </span>
                  </span>
                  <span className={`text-2xl font-bold ${r.letter === "U" ? "text-rose-400" : "text-violet-300"}`}>{r.letter}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-400">
            Plan GPA {plan.gpa.toFixed(2)} · assumes equal credits and S10 / A9 / B8 / C7 / D6 / E4 grade points · uses your official ledger.
          </p>
        </>
      )}
    </section>
  );
}
