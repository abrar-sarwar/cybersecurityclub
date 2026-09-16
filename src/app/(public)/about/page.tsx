import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { branding } from "@config/branding";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/primitives";
import { Figure, PhotoPlaceholder } from "@/components/media/slot-image";
import { resolveSingle } from "@/server/services/media";
import { getViewer } from "@/server/session";

export const metadata: Metadata = {
  title: "About",
  description: `What the ${branding.displayName} does, who it is for, and how meetings work.`,
  alternates: { canonical: "/about" },
};

const values = [
  { title: "Beginners are welcome, and we mean it", body: "Most members arrived without a security background. Sessions explain terms as they come up, and questions are never a bad look." },
  { title: "Learn by doing", body: "Workshops and projects use isolated practice environments, sample data and intentionally vulnerable apps so you can experiment safely and legally." },
  { title: "Honest about the field", body: "We talk plainly about what jobs actually involve, what certifications do and do not do, and how to describe your experience without overselling it." },
  { title: "Community first", body: "The best thing about the club is the people. Study groups, competition teams and project partners usually start as a conversation on Discord." },
];

export default async function AboutPage() {
  const [image, viewer] = await Promise.all([resolveSingle("about.hero"), getViewer()]);
  return (
    <>
      <section className="container-x pt-14 pb-10 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <SectionHeading as="h1" eyebrow="About the club" title="A student community for learning cybersecurity together" description={`${branding.displayName} is a registered student organization at ${branding.universityName}. We meet regularly on the Atlanta campus to learn tools and techniques, work on projects, practice for competitions, and prepare for internships and jobs in the field.`} />
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/join">Join the Club</ButtonLink>
              <ButtonLink href={branding.links.pinOrganization} variant="outline" external>
                Official page on PIN
              </ButtonLink>
            </div>
          </div>
          {image ? <Figure image={image} sizes="(min-width: 1024px) 45vw, 100vw" frameClassName="aspect-[3/2]" /> : viewer?.isOfficer ? <PhotoPlaceholder ratioClassName="aspect-[3/2]" label="Add an approved photo through the media manifest" /> : null}
        </div>
      </section>

      <section className="surface-pale border-y border-line section" aria-labelledby="values">
        <div className="container-x">
          <SectionHeading eyebrow="How we work" title="What to expect" />
          <ul className="mt-8 grid gap-5 md:grid-cols-2">
            {values.map((v) => (
              <li key={v.title} className="card flex gap-4 p-6">
                <CheckCircle2 className="mt-1 size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <h3 className="font-display text-lg font-bold text-navy-900">{v.title}</h3>
                  <p className="mt-1.5 text-[0.95rem] leading-6 text-muted">{v.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="meetings">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Meetings" title="Where and when" description="Meeting times and rooms change each semester. The Events page and PIN always have the current schedule, and Discord gets the reminders." />
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
                <dd className="text-muted">Any GSU student, from any major. Alumni stay involved through the member platform and Discord.</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 font-semibold text-navy-900">Contact</dt>
                <dd className="text-muted">
                  <a href={`mailto:${branding.contact.email}`} className="text-brand-700 underline underline-offset-2">
                    {branding.contact.email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
          <div className="card p-6 sm:p-8">
            <h3 className="font-display text-xl font-bold text-navy-900">What the member platform adds</h3>
            <ul className="mt-4 space-y-2.5 text-[0.95rem] text-ink">
              {[
                "A questionnaire that suggests cybersecurity paths with plain-language reasons",
                "Complete paths for security operations & incident response, IAM, and application security",
                "Projects with completion criteria you can put in a portfolio",
                "A home-lab setup wizard that adapts to your computer",
                "Network+ and Security+ study tracks with original practice questions",
                "Interview preparation tied to work you actually completed",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-cyan-700" aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <ButtonLink href="/learn" variant="secondary" className="mt-6">
              Preview the catalog
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
