"use client";

import { useEffect, useState } from "react";

const KEY = "exam_date_v1";

function daysUntil(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

/** "Days to your end-term exams" — stored in this browser only. */
export default function ExamCountdown() {
  const [date, setDate] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDate(localStorage.getItem(KEY) ?? "");
    } catch {
      /* storage unavailable */
    }
    setReady(true);
  }, []);

  function update(v: string) {
    setDate(v);
    try {
      if (v) localStorage.setItem(KEY, v);
      else localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }

  const days = ready && date ? daysUntil(date) : null;
  const message =
    days === null
      ? "Set your first end-term exam date to start the countdown."
      : days < 0
        ? "Your exam date has passed — set the next one."
        : days === 0
          ? "Exam day. You've got this."
          : days <= 7
            ? "Final stretch — revise, don't start new topics."
            : days <= 30
              ? "Under a month — lock in your weak courses now."
              : "Plenty of runway — keep assignments on track.";

  return (
    <section className="card flex flex-col justify-between gap-3 p-5" aria-label="Exam countdown">
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-400">Exam countdown</h2>
        <p className="mt-2 flex items-baseline gap-2">
          <span className={`text-5xl font-bold tabular-nums ${days !== null && days >= 0 ? "text-zinc-50" : "text-zinc-600"}`}>
            {days !== null && days >= 0 ? days : "?"}
          </span>
          <span className="text-sm text-zinc-400">{days === 1 ? "day to go" : "days to go"}</span>
        </p>
        <p className="mt-1 text-[13px] text-zinc-300">{message}</p>
      </div>
      <label className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="shrink-0">Exam date</span>
        <input type="date" className="field py-1.5" value={date} onChange={(e) => update(e.target.value)} aria-label="Exam date" />
      </label>
    </section>
  );
}
