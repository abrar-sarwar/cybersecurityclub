/**
 * URL rules. Officers paste links; visitors click them. Only web links are
 * stored, and the Markdown renderer is told the same allow-list.
 */

export const MAX_URL_LENGTH = 500;

/** Markdown may link to the web or to an email address. Nothing else. */
export const SAFE_MARKDOWN_SCHEMES = ["http:", "https:", "mailto:"] as const;

/** A stored link field: absolute https URL, no credentials, a real host. */
export function isSafeHttpsUrl(value: string): boolean {
  if (typeof value !== "string" || value.length > MAX_URL_LENGTH) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (!url.hostname || !url.hostname.includes(".")) return false;
  // Control characters and whitespace have no place in a pasted link.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\s]/.test(value)) return false;
  return true;
}

const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/** Every link destination in Markdown: inline links, images, autolinks and reference definitions. */
function destinations(markdown: string): string[] {
  const found: string[] = [];
  for (const m of markdown.matchAll(/\]\(\s*<?([^\s)>]+)/g)) found.push(m[1]);
  for (const m of markdown.matchAll(/^\s{0,3}\[[^\]]+\]:\s*<?(\S+?)>?(?:\s|$)/gm)) found.push(m[1]);
  for (const m of markdown.matchAll(/<([a-z][a-z0-9+.-]*:[^\s<>]*)>/gi)) found.push(m[1]);
  return found;
}

/** Link destinations whose scheme is not allowed. Empty means the text is fine. */
export function findUnsafeMarkdownLinks(markdown: string): string[] {
  const bad: string[] = [];
  for (const raw of destinations(markdown)) {
    const dest = raw.replace(/&#x?[0-9a-f]+;|&[a-z]+;/gi, "").replace(/[\u0000- ]/g, "");
    const scheme = SCHEME.exec(dest);
    if (!scheme) continue; // relative link or fragment
    if (!(SAFE_MARKDOWN_SCHEMES as readonly string[]).includes(`${scheme[1].toLowerCase()}:`)) bad.push(raw);
  }
  return bad;
}
