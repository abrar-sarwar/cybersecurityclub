/**
 * Reads the officers' sheet through the Sheets API v4 with a read-only
 * service account. Configuration comes from the environment; `fetch` can be
 * injected so tests never touch the network.
 */
import { SHEET_LIMITS } from "@/lib/events/sheet";
import { createTokenSource, normalisePrivateKey, type Fetch } from "./google-jwt";

export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const DEFAULT_RANGE = "Events";
const DEFAULT_CACHE_SECONDS = 300;
const MIN_CACHE_SECONDS = 30;
const DEFAULT_TIMEOUT_MS = 8000;
const REQUIRED_ENV = ["GOOGLE_SHEETS_SPREADSHEET_ID", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"] as const;

export type SheetsConfig = {
  spreadsheetId: string;
  /** A tab name, or a full A1 range when it contains `!`. */
  range: string;
  clientEmail: string;
  privateKey: string;
  cacheSeconds: number;
};

export class SheetsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetsError";
  }
}

export function readSheetsConfig(env: NodeJS.ProcessEnv = process.env): { ok: true; config: SheetsConfig } | { ok: false; missing: string[] } {
  const missing = REQUIRED_ENV.filter((key) => !env[key]?.trim());
  if (missing.length) return { ok: false, missing };
  const seconds = Number(env.EVENTS_CACHE_SECONDS ?? DEFAULT_CACHE_SECONDS);
  return {
    ok: true,
    config: {
      spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID!.trim(),
      range: env.GOOGLE_SHEETS_RANGE?.trim() || DEFAULT_RANGE,
      clientEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL!.trim(),
      privateKey: normalisePrivateKey(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!),
      cacheSeconds: Number.isFinite(seconds) && seconds >= MIN_CACHE_SECONDS ? Math.floor(seconds) : DEFAULT_CACHE_SECONDS,
    },
  };
}

/** A tab name becomes `'Name'!A1:Z<rows+1>`; a range that already has a `!` is used as given. */
export function valuesRange(range: string): string {
  if (range.includes("!")) return range;
  return `'${range.replace(/'/g, "''")}'!A1:Z${SHEET_LIMITS.rows + 1}`;
}

export function createSheetsClient(config: SheetsConfig, deps: { fetch?: Fetch; now?: () => number; timeoutMs?: number } = {}) {
  const fetchImpl = deps.fetch ?? fetch;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const getToken = createTokenSource({ clientEmail: config.clientEmail, privateKey: config.privateKey }, SHEETS_SCOPE, { fetch: fetchImpl, now: deps.now });
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${encodeURIComponent(valuesRange(config.range))}`);
  url.searchParams.set("majorDimension", "ROWS");
  url.searchParams.set("valueRenderOption", "UNFORMATTED_VALUE");
  url.searchParams.set("dateTimeRenderOption", "SERIAL_NUMBER");

  return {
    /** The sheet's cells, header row first. Rows are ragged: Google omits trailing empty cells. */
    async fetchValues(): Promise<unknown[][]> {
      const signal = AbortSignal.timeout(timeoutMs);
      const token = await getToken(signal);
      const response = await fetchImpl(url, { headers: { authorization: `Bearer ${token}` }, cache: "no-store", signal });
      if (!response.ok) throw new SheetsError(`Sheets API answered ${response.status}`);
      const json = (await response.json().catch(() => null)) as { values?: unknown } | null;
      if (!json || typeof json !== "object") throw new SheetsError("Sheets API returned an unexpected body");
      const values = json.values ?? [];
      if (!Array.isArray(values) || !values.every(Array.isArray)) throw new SheetsError("Sheets API returned an unexpected body");
      return values as unknown[][];
    },
  };
}
