import type { Metadata } from "next";
import { Suspense } from "react";
import { EventCalendar } from "@/components/events/event-calendar";
import { EventsLoading, EventsUnavailable, PastEvents, UpcomingEvents } from "@/components/site/event-board";
import { SectionHeading } from "@/components/ui/primitives";
import { clubToday } from "@/lib/dates";
import { arrangeEvents } from "@/lib/events/board";
import { loadEvents } from "@/server/events/load-events";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming meetings, workshops and competitions, a calendar of everything scheduled, and materials from past events.",
  alternates: { canonical: "/events" },
};

// Rendered per request so an event moves to "past" on the right day without a rebuild.
// The events themselves are read through the data cache (see src/server/events/load-events.ts).
export const dynamic = "force-dynamic";

async function Board() {
  const result = await loadEvents();
  if (!result.ok) {
    return (
      <section className="container-x pt-10">
        <EventsUnavailable />
      </section>
    );
  }
  const now = new Date();
  const today = clubToday(now);
  const { upcoming, past } = arrangeEvents(result.events, now);
  return (
    <>
      <section className="container-x pt-10" aria-labelledby="upcoming-title">
        <h2 id="upcoming-title" className="signal-section-title mb-6">
          Upcoming events
        </h2>
        <UpcomingEvents events={upcoming} today={today} />
      </section>

      <section className="container-x pt-16" aria-labelledby="calendar-title">
        <h2 id="calendar-title" className="signal-section-title mb-6">
          Calendar
        </h2>
        <EventCalendar events={result.events} today={today} />
      </section>

      <section id="past-events" className="container-x ev-archive mt-12 scroll-mt-24" aria-labelledby="past-title">
        <h2 id="past-title" className="signal-section-title">
          Past events
        </h2>
        <PastEvents events={past} />
      </section>
    </>
  );
}

export default function EventsPage() {
  return (
    <>
      <section className="container-x ev-page" aria-labelledby="page-title">
        <SectionHeading as="h1" id="page-title" eyebrow="Events" title="Workshops, meetings and competitions" description="Everything the club has scheduled. Most events need no experience." />
      </section>
      <Suspense fallback={<EventsLoading />}>
        <Board />
      </Suspense>
    </>
  );
}
