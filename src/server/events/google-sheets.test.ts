import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { TOKEN_URL } from "./google-jwt";
import { createSheetsClient, readSheetsConfig, type SheetsConfig, SheetsError, valuesRange } from "./google-sheets";

const pem = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }) as string;
const env = {
  GOOGLE_SHEETS_SPREADSHEET_ID: "1abcDEF",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "svc@p.iam.gserviceaccount.com",
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: pem.replace(/\n/g, "\\n"),
};
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const configOf = (e: Record<string, string | undefined>): SheetsConfig => {
  const r = readSheetsConfig(e);
  assert.ok(r.ok, "config should read");
  return r.config;
};

test("config reads the env, defaults the range and cache, and names what is missing", () => {
  const config = configOf(env);
  assert.equal(config.range, "Events");
  assert.equal(config.cacheSeconds, 300);
  assert.equal(config.privateKey, pem.trim());
  assert.deepEqual(configOf({ ...env, EVENTS_CACHE_SECONDS: "45", GOOGLE_SHEETS_RANGE: "Fall 2026" }), {
    spreadsheetId: "1abcDEF",
    range: "Fall 2026",
    clientEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: pem.trim(),
    cacheSeconds: 45,
  });
  assert.equal(configOf({ ...env, EVENTS_CACHE_SECONDS: "5" }).cacheSeconds, 300);
  assert.equal(configOf({ ...env, EVENTS_CACHE_SECONDS: "lots" }).cacheSeconds, 300);
  assert.deepEqual(readSheetsConfig({ GOOGLE_SHEETS_SPREADSHEET_ID: " " }), {
    ok: false,
    missing: ["GOOGLE_SHEETS_SPREADSHEET_ID", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"],
  });
});

test("a tab name becomes a quoted, row-capped A1 range; an explicit A1 range is kept", () => {
  assert.equal(valuesRange("Events"), "'Events'!A1:Z501");
  assert.equal(valuesRange("Fall '26"), "'Fall ''26'!A1:Z501");
  assert.equal(valuesRange("Events!A1:M100"), "Events!A1:M100");
});

test("fetchValues asks for unformatted values with serial dates and sends the bearer token", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    if (String(url) === TOKEN_URL) return ok({ access_token: "tok", expires_in: 3600 });
    return ok({ range: "Events!A1:Z501", majorDimension: "ROWS", values: [["event_id"], ["a"]] });
  }) as typeof fetch;
  const values = await createSheetsClient(configOf(env), { fetch: fetchImpl }).fetchValues();
  assert.deepEqual(values, [["event_id"], ["a"]]);
  const sheets = new URL(calls[1].url);
  assert.equal(sheets.origin + sheets.pathname, "https://sheets.googleapis.com/v4/spreadsheets/1abcDEF/values/'Events'!A1%3AZ501");
  assert.equal(sheets.searchParams.get("valueRenderOption"), "UNFORMATTED_VALUE");
  assert.equal(sheets.searchParams.get("dateTimeRenderOption"), "SERIAL_NUMBER");
  assert.equal(sheets.searchParams.get("majorDimension"), "ROWS");
  assert.equal(new Headers(calls[1].init.headers).get("authorization"), "Bearer tok");
  assert.equal(calls[1].init.cache, "no-store");
});

test("an empty sheet is an empty list; errors and odd bodies are SheetsErrors", async () => {
  const config = configOf(env);
  const withValues = (answer: () => Response) =>
    createSheetsClient(config, {
      fetch: (async (url: string | URL | Request) => (String(url) === TOKEN_URL ? ok({ access_token: "t", expires_in: 3600 }) : answer())) as typeof fetch,
    });
  assert.deepEqual(await withValues(() => ok({ range: "x" })).fetchValues(), []);
  await assert.rejects(withValues(() => new Response("denied", { status: 403 })).fetchValues(), (e: unknown) => e instanceof SheetsError && String(e).includes("403"));
  await assert.rejects(withValues(() => ok({ values: "nope" })).fetchValues(), SheetsError);
  await assert.rejects(withValues(() => new Response("<html>", { status: 200 })).fetchValues(), SheetsError);
});

test("a hung request is abandoned after the timeout", async () => {
  const hang = ((_url: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason)))) as typeof fetch;
  await assert.rejects(createSheetsClient(configOf(env), { fetch: hang, timeoutMs: 20 }).fetchValues(), (e: unknown) => (e as Error).name === "TimeoutError");
});
