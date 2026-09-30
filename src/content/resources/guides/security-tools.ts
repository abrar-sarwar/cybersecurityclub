import type { Guide } from "../types";

export const securityTools: Guide = {
  slug: "security-tools",
  group: "hands-on",
  title: "Security tools to learn first",
  eyebrow: "Tool guide",
  summary:
    "The tools that come up again and again in classes, competitions and entry-level roles, laid out across the network they are used on. Open one to see why it matters, how it works and what to pick up next.",
  card: "A map of the tools across a network. Open one to see how it works and what to learn next.",
  facts: [
    { label: "Tools", value: "26 to explore" },
    { label: "Cost", value: "Free to start" },
    { label: "Where to run them", value: "Your home lab" },
    { label: "Start with", value: "Wireshark" },
  ],
  notice: {
    title: "Use them only where you are allowed",
    body: "Scanners and exploit tools are fine to run against your own machines and against practice targets that invite testing, and nowhere else. Build the home lab first, then point these tools at it.",
  },
  sections: [
    {
      id: "explore",
      title: "The tool map",
      intro:
        "A small company's network, from the tester outside to the analyst's desk. Each tool sits in the part where it is used, and the wires show what passes between the parts. Choose a tool to open it.",
      widget: "tools",
    },
    {
      id: "how-to-learn",
      title: "How to learn a tool",
      steps: [
        { label: "Pick one, not five.", body: "One tool you can explain is worth more than a list you have only installed." },
        { label: "Watch it used.", body: "Most tools on the map open a window with a walkthrough video. Watch it before you install anything." },
        { label: "Do the first exercise in your lab.", body: "Each tool has one. It should take less than an hour." },
        { label: "Write down what you ran and what came back.", body: "Those notes are the start of a project write-up." },
        { label: "Follow \"learn next\".", body: "Every tool points to the ones that build on it, so you never run out of a next step." },
      ],
    },
    {
      id: "proof",
      title: "Turn practice into proof",
      bullets: [
        { label: "Write it up.", body: "One page: what you were trying to find, what you ran, what you saw, what you concluded." },
        { label: "Make it a project.", body: "The club's project library has portfolio pieces built on several of these tools." },
        { label: "Use it under pressure.", body: "A capture the flag event gives you a reason to reach for a tool and a deadline to learn it by." },
      ],
    },
  ],
  links: [
    {
      group: "Where to find them",
      items: [
        {
          label: "Kali Linux tools index",
          href: "https://www.kali.org/tools/",
          note: "Many of these come with Kali. The index has a page for each tool with its commands.",
        },
      ],
    },
    {
      group: "Practice data",
      items: [
        {
          label: "Boss of the SOC v3 dataset",
          href: "https://github.com/splunk/botsv3",
          note: "Realistic logs published by Splunk, for the SIEM tools.",
        },
        {
          label: "Malware Traffic Analysis",
          href: "https://www.malware-traffic-analysis.net/",
          note: "Packet captures with exercises, for Wireshark, Suricata and Zeek.",
        },
      ],
    },
    {
      group: "Practice targets",
      items: [
        {
          label: "OWASP Juice Shop",
          href: "https://owasp.org/www-project-juice-shop/",
          note: "An intentionally vulnerable web app to run on your own machine.",
        },
        {
          label: "Metasploitable 2",
          href: "https://docs.rapid7.com/metasploit/metasploitable-2/",
          note: "An intentionally vulnerable Linux machine. Host-only networking, always.",
        },
      ],
    },
    {
      group: "Shared vocabulary",
      items: [
        {
          label: "MITRE ATT&CK",
          href: "https://attack.mitre.org/",
          note: "The standard names for attacker techniques. Use them to describe what a tool found.",
        },
      ],
    },
  ],
  checked: "2026-09-30",
};
