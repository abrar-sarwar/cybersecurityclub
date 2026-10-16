# Events in Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the event store from the Google Sheet to a Supabase table and the flyer store from Vercel Blob to Supabase Storage, keeping the admin page and the public page's behaviour.

**Architecture:** A small REST client (`supabase.ts`, injected fetch) talks to PostgREST and Storage with the secret key. A pure row mapper (`db-row.ts`) converts table rows to `ClubEvent` and form cells to rows. The reader, loader, admin read, actions and flyer store swap their Google/Blob calls for it. Google modules and the Blob dependency are deleted.

**Tech Stack:** Next.js 16.3.5, `fetch`, Supabase PostgREST + Storage REST, `node:test` via `tsx`.

**Spec:** `docs/superpowers/specs/2026-10-15-supabase-events-design.md`

## Global Constraints

- Secret key only on the `apikey` header; add `Authorization: Bearer` only when the key starts with `eyJ` (legacy JWT).
- No Supabase SDK. No `NEXT_PUBLIC_SUPABASE_*`.
- `events-reader.ts` keeps its backoff and last-good contract and tests.
- The `row` field leaves `ClubEvent`; `published` stays.
- Commit messages carry no Claude attribution lines.

## Review Focus

1. A published row with a malformed `date` or `start_time` in the table (edited by hand in the Supabase dashboard) must be skipped and logged, never crash the page (Task 1 test "invalid rows are reported and skipped").
2. The Data API must return nothing for the `anon` key (verified live after `db push`: HTTP 401/403 or empty).
3. An upsert of an existing id must replace every column, including clearing `image_url` when the flyer was removed (Task 2 test "upsert merges on id and sends every column").
4. The public reader must request only `published=eq.true` rows (Task 2 test "listEvents filters published").
5. Deleting a replaced flyer must only ever target this project's bucket (Task 4 test).

---

### Task 1: Row mapper (pure)

**Files:** Create `src/lib/events/db-row.ts`, `src/lib/events/db-row.test.ts`. Modify `src/lib/events/event.ts` (remove `row`), `src/lib/events/sheet.ts` (stop setting `row`), and the fixtures in `board.test.ts`, `event-board.test.tsx`, `form.test.ts`, `sheet.test.ts`.

**Interfaces produced:**
```ts
export type EventRow = { id: string; title: string; description: string; date: string; start_time: string | null; end_time: string | null; location: string; category: string; image_url: string; image_alt: string; registration_url: string; status: string; published: boolean };
export const EVENT_COLUMNS: readonly (keyof EventRow)[];
export function eventFromRow(row: unknown, timeZone: string): { ok: true; event: ClubEvent } | { ok: false; problem: string };
export function rowFromCells(cells: EventCells): EventRow;
```
`eventFromRow` reuses `parseSheet([KNOWN_HEADERS, cellsFromRow])` so the rules stay in one place; a row the parser skips returns `{ ok: false, problem }` with the parser's message.

- [ ] Tests: a full row round-trips to the same event the form produces; `published: false` rows come back with `published: false`; invalid rows (bad date, bad time, empty title, non-object) are reported and skipped; `rowFromCells` maps `"TRUE"`/`"FALSE"`, lower-cases status, turns empty times into null.
- [ ] RED, implement, GREEN. Commit: `"Map Supabase event rows to and from the site's event model"`.

### Task 2: Supabase REST client

**Files:** Create `src/server/events/supabase.ts`, `src/server/events/supabase.test.ts`.

**Interfaces produced:**
```ts
export type SupabaseConfig = { url: string; secretKey: string; cacheSeconds: number };
export function readSupabaseConfig(env?: Record<string, string | undefined>): { ok: true; config: SupabaseConfig } | { ok: false; missing: string[] };
export class SupabaseError extends Error {}
export function createSupabaseClient(config, deps?: { fetch?: typeof fetch; timeoutMs?: number }): {
  listEvents(opts: { onlyPublished: boolean }): Promise<unknown[]>;
  upsertEvent(row: EventRow): Promise<void>;
  uploadFlyer(path: string, bytes: Buffer, contentType: string): Promise<void>;
  deleteFlyer(path: string): Promise<void>;
  publicFlyerUrl(path: string): string;
  flyerPathFromUrl(url: string): string | null;
};
```
Requests: `GET {url}/rest/v1/events?select=<columns>&order=date.asc&published=eq.true` (when onlyPublished); `POST {url}/rest/v1/events` with `Prefer: resolution=merge-duplicates,return=minimal` and `Content-Type: application/json`; `POST {url}/storage/v1/object/flyers/{path}` with `Content-Type` and `x-upsert: true`; `DELETE {url}/storage/v1/object/flyers/{path}`; public URL `{url}/storage/v1/object/public/flyers/{path}`.

- [ ] Tests with injected fetch: config (missing keys, `EVENTS_CACHE_SECONDS` default 300 min 30); header rules for `sb_secret_` vs `eyJ` keys; request URL, query and headers for each call; non-2xx → `SupabaseError` with status and no body echo; non-array list body → `SupabaseError`; timeout; `flyerPathFromUrl` only for this project's public bucket URL.
- [ ] RED, implement, GREEN. Commit: `"Talk to Supabase's REST and Storage APIs with the secret key"`.

### Task 3: Reader, loader, admin read

**Files:** Modify `src/server/events/events-reader.ts` (+test), `src/server/events/load-events.ts`, `src/server/admin/events.ts`.

- [ ] `events-reader.ts`: `ReaderDeps.fetchValues` becomes `fetchEvents: () => Promise<{ events: ClubEvent[]; problems: string[] }>`; it logs each problem with `warn`, keeps backoff/last-good exactly as now. `sheetCacheKey` renamed `storeCacheKey(url)`. Update its tests (same five behaviours, event-shaped fixtures) and run them RED→GREEN.
- [ ] `load-events.ts`: `readSupabaseConfig`, `createSupabaseClient`, `fetchEvents = async () => { const rows = await client.listEvents({ onlyPublished: true }); map with eventFromRow; return { events, problems } }`; cache key `["events-db", storeCacheKey(config.url)]`.
- [ ] `src/server/admin/events.ts`: `readAdminEvents(): Promise<{ ok: true; events: ClubEvent[]; problems: string[]; takenIds: string[] } | { ok: false; reason }>` from `listEvents({ onlyPublished: false })`; `getSupabaseClient()` lazy.
- [ ] `npm run typecheck` shows only `actions.ts`/`flyer-upload.ts` errors. Commit: `"Read events from Supabase on the public page and the admin list"`.

### Task 4: Flyers in Storage, actions, cleanup

**Files:** Modify `src/server/events/flyer-upload.ts` (+test), `src/app/admin/actions.ts`, `src/app/admin/page.tsx`, `src/app/admin/events/[id]/page.tsx`. Delete `google-jwt.ts`, `google-sheets.ts`, `sheet-writer.ts` and tests, `docs/events-template.csv`. `npm uninstall @vercel/blob`. Update `package.json` test list, `next.config.ts` comment, `.env.example`, `README.md`, `docs/events-google-sheet.md` → `docs/events-admin.md`, spec statuses.

- [ ] `flyer-upload.ts`: `storeFlyer(eventId, webp, client)` uploads `flyers/<id>-<hash8>.webp` via `client.uploadFlyer` and returns `client.publicFlyerUrl(path)`; `discardFlyer(url, client)` deletes only when `client.flyerPathFromUrl(url)` matches. Tests use a fake client. The `prepareFlyer` tests are unchanged.
- [ ] `actions.ts`: `saveEvent` → `readAdminEvents()`, `eventIdFor` with `takenIds`, validate, upload, `rowFromCells(cells)`, `client.upsertEvent(row)`, discard old flyer, `revalidateTag("events", "max")`, redirect. Remove `mergeRow`/sheet references. The edit page looks the event up by id from `readAdminEvents()`; the list shows `problems`.
- [ ] Remove Google env vars from Vercel (`vercel env rm` for the four, production and preview) and add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (production, preview; the key `--sensitive`).
- [ ] `npm run verify`, `npm run build`. Live: dev server lists the (empty) table; create an event with a flyer on `/admin`; confirm the row via REST, the object's public URL, and `/events` showing it. Playwright `site.spec.ts` + `admin.spec.ts` against `next start`.
- [ ] Commit: `"Store events and flyers in Supabase; retire the Google Sheet"`.
