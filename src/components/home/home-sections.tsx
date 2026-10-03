import { CalendarDays, Clock, MapPin } from "lucide-react";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { ButtonLink } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/external-link";
import { EventCategoryBadge } from "@/components/events/event-details";
import { Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { formatEventDate, formatEventTime, type ClubEvent } from "@/content/club/events";
import { HOME_BEGINNER, HOME_COMPETE, HOME_EVENTS_EMPTY, HOME_JOIN, HOME_PILLARS, HOME_PRACTICE } from "@/content/club/home";
import { CLUB_PHOTOS } from "@/content/club/photos";
import { MatrixRain } from "@/components/site/matrix-rain";
import { PhotoBackdrop } from "@/components/site/photo-backdrop";
import { Reveal } from "@/components/site/reveal";

/* Each photo band cycles its own half of the club photographs. */
const MEETING_PHOTOS = CLUB_PHOTOS.filter((_, index) => index % 2 === 0);
const EVENT_PHOTOS = CLUB_PHOTOS.filter((_, index) => index % 2 === 1);

function DiscordButton({ label = "Join Discord", size }: { label?: string; size?: "md" | "lg" }) {
  return (
    <ButtonLink href={branding.links.discordInvite} variant="discord" size={size} external>
      <DiscordMark />
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </ButtonLink>
  );
}

export function EventSpotlight({ events }: { events: readonly ClubEvent[] }) {
  return (
    <section className="container-x section" aria-labelledby="home-events">
      <SectionHeading id="home-events" eyebrow="Coming up" title="Upcoming events" />
      {events.length === 0 ? (
        <EmptyState className="mt-8" icon={<CalendarDays className="size-5" />} title="No events scheduled yet" description={HOME_EVENTS_EMPTY} action={<DiscordButton />} />
      ) : (
        <>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const time = formatEventTime(event);
              return (
                <Card as="li" key={event.id} className="flex gap-4 p-5">
                  <div className="date-stamp self-start" aria-hidden="true">
                    <span className="date-stamp-month">{formatEventDate(event.date, { month: "short" })}</span>
                    <span className="date-stamp-day">{formatEventDate(event.date, { day: "numeric" })}</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      <EventCategoryBadge category={event.category} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-navy-900">{event.title}</h3>
                    <dl className="grid gap-1.5 text-sm text-muted">
                      <div className="flex items-center gap-2">
                        <dt className="sr-only">Date</dt>
                        <CalendarDays className="size-4 shrink-0" aria-hidden />
                        <dd>
                          <time dateTime={event.date}>{formatEventDate(event.date)}</time>
                        </dd>
                      </div>
                      {time ? (
                        <div className="flex items-center gap-2">
                          <dt className="sr-only">Time</dt>
                          <Clock className="size-4 shrink-0" aria-hidden />
                          <dd>{time}</dd>
                        </div>
                      ) : null}
                      {event.location ? (
                        <div className="flex items-center gap-2">
                          <dt className="sr-only">Location</dt>
                          <MapPin className="size-4 shrink-0" aria-hidden />
                          <dd>{event.location}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </Card>
              );
            })}
          </ul>
          <div className="mt-8">
            <ButtonLink href="/events" variant="outline">
              View all events
            </ButtonLink>
          </div>
        </>
      )}
    </section>
  );
}

/* The first pillar leads; the other four fill a two-by-two grid beside it. */
const pillarTile = ["bento-lead"];
const LEARN_TOPICS = ["Web", "Cryptography", "Reverse Engineering", "Forensics", "Binary Exploitation", "OSINT"];

export function WhatWeDo() {
  return (
    <section className="section" aria-labelledby="home-what">
      <div className="container-x">
        <SectionHeading id="home-what" eyebrow="What we do" title="Learn security by doing it" />
        <ul className="bento mt-8">
          {HOME_PILLARS.map((pillar, index) => (
            <Reveal as="li" key={pillar.id} delay={index * 80} className={`bento-tile ${pillarTile[index] ?? ""}`}>
              <span className="bento-index" aria-hidden="true">
                0{index + 1}
              </span>
              <h3 className="font-display text-navy-900">{pillar.title}</h3>
              <p className={index === 0 ? "mt-3 max-w-md leading-7 text-[#dbe7ff]" : "mt-2 text-sm leading-6 text-muted"}>{pillar.body}</p>
              {index === 0 ? (
                <ul className="bento-chips" aria-label="Topics">
                  {LEARN_TOPICS.map((topic) => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
              ) : null}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function BeginnerCallout() {
  return (
    <section className="photo-band section" aria-labelledby="home-beginner">
      <PhotoBackdrop photos={MEETING_PHOTOS} />
      <div className="container-x">
        <p className="signal-eyebrow mb-4">
          <span className="signal-eyebrow-mark" aria-hidden="true" />
          Beginners welcome
        </p>
        <h2 id="home-beginner" className="max-w-4xl font-display text-[clamp(2.2rem,6vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.05em]">
          {HOME_BEGINNER.title}
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink">{HOME_BEGINNER.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={HOME_BEGINNER.learnHref} size="lg">
            Start Learning
          </ButtonLink>
          <DiscordButton size="lg" />
        </div>
      </div>
    </section>
  );
}

export function PracticeSection() {
  return (
    <section className="section" aria-labelledby="home-practice">
      <div className="container-x">
        <SectionHeading id="home-practice" eyebrow="Practice" title="Places to practice" description="Legal, purpose-built platforms where you can build skills between meetings." />
        <ol className="ledger mt-8">
          {HOME_PRACTICE.map((platform, index) => (
            <Reveal as="li" key={platform.name} delay={index * 80}>
              <span className="ledger-index" aria-hidden="true">
                0{index + 1}
              </span>
              <h3 className="ledger-name text-navy-900">
                <ExternalLink href={platform.href}>{platform.name}</ExternalLink>
              </h3>
              <p className="ledger-body">{platform.body}</p>
            </Reveal>
          ))}
        </ol>
        <div className="mt-8">
          <ButtonLink href="/challenges" variant="outline">
            Explore challenges
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function CompeteAndJoin() {
  return (
    <>
      <section className="photo-band photo-band-flip section" aria-labelledby="home-compete">
        <PhotoBackdrop photos={EVENT_PHOTOS} interval={6500} />
        <div className="container-x">
          <p className="signal-eyebrow mb-4">
            <span className="signal-eyebrow-mark" aria-hidden="true" />
            Competitive team
          </p>
          <h2 id="home-compete" className="statement-title">
            {HOME_COMPETE.title}
          </h2>
          <p className="mt-6 max-w-2xl text-[1.0625rem] leading-7 text-muted">{HOME_COMPETE.body}</p>
          <div className="mt-6">
            <ButtonLink href={HOME_COMPETE.href} variant="secondary" size="lg">
              About the competitive team
            </ButtonLink>
          </div>
        </div>
      </section>
      <section className="rain-band section" aria-labelledby="home-join">
        <MatrixRain className="band-rain" />
        <div className="container-x">
          <SectionHeading id="home-join" align="center" title={HOME_JOIN.title} description={HOME_JOIN.body} />
          <div className="mt-6 flex justify-center">
            <DiscordButton size="lg" />
          </div>
        </div>
      </section>
    </>
  );
}
