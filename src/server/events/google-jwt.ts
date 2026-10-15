/**
 * Google service-account sign-in without the Google SDK: an RS256 JWT signed
 * with node:crypto, exchanged for a short-lived access token. The private key
 * never leaves this process and is never logged.
 */
import { createPrivateKey, sign } from "node:crypto";

export const TOKEN_URL = "https://oauth2.googleapis.com/token";
const TOKEN_LIFETIME_SECONDS = 3600;
const REFRESH_MARGIN_MS = 60_000;

export type Fetch = typeof fetch;
export type ServiceAccount = { clientEmail: string; privateKey: string };
export type AccessToken = { token: string; expiresAt: number };

export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

/** Restores a PEM key pasted into a single-line env var: surrounding quotes off, `\n` escapes back to line breaks. */
export function normalisePrivateKey(raw: string): string {
  return raw.trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n").trim();
}

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

/** The signed assertion Google exchanges for an access token. Valid for one hour from `nowMs`. */
export function createAssertion(account: ServiceAccount, scope: string, nowMs: number): string {
  const iat = Math.floor(nowMs / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iss: account.clientEmail, scope, aud: TOKEN_URL, iat, exp: iat + TOKEN_LIFETIME_SECONDS }));
  const input = `${header}.${claims}`;
  const signature = sign("sha256", Buffer.from(input), createPrivateKey(account.privateKey)).toString("base64url");
  return `${input}.${signature}`;
}

export async function exchangeAssertion(assertion: string, deps: { fetch: Fetch; now?: () => number; signal?: AbortSignal }): Promise<AccessToken> {
  const body = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion });
  const response = await deps.fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
    signal: deps.signal,
  });
  if (!response.ok) throw new GoogleAuthError(`Google's token endpoint answered ${response.status}`);
  const json = (await response.json().catch(() => null)) as { access_token?: unknown; expires_in?: unknown } | null;
  if (!json || typeof json.access_token !== "string" || typeof json.expires_in !== "number") {
    throw new GoogleAuthError("Google's token endpoint returned an unexpected body");
  }
  return { token: json.access_token, expiresAt: (deps.now ?? Date.now)() + json.expires_in * 1000 };
}

/**
 * A function that returns a valid access token, minting one only when the
 * cached token is missing or within a minute of expiry. Concurrent callers
 * share one exchange.
 */
export function createTokenSource(account: ServiceAccount, scope: string, deps: { fetch: Fetch; now?: () => number }) {
  const now = deps.now ?? Date.now;
  let cached: AccessToken | null = null;
  let inflight: Promise<AccessToken> | null = null;
  return async function getToken(signal?: AbortSignal): Promise<string> {
    if (cached && cached.expiresAt - REFRESH_MARGIN_MS > now()) return cached.token;
    if (!inflight) {
      inflight = exchangeAssertion(createAssertion(account, scope, now()), { fetch: deps.fetch, now, signal }).finally(() => {
        inflight = null;
      });
    }
    cached = await inflight;
    return cached.token;
  };
}
