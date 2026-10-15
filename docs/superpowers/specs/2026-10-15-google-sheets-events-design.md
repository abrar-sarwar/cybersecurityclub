# Events from a Google Sheet

**Date:** 2026-10-15
**Status:** approved for implementation (supersedes the Supabase event admin spec of 2026-10-14 for the events feature)

## Goal

Officers manage club events in one Google Sheet. The website reads that sheet,
validates every cell, caches the result for a few minutes and renders the
existing events page from it. Adding a row and setting `published` to TRUE
makes the event appear on the site without a code change or a deploy.

There is no admin dashboard, no sign-in and no database. The sheet is the
admin interface; Google's own sharing controls decide who can edit it.

## Non-goals

- Writing to the sheet from the website. The site only reads.
- A calendar view, recaps, slides or any field the sheet does not have.
- Flyer uploads. Officers host images elsewhere and paste a URL.
- Instant updates. Changes appear within the cache window (5 minutes by default).

## Architecture

```
Google Sheet ──(Sheets API v4, read-only service account)──▶ server loader
                                                              │ validate, cache
                                                              ▼
                                                   /events page (server render)
```

Everything that touches Google runs on the server inside the Next.js request.
The browser receives rendered HTML only. No credential, token or spreadsheet
ID reaches the client bundle, and there is no public endpoint that can change
sheet data because the site has no write path at all.

Hosting is Vercel (the project is linked), which supports server-side
environment variables, so the preferred architecture applies. The simpler
"publish to the web" CSV approach is documented as an alternative with its
tradeoffs in `docs/events-google-sheet.md`; it is not used.

### Modules

| Module | Purpose | Depends on |
| --- | --- | --- |
| `src/lib/events/event.ts` | The `ClubEvent` type the page renders. | nothing |
| `src/lib/events/sheet.ts` | Pure: sheet cells in, validated `ClubEvent[]` plus row problems out. | `time.ts`, `urls.ts` |
| `src/lib/events/board.ts` | Pure: splits events into upcoming and past for one instant. | `public.ts` |
| `src/server/events/google-jwt.ts` | Builds a signed service-account assertion and exchanges it for an access token. `node:crypto` only. | nothing |
| `src/server/events/google-sheets.ts` | Reads env config and fetches the sheet's cell values. | `google-jwt.ts` |
| `src/server/events/load-events.ts` | Cached loader with last-good fallback and failure backoff. Returns a result, never throws. | the two above, `sheet.ts` |
| `src/app/(public)/events/page.tsx` | Streams the board inside a Suspense boundary. | `load-events.ts`, `board.ts` |
| `src/components/site/event-board.tsx` | Existing lists, adapted to `ClubEvent`, plus an "unavailable" state. | `event.ts` |

The existing `time.ts` (DST-safe wall clock to instant), `urls.ts`
(`isSafeHttpsUrl`) and `public.ts` (`classifyEvent`, `splitPublicEvents`) are
reused unchanged. `schema.ts` and `types.ts` belong to the superseded admin
design and are not imported by this feature.

## The sheet

One tab, default name `Events`, header row first. Columns are matched by
header name (case and whitespace insensitive), so order does not matter and
extra columns are ignored.

| Column | Required | Accepted values |
| --- | --- | --- |
| `event_id` | yes | 1 to 64 characters of letters, digits, `-` or `_`. Must be unique. |
| `title` | yes | 1 to 120 characters. |
| `description` | no | Up to 2000 characters. Plain text; line breaks are kept. |
| `date` | yes | A Sheets date cell, or text as `YYYY-MM-DD` or `M/D/YYYY`. Year 2000 to 2100. |
| `start_time` | no | A Sheets time cell, or text as `HH:mm`, `H:mm AM/PM`, `H AM/PM`, `3pm`. |
| `end_time` | no | Same as `start_time`. Must be after `start_time` on the same day. |
| `location` | no | Up to 200 characters. |
| `category` | no | Up to 40 characters, e.g. Workshop, Meeting, Panel, Competition. |
| `image_url` | no | An `https://` URL, or a site path such as `/assets/events/flyer.webp`. |
| `image_alt` | no | Up to 300 characters describing the image. Defaults to "<title> flyer". |
| `registration_url` | no | An `https://` URL. |
| `status` | no | `Upcoming` (default), `Completed`, `Cancelled` (or `Canceled`). |
| `published` | yes | TRUE (checkbox, or the text TRUE, true, yes, 1). Anything else is unpublished. |

Values are read with `valueRenderOption=UNFORMATTED_VALUE` and
`dateTimeRenderOption=SERIAL_NUMBER`, so a real date cell arrives as a serial
number (days since 1899-12-30) and a real time cell as a fraction of a day,
independent of the sheet's locale. Text cells arrive as strings and are parsed.
Checkbox cells arrive as booleans.

### Row rules

- A row is skipped, with a server log line naming the row number and the
  reason, when `event_id`, `title` or `date` is missing or invalid, when
  `published` is not TRUE, or when `event_id` repeats an earlier row.
- An optional field that fails validation is dropped from that event and
  logged; the event still shows.
- All text is trimmed and control and invisible characters are removed. Text
  longer than its limit is cut to the limit and logged. Text is rendered as
  text by React. No HTML from the sheet is ever interpreted.
- At most 500 data rows are read.

### Time and phase

Times are wall clock in `America/New_York` and are converted to instants with
`zonedLocalToUtc`, which handles the two clock-change days. The site stores
nothing; it recomputes on every request.

- `startsAt` is the date at `start_time`, or at 00:00 when there is none.
- `endsAt` is the date at `end_time`, or at 23:59 when there is none, so an
  event without times stays upcoming for the whole of its day.
- Phase comes from `classifyEvent`: past once `endsAt` has passed.
- `status = Completed` forces past. `status = Cancelled` keeps the event in
  upcoming (so people who planned to come see the change) with a Cancelled
  flag and no RSVP button; a cancelled event whose day has passed is omitted.
- Upcoming is sorted soonest first, past most recent first.

## Server loader

`loadEvents()` returns one of:

```ts
{ ok: true; events: ClubEvent[] }
{ ok: false; reason: "unconfigured" | "unavailable" }
```

- The fetch and parse are wrapped in `unstable_cache` with key
  `events-sheet`, tag `events` and `revalidate` from `EVENTS_CACHE_SECONDS`
  (default 300). This is the documented data-cache API for projects that do
  not enable Cache Components, which this project does not.
- The last successful result is also kept in module memory. When a refresh
  throws, the loader logs and returns the last good list; with no last good
  list it returns `unavailable`.
- After a failure the loader does not call Google again for 30 seconds.
- Concurrent cache misses share one in-flight promise.
- Google requests use an 8 second timeout.
- When any required env var is missing the loader returns `unconfigured`
  once per process with a single log line, and never calls Google.
- Log lines never include the private key, the access token or the
  spreadsheet ID beyond its first six characters.

### Google access

- Env: `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_RANGE` (optional,
  default `Events`), `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
  `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (PEM; `\n` escapes are unescaped),
  `EVENTS_CACHE_SECONDS` (optional).
- Scope `https://www.googleapis.com/auth/spreadsheets.readonly`.
- The assertion is an RS256 JWT signed with `node:crypto`, exchanged at
  `https://oauth2.googleapis.com/token`. The access token is kept in module
  memory until one minute before it expires.
- The service account is shared on the sheet as Viewer only. Officers are
  Editors. Nobody else has access; the sheet is not published to the web.

## Page and components

- `/events` stays `force-dynamic` so the phase split happens per request.
  The board renders inside `<Suspense>` with a short loading fallback.
- `UpcomingEvents` and `PastEvents` keep their markup and CSS. Changes:
  image from `imageUrl` and `imageAlt` (no fixed width and height),
  a detail line composed from category, location and time range, description
  with preserved line breaks, a Cancelled flag, and an RSVP button that says
  "RSVP on PIN" for `pin.gsu.edu` links and "Register" for others.
- `EventsUnavailable` renders when the loader fails, with the PIN and
  Discord links, so visitors are never told nothing is scheduled when the
  truth is that the list could not load.
- The Content Security Policy `img-src` gains `https:` so pasted image URLs
  load. Everything else in the policy is unchanged.

## Removed

- `CLUB_EVENTS`, `ClubEvent` and `splitEvents` in `src/content/club/flyers.ts`
  and their test. The three existing events move into the sheet template as
  sample rows. `NCL` stays where it is.

## Documentation and setup

- `docs/events-google-sheet.md`: officer guide (how to add, edit, cancel and
  hide events), the template table, Google Cloud setup, sharing, env vars,
  the published-CSV alternative and its tradeoffs.
- `docs/events-template.csv`: the header row plus sample rows, ready to
  import into a new sheet.
- `.env.example` and `README.md` updated.

## Testing

Unit tests with `node:test` through `tsx`, as the repo already does:

- `sheet.test.ts`: header mapping, serial and text dates and times, published
  fail-closed, required-field skips, duplicate IDs, length caps, control
  characters, URL rejection (javascript:, http:, data:, credentials), status
  normalisation, row cap.
- `board.test.ts`: phase at boundaries, no-time events last all day,
  Completed and Cancelled rules, ordering.
- `google-jwt.test.ts`: assertion claims and a signature that verifies with
  the matching public key; token exchange with an injected `fetch`, including
  error and timeout paths; token reuse before expiry.
- `google-sheets.test.ts`: request URL and query parameters, bearer header,
  non-200 handling, bad JSON, with an injected `fetch`.
- `event-board.test.tsx`: a description containing `<script>` renders as
  escaped text.
- `npm run verify` and `npm run build` pass. The Playwright smoke test still
  sees `/events` respond 200 with no credentials configured.
