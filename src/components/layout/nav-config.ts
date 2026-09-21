export const PUBLIC_NAV = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/careers", label: "Careers" },
  { href: "/careers/projects", label: "Projects" },
  { href: "/team", label: "Team" },
] as const;

/** Header calls to action. The site has no accounts; these lead to public pages and Discord. */
export const HEADER_ACTIONS = {
  primary: { href: "/careers/quiz", label: "Find My Path" },
  discord: { label: "Join Discord" },
} as const;
