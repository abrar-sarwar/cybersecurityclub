# Events: the Google Sheet

The events page on the website is generated from one Google Sheet. Officers
add and edit rows; the site reads the sheet, checks every cell and shows the
published rows. There is no admin login and nothing to deploy. A change in
the sheet is live on the site within about five minutes.

The sheet is the admin interface. Who can edit events is decided by who can
edit the sheet, using Google's own sharing settings.

## For officers: managing events

Open the sheet (an existing officer shares it with you). The first tab,
`Events`, has one row per event. Each column:

| Column | Required | What to put in it |
| --- | --- | --- |
| `event_id` | yes | A short unique label for the event, such as `gbm-2026-09-02`. Letters, digits, `-` and `_` only. Never reuse one. |
| `title` | yes | The event name, up to 120 characters. |
| `description` | no | What to expect, up to 2000 characters. Line breaks are kept. Plain text only: links and formatting are not rendered. |
| `date` | yes | The day it happens, in Eastern time. A date cell, `2026-09-02` or `9/2/2026`. |
| `start_time` | no | `3:00 PM`, `15:00` or a time cell. |
| `end_time` | no | Same as `start_time`. Must be after the start on the same day. |
| `location` | no | Building and room, up to 200 characters. |
| `category` | no | `Workshop`, `Meeting`, `Panel`, `Competition`, `Social`, or any short word. |
| `image_url` | no | A link to the flyer image. See Images below. |
| `image_alt` | no | What the flyer says, for screen reader users. Defaults to "<title> flyer". |
| `registration_url` | no | The RSVP link (usually the event's PIN page). Must start with `https://`. |
| `status` | no | `Upcoming` (default), `Completed` or `Cancelled`. |
| `published` | yes | Tick the box (or type `TRUE`) to show the event. Unticked rows never appear. |

Column order does not matter and extra columns are ignored, but the header
names must stay exactly as above.

### Add an event

Add a row, fill in at least `event_id`, `title` and `date`, and tick
`published` when it is confirmed. Leave `status` empty: the site works out
from the date and times whether the event is upcoming or past.

### Edit an event

Change the cells. Keep `event_id` the same so the event stays the same event.

### Cancel an event

Set `status` to `Cancelled` and leave it published. The event stays on the
page with a "Cancelled" flag and no RSVP button until its day has passed, so
people who planned to come see the change. It never appears in Past events.

### Hide an event without deleting it

Untick `published`. The row stays in the sheet for your records; the site
behaves as if it does not exist.

### Mark an event as held early

Set `status` to `Completed`. It moves to Past events at once, whatever the
date. Normally you do not need this: an event moves to the past by itself
once its end time (or the end of its day, when there are no times) has passed.

### Images

`image_url` must be a direct link to the image file, starting with
`https://`, or a path on the site such as `/assets/events/flyer.webp`.

- Google Drive share links do not work as image URLs. Use an image host
  that gives a direct file link, or ask a maintainer to add the flyer to the
  website's `public/assets/events/` folder and use its `/assets/events/...`
  path.
- Flyers should be under about 1 MB and PNG, JPEG or WebP.
- Fill in `image_alt` with what the flyer says. The site's accessibility
  page promises this.

### If something does not show

The site skips rows it cannot read and logs why. The usual causes: `published`
not ticked, a missing `event_id`, `title` or `date`, a `date` the site cannot
read, or a duplicate `event_id`. Links that do not start with `https://` are
dropped from the event (the event still shows). Changes take up to five
minutes to appear.

## For maintainers: one-time setup

### 1. Create the sheet

1. Create a new Google Sheet in the club's Google account.
2. Name the first tab `Events`.
3. Import `docs/events-template.csv` from this repository (File → Import →
   Upload, "Replace current sheet"). It contains the header row, the three
   events that used to be hard-coded on the site, and one unpublished example
   row to edit or delete.
4. Optional but recommended: Data → Data validation on the `published`
   column as a checkbox, and on `status` as a dropdown with Upcoming,
   Completed, Cancelled.
5. Share the sheet with each officer who should manage events as **Editor**.
   Do not share it with "Anyone with the link", and do not use File → Share →
   Publish to web.

### 2. Create a read-only service account

A service account is a robot Google account the website signs in as. It only
ever gets Viewer access to this one sheet.

1. Open <https://console.cloud.google.com/> with the club's Google account
   and create a project (for example "Cybersecurity Club website").
2. APIs & Services → Library → search "Google Sheets API" → Enable.
3. IAM & Admin → Service Accounts → Create service account. Name it
   `website-events-reader`. Grant it **no** project roles. Finish.
4. Open the service account → Keys → Add key → Create new key → JSON. A file
   downloads. Treat it like a password: it is the only copy, and anyone with
   it can read the sheet.
5. Copy the `client_email` value from that file. Back in the sheet, Share →
   add that email as **Viewer**.

### 3. Set the environment variables

On Vercel: Project → Settings → Environment Variables, for Production and
Preview. Locally: in `.env` (never committed).

| Variable | Value |
| --- | --- |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | The long ID in the sheet's URL, between `/d/` and `/edit`. |
| `GOOGLE_SHEETS_RANGE` | The tab name. Optional; defaults to `Events`. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON key. |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | `private_key` from the JSON key, the whole `-----BEGIN PRIVATE KEY-----` … `-----END PRIVATE KEY-----` block. Paste it as is with its line breaks, or as one line with `\n` in place of each line break; both work. |
| `EVENTS_CACHE_SECONDS` | Optional. How long the site serves the same sheet data before re-reading it. Default 300, minimum 30. |

Redeploy after adding them (Vercel reads env vars at build and run time).
Then delete the downloaded JSON file.

### 4. Check it

Open `/events`. With the template imported, the three past events show under
Past events and nothing is upcoming. Tick `published` on the example row and
reload after five minutes: it appears under upcoming.

If the page says "The events list is not available right now", look at the
server logs for a line starting with `[events]`. It names the missing
variable, the HTTP status Google returned, or the row that could not be read.

## How the site reads the sheet

- `src/server/events/google-jwt.ts` signs a one-hour JWT with the service
  account key and exchanges it for an access token, which is reused until a
  minute before it expires.
- `src/server/events/google-sheets.ts` calls the Sheets API `values.get`
  endpoint for `'Events'!A1:Z501` with unformatted values and serial-number
  dates, so date cells read the same whatever the sheet's locale is.
- `src/lib/events/sheet.ts` validates every cell (lengths, dates, times,
  link schemes, published flag, duplicate IDs) and drops or trims what does
  not fit, logging the row number and reason.
- `src/server/events/load-events.ts` caches the result through the Next.js
  data cache for `EVENTS_CACHE_SECONDS`, keeps the last good list in memory
  to serve during a Google outage, and waits 30 seconds between retries after
  a failure. Google requests time out after 8 seconds.
- `src/lib/events/board.ts` splits events into upcoming and past for the
  current instant in `America/New_York`, on every request.

## Security notes

- The service account has the `spreadsheets.readonly` scope and Viewer
  access to one sheet. It cannot write, and nothing on the site writes.
- Credentials live in server-side environment variables only. No page,
  script or API route exposes them, the access token or the spreadsheet ID.
  Log lines show at most the first six characters of the spreadsheet ID.
- The site has no endpoint that returns sheet data. Visitors get rendered
  HTML of published rows only; unpublished rows are discarded on the server
  before anything is rendered.
- Every cell is treated as untrusted text. React renders it as text, so a
  cell containing HTML or script shows as literal characters. Links must be
  `https://`; `javascript:`, `data:` and `http:` links are dropped. Image
  URLs must be `https://` or a plain `/assets/...` path.
- The Content Security Policy allows images from any `https:` host so pasted
  flyer links load. Scripts, styles, fonts and connections remain restricted
  to the site itself.
- The Sheets range is capped at 500 rows, and each field has a length cap.

## Alternative considered: a published CSV

Google Sheets can "publish to the web" as CSV, which needs no credentials:
the site would fetch a public URL. This was not used because:

- The CSV is readable by anyone who finds the URL, including unpublished
  rows, internal notes and every column, with no way to revoke access short
  of unpublishing the whole sheet.
- There is no access log and no way to tell who is reading it.
- Google caches published output for several minutes on its side, in
  addition to the site's cache.

If the service-account route ever becomes impossible, the published-CSV
approach would need a separate sheet containing only public columns and only
published rows, and officers would have to understand that everything in it
is public.
