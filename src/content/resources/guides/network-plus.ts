import type { Guide } from "../types";

export const networkPlus: Guide = {
  slug: "network-plus",
  group: "certification",
  title: "Network+ study plan",
  eyebrow: "Study guide",
  summary:
    "The same practice-first routine, aimed at N10-009: learn subnetting early, memorize the troubleshooting steps, use the real tools, and test yourself every day.",
  card: "Learn subnetting early, memorize the troubleshooting steps, and finish with daily practice exams.",
  facts: [
    { label: "Exam", value: "N10-009 (V9)" },
    { label: "Questions", value: "Up to 90" },
    { label: "Time", value: "90 minutes" },
    { label: "Passing score", value: "720 of 900" },
  ],
  notice: {
    title: "Confirm the exam code before you book",
    body: "N10-009 launched in June 2024, and CompTIA estimates it will retire in 2027. Check the official page for the current code, and use study material written for it.",
  },
  sections: [
    {
      id: "how-it-asks",
      title: "How the exam asks questions",
      intro:
        "Network+ checks whether you can keep a network running, not only name its parts. Troubleshooting is the largest domain, and those questions describe a technician partway through a problem and ask what comes next. Expect a few performance-based questions too, such as correcting a configuration or placing devices on a diagram.",
      weights: [
        { name: "Networking Concepts", percent: 23 },
        { name: "Network Implementation", percent: 20 },
        { name: "Network Operations", percent: 19 },
        { name: "Network Security", percent: 14 },
        { name: "Network Troubleshooting", percent: 24 },
      ],
    },
    {
      id: "plan",
      title: "The plan",
      steps: [
        {
          label: "Watch the course one domain at a time.",
          body: "Professor Messer's N10-009 videos are free and follow the exam objectives in order. Take short notes on anything new.",
        },
        {
          label: "Start subnetting in week one.",
          body: "It only gets fast with practice, and ten minutes a day beats one long session.",
        },
        {
          label: "Drill ports and protocols.",
          body: "Flashcards work. You should recognize the common ones without stopping to think.",
        },
        {
          label: "Use the real tools.",
          body: "Run `ping`, `tracert` or `traceroute`, `nslookup`, `ipconfig` or `ip`, and `arp` on your own machine. Open Wireshark and watch your own traffic. Build a small network in Cisco Packet Tracer.",
        },
        {
          label: "Finish with daily practice exams.",
          body: "Once you have covered every domain, take a fresh timed exam each morning with no notes, aim for 85% or higher, and review every question you missed. The Security+ guide describes the routine in full.",
        },
      ],
    },
    {
      id: "subnetting",
      title: "Learn subnetting early",
      intro:
        "Subnetting is where most people get stuck, and it is also the most learnable part of the exam. Pick one method, then practice until finding the network address, the broadcast address and the host range feels routine.",
      video: {
        id: "I3LBYMXBhus",
        title: "Seven Second Subnetting - CompTIA Network+ N10-009 - 1.7",
        channel: "Professor Messer",
        length: "17:02",
        caption: "Professor Messer's shortcut method, worked through step by step. Pause and do each example yourself before he does.",
      },
    },
    {
      id: "troubleshooting",
      title: "Memorize the troubleshooting steps",
      intro: "Learn CompTIA's seven steps in order. A question will describe the step a technician has just finished and ask for the next one.",
      steps: [
        { label: "Identify the problem.", body: "Gather information, question users and ask what changed." },
        { label: "Establish a theory of probable cause.", body: "Question the obvious first." },
        { label: "Test the theory.", body: "If it does not hold, form a new one or escalate." },
        { label: "Establish a plan of action.", body: "Work out what else the fix could affect before you change anything." },
        { label: "Implement the solution or escalate.", body: "Stay within what you are authorized to change." },
        { label: "Verify full system functionality.", body: "Then put preventive measures in place." },
        { label: "Document findings, actions and outcomes.", body: "The next person to see the problem may be you." },
      ],
    },
    {
      id: "know-cold",
      title: "What to know cold",
      bullets: [
        { label: "The OSI model.", body: "All seven layers in order, and which devices and protocols belong to each." },
        { label: "Ports and protocols.", body: "Such as 22 for SSH, 53 for DNS, 67 and 68 for DHCP, 161 for SNMP, 443 for HTTPS and 3389 for RDP." },
        { label: "Cables and connectors.", body: "Copper and fiber types, and connectors such as RJ45, LC and SC." },
        { label: "Wireless.", body: "The 802.11 standards, frequencies, channels and encryption options." },
        { label: "Routing and switching.", body: "Static versus dynamic routing, OSPF and BGP, VLANs and spanning tree." },
      ],
    },
  ],
  links: [
    {
      group: "Free lessons",
      items: [
        {
          label: "Professor Messer's N10-009 Network+ course",
          href: "https://www.professormesser.com/network-plus/n10-009/n10-009-video/n10-009-training-course/",
          note: "Free videos covering every exam objective, in order.",
        },
        {
          label: "How to Pass Your CompTIA N10-009 Network+ Exam",
          href: "https://www.youtube.com/watch?v=k7IOn3TiUc8",
          note: "Professor Messer's eight-minute overview of the exam and how to prepare for it.",
        },
      ],
    },
    {
      group: "Practice",
      items: [
        {
          label: "Subnetting Practice",
          href: "https://subnettingpractice.com/",
          note: "Free subnetting questions, aimed at Network+ and CCNA.",
        },
        {
          label: "Subnet IPv4",
          href: "https://subnetipv4.com/",
          note: "Free randomized subnetting problems that check your answers as you go.",
        },
        {
          label: "Dion Training Network+ (N10-009) Practice Exam Pack",
          href: "https://www.diontraining.com/products/comptia-network-n10-009-practice-exam",
          note: "Paid practice exams covering all five domains. Check the current price on the page.",
        },
        {
          label: "Dion Training Network+ (N10-009) PBQ Practice Pack",
          href: "https://www.diontraining.com/products/comptia-network-n10-009-pbq-practice-pack",
          note: "Paid interactive sets for practicing performance-based questions.",
        },
      ],
    },
    {
      group: "Hands-on tools",
      items: [
        {
          label: "Cisco Packet Tracer",
          href: "https://www.netacad.com/cisco-packet-tracer",
          note: "A free network simulator from Cisco Networking Academy for building and breaking practice networks.",
        },
        {
          label: "Wireshark",
          href: "https://www.wireshark.org/",
          note: "The free packet analyzer. Capture only on networks you own.",
        },
      ],
    },
    {
      group: "Official",
      items: [
        {
          label: "CompTIA Network+ (N10-009)",
          href: "https://www.comptia.org/en-us/certifications/network/",
          note: "Exam details, the objectives summary and booking.",
        },
        {
          label: "CompTIA: how to save money on your certification",
          href: "https://www.comptia.org/en-us/blog/voucher-discount/",
          note: "CompTIA's own list of voucher discounts, including student pricing.",
        },
      ],
    },
  ],
  checked: "2026-09-30",
};
