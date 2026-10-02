// PLACEHOLDER curation: every list here is a first pass, not the board's confirmed picks.
// Links point at free, third-party material. Nothing copyrighted is hosted on this site.

export type ResourceLink = {
  name: string;
  /** One sentence. */
  description: string;
  /** Absolute URL, or a site path starting with "/". */
  url: string;
};

/* ---------- Getting started ---------- */

export type StartStep = {
  title: string;
  summary: string;
  resources: ResourceLink[];
};

export const GETTING_STARTED: StartStep[] = [
  {
    title: "Learn basic Linux commands",
    summary: "Almost every security tool and CTF box assumes you can move around a terminal.",
    resources: [
      { name: "OverTheWire: Bandit", description: "A wargame that teaches the shell one small level at a time, over SSH.", url: "https://overthewire.org/wargames/bandit/" },
      { name: "Linux Journey", description: "Short, free lessons on the command line, files, permissions and processes.", url: "https://linuxjourney.com/" },
    ],
  },
  {
    title: "Learn networking fundamentals",
    summary: "IP addresses, ports, DNS and TCP are the vocabulary for everything that follows.",
    resources: [
      { name: "Professor Messer: Network+", description: "A free video course covering the whole Network+ syllabus in short clips.", url: "https://www.professormesser.com/network-plus/n10-009/n10-009-video/n10-009-training-course/" },
      { name: "Wireshark", description: "Capture your own traffic and look at what the protocols actually send.", url: "https://www.wireshark.org/" },
    ],
  },
  {
    title: "Learn how HTTP works",
    summary: "Requests, responses, headers and cookies: the basis of all web challenges.",
    resources: [
      { name: "MDN: An overview of HTTP", description: "A clear written explanation of requests, responses, methods and headers.", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview" },
      { name: "PortSwigger Web Security Academy", description: "Free web security lessons with hands-on labs, starting from the basics.", url: "https://portswigger.net/web-security" },
    ],
  },
  {
    title: "Try beginner CTF challenges",
    summary: "Solving small puzzles is the fastest way to find out what you enjoy.",
    resources: [
      { name: "picoCTF", description: "A free, beginner-oriented CTF with a year-round practice gym in every category.", url: "https://picoctf.org" },
      { name: "Club challenges", description: "Where the club practises and which competitions we enter.", url: "/challenges" },
    ],
  },
  {
    title: "Attend club workshops",
    summary: "Hands-on sessions run by members, with people next to you to ask.",
    resources: [{ name: "Events", description: "Upcoming workshops and meetings, with times and rooms.", url: "/events" }],
  },
  {
    title: "Begin Hack The Box machines",
    summary: "Full machines to break into, once the fundamentals feel comfortable.",
    resources: [
      { name: "HTB Starting Point", description: "Guided, very easy machines that walk you through your first compromises.", url: "https://app.hackthebox.com/starting-point" },
      { name: "HTB Academy", description: "Structured modules with free introductory tiers on common techniques.", url: "https://academy.hackthebox.com/" },
      { name: "Hack The Box with the club", description: "How the club uses Hack The Box and how to join in.", url: "/challenges#htb" },
    ],
  },
];

/* ---------- Security+ ---------- */

export const SECURITY_PLUS_EXAM = "SY0-701";

export type SecurityPlusDomain = {
  number: number;
  title: string;
  /** Share of the exam, in percent. */
  weight: number;
  topics: string[];
};

export const SECURITY_PLUS_DOMAINS: SecurityPlusDomain[] = [
  { number: 1, title: "General Security Concepts", weight: 12, topics: ["Security controls", "CIA triad and AAA", "Zero trust", "Change management", "Cryptography and PKI"] },
  { number: 2, title: "Threats, Vulnerabilities & Mitigations", weight: 22, topics: ["Threat actors and motivations", "Social engineering", "Vulnerability types", "Indicators of malicious activity", "Hardening and mitigation"] },
  { number: 3, title: "Security Architecture", weight: 18, topics: ["Cloud and virtualization", "Secure network design", "Data protection", "Resilience and recovery"] },
  { number: 4, title: "Security Operations", weight: 28, topics: ["Hardening and baselines", "Vulnerability management", "Monitoring and alerting", "Identity and access management", "Incident response", "Automation"] },
  { number: 5, title: "Security Program Management & Oversight", weight: 20, topics: ["Governance and policy", "Risk management", "Third-party risk", "Compliance and audits", "Security awareness"] },
];

/** `url` is omitted for material that is not available yet. */
export type StudyResource = { name: string; description: string; url?: string };

export const SECURITY_PLUS_RESOURCES: StudyResource[] = [
  { name: "Official CompTIA exam objectives", description: "The authoritative list of what the exam can ask; download the objectives PDF from CompTIA.", url: "https://www.comptia.org/en-us/certifications/security/" },
  { name: "Professor Messer SY0-701 course", description: "A complete free video course that follows the objectives in order.", url: "https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/" },
  { name: "Practice exams (ExamCompass)", description: "Free practice quizzes sorted by topic, good for finding weak domains.", url: "https://www.examcompass.com/comptia/security-plus-certification/free-security-plus-practice-tests" },
  { name: "Flashcards (Anki)", description: "A free spaced-repetition app; make your own deck or import a shared SY0-701 one for acronyms and ports.", url: "https://apps.ankiweb.net/" },
  { name: "Club study notes", description: "Notes written by members who have passed the exam." },
];

/* ---------- CTF toolkit ---------- */

export const TOOL_CATEGORIES = ["General", "Web", "Cryptography", "Reverse Engineering", "Forensics", "Binary Exploitation", "OSINT"] as const;
export type ToolCategory = (typeof TOOL_CATEGORIES)[number];
export type ToolTag = "beginner" | "install" | "browser" | "cli";

export const TOOL_TAG_LABELS: Record<ToolTag, string> = {
  beginner: "Beginner friendly",
  install: "Requires install",
  browser: "Browser tool",
  cli: "CLI tool",
};

export type Tool = {
  name: string;
  /** One sentence: the reader should understand the tool without opening it. */
  description: string;
  url: string;
  category: ToolCategory;
  tags?: ToolTag[];
};

export const TOOLS: Tool[] = [
  { name: "CyberChef", description: "Chain encoding, decoding, hashing and data conversions together in a drag-and-drop recipe.", url: "https://gchq.github.io/CyberChef/", category: "General", tags: ["beginner", "browser"] },
  { name: "GTFOBins", description: "Lookup of Unix binaries that can be abused to escalate privileges or escape restricted shells.", url: "https://gtfobins.github.io/", category: "General", tags: ["browser"] },
  { name: "HackTricks", description: "A large searchable wiki of pentesting techniques and checklists for most services and platforms.", url: "https://book.hacktricks.wiki/", category: "General", tags: ["browser"] },

  { name: "Burp Suite Community", description: "A proxy that intercepts, edits and replays the HTTP requests your browser sends.", url: "https://portswigger.net/burp/communitydownload", category: "Web", tags: ["install"] },
  { name: "jwt.io", description: "Paste a JSON Web Token to decode its header and payload and check its signature.", url: "https://jwt.io/", category: "Web", tags: ["beginner", "browser"] },
  { name: "Webhook.site", description: "Gives you a throwaway URL that logs every request sent to it, for catching callbacks and exfiltrated data.", url: "https://webhook.site/", category: "Web", tags: ["browser"] },

  { name: "CyberChef", description: "Decode Base64, hex, XOR and classic ciphers, with a Magic operation that guesses the encoding.", url: "https://gchq.github.io/CyberChef/", category: "Cryptography", tags: ["beginner", "browser"] },
  { name: "dCode", description: "Solvers and identifiers for hundreds of classical ciphers and encodings.", url: "https://www.dcode.fr/en", category: "Cryptography", tags: ["beginner", "browser"] },
  { name: "CrackStation", description: "Looks up unsalted hashes against huge precomputed tables and reports the hash type it matched.", url: "https://crackstation.net/", category: "Cryptography", tags: ["browser"] },

  { name: "Ghidra", description: "A free reverse engineering suite that disassembles binaries and decompiles them to readable C.", url: "https://ghidra-sre.org/", category: "Reverse Engineering", tags: ["install"] },
  { name: "Compiler Explorer", description: "Type C or C++ and see the assembly each line compiles to, side by side.", url: "https://godbolt.org/", category: "Reverse Engineering", tags: ["beginner", "browser"] },
  { name: "Shell-Storm shellcode database", description: "An archive of ready-made shellcode samples for many architectures and operating systems.", url: "https://shell-storm.org/shellcode/", category: "Reverse Engineering", tags: ["browser"] },

  { name: "Wireshark", description: "Opens packet captures and lets you filter, follow streams and extract transferred files.", url: "https://www.wireshark.org/", category: "Forensics", tags: ["beginner", "install"] },
  { name: "ExifTool", description: "Reads and edits the metadata hidden in images, documents and media files.", url: "https://exiftool.org/", category: "Forensics", tags: ["install", "cli"] },
  { name: "List of file signatures", description: "A table of magic bytes for identifying or repairing a file by its first few bytes.", url: "https://en.wikipedia.org/wiki/List_of_file_signatures", category: "Forensics", tags: ["browser"] },

  { name: "pwntools", description: "A Python library for writing exploits: talking to processes and sockets, packing addresses, building ROP chains.", url: "https://docs.pwntools.com/", category: "Binary Exploitation", tags: ["install", "cli"] },
  { name: "ROPgadget", description: "Searches a binary for instruction sequences you can chain into a return-oriented exploit.", url: "https://github.com/JonathanSalwan/ROPgadget", category: "Binary Exploitation", tags: ["install", "cli"] },
  { name: "checksec", description: "Reports which protections a binary was built with, such as NX, PIE, stack canaries and RELRO.", url: "https://github.com/slimm609/checksec", category: "Binary Exploitation", tags: ["install", "cli"] },

  { name: "OSINT Framework", description: "A clickable tree of free investigation tools, organised by the kind of information you are after.", url: "https://osintframework.com/", category: "OSINT", tags: ["beginner", "browser"] },
  { name: "Wayback Machine", description: "Shows archived copies of a web page as it looked on past dates.", url: "https://web.archive.org/", category: "OSINT", tags: ["beginner", "browser"] },
  { name: "Shodan", description: "A search engine for internet-connected devices and the services they expose.", url: "https://www.shodan.io/", category: "OSINT", tags: ["browser"] },
];

/* ---------- Workshop materials ---------- */

export type WorkshopTopic = {
  topic: string;
  /** Slides, repos or write-ups from club workshops. Leave empty until published. */
  links?: { label: string; url: string }[];
};

export const WORKSHOP_TOPICS: WorkshopTopic[] = [
  { topic: "Networking" },
  { topic: "Linux" },
  { topic: "Web" },
  { topic: "Cryptography" },
  { topic: "Forensics" },
  { topic: "Reverse engineering" },
  { topic: "Binary exploitation" },
  { topic: "Active Directory" },
];
