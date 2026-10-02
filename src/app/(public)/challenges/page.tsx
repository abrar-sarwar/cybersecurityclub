import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { PendingContent } from "@/components/site/pending-content";

export const metadata: Metadata = {
  title: "Challenges & Competitions",
  alternates: { canonical: "/challenges" },
};

export default function ChallengesPage() {
  return (
    <>
      <PageHero eyebrow="Challenges" title="Challenges & Competitions" />
      <section className="section">
        <div className="container-x">
          <PendingContent what="Goes here: the competitive team application, CyLabs and Hack The Box." />
        </div>
      </section>
    </>
  );
}
