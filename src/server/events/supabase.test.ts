import assert from "node:assert/strict";
import test from "node:test";
import type { EventRow } from "@/lib/events/db-row";
import { authHeaders, createSupabaseClient, readSupabaseConfig, SupabaseError, type SupabaseConfig } from "./supabase";

const env = { SUPABASE_URL: "https://abc.supabase.co/", SUPABASE_SECRET_KEY: "sb_secret_abc123" };
const config = (() => {
  const r = readSupabaseConfig(env);
  assert.ok(r.ok);
  return r.config as SupabaseConfig;
})();
const row: EventRow = { id: "x", title: "X", description: "", date: "2026-09-22", start_time: null, end_time: null, location: "", category: "", image_url: "", image_alt: "", registration_url: "", status: "upcoming", published: true };
type Call = { url: string; init: RequestInit };
function fakeFetch(answer: (url: URL, init: RequestInit) => Response) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return answer(new URL(String(url)), init ?? {});
  }) as typeof fetch;
  return { calls, fetchImpl };
}
const ok = (body: unknown, status = 200) => new Response(body === undefined ? null : JSON.stringify(body), { status });

test("config trims the URL, defaults the cache and names what is missing", () => {
  assert.deepEqual(config, { url: "https://abc.supabase.co", secretKey: "sb_secret_abc123", cacheSeconds: 300 });
  assert.deepEqual(readSupabaseConfig({}), { ok: false, missing: ["SUPABASE_URL", "SUPABASE_SECRET_KEY"] });
  assert.equal((readSupabaseConfig({ ...env, EVENTS_CACHE_SECONDS: "45" }) as { config: SupabaseConfig }).config.cacheSeconds, 45);
  assert.equal((readSupabaseConfig({ ...env, EVENTS_CACHE_SECONDS: "5" }) as { config: SupabaseConfig }).config.cacheSeconds, 300);
});

test("secret keys go on the apikey header; a legacy JWT also gets a bearer header", () => {
  assert.deepEqual(authHeaders("sb_secret_abc"), { apikey: "sb_secret_abc" });
  assert.deepEqual(authHeaders("eyJhbGciOi.x.y"), { apikey: "eyJhbGciOi.x.y", authorization: "Bearer eyJhbGciOi.x.y" });
});

test("listEvents filters published rows and orders by date", async () => {
  const { calls, fetchImpl } = fakeFetch(() => ok([row]));
  const client = createSupabaseClient(config, { fetch: fetchImpl });
  assert.deepEqual(await client.listEvents({ onlyPublished: true }), [row]);
  const url = new URL(calls[0].url);
  assert.equal(url.origin + url.pathname, "https://abc.supabase.co/rest/v1/events");
  assert.equal(url.searchParams.get("published"), "eq.true");
  assert.equal(url.searchParams.get("order"), "date.asc,title.asc");
  assert.match(url.searchParams.get("select") ?? "", /^id,title,description,date,start_time,end_time,location,category,image_url,image_alt,registration_url,status,published$/);
  assert.equal(new Headers(calls[0].init.headers).get("apikey"), "sb_secret_abc123");
  assert.equal(calls[0].init.cache, "no-store");
  await client.listEvents({ onlyPublished: false });
  assert.equal(new URL(calls[1].url).searchParams.get("published"), null);
});

test("upsert merges on id and sends every column; insert refuses duplicates with a 409", async () => {
  const { calls, fetchImpl } = fakeFetch((url, init) => (init.method === "POST" && !String(new Headers(init.headers).get("prefer")).includes("merge") ? new Response("", { status: 409 }) : ok(undefined, 201)));
  const client = createSupabaseClient(config, { fetch: fetchImpl });
  await client.upsertEvent({ ...row, image_url: "" });
  assert.equal(calls[0].init.method, "POST");
  assert.equal(new URL(calls[0].url).pathname, "/rest/v1/events");
  const headers = new Headers(calls[0].init.headers);
  assert.equal(headers.get("prefer"), "resolution=merge-duplicates,return=minimal");
  assert.equal(headers.get("content-type"), "application/json");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { ...row, image_url: "" });
  await assert.rejects(client.insertEvent(row), (e: unknown) => e instanceof SupabaseError && e.status === 409);
  assert.equal(new Headers(calls[1].init.headers).get("prefer"), "return=minimal");
});

test("flyers upload with upsert, delete by path, and have predictable public URLs", async () => {
  const { calls, fetchImpl } = fakeFetch(() => ok({ Key: "flyers/gbm-abcd1234.webp" }));
  const client = createSupabaseClient(config, { fetch: fetchImpl });
  await client.uploadFlyer("gbm-abcd1234.webp", Buffer.from("RIFF"), "image/webp");
  assert.equal(calls[0].url, "https://abc.supabase.co/storage/v1/object/flyers/gbm-abcd1234.webp");
  assert.equal(calls[0].init.method, "POST");
  const headers = new Headers(calls[0].init.headers);
  assert.equal(headers.get("content-type"), "image/webp");
  assert.equal(headers.get("x-upsert"), "true");
  assert.equal(headers.get("apikey"), "sb_secret_abc123");
  await client.deleteFlyer("gbm-abcd1234.webp");
  assert.equal(calls[1].init.method, "DELETE");
  assert.equal(calls[1].url, "https://abc.supabase.co/storage/v1/object/flyers/gbm-abcd1234.webp");
  assert.equal(client.publicFlyerUrl("gbm-abcd1234.webp"), "https://abc.supabase.co/storage/v1/object/public/flyers/gbm-abcd1234.webp");
  assert.equal(client.flyerPathFromUrl("https://abc.supabase.co/storage/v1/object/public/flyers/gbm-abcd1234.webp"), "gbm-abcd1234.webp");
  // Only the shape this site writes; dot segments or other names never become a delete target.
  assert.equal(client.flyerPathFromUrl("https://abc.supabase.co/storage/v1/object/public/flyers/../other-bucket/x.webp"), null);
  assert.equal(client.flyerPathFromUrl("https://abc.supabase.co/storage/v1/object/public/flyers/%2e%2e/other-bucket/x.webp"), null);
  assert.equal(client.flyerPathFromUrl("https://abc.supabase.co/storage/v1/object/public/flyers/sub/gbm-abcd1234.webp"), null);
  assert.equal(client.flyerPathFromUrl("https://abc.supabase.co/storage/v1/object/public/flyers/gbm-abcd1234.png"), null);
  assert.equal(client.flyerPathFromUrl("https://abc.supabase.co/storage/v1/object/public/other/x.webp"), null);
  assert.equal(client.flyerPathFromUrl("https://evil.example/storage/v1/object/public/flyers/x.webp"), null);
  assert.equal(client.flyerPathFromUrl("/assets/events/x.webp"), null);
});

test("errors carry the status but never the body, and odd bodies are errors", async () => {
  const denied = createSupabaseClient(config, { fetch: fakeFetch(() => new Response("secret-looking body", { status: 403 })).fetchImpl });
  await assert.rejects(denied.listEvents({ onlyPublished: true }), (e: unknown) => e instanceof SupabaseError && e.status === 403 && !String(e).includes("secret"));
  await assert.rejects(denied.upsertEvent(row), SupabaseError);
  await assert.rejects(denied.uploadFlyer("x.webp", Buffer.alloc(1), "image/webp"), SupabaseError);
  const odd = createSupabaseClient(config, { fetch: fakeFetch(() => ok({ not: "an array" })).fetchImpl });
  await assert.rejects(odd.listEvents({ onlyPublished: true }), SupabaseError);
});

test("a hung request is abandoned after the timeout", async () => {
  const hang = ((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason)))) as typeof fetch;
  await assert.rejects(createSupabaseClient(config, { fetch: hang, timeoutMs: 20 }).listEvents({ onlyPublished: true }), (e: unknown) => (e as Error).name === "TimeoutError");
});
