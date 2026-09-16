import { branding } from "@config/branding";

export const CLUB_TIMEZONE = branding.timezone;

const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: CLUB_TIMEZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const longDateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: CLUB_TIMEZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: CLUB_TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const timeNoZoneFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: CLUB_TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
});

const monthYearFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: CLUB_TIMEZONE,
  month: "long",
  year: "numeric",
});

export function formatDate(d: Date | string) {
  return dateFmt.format(new Date(d));
}

export function formatLongDate(d: Date | string) {
  return longDateFmt.format(new Date(d));
}

export function formatTime(d: Date | string) {
  return timeFmt.format(new Date(d));
}

/** "Wed, Sep 16, 2026 · 6:30 – 8:00 PM EDT" */
export function formatEventRange(start: Date | string, end?: Date | string | null) {
  const s = new Date(start);
  if (!end) return `${formatDate(s)} at ${formatTime(s)}`;
  const e = new Date(end);
  const sameDay = dateFmt.format(s) === dateFmt.format(e);
  if (sameDay) {
    return `${formatDate(s)}, ${timeNoZoneFmt.format(s)} to ${timeFmt.format(e)}`;
  }
  return `${formatDate(s)} ${timeNoZoneFmt.format(s)} to ${formatDate(e)} ${timeFmt.format(e)}`;
}

export function formatMonthYear(month: number, year: number) {
  return monthYearFmt.format(new Date(Date.UTC(year, month - 1, 15, 12)));
}

/** Last instant (UTC) of the given month in the club timezone, approximated to end of month. */
export function endOfMonth(month: number, year: number) {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59));
}

export function formatDateTimeLocalInput(d: Date) {
  // Renders a Date as the value for <input type="datetime-local"> in the club timezone.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/**
 * Parses a datetime-local string (YYYY-MM-DDTHH:mm) as club-timezone wall time
 * and returns the corresponding UTC Date. Handles DST by iterating the offset.
 */
export function parseClubLocalDateTime(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  let guess = Date.UTC(y, mo - 1, d, h, mi);
  for (let i = 0; i < 3; i++) {
    const offset = tzOffsetMinutes(new Date(guess));
    const candidate = Date.UTC(y, mo - 1, d, h, mi) - offset * 60_000;
    if (candidate === guess) break;
    guess = candidate;
  }
  return new Date(guess);
}

function tzOffsetMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const hour = get("hour") === 24 ? 0 : get("hour");
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return (asUtc - date.getTime()) / 60_000;
}

export function relativeDays(d: Date | string) {
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.round(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 1) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}
