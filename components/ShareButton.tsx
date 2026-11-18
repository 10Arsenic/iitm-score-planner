"use client";

import { useEffect, useState } from "react";

interface Props {
  /** The student's name as saved on their profile ("Student" = not set yet). */
  name: string;
  onNameChange: (name: string) => void;
  course: string;
  /** Final-exam mark needed, 0–100. */
  need: number;
  target: string;
}

/** Exact to 2 decimals (the planner rounds UP, so never show a lower, insufficient number). */
const fmt = (n: number) => n.toFixed(2).replace(/\.?0+$/, "");

function drawCard(name: string, course: string, need: number, target: string): HTMLCanvasElement {
  const W = 1080;
  const H = 1080;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;

  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b0b17");
  bg.addColorStop(1, "#1a1033");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, 620);
  glow.addColorStop(0, "rgba(139,92,246,0.45)");
  glow.addColorStop(1, "rgba(139,92,246,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  const font = (px: number, weight = 600) => `${weight} ${px}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
  g.textBaseline = "alphabetic";

  g.fillStyle = "#a1a1aa";
  g.font = font(34, 500);
  g.fillText("IITM BS · SCORE PLANNER", 80, 120);

  g.fillStyle = "#fafafa";
  g.font = font(76, 700);
  const who = name && name !== "Student" ? name : "My target";
  g.fillText(who.length > 22 ? `${who.slice(0, 21)}…` : who, 80, 270);

  g.fillStyle = "#c4b5fd";
  g.font = font(40, 500);
  const courseLine = course.length > 44 ? `${course.slice(0, 43)}…` : course;
  g.fillText(courseLine, 80, 335);

  g.fillStyle = need >= 85 ? "#fb923c" : need >= 60 ? "#fcd34d" : "#34d399";
  g.font = font(300, 800);
  g.fillText(fmt(need), 70, 690);

  g.fillStyle = "#e4e4e7";
  g.font = font(46, 500);
  g.fillText(`/ 100 needed in the Final exam`, 80, 770);
  g.fillText(`to get a grade ${target}`, 80, 835);

  g.fillStyle = "#71717a";
  g.font = font(28, 400);
  g.fillText("Unofficial estimate · not affiliated with IIT Madras", 80, 990);
  return c;
}

/** Name box + copy-text + share-as-image, so results go out with the student's name on them. */
export default function ShareButton({ name, onNameChange, course, need, target }: Props) {
  const [draft, setDraft] = useState(name === "Student" ? "" : name);
  const [state, setState] = useState<"idle" | "copied" | "saved" | "failed">("idle");

  useEffect(() => {
    setDraft(name === "Student" ? "" : name);
  }, [name]);

  const who = draft.trim();
  const text = `${who ? `${who} · ` : ""}${course}: I need ${fmt(need)}/100 in the Final to get ${target} (IITM BS Score Planner)`;

  function commitName() {
    const v = draft.trim();
    if (v && v !== name) onNameChange(v);
  }

  function flash(s: typeof state) {
    setState(s);
    setTimeout(() => setState("idle"), 2200);
  }

  async function copyText() {
    commitName();
    try {
      if (typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      flash("copied");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") flash("failed");
    }
  }

  async function shareImage() {
    commitName();
    try {
      const canvas = drawCard(who, course, need, target);
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("no image");
      const file = new File([blob], "my-iitm-target.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-iitm-target.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      flash("saved");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") flash("failed");
    }
  }

  return (
    <div className="card space-y-3 p-4">
      <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400" htmlFor="share-name">
        Your name on the share card
      </label>
      <input
        id="share-name"
        className="field"
        placeholder="e.g. Aarav K."
        maxLength={40}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitName}
      />
      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        <button type="button" className="btn-primary" onClick={shareImage}>
          {state === "saved" ? "Saved ✓" : "Share as image"}
        </button>
        <button type="button" className="btn-ghost" onClick={copyText}>
          {state === "copied" ? "Copied ✓" : "Copy text"}
        </button>
      </div>
      {state === "failed" && <p className="text-xs text-rose-300">Couldn&apos;t share from this browser — try a screenshot instead.</p>}
    </div>
  );
}
