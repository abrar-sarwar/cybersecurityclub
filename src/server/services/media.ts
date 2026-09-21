import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { z } from "zod";
import { prisma } from "@/server/db";
import { safeJsonParse } from "@/lib/slug";

/** A resolved image ready to render. */
export type ResolvedImage = {
  id: string;
  source: "upload" | "manifest";
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  alt: string;
  caption: string | null;
  credit: string | null;
  focalX: number;
  focalY: number;
};

const manifestSchema = z.object({
  version: z.number(),
  assets: z.record(
    z.string(),
    z.object({
      src: z.string().startsWith("/assets/club/"),
      alt: z.string(),
      caption: z.string().optional().default(""),
      credit: z.string().optional().default(""),
      focalPoint: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      status: z.enum(["draft", "published"]).default("published"),
    }),
  ),
  slots: z.record(
    z.string(),
    z.union([
      z.object({ asset: z.string().nullable() }),
      z.object({ assets: z.array(z.string()) }),
    ]),
  ),
});
export type Manifest = z.infer<typeof manifestSchema>;

export function manifestPath() {
  return path.join(process.cwd(), "content", "media-manifest.json");
}

export const loadManifest = cache((): Manifest | null => {
  try {
    const raw = fs.readFileSync(manifestPath(), "utf8");
    const parsed = manifestSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.error("[media] invalid content/media-manifest.json:", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
      return null;
    }
    return parsed.data;
  } catch (err) {
    console.error("[media] cannot read manifest", err);
    return null;
  }
});

function manifestImage(m: Manifest, assetId: string): ResolvedImage | null {
  const a = m.assets[assetId];
  if (!a || a.status !== "published") return null;
  const file = path.join(process.cwd(), "public", a.src);
  if (!fs.existsSync(file)) return null;
  return {
    id: `manifest:${assetId}`,
    source: "manifest",
    src: a.src,
    width: a.width,
    height: a.height,
    alt: a.alt,
    caption: a.caption || null,
    credit: a.credit || null,
    focalX: a.focalPoint?.x ?? 0.5,
    focalY: a.focalPoint?.y ?? 0.5,
  };
}

export type VariantMap = Record<string, { key: string; width: number; height: number }>;

export function uploadedImage(asset: {
  id: string;
  version: number;
  width: number;
  height: number;
  alt: string;
  caption: string | null;
  credit: string | null;
  focalX: number;
  focalY: number;
  variantsJson: string;
}): ResolvedImage {
  const variants = safeJsonParse<VariantMap>(asset.variantsJson, {});
  const widths = Object.entries(variants)
    .filter(([k]) => k.startsWith("w"))
    .map(([k, v]) => ({ name: k, width: v.width }))
    .sort((a, b) => a.width - b.width);
  const largest = widths[widths.length - 1];
  const src = largest ? `/media/${asset.id}/${largest.name}?v=${asset.version}` : `/media/${asset.id}/original?v=${asset.version}`;
  const srcSet = widths.length ? widths.map((w) => `/media/${asset.id}/${w.name}?v=${asset.version} ${w.width}w`).join(", ") : undefined;
  const largestVariant = largest ? variants[largest.name] : null;
  return {
    id: asset.id,
    source: "upload",
    src,
    srcSet,
    width: largestVariant?.width ?? asset.width,
    height: largestVariant?.height ?? asset.height,
    alt: asset.alt,
    caption: asset.caption,
    credit: asset.credit,
    focalX: asset.focalX,
    focalY: asset.focalY,
  };
}

/**
 * Resolves the images for a slot: published uploads assigned in the Media
 * Manager first, then the manifest. `includeDrafts` is for officer previews.
 */
export const resolveSlot = cache(async (slotKey: string, includeDrafts = false): Promise<ResolvedImage[]> => {
  const rows = await prisma.mediaSlot.findMany({
    where: { slotKey, asset: { deletedAt: null, ...(includeDrafts ? {} : { status: "published" }) } },
    include: { asset: true },
    orderBy: { position: "asc" },
  });
  if (rows.length) return rows.map((r) => uploadedImage(r.asset));

  const m = loadManifest();
  if (!m) return [];
  const entry = m.slots[slotKey];
  if (!entry) return [];
  if ("assets" in entry) return entry.assets.map((id) => manifestImage(m, id)).filter((x): x is ResolvedImage => x !== null);
  if (entry.asset) {
    const img = manifestImage(m, entry.asset);
    return img ? [img] : [];
  }
  return [];
});

export async function resolveSingle(slotKey: string, includeDrafts = false): Promise<ResolvedImage | null> {
  const list = await resolveSlot(slotKey, includeDrafts);
  return list[0] ?? null;
}

export async function resolveAssetById(assetId: string): Promise<ResolvedImage | null> {
  if (!assetId) return null;
  const a = await prisma.mediaAsset.findFirst({ where: { id: assetId, deletedAt: null, status: "published" } });
  return a ? uploadedImage(a) : null;
}
