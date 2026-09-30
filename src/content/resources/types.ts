export type GuideItem = {
  /** Shown in bold ahead of the body. */
  label?: string;
  /** Plain text. Wrap commands and file names in backticks to set them as code. */
  body: string;
};

export type GuideVideo = {
  /** The YouTube video id, the part after `watch?v=`. */
  id: string;
  /** The title as it appears on YouTube. */
  title: string;
  channel: string;
  /** Running time as m:ss. */
  length: string;
  /** Why this video, in one or two sentences. */
  caption: string;
};

export type GuideSection = {
  id: string;
  title: string;
  intro?: string;
  /** Ordered steps. */
  steps?: GuideItem[];
  /** Unordered points. */
  bullets?: GuideItem[];
  /** Exam domains and their share of the score. */
  weights?: { name: string; percent: number }[];
  video?: GuideVideo;
  /** An interactive block the page renders in this section. */
  widget?: "tools" | "interview" | "terminal";
  note?: string;
};

export type GuideLink = {
  label: string;
  href: string;
  /** Why it is listed, and what it costs if it is not free. */
  note: string;
  /** A discount code a member passed along. Codes expire. */
  promo?: string;
};

export type GuideGroup = "certification" | "hands-on" | "career";

export type Guide = {
  slug: string;
  group: GuideGroup;
  title: string;
  eyebrow: string;
  /** Shown under the title on the guide's own page. */
  summary: string;
  /** Shorter line for the box on the resources map. */
  card: string;
  /** Four short facts shown in one row. */
  facts: { label: string; value: string }[];
  /** The one thing to know before starting. */
  notice: { title: string; body: string };
  sections: GuideSection[];
  links: { group: string; items: GuideLink[] }[];
  /** The day the links, prices and other details were last opened (YYYY-MM-DD). */
  checked: string;
};
