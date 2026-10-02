/**
 * The competitive team: students who represent GSU in CTFs and collegiate
 * cybersecurity competitions. The roster is empty until it is confirmed;
 * the page shows an "being formed" state while this array has no entries.
 */
export const SPECIALTIES = {
  web: "Web",
  cryptography: "Cryptography",
  reversing: "Reversing",
  pwn: "Pwn",
  forensics: "Forensics",
  networking: "Networking",
  defense: "Defense",
} as const;

export type Specialty = keyof typeof SPECIALTIES;

export type CompetitiveMember = {
  name: string;
  role?: string;
  specialties: Specialty[];
  /** Competitions this person has played in for the club. */
  competitions?: string[];
  linkedin?: string;
  github?: string;
};

export const COMPETITIVE_TEAM_TERM = "Fall 2026";

export const COMPETITIVE_TEAM_INTRO =
  "The competitive team represents GSU in Capture the Flag events and collegiate cybersecurity competitions.";

export const COMPETITIVE_TEAM: readonly CompetitiveMember[] = [
  // PLACEHOLDER example of the shape. Do not uncomment; add real members only.
  // {
  //   name: "First name",
  //   role: "Captain",
  //   specialties: ["web", "forensics"],
  //   competitions: ["NCL Fall 2026"],
  //   linkedin: "https://www.linkedin.com/in/example/",
  //   github: "https://github.com/example",
  // },
];
