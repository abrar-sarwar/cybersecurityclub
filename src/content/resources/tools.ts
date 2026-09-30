/**
 * The tool explorer: tools a student can install for free, what each one is
 * for, one exercise to try first, and which tools to pick up after it.
 *
 * Every first exercise runs on the student's own machine, a lab VM or
 * published practice data. `next` is what makes this explorable: following it
 * from any tool eventually reaches every other one.
 */
export const TOOL_CATEGORIES = {
  network: "Network",
  web: "Web apps",
  detection: "Detection and logs",
  forensics: "Endpoint and forensics",
  offense: "Offensive testing",
  analysis: "Analysis and scripting",
} as const;

export type ToolCategory = keyof typeof TOOL_CATEGORIES;

export type Tool = {
  id: string;
  name: string;
  category: ToolCategory;
  /** One sentence: what it does. */
  what: string;
  /** One exercise to try first. Backticks mark commands. */
  first: string;
  /** The official page. */
  href: string;
  /** Ids of the tools worth learning after this one. */
  next: string[];
  /** A beginner walkthrough on YouTube, where a good one was found. */
  watch?: string;
};

export const TOOLS: readonly Tool[] = [
  {
    id: "wireshark",
    name: "Wireshark",
    category: "network",
    what: "Captures network traffic and shows you every packet, layer by layer.",
    first: "Capture your own traffic while you load one website, then filter for `dns` and find the lookup.",
    href: "https://www.wireshark.org/",
    next: ["nmap", "suricata", "security-onion"],
    watch: "https://www.youtube.com/watch?v=qTaOZrDnMzQ",
  },
  {
    id: "nmap",
    name: "Nmap",
    category: "network",
    what: "Scans machines to find open ports and the services running behind them.",
    first: "Scan a virtual machine in your own lab with `nmap -sV` and look up each service it reports.",
    href: "https://nmap.org/",
    next: ["wireshark", "nessus", "metasploit"],
    watch: "https://www.youtube.com/watch?v=4t4kBkMsDbQ",
  },
  {
    id: "burp",
    name: "Burp Suite Community",
    category: "web",
    what: "Sits between your browser and a web app so you can read and change every request.",
    first: "Intercept the login request to OWASP Juice Shop in your lab and change one field before it is sent.",
    href: "https://portswigger.net/burp/communitydownload",
    next: ["zap", "cyberchef", "nmap"],
    watch: "https://www.youtube.com/watch?v=YCCrVtvAu2I",
  },
  {
    id: "zap",
    name: "ZAP",
    category: "web",
    what: "A free, open-source proxy and scanner for finding flaws in web apps.",
    first: "Run an automated scan against Juice Shop on localhost and read the three highest alerts.",
    href: "https://www.zaproxy.org/",
    next: ["burp", "nessus"],
  },
  {
    id: "splunk",
    name: "Splunk",
    category: "detection",
    what: "A SIEM: it collects logs from many systems and lets you search and chart them.",
    first: "Load the BOTS v3 practice dataset and write a search that counts failed logins by account.",
    href: "https://www.splunk.com/en_us/download/splunk-enterprise.html",
    next: ["wazuh", "security-onion", "python"],
    watch: "https://www.youtube.com/watch?v=3CiRs6WaWaU",
  },
  {
    id: "wazuh",
    name: "Wazuh",
    category: "detection",
    what: "An open-source SIEM and endpoint monitor that you host yourself.",
    first: "Install the agent on a lab machine, fail a login on purpose and find the alert it raises.",
    href: "https://wazuh.com/",
    next: ["splunk", "suricata", "sysinternals"],
  },
  {
    id: "security-onion",
    name: "Security Onion",
    category: "detection",
    what: "A free Linux distribution that bundles network monitoring, alerting and log search.",
    first: "Import a sample packet capture and work through the alerts it produces.",
    href: "https://securityonionsolutions.com/",
    next: ["suricata", "wireshark", "splunk"],
  },
  {
    id: "suricata",
    name: "Suricata",
    category: "detection",
    what: "A network intrusion detection engine: it reads traffic and raises alerts from rules.",
    first: "Run it against a saved packet capture and read the alert log it writes.",
    href: "https://suricata.io/",
    next: ["security-onion", "wireshark", "wazuh"],
  },
  {
    id: "sysinternals",
    name: "Sysinternals",
    category: "forensics",
    what: "Microsoft's free utilities for seeing what a Windows machine is really doing.",
    first: "Run Process Explorer and Autoruns on your own PC and look up anything you do not recognize.",
    href: "https://learn.microsoft.com/sysinternals/",
    next: ["volatility", "autopsy", "wazuh"],
  },
  {
    id: "autopsy",
    name: "Autopsy",
    category: "forensics",
    what: "Open-source disk forensics with a graphical interface.",
    first: "Open a practice disk image and build a timeline of what was created, opened and deleted.",
    href: "https://www.autopsy.com/",
    next: ["volatility", "sysinternals"],
  },
  {
    id: "volatility",
    name: "Volatility 3",
    category: "forensics",
    what: "Analyzes memory captures to show the processes, connections and code that were running.",
    first: "List the processes in a practice memory image and pick out the one that does not belong.",
    href: "https://github.com/volatilityfoundation/volatility3",
    next: ["autopsy", "ghidra", "sysinternals"],
  },
  {
    id: "metasploit",
    name: "Metasploit",
    category: "offense",
    what: "A framework of exploits and payloads for authorized penetration testing.",
    first: "Exploit one service on Metasploitable 2 inside your isolated lab, then write down why it worked.",
    href: "https://www.metasploit.com/",
    next: ["nmap", "hashcat", "burp"],
  },
  {
    id: "nessus",
    name: "Nessus Essentials",
    category: "offense",
    what: "A vulnerability scanner with a free edition for learning.",
    first: "Scan a lab machine and explain the three highest findings in your own words.",
    href: "https://www.tenable.com/products/nessus/nessus-essentials",
    next: ["nmap", "metasploit"],
  },
  {
    id: "hashcat",
    name: "Hashcat",
    category: "offense",
    what: "Recovers passwords from hashes, which shows you why weak passwords fail.",
    first: "Hash a password you made up, then recover it with a wordlist and time how long it takes.",
    href: "https://hashcat.net/hashcat/",
    next: ["cyberchef", "metasploit"],
  },
  {
    id: "cyberchef",
    name: "CyberChef",
    category: "analysis",
    what: "A browser tool for decoding, encoding and transforming data, one step at a time.",
    first: "Decode a Base64 string, then chain a second operation onto the result.",
    href: "https://gchq.github.io/CyberChef/",
    next: ["python", "wireshark", "hashcat"],
    watch: "https://www.youtube.com/watch?v=6S0v8lIk9oA",
  },
  {
    id: "ghidra",
    name: "Ghidra",
    category: "analysis",
    what: "The NSA's free reverse-engineering suite for taking compiled programs apart.",
    first: "Open a small practice binary and read the decompiled version of its main function.",
    href: "https://github.com/NationalSecurityAgency/ghidra",
    next: ["volatility", "cyberchef", "python"],
  },
  {
    id: "python",
    name: "Python",
    category: "analysis",
    what: "The language a great deal of security tooling is written in or automated with.",
    first: "Write a short script that reads a log file and counts failed logins per address.",
    href: "https://www.python.org/",
    next: ["splunk", "cyberchef", "ghidra"],
  },
];

export function getTool(id: string): Tool | undefined {
  return TOOLS.find((tool) => tool.id === id);
}
