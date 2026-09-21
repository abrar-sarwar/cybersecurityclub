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

export function formatDate(d: Date | string) {
  return dateFmt.format(new Date(d));
}

export function formatLongDate(d: Date | string) {
  return longDateFmt.format(new Date(d));
}

export function formatTime(d: Date | string) {
  return timeFmt.format(new Date(d));
}

/** "Wed, Sep 16, 2026, 6:30 to 8:00 PM EDT" */
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

export function relativeDays(d: Date | string) {
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.round(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 1) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/**
 * Today's date in the club's timezone, as YYYY-MM-DD.
 *
 * Whether a session has happened is judged where the club meets, not where the
 * visitor is, so everyone sees the same timeline and the markup hydrates cleanly.
 */
export function clubToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: branding.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
