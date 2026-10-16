/**
 * Wall-clock conversions for one IANA timezone, without a date library.
 *
 * Officers type times as they appear on a flyer (Eastern time). The database
 * stores instants. These two functions translate between the two, including
 * on the two days a year when Eastern time jumps.
 */

const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/;

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function partsOf(date: Date, timeZone: string): Parts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  return { year: read("year"), month: read("month"), day: read("day"), hour: read("hour") % 24, minute: read("minute"), second: read("second") };
}

/** The wall clock in `timeZone` at `ms`, re-read as if it were UTC. */
function wallClockAsUtc(ms: number, timeZone: string): number {
  const p = partsOf(new Date(ms), timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

/** UTC offset of `timeZone` at the instant `ms`, in milliseconds (negative west of Greenwich). */
export function offsetAt(ms: number, timeZone: string): number {
  return wallClockAsUtc(ms, timeZone) - ms;
}

export function parseLocal(local: string): Parts | null {
  const m = LOCAL_PATTERN.exec(local.trim());
  if (!m) return null;
  const [year, month, day, hour = 0, minute = 0, second = 0] = m.slice(1).map((v) => (v === undefined ? 0 : Number(v)));
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  // Reject impossible dates such as February 30 by round-tripping through UTC.
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return { year, month, day, hour, minute, second };
}

/**
 * Converts `YYYY-MM-DDTHH:mm` (or `YYYY-MM-DD`, read as midnight) in
 * `timeZone` to an instant.
 *
 * On a clock change, a wall-clock time can occur twice or not at all. A time
 * that occurs twice resolves to its first occurrence. A time that does not
 * exist (the skipped hour in spring) resolves forward to the instant the clock
 * showed next. Throws on malformed input.
 */
export function zonedLocalToUtc(local: string, timeZone: string): Date {
  const p = parseLocal(local);
  if (!p) throw new RangeError(`Not a local date-time: ${local}`);
  const wanted = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // Two candidate offsets: the one in force just before and just after the wanted wall time.
  const offsets = new Set([offsetAt(wanted - 86_400_000, timeZone), offsetAt(wanted, timeZone), offsetAt(wanted + 86_400_000, timeZone)]);
  const candidates = [...offsets].map((offset) => wanted - offset).sort((a, b) => a - b);
  const exact = candidates.filter((ms) => wallClockAsUtc(ms, timeZone) === wanted);
  if (exact.length) return new Date(exact[0]);
  // Skipped time: pick the latest candidate, which lands after the gap.
  return new Date(candidates[candidates.length - 1]);
}

/** Inverse of {@link zonedLocalToUtc}: `YYYY-MM-DDTHH:mm` in `timeZone`. */
export function utcToZonedLocal(date: Date | string, timeZone: string): string {
  const p = partsOf(new Date(date), timeZone);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${two(p.month)}-${two(p.day)}T${two(p.hour)}:${two(p.minute)}`;
}

/** `YYYY-MM-DD` of an instant in `timeZone`. */
export function dayKey(date: Date | string, timeZone: string): string {
  return utcToZonedLocal(date, timeZone).slice(0, 10);
}
