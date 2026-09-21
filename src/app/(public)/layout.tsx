import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { StarField } from "@/components/marketing/star-field";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* The homepage sky continues behind every page. */}
      <div className="signal-backdrop" aria-hidden="true">
        <StarField className="signal-backdrop-stars" sky="page" />
      </div>
      <SiteHeader />
      <main id="main" className="relative flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
