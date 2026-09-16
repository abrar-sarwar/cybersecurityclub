import type { Metadata } from "next";
import { branding } from "@config/branding";
import { JoinSteps } from "@/components/marketing/sections";
import { ObservatoryHero, ObservatoryEvent, ObservatoryCommunity, ObservatoryProjects, ObservatoryLearning, ObservatoryNews, ObservatorySpotlight } from "@/components/marketing/observatory-sections";
import { ObservatoryMotion, EmployerStrip } from "@/components/marketing/observatory-motion";
import { loadObservatory } from "@/content/observatory";
import { safeLoad } from "@/content/safe";
import { resolveSingle, resolveSlot } from "@/server/services/media";
import { nextPublishedEvent } from "@/server/services/events";
import { listPublishedStories } from "@/server/services/people";

export const metadata: Metadata = {
  title: `${branding.displayName} · Your people. A bigger world.`,
  description: branding.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [hero, gallery, event, stories, feature, workshop] = await Promise.all([
    resolveSingle("home.hero"),
    resolveSlot("home.communityGallery"),
    nextPublishedEvent(),
    listPublishedStories(),
    resolveSingle("home.communityFeature"),
    resolveSingle("home.workshopPhoto"),
  ]);
  const content = safeLoad(loadObservatory, { employers: [], projects: [], news: [] });
  const employers = content.employers.filter((company) => company.confirmed).map((company) => company.name);
  const photos = feature ? [feature, ...(workshop ? [workshop] : gallery.slice(0, 1))] : gallery.length ? gallery : hero ? [hero] : [];

  return (
    <ObservatoryMotion>
      <ObservatoryHero />
      <EmployerStrip companies={employers} />
      <ObservatoryEvent event={event && !event.isSample ? event : null} />
      <ObservatoryCommunity images={photos} />
      <ObservatoryProjects projects={content.projects} />
      <ObservatoryLearning />
      <ObservatoryNews news={content.news} today={new Date().toISOString().slice(0, 10)} />
      <ObservatorySpotlight stories={stories} />
      <JoinSteps />
    </ObservatoryMotion>
  );
}
