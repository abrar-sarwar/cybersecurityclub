import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsLoading, EventsUnavailable, PastEvents, UpcomingEvents } from "@/components/site/event-board";
import { clubToday } from "@/lib/dates";
import { arrangeEvents } from "@/lib/events/board";
import { loadEvents } from "@/server/events/load-events";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming meetings, workshops and competitions, with where and when to turn up and RSVP links on PIN.",
  alternates: { canonical: "/events" },
};

// Rendered per request so an event moves to "past" on the right day without a rebuild.
// The sheet itself is read through the data cache (see src/server/events/load-events.ts).
export const dynamic = "force-dynamic";

async function Board() {
  const result = await loadEvents();
  if (!result.ok) return <EventsUnavailable />;
  const now = new Date();
  const { upcoming, past } = arrangeEvents(result.events, now);
  return (
    <>
      <UpcomingEvents events={upcoming} today={clubToday(now)} />
      {past.length ? (
        <section className="ev-archive">
          <PastEvents events={past} />
        </section>
      ) : null}
    </>
  );
}

export default function EventsPage() {
  return (
    <section className="container-x ev-page" aria-labelledby="page-title">
      {/* No hero: the next event is the first thing on the page. */}
      <h1 id="page-title" className="sr-only">
        Upcoming events
      </h1>
      <Suspense fallback={<EventsLoading />}>
        <Board />
      </Suspense>
    </section>
  );
}
