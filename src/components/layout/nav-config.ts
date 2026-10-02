export const PUBLIC_NAV = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/challenges", label: "Challenges" },
  { href: "/competitions", label: "Competitions" },
  { href: "/resources", label: "Resources" },
  { href: "/team", label: "Team" },
] as const;

/** The header's one call to action. The site has no accounts; it leads to Discord. */
export const HEADER_ACTIONS = {
  discord: { label: "Join Discord" },
} as const;
