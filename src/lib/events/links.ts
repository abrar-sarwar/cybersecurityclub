/**
 * Materials for an event (slides, repositories, recordings, labs). Officers
 * type them one per line as `Label | https://link`; the table stores them as a
 * JSON array. Both forms go through the same rules here.
 */
import type { EventLink } from "./event";
import { cleanText } from "./text";
import { isSafeHttpsUrl } from "./urls";

export const LINK_LIMITS = { count: 10, label: 80 } as const;

type Parsed = { links: EventLink[]; problems: string[] };

function labelFor(label: string, href: string): string {
  const clean = cleanText(label).replace(/\|/g, "/");
  if (clean) return clean;
  return new URL(href).hostname.replace(/^www\./, "");
}

/** `Label | https://…`, `Label https://…` or a bare link: the last token is the link. */
function splitLine(line: string): { label: string; href: string } {
  const bar = line.lastIndexOf("|");
  if (bar !== -1) return { label: line.slice(0, bar), href: line.slice(bar + 1).trim() };
  const space = line.lastIndexOf(" ");
  if (space === -1) return { label: "", href: line.trim() };
  return { label: line.slice(0, space), href: line.slice(space + 1).trim() };
}

function candidates(value: unknown): { label: string; href: string; shown: string }[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const label = typeof o.label === "string" ? o.label : "";
      const href = typeof o.href === "string" ? o.href : "";
      return { label, href, shown: label || href || String(item) };
    });
  }
  return cleanText(value, true)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ ...splitLine(line), shown: line }));
}

/** Materials from the form's lines or the table's array. Bad entries are reported and dropped; the rest are kept. */
export function parseLinks(value: unknown): Parsed {
  if (value === null || value === undefined || value === "") return { links: [], problems: [] };
  const links: EventLink[] = [];
  const problems: string[] = [];
  const all = candidates(value);
  for (const { label, href, shown } of all.slice(0, LINK_LIMITS.count)) {
    if (!isSafeHttpsUrl(href)) {
      problems.push(`"${cleanText(shown).slice(0, 60)}" needs an https:// link; ignored`);
      continue;
    }
    let text = labelFor(label, href);
    if (text.length > LINK_LIMITS.label) {
      problems.push(`A label is longer than ${LINK_LIMITS.label} characters; cut to fit`);
      text = text.slice(0, LINK_LIMITS.label).trim();
    }
    links.push({ label: text, href });
  }
  if (all.length > LINK_LIMITS.count) problems.push(`Only the first ${LINK_LIMITS.count} materials are kept; ${all.length - LINK_LIMITS.count} more were ignored`);
  return { links, problems };
}

/** The form's view of stored materials: one `Label | link` per line. */
export function linksToText(links: readonly EventLink[]): string {
  return links.map((l) => `${l.label} | ${l.href}`).join("\n");
}
