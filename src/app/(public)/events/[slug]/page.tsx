import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckSquare, ExternalLink, MapPin } from "lucide-react";
import { branding } from "@config/branding";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Breadcrumbs } from "@/components/ui/primitives";
import { Markdown } from "@/components/learn/markdown";
import { ResolvedImg } from "@/components/media/slot-image";
import { PageHero } from "@/components/site/page-hero";
import { getPublishedEventBySlug } from "@/server/services/events";
import { resolveAssetById } from "@/server/services/media";
import { formatEventRange, formatLongDate } from "@/lib/dates";
import { AUDIENCE_LABELS, type AudienceLevel } from "@/lib/enums";
import { lessonHrefFromKey, lessonTitleFromKey } from "@/server/services/content-links";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: `${formatEventRange(event.startsAt, event.endsAt)}${event.location ? ` · ${event.location}` : ""}`,
    alternates: { canonical: `/events/${event.slug}` },
  };
}

export default async function EventDetailPage(props: PageProps<"/events/[slug]">) {
  const { slug } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();
  const cover = event.coverAssetId ? await resolveAssetById(event.coverAssetId) : null;
  const cancelled = event.status === "cancelled";

  const related = event.relatedLessonKeys.map((key) => ({ key, href: lessonHrefFromKey(key), title: lessonTitleFromKey(key) })).filter((r) => r.href);

  return (
    <article>
      <PageHero
        variant="compact"
        before={<Breadcrumbs items={[{ label: "Events", href: "/events" }, { label: event.title }]} />}
        eyebrow={cancelled ? "Cancelled event" : "Event"}
        title={event.title}
      />
      <div className="container-x section grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {cancelled ? <Badge tone="danger">Cancelled</Badge> : null}
            <Badge tone={event.audienceLevel === "beginner" ? "cyan" : "brand"}>{AUDIENCE_LABELS[event.audienceLevel as AudienceLevel] ?? "All levels"}</Badge>
            {event.source === "pin" ? <Badge tone="muted">Synced from PIN</Badge> : null}
          </div>
          <dl className="mt-4 space-y-2 text-[0.95rem] text-ink">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-1 size-4 shrink-0 text-accent" aria-hidden />
              <dt className="sr-only">When</dt>
              <dd>
                <span className="font-medium text-navy-900">{formatLongDate(event.startsAt)}</span>
                <br />
                {formatEventRange(event.startsAt, event.endsAt)} <span className="text-muted">· Eastern time ({event.timezone})</span>
              </dd>
            </div>
            {event.location ? (
              <div className="flex items-start gap-2">
                <MapPin className="mt-1 size-4 shrink-0 text-accent" aria-hidden />
                <dt className="sr-only">Where</dt>
                <dd>
                  {event.locationUrl ? (
                    <a href={event.locationUrl} className="text-brand-700 underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                      {event.location}
                    </a>
                  ) : (
                    event.location
                  )}
                </dd>
              </div>
            ) : null}
          </dl>
          {cover ? (
            <div className="mt-6 overflow-hidden rounded-2xl">
              <ResolvedImg image={cover} sizes="(min-width: 1024px) 60vw, 100vw" className="aspect-[3/2]" />
            </div>
          ) : event.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.coverImageUrl} alt="" className="mt-6 aspect-[3/2] w-full rounded-2xl object-cover" loading="lazy" />
          ) : null}
          {event.description ? <Markdown content={event.description} className="mt-6" /> : null}

          {event.followUp ? (
            <section className="mt-10 rounded-2xl border border-line bg-pale p-6" aria-labelledby="follow-up">
              <h2 id="follow-up" className="font-display text-xl font-bold text-navy-900">
                Follow-up materials
              </h2>
              <Markdown content={event.followUp} className="mt-3" />
            </section>
          ) : null}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            {event.pinUrl ? (
              <>
                <ButtonLink href={event.pinUrl} className="w-full" external>
                  {cancelled ? "View on PIN" : "RSVP on PIN"} <ExternalLink className="size-4" aria-hidden />
                </ButtonLink>
                <p className="mt-2 text-xs text-muted">PIN is the official RSVP and attendance record.</p>
              </>
            ) : (
              <p className="text-sm text-muted">No RSVP is required. Just show up.</p>
            )}
          </div>
          {event.whatToBring ? (
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-navy-900">What to bring</h2>
              <Markdown content={event.whatToBring} compact className="mt-2" />
            </div>
          ) : null}
          {event.prepChecklistItems.length ? (
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-navy-900">Before you come</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {event.prepChecklistItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckSquare className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {related.length ? (
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-navy-900">Related lessons</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {related.map((r) => (
                  <li key={r.key}>
                    <Link href={r.href!} className="font-medium text-brand-700 hover:underline">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-xs text-muted">
            Questions? Ask on{" "}
            <a href={branding.links.discordInvite} className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">
              Discord
            </a>
            .
          </p>
        </aside>
      </div>
    </article>
  );
}
