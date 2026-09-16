import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { branding } from "@config/branding";
import { JoinSteps } from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { Figure, PhotoPlaceholder } from "@/components/media/slot-image";
import { resolveSingle } from "@/server/services/media";
import { getViewer } from "@/server/session";

export const metadata: Metadata = {
  title: "Join the Club",
  description: "How to join the Cybersecurity Club at GSU: Discord, PIN registration, and your member account.",
  alternates: { canonical: "/join" },
};

const faq = [
  { q: "Do I need experience?", a: "No. Many members start with zero background. Meetings explain terms as they come up and there is always someone to ask." },
  { q: "Is there a cost?", a: "No dues. Some competitions or certification exams have their own fees, which are always optional." },
  { q: "I am not a computer science major. Can I join?", a: "Yes. Security needs people from every field, and the club is open to any enrolled GSU student." },
  { q: "Why do you need both a personal and a GSU email?", a: "Your GSU email verifies you are a current student. Your personal email keeps your account working after graduation so alumni can stay involved." },
  { q: "How long does approval take?", a: "Officers check new accounts against the club roster and Discord, usually within a few days. You will see a clear status on your dashboard." },
  { q: "I graduated. Can I still use the platform?", a: "Yes. Confirmed alumni keep their approved access. Register with the alumni option or sign in with your existing account." },
];

export default async function JoinPage() {
  const [image, viewer] = await Promise.all([resolveSingle("join.photo"), getViewer()]);
  return (
    <>
      <section className="container-x pt-14 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-xl">
            <p className="eyebrow mb-3">Join the club</p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-navy-900 sm:text-5xl">You are welcome here.</h1>
            <p className="mt-4 text-lg leading-8 text-muted">
              Joining takes a few minutes: hop into Discord, register on PIN, and create your site account. Officers approve accounts against the club records, and then the learning platform opens up.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/sign-up" size="lg">
                Create your account
              </ButtonLink>
              <ButtonLink href={branding.links.discordInvite} variant="outline" size="lg" external>
                Join the Discord
              </ButtonLink>
            </div>
          </div>
          {image ? <Figure image={image} sizes="(min-width: 1024px) 45vw, 100vw" frameClassName="aspect-[4/3]" /> : viewer?.isOfficer ? <PhotoPlaceholder ratioClassName="aspect-[4/3]" label="Add an approved photo through the media manifest" /> : null}
        </div>
      </section>

      <JoinSteps />

      <section className="surface-pale border-t border-line section" aria-labelledby="faq">
        <div className="container-x grid gap-8 lg:grid-cols-[0.6fr_1.4fr]">
          <div>
            <p className="eyebrow mb-2">Questions</p>
            <h2 id="faq" className="font-display text-3xl font-bold text-navy-900">
              Good to know
            </h2>
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
