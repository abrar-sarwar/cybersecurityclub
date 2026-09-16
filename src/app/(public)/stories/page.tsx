import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { branding } from "@config/branding";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, SectionHeading } from "@/components/ui/primitives";
import { StoryCard } from "@/components/marketing/sections";
import { listPublishedStories } from "@/server/services/people";

export const metadata: Metadata = {
  title: "Member Stories",
  description: "Verified stories from members and alumni about internships and projects, shared with permission.",
  alternates: { canonical: "/stories" },
};

export const dynamic = "force-dynamic";

export default async function StoriesPage() {
  const stories = await listPublishedStories();
  return (
    <>
      <section className="container-x pt-14 pb-8 sm:pt-20">
        <SectionHeading as="h1" eyebrow="Member experiences" title="Where our members have worked" description="Every story here was written or approved by the member it is about, with the organization name confirmed. Employers listed are places members have worked, not sponsors." />
      </section>
      <section className="container-x pb-16">
        {stories.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<MessageCircle className="size-5" aria-hidden />}
            title="Stories are being collected"
            description="If you interned, shipped a project, or competed and want to share how it went, we would love to publish it in your words. We will confirm the details with you and ask for permission before anything goes live."
            action={
              <ButtonLink href={`mailto:${branding.contact.email}?subject=${encodeURIComponent("Member story for the club website")}`} variant="secondary" external>
                Share your story
              </ButtonLink>
            }
          />
        )}
        <div className="mt-12 rounded-2xl border border-line bg-pale p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-navy-900">Want to add yours?</h2>
          <p className="mt-2 max-w-2xl text-[0.95rem] leading-6 text-muted">
            We publish a story only after collecting the member’s name, preferred photo, role or internship title, confirmed organization name, dates, a short summary, how the club helped (if it did), an optional professional link, and explicit permission to publish.
          </p>
        </div>
      </section>
    </>
  );
}
