"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CourseCard from "@/components/CourseCard";
import ExamCountdown from "@/components/ExamCountdown";
import FocusCard from "@/components/FocusCard";
import TermProjector from "@/components/TermProjector";
import { useRequireAuth } from "@/context/AppContext";
import { COURSE_CATALOG, LEVELS, type Level } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading, profileState, courseState } = useRequireAuth();
  const { profile, updateProfile } = profileState;
  const { courses, addCourse, removeCourse, loadSamples } = courseState;

  const [name, setName] = useState("");
  const [cgpa, setCgpa] = useState(8);
  const [pick, setPick] = useState("");
  const hydrated = useRef(false);

  // Seed local editable state once the profile arrives.
  useEffect(() => {
    if (profile && !hydrated.current) {
      hydrated.current = true;
      setName(profile.full_name);
      setCgpa(profile.target_cgpa);
    }
  }, [profile]);

  // Debounce slider writes so dragging doesn't spam the database.
  useEffect(() => {
    if (!profile || !hydrated.current || cgpa === profile.target_cgpa) return;
    const t = setTimeout(() => updateProfile({ target_cgpa: cgpa }), 600);
    return () => clearTimeout(t);
  }, [cgpa, profile, updateProfile]);

  const level: Level = profile?.academic_level ?? "foundational";
  const levelCourses = useMemo(() => courses.filter((c) => c.term_id === level), [courses, level]);
  const available = useMemo(
    () => COURSE_CATALOG[level].filter((n) => !levelCourses.some((c) => c.course_name === n)),
    [level, levelCourses],
  );

  if (loading || !user || !profile) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl animate-pulse px-4 py-8 sm:px-6" aria-busy>
        <div className="mb-8 h-9 w-56 rounded bg-zinc-900" />
        <div className="mb-6 h-44 rounded-2xl bg-zinc-900/70" />
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="h-80 rounded-2xl bg-zinc-900/70" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="h-56 rounded-2xl bg-zinc-900/70" />
            <div className="h-56 rounded-2xl bg-zinc-900/70" />
            <div className="h-56 rounded-2xl bg-zinc-900/70" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 sm:text-3xl">My courses</h1>
          <p className="mt-1 text-xs text-zinc-400">Saved on this device only — clearing browser data erases it.</p>
        </div>
        <Link href="/" className="btn-ghost">
          Home
        </Link>
      </header>

      {(profileState.error || courseState.error) && (
        <p role="alert" className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {profileState.error ?? courseState.error}
        </p>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_280px]">
        <FocusCard courses={levelCourses} />
        <ExamCountdown />
      </div>

      {levelCourses.some((c) => c.quiz_1 !== null || c.final_score !== null || c.current_gaa > 0 || c.weekly_scores.some((w) => w !== null)) ? (
        <TermProjector courses={levelCourses} />
      ) : levelCourses.length > 0 ? (
        <p className="card mb-6 p-5 text-sm text-zinc-400">
          Open a course and enter your marks — your Term GPA projection appears here once there&apos;s something to project.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* ---------- Left panel ---------- */}
        <aside className="card order-last h-fit space-y-7 p-6 lg:order-none">
          <section>
            <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Student
            </label>
            <input
              id="name"
              className="field mt-2 text-base font-semibold"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name.trim() && name.trim() !== profile.full_name && updateProfile({ full_name: name.trim() })}
            />
          </section>

          <section>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Academic level</p>
            <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Academic level">
              {LEVELS.map((l) => (
                <button
                  key={l.key}
                  role="radio"
                  aria-checked={level === l.key}
                  onClick={() => updateProfile({ academic_level: l.key })}
                  className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out hover:scale-[1.01] min-h-[44px] ${
                    level === l.key
                      ? "border-violet-500/60 bg-violet-500/15 text-violet-200"
                      : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between">
              <label htmlFor="cgpa" className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Target CGPA
              </label>
              <span className="text-3xl font-bold tabular-nums text-zinc-50">{cgpa.toFixed(2)}</span>
            </div>
            <input
              id="cgpa"
              type="range"
              min={4}
              max={10}
              step={0.05}
              value={cgpa}
              onChange={(e) => setCgpa(Number(e.target.value))}
              className="mt-3 w-full accent-violet-500"
            />
            <div className="mt-1 flex justify-between text-xs text-zinc-400">
              <span>4.00 (min)</span>
              <span>10.00 (max)</span>
            </div>
          </section>
        </aside>

        {/* ---------- Right grid ---------- */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-200">
              {LEVELS.find((l) => l.key === level)?.label} courses
              <span className="ml-2 text-sm font-normal text-zinc-400">{levelCourses.length} registered</span>
            </h2>
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!pick) return;
                await addCourse(pick, level);
                setPick("");
              }}
            >
              <select className="field w-auto max-w-[16rem]" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Course to add">
                <option value="">Add a course…</option>
                {available.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <button className={pick ? "btn-primary" : "btn-ghost"} disabled={!pick}>
                Add
              </button>
            </form>
          </div>

          {levelCourses.length === 0 ? (
            <div className="card flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-zinc-400">
              <p className="text-base font-medium text-zinc-200">Start by adding the courses you&apos;re taking this term.</p>
              <p>Use “Add a course…” above. Then open a course to see the Final Exam mark you need.</p>
              {courses.length === 0 && (
                <button className="btn-primary" onClick={loadSamples}>
                  Or try it with sample courses
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {levelCourses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  onRemove={() => {
                    if (window.confirm(`Remove ${c.course_name}? Your marks for it will be deleted.`)) removeCourse(c.id);
                  }}
                />
              ))}
            </div>
          )}
          {courses.length > 0 && (
            <div className="mt-8 text-right">
              <button
                className="text-xs text-zinc-400 underline underline-offset-4 hover:text-rose-300"
                onClick={() => {
                  if (window.confirm("Erase all your courses and marks from this device? This cannot be undone.")) {
                    try {
                      localStorage.clear();
                    } catch {
                      /* ignore */
                    }
                    window.location.reload();
                  }
                }}
              >
                Reset all my data
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
