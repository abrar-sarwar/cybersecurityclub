# Cybersecurity Club at GSU

The club website: home, events, challenges, resources and team. Built with Next.js (App Router). There is no database: events, the board and page content are files in `src/content/` and `content/`.

The site has **no accounts**. Nothing asks visitors to sign in, register, upload
a résumé, or give an email address. Club conversations happen on Discord, and
event RSVPs use each event's PIN link.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

In production, set `APP_URL` in the host's build environment: canonical links, the sitemap and social previews are fixed at build time and default to `http://localhost:3000`.

### Checks

| Command | What it runs |
| --- | --- |
| `npm run test:unit` | Homepage network logic and event date handling |
| `npm run verify` | Typecheck, lint and unit tests |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright against a running server (`PLAYWRIGHT_BASE_URL`, default `http://localhost:3001`) |

## Retired member portal

An earlier version had Supabase sign-in, member dashboards and a Prisma
database. That code, the schema and the migrations have been removed from this
repository; they remain in git history and on the `member-portal` branch.

Removing the schema here does not delete anything from a hosted database. If a
production database from that version still exists, it holds member records
and must be exported or deleted deliberately by the club. Requests about data
from the old accounts go to the privacy email listed on `/privacy`.
