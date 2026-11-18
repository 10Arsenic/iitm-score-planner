import type { Eligibility, EligibilityStatus } from "@/lib/grading";
import { RULES } from "@/lib/rules";

const CHIP: Record<EligibilityStatus, { text: string; cls: string }> = {
  eligible: { text: "Met", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  ineligible: { text: "Not met", cls: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
  pending: { text: "Pending", cls: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
};

function Chip({ status }: { status: EligibilityStatus }) {
  const chip = CHIP[status];
  return <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[13px] font-semibold ${chip.cls}`}>{chip.text}</span>;
}

/** Final-exam entry rules: assignment average + attending at least one quiz. */
export default function EligibilityPanel({ assignments, quizzes }: { assignments: Eligibility; quizzes: EligibilityStatus }) {
  const b = RULES.finalEligibility;
  return (
    <section className="card p-5">
      <h3 className="text-[13px] font-medium uppercase tracking-wider text-zinc-400">To write the Final exam</h3>
      <ul className="mt-2 divide-y divide-zinc-800/80">
        <li className="flex items-center justify-between gap-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-zinc-200">Assignments</p>
            <p className="text-[13px] text-zinc-400">
              best {b.best} of first {b.ofFirst} weeks · avg <span className="tabular-nums text-zinc-300">{assignments.avg.toFixed(1)}</span> / need{" "}
              {assignments.min}
              {assignments.status === "pending" && <span> (best case {assignments.bestCase.toFixed(1)})</span>}
            </p>
          </div>
          <Chip status={assignments.status} />
        </li>
        <li className="flex items-center justify-between gap-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-zinc-200">Quizzes</p>
            <p className="text-[13px] text-zinc-400">attend at least one of the two quizzes</p>
          </div>
          <Chip status={quizzes} />
        </li>
      </ul>
      <p className="mt-2 text-[13px] text-zinc-400">
        You must also attend the in-person end-term exam to get a grade. We assume at least {RULES.finalMinToPass}/100 on the Final is needed to pass —
        confirm that in your course document.
      </p>
    </section>
  );
}
