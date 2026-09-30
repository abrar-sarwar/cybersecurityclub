import { FAILED_LOGINS, FLAG, HIDDEN_NOTE, commandNames, cwdPath, folderHasFile, homePath, type Shell } from "./shell";

export type MissionContext = {
  before: Shell;
  after: Shell;
  /** The line that was just run. */
  line: string;
  output: string[];
};

export type Mission = {
  id: string;
  title: string;
  /** What to achieve, without giving away the command. */
  goal: string;
  /** One way to do it, shown only on request. */
  hint: string[];
  done: (context: MissionContext) => boolean;
};

const ran = (context: MissionContext, name: string) => commandNames(context.line).includes(name);

/**
 * Ten small tasks that walk through the first commands worth knowing. Each is
 * judged by what happened, not by the exact text typed, so any command that
 * gets the result counts.
 */
export const MISSIONS: readonly Mission[] = [
  {
    id: "where",
    title: "Find out where you are",
    goal: "Every terminal is always inside some folder. Print the one you are in.",
    hint: ["pwd"],
    done: (context) => ran(context, "pwd"),
  },
  {
    id: "look",
    title: "List everything, hidden files too",
    goal: "A plain listing leaves out names that start with a dot. List this folder so that they show.",
    hint: ["ls -a"],
    done: (context) => ran(context, "ls") && context.output.some((line) => line.includes(".hidden_note")),
  },
  {
    id: "read",
    title: "Read the hidden note",
    goal: "Print the contents of the hidden file you just found.",
    hint: ["cat .hidden_note"],
    done: (context) => context.output.includes(HIDDEN_NOTE),
  },
  {
    id: "move",
    title: "Go into the logs folder",
    goal: "Move into the folder named logs. Watch the prompt change when you do.",
    hint: ["cd logs"],
    done: (context) => cwdPath(context.after) === homePath("logs"),
  },
  {
    id: "search",
    title: "Show only the failed logins",
    goal: "The file auth.log records sign-in attempts. Print just the lines that contain the word Failed.",
    hint: ["grep Failed auth.log"],
    done: (context) => ran(context, "grep") && context.output.length === FAILED_LOGINS && context.output.every((line) => line.includes("Failed")),
  },
  {
    id: "count",
    title: "Count them",
    goal: "Do not count by eye. Send the matching lines into a second command that counts lines, using a pipe.",
    hint: ["grep Failed auth.log | wc -l"],
    done: (context) => context.output.length === 1 && context.output[0].trim() === String(FAILED_LOGINS),
  },
  {
    id: "find",
    title: "Find the flag file",
    goal: "Somewhere under your home folder is a file whose name ends in .flag. Go home, then search for it by name.",
    hint: ["cd ~", 'find . -name "*.flag"'],
    done: (context) => ran(context, "find") && context.output.some((line) => line.endsWith("club.flag")),
  },
  {
    id: "flag",
    title: "Read the flag",
    goal: "Print the file you found. Use Tab to finish the long path for you.",
    hint: ["cat projects/vault/club.flag"],
    done: (context) => context.output.includes(FLAG),
  },
  {
    id: "make",
    title: "Make a place for notes",
    goal: "In your home folder, make a folder called notes and put an empty file inside it.",
    hint: ["mkdir ~/notes", "touch ~/notes/today.txt"],
    done: (context) => folderHasFile(context.after, "~/notes"),
  },
  {
    id: "manual",
    title: "Look something up",
    goal: "Every command has a manual page. Open the one for any command you used today.",
    hint: ["man grep"],
    done: (context) => ran(context, "man") && context.output.length > 1,
  },
];
