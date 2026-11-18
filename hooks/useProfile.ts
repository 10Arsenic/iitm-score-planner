"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { DEMO_PROFILE, isDemo, load, save } from "@/lib/demo";

type ProfilePatch = Partial<Pick<Profile, "full_name" | "academic_level" | "target_cgpa">>;

/** Loads the signed-in user's profile and exposes an optimistic updater. */
export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    if (isDemo) {
      setProfile(load<Profile>("demo_profile", DEMO_PROFILE));
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (cancelled) return;
      if (error) setError(error.message);
      else if (data) setProfile({ ...data, target_cgpa: Number(data.target_cgpa) } as Profile);
      else {
        // Trigger may not have run (e.g. user predates schema) — create the row.
        const fallbackName =
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          "Student";
        const { data: created, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: user.id, full_name: fallbackName })
          .select()
          .single();
        if (insertError) setError(insertError.message);
        else setProfile({ ...created, target_cgpa: Number(created.target_cgpa) } as Profile);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!user) return;
      setProfile((p) => (p ? { ...p, ...patch } : p)); // optimistic
      if (isDemo) {
        save("demo_profile", { ...load<Profile>("demo_profile", DEMO_PROFILE), ...patch });
        return;
      }
      const { error } = await getSupabase().from("profiles").update(patch).eq("id", user.id);
      if (error) setError(error.message);
    },
    [user],
  );

  return { profile, loading, error, updateProfile };
}
