import { branding } from "@config/branding";

/** Homepage copy. The club can edit this file without touching components. */

export type HomePillar = { id: "learn" | "practice" | "compete" | "network" | "community"; title: string; body: string };

export const HOME_PILLARS: readonly HomePillar[] = [
  { id: "learn", title: "Learn", body: "Workshops and talks that start from the basics and explain terms as they come up." },
  { id: "practice", title: "Practice", body: "Hands-on labs and intentionally vulnerable targets, so you can experiment safely and legally." },
  { id: "compete", title: "Compete", body: "Capture-the-flag events and team competitions for members who want a challenge." },
  { id: "network", title: "Network", body: "Speaker panels and industry talks where you can meet people working in security and ask how they got there." },
  { id: "community", title: "Community", body: "A Discord full of students who share resources, answer questions and study together." },
];

export const HOME_BEGINNER = {
  title: "Never touched cybersecurity before?",
  body: "That is where most members start. You do not need experience, a certain major or special equipment. Pick up the fundamentals at your own pace and ask anything in Discord.",
  learnHref: "/resources#getting-started",
};

export type PracticePlatform = { name: string; href: string; body: string };

export const HOME_PRACTICE: readonly PracticePlatform[] = [
  { name: "CyLabs", href: branding.links.cylabs, body: "The club's own lab environment for guided, hands-on exercises." },
  { name: "picoCTF", href: branding.links.picoCtf, body: "Free, beginner-friendly CTF challenges you can work through any time." },
  { name: "Hack The Box", href: branding.links.hackTheBox, body: "Realistic machines and challenges for when you want to go deeper." },
];

export const HOME_COMPETE = {
  title: "Ready to compete?",
  body: "The competitive team trains for CTFs and collegiate competitions. See how challenges work and how to apply.",
  href: "/challenges",
};

export const HOME_JOIN = {
  title: "Join the club on Discord",
  body: "Announcements, event reminders, study groups and help all happen there. Joining is free and open to GSU students.",
};

export const HOME_EVENTS_EMPTY = "New events are being planned. Join the Discord for announcements.";
