import { CalendarDays, Flag, MessageCircle } from "lucide-react";
import { branding } from "@config/branding";
import { ButtonLink } from "@/components/ui/button";
import { Badge, SectionHeading } from "@/components/ui/primitives";
import { ResolvedImg } from "@/components/media/slot-image";
import type { StoryView } from "@/server/services/people";

export function StoryCard({ story }: { story: StoryView }) {
  return (
    <li className="card flex flex-col p-6">
      <div className="flex items-center gap-4">
        {story.photo ? (
          <div className="size-14 shrink-0 overflow-hidden rounded-full bg-pale-2">
            <ResolvedImg image={story.photo} sizes="56px" />
          </div>
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-50 font-display text-lg font-bold text-brand-700" aria-hidden>
            {story.memberName
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-navy-900">
            {story.memberName}
            {story.isSample ? <Badge tone="warning" className="ml-2 align-middle">Sample</Badge> : null}
          </p>
          <p className="text-sm text-muted">
            {story.roleTitle} · {story.company}
            {story.dates ? ` · ${story.dates}` : ""}
          </p>
        </div>
      </div>
      <p className="mt-4 text-[0.95rem] leading-6 text-ink">{story.summary}</p>
      {story.contribution ? <p className="mt-3 text-sm leading-6 text-muted">How the club helped: {story.contribution}</p> : null}
      {story.profileUrl ? (
        <a href={story.profileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-semibold text-brand-700 hover:underline">
          Professional profile
        </a>
      ) : null}
    </li>
  );
}

export const JOIN_STEPS = [
  {
    icon: MessageCircle,
    title: "Join the Discord",
    body: "Announcements, questions and study groups live on Discord. Introduce yourself in the welcome channel.",
    cta: { label: "Open Discord invite", href: branding.links.discordInvite, external: true },
  },
  {
    icon: Flag,
    title: "Register on PIN",
    body: "Request to join through GSU’s official student organization portal and find club events.",
    cta: { label: "Club page on PIN", href: branding.links.pinOrganization, external: true },
  },
  {
    icon: CalendarDays,
    title: "Come to an event",
    body: "Meetings and workshops are listed on the Events page. RSVP through each event’s PIN page.",
    cta: { label: "View Events", href: "/events", external: false },
  },
];

export function JoinSteps({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  return (
    <section className="section join-section" aria-label="How to join">
      <div className="container-x">
        <SectionHeading eyebrow="Your next chapter" title="There’s a place for you here." as={headingLevel} description="Start with a hello on Discord, then come to a meeting. Everything here is public; there is no website account to create." />
        <ol className="join-steps">
          {JOIN_STEPS.map((s, i) => (
            <li key={s.title} className="join-step">
              <div className="flex items-center gap-3">
                <span className="step-number">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-navy-900">{s.title}</h3>
              <p className="mt-1.5 flex-1 text-[0.95rem] leading-6 text-muted">{s.body}</p>
              <ButtonLink href={s.cta.href} variant={i === 0 ? "primary" : "outline"} className="mt-5 self-start" external={s.cta.external}>
                {s.cta.label}
              </ButtonLink>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function stripMarkdown(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`~]/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

