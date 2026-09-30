import type { Guide } from "../types";

export const interviewPrep: Guide = {
  slug: "interview-prep",
  group: "career",
  title: "Interview prep",
  eyebrow: "Career guide",
  summary:
    "What entry-level security interviews ask, how to structure an answer, and a bank of questions to practice out loud before the real thing.",
  card: "What security interviews ask, how to structure an answer, and questions to practice out loud.",
  facts: [
    { label: "Cost", value: "Free" },
    { label: "Question types", value: "Four" },
    { label: "Practice bank", value: "On this page" },
    { label: "Best practiced", value: "Out loud" },
  ],
  notice: {
    title: "Never claim work you have not done",
    body: "Interviewers ask follow-up questions until they reach the edge of what you know. Say what you built, what you followed from a tutorial and what you would do next. That honesty is part of what they are checking.",
  },
  sections: [
    {
      id: "what-to-expect",
      title: "What to expect",
      intro:
        "Entry-level security interviews mix four kinds of question. None of them expect you to know everything. They check whether you can reason, stay organized and be honest about gaps.",
      bullets: [
        {
          label: "Technical.",
          body: "Fundamentals such as the CIA triad, what happens when you load a web page, authentication versus authorization, and the phases of incident response.",
        },
        { label: "Behavioral.", body: "Stories about teamwork, mistakes and how you keep learning." },
        { label: "Scenario.", body: "A situation, such as many failed logins followed by a success, and how you would work through it." },
        { label: "Project.", body: "A walkthrough of something you built and the decisions you made along the way." },
      ],
      video: {
        id: "uA8Mm4PVGzc",
        title: "The 3 Questions Every Cybersecurity Interview Will Ask (And How to Answer Them)",
        channel: "Simply Cyber - Gerald Auger, PhD",
        length: "12:57",
        caption: "Gerald Auger on the questions that come up in almost every security interview, and how hiring managers judge the answers.",
      },
    },
    {
      id: "star",
      title: "Tell stories with STAR",
      intro: "When a question starts with \"tell me about a time\", answer in four parts and keep the whole thing to about two minutes.",
      steps: [
        { label: "Situation.", body: "One or two sentences of context." },
        { label: "Task.", body: "What you were responsible for." },
        { label: "Action.", body: "What you did, in the first person. Spend most of your time here." },
        { label: "Result.", body: "What happened and what you learned. Use a number if you have an honest one." },
      ],
      video: {
        id: "dWK26jZgsM8",
        title: "STAR Interview Method Explained",
        channel: "EPM",
        length: "8:56",
        caption: "The method with worked example answers, and a short process for preparing your own.",
      },
      note: "Write three stories before the interview: one about a project, one about something that went wrong, and one about working with other people. Most behavioral questions can be answered with one of them.",
    },
    {
      id: "scenarios",
      title: "Think out loud on scenarios",
      intro: "Scenario questions rarely have one right answer. The interviewer is listening for a calm, ordered thought process.",
      steps: [
        { label: "Gather context first.", body: "Which account or system, what time, from where, and what is normal for it." },
        { label: "Say your assumptions.", body: "If you are guessing at a detail, say so, and say what data would confirm it." },
        { label: "Check the ordinary explanation.", body: "A user who mistyped a password is more common than an attacker. Rule it in or out." },
        { label: "Respond in proportion.", body: "Say what you would contain, what you would escalate and what you would leave alone." },
      ],
      video: {
        id: "DLVR2QpkWCk",
        title: "SOC Analyst Interview: How to Tackle Scenario-Based Questions",
        channel: "MyDFIR",
        length: "4:45",
        caption: "Under five minutes on how to approach a scenario question when you have not seen that exact situation before.",
      },
    },
    {
      id: "projects",
      title: "Talk about your projects",
      intro:
        "Interviewers care less about the tool than about your reasoning. Walk through any project in this order, and have the repository or write-up open to share.",
      steps: [
        { label: "Context.", body: "The goal, and why it mattered, in a sentence or two." },
        { label: "Your role.", body: "What you decided and did yourself, separate from a team or a tutorial." },
        { label: "One key decision.", body: "What you chose, what you gave up, and why." },
        { label: "What broke.", body: "Something that went wrong or surprised you, and how you handled it." },
        { label: "What you learned.", body: "And what you would change if you did it again." },
      ],
    },
    {
      id: "practice",
      title: "Practice out loud",
      intro:
        "Pick a type, answer the question out loud, then open the notes and compare. The notes show what a strong answer includes, the weak patterns to avoid, and the follow-ups to expect.",
      widget: "interview",
    },
    {
      id: "day-before",
      title: "The day before",
      bullets: [
        { label: "Reread the job posting.", body: "For each requirement, have one thing you have done that relates to it, even if it is a class lab." },
        {
          label: "Have one recent thing to talk about.",
          body: "\"How do you stay updated?\" is common. Pick one recent vulnerability or incident, read the primary source, and be able to explain it plainly.",
        },
        { label: "Bring two questions of your own.", body: "Ask what a first month looks like, or what the team is working on now." },
        { label: "Rehearse with a person.", body: "Book a career counseling appointment through Handshake, or ask in the club Discord for a practice partner." },
      ],
    },
  ],
  links: [
    {
      group: "More practice",
      items: [
        {
          label: "Simply Cyber: Could You Pass This SOC Analyst Interview?",
          href: "https://www.youtube.com/watch?v=8UEAjsHh92E",
          note: "A junior and a senior analyst answer the same question, so you can hear the difference. 21 minutes.",
        },
        {
          label: "UnixGuy: Every Cybersecurity Interview Question and Answer in 35 minutes",
          href: "https://www.youtube.com/watch?v=5bX81rSaho8",
          note: "A fast pass over the common technical questions. Pause and answer each one before he does.",
        },
        {
          label: "Josh Madakor: TOP 50 Cybersecurity Interview Questions and Answers",
          href: "https://www.youtube.com/watch?v=GQEKp32svPk",
          note: "The long version, at 80 minutes. Good for the week before.",
        },
        {
          label: "Daniel Miessler: information security interview questions",
          href: "https://danielmiessler.com/blog/infosec-interview-questions",
          note: "A long-running written list of technical questions, with commentary on what to listen for.",
        },
      ],
    },
    {
      group: "Answer structure",
      items: [
        {
          label: "MIT Career Advising: using the STAR method",
          href: "https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/",
          note: "A short written guide to STAR with a worksheet for drafting your stories.",
        },
      ],
    },
    {
      group: "At Georgia State",
      items: [
        {
          label: "University Career Services",
          href: "https://career.gsu.edu/",
          note: "Career counseling appointments, in person or virtual, are requested through Handshake.",
        },
      ],
    },
    {
      group: "For the staying-updated question",
      items: [
        {
          label: "CISA Known Exploited Vulnerabilities Catalog",
          href: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
          note: "Vulnerabilities that are being exploited right now. A credible place to find one recent thing to explain.",
        },
        {
          label: "CISA cybersecurity advisories",
          href: "https://www.cisa.gov/news-events/cybersecurity-advisories",
          note: "Primary-source write-ups of active threats, to check what you read elsewhere.",
        },
      ],
    },
  ],
  checked: "2026-09-30",
};
