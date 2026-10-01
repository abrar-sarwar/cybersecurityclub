import type { Guide } from "../types";

export const ctf: Guide = {
  slug: "ctf",
  group: "hands-on",
  title: "Your first capture the flag",
  eyebrow: "Competition guide",
  summary:
    "A capture the flag (CTF) is a set of security puzzles with a scoreboard. It is a practical way to build skills you can point to, and you do not need experience to start.",
  card: "Puzzles with a scoreboard, and the club's NCL team.",
  facts: [
    { label: "Cost", value: "Mostly free" },
    { label: "Experience", value: "None needed" },
    { label: "Start with", value: "picoCTF" },
    { label: "Club team", value: "National Cyber League" },
  ],
  notice: {
    title: "The club is building a National Cyber League team",
    body: "We are putting together a Georgia State team this semester, and every skill level is welcome. The interest form is on the Events page, and the season dates are on the NCL site.",
  },
  sections: [
    {
      id: "what",
      title: "What a CTF is",
      intro:
        "Each challenge hides a short string of text called a flag. You find it by solving the puzzle, submit it, and score points. Challenges are grouped by skill, so you can start wherever you are strongest.",
      video: {
        id: "8ev9ZX9J45A",
        title: "What is CTF? An introduction to security Capture The Flag competitions",
        channel: "LiveOverflow",
        length: "6:46",
        caption: "A short, clear explanation of how these competitions work and why people play them.",
      },
    },
    {
      id: "categories",
      title: "The categories",
      intro: "You do not need all of them. Pick one or two that sound interesting and start there.",
      bullets: [
        { label: "Web.", body: "Find the flaw in a small website." },
        { label: "Cryptography.", body: "Decode or break an encoded message." },
        { label: "Forensics.", body: "Dig a flag out of a file, a disk image or a packet capture." },
        { label: "Log and traffic analysis.", body: "Answer questions about what happened from the evidence." },
        { label: "Open source intelligence.", body: "Find an answer using only public information." },
        { label: "Reverse engineering.", body: "Work out what a program does without its source code." },
      ],
    },
    {
      id: "start",
      title: "How to start",
      steps: [
        { label: "Make a picoCTF account.", body: "It is free and run by Carnegie Mellon University. Open the practice section, called picoGym." },
        { label: "Solve five easy ones.", body: "Sort by the most solved and pick from any category." },
        { label: "Stay stuck for twenty minutes.", body: "Then read a write-up, close it, and solve the challenge again from memory." },
        { label: "Keep notes.", body: "For each challenge: what the clue was, which tool you used and the command that worked." },
        { label: "Enter a live event with other people.", body: "You learn faster next to someone, and that is what the club team is for." },
      ],
    },
    {
      id: "toolkit",
      title: "A starter toolkit",
      bullets: [
        { label: "CyberChef.", body: "For anything encoded. It runs in your browser." },
        { label: "A Linux terminal.", body: "`strings`, `file`, `grep` and `xxd` solve a surprising number of beginner challenges." },
        { label: "Your browser's developer tools.", body: "View the source, the network requests and the cookies before anything else." },
        { label: "Wireshark.", body: "For any challenge that hands you a packet capture." },
        { label: "Python.", body: "For the moment a puzzle needs the same step repeated a thousand times." },
      ],
    },
    {
      id: "ncl",
      title: "Compete with the club",
      intro: "The National Cyber League runs a season every fall and spring. It is built for students, and each part of the season has a job.",
      bullets: [
        { label: "Gymnasium.", body: "A practice area with guides to past challenges. Fall 2026: August 17 to December 11." },
        { label: "Practice Game.", body: "A week of challenges without the guides. Fall 2026: October 12 to 18." },
        { label: "Individual Game.", body: "A weekend where you compete on your own. Fall 2026: October 23 to 25." },
        { label: "Team Game.", body: "A weekend in teams of up to seven. Fall 2026: November 6 to 8." },
      ],
      note: "Fall 2026 registration costs $45 through October 9, then $55 through October 13. Ask an officer about the club team before you pay.",
    },
    {
      id: "resume",
      title: "Put it on your résumé",
      bullets: [
        { label: "Name the event and the season.", body: "Add your honest result, even if it is modest." },
        { label: "Write up one challenge.", body: "After the event ends, explain one solve from clue to flag. That page is a portfolio piece." },
        { label: "Be ready to explain it.", body: "An interviewer will ask how you solved it. The notes you kept are your answer." },
      ],
    },
  ],
  links: [
    {
      group: "Start here",
      items: [
        {
          label: "picoCTF",
          href: "https://picoctf.org/",
          note: "Free beginner challenges from Carnegie Mellon University, open all year.",
        },
        {
          label: "CTF 101",
          href: "https://ctf101.org/",
          note: "A free handbook that explains each challenge category from zero.",
        },
        {
          label: "OverTheWire wargames",
          href: "https://overthewire.org/wargames/",
          note: "Free games you play over SSH. Start with Bandit.",
        },
      ],
    },
    {
      group: "National Cyber League",
      items: [
        {
          label: "National Cyber League",
          href: "https://nationalcyberleague.org/",
          note: "The season schedule and registration. The dates and prices above were read here.",
        },
        {
          label: "NCL for students",
          href: "https://nationalcyberleague.org/players",
          note: "How the games work and what you get from playing.",
        },
      ],
    },
    {
      group: "Find more events",
      items: [
        {
          label: "CTFtime",
          href: "https://ctftime.org/",
          note: "A calendar of CTF events worldwide, with write-ups from past ones.",
        },
      ],
    },
    {
      group: "Watch",
      items: [
        {
          label: "John Hammond: Learn Capture the Flag!",
          href: "https://www.youtube.com/watch?v=MJC11U3WzoA",
          note: "An hour of working through challenges, for when you want to see the thought process.",
        },
      ],
    },
    {
      group: "Tools",
      items: [
        {
          label: "CyberChef",
          href: "https://gchq.github.io/CyberChef/",
          note: "The decoding tool from the starter toolkit. Nothing to install.",
        },
      ],
    },
  ],
  checked: "2026-09-30",
};
