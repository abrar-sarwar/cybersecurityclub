import "server-only";
import { prisma } from "@/server/db";
import { sampleFilter } from "@/server/services/events";
import { resolveAssetById, type ResolvedImage } from "@/server/services/media";

export async function listPublishedLeadership() {
  const rows = await prisma.leadershipProfile.findMany({
    where: { status: "published", ...sampleFilter() },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  const withPortraits = await Promise.all(
    rows.map(async (r) => ({ ...r, portrait: r.portraitAssetId ? await resolveAssetById(r.portraitAssetId) : null })),
  );
  return withPortraits;
}

export type StoryView = {
  id: string;
  memberName: string;
  roleTitle: string;
  company: string;
  dates: string | null;
  summary: string;
  contribution: string | null;
  profileUrl: string | null;
  isSample: boolean;
  photo: ResolvedImage | null;
};

/** Only stories with publication permission and a confirmed company name are public. */
export async function listPublishedStories(): Promise<StoryView[]> {
  const rows = await prisma.memberStory.findMany({
    where: { status: "published", permissionGranted: true, companyConfirmed: true, ...sampleFilter() },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      memberName: r.memberName,
      roleTitle: r.roleTitle,
      company: r.company,
      dates: r.dates,
      summary: r.summary,
      contribution: r.contribution,
      profileUrl: r.profileUrl,
      isSample: r.isSample,
      photo: r.photoAssetId ? await resolveAssetById(r.photoAssetId) : null,
    })),
  );
}

/** Public directory: only members who opted in. Never exposes emails. */
