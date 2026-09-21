import "server-only";
import { findModuleForLesson, getCertLesson, getCertTrack, getLesson, getPath } from "@/content/loaders";

/**
 * Resolves a content key like "lesson:<path>/<lesson>" to a public page that
 * lists it, or null. Lessons are listed on their path's overview page.
 */
export function lessonHrefFromKey(key: string): string | null {
  try {
    if (key.startsWith("lesson:")) {
      const [pathSlug, lessonSlug] = key.slice("lesson:".length).split("/");
      const p = getPath(pathSlug);
      if (!p || !findModuleForLesson(p, lessonSlug)) return null;
      return `/careers/learning/${pathSlug}`;
    }
    if (key.startsWith("cert-lesson:")) {
      const [track, lessonSlug] = key.slice("cert-lesson:".length).split("/");
      return getCertLesson(track, lessonSlug) ? "/careers" : null;
    }
    if (key.startsWith("project:")) return "/careers#projects";
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
