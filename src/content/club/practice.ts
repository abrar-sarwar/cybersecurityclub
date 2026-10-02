import { branding } from "@config/branding";

/** Practice content for the Challenges & Competitions page. */

export type Difficulty = "Easy" | "Medium" | "Hard";

export type Platform = {
  name: string;
  description: string;
  cta: string;
  href: string;
  level: string;
};

/** The club's own lab platform, shown as the prominent card. */
export const cylabs: Platform = {
  name: "CyLabs",
  // PLACEHOLDER: officers to confirm what CyLabs offers; the URL in config/branding.ts is also a placeholder.
  description: "The club's own practice environment. Start here for challenges picked for club members, then ask in Discord when you get stuck.",
  cta: "Practice on CyLabs",
  href: branding.links.cylabs,
  level: "Club platform",
};

export const platforms: Platform[] = [
  {
    name: "picoCTF",
    description: "Free, beginner-friendly CTF challenges from Carnegie Mellon University. A good first stop if you have never done a CTF.",
    cta: "Open picoCTF",
    href: branding.links.picoCtf,
    level: "Beginner friendly",
  },
  {
    name: "Hack The Box",
    description: "Full vulnerable machines to break into, from easy to very hard. See our recommended machines below.",
    cta: "Open Hack The Box",
    href: branding.links.hackTheBox,
    level: "Beginner to advanced",
  },
];

export type HtbMachine = {
  name: string;
  focus: string;
  difficulty: Difficulty;
  href: string;
};

export type HtbGroup = {
  title: string;
  machines: HtbMachine[];
};

const machine = (name: string, focus: string, difficulty: Difficulty = "Easy"): HtbMachine => ({
  name,
  focus,
  difficulty,
  href: `https://app.hackthebox.com/machines/${name}`,
});

// PLACEHOLDER curation: retired Hack The Box machines chosen as a starting list.
// Officers should confirm the picks, focus notes and difficulties.
export const htbGroups: HtbGroup[] = [
  {
    title: "Beginner Machines",
    machines: [
      machine("Lame", "Linux, vulnerable network service"),
      machine("Blue", "Windows, SMB exploit"),
      machine("Jerry", "Windows, Tomcat default credentials"),
      machine("Legacy", "Windows, SMB exploit"),
    ],
  },
  {
    title: "Web",
    machines: [
      machine("Nibbles", "Web enumeration, CMS file upload"),
      machine("Shocker", "CGI scripts, Shellshock"),
      machine("Bashed", "Web enumeration, exposed web shell"),
      machine("Popcorn", "File upload bypass", "Medium"),
    ],
  },
  {
    title: "Active Directory",
    machines: [
      machine("Forest", "AS-REP roasting, AD permissions"),
      machine("Active", "Group Policy passwords, Kerberoasting"),
      machine("Sauna", "User enumeration, AS-REP roasting"),
      machine("Resolute", "Password spraying, group privileges", "Medium"),
    ],
  },
  {
    title: "Linux Privilege Escalation",
    machines: [
      machine("Bashed", "sudo misconfiguration, scheduled jobs"),
      machine("Irked", "SUID binaries"),
      machine("Valentine", "Heartbleed, exposed sessions"),
      machine("Sunday", "Weak credentials, sudo rules"),
    ],
  },
  {
    title: "Windows",
    machines: [
      machine("Optimum", "Vulnerable file server, kernel exploit"),
      machine("Devel", "FTP upload to web root, kernel exploit"),
      machine("Grandpa", "Old IIS, WebDAV"),
      machine("Bastion", "SMB shares, backup images"),
    ],
  },
];

export type FeaturedChallenge = {
  title: string;
  platform: string;
  /** Skills in order, rendered as a chain. */
  focus: string[];
  difficulty: Difficulty;
  href: string;
  cta: string;
};

/** Challenge of the Week. Set to null to hide the section. */
// PLACEHOLDER: sample pick; officers update this weekly.
export const featuredChallenge: FeaturedChallenge | null = {
  title: "Nibbles",
  platform: "Hack The Box",
  focus: ["Web enumeration", "Initial access", "Linux privilege escalation"],
  difficulty: "Easy",
  href: "https://app.hackthebox.com/machines/Nibbles",
  cta: "Start Machine",
};
