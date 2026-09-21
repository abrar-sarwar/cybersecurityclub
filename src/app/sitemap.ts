import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { safeDb } from "@/server/safe-db";
import { listUpcomingPublished, listPastPublished } from "@/server/services/events";
import { loadPaths } from "@/content/loaders";
import { CAREER_PATHS } from "@/content/careers/paths";
import { LIBRARY_PROJECTS } from "@/content/careers/projects";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const statics = ["/", "/about", "/team", "/events", "/stories", "/join", "/careers", "/careers/quiz", "/careers/projects", "/privacy", "/accessibility"].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: (p === "/" || p === "/events" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: p === "/" ? 1 : 0.7,
  }));
  let paths: MetadataRoute.Sitemap = [];
  try {
    paths = loadPaths()
      .filter((p) => p.status === "published")
      .map((p) => ({ url: `${base}/careers/learning/${p.slug}`, lastModified: new Date(p.lastReviewed), changeFrequency: "monthly" as const, priority: 0.6 }));
  } catch {
    paths = [];
  }
  const published = await safeDb(async () => [...(await listUpcomingPublished(50)), ...(await listPastPublished(50))], [], "sitemap events");
  const events = published.map((e) => ({
    url: `${base}/events/${e.slug}`,
    lastModified: e.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));
  const careers = CAREER_PATHS.map((p) => ({ url: `${base}/careers/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 }));
  const projects = LIBRARY_PROJECTS.map((p) => ({ url: `${base}/careers/projects/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 }));
  return [...statics, ...careers, ...projects, ...paths, ...events];
}
