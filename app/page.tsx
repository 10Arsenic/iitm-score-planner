"use client";

import Link from "next/link";
import HeroScene from "@/components/HeroScene";
import NightSky from "@/components/NightSky";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-8 sm:py-12">
      {/* calm night: moon, Andromeda, stars, low mist */}
      <NightSky className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 sm:hidden"
        style={{ WebkitMaskImage: "linear-gradient(#000 70%, transparent)", maskImage: "linear-gradient(#000 70%, transparent)" }}
      >
        <NightSky layout="narrow" className="block w-full" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-6 sm:gap-10 lg:min-h-[calc(100vh-6rem)] lg:grid-cols-2">
        {/* sign-in first on every screen size */}
        <div className="flex flex-col items-start">
          <header className="mb-5 max-w-xl text-left sm:mb-8">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 sm:mb-4 sm:tracking-[0.25em]">IITM BS · Data Science &amp; Applications</p>
            <h1 className="gradient-text pb-1 text-balance text-4xl font-bold tracking-tight sm:text-7xl">Master Your Term.</h1>
            <p className="mt-3 text-balance text-sm text-zinc-300 sm:mt-5 sm:text-lg">
              Enter your scores, pick a target grade, and see the exact Final Exam mark you need — built for IITM Data Science students, from Foundational to BS.
            </p>
          </header>
          <Link href="/dashboard" className="btn-primary px-8 py-3 text-base font-semibold">
            Start planning — no sign-up
          </Link>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-300">
            {["Free", "No sign-up", "Runs in your browser", "Saved on your device"].map((t) => (
              <li key={t} className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1">
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-sm text-xs text-zinc-300">
            Unofficial student tool — not affiliated with IIT Madras. Always verify against your official grading document.
          </p>
        </div>

        {/* the swordswoman, standing in the night */}
        <HeroScene className="order-first mx-auto w-full max-w-[9.5rem] sm:max-w-[13rem] lg:order-none lg:max-w-[22rem]" />
      </div>
    </main>
  );
}
