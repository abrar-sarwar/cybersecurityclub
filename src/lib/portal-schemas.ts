import { z } from "zod";
import { parseClubLocalDateTime } from "@/lib/dates";
import {
  INTEREST_VALUES,
  MEMBER_ROLES,
  MEMBERSHIP_STATUSES,
  STUDENT_EMAIL_DOMAIN,
  safeNextPath,
} from "@/lib/portal";

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .transform((value) => (value.length ? value : null))
    .nullable()
    .optional()
    .transform((value) => value ?? null);

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal(""), z.null(), z.undefined()])
  .transform((value) => value === "on" || value === "true");

export const uuidSchema = z.uuid("Invalid id.");

/** Sign-in address for the email fallback. Must be a personal address. */
export const signInEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Enter a valid email address.")
    .pipe(z.email("Enter a valid email address."))
    .refine((email) => !/@(?:[a-z0-9-]+\.)*gsu\.edu$/.test(email), {
      message: "Use a personal email so you keep access after graduation. You verify your GSU student email after signing in.",
    }),
  next: z.string().optional().transform((value) => safeNextPath(value)),
});

export const studentEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Enter your GSU student email.")
  .pipe(z.email("Enter your GSU student email."))
  .refine((email) => email.endsWith(`@${STUDENT_EMAIL_DOMAIN}`) && /^[a-z0-9._%+-]+@student\.gsu\.edu$/.test(email), {
    message: `Use your @${STUDENT_EMAIL_DOMAIN} address.`,
  });

const graduation = {
  grad_month: z.coerce.number({ error: "Choose a month." }).int().min(1, "Choose a month.").max(12, "Choose a month."),
  grad_year: z.coerce.number({ error: "Choose a year." }).int().min(2000, "Choose a year.").max(2100, "Choose a year."),
};

const profileFields = {
  full_name: trimmed(120).min(1, "Enter your name."),
  ...graduation,
  major: optionalText(120),
  interests: z
    .array(z.enum(INTEREST_VALUES, { error: "Choose from the listed interests." }))
    .max(INTEREST_VALUES.length)
    .transform((values) => [...new Set(values)]),
  notify_events: checkbox,
};

export const onboardingSchema = z.object({
  ...profileFields,
  student_email: studentEmailSchema,
});

export const settingsSchema = z.object(profileFields);

export const notifyEventsSchema = z.object({ notify_events: checkbox });

export const changeStudentEmailSchema = z.object({ student_email: studentEmailSchema });

export const verificationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, "This link is not valid.");

/** Event form. Times are wall-clock values in the club timezone. */
export const eventSchema = z
  .object({
    title: trimmed(160).min(1, "Enter a title."),
    description: trimmed(5000),
    location: trimmed(200),
    starts_at: z.string().transform((value, ctx) => {
      const date = parseClubLocalDateTime(value);
      if (!date) {
        ctx.addIssue({ code: "custom", message: "Enter a start date and time." });
        return z.NEVER;
      }
      return date;
    }),
    ends_at: z
      .string()
      .optional()
      .transform((value, ctx) => {
        if (!value) return null;
        const date = parseClubLocalDateTime(value);
        if (!date) {
          ctx.addIssue({ code: "custom", message: "Enter a valid end time." });
          return z.NEVER;
        }
        return date;
      }),
  })
  .refine((event) => !event.ends_at || event.ends_at > event.starts_at, {
    message: "The end must be after the start.",
    path: ["ends_at"],
  });

export const memberRoleSchema = z.enum(MEMBER_ROLES);
export const membershipStatusSchema = z.enum(MEMBERSHIP_STATUSES);

export const awardChallengeSchema = z.object({
  reference_id: trimmed(200).min(1, "Name the challenge."),
});

export const memberSearchSchema = z.object({
  q: z
    .string()
    .optional()
    .transform((value) => (value ?? "").replace(/[^\p{L}\p{N}@._+\- ]/gu, "").trim().slice(0, 80)),
  verified: z.enum(["all", "yes", "no"]).catch("all"),
  role: z.enum(["all", ...MEMBER_ROLES]).catch("all"),
  year: z.coerce.number().int().min(2000).max(2100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

/** Field errors keyed by input name, for inline form messages. */
export function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}
