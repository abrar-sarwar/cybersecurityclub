/**
 * The admin event form, as pure functions: read the submitted fields, turn
 * them into the sheet's cells, and validate them with the same parser the
 * public site uses. Anything the parser would skip or quietly drop is an
 * error here, so officers fix it before it reaches the sheet.
 */
import type { ClubEvent } from "./event";
import { cleanText, OPTIONAL_HEADERS, parseSheet, REQUIRED_HEADERS, SHEET_LIMITS } from "./sheet";

export const FORM_FIELDS = ["title", "description", "date", "start_time", "end_time", "location", "category", "registration_url", "status", "published", "image_alt"] as const;
export type FormField = (typeof FORM_FIELDS)[number];
/** Every field as a string; `published` is "on" when ticked, "" otherwise. */
export type EventFormValues = Record<FormField, string>;

export const KNOWN_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS] as const;
export type KnownHeader = (typeof KNOWN_HEADERS)[number];
export type EventCells = Record<KnownHeader, string>;

export type FieldErrors = Record<string, string>;
export type ValidatedEvent = { ok: true; cells: EventCells; event: ClubEvent } | { ok: false; errors: FieldErrors };

const MAX_ID = 64;

export function readForm(form: FormData): EventFormValues {
  const values = {} as EventFormValues;
  for (const field of FORM_FIELDS) {
    const raw = form.get(field);
    values[field] = cleanText(typeof raw === "string" ? raw : "", field === "description");
  }
  return values;
}

const capitalise = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : "");

/** The 13 known cells as strings, ready for a RAW write. */
export function cellsFor(values: EventFormValues, extra: { eventId: string; imageUrl: string | null }): EventCells {
  return {
    event_id: extra.eventId,
    title: values.title,
    description: values.description,
    date: values.date,
    start_time: values.start_time,
    end_time: values.end_time,
    location: values.location,
    category: values.category,
    image_url: extra.imageUrl ?? "",
    image_alt: values.image_alt,
    registration_url: values.registration_url,
    status: capitalise(values.status),
    published: values.published === "on" ? "TRUE" : "FALSE",
  };
}

export function validateEvent(values: EventFormValues, extra: { eventId: string; imageUrl: string | null }, timeZone: string): ValidatedEvent {
  const cells = cellsFor(values, extra);
  const header = [...KNOWN_HEADERS];
  const row = header.map((h) => cells[h]);
  const errors: FieldErrors = {};
  const parsed = parseSheet([header, row], { timeZone, includeUnpublished: true });
  for (const p of parsed.problems) {
    const key = p.field ?? "form";
    if (!(key in errors)) errors[key] = p.message;
  }
  // The parser only looks at the alt text when there is an image; the form checks it regardless.
  if (values.image_alt.length > SHEET_LIMITS.imageAlt) errors.image_alt ??= `Keep this under ${SHEET_LIMITS.imageAlt} characters`;
  if (parsed.events.length === 0 && Object.keys(errors).length === 0) errors.form = "This event could not be saved";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, cells, event: parsed.events[0] };
}

/** `resume-workshop-2026-09-22`, with `-2`, `-3` when taken. Always at most 64 characters. */
export function eventIdFor(title: string, date: string, taken: Iterable<string>): string {
  const slug =
    title
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "event";
  const room = MAX_ID - date.length - 1 - 3; // leave space for "-NN"
  const base = `${slug.slice(0, room).replace(/-+$/, "")}-${date}`;
  const used = new Set(taken);
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  return id;
}

/** The edit form's initial values for an existing event. */
export function formValuesFrom(event: ClubEvent): EventFormValues {
  return {
    title: event.title,
    description: event.description ?? "",
    date: event.date,
    start_time: event.startTime ?? "",
    end_time: event.endTime ?? "",
    location: event.location ?? "",
    category: event.category ?? "",
    registration_url: event.registrationUrl ?? "",
    status: event.status,
    published: event.published ? "on" : "",
    image_alt: event.imageAlt ?? "",
  };
}
