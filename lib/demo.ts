import type { User } from "@supabase/supabase-js";
import type { Profile, StudentCourse } from "./types";

/**
 * Guest mode: sign-in is switched off for now, so every visitor goes straight to the planner and
 * their data stays in this browser's localStorage. Set to false (and add the Supabase keys) to
 * bring back Google / phone-OTP accounts — all of that code is still in place.
 */
export const GUEST_MODE = true;

/** Demo mode: guest mode, or no Supabase keys configured — data lives in this browser's localStorage. */
export const isDemo = GUEST_MODE || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Bump when the stored course shape changes so stale demo data is discarded. */
export const DEMO_COURSES_KEY = "demo_courses_v3";

export const DEMO_USER = { id: "demo-user", user_metadata: { full_name: "Student" } } as unknown as User;

/** A brand-new student starts with no courses. */
export const DEMO_COURSES: StudentCourse[] = [];

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — demo state just won't persist */
  }
}

export const DEMO_PROFILE: Profile = {
  id: DEMO_USER.id,
  full_name: "Student",
  academic_level: "foundational",
  target_cgpa: 8,
  updated_at: new Date().toISOString(),
};

const seed = (
  id: number,
  name: string,
  weekly: (number | null)[],
  q1: number | null,
  q2: number | null,
  final: number | null = null,
): StudentCourse => ({
  id,
  user_id: DEMO_USER.id,
  course_name: name,
  term_id: "foundational",
  current_gaa: 0,
  quiz_1: q1,
  quiz_2: q2,
  is_q2_skipped: false,
  final_score: final,
  target_grade_letter: "A",
  weekly_scores: [...weekly, ...Array(12 - weekly.length).fill(null)],
  gaa_best_k: 8,
  created_at: new Date().toISOString(),
});

/** Optional sample data a student can load from the empty dashboard to see how the planner works. */
export const SAMPLE_COURSES: StudentCourse[] = [
  seed(1, "Computational Thinking", [88, 92, 76, 85, 90, 70, 95, 82, 78], 72, null),
  seed(2, "Mathematics for Data Science I", [60, 45, 72, 55, 68, 50, 40, 65, 58], 48, null),
  seed(3, "Statistics for Data Science I", [95, 100, 90, 85, 98, 92, 88, 94, 96, 90, 85, 92], 91, 84, 80),
];
