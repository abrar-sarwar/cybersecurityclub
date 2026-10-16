// Links point at third-party material. Nothing copyrighted is hosted on this site.

export type ResourceLink = {
  name: string;
  /** One sentence: the reader should know what it is without opening it. */
  description: string;
  /** Absolute URL, or a site path starting with "/". */
  url: string;
  /** Short label shown next to the name, such as "Free" or "Paid". */
  note?: string;
};

export type ResourceSection = {
  id: string;
  title: string;
  intro: string;
  items: ResourceLink[];
};

/* ---------- Security+ ---------- */

export const SECURITY_PLUS_EXAM = "SY0-701";

export const SECURITY_PLUS: ResourceSection = {
  id: "security-plus",
  title: `Security+ (${SECURITY_PLUS_EXAM})`,
  intro: "What most members use to pass. Watch Messer for the concepts, then drill practice questions until the weak domains stop being weak.",
  items: [
    {
      name: "Professor Messer",
      description: "A complete free video course that follows the exam objectives in order, plus monthly live study groups.",
      url: "https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/",
      note: "Free",
    },
    {
      name: "Dion Training",
      description: "Jason Dion's video course and full-length practice exams; the practice exams are close to the real thing.",
      url: "https://www.diontraining.com/",
      note: "Paid",
    },
    {
      name: "Sybex Study Guide",
      description: "CompTIA Security+ Study Guide by Mike Chapple and David Seidl: the whole syllabus in book form, with review questions per chapter.",
      url: "https://www.amazon.com/s?k=Sybex+CompTIA+Security%2B+Study+Guide+SY0-701",
      note: "Book",
    },
    {
      name: "Sybex Practice Tests",
      description: "CompTIA Security+ Practice Tests by David Seidl: around a thousand questions organised by domain.",
      url: "https://www.amazon.com/s?k=Sybex+CompTIA+Security%2B+Practice+Tests+SY0-701",
      note: "Book",
    },
    {
      name: "CompTIA exam objectives",
      description: "The official list of everything the exam can ask. Use it as a checklist.",
      url: "https://www.comptia.org/en-us/certifications/security/",
      note: "Free",
    },
  ],
};

/* ---------- Platforms ---------- */

export const PLATFORMS: ResourceSection = {
  id: "platforms",
  title: "Platforms",
  intro: "Where to practise. Start with TryHackMe if you are new.",
  items: [
    {
      name: "Udemy",
      description: "Video courses and Security+ practice exam sets. Wait for a sale; courses drop to around $15 most weeks.",
      url: "https://www.udemy.com/courses/search/?q=comptia+security%2B",
      note: "Paid",
    },
    {
      name: "Hack The Box",
      description: "Full machines to break into: enumerate the network, exploit a service, escalate to root.",
      url: "https://www.hackthebox.com/",
      note: "Free tier",
    },
    {
      name: "CyLabs",
      description: "Carnegie Mellon's CTF platform, formerly picoCTF. Short challenges in every category, good for building general CTF skills.",
      url: "https://cylabacademy.org",
      note: "Free",
    },
  ],
};

/** TryHackMe gets its own highlighted block on the page. */
export const TRYHACKME = {
  name: "TryHackMe",
  url: "https://tryhackme.com/",
  description:
    "The best place to start. Guided rooms explain each concept and then give you a browser-based machine to try it on, so there is nothing to install.",
  recommended: {
    name: "Cyber Security 101",
    description: "The learning path we recommend to every new member: networking, Linux, Windows, web, cryptography and the core tools, in order.",
    url: "https://tryhackme.com/path/outline/cybersecurity101",
  },
};

/* ---------- CTF tools ---------- */

export const CTF_WEBSITES: ResourceSection = {
  id: "ctf-websites",
  title: "CTF tools: websites",
  intro: "Nothing to install. Keep these open in another tab.",
  items: [
    { name: "CyberChef", description: "Chain decoding, encoding, hashing and conversions in a drag-and-drop recipe. The Magic operation guesses the encoding for you.", url: "https://gchq.github.io/CyberChef/" },
    { name: "dCode", description: "Identifiers and solvers for hundreds of classical ciphers and encodings.", url: "https://www.dcode.fr/en" },
    { name: "Hashes.com", description: "Identify a hash type and look it up against a large database of cracked hashes.", url: "https://hashes.com/en/decrypt/hash" },
    { name: "CrackStation", description: "Looks up unsalted hashes against huge precomputed tables.", url: "https://crackstation.net/" },
    { name: "Aperi'Solve", description: "Upload an image and it runs the common steganography tools (zsteg, steghide, binwalk, exiftool) at once.", url: "https://www.aperisolve.com/" },
    { name: "HexEd.it", description: "A hex editor in the browser, for inspecting and fixing file headers and raw bytes.", url: "https://hexed.it/" },
    { name: "RevShells", description: "Generates reverse shell one-liners for your IP and port, in every language and shell.", url: "https://www.revshells.com/" },
    { name: "Exploit-DB", description: "A searchable archive of public exploits, indexed by software and CVE.", url: "https://www.exploit-db.com/" },
  ],
};

export const CTF_SOFTWARE: ResourceSection = {
  id: "ctf-software",
  title: "CTF tools: software",
  intro: "Installed locally. Most come preinstalled on Kali Linux.",
  items: [
    { name: "Nmap", description: "Scans a host or network for open ports and identifies the services and versions behind them.", url: "https://nmap.org/" },
    { name: "Gobuster", description: "Brute-forces directories, files, DNS subdomains and virtual hosts from a wordlist.", url: "https://github.com/OJ/gobuster" },
    { name: "ffuf", description: "A fast web fuzzer: put FUZZ anywhere in a request (path, parameter, header) and it tries every word in a list.", url: "https://github.com/ffuf/ffuf" },
    { name: "sqlmap", description: "Detects and exploits SQL injection automatically, from finding the bug to dumping the database.", url: "https://sqlmap.org/" },
    { name: "Burp Suite Community", description: "A proxy that intercepts, edits and replays the HTTP requests your browser sends.", url: "https://portswigger.net/burp/communitydownload" },
    { name: "Hydra", description: "Brute-forces logins over SSH, FTP, HTTP forms and dozens of other protocols.", url: "https://github.com/vanhauser-thc/thc-hydra" },
    { name: "John the Ripper / Hashcat", description: "Offline password crackers for hashes, zip files, SSH keys and more.", url: "https://hashcat.net/hashcat/" },
    { name: "Ghidra", description: "A free reverse engineering suite that disassembles binaries and decompiles them to readable C.", url: "https://ghidra-sre.org/" },
    { name: "Binary Ninja", description: "A reverse engineering platform with a cleaner interface than Ghidra; the free version covers most CTF binaries.", url: "https://binary.ninja/" },
    { name: "pwntools", description: "A Python library for writing exploits: talking to processes and sockets, packing addresses, building ROP chains.", url: "https://docs.pwntools.com/" },
    { name: "ExifTool", description: "Reads and edits the metadata hidden in images, documents and media files.", url: "https://exiftool.org/" },
    { name: "Binwalk", description: "Finds and extracts files embedded inside other files and firmware images.", url: "https://github.com/ReFirmLabs/binwalk" },
    { name: "Wireshark", description: "Opens packet captures and lets you filter, follow streams and extract transferred files.", url: "https://www.wireshark.org/" },
    { name: "CherryTree", description: "A hierarchical note-taking app; keep one tree per box or CTF with commands, creds and screenshots.", url: "https://www.giuspen.net/cherrytree/" },
  ],
};
