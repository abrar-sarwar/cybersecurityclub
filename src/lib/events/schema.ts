import { z } from "zod";
import { EVENT_CATEGORIES } from "./types";
import { findUnsafeMarkdownLinks, isSafeHttpsUrl, MAX_URL_LENGTH } from "./urls";
import { parseLocal, zonedLocalToUtc } from "./time";

/** Field limits. The database enforces the same numbers in check constraints. */
export const LIMITS = {
  title: { min: 3, max: 120 },
  description: 5000,
  location: { min: 1, max: 200 },
  url: MAX_URL_LENGTH,
  flyerAlt: { min: 5, max: 300 },
  recap: 5000,
  year: { min: 2000, max: 2100 },
} as const;

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const httpsUrl = z
  .string()
  .trim()
  .max(LIMITS.url, `Links can be at most ${LIMITS.url} characters`)
  .refine(isSafeHttpsUrl, "Enter a full link that starts with https://");

export const optionalHttpsUrl = z.preprocess(emptyToNull, httpsUrl.nullable());

const markdown = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .refine((v) => findUnsafeMarkdownLinks(v).length === 0, "Links in the text must start with https://, http:// or mailto:");

const optionalMarkdown = (max: number) => z.preprocess(emptyToNull, markdown(max).nullable());

/** HTML checkboxes send "on" or nothing. */
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true || v === "1", z.boolean());

export const flyerAltSchema = z
  .string()
  .trim()
  .min(LIMITS.flyerAlt.min, "Describe the flyer so screen reader users get the same information")
  .max(LIMITS.flyerAlt.max, `Keep the description under ${LIMITS.flyerAlt.max} characters`);

const eventFields = z.object({
  title: z.string().trim().min(LIMITS.title.min, "Give the event a title").max(LIMITS.title.max, `Titles can be at most ${LIMITS.title.max} characters`),
  description: markdown(LIMITS.description),
  category: z.enum(EVENT_CATEGORIES, { message: "Choose a category" }),
  location: z.string().trim().min(LIMITS.location.min, "Enter a location").max(LIMITS.location.max, `Locations can be at most ${LIMITS.location.max} characters`),
  directionsUrl: optionalHttpsUrl,
  registrationUrl: optionalHttpsUrl,
  allDay: checkbox,
  startsLocal: z.string().trim(),
  endsLocal: z.string().trim(),
  recap: optionalMarkdown(LIMITS.recap),
  slidesUrl: optionalHttpsUrl,
  recordingUrl: optionalHttpsUrl,
  materialsUrl: optionalHttpsUrl,
});

export type EventInput = {
  title: string;
  description: string;
  category: (typeof EVENT_CATEGORIES)[number];
  location: string;
  directionsUrl: string | null;
  registrationUrl: string | null;
  allDay: boolean;
  startsAt: Date;
  endsAt: Date;
  recap: string | null;
  slidesUrl: string | null;
  recordingUrl: string | null;
  materialsUrl: string | null;
};

function yearInRange(local: string) {
  const p = parseLocal(local);
  return p !== null && p.year >= LIMITS.year.min && p.year <= LIMITS.year.max;
}

/**
 * Full event form validation for one timezone. Times arrive as the officer
 * typed them (`YYYY-MM-DDTHH:mm`, or `YYYY-MM-DD` for all-day events) and
 * leave as instants.
 */
export function eventInputSchema(timeZone: string) {
  return eventFields.transform((v, ctx): EventInput => {
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
    const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
    const startsShape = v.allDay ? dateOnly : dateTime;
    let bad = false;
    if (!startsShape.test(v.startsLocal) || !yearInRange(v.startsLocal)) {
      ctx.addIssue({ code: "custom", path: ["startsLocal"], message: v.allDay ? "Enter the start date" : "Enter the start date and time" });
      bad = true;
    }
    if (!startsShape.test(v.endsLocal) || !yearInRange(v.endsLocal)) {
      ctx.addIssue({ code: "custom", path: ["endsLocal"], message: v.allDay ? "Enter the end date" : "Enter the end date and time" });
      bad = true;
    }
    if (bad) return z.NEVER;
    // All-day events run from the first midnight to one minute before the next.
    const startsAt = zonedLocalToUtc(v.allDay ? `${v.startsLocal}T00:00` : v.startsLocal, timeZone);
    const endsAt = zonedLocalToUtc(v.allDay ? `${v.endsLocal}T23:59` : v.endsLocal, timeZone);
    if (endsAt.getTime() <= startsAt.getTime()) {
      ctx.addIssue({ code: "custom", path: ["endsLocal"], message: "The event has to end after it starts" });
      return z.NEVER;
    }
    if (endsAt.getTime() - startsAt.getTime() > 62 * 86_400_000) {
      ctx.addIssue({ code: "custom", path: ["endsLocal"], message: "Events can last at most two months" });
      return z.NEVER;
    }
    return {
      title: v.title,
      description: v.description,
      category: v.category,
      location: v.location,
      directionsUrl: v.directionsUrl,
      registrationUrl: v.registrationUrl,
      allDay: v.allDay,
      startsAt,
      endsAt,
      recap: v.recap,
      slidesUrl: v.slidesUrl,
      recordingUrl: v.recordingUrl,
      materialsUrl: v.materialsUrl,
    };
  });
}

export type FieldErrors = Record<string, string>;
export type ParseResult<T> = { ok: true; data: T } | { ok: false; fields: FieldErrors; error: string };

/** First message per field, keyed by field name. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** Reads a submitted event form. Unknown fields are ignored; missing ones fail validation. */
export function parseEventForm(form: FormData | Record<string, unknown>, timeZone: string): ParseResult<EventInput> {
  const raw: Record<string, unknown> = form instanceof FormData ? Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")) : form;
  const result = eventInputSchema(timeZone).safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, fields: fieldErrors(result.error), error: "Check the highlighted fields." };
}

/** `?month=YYYY-MM` on the events page. */
export const monthParamSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .refine((v) => {
    const year = Number(v.slice(0, 4));
    return year >= LIMITS.year.min && year <= LIMITS.year.max;
  });
