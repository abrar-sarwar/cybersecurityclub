import { dayKey } from "./time";

/** Anything with a start and an end instant (ISO strings). */
export type Timed = { startsAt: string; endsAt: string };

export type EventPhase = "upcoming" | "now" | "past";

/** An event is past once it has ended, not once it has started. */
export function classifyEvent(event: Timed, now: Date): EventPhase {
  const starts = Date.parse(event.startsAt);
  const ends = Date.parse(event.endsAt);
  const t = now.getTime();
  if (ends <= t) return "past";
  if (starts <= t) return "now";
  return "upcoming";
}

/** Upcoming (including events happening now) soonest first; past most recent first. */
export function splitPublicEvents<T extends Timed>(events: readonly T[], now: Date): { upcoming: T[]; past: T[] } {
  const byStart = [...events].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const upcoming = byStart.filter((e) => classifyEvent(e, now) !== "past");
  const past = byStart.filter((e) => classifyEvent(e, now) === "past").reverse();
  return { upcoming, past };
}

const DAY = 86_400_000;

function keyToUtc(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcToKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Every local day an event touches, as `YYYY-MM-DD` keys, capped at 62 days. */
export function daysSpanned(event: Timed, timeZone: string): string[] {
  const first = dayKey(event.startsAt, timeZone);
  // An event ending exactly at midnight does not touch the next day.
  const endMs = Date.parse(event.endsAt) - 1;
  const last = dayKey(new Date(Math.max(endMs, Date.parse(event.startsAt))), timeZone);
  const keys: string[] = [];
  for (let ms = keyToUtc(first); ms <= keyToUtc(last) && keys.length < 62; ms += DAY) keys.push(utcToKey(ms));
  return keys;
}

export type CalendarDay<T> = { key: string; day: number; inMonth: boolean; isToday: boolean; events: T[] };
export type CalendarMonth<T> = {
  year: number;
  month: number;
  label: string;
  weeks: CalendarDay<T>[][];
  /** `YYYY-MM` of the neighbouring months, for navigation links. */
  prev: string;
  next: string;
};

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(year, month - 1, 1));
}

/**
 * A Sunday-first grid for one month. Days outside the month fill the first
 * and last rows. Events appear on every day they span.
 */
export function calendarMonth<T extends Timed>(events: readonly T[], year: number, month: number, timeZone: string, now: Date): CalendarMonth<T> {
  const byDay = new Map<string, T[]>();
  const sorted = [...events].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  for (const event of sorted) {
    for (const key of daysSpanned(event, timeZone)) {
      const list = byDay.get(key) ?? [];
      list.push(event);
      byDay.set(key, list);
    }
  }
  const today = dayKey(now, timeZone);
  const firstOfMonth = Date.UTC(year, month - 1, 1);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leading = new Date(firstOfMonth).getUTCDay();
  const cells = Math.ceil((leading + daysInMonth) / 7) * 7;
  const weeks: CalendarDay<T>[][] = [];
  for (let i = 0; i < cells; i++) {
    const ms = firstOfMonth + (i - leading) * DAY;
    const date = new Date(ms);
    const key = utcToKey(ms);
    const cell: CalendarDay<T> = {
      key,
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month - 1,
      isToday: key === today,
      events: byDay.get(key) ?? [],
    };
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push(cell);
  }
  const prevDate = new Date(Date.UTC(year, month - 2, 1));
  const nextDate = new Date(Date.UTC(year, month, 1));
  return {
    year,
    month,
    label: monthLabel(year, month),
    weeks,
    prev: monthKey(prevDate.getUTCFullYear(), prevDate.getUTCMonth() + 1),
    next: monthKey(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1),
  };
}

/** The month a visitor asked for, or the current month when the value is missing or odd. */
export function parseMonthParam(value: string | string[] | undefined, now: Date, timeZone: string): { year: number; month: number } {
  const v = Array.isArray(value) ? value[0] : value;
  const m = typeof v === "string" ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(v) : null;
  if (m) {
    const year = Number(m[1]);
    if (year >= 2000 && year <= 2100) return { year, month: Number(m[2]) };
  }
  const today = dayKey(now, timeZone);
  return { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
}

/** Instants bounding a calendar month in `timeZone`, with a day of slack each side for multi-day events. */
export function monthRange(year: number, month: number, timeZone: string): { from: Date; to: Date } {
  const offsetGuess = 14 * 3_600_000; // wider than any zone offset
  const from = new Date(Date.UTC(year, month - 1, 1) - DAY - offsetGuess);
  const to = new Date(Date.UTC(year, month, 1) + DAY + offsetGuess);
  void timeZone;
  return { from, to };
}
