import Icon from "./Icon";
import { quizAdvice } from "@/lib/course";
import type { RequiredFinal, ScoreInputs, TargetLetter } from "@/lib/grading";
import { difficultyClass, withArticle } from "@/lib/ui";

interface Props {
  inputs: ScoreInputs;
  q1Taken: boolean;
  skipQ2: boolean;
  target: TargetLetter;
  /** Final score assumed when sizing the Quiz 2 target. */
  assumedFinal: number;
}

const fmt = (r: RequiredFinal) => (r.status === "impossible" ? "Not possible" : r.score.toFixed(r.score % 1 ? 2 : 0));

/** Contextual Quiz 1 vs Quiz 2 strategy guidance, plus a scannable comparison. */
export default function QuizAdvisor({ inputs, q1Taken, skipQ2, target, assumedFinal }: Props) {
  if (!q1Taken) {
    return (
      <Box>
        <p className="text-zinc-400">Enter your Quiz 1 score (or open the Playground) to get Quiz 2 strategy advice.</p>
      </Box>
    );
  }

  const { skip, q2Needed, sit } = quizAdvice(inputs, target, assumedFinal);
  const skipText =
    skip.status === "impossible" ? (
      <>
        Skipping Quiz 2 can&apos;t reach <b>{withArticle(target)}</b> — the Final would need to be over 100.{skipQ2 ? " Untick Skip to see whether sitting it helps." : ""}
      </>
    ) : (
      <>
        Your required score to maintain your goal ({target}) is <b className={difficultyClass(skip)}>{fmt(skip)}</b> on the Final.
      </>
    );

  // Quiz 2 is being skipped: advice is just the 60%-Final path, no "sit it" suggestions.
  if (skipQ2) {
    return (
      <Box>
        <p>
          <b>Quiz 2 skipped.</b> The Final now carries 60% of your score. {skipText}
        </p>
        <p className="mt-2 text-[13px] text-zinc-400">Untick “Skip Quiz 2” to compare against sitting it.</p>
      </Box>
    );
  }

  const q2Text =
    q2Needed === null ? (
      <>
        Even a perfect Quiz 2 won&apos;t reach <b>{withArticle(target)}</b> if the Final is {assumedFinal} — the Final has to carry more.
      </>
    ) : q2Needed === 0 ? (
      <>
        With a Final of {assumedFinal} you already reach <b>{target}</b> without Quiz 2 — sitting it is a bonus.
      </>
    ) : (
      <>
        Target a <b className="text-cyan-300">{q2Needed}</b> on Quiz 2 to maximize your composite recovery score <span className="text-zinc-400">(assuming {assumedFinal} on the Final)</span>.
      </>
    );

  const headline =
    inputs.q1 >= 85 ? (
      <>
        <b>You crushed Quiz 1.</b> Skipping Quiz 2 shifts your Final Exam weight to 60%. {skipText}
      </>
    ) : inputs.q1 < 60 ? (
      <>
        <b>Quiz 1 was rough.</b> Quiz 2 will take a 30% weight if you outperform Q1. {q2Text}
      </>
    ) : (
      <>
        <b>Quiz 1 is mid-range.</b> If you skip Quiz 2, the Final carries 60%. {skipText} Sitting it only pays off if you beat Quiz 1 — the table shows by how much.
      </>
    );
  const tone = inputs.q1 >= 85 ? "good" : inputs.q1 < 60 ? "warn" : undefined;

  return (
    <Box tone={tone}>
      <p>{headline}</p>
      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800/80 text-sm">
        <div className="grid grid-cols-2 bg-zinc-950/50 px-3 py-1.5 text-[13px] font-medium uppercase tracking-wider text-zinc-400">
          <span>If you…</span>
          <span className="text-right">Final for {target}</span>
        </div>
        <Row label="Skip Quiz 2" value={skip} />
        {sit.map(({ q2, req }) => (
          <Row key={q2} label={`Sit Quiz 2 · score ${q2}`} value={req} />
        ))}
      </div>
      <p className="mt-2 text-[13px] text-zinc-400">
        Colour = effort: <span className="text-amber-300">amber</span> demanding · <span className="text-orange-400">orange</span> very hard ·{" "}
        <span className="text-rose-400">red</span> not possible.
      </p>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: RequiredFinal }) {
  return (
    <div className="grid grid-cols-2 border-t border-zinc-800/80 px-3 py-2">
      <span className="text-zinc-300">{label}</span>
      <span className={`text-right font-semibold tabular-nums ${difficultyClass(value)}`}>{fmt(value)}</span>
    </div>
  );
}

function Box({ children, tone }: { children: React.ReactNode; tone?: "good" | "warn" }) {
  const cls = tone === "good" ? "border-emerald-500/30" : tone === "warn" ? "border-amber-500/30" : "";
  return (
    <section className={`card p-5 text-sm leading-relaxed text-zinc-300 ${cls}`} aria-live="polite">
      <h3 className="mb-2 flex items-center gap-2 text-[13px] font-medium uppercase tracking-wider text-zinc-400">
        <Icon name="compass" /> Quiz strategy advisor
      </h3>
      {children}
    </section>
  );
}
