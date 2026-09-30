/**
 * The tool map: tools a student can install for free, placed in the part of a
 * small network where each one is used.
 *
 * The defensive and analysis tools open into a longer look: why the tool
 * matters, how it works, and a walkthrough video. The testing tools carry a
 * short description and a link to their own documentation. Every first
 * exercise runs on the student's own machine, a lab VM or published practice
 * data. `next` is what makes the map explorable: following it from any tool
 * eventually reaches every other one.
 */
export const TOOL_ZONES = {
  outside: {
    name: "Testing from outside",
    node: "Tester's laptop",
    blurb: "Where an authorized test begins: seeing what a network shows to the world.",
    at: [0, 0],
  },
  web: {
    name: "The web app",
    node: "Web server",
    blurb: "The part of a company anyone can reach, so it is tested the hardest.",
    at: [0, 1],
  },
  wire: {
    name: "On the wire",
    node: "Switch and network tap",
    blurb: "Every packet between machines passes through here, where it can be captured and inspected.",
    at: [0, 2],
  },
  endpoint: {
    name: "On the endpoint",
    node: "Laptops and servers",
    blurb: "Where programs run, and where they leave evidence behind.",
    at: [1, 2],
  },
  soc: {
    name: "In the SOC",
    node: "Log server and SIEM",
    blurb: "Logs and alerts from every other part arrive here to be searched.",
    at: [1, 1],
  },
  bench: {
    name: "The analyst's bench",
    node: "Analyst workstation",
    blurb: "Where a suspicious file or string is taken apart to see what it is.",
    at: [1, 0],
  },
} as const satisfies Record<string, { name: string; node: string; blurb: string; at: readonly [row: number, column: number] }>;

export type ToolZone = keyof typeof TOOL_ZONES;

/** What travels between the parts. Each pair sits side by side on the map, so the wire crosses one gap. */
export const TOOL_FLOWS: readonly (readonly [from: ToolZone, to: ToolZone, carries: string])[] = [
  ["outside", "web", "requests"],
  ["web", "wire", "traffic"],
  ["wire", "endpoint", "packets"],
  ["web", "soc", "logs"],
  ["endpoint", "soc", "logs"],
  ["soc", "bench", "evidence"],
];

export type ToolVideo = {
  /** The YouTube video id. */
  id: string;
  /** The title as it appears on YouTube. */
  title: string;
  channel: string;
  /** Running time as m:ss. */
  length: string;
};

export type Tool = {
  id: string;
  name: string;
  zone: ToolZone;
  /** One sentence: what it does. */
  what: string;
  /** One exercise to try first. Backticks mark commands. */
  first: string;
  /** The official page. */
  href: string;
  /** Ids of the tools worth learning after this one. */
  next: string[];
  /** A beginner walkthrough on YouTube, linked out. */
  watch?: string;
  /** The longer look, shown in the tool's window. */
  depth?: {
    /** Why it is worth learning, in two or three sentences. */
    why: string;
    /** How it works, as a few steps in order. Backticks mark commands and file names. */
    how: string[];
    /** A walkthrough that plays inside the window. */
    video: ToolVideo;
  };
};

export const TOOLS: readonly Tool[] = [
  {
    id: "nmap",
    name: "Nmap",
    zone: "outside",
    what: "Scans machines to find open ports and the services running behind them.",
    first: "Scan a virtual machine in your own lab with `nmap -sV` and look up each service it reports.",
    href: "https://nmap.org/",
    next: ["wireshark", "nessus", "metasploit"],
    watch: "https://www.youtube.com/watch?v=4t4kBkMsDbQ",
  },
  {
    id: "nessus",
    name: "Nessus Essentials",
    zone: "outside",
    what: "A vulnerability scanner with a free edition for learning.",
    first: "Scan a lab machine and explain the three highest findings in your own words.",
    href: "https://www.tenable.com/products/nessus/nessus-essentials",
    next: ["nmap", "metasploit"],
  },
  {
    id: "metasploit",
    name: "Metasploit",
    zone: "outside",
    what: "A framework of exploits and payloads for authorized penetration testing.",
    first: "Exploit one service on Metasploitable 2 inside your isolated lab, then write down why it worked.",
    href: "https://www.metasploit.com/",
    next: ["nmap", "hashcat", "burp"],
  },
  {
    id: "hashcat",
    name: "Hashcat",
    zone: "outside",
    what: "Recovers passwords from hashes, which shows you why weak passwords fail.",
    first: "Hash a password you made up, then recover it with a wordlist and time how long it takes.",
    href: "https://hashcat.net/hashcat/",
    next: ["cyberchef", "metasploit"],
  },
  {
    id: "burp",
    name: "Burp Suite Community",
    zone: "web",
    what: "Sits between your browser and a web app so you can read and change every request.",
    first: "Intercept the login request to OWASP Juice Shop in your lab and change one field before it is sent.",
    href: "https://portswigger.net/burp/communitydownload",
    next: ["zap", "cyberchef", "nmap"],
    watch: "https://www.youtube.com/watch?v=YCCrVtvAu2I",
  },
  {
    id: "zap",
    name: "ZAP",
    zone: "web",
    what: "A free, open-source proxy and scanner for finding flaws in web apps.",
    first: "Run an automated scan against Juice Shop on localhost and read the three highest alerts.",
    href: "https://www.zaproxy.org/",
    next: ["burp", "nessus"],
  },
  {
    id: "wireshark",
    name: "Wireshark",
    zone: "wire",
    what: "Captures network traffic and shows you every packet, layer by layer.",
    first: "Capture your own traffic while you load one website, then filter for `dns` and find the lookup.",
    href: "https://www.wireshark.org/",
    next: ["tcpdump", "suricata", "zeek"],
    depth: {
      why: "Almost every security question ends in \"what was actually sent?\". Wireshark answers it. Reading a capture is how you confirm an alert, understand a protocol, and see what a tool is really doing on the network.",
      how: [
        "It records each frame that passes a network interface you choose.",
        "It decodes every layer: Ethernet, IP, TCP or UDP, then the application protocol such as DNS or HTTP.",
        "Display filters such as `dns` or `ip.addr == 10.0.0.5` cut thousands of packets down to the few that matter.",
        "Follow Stream rebuilds one whole conversation so you can read it from top to bottom.",
      ],
      video: { id: "qTaOZrDnMzQ", title: "Wireshark Tutorial for Beginners | Network Scanning Made Easy", channel: "Anson Alexander", length: "20:11" },
    },
  },
  {
    id: "tcpdump",
    name: "tcpdump",
    zone: "wire",
    what: "Captures packets from the command line, on machines that have no desktop.",
    first: "In a lab VM, run `sudo tcpdump -i any port 53 -c 20`, then load a web page and watch the DNS lookups go by.",
    href: "https://www.tcpdump.org/",
    next: ["wireshark", "zeek", "suricata"],
    depth: {
      why: "Servers and cloud machines rarely have a screen. tcpdump is already on most Linux systems, so it is how traffic gets captured where the problem is. The file it saves opens in Wireshark.",
      how: [
        "It listens on the interface you name with `-i`.",
        "A filter such as `port 53` or `host 10.0.0.5` decides which packets are kept.",
        "`-w capture.pcap` writes the packets to a file instead of printing them.",
        "You copy that file to your own machine and read it in Wireshark.",
      ],
      video: { id: "KTvuyN1QGqs", title: "packet capture tutorial using tcpdump", channel: "BlueMonkey 4n6", length: "16:53" },
    },
  },
  {
    id: "suricata",
    name: "Suricata",
    zone: "wire",
    what: "A network intrusion detection engine: it reads traffic and raises alerts from rules.",
    first: "Run it against a saved packet capture and read the alert log it writes.",
    href: "https://suricata.io/",
    next: ["zeek", "security-onion", "wireshark"],
    depth: {
      why: "Nobody can read every packet. An intrusion detection system does the watching and raises an alert when traffic matches a known bad pattern. Those alerts are a large part of what a SOC analyst works through.",
      how: [
        "It reads traffic from an interface or from a saved capture.",
        "Each packet and stream is compared against a set of rules, called signatures.",
        "A match writes an alert, with the rule name and the addresses involved, to a log file called `eve.json`.",
        "That log is sent on to a SIEM, where an analyst decides whether the alert is real.",
      ],
      video: { id: "uXNhwduQve8", title: "Cybersecurity Tool: How To Install an IDS (Suricata)", channel: "MyDFIR", length: "12:48" },
    },
  },
  {
    id: "zeek",
    name: "Zeek",
    zone: "wire",
    what: "Turns network traffic into tidy logs: one line per connection, DNS query, web request and file.",
    first: "Run Zeek against a saved packet capture and read `conn.log` to list who talked to whom.",
    href: "https://zeek.org/",
    next: ["suricata", "security-onion", "wireshark"],
    depth: {
      why: "A packet capture is huge and slow to search. Zeek keeps the facts about each conversation and drops the bulk, so weeks of network history stay searchable. Threat hunters rely on it for that reason.",
      how: [
        "It watches traffic on an interface or reads a saved capture.",
        "It works out which protocol each connection is speaking and follows it.",
        "It writes separate logs such as `conn.log`, `dns.log` and `http.log`.",
        "Those logs are searched directly or forwarded to a SIEM.",
      ],
      video: { id: "FdWr5N0JAGU", title: "Zero to Zeek: Build a Network Sensor Fast and Easy w/ Troy Wojewoda", channel: "Black Hills Information Security", length: "77:20" },
    },
  },
  {
    id: "sysinternals",
    name: "Sysinternals",
    zone: "endpoint",
    what: "Microsoft's free utilities for seeing what a Windows machine is really doing.",
    first: "Run Process Explorer and Autoruns on your own PC and look up anything you do not recognize.",
    href: "https://learn.microsoft.com/sysinternals/",
    next: ["sysmon", "volatility", "autopsy"],
    depth: {
      why: "Task Manager shows only part of what Windows is doing. These tools show the rest: which program started which, what runs at startup, and which process owns a network connection. Responders reach for them first on a suspect machine.",
      how: [
        "Process Explorer shows every running process as a tree, with its parent, its files and who signed it.",
        "Autoruns lists everything set to start automatically, which is where malware hides to survive a restart.",
        "TCPView shows which process holds each network connection.",
        "Each tool is a single program you download and run, with nothing to install.",
      ],
      video: { id: "vW8eAqZyWeo", title: "Malware Hunting with Mark Russinovich and the Sysinternals Tools", channel: "Mark Russinovich", length: "86:36" },
    },
  },
  {
    id: "sysmon",
    name: "Sysmon",
    zone: "endpoint",
    what: "A Windows service that records process starts, network connections and file changes to the event log.",
    first: "Install it on a Windows lab machine with a community configuration, then find the event for a program you just started in Event Viewer.",
    href: "https://learn.microsoft.com/sysinternals/downloads/sysmon",
    next: ["sysinternals", "wazuh", "splunk"],
    depth: {
      why: "Windows does not log much detail by default. Sysmon adds what an investigation needs, such as the full command line of every program that runs. Many detection rules are written against its events.",
      how: [
        "It installs as a service and starts with Windows.",
        "A configuration file decides what to record and what to ignore.",
        "Each kind of event has a number: 1 is a process starting, 3 is a network connection, 11 is a file being created.",
        "The events go to the Windows event log, and from there to a SIEM.",
      ],
      video: { id: "uJ7pv6blyog", title: "Cybersecurity Tool: Sysmon Installation Tutorial", channel: "MyDFIR", length: "7:40" },
    },
  },
  {
    id: "autopsy",
    name: "Autopsy",
    zone: "endpoint",
    what: "Open-source disk forensics with a graphical interface.",
    first: "Open a practice disk image and build a timeline of what was created, opened and deleted.",
    href: "https://www.autopsy.com/",
    next: ["volatility", "sysinternals"],
    depth: {
      why: "After an incident, the disk is the record of what happened. Autopsy lets you examine a copy of it without changing the original, which is the first rule of forensics.",
      how: [
        "You open a case and add a disk image, a file that holds an exact copy of a drive.",
        "Its modules index the image: file types, web history, deleted files and keywords.",
        "The results are grouped so you can browse by kind of evidence.",
        "The timeline view puts file activity in order, so you can see what happened first.",
      ],
      video: { id: "fEqx0MeCCHg", title: "Starting a New Digital Forensic Investigation Case in Autopsy 4.19+", channel: "DFIRScience", length: "38:58" },
    },
  },
  {
    id: "volatility",
    name: "Volatility 3",
    zone: "endpoint",
    what: "Analyzes memory captures to show the processes, connections and code that were running.",
    first: "List the processes in a practice memory image and pick out the one that does not belong.",
    href: "https://github.com/volatilityfoundation/volatility3",
    next: ["autopsy", "yara", "sysinternals"],
    depth: {
      why: "Some malware never writes a file, so nothing turns up on the disk. It still has to run in memory. A memory capture also holds things that vanish at shutdown, such as running processes and open connections.",
      how: [
        "You start with a memory image, a file holding everything that was in RAM.",
        "Each plugin pulls out one kind of record, such as the process list or the network connections.",
        "You compare what you see with what a normal system looks like.",
        "Anything odd, such as a process with no file on disk, is where you dig.",
      ],
      video: { id: "2S_pi9qnIo8", title: "Memory Forensics with Volatility | HackerSploit Blue Team Series", channel: "Akamai Developers", length: "34:46" },
    },
  },
  {
    id: "splunk",
    name: "Splunk",
    zone: "soc",
    what: "A SIEM: it collects logs from many systems and lets you search and chart them.",
    first: "Load the BOTS v3 practice dataset and write a search that counts failed logins by account.",
    href: "https://www.splunk.com/en_us/download/splunk-enterprise.html",
    next: ["elastic", "wazuh", "python"],
    depth: {
      why: "One machine's logs tell part of a story. A SIEM puts the logs from every machine in one place, so a single search can follow an account or an address across all of them. Searching one is daily work for a SOC analyst.",
      how: [
        "Forwarders on each machine send logs to a central indexer.",
        "The indexer stores every event with its time, its source and its fields.",
        "You search with a query language called SPL, narrowing by time, host and field.",
        "A saved search can run on a schedule and raise an alert when it finds something.",
      ],
      video: { id: "3CiRs6WaWaU", title: "Splunk Tutorial for Beginners (Cyber Security Tools)", channel: "Jon Good", length: "12:22" },
    },
  },
  {
    id: "wazuh",
    name: "Wazuh",
    zone: "soc",
    what: "An open-source SIEM and endpoint monitor that you host yourself.",
    first: "Install the agent on a lab machine, fail a login on purpose and find the alert it raises.",
    href: "https://wazuh.com/",
    next: ["sysmon", "splunk", "elastic"],
    depth: {
      why: "It is a complete SIEM that costs nothing, which makes it the easiest way to see the whole pipeline in your own lab, from an event on a machine to an alert on a dashboard.",
      how: [
        "A small agent on each machine collects logs and watches important files for changes.",
        "The agents report to a central server.",
        "The server checks each event against rules and gives every match a severity level.",
        "A dashboard shows the alerts and lets you search the events behind them.",
      ],
      video: { id: "u2pS0Zuzbmc", title: "Wazuh SIEM Installation Guide: Step-by-Step Tutorial for Beginners!", channel: "BTNHD", length: "7:20" },
    },
  },
  {
    id: "security-onion",
    name: "Security Onion",
    zone: "soc",
    what: "A free Linux distribution that bundles network monitoring, alerting and log search.",
    first: "Import a sample packet capture and work through the alerts it produces.",
    href: "https://securityonionsolutions.com/",
    next: ["suricata", "zeek", "splunk"],
    depth: {
      why: "Building a monitoring setup from separate tools takes days. Security Onion installs network detection, log collection and the analyst's interface together, so your time goes into investigating.",
      how: [
        "It installs as its own Linux system, on a virtual machine or a spare computer.",
        "Suricata and Zeek watch the network traffic it is given.",
        "Alerts and logs are stored in one place and indexed for search.",
        "A web interface lists the alerts and lets you move from one to the traffic behind it.",
      ],
      video: { id: "RHfvUsSCgm8", title: "Security Onion Essentials 2026 - Introduction to Analyst Tools", channel: "Security Onion", length: "21:21" },
    },
  },
  {
    id: "elastic",
    name: "Elastic Security",
    zone: "soc",
    what: "A free, open search platform that many teams use as their SIEM.",
    first: "Follow a home lab walkthrough to send one machine's logs in, then search for a failed login you caused yourself.",
    href: "https://www.elastic.co/security",
    next: ["splunk", "wazuh", "sysmon"],
    depth: {
      why: "It is widely used, and its detection rules are published in the open, so you can read how real detections are written and try them on your own data.",
      how: [
        "An agent on each machine ships logs and endpoint events.",
        "Elasticsearch stores and indexes them.",
        "Kibana is the web interface where you search, chart and build dashboards.",
        "Detection rules run over the data and open alerts for an analyst to review.",
      ],
      video: { id: "rb_vCKjSVFU", title: "Build a Simple SIEM Home Lab for SOC Analysts (2024)", channel: "PBER ACADEMY", length: "19:04" },
    },
  },
  {
    id: "cyberchef",
    name: "CyberChef",
    zone: "bench",
    what: "A browser tool for decoding, encoding and transforming data, one step at a time.",
    first: "Decode a Base64 string, then chain a second operation onto the result.",
    href: "https://gchq.github.io/CyberChef/",
    next: ["python", "yara", "wireshark"],
    depth: {
      why: "Data is often hidden by encoding it, sometimes several layers deep. CyberChef lets you peel the layers off one at a time and see the result of each step, with nothing to install. It turns up in analysts' browsers and in CTF toolkits alike.",
      how: [
        "You paste data into the input pane.",
        "You drag operations, such as From Base64, into a recipe.",
        "The output updates as you go, so a wrong guess costs nothing.",
        "It all runs in your browser, so the data stays on your machine.",
      ],
      video: { id: "6S0v8lIk9oA", title: "A Beginner's Guide to CyberChef (ft. CTFGuide)", channel: "Almond Force", length: "18:39" },
    },
  },
  {
    id: "ghidra",
    name: "Ghidra",
    zone: "bench",
    what: "The NSA's free reverse-engineering suite for taking compiled programs apart.",
    first: "Open a small practice binary and read the decompiled version of its main function.",
    href: "https://github.com/NationalSecurityAgency/ghidra",
    next: ["yara", "cyberchef", "python"],
    depth: {
      why: "When you have a suspicious program and no source code, reverse engineering is how you find out what it does. Ghidra is free, which is why it is used for malware analysis and for the reversing challenges in CTFs.",
      how: [
        "You import a compiled program, and Ghidra analyzes it automatically.",
        "The disassembler shows the machine instructions.",
        "The decompiler turns those instructions into code that reads like C.",
        "You rename functions and variables as you work out what they do, until the program makes sense.",
      ],
      video: { id: "hKNIoFvT7qU", title: "Introduction to Reverse Engineering - Getting Started with Ghidra", channel: "OliveStem", length: "7:06" },
    },
  },
  {
    id: "python",
    name: "Python",
    zone: "bench",
    what: "The language a great deal of security tooling is written in or automated with.",
    first: "Write a short script that reads a log file and counts failed logins per address.",
    href: "https://www.python.org/",
    next: ["splunk", "cyberchef", "ghidra"],
    depth: {
      why: "Sooner or later a task has to be done a thousand times, or two tools have to be joined together. A short script does it. Reading and writing a little Python is what turns an hour of clicking into a minute.",
      how: [
        "You write instructions in a plain text file ending in `.py`.",
        "The interpreter runs them from top to bottom.",
        "The standard library already handles files, text, web requests and JSON.",
        "Start small: read a file, loop over its lines, count what matches.",
      ],
      video: { id: "4pe1fn3Gus0", title: "Fundamentals of Python for Cybersecurity | Google Cybersecurity Certificate", channel: "Grow with Google", length: "148:01" },
    },
  },
  {
    id: "yara",
    name: "YARA",
    zone: "bench",
    what: "Describes malware as a pattern of text and bytes, then finds every file that matches.",
    first: "Write a rule that matches a harmless text file you made, then scan a folder and watch it pick out that one file.",
    href: "https://virustotal.github.io/yara/",
    next: ["ghidra", "cyberchef", "volatility"],
    depth: {
      why: "Once you understand one malicious file, you want to find every copy of it and every relative. A YARA rule is how analysts write that knowledge down and share it, and many security products can run the rules directly.",
      how: [
        "A rule names some strings or byte sequences to look for.",
        "A condition says how many of them must be present for a match.",
        "You point YARA at a file or a folder, and it lists what matched which rule.",
        "A good rule matches a whole malware family without matching ordinary files.",
      ],
      video: { id: "3BpIhbsDR_I", title: "Introduction to YARA Part 1 - What is a YARA Rule", channel: "OALabs", length: "9:50" },
    },
  },
];

export function getTool(id: string): Tool | undefined {
  return TOOLS.find((tool) => tool.id === id);
}
