/**
 * National Cyber League recruitment. A team is being formed this semester and
 * the linked form collects interest: it does not confirm a place, a cost or a
 * competition date, so nothing here states one.
 *
 * Events no longer live in this file: officers manage them on /admin
 * (see docs/events-admin.md).
 */
export const NCL = {
  eyebrow: "Recruiting now",
  heading: "Want to compete in a CTF?",
  body: "We are putting together a GSU team for the National Cyber League this semester. It is a practical way to build skills you can point to, and a competition you can put on a résumé. No experience required.",
  linkLabel: "Interest form",
  formUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSeiTdYxhaLUd1khSRXTAYv-uinm7elH9W_BjOD8nW17QcJVIA/viewform?usp=sharing&ouid=117590049843765622395",
  points: [
    "Hands-on challenges, not multiple choice",
    "Something concrete to talk about in interviews",
    "Open to every skill level",
  ],
} as const;
