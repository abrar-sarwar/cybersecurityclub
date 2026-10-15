import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { TOKEN_URL } from "./google-jwt";
import { readSheetsConfig, SheetsError, type SheetsConfig } from "./google-sheets";
import { createSheetWriter, mergeRow, SHEETS_WRITE_SCOPE } from "./sheet-writer";

const pem = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }) as string;
const config = (() => {
  const r = readSheetsConfig({ GOOGLE_SHEETS_SPREADSHEET_ID: "1abcDEF", GOOGLE_SERVICE_ACCOUNT_EMAIL: "svc@p.iam.gserviceaccount.com", GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: pem });
  assert.ok(r.ok);
  return r.config as SheetsConfig;
})();
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
type Call = { url: string; init: RequestInit };

function fakeFetch(answer: (url: URL, init: RequestInit) => Response) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    if (String(url) === TOKEN_URL) return ok({ access_token: "tok", expires_in: 3600 });
    return answer(new URL(String(url)), init ?? {});
  }) as typeof fetch;
  return { calls, fetchImpl };
}

test("mergeRow overlays known columns and keeps everything else", () => {
  const header = ["event_id", " Title ", "notes", "date", "published"];
  const existing = ["a", "Old", "keep me", 46267];
  const merged = mergeRow(header, existing, { event_id: "a", title: "New", date: "2026-02-02", published: "TRUE", unknown_key: "ignored" });
  assert.deepEqual(merged, ["a", "New", "keep me", "2026-02-02", "TRUE"]);
});

test("readAll splits the header from the rows with the reader's render options", async () => {
  const { calls, fetchImpl } = fakeFetch(() => ok({ values: [["event_id", "title"], ["a", "A"], ["b", "B"]] }));
  const writer = createSheetWriter(config, { fetch: fetchImpl });
  assert.deepEqual(await writer.readAll(), { header: ["event_id", "title"], rows: [["a", "A"], ["b", "B"]] });
  const url = new URL(calls[1].url);
  assert.equal(url.searchParams.get("valueRenderOption"), "UNFORMATTED_VALUE");
  assert.equal(url.searchParams.get("dateTimeRenderOption"), "SERIAL_NUMBER");
  const empty = createSheetWriter(config, { fetch: fakeFetch(() => ok({})).fetchImpl });
  assert.deepEqual(await empty.readAll(), { header: [], rows: [] });
});

test("the writer signs in with the read-write Sheets scope", async () => {
  const { calls, fetchImpl } = fakeFetch(() => ok({ values: [] }));
  await createSheetWriter(config, { fetch: fetchImpl }).readAll();
  const assertion = new URLSearchParams(String(calls[0].init.body)).get("assertion")!;
  const claims = JSON.parse(Buffer.from(assertion.split(".")[1], "base64url").toString("utf8"));
  assert.equal(claims.scope, SHEETS_WRITE_SCOPE);
  assert.equal(SHEETS_WRITE_SCOPE, "https://www.googleapis.com/auth/spreadsheets");
});

test("append sends RAW values after the table", async () => {
  const { calls, fetchImpl } = fakeFetch(() => ok({ updates: { updatedRows: 1 } }));
  const cells = ['=HYPERLINK("https://evil.example","click")', "+1", "2026-09-22"];
  await createSheetWriter(config, { fetch: fetchImpl }).append(cells);
  const url = new URL(calls[1].url);
  assert.equal(url.origin + url.pathname, "https://sheets.googleapis.com/v4/spreadsheets/1abcDEF/values/'Events'!A1%3AZ501:append");
  assert.equal(url.searchParams.get("valueInputOption"), "RAW");
  assert.equal(url.searchParams.get("insertDataOption"), "INSERT_ROWS");
  assert.equal(calls[1].init.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[1].init.body)), { majorDimension: "ROWS", values: [cells] });
  assert.equal(new Headers(calls[1].init.headers).get("authorization"), "Bearer tok");
});

test("update writes one whole row in place with RAW values", async () => {
  const { calls, fetchImpl } = fakeFetch(() => ok({ updatedRows: 1 }));
  await createSheetWriter(config, { fetch: fetchImpl }).update(7, ["a", "New"]);
  const url = new URL(calls[1].url);
  assert.equal(url.origin + url.pathname, "https://sheets.googleapis.com/v4/spreadsheets/1abcDEF/values/'Events'!A7%3AZ7");
  assert.equal(url.searchParams.get("valueInputOption"), "RAW");
  assert.equal(calls[1].init.method, "PUT");
  assert.deepEqual(JSON.parse(String(calls[1].init.body)), { majorDimension: "ROWS", values: [["a", "New"]] });
});

test("a rejected write is a SheetsError with the status", async () => {
  const writer = createSheetWriter(config, { fetch: fakeFetch(() => new Response("no", { status: 403 })).fetchImpl });
  await assert.rejects(writer.append(["x"]), (e: unknown) => e instanceof SheetsError && String(e).includes("403"));
  await assert.rejects(writer.update(2, ["x"]), SheetsError);
});
