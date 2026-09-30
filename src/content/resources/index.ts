/**
 * Resources: short guides for certifications, hands-on skills and interviews.
 *
 * Exam details come from the vendor's own pages, and every link and video was
 * opened on the guide's `checked` date. Prices, promo codes, exam versions and
 * season dates change, so anything of that kind says when it was seen. Nothing
 * here reproduces exam questions.
 */
import type { Guide, GuideGroup } from "./types";
import { ctf } from "./guides/ctf";
import { homeLab } from "./guides/home-lab";
import { interviewPrep } from "./guides/interview-prep";
import { linuxBasics } from "./guides/linux-basics";
import { networkPlus } from "./guides/network-plus";
import { securityPlus } from "./guides/security-plus";
import { securityTools } from "./guides/security-tools";
import { socPractice } from "./guides/soc-practice";
import { webSecurity } from "./guides/web-security";

export type { Guide, GuideGroup, GuideItem, GuideLink, GuideSection, GuideVideo } from "./types";

export const GUIDE_GROUPS: Record<GuideGroup, string> = {
  certification: "Certifications",
  "hands-on": "Hands-on skills",
  career: "Career",
};

/**
 * Map order. The resources page sets these three to a row, so the position of
 * a guide here is its place on the map: tools sits in the middle, the
 * certifications and interview prep along the top, practice along the bottom.
 */
export const GUIDES: readonly Guide[] = [
  networkPlus,
  securityPlus,
  interviewPrep,
  homeLab,
  securityTools,
  socPractice,
  linuxBasics,
  ctf,
  webSecurity,
];

/**
 * What leads to what. Each pair sits side by side on the map, which is what
 * lets the page draw the link through the gap between the two boxes.
 */
export const GUIDE_LINKS: readonly (readonly [string, string])[] = [
  ["network-plus", "security-plus"],
  ["security-plus", "interview-prep"],
  ["network-plus", "home-lab"],
  ["network-plus", "security-tools"],
  ["security-plus", "security-tools"],
  ["interview-prep", "soc-practice"],
  ["home-lab", "security-tools"],
  ["security-tools", "soc-practice"],
  ["home-lab", "linux-basics"],
  ["security-tools", "linux-basics"],
  ["security-tools", "ctf"],
  ["security-tools", "web-security"],
  ["linux-basics", "ctf"],
  ["ctf", "web-security"],
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

/** The guides a guide is linked to, in map order. */
export function linkedGuides(slug: string): Guide[] {
  const linked = new Set(GUIDE_LINKS.flatMap(([from, to]) => (from === slug ? [to] : to === slug ? [from] : [])));
  return GUIDES.filter((guide) => linked.has(guide.slug));
}
