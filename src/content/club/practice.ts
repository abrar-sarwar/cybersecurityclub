import { branding } from "@config/branding";

/**
 * Practice content for the Challenges page.
 *
 * To add a challenge, add one entry to `challenges`. To add a platform, add it to
 * `PlatformId` and `platforms`, then give it an accent colour in src/app/challenges.css.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";

export type PlatformId = "htb" | "cylab" | "club";

export type Platform = {
  id: PlatformId;
  name: string;
  description: string;
  href: string;
  level: string;
};

/** Platforms with no challenges listed are left off the page. */
export const platforms: Record<PlatformId, Platform> = {
  /** CyLab Security Academy, which replaced picoCTF in 2026. Existing picoCTF accounts still work there. */
  cylab: {
    id: "cylab",
    name: "CyLabs",
    description:
      "Free, beginner-friendly CTF challenges and learning paths from Carnegie Mellon University's CyLab Security Academy, formerly picoCTF. A good first stop if you have never done a CTF.",
    href: branding.links.cylabs,
    level: "Beginner friendly",
  },
  htb: {
    id: "htb",
    name: "Hack The Box",
    description: "Full vulnerable machines to break into, from easy to very hard. See the machines we recommend on this page.",
    href: branding.links.hackTheBox,
    level: "Beginner to advanced",
  },
  club: {
    id: "club",
    name: "Club Challenges",
    description: `Challenges written by ${branding.universityShortName} club members.`,
    href: "/challenges",
    level: "Made by the club",
  },
};

/** Topics in the order they appear on the page. */
export const categories = [
  "Getting Started",
  "Web",
  "Cryptography",
  "Forensics",
  "Active Directory",
  "Linux Privilege Escalation",
  "Windows",
] as const;

export type Category = (typeof categories)[number];

export type Challenge = {
  title: string;
  platform: PlatformId;
  category: Category;
  difficulty: Difficulty;
  /** What the challenge teaches, in a few words. */
  summary: string;
  href: string;
  /** Short labels shown on the tile, such as the operating system. */
  tags?: string[];
};

const htb = (
  category: Category,
  title: string,
  os: "Linux" | "Windows" | "Solaris",
  summary: string,
  difficulty: Difficulty = "Easy",
): Challenge => ({
  title,
  platform: "htb",
  category,
  difficulty,
  summary,
  href: `https://app.hackthebox.com/machines/${title}`,
  tags: [os],
});

/** `id` is the challenge's number in the CyLabs library, the same one picoCTF used. */
const cylab = (
  category: Category,
  id: number,
  title: string,
  summary: string,
  difficulty: Difficulty = "Easy",
): Challenge => ({
  title,
  platform: "cylab",
  category,
  difficulty,
  summary,
  href: `https://learn.cylabacademy.org/library/${id}?page=1`,
});

// PLACEHOLDER ids: only Obedient Cat (147) is confirmed. The other CyLabs ids are the
// challenges' old picoCTF numbers and still need checking against the CyLabs library.
// PLACEHOLDER curation: a starting list of retired Hack The Box machines and classic
// picoCTF challenges. Officers should confirm the picks, focus notes and difficulties.
export const challenges: Challenge[] = [
  cylab("Getting Started", 147, "Obedient Cat", "Reading a flag from a file"),
  cylab("Getting Started", 170, "Wave a flag", "Running a program and reading its help"),
  htb("Getting Started", "Lame", "Linux", "Linux, vulnerable network service"),
  htb("Getting Started", "Blue", "Windows", "Windows, SMB exploit"),
  htb("Getting Started", "Jerry", "Windows", "Windows, Tomcat default credentials"),
  htb("Getting Started", "Legacy", "Windows", "Windows, SMB exploit"),

  cylab("Web", 132, "GET aHEAD", "HTTP request methods"),
  cylab("Web", 173, "Cookies", "Tampering with session cookies"),
  htb("Web", "Nibbles", "Linux", "Web enumeration, CMS file upload"),
  htb("Web", "Shocker", "Linux", "CGI scripts, Shellshock"),
  htb("Web", "Bashed", "Linux", "Web enumeration, exposed web shell"),
  htb("Web", "Popcorn", "Linux", "File upload bypass", "Medium"),

  cylab("Cryptography", 144, "Mod 26", "ROT13 and Caesar ciphers"),
  cylab("Cryptography", 68, "The Numbers", "Substitution ciphers"),

  cylab("Forensics", 186, "Information", "Image metadata"),
  cylab("Forensics", 44, "Glory of the Garden", "Data hidden inside an image file"),

  htb("Active Directory", "Forest", "Windows", "AS-REP roasting, AD permissions"),
  htb("Active Directory", "Active", "Windows", "Group Policy passwords, Kerberoasting"),
  htb("Active Directory", "Sauna", "Windows", "User enumeration, AS-REP roasting"),
  htb("Active Directory", "Resolute", "Windows", "Password spraying, group privileges", "Medium"),

  htb("Linux Privilege Escalation", "Bashed", "Linux", "sudo misconfiguration, scheduled jobs"),
  htb("Linux Privilege Escalation", "Irked", "Linux", "SUID binaries"),
  htb("Linux Privilege Escalation", "Valentine", "Linux", "Heartbleed, exposed sessions"),
  htb("Linux Privilege Escalation", "Sunday", "Solaris", "Weak credentials, sudo rules"),

  htb("Windows", "Optimum", "Windows", "Vulnerable file server, kernel exploit"),
  htb("Windows", "Devel", "Windows", "FTP upload to web root, kernel exploit"),
  htb("Windows", "Grandpa", "Windows", "Old IIS, WebDAV"),
  htb("Windows", "Bastion", "Windows", "SMB shares, backup images"),
];
