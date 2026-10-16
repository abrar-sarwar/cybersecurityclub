import Link from "next/link";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { Logo } from "@/components/brand/logo";
import { StarField } from "@/components/marketing/star-field";
import { PUBLIC_NAV } from "@/components/layout/nav-config";

/* Brand marks are inlined: lucide dropped its brand icon set. */
function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

const columns = [
  {
    title: "Explore",
    links: PUBLIC_NAV.map((item) => ({ href: item.href, label: item.label, external: false })),
  },
  {
    title: "Connect",
    links: [{ href: branding.links.pinOrganization, label: "PIN (official org page)", external: true }],
  },
];

/** Social accounts, shown as icons rather than another list of links. Each tile wears its brand's colors. */
const SOCIALS = [
  { href: branding.links.discordInvite, label: "Discord", icon: DiscordMark, className: "is-discord" },
  { href: branding.links.instagram, label: "Instagram", icon: InstagramMark, className: "is-instagram" },
  { href: branding.links.linkedin, label: "LinkedIn", icon: LinkedinMark, className: "is-linkedin" },
];

/** The footer sits on the same planet horizon that closes the homepage. */
export function SiteFooter() {
  return (
    <footer className="signal-footer" role="contentinfo">
      <div className="signal-footer-planet" aria-hidden="true">
        <StarField className="signal-footer-stars" sky="page" />
      </div>
      <div className="container-x signal-footer-inner">
        <div className="signal-footer-brand">
          <Logo size="sm" />
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="signal-footer-column">
            <h2>{col.title}</h2>
            <ul>
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  {"external" in l && l.external ? (
                    <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                      {l.label}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  ) : (
                    <Link href={l.href}>{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
            {col.title === "Connect" ? (
              <ul className="signal-footer-socials">
                {SOCIALS.map((social) => (
                  <li key={social.label}>
                    <a href={social.href} className={social.className} target="_blank" rel="noopener noreferrer" aria-label={`${social.label} (opens in a new tab)`}>
                      <social.icon />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </nav>
        ))}
      </div>
      <div className="container-x signal-footer-bottom">
        <p>
          © {new Date().getFullYear()} {branding.displayName}. A registered student organization at {branding.universityName}. This site is run by students and is
          not an official university website.
        </p>
        <p className="signal-footer-fine">
          <Link href="/privacy">Privacy</Link>
          <Link href="/accessibility">Accessibility</Link>
          <span>
            Accessibility issue? <a href={`mailto:${branding.contact.accessibilityEmail}`}>Tell us</a>.
          </span>
        </p>
      </div>
    </footer>
  );
}
