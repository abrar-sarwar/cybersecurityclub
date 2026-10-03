import { branding } from "@config/branding";

/**
 * Practice content for the Challenges page.
 *
 * To add a challenge, add one entry to `challenges`. To add a platform, add it to
 * `PlatformId` and `platforms`, then give it an accent colour in src/app/challenges.css.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";

export type PlatformId = "htb" | "cylab" | "thm" | "club";

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
  thm: {
    id: "thm",
    name: "TryHackMe",
    description:
      "Guided rooms that teach a topic step by step in a browser-based lab. A good bridge between first CTFs and full machines.",
    href: branding.links.tryHackMe,
    level: "Beginner to intermediate",
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

/**
 * The learning path, in order. Each stage builds on the ones before it: the basics and
 * tooling first, then web, crypto and forensics, then full boot2root machines, which need
 * all of that plus privilege escalation, then Windows and Active Directory.
 */
export const stages = [
  {
    title: "Fundamentals",
    summary: "Get comfortable on the Linux command line and solve your first flags. Everything after this assumes you can move around a terminal.",
  },
  {
    title: "Web",
    summary: "Learn how HTTP, cookies and web apps work, and how to intercept traffic with Burp Suite. Most machines are broken into through a website.",
  },
  {
    title: "Cryptography",
    summary: "Classic ciphers and hash cracking. You will crack recovered password hashes on almost every machine later on.",
  },
  {
    title: "Forensics",
    summary: "Files, metadata and packet captures. Teaches you to look closely at what a system leaves behind.",
  },
  {
    title: "Network Tooling",
    summary: "Scanning and enumerating services with Nmap, the first step of every boot2root machine.",
  },
  {
    title: "First Linux Machines",
    summary: "Your first boot2root boxes: scan, find the weak service or web app, get a shell. Ordered from most guided to least.",
  },
  {
    title: "Linux Privilege Escalation",
    summary: "From a low-privileged shell to root: sudo rules, SUID binaries, scheduled jobs and leaked secrets.",
  },
  {
    title: "Windows Machines",
    summary: "The same workflow on Windows: SMB, IIS and file servers, then escalating to SYSTEM.",
  },
  {
    title: "Active Directory",
    summary: "The most advanced stage. Attacking Windows domains with Kerberos, AD permissions and password attacks.",
  },
] as const;

export type Category = (typeof stages)[number]["title"];

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

/** `slug` is the room's path on tryhackme.com/room/. */
const thm = (
  category: Category,
  slug: string,
  title: string,
  summary: string,
  difficulty: Difficulty = "Easy",
): Challenge => ({
  title,
  platform: "thm",
  category,
  difficulty,
  summary,
  href: `https://tryhackme.com/room/${slug}`,
});

// PLACEHOLDER ids: only Obedient Cat (147) is confirmed. The other CyLabs ids are the
// challenges' old picoCTF numbers and still need checking against the CyLabs library.
// PLACEHOLDER curation: a starting list of retired Hack The Box machines and classic
// picoCTF challenges and TryHackMe rooms. Officers should confirm the picks, focus notes and difficulties.
// Within each stage, challenges are listed in the order to attempt them.
export const challenges: Challenge[] = [
  thm("Fundamentals", "linuxfundamentalspart1", "Linux Fundamentals 1", "Navigating the Linux command line"),
  thm("Fundamentals", "linuxfundamentalspart2", "Linux Fundamentals 2", "SSH, file permissions and system files"),
  thm("Fundamentals", "linuxfundamentalspart3", "Linux Fundamentals 3", "Text editors, downloading files, processes and cron"),
  cylab("Fundamentals", 147, "Obedient Cat", "Reading a flag from a file"),
  cylab("Fundamentals", 170, "Wave a flag", "Running a program and reading its help"),

  thm("Web", "httpindetail", "HTTP in Detail", "Requests, responses, headers and cookies"),
  cylab("Web", 132, "GET aHEAD", "HTTP request methods"),
  cylab("Web", 173, "Cookies", "Tampering with session cookies"),
  thm("Web", "burpsuitebasics", "Burp Suite: The Basics", "Intercepting web traffic"),
  {
    ...thm("Web", "", "OWASP Top 10", "The most common web vulnerabilities"),
    href: "https://tryhackme.com/module/owasp-top-10-2025",
  },

  cylab("Cryptography", 144, "Mod 26", "ROT13 and Caesar ciphers"),
  cylab("Cryptography", 68, "The Numbers", "Substitution ciphers"),
  thm("Cryptography", "crackthehash", "Crack the Hash", "Identifying and cracking hashes"),

  cylab("Forensics", 186, "Information", "Image metadata"),
  cylab("Forensics", 44, "Glory of the Garden", "Data hidden inside an image file"),
  thm("Forensics", "wiresharkthebasics", "Wireshark: The Basics", "Reading packet captures"),

  thm("Network Tooling", "furthernmap", "Nmap", "Port scanning and service enumeration"),
  thm("Network Tooling", "vulnversity", "Vulnversity", "Recon, directory brute forcing and a first shell"),

  thm("First Linux Machines", "picklerick", "Pickle Rick", "Web enumeration and command injection"),
  thm("First Linux Machines", "rrootme", "RootMe", "File upload to shell, SUID root"),
  thm("First Linux Machines", "basicpentestingjt", "Basic Pentesting", "SMB enumeration, brute forcing, SSH keys"),
  thm("First Linux Machines", "simplectf", "Simple CTF", "Public exploit for a CMS, sudo escalation"),
  htb("First Linux Machines", "Lame", "Linux", "Vulnerable network service, straight to root"),
  htb("First Linux Machines", "Bashed", "Linux", "Web enumeration, exposed web shell, sudo"),
  htb("First Linux Machines", "Shocker", "Linux", "CGI scripts, Shellshock"),
  htb("First Linux Machines", "Nibbles", "Linux", "Web enumeration, CMS file upload"),

  thm("Linux Privilege Escalation", "kenobi", "Kenobi", "Samba and ProFTPD, PATH variable abuse"),
  thm("Linux Privilege Escalation", "linprivesc", "Linux PrivEsc", "Common privilege escalation paths", "Medium"),
  htb("Linux Privilege Escalation", "Irked", "Linux", "SUID binaries"),
  htb("Linux Privilege Escalation", "Valentine", "Linux", "Heartbleed, exposed sessions"),
  htb("Linux Privilege Escalation", "Sunday", "Solaris", "Weak credentials, sudo rules"),
  htb("Linux Privilege Escalation", "Popcorn", "Linux", "File upload bypass, kernel exploit", "Medium"),

  thm("Windows Machines", "blue", "Blue", "EternalBlue with Metasploit, guided"),
  thm("Windows Machines", "steelmountain", "Steel Mountain", "Vulnerable file server, PowerUp escalation"),
  thm("Windows Machines", "alfred", "Alfred", "Jenkins to shell, token impersonation"),
  htb("Windows Machines", "Legacy", "Windows", "SMB exploit"),
  htb("Windows Machines", "Blue", "Windows", "SMB exploit, EternalBlue"),
  htb("Windows Machines", "Jerry", "Windows", "Tomcat default credentials"),
  htb("Windows Machines", "Devel", "Windows", "FTP upload to web root, kernel exploit"),
  htb("Windows Machines", "Optimum", "Windows", "Vulnerable file server, kernel exploit"),
  htb("Windows Machines", "Grandpa", "Windows", "Old IIS, WebDAV"),
  htb("Windows Machines", "Bastion", "Windows", "SMB shares, backup images"),
  thm("Windows Machines", "windowsprivesc20", "Windows Privilege Escalation", "Common Windows misconfigurations", "Medium"),

  thm("Active Directory", "attacktivedirectory", "Attacktive Directory", "Enumerating and attacking a domain", "Medium"),
  htb("Active Directory", "Active", "Windows", "Group Policy passwords, Kerberoasting"),
  htb("Active Directory", "Sauna", "Windows", "User enumeration, AS-REP roasting"),
  htb("Active Directory", "Forest", "Windows", "AS-REP roasting, AD permissions"),
  htb("Active Directory", "Resolute", "Windows", "Password spraying, group privileges", "Medium"),
];
