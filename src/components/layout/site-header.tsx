import { branding } from "@config/branding";
import { Logo } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { HEADER_ACTIONS, PUBLIC_NAV } from "@/components/layout/nav-config";
import { NavLinks } from "@/components/layout/nav-links";
import { QuizLink } from "@/components/careers/quiz-link";

export function SiteHeader() {
  const primary = HEADER_ACTIONS.primary;
  const discord = { href: branding.links.discordInvite, label: HEADER_ACTIONS.discord.label, external: true };

  return (
    <header className="site-header signal-header">
      <div className="container-x signal-header-inner">
        <Logo />
        <nav className="signal-header-nav" aria-label="Site">
          <NavLinks items={[...PUBLIC_NAV]} />
        </nav>
        <div className="signal-header-actions">
          <a href={discord.href} target="_blank" rel="noopener noreferrer" className="btn-cyber btn-cyber-outline btn-cyber-sm">
            {discord.label}
          </a>
          <QuizLink className="btn-cyber btn-cyber-primary btn-cyber-sm">{primary.label}</QuizLink>
        </div>
        <div className="signal-header-mobile">
          <QuizLink className="btn-cyber btn-cyber-primary btn-cyber-sm signal-header-mobile-cta">{primary.label}</QuizLink>
          <MobileNav items={[...PUBLIC_NAV]} actions={[primary, discord]} brandLabel={branding.shortName} />
        </div>
      </div>
    </header>
  );
}
