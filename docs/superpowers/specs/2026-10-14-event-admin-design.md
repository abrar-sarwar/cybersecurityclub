# Event management backend and admin dashboard

Date: 2026-10-14
Branch: `feat/overhaul`
Status: design decided by Claude from the written brief; the club can correct
any decision here before or after the first deployment.

## Goal

Officers create, preview, edit, publish, unpublish, cancel, delete and restore
events from a private `/admin` dashboard. One database feeds the homepage's
upcoming events, the Events page (upcoming, monthly calendar, past) and the
flyer images. Only published content is public. The system is secured with
established authentication, server-side authorization on every request,
database and storage policies that mirror the application rules, an
editor-proof audit log, soft deletion, conflict detection and security headers.

## Decisions and why

| Decision | Choice | Why |
| --- | --- | --- |
| Database, auth, storage | Supabase (Postgres, Auth, Storage) | One provider covers all three. Row Level Security (RLS) and Storage policies give the "equivalent database and storage access policies" the brief requires, so a direct request to the Data API or Storage API is governed by the same rules as the app. The club used Supabase for the retired member portal, so the CLI, the local stack and the patterns are already familiar. |
| Server integration | `@supabase/ssr` with cookie sessions, all Supabase calls server-side | No Supabase credential ships to the browser. Server Components, Server Actions and Route Handlers run as the signed-in officer, so RLS and audit triggers see the real actor. |
| Multi-factor authentication | Supabase TOTP MFA (authenticator app), enforced as `aal2` server-side and inside RLS | TOTP MFA is generally available and enforceable in policies through the `aal` claim. Supabase passkeys are experimental (beta, opt-in, API may change) and are a passwordless first factor rather than a second factor, so they are not used. Owners can reset a locked-out officer's factors. |
| Roles | `owner` and `editor` in `public.admin_users` | Roles live in a table the server and policies read on every request, never in a client-supplied claim or user-editable metadata, so revoking a row takes effect immediately for existing sessions. |
| Registration | Disabled in Supabase Auth; owners invite officers by email | No public sign-up, no "create first admin" endpoint. The first owner is provisioned by a one-off script run by the deployer with the Supabase secret key. |
| Mutations | Next.js Server Actions | Built-in same-origin check (CSRF), typed input, pending states with `useActionState`. Each action re-checks the session, the admin row and `aal2` itself. |
| Public rendering | Dynamic per request through the anonymous (publishable) key | Published events and flyers appear without a deployment. The public site reads through the same RLS as any anonymous API client. Dynamic rendering also lets CSP nonces work. |
| Flyer uploads | Server Action, 4 MB limit, decoded and re-encoded with `sharp` to WebP, stored under a random name in a private bucket | Content is checked by decoding, not by extension or declared type. SVG, HTML and disguised files are rejected because they do not decode as JPEG, PNG or WebP. Re-encoding strips metadata and embedded payloads. The 4 MB limit stays under Vercel's 4.5 MB request body limit. |
| Flyer serving | App route `/flyers/[eventId]/[file]` | Published flyers stream through the anonymous storage client (policy-checked). Draft flyers are only served to an authenticated admin. Nothing in the bucket is public by default. |
| Description and recap | Markdown, rendered with `react-markdown` without raw HTML | No HTML is ever rendered from stored text, which removes stored XSS. Link schemes other than `https`, `http`, `mailto` are stripped by the renderer and also rejected on save. |
| Rate limiting | Fixed-window counters in Postgres (`hit_rate_limit` RPC, service role only) | Works on Vercel without another service. Supabase Auth also rate-limits sign-in and token endpoints. Vercel WAF rate limiting is recommended on top (manual). |
| Audit log | `public.audit_log`, written by database triggers and a service-role RPC | Officers have no INSERT, UPDATE or DELETE grant on the table, so editors cannot alter it. |
| Conflicts | `version` column, incremented by a trigger; updates filter on the expected version | A stale form cannot overwrite a newer save; the officer is told to reload. |
| Deletion | Soft delete (`deleted_at`) with a Trash view; permanent deletion owner-only | Recoverable by design. Backups documented alongside. |

## Architecture

```
Browser ── (cookies, HTTPS) ──> Next.js 16 on Vercel
                                 ├─ proxy.ts: CSP nonce + security headers, Supabase session refresh for /admin and /auth
                                 ├─ (public) pages: anon Supabase client → RLS shows published rows only
                                 ├─ /flyers/[id]/[file]: streams from private bucket (anon client for published, user client for drafts)
                                 ├─ (admin) pages + Server Actions: user Supabase client (RLS, triggers see auth.uid())
                                 └─ service-role client (server only): invites, bans, MFA reset, rate limits, bootstrap/migration scripts
Supabase
  ├─ Auth: email + password, TOTP MFA, sign-ups disabled, invite emails
  ├─ Postgres: public.events, public.admin_users, public.audit_log, private.* helpers, RLS, triggers, pgTAP tests
  └─ Storage: bucket "flyers" (private), policies on storage.objects
```

### Code layout

```
src/proxy.ts                               CSP + security headers + session refresh
src/server/supabase/{server,anon,service}.ts   client factories (server-only)
src/server/auth/guard.ts                   getAdminContext, requireAdmin, requireAdminAction
src/server/auth/rate-limit.ts              hit_rate_limit wrapper
src/server/events/{queries,mapping}.ts     public reads and row → view model
src/server/events/actions.ts               Server Actions for events (create, update, publish, unpublish, cancel, delete, restore, purge, flyer upload/remove)
src/server/admins/actions.ts               Server Actions for admin management (owner only)
src/server/auth/actions.ts                 sign in, MFA challenge/enroll/verify, sign out, password
src/lib/events/{schema,time,urls,markdown}.ts  zod schemas, New York time conversion, URL rules (shared, pure)
src/lib/events/public.ts                   upcoming/past/now classification, calendar grouping (pure)
src/components/site/event-board.tsx        public event UI, now fed by the database view model
src/components/site/event-calendar.tsx     monthly calendar grid
src/components/site/upcoming-events.tsx    homepage section
src/components/site/markdown.tsx           safe Markdown renderer
src/app/(public)/events/page.tsx           upcoming + calendar + past
src/app/(public)/page.tsx                  adds <UpcomingEvents />
src/app/flyers/[eventId]/[file]/route.ts   flyer streaming
src/app/auth/confirm/route.ts              invite and recovery links (token_hash)
src/app/admin/**                           dashboard (own layout, noindex)
supabase/config.toml, migrations/, tests/  schema, policies, pgTAP tests
scripts/bootstrap-owner.ts                 first owner provisioning
scripts/migrate-legacy-events.ts           hardcoded events → database, idempotent
scripts/backup-events.ts                   export rows + flyers
docs/admin/{DEPLOYMENT.md,SECURITY.md,BACKUP.md}
```

## Data model

Schema `public` (exposed through the Data API with explicit grants) and schema
`private` (helpers, never exposed).

### `public.events`

| Column | Type | Rules |
| --- | --- | --- |
| id | uuid pk | generated |
| title | text | 3 to 120 characters |
| description | text | Markdown, up to 5000 characters, default '' |
| category | enum `event_category` | workshop, speaker, career, competition, general_meeting, other |
| status | enum `event_status` | draft, published, canceled |
| starts_at, ends_at | timestamptz | ends_at > starts_at; entered in America/New_York, stored as instants |
| all_day | boolean | when true, times are not shown |
| location | text | 1 to 200 characters |
| directions_url | text null | https URL, max 500 |
| registration_url | text null | https URL (PIN), max 500 |
| flyer_path, flyer_alt, flyer_width, flyer_height | text/text/int/int null | all set together; alt up to 300 characters |
| recap | text null | Markdown, up to 5000 |
| slides_url, recording_url, materials_url | text null | https URLs |
| version | int | starts at 1, incremented by trigger on every update |
| created_at, updated_at, published_at, deleted_at | timestamptz | published_at set on first publish; deleted_at marks Trash |
| created_by, updated_by, deleted_by | uuid null | auth.users; set by trigger from auth.uid() |
| legacy_key | text unique null | idempotency key for the migration of hardcoded events |

Indexes: `(status, starts_at)` for public lists, `(deleted_at)` partial for Trash, unique `legacy_key`.

### `public.admin_users`

| Column | Type | Rules |
| --- | --- | --- |
| user_id | uuid pk → auth.users | |
| email | text unique | lowercase |
| display_name | text null | |
| role | enum `admin_role` | owner, editor |
| revoked_at | timestamptz null | set means revoked |
| created_at, created_by, updated_at | | |

A trigger refuses an update or delete that would leave zero active owners.

### `public.audit_log`

| Column | Type |
| --- | --- |
| id | bigint identity |
| at | timestamptz default now() |
| actor_id | uuid null (null = system/script) |
| actor_email | text null |
| action | text (`event.created`, `event.updated`, `event.published`, `event.unpublished`, `event.canceled`, `event.trashed`, `event.restored`, `event.purged`, `event.flyer_uploaded`, `event.flyer_removed`, `admin.invited`, `admin.role_changed`, `admin.revoked`, `admin.reinstated`, `admin.mfa_reset`, `auth.signed_in`, `auth.sign_in_failed`, `auth.mfa_enrolled`, `auth.signed_out`) |
| event_id | uuid null |
| target_user_id | uuid null |
| details | jsonb (changed column names, previous and new status; never secrets) |

### `private.rate_limits`

`(key text, window_start timestamptz, count int)`, used by
`public.hit_rate_limit(key, limit, window_seconds) returns boolean`
(SECURITY DEFINER, EXECUTE granted to `service_role` only).

## Access rules

Helper functions (SECURITY DEFINER, `private` schema, read only the caller's own row):

- `private.is_active_admin()`: an `admin_users` row for `auth.uid()` with `revoked_at is null` **and** the JWT `aal` claim is `aal2`.
- `private.is_owner()`: the same, and `role = 'owner'`.

Grants: `anon` gets SELECT on `events`; `authenticated` gets SELECT, INSERT,
UPDATE, DELETE on `events`, SELECT/INSERT/UPDATE/DELETE on `admin_users`,
SELECT on `audit_log`. Nothing else. RLS then decides rows:

| Table | anon | authenticated |
| --- | --- | --- |
| events SELECT | published and not deleted | same, or any row when `is_active_admin()` |
| events INSERT | no | `is_active_admin()` |
| events UPDATE | no | `is_active_admin()` (USING and WITH CHECK) |
| events DELETE | no | `is_owner()` and the row is already in Trash |
| admin_users SELECT | no | own row, or any row when `is_active_admin()` |
| admin_users INSERT/UPDATE/DELETE | no | `is_owner()`; a trigger blocks removing the last active owner and blocks changing `user_id` |
| audit_log SELECT | no | `is_active_admin()` |
| audit_log writes | no | no (triggers and the service role only) |
| storage.objects (bucket flyers) SELECT | object referenced by a published, not deleted event | same, or any object in the bucket when `is_active_admin()` |
| storage.objects INSERT/UPDATE/DELETE | no | `is_active_admin()`, bucket `flyers` only |

Triggers on `events`: set `created_by`/`updated_by`/`updated_at`, increment
`version`, set `published_at` on first publish, validate URL schemes and
lengths (defence in depth behind zod), write audit rows. Triggers on
`admin_users`: audit rows, last-owner guard.

Application-side, every admin page and action calls `requireAdmin()`:
verified claims (`getClaims`), live `admin_users` row (not revoked), `aal2`.
Owner-only actions additionally require `role = 'owner'`. Record IDs from the
client are only ever used inside queries that RLS filters; ownership is never
taken from the client.

## Authentication flows

- **Invite**: owner enters email and role → server verifies owner → service role `auth.admin.inviteUserByEmail` → `admin_users` row inserted as the owner (RLS) → email with `/auth/confirm?token_hash=…&type=invite` → session (aal1) → set password → enroll TOTP → aal2 → dashboard.
- **Sign in**: `/admin/login` email + password (rate limited by IP and email) → aal1 → `/admin/mfa` challenge (or enrollment if no factor) → aal2.
- **Revoke**: owner sets `revoked_at` and the service role bans the user and signs out their sessions. Every later request fails the `admin_users` check even if the old access token has not expired.
- **Reinstate**: clears `revoked_at`, lifts the ban.
- **Reset MFA** (owner, for a locked-out officer): service role deletes the user's factors; the officer re-enrolls at next sign-in.
- **Password reset**: `/admin/login` → "Forgot password" → Supabase recovery email → `/auth/confirm?type=recovery` → `/admin/account/password`.
- **Sign out**: Server Action, clears cookies.
- Cookies: set by `@supabase/ssr` (`Secure`, `SameSite=Lax`, `HttpOnly` where the library permits, path `/`). JWT expiry 1 hour; refresh handled in `proxy.ts`.

Supabase Auth settings required (manual): sign-ups disabled, email confirmations on, TOTP MFA enroll and verify enabled, email templates for invite and recovery pointing at `/auth/confirm` with `token_hash`, Site URL and redirect URLs set to the production domain, session time-box and inactivity timeout recommended.

## Public behaviour

- Homepage: "Upcoming events" section with the next three published events (canceled ones marked), linking to `/events`.
- Events page: next event card, "Also coming up" rows, a monthly calendar (`?month=YYYY-MM`, validated) and past events. An event is upcoming until its `ends_at` passes; "Happening now" between start and end. Canceled events keep their slot, show a "Canceled" badge, no RSVP button.
- Past events show flyer, date, title, location and, when present, the recap and links to slides, recording and materials.
- All rendering is per request; nothing is cached across users. Times are shown in Eastern time with the zone abbreviation.
- If the database is unreachable the pages show a short "events are temporarily unavailable" note instead of failing.

## Admin dashboard (`/admin`)

Own layout (no public header or footer), `robots: noindex`, link-less from the public site except a small "Officer sign-in" link in the footer.

- `/admin` events list with tabs: Upcoming, Drafts, Past, Canceled, Trash. Each row: title, date, status badge, flyer indicator, last edited by/at.
- `/admin/events/new` and `/admin/events/[id]`: one form (title, category, status is set by buttons rather than a field, starts/ends as `datetime-local` in Eastern time, all-day toggle, location, directions URL, registration URL, description, recap, slides/recording/materials URLs). Separate flyer panel: upload (file + alt text), replace, remove, with a thumbnail. Actions: Save, Publish, Unpublish, Cancel event, Move to Trash, Restore, Delete permanently (owner), Preview.
- `/admin/events/[id]/preview`: renders the public card components from the draft row.
- `/admin/admins` (owner): roster, invite, change role, revoke, reinstate, reset MFA.
- `/admin/audit`: newest first, 50 per page.
- `/admin/account`: MFA factors, change password, sign out.
- States: submit buttons show pending; field-level validation errors from zod; success banners after redirects; failures render a safe message. A conflict shows "Someone else saved this event since you opened it" with a reload link.

## Security headers

Set in `proxy.ts` for every HTML response: `Content-Security-Policy` with a per-request nonce (`script-src 'self' 'nonce-…' 'strict-dynamic'`, `style-src 'self' 'unsafe-inline'` because the homepage uses React inline styles, `img-src 'self' data: blob:`, `font-src 'self'`, `connect-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'self'`, `upgrade-insecure-requests` in production), plus `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`. Admin responses add `Cache-Control: no-store`. There is no CORS allowance: the app has no cross-origin API consumers.

## Testing

- Unit (`tsx --test`): time conversion (including DST boundaries), schema validation (lengths, dates, statuses, URL schemes, Markdown link schemes), public classification and calendar grouping, upload validation on crafted files (SVG, HTML, renamed executable, oversized, tiny, valid PNG/JPEG/WebP).
- Database (`supabase test db`, pgTAP): anon sees only published rows; anon cannot write; aal1 admin cannot write; aal2 editor can write events but cannot touch `admin_users` or `audit_log`; revoked admin loses access; last-owner guard; version increments; audit rows written; storage policies.
- Integration (`tsx --test` against the local stack over HTTP): anonymous Data API and Storage requests for drafts fail; editor cannot escalate; publishing flips visibility on the homepage, Events page and calendar.
- End to end (Playwright): public pages render from the database; admin login page renders; an officer signs in with TOTP and publishes an event.

## Out of scope

- Event detail pages and RSVP collection (RSVPs stay on PIN).
- Email notifications to members.
- Passkey sign-in (experimental in Supabase; revisit when generally available).
- Multi-club or multi-tenant support.
