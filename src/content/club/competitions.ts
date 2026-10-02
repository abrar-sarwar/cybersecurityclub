import { branding } from "@config/branding";

/** Content for the Challenges & Competitions page: the pathway and the competitions list. */

export type RegistrationStatus = "open" | "closed" | "upcoming" | "interest";

export type Competition = {
  name: string;
  /** Kind of competition, e.g. "Jeopardy-style CTF". */
  type: string;
  /** Free text, e.g. "Fall 2026 season". */
  date: string;
  teamSize: string;
  status: RegistrationStatus;
  description: string;
  link?: { label: string; href: string };
};

export const REGISTRATION_LABELS: Record<RegistrationStatus, string> = {
  open: "Registration open",
  closed: "Registration closed",
  upcoming: "Opening soon",
  interest: "Gauging interest",
};

export const competitions: Competition[] = [
  {
    name: "National Cyber League (NCL)",
    type: "Jeopardy-style CTF, individual and team games",
    date: "This semester", // PLACEHOLDER: officers to add season dates
    teamSize: "Individual game, then teams", // PLACEHOLDER: confirm team size
    status: "open",
    description:
      "The club is forming an NCL team this semester. Fill in the interest form and an officer will follow up with next steps. Beginners are welcome.",
    link: { label: "NCL interest form", href: branding.links.competitiveTeamApplication },
  },
  // PLACEHOLDER: the entries below are competitions the club is exploring, not commitments.
  // Officers should confirm, edit or remove each one.
  {
    name: "Collegiate CTFs",
    type: "Jeopardy-style CTF",
    date: "To be decided",
    teamSize: "Varies by event",
    status: "interest",
    description: "Weekend CTFs open to student teams. We are exploring which ones to enter together; tell us on Discord if you want in.",
  },
  {
    name: "CPTC (Collegiate Penetration Testing Competition)",
    type: "Penetration testing",
    date: "To be decided",
    teamSize: "To be confirmed",
    status: "interest",
    description: "A penetration test of a fictional company, with a written report. Something the club is exploring for a future season.",
  },
  {
    name: "CyberForce Competition",
    type: "Defense and infrastructure",
    date: "To be decided",
    teamSize: "To be confirmed",
    status: "interest",
    description: "Teams defend infrastructure against a red team. Something the club is exploring, not yet committed to.",
  },
  {
    name: "CCDC (Collegiate Cyber Defense Competition)",
    type: "Blue team defense",
    date: "To be decided",
    teamSize: "To be confirmed",
    status: "interest",
    description: "Teams keep business services running while under attack. Something the club is exploring, not yet committed to.",
  },
];

export type PathwayStep = {
  title: string;
  body: string;
  link?: { label: string; href: string };
};

export const pathway: PathwayStep[] = [
  {
    title: "Learn",
    body: "Come to a workshop or work through the beginner resources. No experience is assumed.",
    link: { label: "Getting started resources", href: "/resources#getting-started" },
  },
  {
    title: "Practice",
    body: "Solve challenges at your own pace on CyLabs and Hack The Box.",
    link: { label: "Practice platforms", href: "#practice" },
  },
  {
    title: "Participate",
    body: "Join club CTF sessions and internal practice, and solve alongside other members.",
    link: { label: "Upcoming events", href: "/events" },
  },
  {
    title: "Compete",
    body: "Enter external competitions with the university team.",
    link: { label: "Current competitions", href: "#competitions" },
  },
];
