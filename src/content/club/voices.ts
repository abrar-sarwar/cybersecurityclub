/**
 * What members say about the club, in their own words.
 *
 * Every entry is a real quote from a named person who agreed to it being
 * published. Two more are expected, so the section is built to take them
 * without any layout change: add the object and it appears.
 */
export type Voice = {
  quote: string;
  name: string;
  /** Their relationship to the club, past or present. */
  title: string;
  /** Public profile, when they have shared one. */
  linkedin?: string;
  /** Small portrait beside the quote, when one has been provided. */
  photo?: string;
};

export const VOICES: readonly Voice[] = [
  {
    quote:
      "The Cybersecurity Club made learning fun yet approachable. And with that came life-changing connections and opportunities. This club made my college degree worth it.",
    name: "Emran H.",
    title: "Ex President of Cybersecurity Club",
    linkedin: "https://www.linkedin.com/in/emran-habib/",
    photo: "/assets/club/emran.webp",
  },
];

/** Slots held open for quotes that are on the way. */
export const VOICES_EXPECTED = 3;
