import { branding } from "@config/branding";

/** Practice content for the Challenges page. */

export type Difficulty = "Easy" | "Medium" | "Hard";

export type Platform = {
  name: string;
  description: string;
  cta: string;
  href: string;
  level: string;
};

/** CyLab Security Academy, which replaced picoCTF in 2026. Existing picoCTF accounts still work there. */
export const cylabs: Platform = {
  name: "CyLabs",
  description:
    "Free, beginner-friendly CTF challenges and learning paths from Carnegie Mellon University's CyLab Security Academy, formerly picoCTF. A good first stop if you have never done a CTF.",
  cta: "Practice on CyLabs",
  href: branding.links.cylabs,
  level: "Beginner friendly",
};

/** Hack The Box, shown beside CyLabs. */
export const hackTheBox: Platform = {
  name: "Hack The Box",
  description: "Full vulnerable machines to break into, from easy to very hard. See our recommended machines below.",
  cta: "Open Hack The Box",
  href: branding.links.hackTheBox,
  level: "Beginner to advanced",
};

export type MachineOs = "Linux" | "Windows" | "Solaris";

export type HtbMachine = {
  name: string;
  os: MachineOs;
  focus: string;
  difficulty: Difficulty;
  href: string;
};

export type HtbGroup = {
  title: string;
  machines: HtbMachine[];
};

const machine = (name: string, os: MachineOs, focus: string, difficulty: Difficulty = "Easy"): HtbMachine => ({
  name,
  os,
  focus,
  difficulty,
  href: `https://app.hackthebox.com/machines/${name}`,
});

// PLACEHOLDER curation: retired Hack The Box machines chosen as a starting list.
// Officers should confirm the picks, operating systems, focus notes and difficulties.
export const htbGroups: HtbGroup[] = [
  {
    title: "Beginner Machines",
    machines: [
      machine("Lame", "Linux", "Linux, vulnerable network service"),
      machine("Blue", "Windows", "Windows, SMB exploit"),
      machine("Jerry", "Windows", "Windows, Tomcat default credentials"),
      machine("Legacy", "Windows", "Windows, SMB exploit"),
    ],
  },
  {
    title: "Web",
    machines: [
      machine("Nibbles", "Linux", "Web enumeration, CMS file upload"),
      machine("Shocker", "Linux", "CGI scripts, Shellshock"),
      machine("Bashed", "Linux", "Web enumeration, exposed web shell"),
      machine("Popcorn", "Linux", "File upload bypass", "Medium"),
    ],
  },
  {
    title: "Active Directory",
    machines: [
      machine("Forest", "Windows", "AS-REP roasting, AD permissions"),
      machine("Active", "Windows", "Group Policy passwords, Kerberoasting"),
      machine("Sauna", "Windows", "User enumeration, AS-REP roasting"),
      machine("Resolute", "Windows", "Password spraying, group privileges", "Medium"),
    ],
  },
  {
    title: "Linux Privilege Escalation",
    machines: [
      machine("Bashed", "Linux", "sudo misconfiguration, scheduled jobs"),
      machine("Irked", "Linux", "SUID binaries"),
      machine("Valentine", "Linux", "Heartbleed, exposed sessions"),
      machine("Sunday", "Solaris", "Weak credentials, sudo rules"),
    ],
  },
  {
    title: "Windows",
    machines: [
      machine("Optimum", "Windows", "Vulnerable file server, kernel exploit"),
      machine("Devel", "Windows", "FTP upload to web root, kernel exploit"),
      machine("Grandpa", "Windows", "Old IIS, WebDAV"),
      machine("Bastion", "Windows", "SMB shares, backup images"),
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
