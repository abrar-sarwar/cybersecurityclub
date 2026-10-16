import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Trophy, Users } from "lucide-react";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { MatrixRain } from "@/components/site/matrix-rain";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/external-link";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { competitions, pathway, REGISTRATION_LABELS, type RegistrationStatus } from "@/content/club/competitions";

export const metadata: Metadata = {
  title: "Competitions",
  description: `How to compete for ${branding.universityShortName}: the competitive team, the pathway from first workshop to competing, and current and upcoming competitions.`,
  alternates: { canonical: "/competitions" },
};

const statusTone: Record<RegistrationStatus, "success" | "muted" | "warning" | "cyan"> = {
  open: "success",
  closed: "muted",
  upcoming: "warning",
  interest: "cyan",
};

const linkClass = "text-sm font-semibold text-accent underline-offset-4 hover:underline";

export default function CompetitionsPage() {
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
        <ButtonLink href="/challenges" variant="outline" size="lg">
          Start Practicing
        </ButtonLink>
      </PageHero>

      <section id="pathway" className="surface-pale section scroll-mt-24" aria-labelledby="pathway-heading">
        <div className="container-x">
          <SectionHeading
            id="pathway-heading"
            eyebrow="The pathway"
            title="From first workshop to competing"
            description="Nobody starts on the team. Most members begin with no experience and move through these steps at their own pace."
          />
          <ol className="trace mt-12">
            {pathway.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 100}>
                <span className="trace-node" aria-hidden="true" />
                <span className="trace-step" aria-hidden="true">
                  STEP 0{index + 1}
                </span>
                <h3 className="font-display text-navy-900">{step.title}</h3>
                <p className="mt-2 flex-1 text-[0.95rem] leading-6 text-muted">{step.body}</p>
                {step.link ? (
                  <Link href={step.link.href} className={`${linkClass} mt-4`}>
                    {step.link.label} <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </Reveal>
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

      <section id="apply" className="rain-band section scroll-mt-24" aria-labelledby="apply-heading">
        <MatrixRain className="band-rain" />
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
