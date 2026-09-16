import "server-only";

/**
 * Wraps a content loader so a single invalid file degrades a page instead of
 * crashing it. Errors are logged; production builds gate on `content:check`.
 */
export function safeLoad<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (err) {
    console.error("[content]", (err as Error).message);
    return fallback;
  }
}
