import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "@/server/db";
import { env, mailMode } from "@/server/env";
import { branding } from "@config/branding";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export class MailNotConfiguredError extends Error {
  constructor() {
    super(
      "Email delivery is not configured. Set the SMTP_* variables, or MAIL_MODE=preview in development.",
    );
    this.name = "MailNotConfiguredError";
  }
}

function transporter() {
  const e = env();
  if (!e.SMTP_HOST || !e.SMTP_USER || !e.SMTP_PASS) throw new MailNotConfiguredError();
  return nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_SECURE,
    auth: { user: e.SMTP_USER, pass: e.SMTP_PASS },
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/** Minimal, accessible HTML wrapper for transactional email. */
export function renderEmail(opts: {
  heading: string;
  paragraphs: string[];
  action?: { label: string; url: string };
  footer?: string;
}) {
  const p = opts.paragraphs
    .map(
      (t) =>
        `<p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#23334D">${escapeHtml(t)}</p>`,
    )
    .join("");
  const action = opts.action
    ? `<p style="margin:22px 0"><a href="${escapeHtml(opts.action.url)}" style="display:inline-block;background:#1747B0;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">${escapeHtml(opts.action.label)}</a></p><p style="font-size:13px;color:#58677D;word-break:break-all">If the button does not work, copy this link into your browser: ${escapeHtml(opts.action.url)}</p>`
    : "";
  const footer =
    opts.footer ??
    `You received this because an account on ${branding.displayName} used this address. If that was not you, you can ignore this message.`;
  return `<!doctype html><html><body style="margin:0;background:#F3F7FF;font-family:Inter,'Segoe UI',Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:32px 20px"><div style="background:#ffffff;border:1px solid #DCE5F2;border-radius:14px;padding:28px"><p style="margin:0 0 18px;font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#1747B0">${escapeHtml(branding.displayName)}</p><h1 style="margin:0 0 16px;font-size:22px;color:#10213A">${escapeHtml(opts.heading)}</h1>${p}${action}</div><p style="font-size:12px;color:#58677D;margin:16px 4px 0">${escapeHtml(footer)}</p></div></body></html>`;
}

/**
 * Sends an email through SMTP, or stores it in the development mailbox when
 * MAIL_MODE=preview. Throws when delivery is impossible so callers never
 * report success for a message that was not sent.
 */
export async function sendMail(msg: MailMessage): Promise<{ mode: "smtp" | "preview" }> {
  const mode = mailMode();
  if (mode === "preview") {
    if (env().NODE_ENV === "production") throw new MailNotConfiguredError();
    await prisma.devMailbox.create({
      data: {
        toAddress: msg.to,
        subject: msg.subject,
        text: msg.text,
        html: msg.html ?? null,
      },
    });
    console.info(`[mail:preview] to=${msg.to} subject="${msg.subject}" (open /dev/mailbox)`);
    return { mode };
  }
  await transporter().sendMail({
    from: env().MAIL_FROM,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  });
  return { mode };
}
