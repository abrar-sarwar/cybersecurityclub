import type { Metadata } from "next";
import { branding } from "@config/branding";
import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/site/page-hero";
import { TeamNetwork } from "@/components/site/team-network";
import { boardPortraits } from "@/server/services/portraits";
import { BOARD_HEADING, BOARD_TERM } from "@/content/club/board";

import "./team.css";

export const metadata: Metadata = {
  title: "Team",
  description: `The executive board of the ${branding.displayName}, and how to become a member.`,
  alternates: { canonical: "/team" },
};

// Portrait files are read from disk on each request, so adding one needs no rebuild.
export const dynamic = "force-dynamic";

const STEPS = [
  { title: "Come to a meeting", body: "Turn up to anything on the events page. Nothing is required beforehand, and no experience is assumed." },
  { title: "Join the Discord", body: "Most of the club happens between meetings: study groups, questions, competition teams and project partners." },
  { title: "Bring something you are working on", body: "A project, a certification you are studying for, or a question. That is how most people meet each other here." },
];

export default async function TeamPage() {
  const portraits = boardPortraits();

  return (
    <>
      <PageHero
        eyebrow="The club"
        title="The team behind the club"
        description={`The club is run by students who volunteer their time. Here is the board for ${BOARD_TERM}, and how to join.`}
      >
        <ButtonLink href={branding.links.discordInvite} size="lg" external>
          Join Discord
        </ButtonLink>
        <ButtonLink href="/events" variant="outline" size="lg">
          See upcoming events
        </ButtonLink>
      </PageHero>

      <section className="board-headline" aria-labelledby="board-heading">
        <p className="signal-eyebrow">
          <span className="signal-eyebrow-mark" aria-hidden="true" />
          Who runs the club
        </p>
        <h2 id="board-heading" className="signal-section-title">
          {BOARD_HEADING}
        </h2>
        <TeamNetwork portraits={portraits} />
      </section>

      <div className="container-x board-page">
        <section className="board-section" aria-labelledby="reach">
          <div className="board-section-head">
            <p className="signal-eyebrow">
              <span className="signal-eyebrow-mark" aria-hidden="true" />
              Get involved
            </p>
            <h2 id="reach" className="signal-section-title">
              Becoming a member
            </h2>
            <p className="board-note">
              Membership is free and there are no dues. Any {branding.universityShortName} student can join, from any major, at any point in the semester.
            </p>
          </div>
          <ol className="board-steps">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="board-step-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="board-actions">
            <ButtonLink href={branding.links.discordInvite} external>
              Ask the board on Discord
            </ButtonLink>
            <ButtonLink href={branding.links.pinOrganization} variant="outline" external>
              Official page on PIN
            </ButtonLink>
          </div>
          <p className="board-note">Officers are easiest to reach on Discord.</p>
        </section>
      </div>
    </>
  );
}
