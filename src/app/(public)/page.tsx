import type { Metadata } from "next";
import { Suspense } from "react";
import { branding } from "@config/branding";
import { CyberHome } from "@/components/marketing/cyber-home";
import { BeginnerCallout, CompeteAndJoin, EventSpotlight, EventSpotlightLoading, PracticeSection } from "@/components/home/home-sections";
import { loadObservatory } from "@/content/observatory";
import { safeLoad } from "@/content/safe";
import { arrangeEvents } from "@/lib/events/board";
import { loadEvents } from "@/server/events/load-events";

export const metadata: Metadata = {
  title: branding.displayName,
  description: branding.description,
  alternates: { canonical: "/" },
};

/* "Upcoming" depends on today's date. */
export const dynamic = "force-dynamic";

/** The next three events from the events database; streams in after the hero. */
async function HomeEvents() {
  const result = await loadEvents();
  if (!result.ok) return <EventSpotlight events={[]} unavailable />;
  return <EventSpotlight events={arrangeEvents(result.events, new Date()).upcoming.slice(0, 3)} />;
}

export default function HomePage() {
  const content = safeLoad(loadObservatory, { employers: [], projects: [], news: [] });
  const employers = content.employers.filter((employer) => employer.confirmed);
  return (
    <>
      <CyberHome employers={employers} />
      <Suspense fallback={<EventSpotlightLoading />}>
        <HomeEvents />
      </Suspense>
      <BeginnerCallout />
      <PracticeSection />
      <CompeteAndJoin />
    </>
  );
}
