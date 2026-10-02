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
    // PLACEHOLDER materials: sample links so the archive shows how they look.
    links: [
      { label: "Slides", href: "https://example.com/slides/cybersecurity-fundamentals", kind: "slides" },
      { label: "Lab files", href: "https://example.com/labs/cybersecurity-fundamentals", kind: "lab" },
    ],
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

  // PLACEHOLDER events below: sample data so the MVP has upcoming events to
  // show. Replace with confirmed events before launch.
  {
    id: "2026-10-07-intro-web-exploitation",
    title: "Intro to Web Exploitation",
    date: "2026-10-07",
    start: "18:30",
    end: "20:00",
    location: "Room TBA",
    description: "How HTTP requests, cookies and authentication work, and how common web vulnerabilities break them. Bring a laptop.",
    category: "Workshop",
    difficulty: "Beginner",
  },
  {
    id: "2026-10-14-general-body-meeting",
    title: "General Body Meeting",
    date: "2026-10-14",
    start: "15:00",
    end: "16:00",
    location: "Room TBA",
    description: "Club updates, what is coming up, and time to meet other members.",
    category: "General Body Meeting",
    difficulty: "All Levels",
  },
  {
    id: "2026-10-21-ctf-practice-night",
    title: "CTF Practice Night",
    date: "2026-10-21",
    start: "18:30",
    end: "20:30",
    location: "Room TBA",
    description: "Work through CyLabs challenges in small groups, with competitive team members on hand to help.",
    category: "CTF",
    difficulty: "All Levels",
  },
  {
    id: "2026-11-04-linux-privilege-escalation",
    title: "Linux Privilege Escalation",
    date: "2026-11-04",
    start: "18:30",
    end: "20:00",
    location: "Room TBA",
    description: "From a low-privilege shell to root: enumeration, SUID binaries, sudo misconfigurations and cron jobs.",
    category: "Workshop",
    difficulty: "Intermediate",
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
