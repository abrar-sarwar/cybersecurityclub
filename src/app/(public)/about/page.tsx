import type { Metadata } from "next";
import { branding } from "@config/branding";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/primitives";
import { NodeMark } from "@/components/site/node-mark";
import { PageHero } from "@/components/site/page-hero";
import { PhotoBackdrop } from "@/components/site/photo-backdrop";
import { ValueStack } from "@/components/site/value-stack";
import { AttackFeed } from "@/components/site/attack-feed";
import { Voices } from "@/components/site/voices";

export const metadata: Metadata = {
  title: "About",
  description: `What the ${branding.displayName} does, who it is for, and how meetings work.`,
  alternates: { canonical: "/about" },
};

// Reads the page photo from the media records on each request.
export const dynamic = "force-dynamic";

const values = [
  { title: "Beginners are welcome, and we mean it", body: "Most members arrived without a security background. Sessions explain terms as they come up, and questions are never a bad look." },
  { title: "Learn by doing", body: "Workshops and projects use isolated practice environments, sample data and intentionally vulnerable apps so you can experiment safely and legally." },
  { title: "Honest about the field", body: "We talk plainly about what jobs actually involve, what certifications do and do not do, and how to describe your experience without overselling it." },
  { title: "Community first", body: "The best thing about the club is the people. Study groups, competition teams and project partners usually start as a conversation on Discord." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About the club"
        title="A student community for learning cybersecurity together"
        description={`${branding.displayName} is a registered student organization at ${branding.universityName}. We meet regularly on the Atlanta campus to learn tools and techniques, work on projects, practice for competitions, and prepare for internships and jobs in the field.`}
        backdrop={<PhotoBackdrop />}
      >
        <ButtonLink href={branding.links.discordInvite} size="lg" external>
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
          <ButtonLink href={branding.links.discordInvite} variant="outline" external>
            Ask the officers on Discord
          </ButtonLink>
        </div>
      </section>

      <section className="section" aria-labelledby="meetings">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading id="meetings" eyebrow="Meetings" title="Where and when" description="Meeting times and rooms change each semester. The Events page and PIN always have the current schedule, and Discord gets the reminders." />
            <dl className="mt-6 space-y-3 text-[0.95rem]">
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 font-semibold text-navy-900">Campus</dt>
                <dd className="text-muted">{branding.contact.meetingLocation}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 font-semibold text-navy-900">Cost</dt>
                <dd className="text-muted">Free. No dues.</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 font-semibold text-navy-900">Who</dt>
                <dd className="text-muted">Any GSU student, from any major. Alumni stay involved through Discord.</dd>
              </div>
            </dl>
          </div>
          <div className="card p-6 sm:p-8">
            <h3 className="font-display text-xl font-bold text-navy-900">Explore cybersecurity careers</h3>
            <ul className="mt-4 space-y-2.5 text-[0.95rem] text-ink">
              {[
                "A twenty-question interest questionnaire, with no account or email required",
                "Twelve career paths explained in plain language",
                "A beginner project for every path, with guidance on turning it into a portfolio piece",
              ].map((t, index) => (
                <li key={t} className="flex gap-2.5">
                  <NodeMark index={index} className="mt-0.5 size-4" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/careers" variant="secondary">
                Explore Career Paths
              </ButtonLink>
              <ButtonLink href="/careers/projects" variant="ghost">
                Browse the project library
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
