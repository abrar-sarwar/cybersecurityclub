# Cybersecurity Club at GSU

The club website: public pages (about, events, community, learning catalog) and
a career exploration guide with a twenty-question interest questionnaire. Built
with Next.js (App Router) and Prisma for the existing public content.

The site has **no accounts**. Nothing asks visitors to sign in, register, upload
a résumé, or give an email address. Club conversations happen on Discord, and
event RSVPs use each event's PIN link.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

### Checks

| Command | What it runs |
| --- | --- |
| `npm run test:unit` | Homepage network logic, questionnaire selection rules, scoring, and career content checks |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright against a running server (`PLAYWRIGHT_BASE_URL`, default `http://localhost:3001`) |

## Career exploration

Routes:

- `/careers`: introduction and every path, browsable without the questionnaire.
- `/careers/quiz`: twenty questions, one at a time. Up to two answers each, or
  "Not sure yet". `?question=N` opens a specific question (used by "Review My
  Answers" and "Revisit skipped questions").
- `/careers/results`: the strongest matches, built in the browser. Not indexed.
- `/careers/[slug]`: one page per path, with a starter project, walkthrough,
  publishing guidance, an example résumé bullet, and the portfolio write-up guide.

Answers stay in the visitor's own browser tab (`sessionStorage`, key
`cyber-careers-attempt`). They survive a refresh, are never sent to a server,
and are cleared by closing the tab or retaking the questionnaire.

Content and logic:

| File | Holds |
| --- | --- |
| `src/content/careers/questions.ts` | The twenty questions; each option maps to one path id |
| `src/content/careers/paths.ts` | The twelve paths: descriptions, terms, tasks, job titles, project, resources |
| `src/content/careers/portfolio.ts` | Portfolio guidance and the copyable write-up template |
| `src/lib/careers/answers.ts` | Selection rules (two-answer limit, "Not sure yet" exclusivity) |
| `src/lib/careers/scoring.ts` | Deterministic scoring and result states |
| `src/components/careers/` | Questionnaire, results, lists and the copy button |

Path ids (`soc`, `offensive`, `appsec`, `intel`, `ir`, `cloud`, `iam`, `grc`,
`forensics`, `hunting`, `network`, `malware`) are stable; change names and slugs
freely, but not ids.

Scoring:

- Each selected answer adds one point to its path. "Not sure yet" adds nothing.
- A path's score is its points divided by the number of options mapped to it
  across the questionnaire, counted from the question data. Editing questions
  updates the denominators automatically.
- Scores are compared exactly (as fractions). Results show the top three paths
  with points, plus any tied with third place (labeled "Equally matched").
  Paths with no points are never shown as matches.
- All "Not sure yet" shows an exploration state; a twelve-way tie shows a
  broad-interest state. Fewer than five questions with a specific answer are
  called early suggestions. That threshold is a product choice, not a validated
  measure.
- Results never show percentages or ratings.

When adding external resources, open each link, confirm it is the official page
or original dataset source, and prefer free material. `npm run test:unit` checks
that every path has complete content.

## Retired member portal

An earlier version had Supabase sign-in, student email verification, member
dashboards, officer tools and event emails, and older Prisma tables for accounts
and learning progress. All of that code, its routes and its packages are gone.

Stored data was left alone on purpose:

- `prisma/schema.prisma` still defines the account and progress models, so no
  migration drops existing records. Only the public member directory reads
  `MemberProfile` rows whose owners chose to be listed.
- `supabase/` keeps the portal's migrations and database tests as a record of
  that schema. Nothing in the site uses it. Do not run `supabase db reset` or
  push migrations against a project that holds real member records.

Requests about data from the old accounts go to the privacy email listed on
`/privacy`.
