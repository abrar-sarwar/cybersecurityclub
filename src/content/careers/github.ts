/**
 * Shown on every project page. Written first-hand, as if you are watching
 * someone publish their first project, because most students have never done
 * it and the guides they find assume they have.
 */
export const GITHUB_WALKTHROUGH = {
  heading: "Publishing it on GitHub, watched over a shoulder",
  intro:
    "This is the part people skip, and it is the part a reviewer actually opens. Eight steps, about twenty minutes the first time.",
  steps: [
    {
      label: "Create the repository",
      command: "github.com → New repository",
      seen: "Name it the project name you picked. Add a README and an MIT licence. Keep it public.",
      note: "Write the chosen name in your notes. It goes on your résumé later, unchanged.",
    },
    {
      label: "Bring it to your machine",
      command: "git clone https://github.com/you/arkham.git\ncd arkham",
      seen: "The terminal prints Cloning into 'arkham'. You now have a folder with one README in it.",
      note: "If it asks for a password, set up a personal access token or SSH key once and never again.",
    },
    {
      label: "Make room for evidence",
      command: "mkdir evidence notes scripts\nprintf 'data/\\n*.pcap\\n' > .gitignore",
      seen: "Three empty folders and a .gitignore, so raw captures and downloaded datasets never get committed.",
      note: "Never commit real data, keys or anything with someone's name in it.",
    },
    {
      label: "Write the README before the work",
      command: "open README.md",
      seen: "Goal, environment, what I did, evidence, findings, limitations. Headings first, blanks underneath.",
      note: "Writing the headings first tells you what to collect while you work, instead of after.",
    },
    {
      label: "Take notes as you go",
      command: "notes/log.md",
      seen: "One line per action: the time, what you ran, what came back, what you decided.",
      note: "This is where your numbers come from. In three days you will not remember why you ruled something out.",
    },
    {
      label: "Commit in small pieces",
      command: 'git add .\ngit commit -m "Add triage table for alerts 1 to 6"',
      seen: "Each commit is a checkpoint with a message you can read back months later.",
      note: "One commit per step of the project. An interviewer can scroll your commits and see how you worked.",
    },
    {
      label: "Push it up",
      command: "git push",
      seen: "Refresh the page on github.com and your README is the front page of the project.",
      note: "Check it in a private window. If it 404s, the repository is still private.",
    },
    {
      label: "Finish it properly",
      command: "git tag v1.0\ngit push --tags",
      seen: "Screenshots in evidence/, the real numbers filled into the README, a tagged version.",
      note: "Copy the repository link into your résumé line and click it once before you send it.",
    },
  ],
  habits: [
    "Small commits beat one giant upload; the history is part of the evidence.",
    "Every screenshot needs a caption saying what it proves.",
    "If something did not work, keep it and say so. Reviewers trust write-ups that admit limits.",
  ],
} as const;

/** How to follow a framework without reading three hundred pages first. */
export const FRAMEWORK_HOWTO = {
  heading: "How to follow a framework, honestly",
  intro: "A framework is a checklist someone argued about for years. You do not read all of it. You use the part that matches your project.",
  steps: [
    { label: "Take one section", body: "Open the framework and find the section that covers your project. Read only that." },
    { label: "Quote the requirement", body: "Put the requirement in your README in its own words, one or two lines, with a link." },
    { label: "Map your steps to it", body: "Beside each step you take, name the item it satisfies. This is what makes the work checkable." },
    { label: "Record where you differ", body: "You will skip something because it needs a budget or a team. Write that down and why. It reads as judgment, not as a gap." },
  ],
  note: "Naming a framework you followed and showing where you diverged is worth more in an interview than listing five you have only heard of.",
} as const;

/** Why these projects are worth the hours, in the terms students actually ask about. */
export const PROJECT_BENEFITS = [
  { label: "Something to say", body: "Interviews ask what you have done. A finished project answers with specifics instead of coursework." },
  { label: "Numbers on your résumé", body: "Records searched, findings confirmed, tests added. Figures a reader can check against your report." },
  { label: "Tools on the page", body: "Each project leaves you with four or five named tools and a framework you have actually used." },
  { label: "Proof you finish", body: "A public repository with a readable history shows follow-through, which is rarer than skill at this stage." },
] as const;
