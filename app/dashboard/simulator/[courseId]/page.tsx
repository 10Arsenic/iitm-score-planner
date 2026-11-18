"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedNumber from "@/components/AnimatedNumber";
import AssignmentAccordion from "@/components/AssignmentAccordion";
import EligibilityPanel from "@/components/EligibilityPanel";
import Icon from "@/components/Icon";
import QuizAdvisor from "@/components/QuizAdvisor";
import ResultCard from "@/components/ResultCard";
import ScoreField, { type FieldMode } from "@/components/ScoreField";
import ShareButton from "@/components/ShareButton";
import { useRequireAuth } from "@/context/AppContext";
import { cloneForPlayground, evaluate, quizAdvice, scenarioFromCourse, type Scenario } from "@/lib/course";
import { GRADE_THRESHOLDS, TARGET_LETTERS, computeGaa, type TargetLetter } from "@/lib/grading";
import { RULES } from "@/lib/rules";
import { difficultyClass } from "@/lib/ui";

type Mode = "ledger" | "playground";

function Skeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl animate-pulse px-4 py-8 sm:px-6" aria-busy>
      <div className="h-4 w-28 rounded bg-zinc-900" />
      <div className="mb-6 mt-4 h-9 w-72 rounded bg-zinc-900" />
      <div className="mb-6 h-16 rounded-2xl bg-zinc-900" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 rounded-2xl bg-zinc-900/70" />
        <div className="h-96 rounded-2xl bg-zinc-900/70" />
      </div>
    </main>
  );
}

/** Extra Activity bonus: 0–5 marks added on top of T. */
function BonusField({ value, mode, onChange }: { value: number; mode: FieldMode; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor="bonus" className="text-sm font-medium text-zinc-300">
        Extra Activity bonus <span className="text-xs font-normal text-zinc-400">(max {RULES.maxBonus})</span>
      </label>
      {mode === "view" ? (
        <span className="rounded-lg bg-zinc-950/60 px-3 py-1 text-sm font-semibold tabular-nums text-zinc-100">{value}</span>
      ) : (
        <input
          id="bonus"
          type="number"
          inputMode="decimal"
          enterKeyHint="done"
          min={0}
          max={RULES.maxBonus}
          step={0.5}
          value={value}
          onChange={(e) => {
            if (e.target.value === "" && e.target.validity.badInput) return;
            const n = e.target.value === "" ? 0 : Number(e.target.value);
            onChange(Math.min(RULES.maxBonus, Math.max(0, Number.isFinite(n) ? n : 0)));
          }}
          className="field w-24 text-right tabular-nums"
        />
      )}
    </div>
  );
}

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, loading, courseState, profileState } = useRequireAuth();
  const course = courseState.courses.find((c) => c.id === Number(courseId));

  const [mode, setMode] = useState<Mode>("ledger");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Scenario | null>(null); // official-marks edit buffer
  const [pg, setPg] = useState<Scenario | null>(null); // independent playground clone
  const [saving, setSaving] = useState(false);
  // The phone answer bar only appears once the target card has scrolled out of view.
  const targetRef = useRef<HTMLDivElement>(null);
  const [targetVisible, setTargetVisible] = useState(true);
  useEffect(() => {
    const el = targetRef.current;
    if (!el) {
      setTargetVisible(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setTargetVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [mode, editing, courseState.ready]);

  const ledger = useMemo(() => (course ? scenarioFromCourse(course) : null), [course]);
  const active = mode === "playground" ? pg : editing ? draft : ledger;
  const ev = useMemo(() => (active ? evaluate(active, course?.current_gaa ?? 0) : null), [active, course]);

  if (loading || !user || !courseState.ready) return <Skeleton />;
  if (!course || !ledger || !active || !ev) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-zinc-400">
        <p>Course not found — it may have been removed, or this browser&apos;s saved data was cleared.</p>
        <Link href="/dashboard" className="btn-ghost">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const playground = mode === "playground";
  const fieldMode: FieldMode = playground ? "slider" : editing ? "edit" : "view";
  const patch = (p: Partial<Scenario>) => (playground ? setPg((s) => s && { ...s, ...p }) : setDraft((s) => s && { ...s, ...p }));
  const showProjection = playground || ev.outcome !== null;
  const showRequirements = playground || editing || ledger.final === null;

  const enterPlayground = () => {
    setEditing(false);
    setPg(cloneForPlayground(ledger));
    setMode("playground");
  };
  const exitPlayground = () => {
    setPg(null);
    setMode("ledger");
  };
  const setTarget = (t: TargetLetter) => {
    if (playground || editing) patch({ target: t });
    else courseState.updateCourse(course.id, { target_grade_letter: t }); // a preference, not a mark
  };

  async function saveLedger() {
    if (!draft || !course) return;
    setSaving(true);
    await courseState.updateCourse(course.id, {
      weekly_scores: draft.weekly,
      current_gaa: computeGaa(draft.weekly.slice(0, RULES.finalEligibility.ofFirst), RULES.finalEligibility.best).gaa,
      bonus_marks: draft.bonus,
      quiz_1: draft.q1,
      quiz_2: draft.q2, // kept even when skipped, so un-skipping later restores it (the maths zeroes it)
      is_q2_skipped: draft.skipQ2,
      final_score: draft.final,
      target_grade_letter: draft.target,
    });
    setSaving(false);
    setEditing(false);
  }

  const targetPicker = (
    <select
      value={active.target}
      onChange={(e) => setTarget(e.target.value as TargetLetter)}
      aria-label="Target grade"
      className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm font-semibold text-violet-300 outline-none focus:border-violet-500"
    >
      {TARGET_LETTERS.map((l) => (
        <option key={l} value={l}>
          {l} Grade (T ≥ {GRADE_THRESHOLDS[l]})
        </option>
      ))}
    </select>
  );

  const assumedFinal = active.final ?? RULES.defaultPlaygroundFinal;
  const goal = ev.goal;
  const gradeColor = ev.outcome?.grade === "U" ? "text-rose-400" : "text-zinc-50";

  // "Need X / 100 in Final for {target}" — shown in the sticky strip (desktop) and the bottom bar (phones).
  // With the current Quiz 2 the target may be out of reach, yet still possible if Quiz 2 were perfect.
  const perfectQ2 = !ev.blocked && !active.skipQ2 && goal.status === "impossible" ? quizAdvice(ev.inputs, active.target, assumedFinal).sit.find((s) => s.q2 === 100)?.req : undefined;
  const perfectQ2Final = perfectQ2 && perfectQ2.status !== "impossible" ? perfectQ2.score : null;
  // Left accent on the phone answer bar mirrors the difficulty colour of the number it shows.
  const barBorder =
    goal.status === "impossible"
      ? perfectQ2Final !== null
        ? "border-l-amber-400"
        : "border-l-rose-500"
      : goal.status === "floor" || goal.score < 60
        ? "border-l-emerald-400"
        : goal.score < 85
          ? "border-l-amber-300"
          : "border-l-orange-400";

  // Plain (non-animated) numbers here: a "need X" figure should snap the instant the target changes.
  const needBlock =
    goal.status === "impossible" ? (
      ev.blocked ? (
        <p className="truncate text-base font-semibold text-rose-400">Not eligible for the Final yet</p>
      ) : perfectQ2Final !== null ? (
        <p className="truncate text-base font-semibold text-amber-300">
          {active.target}: {perfectQ2Final.toFixed(perfectQ2Final % 1 ? 2 : 0)} on Final + 100 on Quiz 2
        </p>
      ) : (
        <p className="truncate text-base font-semibold text-rose-400">{active.target} isn&apos;t reachable — Final over 100</p>
      )
    ) : (
      <p className="truncate text-sm text-zinc-400">
        Need for {active.target}{" "}
        <span className={`text-2xl font-semibold tabular-nums ${difficultyClass(goal)}`}>{goal.score.toFixed(goal.score % 1 ? 2 : 0)}</span>
        <span className="text-sm"> / 100 in Final</span>
      </p>
    );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-32 pt-6 sm:px-6">
      <Link href="/dashboard" className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
        ← My courses
      </Link>
      <div className="mb-4 mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-50 sm:text-3xl">{course.course_name}</h1>
        {playground ? (
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setPg(cloneForPlayground({ ...ledger, target: pg?.target ?? ledger.target }))}>
              Reset to my marks
            </button>
            <button className="btn-primary" onClick={exitPlayground}>
              Exit What-if
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={enterPlayground}>
            <Icon name="bolt" /> What-if simulator
          </button>
        )}
      </div>

      {/* answer-first strip (desktop): the one number a student needs */}
      {/* Appears only once the target card has scrolled away, so it never duplicates what's on screen. */}
      {!targetVisible && (
        <div className="pointer-events-none fixed inset-x-0 top-2 z-30 hidden px-6 md:block">
          <div className="card pointer-events-auto mx-auto flex min-h-[3.75rem] max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 text-zinc-300 shadow-2xl shadow-black/40" aria-live="polite">
            {needBlock}
            {ev.outcome && (
              <p className="text-sm text-zinc-400">
                {playground ? `What-if: Final ${active.final} →` : "Official result"}{" "}
                <span className={`text-lg font-semibold ${gradeColor}`}>{ev.outcome.grade}</span>
                <span className="text-sm"> · T {ev.outcome.t.toFixed(2)}</span>
              </p>
            )}
            <p className="text-sm text-zinc-400">
              Pass needs <span className="font-semibold tabular-nums text-zinc-200">{ev.pass.status === "impossible" ? "—" : ev.pass.score}</span>
            </p>
          </div>
        </div>
      )}

      {/* phones: the answer follows you while you drag sliders */}
      {!targetVisible && (
        <div
          className={`fixed inset-x-4 bottom-2 z-30 flex items-center justify-between gap-3 rounded-2xl border border-l-4 border-zinc-800 bg-zinc-900/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl shadow-black/50 backdrop-blur md:hidden ${barBorder}`}
          aria-live="polite"
        >
          {needBlock}
          {ev.outcome && (
            <span className="shrink-0 text-right text-[13px] text-zinc-300">
              What-if: Final {active.final}
              <span className={`block text-2xl font-bold leading-tight ${gradeColor}`}>
                {ev.outcome.grade} <span className="text-sm font-normal text-zinc-300">T {ev.outcome.t.toFixed(1)}</span>
              </span>
            </span>
          )}
        </div>
      )}

      {/* mode banner */}
      <div
        className={`mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm ${
          playground ? "border-dashed border-violet-500/50 bg-violet-500/10 text-violet-200" : "border-zinc-800 bg-zinc-900/40 text-zinc-300"
        }`}
      >
        <span className="flex items-center gap-2">
          <Icon name={playground ? "flask" : editing ? "pencil" : "lock"} />
          {playground
            ? "What-if simulator — a temporary copy. Nothing here is saved."
            : editing
              ? "Editing your marks — enter your real scores."
              : "Your saved marks (locked). Tap “Edit my marks” to change them, or try the What-if simulator."}
        </span>
        {!playground &&
          (editing ? (
            <span className="flex gap-2">
              <button className="btn-ghost px-3 py-1" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn-primary px-3 py-1" onClick={saveLedger} disabled={saving}>
                {saving ? "Saving…" : "Save marks"}
              </button>
            </span>
          ) : (
            <button
              className="btn-ghost px-3 py-1.5"
              onClick={() => {
                setDraft(structuredClone(ledger));
                setEditing(true);
              }}
            >
              <Icon name="pencil" /> Edit my marks
            </button>
          ))}
      </div>

      {/*
        Two columns on desktop. On phones the wrappers dissolve (`contents`) so every
        block can be re-ordered: result → controls → weekly list → advice → eligibility.
      */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        {/* ---------- Marks ---------- */}
        <div className="contents lg:block lg:space-y-6">
          <div className="order-5 lg:order-none">
            <AssignmentAccordion
              key={`${mode}-${editing}`}
              weekly={active.weekly}
              onChange={(weekly) => patch({ weekly })}
              mode={fieldMode}
              result={ev.gaaResult}
              defaultOpen={editing}
            />
          </div>

          <section className={`card order-2 space-y-5 p-6 lg:order-none ${playground ? "border-dashed border-violet-500/40" : ""}`}>
            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-400">Quizzes &amp; end-term</h2>
            <ScoreField id="q1" label="Quiz 1 (Q1)" mode={fieldMode} value={active.q1} onChange={(q1) => patch({ q1 })} emptyText="Not taken" />
            <ScoreField
              id="q2"
              label="Quiz 2 (Q2)"
              mode={fieldMode}
              value={active.skipQ2 ? 0 : active.q2}
              disabled={active.skipQ2}
              onChange={(q2) => patch({ q2 })}
              emptyText="Not taken"
            />
            <label className={`flex min-h-6 items-center gap-2.5 text-sm text-zinc-300 ${fieldMode === "view" ? "opacity-60" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                className="h-4 w-4 accent-violet-500"
                disabled={fieldMode === "view"}
                checked={active.skipQ2}
                onChange={(e) => patch({ skipQ2: e.target.checked })} // q2 is left untouched so unticking restores it
              />
              Skip Quiz 2 / Absent
              {active.skipQ2 && <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-200">Skipped</span>}
            </label>
            <BonusField value={active.bonus} mode={fieldMode} onChange={(bonus) => patch({ bonus })} />
            <div className="border-t border-zinc-800/80 pt-5">
              <ScoreField
                id="final"
                label={playground ? "Final Exam (F) · what-if" : "Final Exam (F)"}
                mode={fieldMode}
                value={active.final}
                onChange={(final) => patch({ final })}
                emptyText="Not taken"
              />
            </div>
          </section>
        </div>

        {/* ---------- Analysis ---------- */}
        <div className="contents lg:block lg:space-y-4">
          {playground && !ev.outcome && (
            <div className="card order-3 hidden border-dashed border-violet-500/40 p-6 text-sm text-zinc-300 lg:order-none lg:block" aria-live="polite">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Icon name="target" className="h-4 w-4 text-zinc-400" /> What-if result
              </h3>
              <p className="mt-3 text-zinc-400">Drag the Final slider to project your grade. Nothing is assumed until you do.</p>
              <button className="btn-ghost mt-4" onClick={() => patch({ final: RULES.defaultPlaygroundFinal })}>
                Try a Final of {RULES.defaultPlaygroundFinal}
              </button>
            </div>
          )}

          {showProjection && ev.outcome && (
            <div className="card order-3 p-6 lg:order-none" aria-live="polite">
              <div className="flex items-start justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Icon name={playground ? "target" : "flag"} className="h-4 w-4 text-zinc-400" />
                  {playground ? `What-if: Final ${active.final} → grade` : "Official result"}
                </h3>
                <span className={`rounded-lg bg-zinc-950/70 px-3 py-1 text-xl font-bold ${gradeColor}`}>{ev.outcome.grade}</span>
              </div>
              <p className="mt-4 text-5xl font-bold tracking-tight text-zinc-50">
                <AnimatedNumber value={ev.outcome.t} />
                <span className="ml-2 text-sm font-normal text-zinc-400">/ 100 total (T)</span>
              </p>
              {ev.outcome.reason && (
                <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {ev.outcome.reason}
                  {ev.outcome.rawGrade !== "U" && ` (T alone would give ${ev.outcome.rawGrade}.)`}
                </p>
              )}
            </div>
          )}

          {showRequirements && (
            <>
              <div ref={targetRef} className="order-1 lg:order-none">
                <ResultCard
                  icon="bolt"
                  blocked={ev.blocked}
                  result={goal}
                  conditional={
                    perfectQ2Final !== null
                      ? { score: perfectQ2Final, note: "With your current Quiz 2 this target is out of reach. Score 100 on Quiz 2 and this is the Final you'd need." }
                      : undefined
                  }
                  impossibleNote={
                    active.skipQ2
                      ? "Quiz 2 is skipped, so only assignments and the Final count. Untick Skip Quiz 2 or lift your assignment scores to bring this within reach."
                      : undefined
                  }
                  title={<span className="flex flex-wrap items-center gap-2">Minimum for Target {targetPicker}</span>}
                />
              </div>
              {!ev.blocked && goal.status !== "impossible" && (
                <div className="order-1 lg:order-none">
                  <ShareButton
                    name={profileState.profile?.full_name ?? "Student"}
                    onNameChange={(n) => profileState.updateProfile({ full_name: n })}
                    course={course.course_name}
                    need={goal.score}
                    target={active.target}
                  />
                </div>
              )}
              <div className="order-4 lg:order-none">
                <ResultCard icon="shield" isPassCheck blocked={ev.blocked} result={ev.pass} title="Minimum to PASS (E Grade - T ≥ 40, Final ≥ 40)" />
              </div>
            </>
          )}

          {!ev.blocked && (
            <div className="order-6 lg:order-none">
              <QuizAdvisor inputs={ev.inputs} q1Taken={active.q1 !== null} skipQ2={active.skipQ2} target={active.target} assumedFinal={assumedFinal} />
            </div>
          )}
          <div className="order-7 lg:order-none">
            <EligibilityPanel assignments={ev.assignmentEligibility} quizzes={ev.quizAttendance} />
          </div>

          <p className="order-8 px-1 text-xs text-zinc-400 lg:order-none">
            Estimate based on the IITM grading formula — always confirm with your official grading document. T = your total course score out of 100.
            Weekly assignments only decide whether you can write the Final.
          </p>

          <details className="order-8 px-1 text-xs leading-relaxed text-zinc-400 lg:order-none">
            <summary className="cursor-pointer select-none hover:text-zinc-200">How is this worked out?</summary>
            <p className="mt-2">
              T = max(0.6·F + 0.3·max(Q1,Q2), 0.45·F + 0.25·Q1 + 0.3·Q2) + bonus (Extra Activity, at most {RULES.maxBonus}). A quiz you didn&apos;t attend
              counts as 0. Required Final = the smaller of the two branch solutions, never below {RULES.finalMinToPass}. Content from Weeks 11 and 12 is
              examined in the Final, so practise those assignments even though they don&apos;t add marks.
            </p>
          </details>
        </div>
      </div>
    </main>
  );
}
