"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { DEMO_USER, GUEST_MODE, isDemo, load, save } from "@/lib/demo";

/** Tracks the Supabase session and exposes Google + phone-OTP sign-in helpers. */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      // Guest mode: everyone is "signed in" locally, no account needed.
      setUser(GUEST_MODE || load<boolean>("demo_signed_in", false) ? DEMO_USER : null);
      setLoading(false);
      return;
    }
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const demoSignIn = useCallback(() => {
    save("demo_signed_in", true);
    setUser(DEMO_USER);
    return null;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (isDemo) return demoSignIn();
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    return error?.message ?? null;
  }, [demoSignIn]);

  const requestOtp = useCallback(async (phoneE164: string) => {
    if (isDemo) return null; // demo: any 6-digit code verifies
    const { error } = await getSupabase().auth.signInWithOtp({ phone: phoneE164 });
    return error?.message ?? null;
  }, []);

  const verifyOtp = useCallback(
    async (phoneE164: string, token: string) => {
      if (isDemo) return demoSignIn();
      const { error } = await getSupabase().auth.verifyOtp({ phone: phoneE164, token, type: "sms" });
      return error?.message ?? null;
    },
    [demoSignIn],
  );

  const signOut = useCallback(async () => {
    if (isDemo) {
      save("demo_signed_in", false);
      setUser(null);
      return;
    }
    await getSupabase().auth.signOut();
  }, []);

  return { user, loading, signInWithGoogle, requestOtp, verifyOtp, signOut };
}
