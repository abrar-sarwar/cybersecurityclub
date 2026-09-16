import "server-only";
import { z } from "zod";

const bool = z
  .string()
  .optional()
  .transform((v) => (v ?? "").trim().toLowerCase() === "true");

const optionalString = z
  .string()
  .optional()
  .transform((v) => {
    const t = (v ?? "").trim();
    return t.length ? t : undefined;
  });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  DATABASE_PROVIDER: z.enum(["sqlite", "postgresql"]).default("sqlite"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  INITIAL_ADMIN_EMAILS: optionalString,
  MAIL_MODE: z.enum(["smtp", "preview"]).optional(),
  MAIL_FROM: z.string().default("Cybersecurity Club at GSU <no-reply@example.edu>"),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: bool,
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  DISCORD_CLIENT_ID: optionalString,
  DISCORD_CLIENT_SECRET: optionalString,
  DISCORD_GUILD_ID: optionalString,
  MEDIA_STORAGE: z.enum(["local", "s3"]).default("local"),
  MEDIA_LOCAL_DIR: z.string().default("./storage/media"),
  S3_BUCKET: optionalString,
  S3_REGION: z.string().default("auto"),
  S3_ENDPOINT: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  MEDIA_MAX_UPLOAD_MB: z.coerce.number().default(20),
  PIN_SYNC_ENABLED: bool,
  PIN_ORGANIZATION_KEY: z.string().default("cysecclub"),
  PIN_FEED_URL: z
    .string()
    .url()
    .default("https://pin.gsu.edu/organization/cysecclub/events.rss"),
  CRON_SECRET: optionalString,
  ALLOW_SAMPLE_DATA: bool,
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/** Parsed, validated environment. Throws a readable error when misconfigured. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function isProduction() {
  return env().NODE_ENV === "production";
}

export function mailMode(): "smtp" | "preview" {
  const e = env();
  if (e.MAIL_MODE) return e.MAIL_MODE;
  return e.NODE_ENV === "production" ? "smtp" : "preview";
}

export function initialAdminEmails(): string[] {
  return (env().INITIAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function discordConfigured() {
  const e = env();
  return Boolean(e.DISCORD_CLIENT_ID && e.DISCORD_CLIENT_SECRET);
}

export type ConfigItem = {
  key: string;
  label: string;
  configured: boolean;
  detail: string;
  required: boolean;
};

/** Summary for the officer Configuration page. Never exposes secret values. */
export function configurationStatus(): ConfigItem[] {
  const e = env();
  const smtp = Boolean(e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASS);
  const discord = discordConfigured();
  const s3 = Boolean(e.S3_BUCKET && e.S3_ACCESS_KEY_ID && e.S3_SECRET_ACCESS_KEY);
  return [
    {
      key: "app_url",
      label: "Public site URL",
      configured: e.APP_URL !== "http://localhost:3000",
      detail: e.APP_URL,
      required: true,
    },
    {
      key: "database",
      label: "Database",
      configured: true,
      detail:
        e.DATABASE_PROVIDER === "sqlite"
          ? "SQLite file (fine for development and small single-server deployments)"
          : "Postgres",
      required: true,
    },
    {
      key: "mail",
      label: "Email delivery",
      configured: mailMode() === "smtp" && smtp,
      detail:
        mailMode() === "preview"
          ? "Preview mode: messages are stored locally at /dev/mailbox and are NOT delivered"
          : smtp
            ? `SMTP via ${e.SMTP_HOST}`
            : "SMTP selected but host, user or password is missing",
      required: true,
    },
    {
      key: "initial_admins",
      label: "Bootstrap administrators",
      configured: initialAdminEmails().length > 0,
      detail: initialAdminEmails().length
        ? `${initialAdminEmails().length} email address(es) listed in INITIAL_ADMIN_EMAILS`
        : "No INITIAL_ADMIN_EMAILS set",
      required: true,
    },
    {
      key: "discord",
      label: "Discord connection",
      configured: discord,
      detail: discord
        ? e.DISCORD_GUILD_ID
          ? "OAuth configured; server membership check enabled"
          : "OAuth configured; DISCORD_GUILD_ID missing so server membership cannot be checked"
        : "Not configured. Members can type a username but it is not verified.",
      required: false,
    },
    {
      key: "media",
      label: "Media storage",
      configured: e.MEDIA_STORAGE === "local" || s3,
      detail:
        e.MEDIA_STORAGE === "local"
          ? `Local disk (${e.MEDIA_LOCAL_DIR}). Use S3-compatible storage for serverless or multi-instance hosting.`
          : s3
            ? `S3-compatible bucket ${e.S3_BUCKET}`
            : "S3 selected but credentials are incomplete",
      required: true,
    },
    {
      key: "pin",
      label: "PIN event sync",
      configured: e.PIN_SYNC_ENABLED,
      detail: e.PIN_SYNC_ENABLED
        ? `Public RSS feed: ${e.PIN_FEED_URL}${e.CRON_SECRET ? " (scheduled sync enabled)" : " (manual sync only; set CRON_SECRET to enable scheduling)"}`
        : "Disabled. Events are maintained manually.",
      required: false,
    },
  ];
}
