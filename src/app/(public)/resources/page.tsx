import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, Network, ShieldCheck, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { PageHero } from "@/components/site/page-hero";
import { GUIDES } from "@/content/careers/guides";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Short guides from the club: a 30-day Security+ routine, a Network+ study plan and a first home lab, each with a video to follow and links that were checked by hand.",
  alternates: { canonical: "/resources" },
};

const GUIDE_ICONS: Record<string, LucideIcon> = {
  "security-plus": ShieldCheck,
  "network-plus": Network,
  "home-lab": FlaskConical,
};

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Guides"
        title="Resources"
        description="Short guides for the two certifications members ask about most, and for building a first home lab. Each one has a video to follow and links worth your time."
      />

      <section className="container-x section" aria-labelledby="guides-heading">
        <div className="max-w-2xl">
          <h2 id="guides-heading" className="signal-section-title">
            Study and setup guides
          </h2>
          <p className="careers-prose">
            Certifications are a useful foundation during college. They are not required for every role and do not guarantee a job, so pair one with a project you can show.
          </p>
        </div>
        <ul className="guide-cards">
          {GUIDES.map((guide) => {
            const Icon = GUIDE_ICONS[guide.slug] ?? FlaskConical;
            return (
              <li key={guide.slug} className="card guide-card p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-accent">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <Badge tone="muted">{guide.facts[0].value}</Badge>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-navy-900">
                  <Link href={`/resources/${guide.slug}`} className="guide-card-link">
                    {guide.title}
                  </Link>
                </h3>
                <p className="mt-2 text-[0.95rem] leading-6 text-muted">{guide.card}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
