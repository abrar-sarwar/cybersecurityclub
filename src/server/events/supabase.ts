/**
 * The site's only link to Supabase: PostgREST for the `events` table and the
 * Storage API for the `flyers` bucket, called with the project's secret key
 * from the server. Plain `fetch`, injected for tests; fixed-string errors
 * that carry a status and never a response body.
 */
import { EVENT_COLUMNS, type EventRow } from "@/lib/events/db-row";

const BUCKET = "flyers";
/** The only object names this site ever writes: `<event id>-<hash8>.webp`. Anything else is never deleted. */
const FLYER_OBJECT = /^[A-Za-z0-9_-]{1,64}-[0-9a-f]{8}\.webp$/;
const DEFAULT_CACHE_SECONDS = 300;
const MIN_CACHE_SECONDS = 30;
const DEFAULT_TIMEOUT_MS = 8000;
const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"] as const;

export type SupabaseConfig = { url: string; secretKey: string; cacheSeconds: number };
export type Fetch = typeof fetch;

export class SupabaseError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SupabaseError";
  }
}

export function readSupabaseConfig(env: Record<string, string | undefined> = process.env): { ok: true; config: SupabaseConfig } | { ok: false; missing: string[] } {
  const missing = REQUIRED_ENV.filter((key) => !env[key]?.trim());
  if (missing.length) return { ok: false, missing };
  const seconds = Number(env.EVENTS_CACHE_SECONDS ?? DEFAULT_CACHE_SECONDS);
  return {
    ok: true,
    config: {
      url: env.SUPABASE_URL!.trim().replace(/\/+$/, ""),
      secretKey: env.SUPABASE_SECRET_KEY!.trim(),
      cacheSeconds: Number.isFinite(seconds) && seconds >= MIN_CACHE_SECONDS ? Math.floor(seconds) : DEFAULT_CACHE_SECONDS,
    },
  };
}

/** New-style keys (`sb_secret_…`) go on `apikey` only; a legacy JWT key also needs the bearer header. */
export function authHeaders(secretKey: string): Record<string, string> {
  return secretKey.startsWith("eyJ") ? { apikey: secretKey, authorization: `Bearer ${secretKey}` } : { apikey: secretKey };
}

export function createSupabaseClient(config: SupabaseConfig, deps: { fetch?: Fetch; timeoutMs?: number } = {}) {
  const fetchImpl = deps.fetch ?? fetch;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const rest = `${config.url}/rest/v1/events`;
  const objectUrl = (path: string) => `${config.url}/storage/v1/object/${BUCKET}/${encodeURIComponent(path)}`;
  const publicPrefix = `${config.url}/storage/v1/object/public/${BUCKET}/`;

  async function call(url: string, init: RequestInit & { headers?: Record<string, string> }, what: string): Promise<Response> {
    const response = await fetchImpl(url, { ...init, headers: { ...authHeaders(config.secretKey), ...init.headers }, cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new SupabaseError(`Supabase ${what} answered ${response.status}`, response.status);
    return response;
  }

  return {
    /** Every row (or only published ones), soonest first. Rows are unknown until `eventFromRow` has read them. */
    async listEvents(opts: { onlyPublished: boolean }): Promise<unknown[]> {
      const url = new URL(rest);
      url.searchParams.set("select", EVENT_COLUMNS.join(","));
      url.searchParams.set("order", "date.asc,title.asc");
      if (opts.onlyPublished) url.searchParams.set("published", "eq.true");
      const response = await call(url.toString(), { method: "GET" }, "events read");
      const json = (await response.json().catch(() => null)) as unknown;
      if (!Array.isArray(json)) throw new SupabaseError("Supabase events read returned an unexpected body");
      return json;
    },
    /** Creates a row; a duplicate id is a 409 `SupabaseError`. */
    async insertEvent(row: EventRow): Promise<void> {
      await call(rest, { method: "POST", headers: { "content-type": "application/json", prefer: "return=minimal" }, body: JSON.stringify(row) }, "events insert");
    },
    /** Creates or replaces the row with this id, every column. */
    async upsertEvent(row: EventRow): Promise<void> {
      await call(rest, { method: "POST", headers: { "content-type": "application/json", prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) }, "events write");
    },
    async uploadFlyer(path: string, bytes: Buffer, contentType: string): Promise<void> {
      await call(objectUrl(path), { method: "POST", headers: { "content-type": contentType, "x-upsert": "true" }, body: new Uint8Array(bytes) }, "flyer upload");
    },
    async deleteFlyer(path: string): Promise<void> {
      await call(objectUrl(path), { method: "DELETE" }, "flyer delete");
    },
    publicFlyerUrl(path: string): string {
      return publicPrefix + path;
    },
    /** The object name when `url` is one of this project's public flyer URLs in the shape this site writes, otherwise null. */
    flyerPathFromUrl(url: string): string | null {
      if (!url.startsWith(publicPrefix)) return null;
      const path = url.slice(publicPrefix.length);
      return FLYER_OBJECT.test(path) ? path : null;
    },
  };
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
