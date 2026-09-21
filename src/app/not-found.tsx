import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StarField } from "@/components/marketing/star-field";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <div className="signal-backdrop" aria-hidden="true">
        <StarField className="signal-backdrop-stars" sky="page" />
      </div>
      <SiteHeader />
      <main id="main" className="relative flex-1">
        <PageHero
          eyebrow="Error 404"
          title="This page lost its signal"
          description="The address may be mistyped, or the page may have moved. Everything on this site is public, so there is nothing to sign in to."
        >
          <ButtonLink href="/" size="lg">
            Back to home
          </ButtonLink>
          <ButtonLink href="/careers" variant="outline" size="lg">
            Explore Career Paths
          </ButtonLink>
        </PageHero>
      </main>
      <SiteFooter />
    </>
  );
}
