import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { Logo } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { HEADER_ACTIONS, PUBLIC_NAV } from "@/components/layout/nav-config";
import { NavLinks } from "@/components/layout/nav-links";

export function SiteHeader() {
  const discord = { href: branding.links.discordInvite, label: HEADER_ACTIONS.discord.label, icon: <DiscordMark />, external: true, variant: "discord" as const };

  return (
    <header className="site-header signal-header">
      <div className="container-x signal-header-inner">
        <Logo />
        <nav className="signal-header-nav" aria-label="Site">
          <NavLinks items={[...PUBLIC_NAV]} />
        </nav>
        <div className="signal-header-actions">
          <a href={discord.href} target="_blank" rel="noopener noreferrer" className="btn-cyber btn-cyber-discord btn-cyber-sm">
            {discord.icon}
            {discord.label}
          </a>
        </div>
        <div className="signal-header-mobile">
          <a
            href={discord.href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cyber btn-cyber-discord btn-cyber-sm signal-header-mobile-cta"
          >
            {discord.icon}
            {discord.label}
          </a>
          <MobileNav items={[...PUBLIC_NAV]} actions={[discord]} brandLabel={branding.shortName} />
        </div>
      </div>
    </header>
  );
}
