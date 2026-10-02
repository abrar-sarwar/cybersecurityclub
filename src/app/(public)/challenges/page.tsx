import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Trophy, Users } from "lucide-react";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/external-link";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { competitions, pathway, REGISTRATION_LABELS, type RegistrationStatus } from "@/content/club/competitions";
import { cylabs, featuredChallenge, htbGroups, platforms, type Difficulty } from "@/content/club/practice";

export const metadata: Metadata = {
  title: "Challenges & Competitions",
  description: `How to practice hacking and compete for ${branding.universityShortName}: the competitive team, upcoming competitions, CyLabs, picoCTF and recommended Hack The Box machines.`,
  alternates: { canonical: "/challenges" },
};

const statusTone: Record<RegistrationStatus, "success" | "muted" | "warning" | "cyan"> = {
  open: "success",
  closed: "muted",
  upcoming: "warning",
  interest: "cyan",
};

const difficultyTone: Record<Difficulty, "success" | "warning" | "danger"> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
};

const linkClass = "text-sm font-semibold text-accent underline-offset-4 hover:underline";

export default function ChallengesPage() {
  const featured = featuredChallenge;

  return (
    <>
      <PageHero
        eyebrow="Competitive team"
        title={`Represent ${branding.universityShortName} in cybersecurity competitions.`}
        description="Train with other students, solve challenges, and compete in collegiate CTF and cybersecurity competitions."
      >
        <ButtonLink href={branding.links.competitiveTeamApplication} variant="primary" size="lg" external>
          Apply to the Competitive Team
          <span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </ButtonLink>
        <ButtonLink href="#practice" variant="outline" size="lg">
          Start Practicing
        </ButtonLink>
      </PageHero>

      {featured ? (
        <section id="featured" className="section scroll-mt-24" aria-labelledby="featured-heading">
          <div className="container-x">
            <Card className="flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="signal-eyebrow mb-3">
                  <span className="signal-eyebrow-mark" aria-hidden="true" />
                  Challenge of the week
                </p>
                <h2 id="featured-heading" className="signal-section-title">
                  {featured.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="navy">{featured.platform}</Badge>
                  <Badge tone={difficultyTone[featured.difficulty]}>{featured.difficulty}</Badge>
                </div>
                <p className="mt-4 font-mono text-sm leading-6 text-muted">
                  <span className="sr-only">Focus: </span>
                  {featured.focus.join(" → ")}
                </p>
              </div>
              <ButtonLink href={featured.href} variant="primary" size="lg" external className="shrink-0">
                {featured.cta}
                <span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </ButtonLink>
            </Card>
          </div>
        </section>
      ) : null}

      <section id="pathway" className="section surface-pale scroll-mt-24" aria-labelledby="pathway-heading">
        <div className="container-x">
          <SectionHeading
            id="pathway-heading"
            eyebrow="The pathway"
            title="From first workshop to competing"
            description="Nobody starts on the team. Most members begin with no experience and move through these steps at their own pace."
          />
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pathway.map((step, index) => (
              <Card as="li" key={step.title} className="flex flex-col p-5">
                <span className="font-mono text-xs tracking-[0.12em] text-accent" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3 className="mt-2 font-display text-lg font-bold text-navy-900">{step.title}</h3>
                <p className="mt-2 flex-1 text-[0.95rem] leading-6 text-muted">{step.body}</p>
                {step.link ? (
                  <Link href={step.link.href} className={`${linkClass} mt-4`}>
                    {step.link.label} <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </Card>
            ))}
          </ol>
        </div>
      </section>

      <section id="competitions" className="section scroll-mt-24" aria-labelledby="competitions-heading">
        <div className="container-x">
          <SectionHeading
            id="competitions-heading"
            eyebrow="Competitions"
            title="Current and upcoming competitions"
            description="What the team is entering now, and what we are looking at next."
          />
          {competitions.length === 0 ? (
            <EmptyState
              className="mt-8"
              icon={<Trophy className="size-5" />}
              title="No competitions listed right now"
              description="New competitions are announced on Discord first."
              action={
                <ButtonLink href={branding.links.discordInvite} variant="discord" external>
                  <DiscordMark />
                  Join Discord
                </ButtonLink>
              }
            />
          ) : (
            <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {competitions.map((c) => (
                <Card as="li" key={c.name} className="flex flex-col p-5">
                  <div>
                    <Badge tone={statusTone[c.status]}>{REGISTRATION_LABELS[c.status]}</Badge>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-navy-900">{c.name}</h3>
                  <p className="mt-1 text-sm text-muted">{c.type}</p>
                  <dl className="mt-4 space-y-1.5 text-sm text-muted">
                    <div className="flex items-center gap-2">
                      <dt>
                        <CalendarDays className="size-4" aria-hidden="true" />
                        <span className="sr-only">Date</span>
                      </dt>
                      <dd>{c.date}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <dt>
                        <Users className="size-4" aria-hidden="true" />
                        <span className="sr-only">Team size</span>
                      </dt>
                      <dd>{c.teamSize}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 flex-1 text-[0.95rem] leading-6 text-muted">{c.description}</p>
                  {c.link ? (
                    <ExternalLink href={c.link.href} className={`${linkClass} mt-4`}>
                      {c.link.label}
                    </ExternalLink>
                  ) : null}
                </Card>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="practice" className="section surface-pale scroll-mt-24" aria-labelledby="practice-heading">
        <div className="container-x">
          <SectionHeading
            id="practice-heading"
            eyebrow="Practice"
            title="Where to practice"
            description="Three places to build skills between meetings. Pick one and start with the easiest challenge you can find."
          />
          <Card as="article" className="mt-8 flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <Badge tone="brand">{cylabs.level}</Badge>
              <h3 className="mt-3 font-display text-2xl font-bold text-navy-900">{cylabs.cta}</h3>
              <p className="mt-2 leading-7 text-muted">{cylabs.description}</p>
            </div>
            <ButtonLink href={cylabs.href} variant="primary" size="lg" external className="shrink-0">
              Open {cylabs.name}
              <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </ButtonLink>
          </Card>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {platforms.map((p) => (
              <Card as="li" key={p.name} className="flex flex-col p-5">
                <div>
                  <Badge tone="muted">{p.level}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-navy-900">{p.name}</h3>
                <p className="mt-2 flex-1 text-[0.95rem] leading-6 text-muted">{p.description}</p>
                <ExternalLink href={p.href} className={`${linkClass} mt-4`}>
                  {p.cta}
                </ExternalLink>
              </Card>
            ))}
          </ul>
        </div>
      </section>

      <section id="htb" className="section scroll-mt-24" aria-labelledby="htb-heading">
        <div className="container-x">
          <SectionHeading
            id="htb-heading"
            eyebrow="Hack The Box"
            title="Recommended machines"
            description="Retired machines grouped by what they teach. Start at the top and work down."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {htbGroups.map((group) => {
              const groupId = `htb-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              return (
                <Card as="section" key={group.title} className="p-5">
                  <h3 id={groupId} className="font-display text-lg font-bold text-navy-900">
                    {group.title}
                  </h3>
                  <ul aria-labelledby={groupId} className="mt-3 divide-y divide-line">
                    {group.machines.map((m) => (
                      <li key={m.name} className="flex items-start justify-between gap-3 py-3">
                        <div>
                          <ExternalLink href={m.href} className="font-semibold text-accent underline-offset-4 hover:underline">
                            {m.name}
                          </ExternalLink>
                          <p className="mt-0.5 text-sm leading-6 text-muted">{m.focus}</p>
                        </div>
                        <Badge tone={difficultyTone[m.difficulty]} className="shrink-0">
                          {m.difficulty}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="apply" className="section surface-pale scroll-mt-24" aria-labelledby="apply-heading">
        <div className="container-x">
          <SectionHeading
            id="apply-heading"
            align="center"
            eyebrow="Join the team"
            title="Ready to compete?"
            description="Apply to the competitive team, or join the Discord to practice with other members first."
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={branding.links.competitiveTeamApplication} variant="primary" size="lg" external>
              Apply to the Competitive Team
              <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </ButtonLink>
            <ButtonLink href={branding.links.discordInvite} variant="discord" size="lg" external>
              <DiscordMark />
              Join Discord
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
