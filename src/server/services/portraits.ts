import "server-only";
import { readdirSync } from "node:fs";
import path from "node:path";

/**
 * Board portraits are plain files in public/assets/team, named after each
 * member's slug (marc.jpg, siya.png, ...). Dropping a file in is all it takes
 * for the photo to appear; no code or database change is needed.
 */
const PORTRAIT_DIR = path.join(process.cwd(), "public", "assets", "team");
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export function boardPortraits(): Record<string, string> {
  let files: string[];
  try {
    files = readdirSync(PORTRAIT_DIR);
  } catch {
    // The directory is optional: with no portraits the board falls back to monograms.
    return {};
  }

  const found: Record<string, string> = {};
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    if (!EXTENSIONS.has(extension)) continue;
    const slug = path.basename(file, extension).toLowerCase();
    // First match wins, so a slug is never ambiguous between two formats.
    found[slug] ??= `/assets/team/${file}`;
  }
  return found;
}
