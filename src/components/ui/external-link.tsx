import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A link that leaves the site: opens in a new tab and is marked with an arrow. */
export function ExternalLink({ href, children, className, arrow = true }: { href: string; children: ReactNode; className?: string; arrow?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn("external-link", className)}>
      {children}
      {arrow ? (
        <span aria-hidden="true" className="external-link-arrow">
          {" "}
          ↗
        </span>
      ) : null}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
