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
