"use client";

import NumberSlider from "./NumberSlider";
import { clamp } from "@/lib/grading";

export type FieldMode = "view" | "edit" | "slider";

interface Props {
  id: string;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  mode: FieldMode;
  step?: number;
  disabled?: boolean;
  hint?: string;
  emptyText?: string;
}

/**
 * One score in three presentations:
 *  view   — locked read-out (Official Ledger)
 *  edit   — plain numeric entry for recording official marks
 *  slider — live range slider (Playground)
 */
export default function ScoreField({ id, label, value, onChange, mode, step = 1, disabled, hint, emptyText = "—" }: Props) {
  if (mode === "slider") {
    return (
      <NumberSlider
        id={id}
        label={label}
        hint={value === null && !disabled ? "not taken — drag to simulate" : hint}
        unset={value === null && !disabled}
        onClear={() => onChange(null)}
        value={value ?? 0}
        step={step}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (mode === "view") {
    return (
      <div className={`flex items-center justify-between gap-3 ${disabled ? "opacity-40" : ""}`}>
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <span className={`rounded-lg bg-zinc-950/60 px-3 py-1 text-sm font-semibold tabular-nums ${value === null ? "text-zinc-400" : "text-zinc-100"}`}>
          {disabled ? "Skipped" : value === null ? emptyText : value}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? "opacity-40" : ""}`}>
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        enterKeyHint="done"
        min={0}
        max={100}
        step={step}
        placeholder="—"
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => {
          if (e.target.value === "" && e.target.validity.badInput) return; // half-typed like "72." — don't wipe the field
          onChange(e.target.value === "" ? null : Math.round(clamp(Number(e.target.value), 0, 100)));
        }}
        className="field w-24 text-right tabular-nums"
      />
    </div>
  );
}
