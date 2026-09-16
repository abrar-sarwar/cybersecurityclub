import "server-only";
import { findModuleForLesson, getCertLesson, getCertTrack, getLesson, getPath } from "@/content/loaders";

/** Resolves a content key like "lesson:<path>/<lesson>" to an app URL, or null. */
export function lessonHrefFromKey(key: string): string | null {
  try {
    if (key.startsWith("lesson:")) {
      const [pathSlug, lessonSlug] = key.slice("lesson:".length).split("/");
      const p = getPath(pathSlug);
      if (!p) return null;
      const m = findModuleForLesson(p, lessonSlug);
      if (!m) return null;
      return `/learn/paths/${pathSlug}/${m.slug}/${lessonSlug}`;
    }
    if (key.startsWith("cert-lesson:")) {
      const [track, lessonSlug] = key.slice("cert-lesson:".length).split("/");
      return getCertLesson(track, lessonSlug) ? `/certifications/${track}/${lessonSlug}` : null;
    }
    if (key.startsWith("project:")) return `/projects/${key.slice("project:".length)}`;
  } catch {
    return null;
  }
  return null;
}

export function lessonTitleFromKey(key: string): string {
  try {
    if (key.startsWith("lesson:")) {
      const [pathSlug, lessonSlug] = key.slice("lesson:".length).split("/");
      return getLesson(pathSlug, lessonSlug)?.title ?? key;
    }
    if (key.startsWith("cert-lesson:")) {
      const [track, lessonSlug] = key.slice("cert-lesson:".length).split("/");
      return getCertLesson(track, lessonSlug)?.title ?? `${getCertTrack(track)?.name ?? track} lesson`;
    }
  } catch {
    return key;
  }
  return key;
}
