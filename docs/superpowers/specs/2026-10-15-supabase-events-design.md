# Events in Supabase

**Date:** 2026-10-15
**Status:** approved in conversation ("just use supabase"); replaces the Google Sheets store of `2026-10-15-google-sheets-events-design.md` and keeps the admin page of `2026-10-15-admin-events-design.md`

## Goal

Events live in a Supabase Postgres table and flyers in a Supabase Storage
bucket. Officers manage everything on the site's `/admin` page (one shared
password, already built). The public events page reads from Supabase with
the same caching, backoff and last-good behaviour it has now. Google Sheets,
the service account and the Google Cloud project are no longer used.

## Why

The sheet needed a Google permission change that the tooling could not make
and the user did not want to make by hand. The admin page already covers the
officers' workflow, so the sheet had become a second interface rather than
the database. Supabase can be provisioned and migrated from the CLI with no
manual steps, and the project owner's Supabase account already exists.

## Non-goals

- Supabase Auth, per-officer accounts, RLS policies for end users. Only the
  server talks to Supabase, with the secret key.
- Keeping the sheet in sync. It is retired; the template CSV goes too.
- A public Data API. The `events` table has RLS enabled and no policies, so
  publishable-key clients see nothing. The site is the only reader.

## Architecture

```
/admin (Server Actions) ──▶ PostgREST  /rest/v1/events        (secret key, server only)
                        └──▶ Storage   /storage/v1/object/flyers
public /events ──▶ cached reader ──▶ PostgREST (published rows) ──▶ render
flyer <img src> ──▶ https://<ref>.supabase.co/storage/v1/object/public/flyers/<path>
```

No Supabase SDK: three REST calls with `fetch`, so the modules keep the same
injected-`fetch` tests as the Sheets client had. Headers: `apikey: <secret>`;
`Authorization: Bearer <secret>` is added only for a legacy JWT key.

### Schema (`supabase/migrations/<ts>_events.sql`)

```sql
create table public.events (
  id               text primary key check (id ~ '^[A-Za-z0-9_-]{1,64}$'),
  title            text not null check (char_length(title) between 1 and 120),
  description      text not null default '' check (char_length(description) <= 2000),
  date             date not null,
  start_time       text check (start_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  end_time         text check (end_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  location         text not null default '' check (char_length(location) <= 200),
  category         text not null default '' check (char_length(category) <= 40),
  image_url        text not null default '' check (char_length(image_url) <= 500),
  image_alt        text not null default '' check (char_length(image_alt) <= 300),
  registration_url text not null default '' check (char_length(registration_url) <= 500),
  status           text not null default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled')),
  published        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index events_published_date_idx on public.events (date) where published;
alter table public.events enable row level security;
revoke all on public.events from anon, authenticated;
-- updated_at trigger (security invoker, in public, touches only its own row)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('flyers', 'flyers', true, 5242880, array['image/webp']) on conflict (id) do nothing;
```

Times stay `HH:mm` text in the club's timezone, as the form and the public
page already treat them; instants are derived at read time with
`zonedLocalToUtc`, exactly as before. `id` is the slug the form generates
(`resume-workshop-2026-09-22`), never editable.

### Modules

| Module | Purpose |
| --- | --- |
| `src/server/events/supabase.ts` | `readSupabaseConfig(env)` (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`), `createSupabaseClient(config, deps)` with `listEvents(onlyPublished)`, `upsertEvent(row)`, `uploadFlyer(path, bytes)`, `deleteFlyer(path)`, `publicFlyerUrl(path)`. Injected `fetch`, 8 s timeout, fixed-string errors. |
| `src/lib/events/db-row.ts` | Pure: `EventRow` type (the table's columns), `eventFromRow(row, timeZone): ClubEvent | null` (invalid rows skipped and reported), `rowFromCells(cells): EventRow`. |
| `src/server/events/events-reader.ts` | Unchanged contract (backoff, last good), now generic over a `fetchEvents` function instead of sheet cells. |
| `src/server/events/load-events.ts` | Reads published events through the data cache, key `events-db` + hash of the project URL. |
| `src/server/admin/events.ts` | `readAdminEvents()`: every row, fresh. |
| `src/app/admin/actions.ts` | `saveEvent` validates as before, uploads the flyer to Storage, upserts the row, deletes a replaced flyer, revalidates. |
| `src/server/events/flyer-upload.ts` | Same image pipeline; `storeFlyer`/`discardFlyer` now target Storage; `isFlyerUrl` recognises the project's public storage URL. |
| `src/lib/events/sheet.ts` | Stays as the row-rules module (cleaning, dates, times, URLs, `parseSheet` used by the form validation). The `row` field on events goes away. |

Removed: `google-jwt.ts`, `google-sheets.ts`, `sheet-writer.ts` and their
tests, `docs/events-template.csv`, the Google env vars (local and on Vercel),
`@vercel/blob` and the Blob-based upload. The Blob store on Vercel is left
for the user to delete.

## Configuration

| Variable | Where |
| --- | --- |
| `SUPABASE_URL` | Vercel + `.env`. `https://<ref>.supabase.co`. |
| `SUPABASE_SECRET_KEY` | Vercel + `.env`. An `sb_secret_…` key (or the legacy `service_role` JWT). Server only. |
| `SUPABASE_DB_PASSWORD` | `.env` only; for `supabase link` and `supabase db push`. |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | unchanged |

## Security

- The secret key never leaves the server; no `NEXT_PUBLIC_` Supabase values.
- RLS on, no policies, privileges revoked from `anon`/`authenticated`: the
  Data API returns nothing to anyone but the secret key.
- The bucket is public for reads (flyers are public by nature) and accepts
  only `image/webp` up to 5 MB; writes need the secret key. The site only
  ever uploads its own re-encoded WebP.
- Same validation, RAW-text semantics (Postgres text, no formulas), rate
  limits and session rules as before.

## Testing

Unit: `db-row.test.ts` (row ↔ event both ways, invalid rows reported),
`supabase.test.ts` (request shapes for list/upsert/upload/delete with injected
fetch, key header rules, errors, timeout), updated `events-reader.test.ts`,
`flyer-upload.test.ts` (storage paths and URL recognition), `form.test.ts`.
Live: after `db push`, the dev server lists events, a real save with a flyer
writes a row and a storage object, the public page shows it at once.
`npm run verify`, `npm run build`, Playwright smoke.
