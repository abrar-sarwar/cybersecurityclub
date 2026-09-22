/**
 * What members say about the club, in their own words.
 *
 * Every entry is a real quote from a named person who agreed to it being
 * published. The section takes more without any layout change: add the
 * object and it appears.
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
  {
    quote:
      "The Cybersecurity Club gave me a space to learn, meet people with similar interests, and build connections that went beyond the classroom. Through the club, I was able to explore different areas of cybersecurity and grow my network. It played a big part in helping me feel more prepared for my career.",
    name: "Divine O.",
    title: "Ex Vice President of Cybersecurity Club",
    linkedin: "https://www.linkedin.com/in/divineokonkwo/",
    photo: "/assets/club/divine.webp",
  },
  {
    quote:
      "Cybersecurity felt intimidating to me at first, until I joined the Cybersecurity Club. Competing in NCL with people I'd just met pushed me to learn fast. We each brought different strengths and were constantly sharing knowledge. By the end, I had picked up so many new skills from my amazing teammates.",
    name: "Tran Le",
    title: "Ex Director of Communication",
    linkedin: "https://www.linkedin.com/in/tran-thuy-bao-le/",
    photo: "/assets/club/tranle.webp",
  },
];

/** Slots held open for quotes that are on the way. */
export const VOICES_EXPECTED = 3;
