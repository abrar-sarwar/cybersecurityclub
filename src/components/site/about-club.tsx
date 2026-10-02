import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/primitives";
import { PageHero } from "@/components/site/page-hero";
import { PhotoBackdrop } from "@/components/site/photo-backdrop";
import { ValueStack } from "@/components/site/value-stack";
import { AttackFeed } from "@/components/site/attack-feed";
import { Voices } from "@/components/site/voices";

const values = [
  { title: "Beginners are welcome, and we mean it", body: "Most members arrived without a security background. Sessions explain terms as they come up, and questions are never a bad look." },
  { title: "Learn by doing", body: "Workshops and projects use isolated practice environments, sample data and intentionally vulnerable apps so you can experiment safely and legally." },
  { title: "Honest about the field", body: "We talk plainly about what jobs actually involve, what certifications do and do not do, and how to describe your experience without overselling it." },
  { title: "Community first", body: "The best thing about the club is the people. Study groups, competition teams and project partners usually start as a conversation on Discord." },
];

/** What the club is, shown on the homepage directly under the hero. */
export function AboutClub() {
  return (
    <>
      <PageHero
        id="about"
        titleAs="h2"
        titleId="about-heading"
        eyebrow="About the club"
        title="A student community for learning cybersecurity together"
        description={`${branding.displayName} is a registered student organization at ${branding.universityName}. We meet regularly on the Atlanta campus to learn tools and techniques, work on projects, practice for competitions, and prepare for internships and jobs in the field.`}
        backdrop={<PhotoBackdrop />}
      >
        <ButtonLink href={branding.links.discordInvite} variant="discord" size="lg" external>
          <DiscordMark />
          Join Discord
        </ButtonLink>
        <ButtonLink href={branding.links.pinOrganization} variant="outline" size="lg" external>
          Official page on PIN
        </ButtonLink>
      </PageHero>

      <section className="container-x section" aria-labelledby="voices-heading">
        <SectionHeading
          id="voices-heading"
          eyebrow="In their words"
          title="What members say"
          description="Quotes from people who have been through the club."
        />
        <Voices />
      </section>

      <section className="surface-pale border-y border-line section" aria-labelledby="values">
        <div className="container-x">
          <SectionHeading id="values" eyebrow="How we work" title="What to expect" />
          <div className="values-split">
            <ValueStack values={values} />
            <AttackFeed />
          </div>
        </div>
      </section>

      <section className="container-x section" aria-labelledby="exec">
        <SectionHeading
          id="exec"
          eyebrow="Who runs the club"
          title="The exec board"
          description="Officers are students who volunteer their time to run meetings, plan workshops and keep the community welcoming. The team page lists the current board, what each seat covers and how to join."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/team">Meet the team</ButtonLink>
          <ButtonLink href={branding.links.discordInvite} variant="discord" external>
            <DiscordMark />
            Ask the officers on Discord
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
