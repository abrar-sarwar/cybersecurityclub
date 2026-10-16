/**
 * Flyer images from the admin form. The upload is decoded by sharp, which
 * means only a real PNG, JPEG or WebP gets through whatever the file was
 * called; it is then resized, re-encoded as WebP with its metadata stripped,
 * and stored in the project's public Supabase Storage bucket. The original
 * bytes are never kept.
 */
import { createHash } from "node:crypto";
import sharp, { type Metadata } from "sharp";
import type { SupabaseClient } from "./supabase";

export const FLYER_LIMITS = { maxBytes: 4 * 1024 * 1024, minPx: 200, maxPx: 1600 } as const;
const FORMATS = new Set(["png", "jpeg", "webp"]);

export class FlyerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlyerError";
  }
}

export async function prepareFlyer(bytes: Uint8Array): Promise<{ webp: Buffer; width: number; height: number }> {
  if (bytes.byteLength > FLYER_LIMITS.maxBytes) throw new FlyerError(`Flyers can be at most ${FLYER_LIMITS.maxBytes / 1024 / 1024} MB`);
  if (bytes.byteLength === 0) throw new FlyerError("Choose an image file");
  let meta: Metadata;
  try {
    meta = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new FlyerError("That file is not a PNG, JPEG or WebP image");
  }
  if (!meta.format || !FORMATS.has(meta.format)) throw new FlyerError("That file is not a PNG, JPEG or WebP image");
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (Math.min(width, height) < FLYER_LIMITS.minPx) throw new FlyerError(`Flyers need to be at least ${FLYER_LIMITS.minPx} pixels on each side`);
  try {
    const { data, info } = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: FLYER_LIMITS.maxPx, height: FLYER_LIMITS.maxPx, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return { webp: data, width: info.width, height: info.height };
  } catch {
    throw new FlyerError("That image could not be processed");
  }
}

/** `<eventId>-<hash8>.webp` inside the bucket: a new image gets a new path, so caches never serve a stale one. */
export function flyerPathname(eventId: string, webp: Buffer): string {
  return `${eventId}-${createHash("sha256").update(webp).digest("hex").slice(0, 8)}.webp`;
}

type FlyerStore = Pick<SupabaseClient, "uploadFlyer" | "publicFlyerUrl" | "flyerPathFromUrl" | "deleteFlyer">;

export async function storeFlyer(eventId: string, webp: Buffer, store: FlyerStore): Promise<string> {
  const path = flyerPathname(eventId, webp);
  await store.uploadFlyer(path, webp, "image/webp");
  return store.publicFlyerUrl(path);
}

/** Deletes a flyer this site stored. Other URLs are left alone; a failed delete is logged, not raised. */
export async function discardFlyer(url: string | null, store: FlyerStore): Promise<void> {
  const path = url ? store.flyerPathFromUrl(url) : null;
  if (!path) return;
  try {
    await store.deleteFlyer(path);
  } catch (err) {
    console.warn(`[admin] could not delete an old flyer: ${err instanceof Error ? err.message : String(err)}`);
  }
}
