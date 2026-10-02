import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/primitives";
import { ExternalLink } from "@/components/ui/external-link";
import { TOOL_TAG_LABELS, type Tool, type ToolTag } from "@/content/club/resources";

const linkClass = "font-semibold text-navy-900 underline decoration-line-strong underline-offset-4 hover:text-brand-700";

/** Site paths use the router; everything else opens in a new tab with an arrow. */
export function ResourceAnchor({ url, children }: { url: string; children: ReactNode }) {
  return url.startsWith("/") ? (
    <Link href={url} className={linkClass}>
      {children}
    </Link>
  ) : (
    <ExternalLink href={url} className={linkClass}>
      {children}
    </ExternalLink>
  );
}

export function JumpNav({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="On this page" className="border-y border-line bg-surface">
      <ul className="container-x flex flex-wrap gap-x-6 gap-y-1 py-3 font-mono text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="inline-flex min-h-9 items-center text-muted hover:text-navy-900">
              <span aria-hidden="true" className="mr-1 text-brand-700">
                #
              </span>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const tagTones: Record<ToolTag, "success" | "warning" | "cyan" | "muted"> = {
  beginner: "success",
  install: "warning",
  browser: "cyan",
  cli: "muted",
};

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <li className="card flex flex-col gap-2 p-4">
      <h4 className="text-base">
        <ResourceAnchor url={tool.url}>{tool.name}</ResourceAnchor>
      </h4>
      <p className="text-sm leading-6 text-muted">{tool.description}</p>
      {tool.tags?.length ? (
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-1" aria-label="Tags">
          {tool.tags.map((tag) => (
            <li key={tag}>
              <Badge tone={tagTones[tag]}>{TOOL_TAG_LABELS[tag]}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
