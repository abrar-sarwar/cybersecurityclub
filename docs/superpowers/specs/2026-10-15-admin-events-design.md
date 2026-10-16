# Officer admin page for events

**Date:** 2026-10-15
**Status:** implemented; the Google Sheet store it was built on was replaced the same day by `2026-10-15-supabase-events-design.md`; builds on the Google Sheets events design (`2026-10-15-google-sheets-events-design.md`)

## Goal

Officers sign in to `/admin` with one shared password and add, edit, cancel,
hide and re-publish events in a form, including uploading a flyer image from
their computer. Saving writes the row into the same Google Sheet the site
already reads, so the sheet stays the database: officers who prefer the sheet
keep editing it directly, and both views always agree. Saving refreshes the
public page at once.

## Non-goals

- Per-officer accounts, roles or an audit trail of who changed what. One
  shared password was the user's explicit choice; the tradeoffs are below.
- Deleting rows. "Hide" (published off) is the delete.
- Editing anything other than events. No calendar, no recap fields.
- Rich text. Descriptions stay plain text with line breaks.

## Architecture

```
browser ──form POST (Server Action)──▶ /admin actions ──▶ Sheets API (write)
                                             │               ▲
                                             ├──▶ Vercel Blob (flyer image)
                                             └──▶ revalidateTag("events") ──▶ public /events re-reads the sheet
```

- The admin pages are Server Components under `src/app/admin/`; mutations are
  Server Actions in `src/app/admin/actions.ts`. There are no API routes.
- The existing read path (`load-events.ts`, `events-reader.ts`,
  `google-sheets.ts`, `sheet.ts`) is unchanged except for one parser option
  (below). Writes get their own module, `src/server/events/sheet-writer.ts`.
- The service account used for reading gains the full `spreadsheets` scope and
  Editor access on the sheet. Nothing else about it changes.
- Flyers are stored in a public Vercel Blob store and referenced from the
  sheet's `image_url` column as ordinary https URLs. The public page needs no
  change to show them: the CSP already allows `https:` images.

### Why Blob and not Google Drive for images

A service account has no Drive storage quota, so it cannot create files in a
personal Drive. Blob is built into the hosting the site already uses, needs
one token, and serves images from a CDN. Supabase Storage would work but adds
a whole project for one bucket.

## Modules

| Module | Purpose | Tested by |
| --- | --- | --- |
| `src/server/admin/session.ts` | Signs and verifies the session cookie value with HMAC-SHA256 over `{exp, pw}` using `ADMIN_SESSION_SECRET`. `pw` is a short hash of the current password so changing the password invalidates every session. 12 hour lifetime. | `session.test.ts` |
| `src/server/admin/password.ts` | Reads `ADMIN_PASSWORD` (min 12 chars) and compares a submitted password in constant time. | `password.test.ts` |
| `src/server/admin/rate-limit.ts` | In-memory sliding window per key: 5 login attempts per 15 minutes per IP, 30 saves per 10 minutes per session. Per instance; good enough for a club site and stated as such. | `rate-limit.test.ts` |
| `src/server/admin/auth.ts` | `requireAdmin()` for pages and actions: reads the cookie, verifies, redirects to `/admin/login` otherwise. `signIn`, `signOut` cookie helpers. | through actions and e2e |
| `src/lib/events/sheet.ts` | New option `includeUnpublished`. With it, unpublished rows are parsed like published ones and every event carries `published`. Every parsed event also carries `row` (its 1-based sheet row). | `sheet.test.ts` |
| `src/lib/events/form.ts` | Pure: `FormData` → the 13 known cells in header order, validated by running `parseSheet` on `[header, row]`; field errors from its problems. `eventIdFor(title, date, taken)` makes a unique slug. | `form.test.ts` |
| `src/server/events/sheet-writer.ts` | `createSheetWriter(config, deps)`: `readAll()` (header + raw rows, uncached), `append(cells)`, `update(row, cells)`. Writes use `valueInputOption=RAW` so nothing typed is ever treated as a formula. `update` overlays the known columns on the row's existing raw cells so extra columns officers add are never clobbered. | `sheet-writer.test.ts` with injected fetch |
| `src/server/events/flyer-upload.ts` | `prepareFlyer(bytes)`: sharp decodes, accepts only PNG, JPEG and WebP, rejects anything else (SVG, HTML, renamed binaries), rejects under 200 px or over 4 MB, resizes to max 1600 px, re-encodes to WebP quality 82, strips metadata. `storeFlyer(eventId, webp)` puts it at `flyers/<eventId>-<hash8>.webp` with public access and returns the URL; `discardFlyer(url)` deletes a Blob URL, best effort. | `flyer-upload.test.ts` (sharp only; Blob calls injected) |
| `src/app/admin/*` | Pages: `login`, index (list), `events/new`, `events/[id]`. One `EventForm` client component using `useActionState` for field errors. Admin layout with sign-out and `robots: noindex`. | Playwright smoke |
| `src/proxy.ts` | For `/admin` paths: `Cache-Control: private, no-store`, `X-Robots-Tag: noindex`, and a redirect to `/admin/login` when the session cookie is missing or invalid (pages verify again themselves). | e2e |

## Pages and flows

**Login** `/admin/login`: one password field. Wrong password or rate limited:
the same page with a message, no detail about which. Success: cookie set,
redirect to `/admin`. Already signed in: redirect to `/admin`.

**List** `/admin`: upcoming first, then past, each with title, date, status
badge, "Hidden" badge when unpublished, and an Edit link. "New event" button.
A "Rows the site cannot read" box lists parser problems with their row numbers
when there are any, so a broken row typed into the sheet is visible here.

**Form** `/admin/events/new` and `/admin/events/[id]`:
title, description (textarea), date, start time, end time, location, category
(text with suggestions: Workshop, Meeting, Panel, Competition, Social),
registration URL, status (Upcoming, Completed, Cancelled), published
(checkbox), flyer (file input, PNG/JPEG/WebP, max 4 MB) with current flyer
preview and a "Remove flyer" checkbox, and flyer alt text. Save, Cancel.
Validation errors appear next to the field and the entered values are kept.

Save, for a new event: generate `event_id` from title and date
(`resume-workshop-2026-09-22`, with `-2`, `-3` when taken), upload the flyer if
one was chosen, append the row, revalidate, redirect to `/admin` with a
"Saved" notice. For an existing event: re-read the sheet, find the row by
`event_id` (error if gone), upload the new flyer if chosen or clear the URL if
"Remove flyer", write the row, delete the previous Blob flyer if it was
replaced or removed, revalidate, redirect.

`event_id` is never editable in the form.

## Security

- Password only in `ADMIN_PASSWORD`; session secret only in
  `ADMIN_SESSION_SECRET` (32+ bytes). Both required for `/admin` to work; with
  either missing, `/admin` renders a "not configured" page and no action runs.
- Cookie `admin_session`: HttpOnly, Secure (outside development),
  SameSite=Lax, Path=/admin, 12 hours. Value is `base64url(payload).hmac`.
  Verification is constant time.
- Login rate limited per IP (5 per 15 minutes). Saves rate limited per session.
- Server Actions carry Next.js's own origin check; `form-action 'self'` stays
  in the CSP.
- Every action calls `requireAdmin()` itself; the proxy redirect is only a
  convenience.
- All form text goes through the same `cleanText` and limits as the sheet
  parser, and is written with `RAW` so a leading `=` can never become a
  formula. The public page keeps rendering everything as text.
- Flyer bytes are decoded by sharp and re-encoded; the original file is never
  stored. Content type comes from the decoder, not the upload.
- Blob deletes are limited to URLs on the store's own host.
- Admin pages: no-store, noindex, not in the sitemap.
- Shared-login tradeoffs, stated in the guide: nobody can tell officers
  apart, one leak means rotating the password for everyone, and rate limits
  are per server instance.

## Configuration

| Variable | Where | Notes |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Vercel + local `.env` | 12+ characters. Generated locally by the setup; the user sets their own in production. |
| `ADMIN_SESSION_SECRET` | Vercel + local `.env` | 32 random bytes, hex. |
| Blob credentials | Injected by Vercel when the store is connected (`BLOB_STORE_ID` plus OIDC); locally via `vercel env pull` | Public Blob store `cybersecurityclub-flyers`. |
| `next.config.ts` | | `experimental.serverActions.bodySizeLimit: "5mb"`; the flyer cap is 4 MB because Vercel caps request bodies at 4.5 MB. |

## Documentation

- `docs/events-google-sheet.md` gains an "Admin page" section at the top for
  officers (sign in, add, edit, cancel, hide, flyers) and a maintainer section
  (env vars, Blob store, rotating the password).
- `README.md` and `.env.example` updated.

## Testing

Unit tests as listed per module. Playwright additions in `e2e/admin.spec.ts`:
`/admin` redirects to `/admin/login` when signed out; wrong password stays on
the login page; the correct password (from `ADMIN_PASSWORD` in the test
environment) reaches `/admin`; admin responses carry `no-store` and `noindex`.
`npm run verify` and `npm run build` pass.
