import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { PendingContent } from "@/components/site/pending-content";

export const metadata: Metadata = {
  title: "Resources",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  return (
    <>
      <PageHero eyebrow="Resources" title="Resources" />
      <section className="section">
        <div className="container-x">
          <PendingContent what="Goes here: curated resources, Security+ study material and CTF tools." />
        </div>
      </section>
    </>
  );
}
