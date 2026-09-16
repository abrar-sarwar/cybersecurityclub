/**
 * Central branding configuration.
 *
 * Everything that identifies the club lives here: names, logo settings,
 * favicon and social preview slots, colors, contact routes and external links.
 * Pages read from this file and from the media slot system instead of
 * hard-coding values, so replacing the logo or renaming the club never
 * requires editing individual pages.
 *
 * Images are resolved through media slots (see src/content/media-slots.ts):
 *   - upload a replacement in the officer Media Manager and assign it to the
 *     slot "site.logo", or
 *   - drop the file in public/assets/club/branding/ and reference it from
 *     content/media-manifest.json under the same slot key.
 */
export const branding = {
  /** Full display name used in headings and metadata. */
  displayName: "Cybersecurity Club at GSU",
  /** Short name for tight spaces (mobile header, footer, badges). */
  shortName: "CySec Club",
  /** Two-line wordmark shown next to the mark. */
  wordmark: {
    primary: "Cybersecurity Club",
    secondary: "at Georgia State University",
  },
  universityName: "Georgia State University",
  universityShortName: "GSU",
  /** Short description used for metadata and social previews. */
  description:
    "A student community at Georgia State University for learning cybersecurity together: workshops, hands-on projects, CTFs and career preparation. Beginners welcome.",

  /**
   * Logo settings. Whether the OFFICIAL mark is installed is derived at
   * runtime from the "site.logo" slot. When the slot is empty the header
   * renders a clearly temporary text-and-shield treatment and the officer
   * dashboard shows a reminder. Never mark the logo as installed by hand.
   */
  logo: {
    slot: "site.logo",
    /** Rendering height of the mark in the header, in px. */
    headerHeight: 44,
    /** Alt text used whenever the official mark is rendered. */
    alt: "Cybersecurity Club at GSU logo",
    /** Label for the temporary treatment. */
    temporaryLabel: "Temporary mark. Official logo not installed yet.",
  },

  favicon: {
    slot: "site.favicon",
  },
  socialPreview: {
    slot: "site.socialPreview",
    width: 1200,
    height: 630,
  },

  /**
   * Color tokens. These are proposed design values, not verified official
   * GSU brand specifications. Keep them in sync with src/app/globals.css.
   * The Observatory palette; accent is for links and brand is for filled actions.
   * These are design tokens, not verified university brand standards.
   */
  colors: {
    brand: "#285CFF",
    brandHover: "#3869EE",
    background: "#05070D",
    surface: "#0D1829",
    accent: "#8AACFF",
    navy: "#F3F6FC",
    white: "#FFFFFF",
    paleBlue: "#08111F",
    border: "rgba(160, 183, 224, 0.16)",
    body: "#E0E6F1",
    muted: "#B4BFD2",
    cyan: "#0EA5C6",
    cyanText: "#8FCAD6",
  },

  /** Event and display timezone for the club. */
  timezone: "America/New_York",

  /**
   * Contact routes. The club email and social links were read from the club's
   * public PIN organization profile (pin.gsu.edu/organization/cysecclub) on
   * 2026-09-15. Officers should confirm them and update here if needed.
   */
  contact: {
    email: "hackingpanthers@gmail.com",
    accessibilityEmail: "hackingpanthers@gmail.com",
    privacyEmail: "hackingpanthers@gmail.com",
    meetingLocation: "Atlanta Campus (room listed on each event)",
  },

  links: {
    pinOrganization: "https://pin.gsu.edu/organization/cysecclub",
    pinEvents: "https://pin.gsu.edu/organization/cysecclub/events",
    discordInvite:
      process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/eMwQdmetKD",
    instagram: "https://www.instagram.com/cybersecurityclubgsu/",
    linkedin: "https://www.linkedin.com/company/cybersecurity-club-gsu/",
  },
} as const;

export type Branding = typeof branding;
