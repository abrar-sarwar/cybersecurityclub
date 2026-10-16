/**
 * The month view's arithmetic, on plain YYYY-MM-DD strings so the grid is the
 * same on the server and in the browser whatever the visitor's timezone.
 */
import type { ClubEvent } from "./event";

const byDayThenTime = (a: ClubEvent, b: ClubEvent) => a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? "");

/** Events on one YYYY-MM-DD day, earliest first; untimed (all-day) ones lead. */
export function eventsOn(events: readonly ClubEvent[], date: string): ClubEvent[] {
  return events.filter((e) => e.date === date).sort(byDayThenTime);
}

/** Events in one month ("YYYY-MM"), in date then time order. */
export function eventsInMonth(events: readonly ClubEvent[], month: string): ClubEvent[] {
  return events.filter((e) => e.date.startsWith(`${month}-`)).sort(byDayThenTime);
}

/**
 * The weeks of a month for a calendar grid, Sunday first. Each cell is a
 * YYYY-MM-DD string, or null for the blanks before the 1st and after the last
 * day. Worked out in UTC so the days never drift with the viewer's timezone.
 */
export function monthWeeks(year: number, monthIndex: number): (string | null)[][] {
  const lead = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  const cells: (string | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${prefix}-${String(i + 1).padStart(2, "0")}`)];
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
