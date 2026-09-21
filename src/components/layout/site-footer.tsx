import Link from "next/link";
import { branding } from "@config/branding";
import { Logo } from "@/components/brand/logo";
import { StarField } from "@/components/marketing/star-field";

/* Brand marks are inlined: lucide dropped its brand icon set. */
function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.79.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.32.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .79.009c.12.099.246.198.373.292a.077.077 0 0 1-.6.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.41.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .84.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

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
    title: "Club",
    links: [
      { href: "/about", label: "About" },
      { href: "/team", label: "Team and exec board" },
      { href: "/events", label: "Events" },
      { href: "/stories", label: "Member stories" },
      { href: "/join", label: "How to join" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/careers", label: "Career paths" },
      { href: "/careers/quiz", label: "Find my path" },
      { href: "/careers/projects", label: "Project library" },
    ],
  },
  {
    title: "Connect",
    links: [{ href: branding.links.pinOrganization, label: "PIN (official org page)", external: true }],
  },
];

/** Social accounts, shown as icons rather than another list of links. */
const SOCIALS = [
  { href: branding.links.discordInvite, label: "Discord", icon: DiscordMark },
  { href: branding.links.instagram, label: "Instagram", icon: InstagramMark },
  { href: branding.links.linkedin, label: "LinkedIn", icon: LinkedinMark },
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
          <p>{branding.description}</p>
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
                    <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`${social.label} (opens in a new tab)`}>
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
