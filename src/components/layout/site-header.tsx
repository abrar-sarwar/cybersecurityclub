import Link from "next/link";
import { branding } from "@config/branding";
import { Logo } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PUBLIC_NAV } from "@/components/layout/nav-config";
import { ButtonLink } from "@/components/ui/button";
import { getViewer } from "@/server/session";
import { NavLinks } from "@/components/layout/nav-links";

export async function SiteHeader() {
  const viewer = await getViewer();
  const primary = viewer
    ? { href: viewer.isApprovedMember || viewer.isOfficer ? "/dashboard" : "/pending", label: "Dashboard" }
    : { href: "/join", label: "Join the Club" };
  const secondary = viewer ? { href: "/account", label: "Account" } : { href: "/sign-in", label: "Sign in" };

  return (
    <header className="site-header sticky top-0 z-40 border-b border-line">
      <div className="container-x flex min-h-16 items-center justify-between gap-4 lg:min-h-20">
        <Logo />
        <nav className="hidden lg:block" aria-label="Site">
          <NavLinks items={[...PUBLIC_NAV]} />
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {viewer?.isOfficer ? (
            <ButtonLink href="/admin" variant="ghost" size="sm">
              Officer tools
            </ButtonLink>
          ) : null}
          <ButtonLink href={secondary.href} variant="ghost">
            {secondary.label}
          </ButtonLink>
          <ButtonLink href={primary.href} variant="primary">
            {primary.label}
          </ButtonLink>
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          {!viewer ? (
            <Link href="/join" className="hidden min-h-11 items-center rounded-md bg-brand-600 px-3.5 text-sm font-semibold text-white hover:bg-brand-500 sm:inline-flex">
              Join
            </Link>
          ) : null}
          <MobileNav
            items={[...PUBLIC_NAV, ...(viewer?.isOfficer ? [{ href: "/admin", label: "Officer tools" }] : [])]}
            primary={primary}
            secondary={secondary}
            brandLabel={branding.shortName}
          />
        </div>
      </div>
    </header>
  );
}
