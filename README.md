# IITM BS Score Planner

Free tool for IITM BS Data Science students: enter your marks, pick a target grade, and see the exact Final Exam mark you need.

Live: https://iitm-score-planner.vercel.app

Unofficial student tool — not affiliated with IIT Madras. Always check results against your official course grading document.

## What it does

- **Final mark calculator** — the Final Exam score needed for S/A/B/C/D, with "out of reach" and "needs a perfect Quiz 2" cases.
- **What-if simulator** — drag Quiz 2, Final and bonus sliders on a temporary copy; your saved marks are never changed.
- **Eligibility** — whether you can write the Final (assignments and quiz attendance).
- **Quiz 2 advisor** — what a Quiz 2 score of 60 / 80 / 100, or skipping it, does to the Final you need.
- **Term GPA projector** — the cheapest mix of grades across your courses that reaches a target term GPA.
- **Today's focus, exam countdown, grade rings** on the dashboard.
- **Share card** — add your name and share the result as an image or text.

## Grading rules used

Set in `lib/grading.ts` and `lib/rules.ts`, taken from the course grading document:

```
T = max(0.6·F + 0.3·max(Q1, Q2),  0.45·F + 0.25·Q1 + 0.3·Q2) + Bonus   (bonus ≤ 5)
```

- A quiz you did not attend counts as 0.
- To write the Final: average ≥ 40 on the best 5 of the first 7 weekly assignments, and attend at least one of the two quizzes.
- Weekly assignments do not add marks to T.
- Grade cut-offs on T: S ≥ 90, A ≥ 80, B ≥ 70, C ≥ 60, D ≥ 50, E ≥ 40.
- Assumed (not in the document): at least 40/100 on the Final to pass, and equal credits and S10/A9/B8/C7/D6/E4 grade points for the term GPA.

## Run locally

```bash
npm install
npm run dev        # development, http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # TypeScript check
```

## Accounts and data

Sign-in is switched off for now (`GUEST_MODE = true` in `lib/demo.ts`). Everyone goes straight to the planner and each student's data is stored in their own browser (localStorage), so clearing browser data erases it.

To bring accounts back later (Supabase):

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor. Also add a `bonus_marks numeric default 0` column to `student_courses` (the schema file does not have it yet).
2. Enable the Google provider (Authentication → Providers) and add your site URL + `/dashboard` as a redirect URL.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`) in your hosting settings.
4. Set `GUEST_MODE` to `false` in `lib/demo.ts` and redeploy.

## Deploy (Vercel)

The repository is connected to Vercel; every push to `main` redeploys automatically. No settings or environment variables are needed for guest mode.

## Checklist before sharing widely

- [ ] Confirm the 40-mark minimum on the Final, the term GPA grade points, and whether other courses use a different formula.
- [ ] Replace `public/hero/poster.webp` with artwork you own or have permission to use (see `public/hero/README.txt`).
- [ ] Keep the "not affiliated with IIT Madras" disclaimer; don't use IITM logos.

## Where things live

| Path | What |
|---|---|
| `lib/rules.ts` | Programme rules (eligibility window, bonus cap, Final minimum) |
| `lib/grading.ts` | Score formula, reverse calculation, eligibility maths |
| `lib/course.ts` | One course's marks → everything the screens show |
| `lib/cgpa.ts` | Term GPA projector (optimal grade mix) |
| `lib/demo.ts` | Guest-mode switch and local storage helpers |
| `app/dashboard/page.tsx` | Dashboard: focus card, countdown, course cards |
| `app/dashboard/simulator/[courseId]/page.tsx` | Course page: your marks, what-if simulator, share card |
| `components/ShareButton.tsx` | Name box and share-as-image / copy-text |
| `components/NightSky.tsx`, `components/HeroScene.tsx` | Landing-page sky and animated character |
| `supabase/schema.sql` | Database schema and policies (for when accounts return) |
