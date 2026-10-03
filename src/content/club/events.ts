/**
 * The club's events, kept by hand: PIN has no feed we can read, so this list
 * is the single source for the homepage spotlight, the events list, the
 * calendar and the past-events archive.
 *
 * To announce an event, add an entry below. Nothing else needs editing: pages
 * work out from the date which events are still ahead and move each one to
 * "past" by itself the day after it happens.
 */
export const EVENT_CATEGORIES = ["Workshop", "General Body Meeting", "CTF", "Competition", "Social", "Speaker", "Career", "Training"] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "All Levels"] as const;
export type EventDifficulty = (typeof EVENT_DIFFICULTIES)[number];

export type EventLink = {
  label: string;
  href: string;
  kind: "slides" | "repo" | "recording" | "lab" | "other";
};

export type ClubEvent = {
  /** Unique, URL-safe. Used as a key and as the calendar's anchor. */
  id: string;
  title: string;
  /** The day it happens, as YYYY-MM-DD in the club's timezone. */
  date: string;
  /** 24-hour HH:MM in the club's timezone. */
  start?: string;
  end?: string;
  location?: string;
  description?: string;
  category: EventCategory;
  /** Optional: not every event has a level. */
  difficulty?: EventDifficulty;
  registrationUrl?: string;
  /** Slides, repositories, recordings and labs, mostly added after the event. */
  links?: EventLink[];
  flyer?: { image: string; width: number; height: number; alt: string };
};

export const CLUB_EVENTS: readonly ClubEvent[] = [
  {
    id: "2026-09-02-general-body-meeting",
    title: "General Body Meeting",
    date: "2026-09-02",
    start: "15:00",
    end: "16:00",
    location: "CMII Building Room 211",
    description: "First meeting of the Fall 2026 semester.",
    category: "General Body Meeting",
    difficulty: "All Levels",
    flyer: {
      image: "/assets/events/general-body.webp",
      width: 1000,
      height: 988,
      alt: "Flyer reading: Wednesday, first meeting of the Fall 2026 semester, CMII Building Room 211, September 2, 3:00 to 4:00 pm.",
    },
  },
  {
    id: "2026-09-11-cybersecurity-fundamentals",
    title: "Mastering Cybersecurity Fundamentals",
    date: "2026-09-11",
    category: "Workshop",
    difficulty: "Beginner",
    description: "The core ideas behind attacking and defending systems, for people with no security background.",
    flyer: {
      image: "/assets/events/fundamentals.webp",
      width: 1000,
      height: 1003,
      alt: "Flyer reading: Join us for our Mastering Cybersecurity Fundamentals workshop, over a background of code.",
    },
  },
  {
    id: "2026-09-22-resume-workshop",
    title: "Resume Workshop",
    date: "2026-09-22",
    start: "17:30",
    end: "19:30",
    location: "CLSO 150",
    description: "GSU tech clubs present a resume workshop.",
    category: "Career",
    flyer: {
      image: "/assets/events/resume-workshop.webp",
      width: 900,
      height: 1125,
      alt: "Flyer reading: GSU tech clubs present resume workshop, September 22nd, CLSO 150, 5:30 to 7:30 pm.",
    },
  },

  {
    id: "2026-10-07-jerry-perullo-talk",
    title: "From CISO to CEO: A Talk with Jerry Perullo",
    date: "2026-10-07",
    start: "15:00",
    end: "16:00",
    location: "CMII Building Room 211",
    description:
      "An exclusive conversation with Jerry Perullo, founding CISO of ICE/New York Stock Exchange, CEO of Adversarial Risk Management and proud GSU MBA alum, on lessons from more than 20 years leading cybersecurity at the highest levels. After two decades at ICE/NYSE he stepped in as Interim CISO at Silicon Valley Bank, then founded Adversarial Risk Management, a SaaS cyber risk management platform. He is also a Professor of the Practice at Georgia Tech, teaching Enterprise Cybersecurity Management to more than 400 students each semester.",
    category: "Speaker",
    difficulty: "All Levels",
    registrationUrl: "https://pin.gsu.edu/event/12843457",
    flyer: {
      image: "/assets/events/jerry-perullo.webp",
      width: 1000,
      height: 1000,
      alt: "Flyer reading: From CISO to CEO, a talk with Jerry Perullo, founding CISO of ICE/NYSE, CEO of Adversarial Risk Management and GSU MBA alum. Wednesday, October 7th, 3:00 to 4:00 pm, CMII Building Room 211. Includes a photo of Jerry Perullo.",
    },
  },
];

/**
 * Splits the list around `today` (YYYY-MM-DD). An event counts as held from
 * the day after it, so it stays upcoming for the whole of its own day.
 */
export function splitEvents(events: readonly ClubEvent[], today: string) {
  const byDate = [...events].sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? "").localeCompare(b.start ?? ""));
  return {
    upcoming: byDate.filter((e) => e.date >= today),
    past: byDate.filter((e) => e.date < today).reverse(),
  };
}

/** "6:30 PM" from "18:30". */
export function formatClock(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "6:30 PM to 8:00 PM", "6:30 PM", or null when no time is set. */
export function formatEventTime(event: Pick<ClubEvent, "start" | "end">) {
  if (!event.start) return null;
  return event.end ? `${formatClock(event.start)} to ${formatClock(event.end)}` : formatClock(event.start);
}

/** Plain YYYY-MM-DD days are formatted in UTC so they stay on that day. */
export function formatEventDate(date: string, options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...options });
}

/** Events on one YYYY-MM-DD day, earliest first. */
export function eventsOn(events: readonly ClubEvent[], date: string) {
  return events.filter((e) => e.date === date).sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
}

/** Events in one month ("YYYY-MM"), in date order. */
export function eventsInMonth(events: readonly ClubEvent[], month: string) {
  return splitEvents(
    events.filter((e) => e.date.startsWith(`${month}-`)),
    "0000-00-00",
  ).upcoming;
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
  const cells: (string | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => `${prefix}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
