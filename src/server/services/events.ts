import "server-only";
import type { Event } from "@prisma/client";
import { prisma } from "@/server/db";
import { env } from "@/server/env";
import { safeJsonParse } from "@/lib/slug";

/** Sample records are shown only outside production when ALLOW_SAMPLE_DATA is true. */
export function sampleFilter() {
  const e = env();
  const allow = e.NODE_ENV !== "production" && e.ALLOW_SAMPLE_DATA;
  return allow ? {} : { isSample: false };
}

export type EventView = Event & {
  prepChecklistItems: string[];
  relatedLessonKeys: string[];
};

export function toEventView(e: Event): EventView {
  return {
    ...e,
    prepChecklistItems: safeJsonParse<string[]>(e.prepChecklist, []),
    relatedLessonKeys: safeJsonParse<string[]>(e.relatedLessons, []),
  };
}

export async function listUpcomingPublished(limit = 20): Promise<EventView[]> {
  const now = new Date();
  const rows = await prisma.event.findMany({
    where: {
      status: { in: ["published", "cancelled"] },
      ...sampleFilter(),
      OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: new Date(now.getTime() - 3 * 60 * 60 * 1000) } }],
    },
    orderBy: { startsAt: "asc" },
    take: limit,
  });
  return rows.map(toEventView);
}

export async function nextPublishedEvent(): Promise<EventView | null> {
  const list = await listUpcomingPublished(5);
  return list.find((e) => e.status === "published") ?? null;
}

export async function listPastPublished(limit = 12): Promise<EventView[]> {
  const now = new Date();
  const rows = await prisma.event.findMany({
    where: {
      status: "published",
      ...sampleFilter(),
      OR: [{ endsAt: { lt: now } }, { endsAt: null, startsAt: { lt: new Date(now.getTime() - 3 * 60 * 60 * 1000) } }],
    },
    orderBy: { startsAt: "desc" },
    take: limit,
  });
  return rows.map(toEventView);
}

export async function getPublishedEventBySlug(slug: string): Promise<EventView | null> {
  const row = await prisma.event.findFirst({ where: { slug, status: { in: ["published", "cancelled"] }, ...sampleFilter() } });
  return row ? toEventView(row) : null;
}

export async function latestSyncRun() {
  return prisma.pinSyncRun.findFirst({ orderBy: { startedAt: "desc" } });
}
