import type { RequiredFinal } from "./grading";

/** Colour a required-Final number by how hard it is to actually score. */
export function difficultyClass(r: RequiredFinal): string {
  if (r.status === "impossible") return "text-rose-400";
  if (r.status === "floor") return "text-emerald-400";
  if (r.score < 60) return "text-emerald-400";
  if (r.score < 85) return "text-amber-300";
  return "text-orange-400";
}

/** "an S", "an A", "a B" … */
export function withArticle(letter: string): string {
  return `${letter === "S" || letter === "A" ? "an" : "a"} ${letter}`;
}

export function difficultyWord(r: RequiredFinal, isPassCheck = false): string {
  if (r.status === "impossible") return "Out of reach";
  if (r.status === "floor") return isPassCheck ? "Mandatory floor" : "Comfortable";
  if (r.score < 60) return "Comfortable";
  if (r.score < 85) return "Demanding";
  return "Very hard";
}
