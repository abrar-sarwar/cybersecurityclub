import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { listUpcomingPublished, listPastPublished } from "@/server/services/events";
import { loadPaths } from "@/content/loaders";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const statics = ["/", "/about", "/community", "/events", "/stories", "/join", "/learn", "/privacy", "/accessibility"].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: (p === "/" || p === "/events" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: p === "/" ? 1 : 0.7,
  }));
  let paths: MetadataRoute.Sitemap = [];
  try {
    paths = loadPaths()
      .filter((p) => p.status === "published")
      .map((p) => ({ url: `${base}/learn/paths/${p.slug}`, lastModified: new Date(p.lastReviewed), changeFrequency: "monthly" as const, priority: 0.6 }));
  } catch {
    paths = [];
  }
  const events = [...(await listUpcomingPublished(50)), ...(await listPastPublished(50))].map((e) => ({
    url: `${base}/events/${e.slug}`,
    lastModified: e.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));
  return [...statics, ...paths, ...events];
}
