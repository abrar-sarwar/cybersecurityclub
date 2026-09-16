import type { Metadata } from "next";
import { Users } from "lucide-react";
import { branding } from "@config/branding";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { Figure, PhotoPlaceholder, ResolvedImg } from "@/components/media/slot-image";
import { resolveSlot } from "@/server/services/media";
import { listPublishedLeadership, listPublicDirectory } from "@/server/services/people";
import { getViewer } from "@/server/session";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Community & Leadership",
  description: "Meet the officers, see the community, and find out how to get involved.",
  alternates: { canonical: "/community" },
};

export default async function CommunityPage() {
  const [leaders, gallery, directory, viewer] = await Promise.all([listPublishedLeadership(), resolveSlot("community.gallery"), listPublicDirectory(), getViewer()]);

  return (
    <>
      <section className="container-x pt-14 pb-6 sm:pt-20">
        <SectionHeading as="h1" eyebrow="Community & leadership" title="The people behind the club" description="Officers are students who volunteer their time to run meetings, plan workshops and keep the community welcoming. They are easiest to reach on Discord." />
      </section>

      <section className="container-x pb-14" aria-labelledby="officers">
        <h2 id="officers" className="font-display text-2xl font-bold text-navy-900">
          Officers
        </h2>
        {leaders.length ? (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {leaders.map((l) => (
              <li key={l.id} className="card overflow-hidden">
                <div className="aspect-[4/5] bg-pale-2">
                  {l.portrait ? (
                    <ResolvedImg image={l.portrait} sizes="(min-width: 1024px) 25vw, 50vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-4xl font-bold text-brand-300" aria-hidden>
                      {l.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="font-display text-lg font-bold text-navy-900">
                    {l.name}
                    {l.isSample ? <Badge tone="warning" className="ml-2 align-middle">Sample</Badge> : null}
                  </p>
                  <p className="text-sm font-medium text-brand-700">{l.roleTitle}</p>
                  {l.termLabel ? <p className="text-xs text-muted">{l.termLabel}</p> : null}
                  {l.bio ? <p className="mt-2 text-sm leading-6 text-muted">{l.bio}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    {l.contactEmail ? (
                      <a href={`mailto:${l.contactEmail}`} className="font-semibold text-brand-700 hover:underline">
                        Email
                      </a>
                    ) : null}
                    {l.linkedinUrl ? (
                      <a href={l.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">
                        LinkedIn
                      </a>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            className="mt-6"
            icon={<Users className="size-5" aria-hidden />}
            title="Officer profiles are not published yet"
            description={
              viewer?.isOfficer ? (
                <>
                  Add profiles under Officer tools → Leadership, then publish them.
                </>
              ) : (
                <>Until then, reach the officers on Discord or at {branding.contact.email}.</>
              )
            }
            action={viewer?.isOfficer ? <ButtonLink href="/admin/leadership" variant="secondary">Manage leadership profiles</ButtonLink> : <ButtonLink href={branding.links.discordInvite} variant="secondary" external>Join the Discord</ButtonLink>}
          />
        )}
      </section>

      <section className="surface-pale border-y border-line section" aria-labelledby="gallery">
        <div className="container-x">
          <SectionHeading eyebrow="Photos" title="Around the club" />
          {gallery.length ? (
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {gallery.map((img, i) => (
                <li key={img.id} className={cn(i % 5 === 0 && "col-span-2 lg:col-span-2")}>
                  <Figure image={img} sizes="(min-width: 1024px) 33vw, 50vw" frameClassName={cn(i % 5 === 0 ? "aspect-[2/1]" : "aspect-[3/2]")} />
                </li>
              ))}
            </ul>
          ) : viewer?.isOfficer ? (
            <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
              <PhotoPlaceholder className="col-span-2" ratioClassName="aspect-[2/1]" label="Officers: add photos to the “Community page gallery” slot" />
              <PhotoPlaceholder ratioClassName="aspect-[3/2]" />
              <PhotoPlaceholder ratioClassName="aspect-[3/2]" />
              <PhotoPlaceholder ratioClassName="aspect-[3/2]" />
              <PhotoPlaceholder ratioClassName="aspect-[3/2]" />
            </div>
          ) : (
            <p className="mt-6 text-muted">Photos from recent meetings will appear here. Follow the club on Instagram in the meantime.</p>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="directory">
        <div className="container-x">
          <SectionHeading eyebrow="Members who opted in" title="Member directory" description="Members can choose to list a name and a short headline here. Nothing is listed without opting in from the account page, and email addresses are never shown." />
          {directory.length ? (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {directory.map((m) => (
                <li key={m.id} className="card p-5">
                  <p className="font-semibold text-navy-900">{m.displayName || m.user.name}</p>
                  {m.publicHeadline ? <p className="mt-1 text-sm text-muted">{m.publicHeadline}</p> : null}
                  <div className="mt-2 flex items-center gap-2">
                    {m.educationStatus === "confirmed_alumni" ? <Badge tone="cyan">Alumni</Badge> : <Badge tone="muted">Student</Badge>}
                    {m.linkedinUrl ? (
                      <a href={m.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-700 hover:underline">
                        LinkedIn
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-muted">No one has opted in yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
