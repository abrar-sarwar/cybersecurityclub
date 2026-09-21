import "server-only";

/**
 * Wraps a database read so an unreachable or unconfigured database degrades
 * the page instead of returning a 500.
 *
 * The file-backed content (careers, projects, the board, event flyers) is the
 * bulk of the site and needs no database at all, so a database problem should
 * never take the whole site down with it.
 */
export async function safeDb<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[db] ${label}:`, (error as Error).message);
    return fallback;
  }
}
