"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { DEMO_COURSES, DEMO_COURSES_KEY, DEMO_PROFILE, SAMPLE_COURSES, isDemo, load, save } from "@/lib/demo";
import type { CourseUpdate, Level, Profile, StudentCourse } from "@/lib/types";

const normalise = (row: Record<string, unknown>): StudentCourse =>
  ({
    ...row,
    current_gaa: Number(row.current_gaa),
    quiz_1: (row.quiz_1 as number | null) ?? null,
    quiz_2: (row.quiz_2 as number | null) ?? null,
    final_score: (row.final_score as number | null) ?? null,
    weekly_scores: (row.weekly_scores as (number | null)[] | null) ?? [],
    gaa_best_k: (row.gaa_best_k as number | null) ?? 8,
    bonus_marks: Number(row.bonus_marks ?? 0),
  }) as unknown as StudentCourse;

/** CRUD over the signed-in user's `student_courses` rows (RLS enforces ownership). */
export function useCourses(user: User | null) {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(false);
  /** True once the first load for the current user has finished (prevents a false "not found" flash). */
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCourses([]);
      setReady(false);
      return;
    }
    if (isDemo) {
      setCourses(load<StudentCourse[]>(DEMO_COURSES_KEY, DEMO_COURSES).map((c) => normalise(c as unknown as Record<string, unknown>)));
      setReady(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getSupabase()
      .from("student_courses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setCourses((data ?? []).map(normalise));
        setLoading(false);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  /** Applies a change and, in demo mode, persists it (never on load, so stale state can't overwrite saved data). */
  const mutate = useCallback((fn: (prev: StudentCourse[]) => StudentCourse[]) => {
    setCourses((prev) => {
      const next = fn(prev);
      if (isDemo) save(DEMO_COURSES_KEY, next);
      return next;
    });
  }, []);

  const addCourse = useCallback(
    async (courseName: string, level: Level) => {
      if (!user) return null;
      if (isDemo) {
        const row: StudentCourse = {
          id: Date.now(),
          user_id: user.id,
          course_name: courseName,
          term_id: level,
          current_gaa: 0,
          quiz_1: null,
          quiz_2: null,
          is_q2_skipped: false,
          final_score: null,
          target_grade_letter: "S",
          weekly_scores: [],
          gaa_best_k: 8,
          created_at: new Date().toISOString(),
        };
        mutate((c) => [...c, row]);
        return row;
      }
      const { data, error } = await getSupabase()
        .from("student_courses")
        .insert({ user_id: user.id, course_name: courseName, term_id: level })
        .select()
        .single();
      if (error) {
        setError(error.code === "23505" ? "That course is already on your dashboard." : error.message);
        return null;
      }
      const row = normalise(data);
      setCourses((c) => [...c, row]);
      return row;
    },
    [user, mutate],
  );

  const updateCourse = useCallback(
    async (id: number, patch: CourseUpdate) => {
      mutate((c) => c.map((x) => (x.id === id ? { ...x, ...patch } : x))); // optimistic
      if (isDemo) return true;
      const { error } = await getSupabase().from("student_courses").update(patch).eq("id", id);
      if (error) setError(error.message);
      return !error;
    },
    [mutate],
  );

  const removeCourse = useCallback(async (id: number) => {
    if (isDemo) {
      mutate((c) => c.filter((x) => x.id !== id));
      return;
    }
    const { error } = await getSupabase().from("student_courses").delete().eq("id", id);
    if (error) setError(error.message);
    else mutate((c) => c.filter((x) => x.id !== id));
  }, [mutate]);

  /** Guest mode only: fills an empty dashboard with example courses. */
  const loadSamples = useCallback(() => {
    if (!isDemo) return;
    mutate(() => SAMPLE_COURSES);
    save("demo_profile", { ...load<Profile>("demo_profile", DEMO_PROFILE), academic_level: "foundational" });
    window.location.reload(); // simplest way to make the profile hook pick up the level change
  }, [mutate]);

  return { courses, loading, ready, error, addCourse, updateCourse, removeCourse, loadSamples };
}
