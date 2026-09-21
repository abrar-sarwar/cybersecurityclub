/**
 * Semester event board. Past sessions carry their flyer; the rest are
 * deliberately blank teasers.
 *
 * Only dates and titles that actually happened are stated as fact. The locked
 * slots promise nothing specific: they carry a month-long awareness theme and
 * a "to be announced" line rather than invented events, times or rooms.
 */
export type Flyer = {
  title: string;
  /** Short display date for the timeline. */
  date: string;
  /** Machine-readable date, also used to decide what has already happened. */
  datetime: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  detail: string;
};

export const EVENT_FLYERS: readonly Flyer[] = [
  {
    title: "General Body Meeting",
    date: "September 2",
    datetime: "2026-09-02",
    image: "/assets/events/general-body.webp",
    width: 1000,
    height: 988,
    alt: "Flyer reading: Wednesday, first meeting of the Fall 2026 semester, CMII Building Room 211, September 2, 3:00 to 4:00 pm.",
    detail: "CMII Building Room 211, 3:00 to 4:00 pm",
  },
  {
    title: "Mastered Cybersecurity Fundamentals",
    date: "September 11",
    datetime: "2026-09-11",
    image: "/assets/events/fundamentals.webp",
    width: 1000,
    height: 1003,
    alt: "Flyer reading: Join us for our Mastering Cybersecurity Fundamentals workshop, over a background of code.",
    detail: "Workshop",
  },
  {
    title: "Resume Workshop",
    date: "September 22",
    datetime: "2026-09-22",
    image: "/assets/events/resume-workshop.webp",
    width: 900,
    height: 1125,
    alt: "Flyer reading: GSU tech clubs present resume workshop, September 22nd, CLSO 150, 5:30 to 7:30 pm.",
    detail: "CLSO 150, 5:30 to 7:30 pm",
  },
];

/** Glyph soup for the locked cards. Terms only, nothing that reads as an instruction. */
export const TEASER_WORDS = [
  "0x4E5443",
  "nmap -sV",
  "SHA-256",
  "AES-GCM",
  "buffer",
  "0day",
  "XSS",
  "SIEM",
  "payload",
  "entropy",
  "subnet",
  "rainbow",
  "salt",
  "TTP",
  "C2",
  "pivot",
  "LFI",
  "JWT",
  "ROT13",
  "base64",
  "SYN/ACK",
  "priv-esc",
  "CVE-2026",
  "hashcat",
  "netcat",
  "reverse",
  "beacon",
  "honeypot",
];

export const TEASER_BANNER = "October is Cybersecurity Awareness Month";

/** Four locked slots. Each states only that something is coming. */
export const TEASERS: readonly { code: string; label: string }[] = [
  { code: "ERR_LOCKED_0x01", label: "Decrypting" },
  { code: "ERR_LOCKED_0x02", label: "Decrypting" },
  { code: "ERR_LOCKED_0x03", label: "Decrypting" },
  { code: "ERR_LOCKED_0x04", label: "Decrypting" },
];

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
