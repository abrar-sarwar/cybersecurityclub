# Merging the events UI from `main` onto the database-backed events

**Date:** 2026-10-16
**Status:** implemented; extends `2026-10-15-supabase-events-design.md`

## Situation

While the admin page and the Supabase store were being built on a branch,
`main` gained a rebuilt events feature: a hand-kept list in
`src/content/club/events.ts` with categories, levels, a Luma checkout button
and links to materials, plus a month/agenda calendar
(`components/events/event-calendar.tsx`), shared detail pieces
(`event-details.tsx`), a rewritten events page and a homepage spotlight.
The two could not both be true: one source of events was needed.

## Decision

The database stays the source of truth and the admin page stays the way
events are edited. The UI from `main` is kept and pointed at the database.
The fields it needed that the table lacked were added, and the six events
that lived in code were moved into the table so nothing disappeared from the
live site.

## What changed

- **Model** (`src/lib/events/event.ts`): `difficulty` (fixed list or null),
  `lumaEventId` (`evt-…` or null), `links` (`{ label, href }[]`, at most 10),
  `imageWidth`/`imageHeight` (so flyers reserve their space). `category`
  stays free text in the store; the form offers the fixed list and the badge
  falls back to grey for anything else.
- **Rules** (`sheet.ts`, new `links.ts`, `text.ts`): the same parser reads
  the new columns from a row or the form, reports what it cannot use and
  keeps the rest. Materials are typed one per line as `Label | https://link`
  and stored as a JSON array. A pasted luma.com link is accepted for the id.
- **Schema** (`supabase/migrations/20261016150308_event_details.sql`): the
  columns with check constraints mirroring the rules, and an idempotent seed
  of the six events pointing at the flyers in `public/assets/events/`.
- **UI**: `event-details.tsx`, `event-calendar.tsx`, `event-board.tsx`, the
  events page and the homepage are `main`'s, with the model's names, the
  cancelled state (badge, no registration button), an unavailable notice
  when the store cannot be read, and Suspense so the hero streams first.
  The calendar's date arithmetic lives in `src/lib/events/calendar.ts`.
- **Admin form**: category and level as selects (a value typed outside the
  list is still shown and kept), Luma id, materials textarea. The save
  action records the flyer's pixel size from the image pipeline.

## Not done

- `kind` on links (slides/repo/recording/lab) from the old model: the UI
  never used it, so it was dropped.
- Difficulty is stored and editable but not displayed, matching `main`,
  which had removed the level badge from cards.
