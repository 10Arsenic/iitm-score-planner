import type { ReactNode } from "react";
import AnimatedNumber from "./AnimatedNumber";
import Icon, { type IconName } from "./Icon";
import type { RequiredFinal } from "@/lib/grading";
import { difficultyClass, difficultyWord } from "@/lib/ui";

interface Props {
  icon: IconName;
  title: ReactNode;
  result: RequiredFinal;
  /** Replaces the default "raise your Quiz 2" hint (e.g. when Quiz 2 is being skipped). */
  impossibleNote?: string;
  /** The generic pass requirement: a floor of 40 reads as a rule, not as "comfortable". */
  isPassCheck?: boolean;
  /** Out of reach as things stand, but possible with a perfect Quiz 2: shown as a conditional, not an error. */
  conditional?: { score: number; note: string };
  /** The student can't sit the Final at all (assignment average too low). */
  blocked?: boolean;
}

/** One reverse-calculated Final Exam requirement, coloured by how hard it is. */
export default function ResultCard({ icon, title, result, impossibleNote, isPassCheck, conditional, blocked }: Props) {
  const impossible = result.status === "impossible" && !conditional;
  return (
    <section
      aria-live="polite"
      className={`card relative overflow-hidden p-6 transition-colors duration-200 ${impossible ? "border-rose-500/40" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
        <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
      </div>

      {conditional ? (
        <>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-5xl font-bold tracking-tight text-amber-300">
              <AnimatedNumber value={conditional.score} decimals={conditional.score % 1 ? 2 : 0} />
            </span>
            <span className="text-sm text-zinc-400">/ 100 in Final</span>
            <span className="ml-auto rounded-full border border-current/30 px-2 py-0.5 text-[13px] font-medium text-amber-300">Needs a perfect Quiz 2</span>
          </div>
          <p className="mt-2 text-[13px] text-zinc-400">{conditional.note}</p>
        </>
      ) : result.status === "impossible" ? (
        <div className="mt-5 space-y-3">
          <span className="inline-block rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-sm font-semibold text-rose-300">
            {blocked ? "Not eligible for the Final" : "Mathematically Impossible"}
          </span>
          {!blocked && <p className="text-sm font-medium text-zinc-300">Even a perfect 100 on the Final isn&apos;t enough for this target.</p>}
          <p className="text-sm text-zinc-400">{impossibleNote ?? result.note}</p>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={`text-5xl font-bold tracking-tight ${difficultyClass(result)}`}>
              <AnimatedNumber value={result.score} decimals={result.score % 1 ? 2 : 0} />
            </span>
            <span className="text-sm text-zinc-400">{result.status === "floor" ? "/ 100 · mandatory minimum" : "/ 100 in Final"}</span>
            <span
              className={`ml-auto rounded-full border border-current/30 px-2 py-0.5 text-[13px] font-medium ${
                result.status === "floor" && isPassCheck ? "text-zinc-300" : difficultyClass(result)
              }`}
            >
              {difficultyWord(result, isPassCheck)}
            </span>
          </div>
          {result.status === "floor" && <p className="mt-2 text-[13px] text-zinc-400">{result.note}</p>}
        </>
      )}
    </section>
  );
}
