# Event Management and Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan is executed natively in the authoring session; each task names its files, interfaces and verification commands, and the code lives in the repository rather than being duplicated here.

**Goal:** Officers manage club events from a private, MFA-protected `/admin` dashboard backed by Supabase, and every public event display reads from that database.

**Architecture:** Next.js 16 App Router on Vercel talks to Supabase (Postgres with RLS, Auth with TOTP MFA, private Storage) only from the server. Admin mutations are Server Actions that run as the signed-in officer so RLS and audit triggers see the actor; public pages read through the anonymous key so they are governed by the same policies as any anonymous API client. A `proxy.ts` adds a nonce-based Content Security Policy and refreshes sessions.

**Tech Stack:** Next.js 16.3.5, React 19.2, TypeScript, Tailwind v4, zod 4, `@supabase/supabase-js` 2.117.3, `@supabase/ssr` 0.12.7, `sharp`, `react-markdown` 10 + `remark-gfm` 4, Supabase CLI 2.98 (local stack, pgTAP), Playwright, `node:test` via tsx.

**Spec:** `docs/superpowers/specs/2026-10-14-event-admin-design.md`

## Global Constraints

- No Supabase credential or URL reaches the browser: env vars are `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (no `NEXT_PUBLIC_` prefix). The secret key is only read in `src/server/supabase/service.ts` and in `scripts/`.
- Every admin page, Server Action and admin Route Handler calls `requireAdmin()` / `requireAdminAction()`; owner-only work additionally checks `role === 'owner'`. Proxy redirects are convenience only.
- Every table in `public` has RLS enabled and explicit grants (new Supabase projects do not expose tables automatically).
- Times are entered in `America/New_York` (`branding.timezone`) and stored as `timestamptz`.
- Uploads: JPEG, PNG, WebP only, decoded by `sharp`, max 4 MB, 300 to 6000 px per side, re-encoded to WebP, random file name.
- Markdown is rendered with `react-markdown` without raw HTML; URL fields must be `https:`.
- Pinned dependency versions; lockfile committed.
- No Claude attribution lines in commits (standing project rule).

## Review Focus

1. A `datetime-local` value on the DST switch day (2026-03-08 02:30 does not exist; 2026-11-01 01:30 happens twice) must map to a definite instant and never throw → test in Task 2.
2. A JPEG whose extension says `.png`, an SVG renamed `.webp`, and a 10 MB PNG must all be rejected with a message, never stored → tests in Task 7.
3. Two officers editing the same event: the second save must fail with a conflict, not silently win → pgTAP version test in Task 3 and an action test in Task 8.
4. A revoked editor with a still-valid access token must get nothing from `/admin` and from the Data API → pgTAP test in Task 3 and integration test in Task 11.
5. An event whose `ends_at` passed one minute ago must appear in Past, not Upcoming, on the homepage, Events page and calendar → classification tests in Task 2 and integration test in Task 11.

---

### Task 1: Local stack, environment and dependencies

**Files:**
- Modify: `supabase/config.toml` (sign-ups off, TOTP on, `flyers` bucket, email templates)
- Create: `supabase/templates/invite.html`, `supabase/templates/recovery.html`
- Modify: `.env.example`, `.gitignore` (ignore `supabase/.temp`, `supabase/.branches`), `package.json` (scripts), `README.md`
- Modify: `.env.local` (local only, ignored) with the local Supabase URL and keys

**Interfaces:**
- Produces: env var names `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `APP_URL`.

- [ ] `supabase init`, edit config, `supabase start`, confirm `supabase status` shows API on 54321.
- [ ] `npm install --save-exact @supabase/supabase-js@2.117.3 @supabase/ssr@0.12.7 react-markdown@10.1.0 remark-gfm@4.0.1`.
- [ ] Add npm scripts: `db:start`, `db:stop`, `db:reset`, `test:db` (`supabase test db`), `test:integration`, `bootstrap:owner`, `migrate:legacy-events`, `backup:events`.
- [ ] Commit.

### Task 2: Pure domain modules with unit tests

**Files:**
- Create: `src/lib/events/time.ts`, `src/lib/events/time.test.ts`
- Create: `src/lib/events/schema.ts`, `src/lib/events/schema.test.ts`
- Create: `src/lib/events/urls.ts` (safe URL predicate + Markdown link scan), tests in `schema.test.ts`
- Create: `src/lib/events/public.ts`, `src/lib/events/public.test.ts` (classification, calendar grouping)
- Create: `src/lib/events/types.ts` (`EventCategory`, `EventStatus`, `PublicEvent`, `AdminEvent`, `EventRow`)

**Interfaces:**
- `zonedLocalToUtc(local: string, timeZone: string): Date` — `local` is `YYYY-MM-DDTHH:mm`; non-existent local times resolve forward, ambiguous ones to the first occurrence.
- `utcToZonedLocal(date: Date, timeZone: string): string` — inverse, for form prefill.
- `eventInputSchema` (zod) → `EventInput` with `startsAt`/`endsAt` as `Date`; errors keyed by field.
- `classifyEvent(event, now): 'upcoming' | 'now' | 'past'`; `splitPublicEvents(events, now)`; `calendarMonth(events, year, month, timeZone)`.
- `isSafeHttpsUrl(url: string): boolean`; `findUnsafeMarkdownLinks(markdown: string): string[]`.

- [ ] Write tests (DST cases, lengths, bad schemes, ends before starts, classification at boundaries, calendar grouping across month edges).
- [ ] Run `npx tsx --test src/lib/events/*.test.ts` → fail, implement, pass.
- [ ] Commit.

### Task 3: Database migration, policies and pgTAP tests

**Files:**
- Create: `supabase/migrations/20261014120000_events_admin.sql`
- Create: `supabase/tests/events_admin_test.sql`

**Interfaces:**
- Tables `public.events`, `public.admin_users`, `public.audit_log`; enums `event_category`, `event_status`, `admin_role`; functions `private.is_active_admin()`, `private.is_owner()`, `public.hit_rate_limit(text,int,int)`, `public.log_action(text, uuid, uuid, jsonb)` (service role only); storage bucket `flyers` policies.

- [ ] Write the pgTAP test file first (anon/aal1/aal2/editor/owner/revoked matrix, version increment, audit rows, last-owner guard, storage policies).
- [ ] Write the migration; `supabase db reset`; `supabase test db` → all pass.
- [ ] Commit.

### Task 4: Supabase client factories, auth guard, rate limiting

**Files:**
- Create: `src/server/supabase/env.ts`, `server.ts` (cookie client), `anon.ts`, `service.ts`
- Create: `src/server/auth/guard.ts`, `src/server/auth/rate-limit.ts`, `src/server/auth/request-ip.ts`
- Create: `src/proxy.ts` (CSP nonce + headers + session refresh + admin redirect)
- Modify: `next.config.ts` (remove static CSP-adjacent headers now set in proxy? keep X-headers; add `experimental.serverActions.bodySizeLimit: '4500kb'`, `authInterrupts: true`)

**Interfaces:**
- `getAdminContext(): Promise<AdminContext | null>` where `AdminContext = { userId, email, role, aal: 'aal1'|'aal2', hasFactor: boolean, supabase }`.
- `requireAdmin(opts?: { owner?: boolean }): Promise<AdminContext>` (redirects / forbidden()).
- `requireAdminAction(opts?): Promise<AdminContext>` throws `AuthError` the actions turn into `{ ok: false, error }`.
- `hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean>`.

- [ ] Implement; `npm run typecheck`.
- [ ] Commit.

### Task 5: Public site reads from the database

**Files:**
- Create: `src/server/events/queries.ts` (`listPublicEvents()`, `getPublicEvent(id)`, `listPublicEventsBetween(from, to)`), `src/server/events/mapping.ts` (`rowToPublicEvent`, `flyerUrl`)
- Modify: `src/components/site/event-board.tsx` to use `PublicEvent`
- Create: `src/components/site/event-calendar.tsx`, `src/components/site/upcoming-events.tsx`, `src/components/site/markdown.tsx`, `src/components/site/event-status-badge.tsx`
- Modify: `src/app/(public)/events/page.tsx`, `src/app/(public)/page.tsx`, `src/app/signal.css` (calendar + badge + recap styles)
- Create: `src/app/flyers/[eventId]/[file]/route.ts`
- Modify: `src/content/club/flyers.ts` → remove `CLUB_EVENTS`/`splitEvents`/`ClubEvent` (keep `NCL`), delete `flyers.test.ts`, update `package.json` test list
- Modify: `src/components/layout/site-footer.tsx` (Officer sign-in link)

- [ ] Implement; verify with local DB seeded via SQL (`supabase/seed.sql` kept empty in git; use a dev seed script instead) that `/`, `/events`, `/events?month=` render and `/flyers/...` streams.
- [ ] Commit.

### Task 6: Auth flows (sign in, MFA, invite acceptance, password)

**Files:**
- Create: `src/server/auth/actions.ts` (`signIn`, `signOut`, `startTotpEnrollment`, `verifyTotpEnrollment`, `verifyTotpChallenge`, `setPassword`, `requestPasswordReset`)
- Create: `src/app/auth/confirm/route.ts`
- Create: `src/app/admin/layout.tsx`, `src/app/admin/admin.css`, `src/app/admin/login/page.tsx`, `src/app/admin/mfa/page.tsx`, `src/app/admin/mfa/enroll/page.tsx`, `src/app/admin/welcome/page.tsx`, `src/app/admin/account/page.tsx`, `src/app/admin/account/password/page.tsx`, `src/app/admin/forbidden.tsx`, `src/app/admin/error.tsx`, `src/app/admin/loading.tsx`
- Create: `src/components/admin/*` (form field primitives, submit button, notice, admin shell)

**Interfaces:** every action returns `ActionResult = { ok: true; message?: string } | { ok: false; error: string; fields?: Record<string, string> }` or redirects.

- [ ] Implement; manual check against local Mailpit for the invite link.
- [ ] Commit.

### Task 7: Flyer upload pipeline with tests

**Files:**
- Create: `src/server/events/flyer.ts` (`processFlyer(buffer): Promise<{ webp: Buffer; width; height }>` throwing `FlyerError`), `src/server/events/flyer.test.ts` (crafted fixtures generated with sharp in the test)

- [ ] Tests: SVG rejected, HTML rejected, renamed executable rejected, oversized rejected, tiny rejected, PNG/JPEG/WebP accepted and re-encoded to WebP with metadata stripped and size capped at 1600 px.
- [ ] Commit.

### Task 8: Event Server Actions and admin event pages

**Files:**
- Create: `src/server/events/actions.ts` (`createEvent`, `updateEvent`, `setEventStatus`, `trashEvent`, `restoreEvent`, `purgeEvent`, `uploadFlyer`, `removeFlyer`), `src/server/events/admin-queries.ts`
- Create: `src/app/admin/page.tsx` (list with tabs), `src/app/admin/events/new/page.tsx`, `src/app/admin/events/[id]/page.tsx`, `src/app/admin/events/[id]/preview/page.tsx`
- Create: `src/components/admin/event-form.tsx`, `src/components/admin/flyer-panel.tsx`, `src/components/admin/event-actions.tsx`, `src/components/admin/event-table.tsx`

- [ ] Implement; conflict path returns `{ ok: false, error: 'conflict' }` message; all actions rate limited per user.
- [ ] Commit.

### Task 9: Admin management, audit log, account pages

**Files:**
- Create: `src/server/admins/actions.ts` (`inviteAdmin`, `changeAdminRole`, `revokeAdmin`, `reinstateAdmin`, `resetAdminMfa`), `src/server/admins/queries.ts`
- Create: `src/app/admin/admins/page.tsx`, `src/app/admin/audit/page.tsx`
- Create: `src/components/admin/admin-roster.tsx`, `src/components/admin/audit-table.tsx`

- [ ] Implement; owner-only guard on pages and actions; revoke bans + signs out via service role.
- [ ] Commit.

### Task 10: Scripts and documentation

**Files:**
- Create: `scripts/lib/env.ts`, `scripts/bootstrap-owner.ts`, `scripts/legacy-events.ts`, `scripts/migrate-legacy-events.ts`, `scripts/backup-events.ts`, `scripts/dev-seed.ts`
- Create: `docs/admin/DEPLOYMENT.md`, `docs/admin/SECURITY.md`, `docs/admin/BACKUP.md`, `docs/admin/FIRST-OWNER.md`
- Modify: `README.md`, `.env.example`

- [ ] Run bootstrap + legacy migration against the local stack; re-run migration to prove idempotency (no duplicates).
- [ ] Commit.

### Task 11: Integration tests over HTTP and end-to-end

**Files:**
- Create: `tests/integration/helpers.ts` (TOTP generator, user factory, sign-in), `tests/integration/access.test.ts`, `tests/integration/public-display.test.ts`
- Create: `e2e/events.spec.ts`, `e2e/admin.spec.ts`

- [ ] Run `npm run test:integration` with the local stack and `npm run build && npm run start -- -p 3001` for Playwright; record results honestly in the final report.
- [ ] Commit.

### Task 12: Verification sweep

- [ ] `npm run verify` (typecheck, lint, unit), `npm run test:db`, `npm run build`.
- [ ] Grep the production build output for the secret key name and value patterns (`sb_secret_`, `service_role`) to confirm nothing leaks into client bundles.
- [ ] `git status` clean apart from ignored files; final report lists manual settings and unfinished controls.
