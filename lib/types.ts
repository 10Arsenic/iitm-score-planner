import type { TargetLetter } from "./grading";

export type Level = "foundational" | "diploma" | "bsc" | "bs";

export interface Profile {
  id: string;
  full_name: string;
  academic_level: Level;
  target_cgpa: number;
  updated_at: string;
}

/**
 * One row = the OFFICIAL LEDGER for a course. null means "not released / not taken yet".
 * What-if experiments never touch these fields (see lib/course.ts Scenario).
 */
export interface StudentCourse {
  id: number;
  user_id: string;
  course_name: string;
  term_id: Level;
  current_gaa: number;
  quiz_1: number | null;
  quiz_2: number | null;
  is_q2_skipped: boolean;
  final_score: number | null;
  target_grade_letter: TargetLetter;
  /** Official weekly GA scores by week (12 slots); null = not entered. */
  weekly_scores: (number | null)[];
  gaa_best_k: number;
  /** Extra Activity bonus marks (0–5). Missing on older saved data = 0. */
  bonus_marks?: number | null;
  created_at: string;
}

export type CourseUpdate = Partial<
  Pick<
    StudentCourse,
    | "current_gaa"
    | "quiz_1"
    | "quiz_2"
    | "is_q2_skipped"
    | "final_score"
    | "target_grade_letter"
    | "weekly_scores"
    | "gaa_best_k"
    | "bonus_marks"
  >
>;

export const LEVELS: { key: Level; label: string }[] = [
  { key: "foundational", label: "Foundational" },
  { key: "diploma", label: "Diploma" },
  { key: "bsc", label: "BSc" },
  { key: "bs", label: "BS" },
];

/** Course suggestions offered by the "Add course" picker, per level. */
export const COURSE_CATALOG: Record<Level, string[]> = {
  foundational: [
    "Mathematics for Data Science I",
    "Statistics for Data Science I",
    "Computational Thinking",
    "English I",
    "Mathematics for Data Science II",
    "Statistics for Data Science II",
    "Programming in Python",
    "English II",
  ],
  diploma: [
    "Database Management Systems",
    "Programming, Data Structures and Algorithms using Python",
    "Business Data Management",
    "Machine Learning Foundations",
    "Machine Learning Techniques",
    "Machine Learning Practice",
    "Tools in Data Science",
    "System Commands",
  ],
  bsc: [
    "Software Engineering",
    "Software Testing",
    "Deep Learning",
    "Big Data and Biological Networks",
    "Linear Statistical Models",
    "Algorithmic Thinking in Bioinformatics",
  ],
  bs: [
    "Deep Learning and Generative AI",
    "Reinforcement Learning",
    "Large Language Models",
    "Advanced Algorithms",
    "Computer Vision",
    "Time Series Analysis",
  ],
};
