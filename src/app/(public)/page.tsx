import type { Metadata } from "next";
import { branding } from "@config/branding";
import { CyberHome } from "@/components/marketing/cyber-home";
import { BeginnerCallout, CompeteAndJoin, EventSpotlight, PracticeSection, WhatWeDo } from "@/components/home/home-sections";
import { CLUB_EVENTS, splitEvents } from "@/content/club/events";
import { loadObservatory } from "@/content/observatory";
import { safeLoad } from "@/content/safe";
import { clubToday } from "@/lib/dates";

export const metadata: Metadata = {
  title: branding.displayName,
  description: branding.description,
  alternates: { canonical: "/" },
};

/* "Upcoming" depends on today's date. */
export const dynamic = "force-dynamic";

export default function HomePage() {
  const content = safeLoad(loadObservatory, { employers: [], projects: [], news: [] });
  const employers = content.employers.filter((employer) => employer.confirmed);
  const upcoming = splitEvents(CLUB_EVENTS, clubToday()).upcoming.slice(0, 3);
  return (
    <>
      <CyberHome employers={employers} />
      <EventSpotlight events={upcoming} />
      <WhatWeDo />
      <BeginnerCallout />
      <PracticeSection />
      <CompeteAndJoin />
    </>
  );
}
