"use client";

import { clamp } from "@/lib/grading";

interface Props {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  disabled?: boolean;
  hint?: string;
  /** Value hasn't been set/taken yet: show "—" and a dimmed slider until the user touches it. */
  unset?: boolean;
  /** Called when the number box is cleared, so "not taken" can be restored instead of snapping to 0. */
  onClear?: () => void;
}

/** Range slider + numeric input bound to the same clamped 0–100 value. */
export default function NumberSlider({ id, label, value, onChange, step, disabled, hint, unset, onClear }: Props) {
  const isInt = step >= 1;
  const commit = (raw: string) => {
    if (raw === "" && onClear) return onClear();
    const n = raw === "" ? 0 : Number(raw);
    onChange(isInt ? Math.round(clamp(n, 0, 100)) : Math.round(clamp(n, 0, 100) * 10) / 10);
  };

  return (
    <div className={disabled ? "opacity-70" : ""}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-zinc-300">
          {label}
          {hint && <span className="ml-2 text-xs font-normal text-zinc-400">{hint}</span>}
        </label>
        <input
          type="number"
          inputMode="decimal"
          enterKeyHint="done"
          aria-label={`${label} value`}
          className="field w-24 text-right tabular-nums"
          min={0}
          max={100}
          step={step}
          placeholder={disabled ? "Skipped" : "—"}
          value={unset || disabled ? "" : value}
          disabled={disabled}
          onChange={(e) => commit(e.target.value)}
        />
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => commit(e.target.value)}
        className={`w-full accent-violet-500 ${unset ? "opacity-50" : ""}`}
      />
    </div>
  );
}
