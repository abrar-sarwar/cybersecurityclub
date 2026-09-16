import "server-only";
import { branding } from "@config/branding";
import { env, isProduction } from "@/server/env";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
};

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
    this.name = "EmailNotConfiguredError";
  }
}

const RESEND_API = "https://api.resend.com";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Minimal, accessible HTML wrapper for transactional email. */
export function renderEmail(opts: {
  heading: string;
  paragraphs: string[];
  action?: { label: string; url: string };
  footer?: string;
  unsubscribeUrl?: string;
}) {
  const paragraphs = opts.paragraphs
    .map((text) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#23334D">${escapeHtml(text)}</p>`)
    .join("");
  const action = opts.action
    ? `<p style="margin:22px 0"><a href="${escapeHtml(opts.action.url)}" style="display:inline-block;background:#1747B0;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">${escapeHtml(opts.action.label)}</a></p><p style="font-size:13px;color:#58677D;word-break:break-all">If the button does not work, copy this link into your browser: ${escapeHtml(opts.action.url)}</p>`
    : "";
  const footer =
    opts.footer ??
    `You received this because an account on ${branding.displayName} used this address. If that was not you, you can ignore this message.`;
  const unsubscribe = opts.unsubscribeUrl
    ? ` <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#58677D">Unsubscribe from event emails</a>.`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#F3F7FF;font-family:Inter,'Segoe UI',Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:32px 20px"><div style="background:#ffffff;border:1px solid #DCE5F2;border-radius:14px;padding:28px"><p style="margin:0 0 18px;font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#1747B0">${escapeHtml(branding.displayName)}</p><h1 style="margin:0 0 16px;font-size:22px;color:#10213A">${escapeHtml(opts.heading)}</h1>${paragraphs}${action}</div><p style="font-size:12px;color:#58677D;margin:16px 4px 0">${escapeHtml(footer)}${unsubscribe}</p></div></body></html>`;
}

function resendKey() {
  const key = env().RESEND_API_KEY;
  if (key) return key;
  if (isProduction()) throw new EmailNotConfiguredError();
  return null;
}

function payload(message: EmailMessage) {
  return {
    from: env().EMAIL_FROM,
    to: [message.to],
    subject: message.subject,
    text: message.text,
    html: message.html,
    ...(message.headers ? { headers: message.headers } : {}),
  };
}

async function postToResend(path: string, body: unknown, idempotencyKey?: string) {
  const key = resendKey();
  if (!key) return false;
  const response = await fetch(`${RESEND_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend responded ${response.status}: ${detail.slice(0, 300)}`);
  }
  return true;
}

/**
 * Sends one email. Without RESEND_API_KEY outside production the message is
 * printed to the server log instead, so links can be followed locally.
 */
export async function sendEmail(message: EmailMessage, idempotencyKey?: string) {
  const delivered = await postToResend("/emails", payload(message), idempotencyKey);
  if (!delivered) console.info(`[email:development] to=${message.to} subject="${message.subject}"\n${message.text}`);
}

/** Sends up to any number of emails in batches of 100 (Resend's batch limit). */
export async function sendEmailBatch(messages: EmailMessage[], idempotencyPrefix: string) {
  for (let start = 0; start < messages.length; start += 100) {
    const chunk = messages.slice(start, start + 100);
    const delivered = await postToResend("/emails/batch", chunk.map(payload), `${idempotencyPrefix}/${start / 100}`);
    if (!delivered) {
      chunk.forEach((message) => console.info(`[email:development] to=${message.to} subject="${message.subject}"`));
    }
  }
}
