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
  // Member portal (Supabase + Resend). Checked where used so public pages
  // keep working before the portal is configured.
  NEXT_PUBLIC_SUPABASE_URL: optionalString,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString,
  SUPABASE_SECRET_KEY: optionalString,
  APP_SECRET: optionalString,
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.string().default("Cybersecurity Club at GSU <no-reply@example.edu>"),
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

/**
 * Secret for signing unsubscribe links and keying rate-limit identifiers.
 * Required in production; development falls back to a fixed, clearly
 * non-secret value so the portal runs locally without extra setup.
 */
export function appSecret() {
  const secret = env().APP_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (isProduction()) throw new Error("APP_SECRET must be set to at least 32 characters in production.");
  return "development-only-app-secret-do-not-use-in-production";
}
