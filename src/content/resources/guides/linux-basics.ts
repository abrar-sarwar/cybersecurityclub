import type { Guide } from "../types";

export const linuxBasics: Guide = {
  slug: "linux-basics",
  group: "hands-on",
  title: "Linux command line basics",
  eyebrow: "Skills guide",
  summary:
    "Most security tools and most servers run on Linux. Start in the practice terminal on this page, then keep going with a short daily habit and a free game.",
  card: "Practice in a terminal right on the page, then keep going with a free game.",
  facts: [
    { label: "Cost", value: "Free" },
    { label: "Start", value: "On this page" },
    { label: "First goal", value: "OverTheWire Bandit" },
    { label: "Habit", value: "15 minutes a day" },
  ],
  notice: {
    title: "Type every command yourself",
    body: "Pasting a command teaches you nothing about it. Type it out, read the error when it fails, and try `man` before you search.",
  },
  sections: [
    {
      id: "practice",
      title: "Try it right here",
      intro:
        "This terminal is a pretend Linux system that runs in your browser, so nothing you type can break anything. Work through the ten missions, or type `help` and explore on your own.",
      widget: "terminal",
    },
    {
      id: "terminal",
      title: "Get a real terminal",
      intro: "The practice terminal covers the first commands. For everything after that you want the real thing.",
      bullets: [
        { label: "Windows.", body: "Run `wsl --install` in an administrator PowerShell to get Ubuntu inside Windows." },
        { label: "Mac.", body: "The built-in Terminal app is close enough for the basics." },
        { label: "Any computer.", body: "The Kali virtual machine from the home lab guide gives you a full Linux desktop." },
        { label: "Nothing to install.", body: "OverTheWire Bandit only needs an SSH client, which Windows, macOS and Linux all include." },
      ],
    },
    {
      id: "watch",
      title: "Watch the first lesson",
      intro: "This is episode one of a free series. Follow along in your own terminal, not just on screen.",
      video: {
        id: "VbEx7B_PTOE",
        title: "Linux for Hackers // EP 1 (FREE Linux course for beginners)",
        channel: "NetworkChuck",
        length: "11:32",
        caption: "The first episode of NetworkChuck's beginner series. The full playlist is in the links below.",
      },
    },
    {
      id: "commands",
      title: "The commands to know first",
      bullets: [
        { label: "Moving around.", body: "`pwd`, `ls` and `cd`." },
        { label: "Working with files.", body: "`cat`, `less`, `cp`, `mv`, `rm`, `mkdir` and `touch`." },
        { label: "Finding things.", body: "`grep` to search inside files and `find` to search for them." },
        { label: "Permissions.", body: "`chmod`, `chown` and `sudo`. Know what read, write and execute mean for a file and for a folder." },
        { label: "Processes and network.", body: "`ps`, `top`, `ip a`, `ss` and `ping`." },
        { label: "Getting help.", body: "`man` followed by a command, or the command followed by `--help`." },
      ],
      note: "Learn the pipe early. `grep` on its own is useful; `cat auth.log | grep Failed | wc -l` answers a real question.",
    },
    {
      id: "bandit",
      title: "Play Bandit",
      intro: "OverTheWire Bandit is a free game. Each level hides the password to the next one, and finding it takes one or two commands you have not used before.",
      steps: [
        { label: "Connect.", body: "Run `ssh bandit0@bandit.labs.overthewire.org -p 2220`. The level 0 page gives the first password." },
        { label: "Read the level goal.", body: "Each page lists commands you may need. Look each one up with `man`." },
        { label: "Get stuck on purpose.", body: "Give a level twenty minutes before you look for a hint." },
        { label: "Keep a notes file.", body: "One line per level: what the trick was and the command that solved it." },
      ],
    },
    {
      id: "after",
      title: "Where it goes next",
      bullets: [
        { label: "Read logs.", body: "Most defensive work is `grep`, `sort` and `uniq` over log files." },
        { label: "Write small scripts.", body: "Anything you type three times can become a Bash or Python script." },
        { label: "Use it in a competition.", body: "Capture the flag challenges assume you can move around a Linux system." },
      ],
    },
  ],
  links: [
    {
      group: "Practice",
      items: [
        {
          label: "OverTheWire Bandit",
          href: "https://overthewire.org/wargames/bandit/",
          note: "The game described above. Free, with no account.",
        },
        {
          label: "TryHackMe: Linux Fundamentals",
          href: "https://tryhackme.com/module/linux-fundamentals",
          note: "Guided lessons with a Linux machine in the browser. Needs a free account.",
        },
        {
          label: "Linux Journey",
          href: "https://labex.io/linuxjourney",
          note: "Free written lessons from the basics up. The site is now hosted by LabEx.",
        },
      ],
    },
    {
      group: "Watch",
      items: [
        {
          label: "NetworkChuck: Linux for Hackers playlist",
          href: "https://www.youtube.com/playlist?list=PLIhvC56v63IJIujb5cyE13oLuyORZpdkL",
          note: "The rest of the free series after episode one.",
        },
        {
          label: "NetworkChuck: 60 Linux Commands you NEED to know (in 10 minutes)",
          href: "https://www.youtube.com/watch?v=gd7BXuUQ91w",
          note: "A quick tour to come back to once the basics feel familiar.",
        },
      ],
    },
    {
      group: "Reference",
      items: [
        {
          label: "explainshell",
          href: "https://explainshell.com/",
          note: "Paste any command and it labels each part from the manual pages.",
        },
        {
          label: "Install WSL",
          href: "https://learn.microsoft.com/windows/wsl/install",
          note: "Microsoft's guide to running Linux inside Windows.",
        },
      ],
    },
  ],
  checked: "2026-09-30",
};
