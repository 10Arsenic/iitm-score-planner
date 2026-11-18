"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCourses } from "@/hooks/useCourses";

type AppState = ReturnType<typeof useAuth> & {
  profileState: ReturnType<typeof useProfile>;
  courseState: ReturnType<typeof useCourses>;
};

const AppContext = createContext<AppState | null>(null);

/** Single source of truth for auth, profile and course state across all three tiers. */
export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const profileState = useProfile(auth.user);
  const courseState = useCourses(auth.user);
  return <AppContext.Provider value={{ ...auth, profileState, courseState }}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

/** Client-side route guard for authenticated tiers. */
export function useRequireAuth() {
  const app = useApp();
  const router = useRouter();
  useEffect(() => {
    if (!app.loading && !app.user) router.replace("/");
  }, [app.loading, app.user, router]);
  return app;
}
