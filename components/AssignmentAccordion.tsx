"use client";

import { useState } from "react";
import type { FieldMode } from "./ScoreField";
import { clamp, type GaaResult } from "@/lib/grading";
import { RULES } from "@/lib/rules";

interface Props {
  weekly: (number | null)[];
  onChange: (next: (number | null)[]) => void;
  mode: FieldMode;
  result: GaaResult;
  defaultOpen?: boolean;
}

/**
 * Weekly assignments. They no longer add marks to T; the best 5 of the first 7
 * decide eligibility for the Final. Weeks 8–12 are practice (Weeks 11–12 are examined in the Final).
 */
export default function AssignmentAccordion({ weekly, onChange, mode, result, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const setWeek = (i: number, v: number | null) => {
    const next = Array.from({ length: RULES.totalWeeks }, (_, j) => weekly[j] ?? null);
    next[i] = v === null ? null : Math.round(clamp(v, 0, 100) * 10) / 10;
    onChange(next);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-900/60"
      >
        <span className="text-sm font-medium text-zinc-200">
          Weekly assignments
          <span className="ml-2 block text-[13px] font-normal text-zinc-400 sm:inline">
            best {RULES.finalEligibility.best} of first {RULES.finalEligibility.ofFirst} decide if you can write the Final
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-sm text-zinc-400">
            GAA <span className="text-xl font-bold tabular-nums text-zinc-50">{result.gaa.toFixed(1)}</span>
          </span>
          <span className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
            ▾
          </span>
        </span>
      </button>

      {open && (
        <ul className="grid gap-2 border-t border-zinc-800/80 p-3 sm:grid-cols-2">
          {Array.from({ length: RULES.totalWeeks }, (_, i) => {
            const value = weekly[i] ?? null;
            const counted = result.counted.includes(i);
            const dropped = result.dropped.includes(i);
            return (
              <li
                key={i}
                className={`rounded-xl border px-3 py-2 transition-colors ${
                  dropped
                    ? "border-zinc-800 bg-zinc-950/30"
                    : counted
                      ? "border-violet-500/40 bg-violet-500/10"
                      : "border-zinc-800 bg-zinc-950/50"
                }`}
              >
                <div className="flex items-center justify-between text-[13px] font-medium">
                  <span className="text-zinc-400">Week {i + 1}</span>
                  {i >= RULES.finalEligibility.ofFirst ? (
                    <span className="text-zinc-400">{value === null ? "Practice" : "Not counted"}</span>
                  ) : dropped ? (
                    <span className="text-zinc-400">Not in best 5</span>
                  ) : counted ? (
                    <span className="text-violet-300">✓ Counted</span>
                  ) : (
                    <span className="text-zinc-400">Not set</span>
                  )}
                </div>

                {mode === "view" ? (
                  <p className={`mt-1 text-lg font-semibold tabular-nums ${dropped ? "text-zinc-400 line-through" : value === null ? "text-zinc-400" : "text-zinc-100"}`}>
                    {value ?? "—"}
                  </p>
                ) : mode === "edit" ? (
                  <input
                    type="number"
                    inputMode="decimal"
                    enterKeyHint="done"
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="—"
                    aria-label={`Week ${i + 1} score`}
                    value={value ?? ""}
                    onChange={(e) => {
                      if (e.target.value === "" && e.target.validity.badInput) return;
                      setWeek(i, e.target.value === "" ? null : Number(e.target.value));
                    }}
                    className={`mt-1 w-full bg-transparent text-lg font-semibold tabular-nums outline-none placeholder:text-zinc-400 ${dropped ? "text-zinc-400 line-through" : "text-zinc-100"}`}
                  />
                ) : (
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      aria-label={`Week ${i + 1} slider`}
                      value={value ?? 0}
                      onChange={(e) => setWeek(i, Number(e.target.value))}
                      className={`w-full accent-violet-500 ${value === null ? "opacity-50" : ""}`}
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      enterKeyHint="done"
                      min={0}
                      max={100}
                      step={1}
                      placeholder="—"
                      aria-label={`Week ${i + 1} score`}
                      value={value ?? ""}
                      onChange={(e) => {
                        if (e.target.value === "" && e.target.validity.badInput) return;
                        setWeek(i, e.target.value === "" ? null : Number(e.target.value));
                      }}
                      className={`w-16 rounded-md border border-zinc-800 bg-zinc-950/70 px-1.5 py-1 text-right text-sm font-semibold tabular-nums outline-none focus:border-violet-500 ${dropped ? "text-zinc-400 line-through" : "text-zinc-100"}`}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
