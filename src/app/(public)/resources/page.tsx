import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { ResourceMap } from "@/components/resources/resource-map";
import { GUIDES, GUIDE_GROUPS, GUIDE_LINKS } from "@/content/resources";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Short guides from the club on certifications, security tools, Linux, capture the flag, web security, SOC practice, home labs and interviews, each with a video to follow and links that were checked by hand.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  // The map only needs what it prints, so the guide bodies stay on the server.
  const nodes = GUIDES.map(({ slug, title, card, group }) => ({ slug, title, card, group }));

  return (
    <>
      <PageHero
        eyebrow="Guides"
        title="Resources"
        description="Short guides for certifications, hands-on skills and interviews. Each one has a video to follow and links worth your time."
      />

      <section className="container-x section" aria-labelledby="map-heading">
        <div className="max-w-2xl">
          <h2 id="map-heading" className="signal-section-title">
            Start anywhere
          </h2>
          <p className="careers-prose">Each guide is wired to the ones it leads into. Point at one to see where it goes.</p>
        </div>
        <ResourceMap nodes={nodes} links={GUIDE_LINKS} groups={GUIDE_GROUPS} />
      </section>
    </>
  );
}
