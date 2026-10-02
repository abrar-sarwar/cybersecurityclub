import type { Metadata } from "next";
import Link from "next/link";
import { branding } from "@config/branding";
import { ChallengeBoard } from "@/components/challenges/challenge-board";
import { platformIcon } from "@/components/challenges/platform-icon";
import { categories, challenges, platforms, type PlatformId } from "@/content/club/practice";

export const metadata: Metadata = {
  title: "Challenges",
  description: `Where ${branding.universityShortName} students practice hacking: recommended challenges from CyLabs, Hack The Box and the club, grouped by topic.`,
  alternates: { canonical: "/challenges" },
};

/* Full-skin classes for the platform cards; platforms without one get the plain card. */
const platformSkin: Partial<Record<PlatformId, string>> = {
  htb: "htb htb-panel",
  cylab: "cylab",
};

const linkClass = "text-sm font-semibold text-accent underline-offset-4 hover:underline";

const activePlatforms = Object.values(platforms).filter((platform) =>
  challenges.some((challenge) => challenge.platform === platform.id),
);
const activeCategories = categories.filter((category) => challenges.some((challenge) => challenge.category === category));

export default function ChallengesPage() {
  return (
    <>
      <header className="container-x pb-6 pt-8 sm:pt-10">
        <div className="flex flex-col gap-2 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
          <h1 id="page-title" className="signal-section-title">
            Challenges
          </h1>
          <p className="font-mono text-[0.8rem] uppercase tracking-[0.12em] text-muted">
            {challenges.length} challenges · {activeCategories.length} categories · {activePlatforms.length} platforms
          </p>
        </div>
      </header>

      <ChallengeBoard challenges={challenges} categories={activeCategories} platforms={activePlatforms}>
        <section id="platforms" className="scroll-mt-6" aria-labelledby="platforms-heading">
          <h2
            id="platforms-heading"
            className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-muted"
          >
            Platforms
          </h2>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {activePlatforms.map((platform) => {
              const Icon = platformIcon[platform.id];
              const external = /^https?:/.test(platform.href);
              return (
                <li key={platform.id}>
                  <a
                    href={platform.href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    data-platform={platform.id}
                    className={`platform-card ${platformSkin[platform.id] ?? "platform-card-plain"}`}
                  >
                    <span className="platform-card-level">{platform.level}</span>
                    <span className="platform-card-name">
                      <span className="flex items-center gap-2">
                        <Icon className="platform-card-accent size-5" aria-hidden="true" />
                        {platform.name}
                      </span>
                      <span className="platform-card-accent" aria-hidden="true">
                        {external ? "↗" : "→"}
                      </span>
                    </span>
                    <span className="mt-2 block text-[0.92rem] leading-6">{platform.description}</span>
                    {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      </ChallengeBoard>

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
