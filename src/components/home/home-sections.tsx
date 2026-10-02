import { BookOpen, CalendarDays, Clock, FlaskConical, MapPin, Trophy, Users } from "lucide-react";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { ButtonLink } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/external-link";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { formatEventDate, formatEventTime, type ClubEvent } from "@/content/club/events";
import { HOME_BEGINNER, HOME_COMPETE, HOME_EVENTS_EMPTY, HOME_JOIN, HOME_PILLARS, HOME_PRACTICE, type HomePillar } from "@/content/club/home";

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
                <Card as="li" key={event.id} className="flex flex-col gap-3 p-5">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{event.category}</Badge>
                    {event.difficulty ? <Badge tone="cyan">{event.difficulty}</Badge> : null}
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

const pillarIcons: Record<HomePillar["id"], typeof BookOpen> = { learn: BookOpen, practice: FlaskConical, compete: Trophy, community: Users };

export function WhatWeDo() {
  return (
    <section className="surface-pale border-y border-line section" aria-labelledby="home-what">
      <div className="container-x">
        <SectionHeading id="home-what" eyebrow="What we do" title="Learn security by doing it" />
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_PILLARS.map((pillar) => {
            const Icon = pillarIcons[pillar.id];
            return (
              <Card as="li" key={pillar.id} className="p-5">
                <Icon className="size-6 text-brand-700" aria-hidden />
                <h3 className="mt-3 font-display text-lg font-bold text-navy-900">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{pillar.body}</p>
              </Card>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function BeginnerCallout() {
  return (
    <section className="container-x section" aria-labelledby="home-beginner">
      <Card className="p-6 sm:p-10">
        <SectionHeading id="home-beginner" eyebrow="Beginners welcome" title={HOME_BEGINNER.title} description={HOME_BEGINNER.body} />
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={HOME_BEGINNER.learnHref}>Start Learning</ButtonLink>
          <DiscordButton />
        </div>
      </Card>
    </section>
  );
}

export function PracticeSection() {
  return (
    <section className="surface-pale border-y border-line section" aria-labelledby="home-practice">
      <div className="container-x">
        <SectionHeading id="home-practice" eyebrow="Practice" title="Places to practice" description="Legal, purpose-built platforms where you can build skills between meetings." />
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {HOME_PRACTICE.map((platform) => (
            <Card as="li" key={platform.name} className="p-5">
              <h3 className="font-display text-lg font-bold text-navy-900">
                <ExternalLink href={platform.href}>{platform.name}</ExternalLink>
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">{platform.body}</p>
            </Card>
          ))}
        </ul>
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
      <section className="container-x section" aria-labelledby="home-compete">
        <SectionHeading id="home-compete" eyebrow="Competitive team" title={HOME_COMPETE.title} description={HOME_COMPETE.body} />
        <div className="mt-6">
          <ButtonLink href={HOME_COMPETE.href} variant="secondary">
            About the competitive team
          </ButtonLink>
        </div>
      </section>
      <section className="surface-pale border-t border-line section" aria-labelledby="home-join">
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
