import type { Metadata } from "next";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/site/page-hero";
import { PhotoBackdrop } from "@/components/site/photo-backdrop";
import { TeamNetwork } from "@/components/site/team-network";
import { TeamCards } from "@/components/site/team-cards";
import { boardPortraits } from "@/server/services/portraits";
import { BOARD_HEADING, BOARD_TERM } from "@/content/club/board";
import { COMPETITIVE_TEAM, COMPETITIVE_TEAM_INTRO, COMPETITIVE_TEAM_TERM } from "@/content/club/competitive-team";
import { CompetitiveMemberCard } from "@/components/team/competitive-member-card";
import { EmptyState } from "@/components/ui/primitives";

import "./team.css";

export const metadata: Metadata = {
  title: "Team",
  description: `The executive board and competitive team of the ${branding.displayName}, and how to become a member.`,
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
        backdrop={<PhotoBackdrop />}
        description={`The club is run by students who volunteer their time. Here is the board for ${BOARD_TERM}, the competitive team, and how to join.`}
      >
        <ButtonLink href={branding.links.discordInvite} variant="discord" size="lg" external>
          <DiscordMark />
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
        <TeamCards portraits={portraits} />
      </section>

      <div className="container-x board-page">
        <section id="competitive-team" className="board-section" aria-labelledby="competitive-team-heading">
          <div className="board-section-head">
            <p className="signal-eyebrow">
              <span className="signal-eyebrow-mark" aria-hidden="true" />
              Who competes
            </p>
            <h2 id="competitive-team-heading" className="signal-section-title">
              Competitive Team
            </h2>
            <p className="board-note">{COMPETITIVE_TEAM_INTRO}</p>
          </div>
          {COMPETITIVE_TEAM.length > 0 ? (
            <ul className="comp-cards">
              {COMPETITIVE_TEAM.map((member) => (
                <CompetitiveMemberCard key={member.name} member={member} />
              ))}
            </ul>
          ) : (
            <EmptyState
              className="comp-empty"
              title={`The ${COMPETITIVE_TEAM_TERM} roster is being formed`}
              description="Members will be listed here once the team is confirmed. Applications are open to any GSU student."
              action={
                <>
                  <ButtonLink href={branding.links.competitiveTeamApplication} variant="primary" external>
                    Apply to the Competitive Team
                    <span aria-hidden="true">↗</span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </ButtonLink>
                  <ButtonLink href="/competitions" variant="outline">
                    How the team works
                  </ButtonLink>
                </>
              }
            />
          )}
        </section>

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
            <ButtonLink href={branding.links.discordInvite} variant="discord" external>
              <DiscordMark />
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
