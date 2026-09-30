/**
 * Study guides: short pages for the two CompTIA exams members ask about most,
 * and for building a first home lab.
 *
 * Exam details come from comptia.org, and every link and video was opened on
 * the guide's `checked` date. Prices, promo codes and exam versions change, so
 * anything of that kind says when it was seen. Nothing here reproduces exam
 * questions.
 */
export type GuideItem = {
  /** Shown in bold ahead of the body. */
  label?: string;
  /** Plain text. Wrap commands and file names in backticks to set them as code. */
  body: string;
};

export type GuideVideo = {
  /** The YouTube video id, the part after `watch?v=`. */
  id: string;
  /** The title as it appears on YouTube. */
  title: string;
  channel: string;
  /** Running time as m:ss. */
  length: string;
  /** Why this video, in one or two sentences. */
  caption: string;
};

export type GuideSection = {
  id: string;
  title: string;
  intro?: string;
  /** Ordered steps. */
  steps?: GuideItem[];
  /** Unordered points. */
  bullets?: GuideItem[];
  /** Exam domains and their share of the score. */
  weights?: { name: string; percent: number }[];
  video?: GuideVideo;
  note?: string;
};

export type GuideLink = {
  label: string;
  href: string;
  /** Why it is listed, and what it costs if it is not free. */
  note: string;
  /** A discount code a member passed along. Codes expire. */
  promo?: string;
};

export type Guide = {
  slug: string;
  title: string;
  eyebrow: string;
  /** Shown under the title on the guide's own page. */
  summary: string;
  /** Shorter line for the card on the careers hub. */
  card: string;
  /** Four short facts shown in one row. */
  facts: { label: string; value: string }[];
  /** The one thing to know before starting. */
  notice: { title: string; body: string };
  sections: GuideSection[];
  links: { group: string; items: GuideLink[] }[];
  /** The day the links, prices and exam details were last opened (YYYY-MM-DD). */
  checked: string;
};

export const GUIDES: readonly Guide[] = [
  {
    slug: "security-plus",
    title: "Security+ in under 30 days",
    eyebrow: "Study guide",
    summary:
      "A repetition plan for SY0-701: a fresh practice exam every morning, a review of every miss, and steady practice on the performance-based questions.",
    card: "A daily routine built on fresh practice exams, reviewing every miss, and getting comfortable with PBQs.",
    facts: [
      { label: "Exam", value: "SY0-701 (V7)" },
      { label: "Questions", value: "Up to 90" },
      { label: "Time", value: "90 minutes" },
      { label: "Passing score", value: "750 of 900" },
    ],
    notice: {
      title: "A new version is on the way",
      body: "CompTIA expects Security+ V8 (SY0-801) to launch around November 17, 2026. SY0-701 stays available in English until June 11, 2027. This plan and every link below are for SY0-701. Whichever exam you book, use practice material written for that code.",
    },
    sections: [
      {
        id: "how-it-asks",
        title: "How the exam asks questions",
        intro:
          "Security+ is scenario-based. It rarely asks what a term means. It describes a situation and asks for the BEST control, action or solution. Often more than one answer would work, and the question turns on a single detail: the first step, the lowest cost, the least disruption. That is why this plan is built on repetition. The more scenarios you work through, the faster you see what a question is really asking.",
        weights: [
          { name: "General Security Concepts", percent: 12 },
          { name: "Threats, Vulnerabilities, and Mitigations", percent: 22 },
          { name: "Security Architecture", percent: 18 },
          { name: "Security Operations", percent: 28 },
          { name: "Security Program Management and Oversight", percent: 20 },
        ],
      },
      {
        id: "first-week",
        title: "Your first week",
        intro: "Free up at least 20 hours in week one and treat it like a class you are enrolled in.",
        bullets: [
          {
            label: "Day 1.",
            body: "Put in four to five hours on the exam material. Review acronyms, ports, protocols, attacks and controls, and above all get used to how scenario questions are worded.",
          },
          {
            label: "Days 2 to 7.",
            body: "Start the daily routine below. Expect low scores at first. The early exams are there to show you what to study.",
          },
          {
            label: "When a whole topic is new.",
            body: "Watch that section of Professor Messer's free course before the next exam, then come back to the questions.",
          },
        ],
      },
      {
        id: "daily-routine",
        title: "The daily routine",
        steps: [
          {
            label: "Take a fresh exam first thing in the morning.",
            body: "Sit a practice exam you have not seen before, as if it were the real one: 90 minutes, no Google, no ChatGPT, no notes, and no looking anything up.",
          },
          {
            label: "Aim for 85% or higher.",
            body: "If you land below that, the results at the end show which areas you keep missing. Those are what you study afterward.",
          },
          {
            label: "Review every question you missed.",
            body: "Read the explanation. If it still does not make sense, ask ChatGPT to break it down, explain why one answer beats the others, or give you similar scenarios.",
          },
          {
            label: "Learn the reasoning, not the questions.",
            body: "Do not memorize answers. Learn the format and the patterns so you recognize what a question is asking you to do.",
          },
          {
            label: "Repeat every day.",
            body: "Each fresh exam makes the acronyms, ports, attacks, controls and incident response steps quicker to recall, and the logic CompTIA expects easier to spot.",
          },
        ],
        note: "An AI explanation is a study aid, not a source. When it disagrees with the practice exam's own explanation or the official objectives, trust those.",
      },
      {
        id: "pbqs",
        title: "Practice the PBQs",
        intro:
          "Performance-based questions are interactive tasks, such as reading scan output, setting firewall rules or matching an attack to its evidence. They are some of the hardest parts of the exam because they test applying what you know, not recalling a definition. They usually come first, so many people flag them, finish the multiple choice, then come back.",
        video: {
          id: "zfwxSmL4n6w",
          title: "Networking, Scanning, and Nmap - CompTIA Security+ Performance Based Question",
          channel: "Cyberkraft",
          length: "10:37",
          caption:
            "Cyberkraft works through one PBQ step by step. The rest of the playlist, linked below, covers the other kinds you can expect.",
        },
      },
      {
        id: "know-cold",
        title: "What to know cold",
        bullets: [
          { label: "Acronyms.", body: "There are hundreds. Keep a running list of the ones you miss and read it every day." },
          { label: "Ports and protocols.", body: "Know the common pairs on sight, such as 22 for SSH, 53 for DNS, 443 for HTTPS and 3389 for RDP." },
          { label: "Attacks and their signs.", body: "Be able to name an attack from a short description or a few log lines." },
          {
            label: "Security controls.",
            body: "Sort any control by category (technical, managerial, operational, physical) and by type (preventive, deterrent, detective, corrective, compensating, directive).",
          },
          {
            label: "Incident response steps.",
            body: "Preparation, detection, analysis, containment, eradication, recovery, lessons learned. Questions often ask what comes next.",
          },
        ],
      },
      {
        id: "exam-day",
        title: "Booking and exam day",
        bullets: [
          { label: "Book when the scores hold.", body: "Once fresh exams stay at 85% or higher for several days in a row, schedule the real one." },
          {
            label: "Check for a student discount first.",
            body: "CompTIA says verified U.S. college students can get 35 to 55 percent off in its store. Confirm the current price there before paying anyone.",
          },
          { label: "Keep it in proportion.", body: "The certification is a foundation, not a job offer. Pair it with a project you can show." },
        ],
      },
    ],
    links: [
      {
        group: "Practice exams and PBQs",
        items: [
          {
            label: "Dion Training Security+ (SY0-701) Practice Exam Pack",
            href: "https://www.diontraining.com/products/comptia-security-sy0-007-unlimited-practice-exam",
            note: "The practice exams this plan is built around: randomized questions, unlimited attempts and an explanation for every answer. $29.99 when checked.",
            promo: "50OFFSECPEUD",
          },
          {
            label: "Dion Training Security+ PBQ Practice Pack",
            href: "https://www.diontraining.com/products/comptia-security-701-pbq-packet",
            note: "Extra interactive PBQ sets, sold separately, for when you want more than the exam pack includes.",
          },
          {
            label: "Cyberkraft Security+ SY0-701 PBQ playlist",
            href: "https://www.youtube.com/playlist?list=PLUkY1OVVHzVljGOe8WAkKGc4GT8ZAKaav",
            note: "Free video walkthroughs of the kinds of PBQs you can expect.",
          },
          {
            label: "Dion Security+ (SY0-701) Practice Exams on Udemy",
            href: "https://www.udemy.com/course/comptia-security-sy0-701-practice-exams/",
            note: "Six full-length timed exams. An alternative if you already use Udemy.",
          },
        ],
      },
      {
        group: "Free lessons",
        items: [
          {
            label: "Professor Messer's SY0-701 Security+ course",
            href: "https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/",
            note: "Free videos that follow the exam objectives in order. Use them to fill the gaps your practice exams expose.",
          },
          {
            label: "How to Pass Your SY0-701 Security+ Exam",
            href: "https://www.youtube.com/watch?v=KiEptGbnEBc",
            note: "Professor Messer's ten-minute overview of the exam and how to prepare for it.",
          },
        ],
      },
      {
        group: "Official",
        items: [
          {
            label: "CompTIA Security+ V7 (SY0-701)",
            href: "https://www.comptia.org/en-us/certifications/security/v7/",
            note: "Exam objectives, retirement dates and booking.",
          },
          {
            label: "CompTIA Security+ V8 (SY0-801)",
            href: "https://www.comptia.org/en-us/certifications/security/v8/",
            note: "The next version and its launch date, for anyone planning further ahead.",
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
  },
  {
    slug: "network-plus",
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
  },
  {
    slug: "home-lab",
    title: "Build your first home lab",
    eyebrow: "Setup guide",
    summary:
      "Two virtual machines on a private network, on the laptop you already have: Kali Linux for tools, and a second machine to practice against.",
    card: "Two virtual machines on a private network, on the laptop you already have.",
    facts: [
      { label: "Cost", value: "Free" },
      { label: "Memory", value: "8 GB RAM or more" },
      { label: "Disk", value: "40 GB free" },
      { label: "Time", value: "One afternoon" },
    ],
    notice: {
      title: "The one rule: keep it isolated",
      body: "Only test machines you own, and never connect a lab machine to campus Wi-Fi or your home network in bridged mode. Everything below keeps lab traffic on a private network inside your own computer.",
    },
    sections: [
      {
        id: "pick",
        title: "Pick your setup",
        intro: "Choose by the computer you have. Every option here is free.",
        bullets: [
          { label: "Windows, Linux or an Intel Mac.", body: "Use VirtualBox. The steps below follow this route." },
          {
            label: "An Apple Silicon Mac.",
            body: "Use UTM with the arm64 versions of Kali and Ubuntu. The standard x64 images will not boot on M-series chips.",
          },
          {
            label: "Less than 8 GB of RAM, a Chromebook, or a laptop you cannot install on.",
            body: "Skip the install and use browser labs such as TryHackMe or OverTheWire.",
          },
          { label: "Windows, and you only want a Linux command line.", body: "WSL 2 gives you an Ubuntu or Kali shell in about ten minutes." },
        ],
      },
      {
        id: "watch",
        title: "Watch it done first",
        intro: "Watch the build once before you start. Then follow the steps below with the video paused beside you.",
        video: {
          id: "Og78IxJNPK4",
          title: "CyberSecurity Home Lab for Beginners #1 Setting up VirtualBox, Networks and KALI",
          channel: "JackedProgrammer",
          length: "26:46",
          caption: "A full walkthrough on a Windows 11 computer: installing VirtualBox, creating the private networks and setting up Kali.",
        },
      },
      {
        id: "build",
        title: "Build it step by step",
        steps: [
          {
            label: "Check your machine.",
            body: "You need 8 GB of RAM, 40 GB of free disk and hardware virtualization turned on. On Windows, the Performance tab in Task Manager shows Virtualization: Enabled. If it is off, turn on Intel VT-x or AMD-V in your BIOS or UEFI settings.",
          },
          { label: "Install VirtualBox.", body: "Download it from the official page for your operating system and accept the defaults." },
          {
            label: "Add Kali Linux.",
            body: "Download the pre-built VirtualBox image from kali.org, extract it and double-click the `.vbox` file. Sign in as `kali` with the password `kali`, then change that password.",
          },
          {
            label: "Add a second machine.",
            body: "Create an Ubuntu Desktop virtual machine from the official ISO. This is the machine you practice against.",
          },
          {
            label: "Put both on a private network.",
            body: "Give each machine a host-only adapter for lab traffic. Attach a NAT adapter only while you install updates. Never use bridged mode for a lab machine.",
          },
          {
            label: "Take a snapshot.",
            body: "Snapshot both machines while they are clean and name it `baseline`. When something breaks, restore it and carry on.",
          },
          {
            label: "Run your first exercise.",
            body: "In Kali, run `ip a` to find your address, `ping` the Ubuntu machine, then scan it with `nmap -sV` followed by its address. You have just mapped a network you own.",
          },
          {
            label: "Shut down and clean up.",
            body: "Power the machines off when you finish. To delete one, right-click it in VirtualBox, choose Remove, then Delete all files.",
          },
        ],
        note: "With 8 GB of RAM, running both machines at once is tight. Close everything else while you do, or run one at a time. With 16 GB you can leave both open.",
      },
      {
        id: "rules",
        title: "Lab safety rules",
        bullets: [
          {
            body: "Only test systems you own or have written permission to test. Scanning anything else, including GSU networks, may be a crime and a code of conduct violation.",
          },
          { body: "Keep vulnerable machines on host-only or internal networking. Never bridge one onto campus Wi-Fi or your home network." },
          { body: "Use throwaway passwords inside the lab, and never sign in to personal accounts from a lab machine." },
          { body: "Download tools and images only from their official pages, and verify the checksum when one is published." },
          { body: "Keep your own computer patched and its firewall on. A virtual machine is only as safe as its host." },
        ],
      },
      {
        id: "after",
        title: "What to do with it",
        bullets: [
          {
            label: "Add a target built to be attacked.",
            body: "OWASP Juice Shop and Metasploitable 2 are intentionally vulnerable. Keep them on the private network.",
          },
          { label: "Work through guided labs.", body: "TryHackMe rooms and OverTheWire Bandit teach the basics in a sensible order." },
          { label: "Turn it into a project.", body: "The club's project library has portfolio pieces that run in a lab like this one." },
        ],
      },
    ],
    links: [
      {
        group: "Downloads",
        items: [
          { label: "VirtualBox", href: "https://www.virtualbox.org/wiki/Downloads", note: "Free virtualization for Windows, Linux and Intel Macs." },
          {
            label: "Kali Linux pre-built virtual machines",
            href: "https://www.kali.org/get-kali/#kali-virtual-machines",
            note: "Pick the VirtualBox 64-bit image. It is ready to run, with nothing to install.",
          },
          { label: "Ubuntu Desktop", href: "https://ubuntu.com/download/desktop", note: "The x64 ISO for your second machine. Take the current LTS release." },
          { label: "UTM", href: "https://mac.getutm.app/", note: "Free virtualization for Apple Silicon Macs. The direct download costs nothing." },
        ],
      },
      {
        group: "Setup help",
        items: [
          {
            label: "Kali: import the pre-built VirtualBox image",
            href: "https://www.kali.org/docs/virtualization/import-premade-virtualbox/",
            note: "The official instructions for step 3, with screenshots.",
          },
          {
            label: "VirtualBox manual: virtual networking",
            href: "https://www.virtualbox.org/manual/ch06.html",
            note: "What NAT, host-only, internal and bridged modes each do.",
          },
          { label: "UTM documentation", href: "https://docs.getutm.app/", note: "Setup and networking for the Apple Silicon route." },
          { label: "Install WSL", href: "https://learn.microsoft.com/windows/wsl/install", note: "Microsoft's guide to the Windows command-line route." },
        ],
      },
      {
        group: "More walkthroughs",
        items: [
          {
            label: "NetworkChuck: you need to learn Virtual Machines RIGHT NOW!!",
            href: "https://www.youtube.com/watch?v=wX75Z-4MEoM",
            note: "A 28-minute introduction to virtual machines, using Kali, Ubuntu and Windows.",
          },
          {
            label: "The Social Dork: Build your Cyber security Lab at Home in 15 minutes",
            href: "https://www.youtube.com/watch?v=aeXGBxDewCY",
            note: "A shorter build of the same VirtualBox, Kali and Ubuntu lab on one laptop.",
          },
        ],
      },
      {
        group: "Practice targets and labs",
        items: [
          { label: "OWASP Juice Shop", href: "https://owasp.org/www-project-juice-shop/", note: "An intentionally vulnerable web app to run inside your lab." },
          {
            label: "Metasploitable 2",
            href: "https://docs.rapid7.com/metasploit/metasploitable-2/",
            note: "An intentionally vulnerable Linux machine. Host-only networking, always.",
          },
          { label: "TryHackMe", href: "https://tryhackme.com/", note: "Guided labs in the browser. Free rooms, with a paid tier." },
          {
            label: "OverTheWire Bandit",
            href: "https://overthewire.org/wargames/bandit/",
            note: "A free game that teaches the Linux command line, one level at a time.",
          },
        ],
      },
    ],
    checked: "2026-09-30",
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
