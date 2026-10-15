# Events: the admin page

Club events live in a Supabase database and are managed on the website's own
admin page. There is nothing to deploy when an event changes.

## For officers

Open **/admin** on the website and sign in with the shared officer password
(ask the board for it). Sign-ins last 12 hours.

- **New event**: fill in the title, date and whatever else is confirmed, tick
  **Published** when it should show, and Save. The site updates immediately.
- **Edit**: open an event from the list, change it, Save.
- **Cancel**: set Status to Cancelled and Save. The event stays on the site
  with a "Cancelled" flag and no RSVP button until its day has passed, then
  disappears.
- **Hide**: untick Published and Save. The event stays in the list here,
  marked Hidden; the site no longer shows it.
- **Mark as held early**: set Status to Completed. It moves to Past events at
  once. Normally you do not need this: an event moves to the past by itself
  once its end time (or the end of its day, when there are no times) passes.
- **Flyer**: choose a PNG, JPEG or WebP file up to 4 MB. It is checked,
  resized to at most 1600 px and stored for you. Fill in the "flyer text for
  screen readers" box with what the flyer says; the site's accessibility page
  promises this.

Field rules, in case something is refused:

| Field | Rule |
| --- | --- |
| Title | 1 to 120 characters. |
| Description | Up to 2000 characters, plain text. Line breaks are kept. Links are not clickable. |
| Date | Required. The day it happens, in Eastern time. |
| Start and end time | Optional. End must be after start on the same day. |
| Location | Up to 200 characters. |
| Category | Up to 40 characters, e.g. Workshop, Meeting, Panel, Competition, Social. |
| RSVP link | Must start with `https://`. |
| Flyer text | Up to 300 characters. |

The event id (for example `resume-workshop-2026-09-22`) is made from the
title and date when the event is created and never changes afterwards.

## For maintainers

### What runs where

- Events: table `public.events` in the Supabase project `cybersecurityclub`
  (`https://fchlylcwdlrzzmzoypur.supabase.co`). Row Level Security is on with
  no policies and the API roles have no privileges, so only the secret key can
  read or write. The website is the only client.
- Flyers: Supabase Storage bucket `flyers`, public for reads, WebP only, 5 MB
  limit. Only the server writes to it.
- The website reads published events through the Next.js data cache
  (`EVENTS_CACHE_SECONDS`, default 300), keeps the last good list in memory to
  serve through an outage, waits 30 seconds between retries after a failure,
  and refreshes at once when the admin page saves.

### Environment variables

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://fchlylcwdlrzzmzoypur.supabase.co` |
| `SUPABASE_SECRET_KEY` | A secret key for the project: the `service_role` key today, or an `sb_secret_…` key once those work for this project. Server only. Never put it in a `NEXT_PUBLIC_` variable. |
| `ADMIN_PASSWORD` | The shared officer password, 12 or more characters. Changing it signs every officer out. |
| `ADMIN_SESSION_SECRET` | 32 random bytes as hex (`openssl rand -hex 32`). Signs the session cookie. Changing it also signs everyone out. |
| `EVENTS_CACHE_SECONDS` | Optional. Default 300, minimum 30. |
| `SUPABASE_DB_PASSWORD` | Local `.env` only, for `supabase link` and `supabase db push`. |

All but the last are set on the Vercel project for production and preview.
Locally they live in `.env` (never committed).

### Schema changes

The schema is in `supabase/migrations/`. To change it:

```bash
supabase link --project-ref fchlylcwdlrzzmzoypur   # once per machine
supabase migration new <name>                       # then edit the file
supabase db push
```

Keys: `supabase projects api-keys --project-ref fchlylcwdlrzzmzoypur`.

### Rotating the password

Change `ADMIN_PASSWORD` on Vercel and redeploy. Every officer is signed out
and needs the new password.

### Shared login, honestly

Nobody can tell which officer changed what, one leaked password means
rotating it for everyone, and login rate limiting (5 wrong passwords per
address per 15 minutes) is per server instance and trusts the hosting
platform's forwarded address. If that ever matters, per-officer accounts are
the next step; the form and the database would not change.

## Security notes

- Sessions are an HttpOnly, Secure, SameSite=Lax cookie signed with
  `ADMIN_SESSION_SECRET`, scoped to `/admin`, 12 hours. The cookie carries a
  keyed fingerprint of the password so a password change ends every session.
- Admin pages send `Cache-Control: private, no-store` and
  `X-Robots-Tag: noindex`, and `/admin` is disallowed in robots.txt.
- Everything typed in the form is cleaned (control and invisible characters
  removed), length-limited and validated before anything is written. The
  database enforces the same limits with check constraints. The public page
  renders every value as text, never as HTML.
- Links must be `https://`; `javascript:`, `data:` and `http:` links are
  refused. Flyer uploads are decoded by the image library and re-encoded as
  WebP; the original file is never stored, and anything that is not a PNG,
  JPEG or WebP is refused whatever it is called.
- The secret key lives only in server-side environment variables; no page or
  bundle contains it, and there is no public API for event data.
- The Content Security Policy allows images from any `https:` host so the
  storage bucket's URLs load. Scripts, styles, fonts and connections remain
  restricted to the site itself.

## History

Earlier in 2026-10 the events were read from a Google Sheet that officers
edited directly, and before that from a hard-coded list. The Google Sheet,
service account and Cloud project are no longer used by the site and can be
deleted from the club's Google account. The design records are in
`docs/superpowers/specs/`.
