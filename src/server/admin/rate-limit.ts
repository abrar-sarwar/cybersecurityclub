/** Sliding-window counter per key, in memory. Per server instance, which is enough for a club site. */
export function createRateLimiter(opts: { limit: number; windowMs: number; now?: () => number; maxKeys?: number }) {
  const now = opts.now ?? Date.now;
  const maxKeys = opts.maxKeys ?? 1000;
  const hits = new Map<string, number[]>();
  return {
    hit(key: string): { ok: boolean; retryAfterMs: number } {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((at) => at > t - opts.windowMs);
      if (recent.length >= opts.limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterMs: recent[0] + opts.windowMs - t };
      }
      recent.push(t);
      hits.delete(key);
      if (hits.size >= maxKeys) hits.delete(hits.keys().next().value as string);
      hits.set(key, recent);
      return { ok: true, retryAfterMs: 0 };
    },
    reset(key: string) {
      hits.delete(key);
    },
  };
}
