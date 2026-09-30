import type { Guide } from "../types";

export const securityTools: Guide = {
  slug: "security-tools",
  group: "hands-on",
  title: "Security tools to learn first",
  eyebrow: "Tool guide",
  summary:
    "The tools that come up again and again in classes, competitions and entry-level roles: what each one is for, a first exercise, and which to pick up next.",
  card: "What each tool is for, a first exercise for it, and which one to pick up next.",
  facts: [
    { label: "Tools", value: "17 to explore" },
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
      id: "how-to-learn",
      title: "How to learn a tool",
      steps: [
        { label: "Pick one, not five.", body: "One tool you can explain is worth more than a list you have only installed." },
        { label: "Do the first exercise in your lab.", body: "Each tool below has one. It should take less than an hour." },
        { label: "Write down what you ran and what came back.", body: "Those notes are the start of a project write-up." },
        { label: "Follow the next link.", body: "Every tool points to the ones that build on it, so you never run out of a next step." },
      ],
    },
    {
      id: "explore",
      title: "Explore the tools",
      intro: "Choose a tool to see what it does and what to try first. Then follow \"learn next\" to move through the rest.",
      widget: "tools",
    },
    {
      id: "watch",
      title: "Start with Wireshark",
      intro: "If you have not used any of these, start here. Seeing real packets makes every other tool easier to understand.",
      video: {
        id: "qTaOZrDnMzQ",
        title: "Wireshark Tutorial for Beginners | Network Scanning Made Easy",
        channel: "Anson Alexander",
        length: "20:11",
        caption: "Installing Wireshark, capturing your first traffic and filtering it down to what matters.",
      },
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
      group: "Beginner walkthroughs",
      items: [
        {
          label: "NetworkChuck: Nmap Tutorial to find Network Vulnerabilities",
          href: "https://www.youtube.com/watch?v=4t4kBkMsDbQ",
          note: "Seventeen minutes on scanning, with the common flags explained.",
        },
        {
          label: "HackerSploit: Setting Up Burp Suite",
          href: "https://www.youtube.com/watch?v=YCCrVtvAu2I",
          note: "Ten minutes to get Burp proxying your browser.",
        },
        {
          label: "Jon Good: Splunk Tutorial for Beginners",
          href: "https://www.youtube.com/watch?v=3CiRs6WaWaU",
          note: "Twelve minutes on what Splunk is and how a search works.",
        },
        {
          label: "Almond Force: A Beginner's Guide to CyberChef",
          href: "https://www.youtube.com/watch?v=6S0v8lIk9oA",
          note: "Nineteen minutes of decoding and chaining operations.",
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
