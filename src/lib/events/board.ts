import type { ClubEvent } from "./event";
import { classifyEvent } from "./public";

export type EventBoard = { upcoming: ClubEvent[]; past: ClubEvent[] };

/**
 * Splits events for one instant. Upcoming (including anything happening
 * right now) runs soonest first; past runs most recent first. `Completed`
 * forces past. `Cancelled` stays visible in upcoming until its day is over,
 * then disappears: nothing happened, so it has no place in the archive.
 */
export function arrangeEvents(events: readonly ClubEvent[], now: Date): EventBoard {
  const byStart = [...events].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt) || a.title.localeCompare(b.title));
  const upcoming: ClubEvent[] = [];
  const past: ClubEvent[] = [];
  for (const event of byStart) {
    const over = event.status === "completed" || classifyEvent(event, now) === "past";
    if (!over) upcoming.push(event);
    else if (event.status !== "cancelled") past.push(event);
  }
  return { upcoming, past: past.reverse() };
}
