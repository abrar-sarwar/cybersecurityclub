/**
 * The club's events, kept by hand: PIN has no feed we can read, so this list
 * is the single source for the events page.
 *
 * To announce an event, add an entry below. Nothing else needs editing: the
 * page works out from the date which events are still ahead and moves each
 * one to "past" by itself the day after it happens.
 *
 * Only state what is confirmed. Leave `rsvpUrl` and `flyer` off until they exist.
 */
export type ClubEvent = {
  title: string;
  /** The day it happens, as YYYY-MM-DD in the club's timezone. */
  datetime: string;
  /** Room and time, as printed on the flyer. */
  detail: string;
  /** One or two sentences on what to expect. */
  summary?: string;
  /** The event's own page on PIN. Without it the page links to the club's PIN list. */
  rsvpUrl?: string;
  flyer?: { image: string; width: number; height: number; alt: string };
};

export const CLUB_EVENTS: readonly ClubEvent[] = [
  {
    title: "General Body Meeting",
    datetime: "2026-09-02",
    detail: "CMII Building Room 211, 3:00 to 4:00 pm",
    flyer: {
      image: "/assets/events/general-body.webp",
      width: 1000,
      height: 988,
      alt: "Flyer reading: Wednesday, first meeting of the Fall 2026 semester, CMII Building Room 211, September 2, 3:00 to 4:00 pm.",
    },
  },
  {
    title: "Mastered Cybersecurity Fundamentals",
    datetime: "2026-09-11",
    detail: "Workshop",
    flyer: {
      image: "/assets/events/fundamentals.webp",
      width: 1000,
      height: 1003,
      alt: "Flyer reading: Join us for our Mastering Cybersecurity Fundamentals workshop, over a background of code.",
    },
  },
  {
    title: "Resume Workshop",
    datetime: "2026-09-22",
    detail: "CLSO 150, 5:30 to 7:30 pm",
    flyer: {
      image: "/assets/events/resume-workshop.webp",
      width: 900,
      height: 1125,
      alt: "Flyer reading: GSU tech clubs present resume workshop, September 22nd, CLSO 150, 5:30 to 7:30 pm.",
    },
  },
];

/**
 * Splits the list around `today` (YYYY-MM-DD). An event counts as held from
 * the day after it, so it stays upcoming for the whole of its own day.
 */
export function splitEvents(events: readonly ClubEvent[], today: string) {
  const byDate = [...events].sort((a, b) => a.datetime.localeCompare(b.datetime));
  return {
    upcoming: byDate.filter((e) => e.datetime >= today),
    past: byDate.filter((e) => e.datetime < today).reverse(),
  };
}

/**
 * National Cyber League recruitment. A team is being formed this semester and
 * the linked form collects interest: it does not confirm a place, a cost or a
 * competition date, so nothing here states one.
 */
export const NCL = {
  eyebrow: "Recruiting now",
  heading: "Want to compete in a CTF?",
  body: "We are putting together a GSU team for the National Cyber League this semester. It is a practical way to build skills you can point to, and a competition you can put on a résumé. No experience required.",
  linkLabel: "Interest form",
  formUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSeiTdYxhaLUd1khSRXTAYv-uinm7elH9W_BjOD8nW17QcJVIA/viewform?usp=sharing&ouid=117590049843765622395",
  points: [
    "Hands-on challenges, not multiple choice",
    "Something concrete to talk about in interviews",
    "Open to every skill level",
  ],
} as const;
