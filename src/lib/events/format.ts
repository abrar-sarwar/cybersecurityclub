import type { ClubEvent } from "./event";

/** "15:00" as "3:00 PM". */
export function formatClockTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** "3:00 to 4:00 PM", "11:30 AM to 1:00 PM", "3:00 PM", "Until 4:00 PM" or null. */
export function formatTimeRange(start: string | null, end: string | null): string | null {
  if (start && end) {
    const s = formatClockTime(start);
    const e = formatClockTime(end);
    const samePeriod = s.slice(-2) === e.slice(-2);
    return samePeriod ? `${s.slice(0, -3)} to ${e}` : `${s} to ${e}`;
  }
  if (start) return formatClockTime(start);
  if (end) return `Until ${formatClockTime(end)}`;
  return null;
}

/** The one-line "what, where, when" under a title. Empty when the sheet gave none of them. */
export function eventDetail(event: Pick<ClubEvent, "category" | "location" | "startTime" | "endTime">): string {
  return [event.category, event.location, formatTimeRange(event.startTime, event.endTime)].filter(Boolean).join(" · ");
}
