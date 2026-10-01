import type { Guide } from "../types";

export const socPractice: Guide = {
  slug: "soc-practice",
  group: "hands-on",
  title: "SOC and blue team practice",
  eyebrow: "Skills guide",
  summary:
    "Many first security roles are in a security operations center. Practice the core of that job: reading logs, judging alerts and writing down what you found.",
  card: "Read logs, judge alerts, write it up.",
  facts: [
    { label: "Cost", value: "Free to start" },
    { label: "Core skill", value: "Reading logs" },
    { label: "Practice data", value: "Splunk BOTS v3" },
    { label: "Vocabulary", value: "MITRE ATT&CK" },
  ],
  notice: {
    title: "Practice on published data",
    body: "Use sample datasets, lab machines and training platforms. Never practice on logs from an employer, a class system or anyone else's network.",
  },
  sections: [
    {
      id: "the-work",
      title: "What the work is",
      intro: "A SOC analyst looks at alerts and decides which ones matter. For each one the questions are the same.",
      bullets: [
        { label: "What happened?", body: "Say what the alert claims in your own words." },
        { label: "Who, when and from where?", body: "The account, the host, the time and the source address." },
        { label: "Is there an ordinary explanation?", body: "Look for it before the alarming one." },
        { label: "What next?", body: "Close it with a reason, or escalate it with the evidence." },
      ],
    },
    {
      id: "watch",
      title: "Build a free practice lab",
      intro: "Splunk publishes a realistic practice dataset called Boss of the SOC. This video sets it up from nothing.",
      video: {
        id: "2cX-Nv0geEY",
        title: "Splunk for Beginners: FREE Security Lab with Botsv3 Dataset (Dashboards, Alerts & Queries!)",
        channel: "Hoplite Security",
        length: "14:13",
        caption: "Getting Splunk at no cost, loading the BOTS v3 dataset and writing your first searches.",
      },
    },
    {
      id: "first-investigation",
      title: "Your first investigation",
      steps: [
        { label: "Load the data.", body: "Follow the video until the BOTS v3 dataset is searchable." },
        { label: "Ask one question.", body: "For example: which account had the most failed logins, and from where?" },
        { label: "Answer it with a search.", body: "Start broad, then narrow by time, account and source." },
        { label: "Write three lines.", body: "What you found, the evidence behind it, and what you would check next." },
        { label: "Name the technique.", body: "Look it up in MITRE ATT&CK so your notes use the words a team would." },
      ],
    },
    {
      id: "platforms",
      title: "Guided practice",
      intro: "These platforms give you alerts and cases to work. All have free material and paid tiers, so check what is free before paying.",
      bullets: [
        { label: "TryHackMe SOC Level 1.", body: "A structured path through the tools and the daily work." },
        { label: "LetsDefend.", body: "A simulated SOC where you triage a queue of alerts." },
        { label: "CyberDefenders.", body: "Blue team challenges built on real evidence files." },
        { label: "Blue Team Labs Online.", body: "Short investigations you can finish in one sitting." },
      ],
    },
    {
      id: "vocabulary",
      title: "Learn the shared vocabulary",
      bullets: [
        { label: "Event, alert, incident.", body: "An event is anything logged, an alert is an event a rule flagged, and an incident is an alert confirmed as a real problem." },
        { label: "MITRE ATT&CK.", body: "The standard names for what attackers do, from first access to impact." },
        { label: "CISA KEV.", body: "The list of vulnerabilities being exploited right now, and a strong signal for what to fix first." },
        { label: "Sigma.", body: "A common format for writing a detection once and using it in many tools." },
      ],
    },
  ],
  links: [
    {
      group: "The practice lab",
      items: [
        {
          label: "Splunk Enterprise download",
          href: "https://www.splunk.com/en_us/download/splunk-enterprise.html",
          note: "The free download the video uses. It needs a Splunk account.",
        },
        {
          label: "Boss of the SOC v3 dataset",
          href: "https://github.com/splunk/botsv3",
          note: "The practice data, published by Splunk.",
        },
        {
          label: "Splunk free training",
          href: "https://www.splunk.com/en_us/training/free-courses/overview.html",
          note: "Splunk's own free courses on searching.",
        },
      ],
    },
    {
      group: "Guided platforms",
      items: [
        {
          label: "TryHackMe: SOC Level 1",
          href: "https://tryhackme.com/path/outline/soclevel1",
          note: "A learning path for the analyst role, with free and paid rooms.",
        },
        { label: "LetsDefend", href: "https://letsdefend.io/", note: "A simulated SOC with an alert queue. Free and paid material." },
        {
          label: "CyberDefenders",
          href: "https://cyberdefenders.org/blueteam-ctf-challenges/",
          note: "Blue team challenges built on evidence files. Free and paid material.",
        },
        { label: "Blue Team Labs Online", href: "https://blueteamlabs.online/", note: "Short defensive investigations. Free and paid labs." },
      ],
    },
    {
      group: "Reference",
      items: [
        { label: "MITRE ATT&CK", href: "https://attack.mitre.org/", note: "The shared vocabulary for attacker techniques." },
        {
          label: "CISA Known Exploited Vulnerabilities Catalog",
          href: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
          note: "What is being exploited right now.",
        },
        { label: "Sigma rules", href: "https://github.com/SigmaHQ/sigma", note: "Thousands of open detection rules to read and learn from." },
        {
          label: "Malware Traffic Analysis",
          href: "https://www.malware-traffic-analysis.net/",
          note: "Packet captures of real infections, with exercises, for practicing in Wireshark.",
        },
      ],
    },
    {
      group: "Watch",
      items: [
        {
          label: "MyDFIR: From Zero to SOC Analyst",
          href: "https://www.youtube.com/watch?v=5cQrfNxvRG4",
          note: "A twelve-minute roadmap for getting to a first analyst role.",
        },
      ],
    },
  ],
  checked: "2026-09-30",
};
