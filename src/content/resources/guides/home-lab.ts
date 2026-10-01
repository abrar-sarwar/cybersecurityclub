import type { Guide } from "../types";

export const homeLab: Guide = {
  slug: "home-lab",
  group: "hands-on",
  title: "Build your first home lab",
  eyebrow: "Setup guide",
  summary:
    "Two virtual machines on a private network, on the laptop you already have: Kali Linux for tools, and a second machine to practice against.",
  card: "Two virtual machines on a private network, on your own laptop.",
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
};
