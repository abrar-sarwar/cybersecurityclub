import type { Metadata } from "next";
import { EventCalendar } from "@/components/events/event-calendar";
import { PastEvents, UpcomingEvents } from "@/components/site/event-board";
import { SectionHeading } from "@/components/ui/primitives";
import { CLUB_EVENTS, splitEvents } from "@/content/club/events";
import { clubToday } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming meetings, workshops and competitions, a calendar of everything scheduled, and materials from past events.",
  alternates: { canonical: "/events" },
};

// Rendered per request so an event moves to "past" on the right day without a rebuild.
export const dynamic = "force-dynamic";

export default function EventsPage() {
  const today = clubToday();
  const { upcoming, past } = splitEvents(CLUB_EVENTS, today);

  return (
    <>
      <section className="container-x ev-page" aria-labelledby="page-title">
        <SectionHeading
          as="h1"
          id="page-title"
          eyebrow="Events"
          title="Workshops, meetings and competitions"
          description="Everything the club has scheduled. Most events need no experience: look for the “Beginner friendly” and “All levels welcome” tags."
        />
      </section>

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
        <EventCalendar events={CLUB_EVENTS} today={today} />
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
