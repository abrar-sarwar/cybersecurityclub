import type { Metadata } from "next";
import Link from "next/link";
import { Box, Grid2x2, Sun, Terminal, type LucideIcon } from "lucide-react";
import { branding } from "@config/branding";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";
import { cylabs, featuredChallenge, hackTheBox, htbGroups, type Difficulty, type MachineOs } from "@/content/club/practice";

export const metadata: Metadata = {
  title: "Challenges",
  description: `Where ${branding.universityShortName} students practice hacking: the challenge of the week, CyLabs and recommended Hack The Box machines.`,
  alternates: { canonical: "/challenges" },
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
        eyebrow="Challenges"
        title="Practice hacking at your own pace."
        description="A challenge of the week, two platforms to practice on, and Hack The Box machines the club recommends."
      >
        <ButtonLink href="#practice" variant="primary" size="lg">
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

      <aside className="pb-16" aria-labelledby="compete-callout">
        <div className="container-x">
          <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.95rem] leading-6 text-muted">
              <strong id="compete-callout" className="font-semibold text-navy-900">
                Want to compete?
              </strong>{" "}
              The competitive team represents {branding.universityShortName} in CTFs and collegiate competitions.
            </p>
            <Link href="/competitions" className={`${linkClass} shrink-0`}>
              About competitions <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
