import type { Metadata } from "next";
import { PastEvents, UpcomingEvents } from "@/components/site/event-board";
import { CLUB_EVENTS, splitEvents } from "@/content/club/flyers";
import { clubToday } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming meetings, workshops and competitions, with where and when to turn up and RSVP links on PIN.",
  alternates: { canonical: "/events" },
};

// Rendered per request so an event moves to "past" on the right day without a rebuild.
export const dynamic = "force-dynamic";

export default function EventsPage() {
  const today = clubToday();
  const { upcoming, past } = splitEvents(CLUB_EVENTS, today);

  return (
    <>
      {/* No hero: the next event is the first thing on the page. */}
      <section className="container-x ev-page" aria-labelledby="page-title">
        <h1 id="page-title" className="sr-only">
          Upcoming events
        </h1>
        <UpcomingEvents events={upcoming} today={today} />
      </section>

      <section className="container-x ev-archive">
        <PastEvents events={past} />
      </section>
    </>
  );
}
