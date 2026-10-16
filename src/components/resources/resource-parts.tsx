import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink } from "@/components/ui/external-link";
import type { ResourceSection } from "@/content/club/resources";

const linkClass = "font-semibold text-navy-900 underline decoration-line-strong underline-offset-4 hover:text-brand-700";

/** Site paths use the router; everything else opens in a new tab with an arrow. */
export function ResourceAnchor({ url, children, className = linkClass }: { url: string; children: ReactNode; className?: string }) {
  return url.startsWith("/") ? (
    <Link href={url} className={className}>
      {children}
    </Link>
  ) : (
    <ExternalLink href={url} className={className}>
      {children}
    </ExternalLink>
  );
}

/** A wiki-style section: heading, one line of context, then name / description rows. */
export function WikiSection({ section, children }: { section: ResourceSection; children?: ReactNode }) {
  return (
    <section id={section.id} className="scroll-mt-6" aria-labelledby={`${section.id}-heading`}>
      <h2 id={`${section.id}-heading`} className="border-b border-line pb-2 font-display text-2xl font-bold text-navy-900">
        {section.title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">{section.intro}</p>
      {children}
      <ul className="mt-4 divide-y divide-line border-y border-line text-sm leading-6">
        {section.items.map((item) => (
          <li key={item.name} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
            <span className="flex flex-wrap items-baseline gap-2 sm:w-56 sm:shrink-0">
              <ResourceAnchor url={item.url}>{item.name}</ResourceAnchor>
              {item.note ? <span className="font-mono text-xs uppercase tracking-wider text-muted">{item.note}</span> : null}
            </span>
            <span className="text-muted">{item.description}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
