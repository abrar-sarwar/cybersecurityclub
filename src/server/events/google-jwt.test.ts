import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import test from "node:test";
import { createAssertion, createTokenSource, exchangeAssertion, GoogleAuthError, normalisePrivateKey, TOKEN_URL } from "./google-jwt";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;
const account = { clientEmail: "events@project.iam.gserviceaccount.com", privateKey: pem };
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const decode = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

test("the assertion carries the right claims and a signature the public key verifies", () => {
  const now = Date.UTC(2026, 9, 15, 12, 0, 0);
  const jwt = createAssertion(account, SCOPE, now);
  const [header, claims, signature] = jwt.split(".");
  assert.deepEqual(decode(header), { alg: "RS256", typ: "JWT" });
  assert.deepEqual(decode(claims), { iss: account.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now / 1000, exp: now / 1000 + 3600 });
  assert.equal(verify("sha256", Buffer.from(`${header}.${claims}`), publicKey, Buffer.from(signature, "base64url")), true);
});

test("a private key pasted as one line with \\n escapes and quotes is restored", () => {
  const oneLine = `"${pem.replace(/\n/g, "\\n")}"`;
  assert.equal(normalisePrivateKey(oneLine), pem.trim());
  assert.doesNotThrow(() => createAssertion({ ...account, privateKey: normalisePrivateKey(oneLine) }, SCOPE, Date.now()));
});

test("the token exchange posts the assertion as a JWT bearer grant", async () => {
  let seen: { url: string; init: RequestInit } | null = null;
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    seen = { url: String(url), init: init ?? {} };
    return new Response(JSON.stringify({ access_token: "tok", expires_in: 3599, token_type: "Bearer" }), { status: 200 });
  }) as typeof fetch;
  const token = await exchangeAssertion("a.b.c", { fetch: fetchImpl, now: () => 1_000_000 });
  assert.deepEqual(token, { token: "tok", expiresAt: 1_000_000 + 3599 * 1000 });
  assert.equal(seen!.url, TOKEN_URL);
  assert.equal(seen!.init.method, "POST");
  assert.equal(String(seen!.init.body), "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=a.b.c");
});

test("a non-200 answer or a strange body is a GoogleAuthError that does not echo the body", async () => {
  const bad = (async () => new Response("secret-looking body", { status: 401 })) as typeof fetch;
  await assert.rejects(exchangeAssertion("a.b.c", { fetch: bad }), (err: unknown) => err instanceof GoogleAuthError && !String(err).includes("secret"));
  const odd = (async () => new Response("not json", { status: 200 })) as typeof fetch;
  await assert.rejects(exchangeAssertion("a.b.c", { fetch: odd }), GoogleAuthError);
});

test("the token source reuses a token until a minute before expiry and shares one exchange", async () => {
  let calls = 0;
  let clock = 0;
  const fetchImpl = (async () => {
    calls++;
    return new Response(JSON.stringify({ access_token: `tok${calls}`, expires_in: 3600 }), { status: 200 });
  }) as typeof fetch;
  const getToken = createTokenSource(account, SCOPE, { fetch: fetchImpl, now: () => clock });
  const [a, b] = await Promise.all([getToken(), getToken()]);
  assert.equal(a, "tok1");
  assert.equal(b, "tok1");
  assert.equal(calls, 1);
  clock = 3600_000 - 61_000;
  assert.equal(await getToken(), "tok1");
  clock = 3600_000 - 59_000;
  assert.equal(await getToken(), "tok2");
  assert.equal(calls, 2);
});

test("a failed exchange leaves the source able to try again", async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls++;
    return calls === 1 ? new Response("", { status: 500 }) : new Response(JSON.stringify({ access_token: "ok", expires_in: 3600 }), { status: 200 });
  }) as typeof fetch;
  const getToken = createTokenSource(account, SCOPE, { fetch: fetchImpl });
  await assert.rejects(getToken(), GoogleAuthError);
  assert.equal(await getToken(), "ok");
});
