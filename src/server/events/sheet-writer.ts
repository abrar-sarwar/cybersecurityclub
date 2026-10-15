/**
 * Writes event rows back to the officers' sheet. Separate from the reader so
 * the public site keeps its read-only token; this one signs in with the
 * read-write scope. Values are always written RAW, so nothing typed into the
 * admin form can become a formula.
 */
import { normaliseHeader } from "@/lib/events/sheet";
import { createTokenSource, type Fetch } from "./google-jwt";
import { SheetsError, type SheetsConfig, valuesRange } from "./google-sheets";

export const SHEETS_WRITE_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const DEFAULT_TIMEOUT_MS = 8000;

export type SheetWriter = {
  /** The header row and every data row, uncached, with the reader's render options so parsing is identical. */
  readAll(): Promise<{ header: unknown[]; rows: unknown[][] }>;
  append(cells: readonly unknown[]): Promise<void>;
  /** Replaces one whole row (1-based sheet row number). */
  update(row: number, cells: readonly unknown[]): Promise<void>;
};

/** A full row for `update`: known columns from `known`, every other column kept from `existing`. */
export function mergeRow(header: readonly unknown[], existing: readonly unknown[], known: Record<string, string>): unknown[] {
  return header.map((cell, i) => {
    const name = normaliseHeader(cell);
    return name in known ? known[name] : (existing[i] ?? "");
  });
}

export function createSheetWriter(config: SheetsConfig, deps: { fetch?: Fetch; now?: () => number; timeoutMs?: number } = {}): SheetWriter {
  const fetchImpl = deps.fetch ?? fetch;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const getToken = createTokenSource({ clientEmail: config.clientEmail, privateKey: config.privateKey }, SHEETS_WRITE_SCOPE, { fetch: fetchImpl, now: deps.now });
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/`;
  const tableRange = valuesRange(config.range);
  const tab = tableRange.slice(0, tableRange.indexOf("!"));

  async function call(method: "GET" | "POST" | "PUT", range: string, query: Record<string, string>, body?: unknown): Promise<unknown> {
    const signal = AbortSignal.timeout(timeoutMs);
    const token = await getToken(signal);
    const url = new URL(base + range);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    const response = await fetchImpl(url, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal,
    });
    if (!response.ok) throw new SheetsError(`Sheets API answered ${response.status}`);
    return response.json().catch(() => null);
  }

  return {
    async readAll() {
      const json = (await call("GET", encodeURIComponent(tableRange), { majorDimension: "ROWS", valueRenderOption: "UNFORMATTED_VALUE", dateTimeRenderOption: "SERIAL_NUMBER" })) as { values?: unknown } | null;
      const values = json && Array.isArray(json.values) && json.values.every(Array.isArray) ? (json.values as unknown[][]) : [];
      const [header = [], ...rows] = values;
      return { header, rows };
    },
    async append(cells) {
      await call("POST", `${encodeURIComponent(tableRange)}:append`, { valueInputOption: "RAW", insertDataOption: "INSERT_ROWS" }, { majorDimension: "ROWS", values: [cells] });
    },
    async update(row, cells) {
      await call("PUT", encodeURIComponent(`${tab}!A${row}:Z${row}`), { valueInputOption: "RAW" }, { majorDimension: "ROWS", values: [cells] });
    },
  };
}
