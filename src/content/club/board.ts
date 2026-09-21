/**
 * The current executive board, in the order it is shown.
 *
 * Names and roles are kept here rather than in the database so the roster
 * ships with the site. A published leadership record with a matching first
 * name still supplies a portrait, bio and links when one exists.
 */
export type BoardGroup = "leads" | "officers";

export type BoardMember = {
  name: string;
  /** Stable file-name key, used to find a portrait in public/assets/team. */
  slug: string;
  role: string;
  /** What the seat covers, not a claim about the person holding it. */
  remit: string;
  group: BoardGroup;
  /** Public profile, when the officer has shared one. */
  linkedin?: string;
};

export const BOARD_TERM = "Fall 2026";

/** Shown above the board diagram. */
export const BOARD_HEADING = "Current Exec Board F26";

export const EXEC_BOARD: readonly BoardMember[] = [
  { name: "Marc", slug: "marc", role: "Co-President", remit: "Runs the club, sets the term plan and represents it on campus.", group: "leads" , linkedin: "https://www.linkedin.com/in/marc-donatien-jr/" },
  { name: "Siya", slug: "siya", role: "Co-President", remit: "Runs the club, sets the term plan and represents it on campus.", group: "leads" , linkedin: "https://www.linkedin.com/in/siya-katoch/" },
  { name: "Mikey", slug: "mikey", role: "Vice President", remit: "Keeps meetings and workshops running week to week.", group: "leads" , linkedin: "https://www.linkedin.com/in/mikeydonkor/" },
  { name: "Abrar", slug: "abrar", role: "Vice President", remit: "Keeps meetings and workshops running week to week.", group: "leads" },
  { name: "Alan", slug: "alan", role: "Treasurer", remit: "Budget, funding requests and reimbursements.", group: "officers" , linkedin: "https://www.linkedin.com/in/alan-mm/" },
  { name: "Kamal", slug: "kamal", role: "Secretary", remit: "Records, membership lists and club paperwork.", group: "officers" , linkedin: "https://www.linkedin.com/in/kamalgajavalli4311/" },
  { name: "Mazza", slug: "mazza", role: "Event Director", remit: "Plans the workshops, socials and competition nights.", group: "officers" , linkedin: "https://www.linkedin.com/in/mazza-adam/" },
  { name: "Madison", slug: "madison", role: "Social Director", remit: "Makes sure new members meet people and come back.", group: "officers" , linkedin: "https://www.linkedin.com/in/madison-dodard-b7767b217/" },
  { name: "James", slug: "james", role: "Social Media Director", remit: "Announcements, posts and the club's presence online.", group: "officers" , linkedin: "https://www.linkedin.com/in/jamesafon/" },
];

export const BOARD_GROUPS: { id: BoardGroup; label: string; note: string }[] = [
  { id: "leads", label: "Presidents and vice presidents", note: "Ask these four about the club as a whole, partnerships or anything that needs a decision." },
  { id: "officers", label: "Officers and directors", note: "Each seat owns one part of running the club, from the budget to the Discord server." },
];
