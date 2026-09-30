import type { Guide } from "../types";

export const securityPlus: Guide = {
  slug: "security-plus",
  group: "certification",
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
};
