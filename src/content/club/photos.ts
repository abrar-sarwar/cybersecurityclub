/**
 * Club photographs, converted to webp from the originals in
 * public/assets/observatory. Captions describe what is happening rather than
 * naming anyone, since the people in them did not agree to be listed.
 */
export type ClubPhoto = {
  src: string;
  width: number;
  height: number;
  /** Alt text: what a reader who cannot see the photo needs to know. */
  alt: string;
  caption: string;
};

export const CLUB_PHOTOS: readonly ClubPhoto[] = [
  {
    src: "/assets/club/club-3.webp",
    width: 1290,
    height: 903,
    alt: "About twenty club members standing together at the front of a meeting room, holding up a hand sign, with the Atlanta skyline through the windows behind them.",
    caption: "End of a meeting downtown",
  },
  {
    src: "/assets/club/club-2.webp",
    width: 1276,
    height: 933,
    alt: "A student presenting a slide titled Incident Response Lifecycle to members seated at round tables.",
    caption: "Incident response workshop",
  },
  {
    src: "/assets/club/club-7.webp",
    width: 1290,
    height: 799,
    alt: "Fourteen students and a staff member posed in two rows against a granite wall.",
    caption: "Officers and members after a campus event",
  },
  {
    src: "/assets/club/club-4.webp",
    width: 1203,
    height: 1196,
    alt: "Eight students posing with snacks in front of a screen reading Let's Play Jeopardy.",
    caption: "Jeopardy night",
  },
  {
    src: "/assets/club/club-6.webp",
    width: 1290,
    height: 883,
    alt: "A full room watching a panel of five speakers seated at the front, under a slide reading Cybersecurity Panel.",
    caption: "Industry panel at the Georgia Fintech Academy",
  },
  {
    src: "/assets/club/club-1.webp",
    width: 1155,
    height: 770,
    alt: "A large group of students gathered at the front of a classroom, smiling at the camera.",
    caption: "A weekly meeting, full room",
  },
  {
    src: "/assets/club/club-5.webp",
    width: 1290,
    height: 969,
    alt: "Students seated at long tables in a classroom, watching a presentation off camera.",
    caption: "Members at a Tuesday session",
  },
];
