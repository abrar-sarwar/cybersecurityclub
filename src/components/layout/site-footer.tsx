import Link from "next/link";
import { branding } from "@config/branding";
import { Logo } from "@/components/brand/logo";

const columns = [
  {
    title: "Club",
    links: [
      { href: "/about", label: "About" },
      { href: "/community", label: "Community & leadership" },
      { href: "/events", label: "Events" },
      { href: "/stories", label: "Member stories" },
      { href: "/join", label: "Join the club" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/learn", label: "Learning paths" },
      { href: "/learn#projects", label: "Projects" },
      { href: "/learn#home-lab", label: "Home lab guide" },
      { href: "/learn#certifications", label: "Network+ and Security+" },
      { href: "/learn#interview-prep", label: "Interview preparation" },
    ],
  },
  {
    title: "Connect",
    links: [
      { href: branding.links.discordInvite, label: "Discord", external: true },
      { href: branding.links.instagram, label: "Instagram", external: true },
      { href: branding.links.linkedin, label: "LinkedIn", external: true },
      { href: branding.links.pinOrganization, label: "PIN (official org page)", external: true },
      { href: `mailto:${branding.contact.email}`, label: "Email the officers", external: true },
    ],
  },
  {
    title: "Site",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/accessibility", label: "Accessibility" },
      { href: "/join#sign-in", label: "Member sign in" },
      { href: "/privacy#your-data", label: "Data requests" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-pale" role="contentinfo">
      <div className="container-x py-12 lg:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:gap-8">
          <div className="col-span-2 max-w-sm lg:col-span-1">
            <Logo size="sm" />
            <p className="mt-4 text-sm leading-6 text-muted">{branding.description}</p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-900">{col.title}</h2>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    {"external" in l && l.external ? (
                      <a
                        href={l.href}
                        className="text-sm text-ink hover:text-brand-700"
                        target={l.href.startsWith("http") ? "_blank" : undefined}
                        rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="text-sm text-ink hover:text-brand-700">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {branding.displayName}. A registered student organization at {branding.universityName}. This site is run by
            students and is not an official university website.
          </p>
          <p>
            Accessibility issue?{" "}
            <a href={`mailto:${branding.contact.accessibilityEmail}`} className="underline underline-offset-2 hover:text-brand-700">
              Tell us
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
