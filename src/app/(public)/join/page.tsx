import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { branding } from "@config/branding";
import { JoinSteps } from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/primitives";
import { Figure } from "@/components/media/slot-image";
import { PageHero } from "@/components/site/page-hero";
import { resolveSingle } from "@/server/services/media";
import { safeDb } from "@/server/safe-db";

export const metadata: Metadata = {
  title: "How to Join",
  description: `How to get involved with the ${branding.displayName}: join Discord, find the club on PIN, and come to an event.`,
  alternates: { canonical: "/join" },
};

// Reads the page photo from the media records on each request.
export const dynamic = "force-dynamic";

const faq = [
  { q: "Do I need experience?", a: "No. Many members start with zero background. Meetings explain terms as they come up and there is always someone to ask." },
  { q: "Is there a cost?", a: "No dues. Some competitions or certification exams have their own fees, which are always optional." },
  { q: "I am not a computer science major. Can I join?", a: "Yes. Security needs people from every field, and the club is open to any enrolled GSU student." },
  { q: "Do I need to create an account on this website?", a: "No. This website has no accounts. Club conversations happen on Discord, and event RSVPs go through each event’s PIN page." },
];

export default async function JoinPage() {
  const image = await safeDb(() => resolveSingle("join.photo"), null, "join photo");
  return (
    <>
      <PageHero
        eyebrow="Join the club"
        title="You are welcome here."
        description={
          <>
            Getting involved is simple: say hello on Discord, find the club on PIN, and come to an event. No website account needed. Not sure which part of cybersecurity interests you?{" "}
            <Link href="/careers" className="font-semibold text-brand-700 underline underline-offset-4">
              Explore career paths
            </Link>
            .
          </>
        }
      >
        <ButtonLink href={branding.links.discordInvite} size="lg" external>
          Join Discord
        </ButtonLink>
        <ButtonLink href="/events" variant="outline" size="lg">
          View Events
        </ButtonLink>
      </PageHero>

      {image ? (
        <section className="container-x pt-14" aria-label="Club photo">
          <Figure image={image} sizes="(min-width: 1024px) 80vw, 100vw" frameClassName="aspect-[21/9]" />
        </section>
      ) : null}

      <JoinSteps />

      <section className="surface-pale border-t border-line section" aria-labelledby="faq">
        <div className="container-x grid gap-8 lg:grid-cols-[0.6fr_1.4fr]">
          <div>
            <SectionHeading id="faq" eyebrow="Questions" title="Good to know" />
            <p className="mt-3 text-muted">
              Anything else? Ask on Discord or email{" "}
              <a href={`mailto:${branding.contact.email}`} className="text-brand-700 underline underline-offset-2">
                {branding.contact.email}
              </a>
              .
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {faq.map((f) => (
              <div key={f.q} className="card p-5">
                <dt className="flex items-start gap-2 font-semibold text-navy-900">
                  <HelpCircle className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  {f.q}
                </dt>
                <dd className="mt-2 text-sm leading-6 text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
