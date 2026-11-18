"use client";

import { useState, type FormEvent } from "react";
import { useApp } from "@/context/AppContext";

const PHONE_RE = /^[6-9]\d{9}$/;

export default function AuthCard() {
  const { signInWithGoogle, requestOtp, verifyOtp } = useApp();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const e164 = `+91${phone}`;

  const [googleBusy, setGoogleBusy] = useState(false);

  async function handleGoogle() {
    setError(null);
    setGoogleBusy(true);
    const err = await signInWithGoogle();
    if (err) {
      setError(err);
      setGoogleBusy(false);
    }
  }

  async function handleOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!PHONE_RE.test(phone)) return setError("Enter a valid 10-digit Indian mobile number.");
    setBusy(true);
    const err = otpSent ? await verifyOtp(e164, otp) : await requestOtp(e164);
    setBusy(false);
    if (err) return setError(err);
    if (!otpSent) setOtpSent(true); // on verify success the auth listener redirects
  }

  return (
    <div className="card w-full max-w-md p-8 shadow-2xl shadow-violet-950/20">
      <button type="button" onClick={handleGoogle} disabled={googleBusy} className="btn-light w-full py-3 text-base font-semibold">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.9a5.04 5.04 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.3z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.24 1.06-3.74 1.06-2.87 0-5.3-1.94-6.17-4.55H2.17v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.83 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.17a11 11 0 0 0 0 9.88l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.35c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.17 7.06l3.66 2.84C6.7 7.29 9.13 5.35 12 5.35z" />
        </svg>
        {googleBusy ? "Signing you in…" : "Continue with Google"}
      </button>

      <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-widest text-zinc-400">
        <span className="h-px flex-1 bg-zinc-800" />
        OR USE MOBILE OTP
        <span className="h-px flex-1 bg-zinc-800" />
      </div>

      <form onSubmit={handleOtp} className="space-y-3">
        <div className="flex gap-2">
          <span className="flex select-none items-center rounded-xl border border-zinc-800 bg-zinc-950/70 whitespace-nowrap px-3 text-sm font-medium text-zinc-300">
            +91
          </span>
          <input
            className="field"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            maxLength={10}
            value={phone}
            disabled={otpSent}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            aria-label="Mobile number"
          />
        </div>

        {otpSent && (
          <input
            className="field text-center text-lg tracking-[0.5em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="······"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            aria-label="One-time password"
            autoFocus
          />
        )}

        <button type="submit" className="btn-primary w-full" disabled={busy || (otpSent && otp.length < 6)}>
          {busy ? "Please wait…" : otpSent ? "Verify & Sign In" : "Request Secure OTP"}
        </button>

        {otpSent && (
          <button
            type="button"
            className="w-full text-xs text-zinc-400 transition-colors hover:text-zinc-300"
            onClick={() => {
              setOtpSent(false);
              setOtp("");
            }}
          >
            Wrong number? Start over
          </button>
        )}
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
