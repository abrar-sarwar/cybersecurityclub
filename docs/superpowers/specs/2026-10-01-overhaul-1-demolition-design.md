# Overhaul 1 of 4: Demolition and skeleton

Date: 2026-10-01
Branch: `feat/overhaul`

## Context: the overhaul

The site keeps its current look and replaces its content with curated,
human-written material. Its job is to get students into the Discord and to
events. The target structure is five pages:

| Page | Contents |
| --- | --- |
| Home | Hero pointing at Discord and upcoming events; club information; upcoming events |
| Events | Upcoming events; monthly calendar; past events |
| Challenges & Competitions | Callout to apply to the competitive team; CyLabs and Hack The Box links or integration |
| Resources | Curated resources and Security+ study material; curated CTF tool list |
| Team | Exec board; competitive team |

**Content rule for the whole overhaul:** the club supplies all copy. Claude
builds typed content containers with visibly marked empty slots. No copy
written by Claude ships as final content.

The work is split into four sub-projects, each with its own spec and plan:

1. **Demolition and skeleton** (this spec)
2. Home and Events
3. Team
4. Challenges and Resources

## Goal

A small, working five-page site with nothing left of the careers section or
the database, ready for the content pages to be built on.

## Out of scope

- The homepage hero, its internship strip and `content/observatory.json`
  (sub-project 2)
- Any change to the Events or Team pages
- CSS pruning. Dead careers selectors in `signal.css` and `observatory.css`
  are removed in a cleanup pass after sub-project 4, when it is known which
  selectors the new pages reuse
- The uncommitted work carried onto the branch (events `[slug]` removal,
  flyers, home edits). It is committed separately, before this work starts,
  so the demolition diff is readable on its own

## 1. Delete the careers section and stories

Routes:

- `src/app/(public)/careers/**` (pages, layout)
- `src/app/(public)/stories/page.tsx`

Code and content:

- `src/components/careers/`, `src/components/learn/`
- `src/content/careers/`, `src/lib/careers/`
- `src/content/loaders.ts`, `src/content/schemas.ts`
- `src/server/services/content-links.ts`, `src/server/services/people.ts`
- `src/components/marketing/sections.tsx` (depends on the stories type) and
  `src/components/media/slot-image.tsx`, if nothing else imports them
- `content/paths/`, `content/certifications/`, `content/interview/`,
  `content/lab/`
- `e2e/careers.spec.ts`, `src/lib/careers/careers.test.ts`
- `scripts/content-check.ts`, if it only validates deleted content

Other components in `src/components/site/` and `src/components/marketing/`
that end up with no importer are deleted too. Each deletion is confirmed by
searching for importers first; anything still used by Home, Events or Team
stays.

## 2. Remove the database

After step 1, the only database reader is the root layout, which looks up a
favicon and a social preview image and already falls back when the lookup
fails. Team portraits are files; events are a TypeScript module.

Delete:

- `prisma/` (schema, migrations, `dev.db`)
- `src/server/db.ts`, `src/server/safe-db.ts`, `src/server/services/media.ts`
- `content/media-manifest.json`
- `supabase/`, if it holds only database config
- `src/server/env.ts` and the `sampleFilter` helper in
  `src/server/services/events.ts`, if nothing else uses them
- Dependencies `@prisma/client` and `prisma`

Change:

- `src/app/layout.tsx`: metadata uses the static icon files already in
  `src/app/` and the existing `opengraph-image.tsx`; no async lookup
- `config/branding.ts`: drop the `favicon.slot` and `socialPreview.slot`
  fields and the comment describing media slots
- `next.config.ts`: remove `@prisma/client` from `serverExternalPackages`
- `package.json`: `build` becomes `next build`; remove `postinstall`, every
  `db:*` script, the `prisma` block, and the `content:check` and `media:check`
  scripts (their script files are deleted or already missing); update `verify`
  and `test:unit` to match
- `.env.example` and `README.md`: remove database setup

The member portal remains recoverable from the `member-portal` branch and git
history.

## 3. Remove unused dependencies

Expected to become unused: `react-markdown`, `remark-gfm`, `gray-matter`,
`@tailwindcss/typography`. Each is removed only after a search confirms no
remaining import or CSS `@plugin` reference. `zod` stays (used by
`observatory.ts`).

## 4. Rewire navigation

- `nav-config.ts`: Challenges points to `/challenges`, Resources to
  `/resources`
- Header: the "Find My Path" action and `QuizLink` go. Join Discord is the
  single primary action
- Footer: remove any link to deleted routes
- `sitemap.ts`: a static list of `/`, `/events`, `/challenges`, `/resources`,
  `/team`, `/privacy`, `/accessibility`; drop `force-dynamic`
- No redirects for `/careers/**` or `/stories`; they return 404

## 5. Stub pages

`/challenges` and `/resources` each get a page with:

- metadata (title, canonical)
- the existing `PageHero`, with the nav label as the heading
- one block that reads plainly as unfinished, for example "Content pending",
  so it cannot be mistaken for final copy

These exist only so the nav has no dead links. Sub-project 4 replaces them.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run test:unit` pass
- `npm run build` succeeds with no database and no `DATABASE_URL` set
- `e2e/home.spec.ts` passes, updated only where it referenced removed links
- `/`, `/events`, `/challenges`, `/resources`, `/team` return 200
- `/careers`, `/careers/quiz`, `/stories` return 404
- A search of `src/`, `e2e/` and `config/` finds no reference to `careers`,
  `stories`, `prisma` or `quiz`, other than CSS left for the later cleanup

## Risks

- **Hidden imports.** A shared component may depend on a deleted module.
  Mitigation: typecheck after each deletion group, not once at the end.
- **Deployment config.** The host may run `prisma migrate deploy` or expect
  `DATABASE_URL`. Any build command or environment variable set on the host
  needs updating by the club when this merges; the spec cannot see it.
- **Homepage still reads `observatory.json`.** Left intact here on purpose;
  sub-project 2 decides its fate.
