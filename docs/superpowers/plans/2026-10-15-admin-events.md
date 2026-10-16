# Officer Admin Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A password-protected `/admin` where officers add and edit events in a form, upload a flyer, and have the row written into the Google Sheet the site already reads.

**Architecture:** Pure modules (`form.ts`, `session.ts`, `password.ts`, `rate-limit.ts`, parser option) carry the logic and are unit tested. Server modules (`sheet-writer.ts`, `flyer-upload.ts`, `auth.ts`) wrap the Sheets API, sharp and Vercel Blob with injected dependencies. Server Actions in `src/app/admin/actions.ts` compose them; pages are Server Components with two small client form components.

**Tech Stack:** Next.js 16.3.5 App Router (Server Actions, `useActionState`, `cookies()`, `revalidateTag(tag, "max")`), `node:crypto`, `sharp` (already a dependency), `@vercel/blob` (new, exact-pinned), `node:test` via `tsx`, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-15-admin-events-design.md`

## Global Constraints

- `revalidateTag` takes two arguments in Next 16: `revalidateTag("events", "max")`.
- `cookies()` and `headers()` are async.
- Modules under `src/lib/` and the three pure `src/server/admin/` modules (`session.ts`, `password.ts`, `rate-limit.ts`) import nothing from Next.js so `tsx --test` can load them. `src/proxy.ts` imports `session.ts`, so it must stay free of `server-only`.
- Writes use `valueInputOption=RAW`. Never `USER_ENTERED`.
- Flyer cap is 4 MB (Vercel's request body limit is 4.5 MB); `serverActions.bodySizeLimit` is `"5mb"`.
- No secret is ever logged or rendered. Error messages to the browser are fixed strings.
- Commit messages carry no Claude attribution lines.

## Review Focus

1. A title typed as `=HYPERLINK(...)` or `+1` must land in the sheet as literal text, never as a formula (Task 4 test "append sends RAW values").
2. An expired or tampered session cookie must redirect to the login page, and changing the password must sign everyone out (Task 2 tests).
3. A file renamed from `.exe` or `.html` to `.png` must be rejected before anything is stored (Task 5 test "non-images are rejected whatever their name").
4. Editing an event whose sheet row has an extra column the site does not know must keep that column's value (Task 4 test "update overlays known columns only").
5. Two officers saving a new event with the same title and date must get different `event_id`s (Task 3 test "eventIdFor is unique").

---

### Task 1: Parser option, model fields, config

**Files:**
- Modify: `src/lib/events/event.ts` (add `published: boolean; row: number`)
- Modify: `src/lib/events/sheet.ts` (export `normaliseHeader`; option `includeUnpublished`; set `published` and `row`)
- Modify: `src/lib/events/sheet.test.ts`, `src/lib/events/board.test.ts`, `src/components/site/event-board.test.tsx` (fixtures gain the two fields)
- Modify: `next.config.ts`, `.env.example`, `src/app/robots.ts`

- [ ] **Step 1: Failing test** (append to `sheet.test.ts`):

```ts
test("includeUnpublished keeps hidden rows and marks each event with published and its sheet row", () => {
  const values = sheet({ ...base, published: "FALSE" }, { ...base, event_id: "b" });
  const { events } = parseSheet(values, { timeZone: NY, includeUnpublished: true });
  assert.deepEqual(events.map((e) => [e.id, e.published, e.row]), [["gbm-1", false, 2], ["b", true, 3]]);
  const onlyPublished = parseSheet(values, { timeZone: NY });
  assert.deepEqual(onlyPublished.events.map((e) => [e.id, e.published, e.row]), [["b", true, 3]]);
});
```

- [ ] **Step 2:** Run `npx tsx --test src/lib/events/sheet.test.ts` → FAIL (option ignored, fields undefined).
- [ ] **Step 3:** Implement. In `event.ts` add `/** False only when parsed with includeUnpublished. */ published: boolean;` and `/** 1-based row in the sheet. */ row: number;`. In `sheet.ts`:
  - `export const normaliseHeader = (cell: unknown) => cleanText(cell).toLowerCase().replace(/\s+/g, "_");` and use it in `headerIndex`.
  - Signature `parseSheet(values, options: { timeZone: string; includeUnpublished?: boolean })`.
  - Replace `if (!parsePublished(cell("published"))) return;` with `const published = parsePublished(cell("published")); if (!published && !options.includeUnpublished) return;`.
  - Push `published` and `row` into the event object.
  Update the three test fixtures (`make`, `event`) with `published: true, row: 2`.
- [ ] **Step 4:** `npx tsx --test src/lib/events/sheet.test.ts src/lib/events/board.test.ts src/components/site/event-board.test.tsx` → PASS.
- [ ] **Step 5:** Config. `next.config.ts`: add `experimental: { serverActions: { bodySizeLimit: "5mb" } }` with the comment `// Flyer uploads travel inside a Server Action; Vercel caps request bodies at 4.5 MB.` `.env.example`: append

```
# Officer admin page at /admin (one shared login). Both required; keep secret.
# Changing the password signs every officer out. See docs/events-google-sheet.md.
ADMIN_PASSWORD=""
ADMIN_SESSION_SECRET=""
# Vercel Blob store for flyer uploads; set automatically when the store is connected to the project.
BLOB_READ_WRITE_TOKEN=""
```

  `src/app/robots.ts`: add `disallow: ["/admin"]` to the rules (read the file first and keep its shape).
- [ ] **Step 6:** `npm run typecheck` → clean. Commit: `git commit -m "Let the sheet parser keep unpublished rows for the admin page"`.

### Task 2: Session, password and rate limit (pure)

**Files:** Create `src/server/admin/session.ts`, `password.ts`, `rate-limit.ts` and their three tests.

**Interfaces produced:**
- `session.ts`: `SESSION_COOKIE = "admin_session"`, `SESSION_TTL_MS = 12 * 3_600_000`, `passwordTag(password: string): string`, `createSession(opts: { secret: string; passwordTag: string; now?: number }): string`, `verifySession(token: string | undefined, opts: { secret: string; passwordTag: string; now?: number }): { ok: true; expiresAt: number } | { ok: false; reason: "missing" | "malformed" | "signature" | "expired" | "password-changed" }`.
- `password.ts`: `readAdminConfig(env?: Record<string, string | undefined>): { ok: true; password: string; secret: string } | { ok: false; missing: string[] }`, `comparePassword(submitted: string, expected: string): boolean`.
- `rate-limit.ts`: `createRateLimiter(opts: { limit: number; windowMs: number; now?: () => number; maxKeys?: number }): { hit(key: string): { ok: boolean; retryAfterMs: number }; reset(key: string): void }`.

- [ ] **Step 1: Tests**

```ts
// src/server/admin/session.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { createSession, passwordTag, SESSION_TTL_MS, verifySession } from "./session";

const secret = "a".repeat(64);
const pw = passwordTag("correct horse battery staple");
const t0 = 1_700_000_000_000;

test("a fresh session verifies and carries its expiry", () => {
  const token = createSession({ secret, passwordTag: pw, now: t0 });
  assert.deepEqual(verifySession(token, { secret, passwordTag: pw, now: t0 + 1000 }), { ok: true, expiresAt: t0 + SESSION_TTL_MS });
});

test("missing, malformed, tampered, expired and password-changed tokens are rejected with a reason", () => {
  const token = createSession({ secret, passwordTag: pw, now: t0 });
  const [payload, sig] = token.split(".");
  assert.deepEqual(verifySession(undefined, { secret, passwordTag: pw, now: t0 }), { ok: false, reason: "missing" });
  assert.deepEqual(verifySession("nonsense", { secret, passwordTag: pw, now: t0 }), { ok: false, reason: "malformed" });
  assert.deepEqual(verifySession(`${payload}.${sig.slice(0, -2)}xx`, { secret, passwordTag: pw, now: t0 }), { ok: false, reason: "signature" });
  assert.deepEqual(verifySession(token, { secret: "b".repeat(64), passwordTag: pw, now: t0 }), { ok: false, reason: "signature" });
  assert.deepEqual(verifySession(token, { secret, passwordTag: pw, now: t0 + SESSION_TTL_MS + 1 }), { ok: false, reason: "expired" });
  assert.deepEqual(verifySession(token, { secret, passwordTag: passwordTag("new password 123"), now: t0 }), { ok: false, reason: "password-changed" });
});

test("the password tag does not reveal the password", () => {
  assert.match(pw, /^[0-9a-f]{12}$/);
  assert.notEqual(passwordTag("x"), passwordTag("y"));
});
```

```ts
// src/server/admin/password.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { comparePassword, readAdminConfig } from "./password";

test("config needs a 12+ character password and a 32+ byte hex secret", () => {
  const ok = readAdminConfig({ ADMIN_PASSWORD: "correct horse battery", ADMIN_SESSION_SECRET: "f".repeat(64) });
  assert.deepEqual(ok, { ok: true, password: "correct horse battery", secret: "f".repeat(64) });
  assert.deepEqual(readAdminConfig({}), { ok: false, missing: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"] });
  assert.deepEqual(readAdminConfig({ ADMIN_PASSWORD: "short", ADMIN_SESSION_SECRET: "f".repeat(64) }), { ok: false, missing: ["ADMIN_PASSWORD"] });
  assert.deepEqual(readAdminConfig({ ADMIN_PASSWORD: "correct horse battery", ADMIN_SESSION_SECRET: "tooshort" }), { ok: false, missing: ["ADMIN_SESSION_SECRET"] });
});

test("comparePassword accepts only the exact password", () => {
  assert.equal(comparePassword("correct horse battery", "correct horse battery"), true);
  assert.equal(comparePassword("correct horse batterY", "correct horse battery"), false);
  assert.equal(comparePassword("", "correct horse battery"), false);
  assert.equal(comparePassword("correct horse battery ", "correct horse battery"), false);
});
```

```ts
// src/server/admin/rate-limit.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { createRateLimiter } from "./rate-limit";

test("allows `limit` hits per window per key, then refuses with a retry time, then recovers", () => {
  let clock = 0;
  const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: () => clock });
  assert.equal(limiter.hit("a").ok, true);
  assert.equal(limiter.hit("a").ok, true);
  assert.equal(limiter.hit("a").ok, true);
  const refused = limiter.hit("a");
  assert.equal(refused.ok, false);
  assert.equal(refused.retryAfterMs, 1000);
  assert.equal(limiter.hit("b").ok, true);
  clock = 1001;
  assert.equal(limiter.hit("a").ok, true);
});

test("reset forgets a key and the key count is capped", () => {
  const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0, maxKeys: 2 });
  limiter.hit("a");
  assert.equal(limiter.hit("a").ok, false);
  limiter.reset("a");
  assert.equal(limiter.hit("a").ok, true);
  limiter.hit("b");
  limiter.hit("c"); // evicts the oldest key rather than growing forever
  assert.equal(limiter.hit("a").ok, true);
});
```

- [ ] **Step 2:** Run the three → FAIL (modules missing).
- [ ] **Step 3: Implement**

```ts
// src/server/admin/session.ts
/**
 * The admin session cookie value: `base64url(JSON{exp, pw}).base64url(HMAC-SHA256)`.
 * `pw` is a short hash of the current password, so changing the password
 * invalidates every session. Pure: usable from the proxy and from tests.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_MS = 12 * 3_600_000;

type Payload = { exp: number; pw: string };

export function passwordTag(password: string): string {
  return createHash("sha256").update(password).digest("hex").slice(0, 12);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSession(opts: { secret: string; passwordTag: string; now?: number }): string {
  const exp = (opts.now ?? Date.now()) + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp, pw: opts.passwordTag } satisfies Payload)).toString("base64url");
  return `${payload}.${sign(payload, opts.secret)}`;
}

export function verifySession(
  token: string | undefined,
  opts: { secret: string; passwordTag: string; now?: number },
): { ok: true; expiresAt: number } | { ok: false; reason: "missing" | "malformed" | "signature" | "expired" | "password-changed" } {
  if (!token) return { ok: false, reason: "missing" };
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "malformed" };
  const [payload, signature] = parts;
  const expected = Buffer.from(sign(payload, opts.secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "signature" };
  let data: Payload;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Payload;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof data.exp !== "number" || typeof data.pw !== "string") return { ok: false, reason: "malformed" };
  if (data.exp <= (opts.now ?? Date.now())) return { ok: false, reason: "expired" };
  if (data.pw !== opts.passwordTag) return { ok: false, reason: "password-changed" };
  return { ok: true, expiresAt: data.exp };
}
```

```ts
// src/server/admin/password.ts
import { createHash, timingSafeEqual } from "node:crypto";

const MIN_PASSWORD = 12;
const MIN_SECRET = 64; // 32 bytes as hex

export function readAdminConfig(env: Record<string, string | undefined> = process.env): { ok: true; password: string; secret: string } | { ok: false; missing: string[] } {
  const password = env.ADMIN_PASSWORD ?? "";
  const secret = env.ADMIN_SESSION_SECRET?.trim() ?? "";
  const missing: string[] = [];
  if (password.length < MIN_PASSWORD) missing.push("ADMIN_PASSWORD");
  if (secret.length < MIN_SECRET) missing.push("ADMIN_SESSION_SECRET");
  if (missing.length) return { ok: false, missing };
  return { ok: true, password, secret };
}

/** Constant time: both sides are hashed to equal length before comparison. */
export function comparePassword(submitted: string, expected: string): boolean {
  const a = createHash("sha256").update(submitted).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b) && submitted.length === expected.length;
}
```

```ts
// src/server/admin/rate-limit.ts
/** Sliding-window counter per key, in memory. Per server instance, which is enough for a club site. */
export function createRateLimiter(opts: { limit: number; windowMs: number; now?: () => number; maxKeys?: number }) {
  const now = opts.now ?? Date.now;
  const maxKeys = opts.maxKeys ?? 1000;
  const hits = new Map<string, number[]>();
  return {
    hit(key: string): { ok: boolean; retryAfterMs: number } {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((at) => at > t - opts.windowMs);
      if (recent.length >= opts.limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterMs: recent[0] + opts.windowMs - t };
      }
      recent.push(t);
      hits.delete(key);
      if (hits.size >= maxKeys) hits.delete(hits.keys().next().value as string);
      hits.set(key, recent);
      return { ok: true, retryAfterMs: 0 };
    },
    reset(key: string) {
      hits.delete(key);
    },
  };
}
```

- [ ] **Step 4:** Tests PASS. Commit: `"Add the admin session cookie, password check and rate limiter"`.

### Task 3: Form parsing and validation (pure)

**Files:** Create `src/lib/events/form.ts`, `src/lib/events/form.test.ts`.

**Interfaces produced:**
- `FORM_FIELDS`, `type EventFormValues = Record<FormField, string>` (`published` is `"on"` or `""`).
- `readForm(form: FormData): EventFormValues` (cleanText applied; `description` multiline).
- `cellsFor(values: EventFormValues, extra: { eventId: string; imageUrl: string | null }): Record<KnownHeader, string>` — the 13 known headers as strings (`published` → `"TRUE"`/`"FALSE"`, `status` capitalised, times as entered).
- `validateEvent(values, extra, timeZone): { ok: true; cells: Record<KnownHeader, string>; event: ClubEvent } | { ok: false; errors: Record<string, string> }` — runs `parseSheet([headers, row], { timeZone, includeUnpublished: true })`; any problem becomes an error on its field (`start_time` etc.), a skipped row becomes an error on the reported field, and a missing `date` or `title` reports `"Required"`.
- `eventIdFor(title: string, date: string, taken: Iterable<string>): string` — `slug(title)-date`, max 64 chars, with `-2`, `-3` suffixes when taken.
- `formValuesFrom(event: ClubEvent): EventFormValues` for the edit form.

- [ ] **Step 1: Tests** cover: `readForm` trims and keeps description line breaks; `cellsFor` emits TRUE/FALSE and the image URL; `validateEvent` happy path returns an event with instants; errors for missing title, bad date, bad time, end before start, bad registration URL (the form rejects what the sheet would merely drop), over-long title; `eventIdFor` ("Résumé Workshop!", "2026-09-22") → `resume-workshop-2026-09-22`, uniqueness suffixing, 64-char cap; `formValuesFrom` round-trips through `validateEvent`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement (use `cleanText`, `OPTIONAL_HEADERS`, `REQUIRED_HEADERS`, `SHEET_LIMITS`, `parseSheet` from `./sheet`; slug: NFKD normalise, strip diacritics, lowercase, non-alphanumerics to `-`, collapse, trim `-`). **Step 4:** PASS. Commit: `"Validate the admin event form with the sheet parser's own rules"`.

### Task 4: Sheet writer

**Files:** Create `src/server/events/sheet-writer.ts`, `src/server/events/sheet-writer.test.ts`.

**Interfaces produced:** `SHEETS_WRITE_SCOPE`, `mergeRow(header: readonly unknown[], existing: readonly unknown[], known: Record<string, string>): unknown[]` (pure), `createSheetWriter(config: SheetsConfig, deps?: { fetch?: Fetch; now?: () => number; timeoutMs?: number }): { readAll(): Promise<{ header: unknown[]; rows: unknown[][] }>; append(cells: readonly unknown[]): Promise<void>; update(row: number, cells: readonly unknown[]): Promise<void> }`.

- [ ] **Step 1: Tests** with injected fetch: `readAll` splits header and rows and uses the same value render options as the reader; `append` POSTs to `.../values/'Events'!A1:Z501:append` with `valueInputOption=RAW` and `insertDataOption=INSERT_ROWS` and a body `{ majorDimension: "ROWS", values: [[...]] }` ("append sends RAW values": a title `=HYPERLINK("x")` is sent verbatim and the query has no USER_ENTERED); `update` PUTs `.../values/'Events'!A7:Z7?valueInputOption=RAW`; `mergeRow` keeps unknown columns and the header order ("update overlays known columns only"); non-200 → `SheetsError`; token scope requested is `spreadsheets` (assert the JWT claims in the token request body contain the write scope).
- [ ] **Step 2:** FAIL. **Step 3:** Implement (reuse `createTokenSource`, `valuesRange`, `SheetsError`, `normaliseHeader`; range for `update` is `'<tab>'!A<row>:Z<row>` built from the tab part of `valuesRange`; 8 s timeout). **Step 4:** PASS. Commit: `"Write event rows back to the sheet"`.

### Task 5: Flyer upload

**Files:** Create `src/server/events/flyer-upload.ts`, `src/server/events/flyer-upload.test.ts`.

**Interfaces produced:** `FLYER_LIMITS = { maxBytes: 4 * 1024 * 1024, minPx: 200, maxPx: 1600 }`, `class FlyerError extends Error`, `prepareFlyer(bytes: Uint8Array): Promise<{ webp: Buffer; width: number; height: number }>`, `flyerPathname(eventId: string, webp: Buffer): string`, `isBlobUrl(url: string): boolean`, `storeFlyer(eventId: string, webp: Buffer, deps?: { put?: typeof put }): Promise<string>`, `discardFlyer(url: string | null, deps?: { del?: typeof del }): Promise<void>`.

- [ ] **Step 1: Tests** (generate inputs with sharp in the test): a 2400×1800 PNG → WebP 1600×1200 with no EXIF; a 300×300 JPEG with EXIF orientation is rotated and stripped; a WebP passes through re-encoded; a 100×100 PNG → `FlyerError` (too small); 4 MB + 1 byte → `FlyerError`; an SVG, an HTML file and random bytes → `FlyerError` ("non-images are rejected whatever their name"); `flyerPathname("gbm-2026", buf)` matches `/^flyers\/gbm-2026-[0-9a-f]{8}\.webp$/`; `isBlobUrl` true only for `https://*.public.blob.vercel-storage.com/...`; `storeFlyer` calls the injected `put` with `access: "public"`, `contentType: "image/webp"`, `addRandomSuffix: false` and returns its url; `discardFlyer` calls `del` only for Blob URLs and swallows its errors.
- [ ] **Step 2:** FAIL. **Step 3:** Implement with `sharp(bytes, { limitInputPixels: 40_000_000 })`, `.metadata()` format allow-list `png|jpeg|webp`, `.rotate().resize({ width: maxPx, height: maxPx, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true })`; wrap sharp errors in `FlyerError("That file is not a PNG, JPEG or WebP image")`. **Step 4:** PASS. Commit: `"Check, resize and store uploaded flyers"`.

### Task 6: Auth helpers, actions, pages, proxy, CSS

**Files:**
- Create: `src/server/admin/auth.ts`, `src/server/admin/events.ts`, `src/server/admin/request-ip.ts`
- Create: `src/app/admin/actions.ts`, `src/app/admin/layout.tsx`, `src/app/admin/admin.css`, `src/app/admin/page.tsx`, `src/app/admin/login/page.tsx`, `src/app/admin/events/new/page.tsx`, `src/app/admin/events/[id]/page.tsx`
- Create: `src/components/admin/login-form.tsx`, `src/components/admin/event-form.tsx`, `src/components/admin/not-configured.tsx`
- Modify: `src/proxy.ts`

Behaviour (see spec): `requireAdmin()` redirects to `/admin/login`; `signIn` rate limits 5 per 15 min per IP and sets the cookie (`httpOnly`, `secure` outside development, `sameSite: "lax"`, `path: "/admin"`, `maxAge: 43200`); `saveEvent` requires admin, rate limits 30 per 10 min per session, validates, uploads, writes, `revalidateTag("events", "max")`, redirects to `/admin?saved=<id>`; the proxy adds `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow` on `/admin*` and redirects unauthenticated requests (cookie absent or failing `verifySession`) except for `/admin/login`. Pages render `NotConfigured` when `readAdminConfig` fails. The event form posts `multipart/form-data` with the `flyer` file input; `useActionState` returns `{ errors, message, values }`.

- [ ] **Step 1:** Implement all files. Keep the CSS to form layout, field errors, badges and the list, using the site's existing tokens (`--color-*`, `--font-*`) and `.btn-cyber` buttons through `Button`/`ButtonLink`.
- [ ] **Step 2:** `npm run verify` and `npm run build` pass.
- [ ] **Step 3:** Manual check on the dev server: `/admin` redirects to `/admin/login`; wrong password shows the message; right password lands on the list showing the sheet's rows including the unpublished example; edit the example row's title, save, confirm the sheet changed (Drive snippet or API) and `/events` reflects it after the save; upload a flyer (use `public/assets/events/general-body.webp`), confirm a `*.public.blob.vercel-storage.com` URL in `image_url` and the image on `/events`.
- [ ] **Step 4:** Commit: `"Add the officer admin page: shared login, event form, flyer upload"`.

### Task 7: E2E, docs, memory

- [ ] `e2e/admin.spec.ts`: signed-out `/admin` → 307/308 to `/admin/login`; `/admin/login` responds 200 with `cache-control: private, no-store` and `x-robots-tag: noindex, nofollow`; POSTing a wrong password keeps the login page; signing in with `process.env.ADMIN_PASSWORD` reaches `/admin` (skip with a note when the env var is absent).
- [ ] `docs/events-google-sheet.md`: new first section "The admin page" for officers; maintainer section gains the three env vars, the Blob store, password rotation and the shared-login tradeoffs. `README.md`: mention `/admin`. Spec: fix the flyer cap to 4 MB.
- [ ] `npm run verify`, `npm run build`, Playwright against `next start`. Commit: `"Document the admin page and cover it with a smoke test"`.
