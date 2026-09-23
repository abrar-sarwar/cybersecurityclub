/**
 * Registry of named image slots. Pages ask for a slot by key; the media
 * service resolves it to a previously stored media asset or to an entry in
 * content/media-manifest.json. Dynamic slots use a prefix and an id.
 */
export type SlotKind = "single" | "multi";

export type SlotDefinition = {
  key: string;
  label: string;
  description: string;
  kind: SlotKind;
  /** Recommended aspect ratio, e.g. "16:9". */
  ratio: string;
  /** Minimum recommended width in px. */
  minWidth: number;
  /** Where the slot appears. */
  page: string;
};

export const STATIC_SLOTS: SlotDefinition[] = [
  {
    key: "home.communityFeature", label: "Community feature photograph",
    description: "Approved documentary photograph below the Observatory hero; natural color and an accurate caption.",
    kind: "single", ratio: "16:10", minWidth: 1600, page: "Home",
  },
  {
    key: "home.workshopPhoto", label: "Secondary workshop photograph",
    description: "Optional second real club photograph, paired with the community feature.",
    kind: "single", ratio: "16:10", minWidth: 1000, page: "Home",
  },
  {
    key: "site.logo",
    label: "Club logo",
    description: "The official mark shown in the header and footer. Preserve the original ratio; transparent PNG or WebP preferred.",
    kind: "single",
    ratio: "original",
    minWidth: 512,
    page: "Every page",
  },
  {
    key: "site.favicon",
    label: "Favicon",
    description: "Square icon variant for browser tabs. If not provided, a generated icon is used.",
    kind: "single",
    ratio: "1:1",
    minWidth: 512,
    page: "Browser tab",
  },
  {
    key: "site.socialPreview",
    label: "Social preview image",
    description: "Shown when links to the site are shared. 1200x630 recommended.",
    kind: "single",
    ratio: "1.91:1",
    minWidth: 1200,
    page: "Link previews",
  },
  {
    key: "home.hero",
    label: "Homepage hero photo",
    description: "Wide photo of the club in action (a workshop, a meeting, a CTF night).",
    kind: "single",
    ratio: "16:9",
    minWidth: 1600,
    page: "Home",
  },
  {
    key: "home.communityGallery",
    label: "Homepage community gallery",
    description: "Four to eight candid photos with short captions.",
    kind: "multi",
    ratio: "3:2",
    minWidth: 1200,
    page: "Home",
  },
  {
    key: "about.hero",
    label: "About page photo",
    description: "A photo that shows the group; landscape.",
    kind: "single",
    ratio: "3:2",
    minWidth: 1400,
    page: "About",
  },
  {
    key: "community.gallery",
    label: "Community page gallery",
    description: "Photos from meetings, workshops, competitions and socials.",
    kind: "multi",
    ratio: "3:2",
    minWidth: 1200,
    page: "Community",
  },
];

export const DYNAMIC_SLOT_PREFIXES = [
  { prefix: "showcase.", suffix: ".screenshot", label: "Approved project screenshot", ratio: "16:9", minWidth: 1400, page: "Homepage projects" },
  { prefix: "leadership.", suffix: ".portrait", label: "Officer portrait", ratio: "4:5", minWidth: 800, page: "Community & Leadership" },
  { prefix: "event.", suffix: ".cover", label: "Event cover", ratio: "3:2", minWidth: 1200, page: "Events" },
  { prefix: "story.", suffix: ".photo", label: "Member story photo", ratio: "4:5", minWidth: 800, page: "Member stories" },
] as const;

export function leadershipPortraitSlot(id: string) {
  return `leadership.${id}.portrait`;
}
export function eventCoverSlot(id: string) {
  return `event.${id}.cover`;
}
export function storyPhotoSlot(id: string) {
  return `story.${id}.photo`;
}

export function describeSlot(key: string): { label: string; ratio: string; minWidth: number; page: string; kind: SlotKind } | null {
  const s = STATIC_SLOTS.find((x) => x.key === key);
  if (s) return s;
  for (const d of DYNAMIC_SLOT_PREFIXES) {
    if (key.startsWith(d.prefix) && key.endsWith(d.suffix)) return { label: d.label, ratio: d.ratio, minWidth: d.minWidth, page: d.page, kind: "single" };
  }
  return null;
}

export function isKnownSlot(key: string) {
  return describeSlot(key) !== null;
}
