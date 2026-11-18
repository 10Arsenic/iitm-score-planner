# IITM BS Score Planner

Reverse-calculates the Final Exam mark an IITM BS Data Science student needs for a target grade, with an Official Ledger vs What-If Playground, eligibility checks, a Quiz 1/Quiz 2 advisor and a Term GPA projector.

Unofficial student tool — not affiliated with IIT Madras.

## Run locally

```bash
npm install
npm run dev        # development, http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
```

Without Supabase keys the app runs in **demo mode**: sign-in is simulated and each student's data is stored in their own browser (localStorage). That mode is enough to launch publicly.

## Deploy (Vercel)

1. Push this folder to a GitHub repository.
2. On vercel.com → *Add New Project* → import the repository → *Deploy* (no settings needed; Next.js is detected automatically).
3. Optional: add a custom domain under *Project → Settings → Domains*.

Every push to the main branch redeploys automatically.

## Enabling real accounts later (Supabase)

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Enable the Google provider (Authentication → Providers) and add your site URL + `/dashboard` as a redirect URL.
3. In Vercel → *Settings → Environment Variables*, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`), then redeploy.

## Before going public — checklist

- [x] Grading formula (`lib/grading.ts`) and Final-exam eligibility (`lib/rules.ts`) match the course grading document: `T = max(0.6F + 0.3·max(Q1,Q2), 0.45F + 0.25·Q1 + 0.3·Q2) + bonus (≤ 5)`; best 5 of first 7 assignments ≥ 40 and at least one quiz attended.
- [ ] Still unconfirmed: the 40-mark minimum on the Final, grade points / equal credits for the term GPA projector, and whether other courses use a different formula.
- [ ] Replace `public/hero/poster.webp` with artwork you own or have permission to use (see `public/hero/README.txt`).
- [ ] Keep the "not affiliated with IIT Madras" disclaimer; don't use IITM logos.

## Where things live

| Path | What |
|---|---|
| `lib/rules.ts` | Programme rules (best-8-of-12, eligibility windows, Final floor) |
| `lib/grading.ts` | Score formula, reverse calculation, eligibility |
| `lib/cgpa.ts` | Term GPA projector (optimal grade mix) |
| `app/dashboard/simulator/[courseId]/page.tsx` | Course page: Official Ledger + Playground |
| `components/NightSky.tsx`, `components/HeroScene.tsx` | Landing-page sky and animated character |
| `supabase/schema.sql` | Database schema, RLS policies, sign-up trigger |
