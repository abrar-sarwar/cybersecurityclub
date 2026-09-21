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
