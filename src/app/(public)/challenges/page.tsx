import type { Metadata } from "next";
import Link from "next/link";
import { Box, CalendarDays, Grid2x2, Sun, Terminal, Trophy, Users, type LucideIcon } from "lucide-react";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { MatrixRain } from "@/components/site/matrix-rain";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/external-link";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { competitions, pathway, REGISTRATION_LABELS, type RegistrationStatus } from "@/content/club/competitions";
import { cylabs, featuredChallenge, hackTheBox, htbGroups, type Difficulty, type MachineOs } from "@/content/club/practice";

export const metadata: Metadata = {
  title: "Challenges & Competitions",
  description: `How to practice hacking and compete for ${branding.universityShortName}: the competitive team, upcoming competitions, CyLabs and recommended Hack The Box machines.`,
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

/* Generic glyphs for the machine avatars; lucide ships no OS logos. */
const osIcon: Record<MachineOs, LucideIcon> = {
  Linux: Terminal,
  Windows: Grid2x2,
  Solaris: Sun,
};

const linkClass = "text-sm font-semibold text-accent underline-offset-4 hover:underline";

export default function ChallengesPage() {
  const featured = featuredChallenge;
  const featuredOnHtb = featured?.platform === hackTheBox.name;

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
            {featuredOnHtb ? (
              <div className="htb htb-panel htb-feature">
                <div>
                  <p className="htb-label">
                    <Box className="size-4" aria-hidden="true" />
                    Challenge of the week · {featured.platform}
                  </p>
                  <h2 id="featured-heading" className="htb-title">
                    {featured.title}
                  </h2>
                  <div className="mt-3">
                    <span className="htb-diff" data-difficulty={featured.difficulty}>
                      {featured.difficulty}
                    </span>
                  </div>
                  <ol className="htb-chain mt-4" aria-label="Focus">
                    {featured.focus.map((step, index) => (
                      <li key={step}>
                        <span>{step}</span>
                        {index < featured.focus.length - 1 ? (
                          <span className="htb-chain-arrow" aria-hidden="true">
                            →
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
                <a href={featured.href} target="_blank" rel="noopener noreferrer" className="htb-btn shrink-0">
                  {featured.cta}
                  <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            ) : (
              <Card className="card-feature flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
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
                  <ol className="focus-chain mt-4" aria-label="Focus">
                    {featured.focus.map((step, index) => (
                      <li key={step}>
                        <span>{step}</span>
                        {index < featured.focus.length - 1 ? (
                          <span className="focus-chain-arrow" aria-hidden="true">
                            →
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
                <ButtonLink href={featured.href} variant="primary" size="lg" external className="shrink-0">
                  {featured.cta}
                  <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </ButtonLink>
              </Card>
            )}
          </div>
        </section>
      ) : null}

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

      <section id="practice" className="section surface-pale scroll-mt-24" aria-labelledby="practice-heading">
        <div className="container-x">
          <SectionHeading
            id="practice-heading"
            eyebrow="Practice"
            title="Where to practice"
            description="Two places to build skills between meetings. Pick one and start with the easiest challenge you can find."
          />
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            <li className="cylab flex flex-col p-6">
              <p className="cylab-label">{cylabs.level}</p>
              <h3 className="cylab-title mt-3">{cylabs.name}</h3>
              <p className="mt-2 flex-1 text-[0.95rem] leading-6">{cylabs.description}</p>
              <div className="mt-5">
                <a href={cylabs.href} target="_blank" rel="noopener noreferrer" className="cylab-btn">
                  {cylabs.cta}
                  <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </li>
            <li className="htb htb-panel flex flex-col p-6">
              <div>
                <span className="htb-tag">{hackTheBox.level}</span>
              </div>
              <h3 className="htb-title mt-3 flex items-center gap-2 text-2xl">
                <Box className="size-6 text-[var(--htb-green)]" aria-hidden="true" />
                {hackTheBox.name}
              </h3>
              <p className="mt-2 flex-1 text-[0.95rem] leading-6">{hackTheBox.description}</p>
              <div className="mt-5">
                <a href={hackTheBox.href} target="_blank" rel="noopener noreferrer" className="htb-btn">
                  {hackTheBox.cta}
                  <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </li>
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
          <div className="htb htb-panel htb-machines mt-8">
            {htbGroups.map((group) => {
              const groupId = `htb-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              return (
                <section key={group.title} className="htb-group">
                  <h3 id={groupId}>{group.title}</h3>
                  <ul aria-labelledby={groupId}>
                    {group.machines.map((m) => {
                      const OsIcon = osIcon[m.os];
                      return (
                        <li key={m.name}>
                          <a href={m.href} target="_blank" rel="noopener noreferrer" className="htb-row">
                            <span className="htb-avatar" title={m.os}>
                              <OsIcon className="size-5" aria-hidden="true" />
                              <span className="sr-only">{m.os}</span>
                            </span>
                            <span className="htb-row-name">{m.name}</span>
                            <span className="htb-row-focus">{m.focus}</span>
                            <span className="htb-diff" data-difficulty={m.difficulty}>
                              {m.difficulty}
                            </span>
                            <span className="htb-row-arrow" aria-hidden="true">
                              ↗
                            </span>
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
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
