/**
 * A small pretend Linux shell for the practice terminal. Nothing here runs a
 * real command: the "filesystem" is an object in memory, and each command is
 * a function over it. `run` never changes the shell it is given, so the page
 * can keep earlier states and reset by starting again.
 */

export type FileNode = { kind: "file"; content: string; mode: string };
export type DirNode = { kind: "dir"; children: Record<string, Node>; mode: string };
export type Node = FileNode | DirNode;

export type Shell = {
  root: DirNode;
  /** Path segments from the root, so `[]` is `/`. */
  cwd: string[];
  history: string[];
};

export type RunResult = { shell: Shell; output: string[]; clear: boolean };

const USER = "student";
const HOST = "lab";
const HOME = ["home", USER];

/** What the find mission is looking for. */
export const FLAG = "flag{you_can_find_anything_with_find}";
export const HIDDEN_NOTE = "You found a hidden file. Names that start with a dot stay out of a plain ls.";

// Addresses are from the ranges reserved for documentation, so none of them is a real system.
const AUTH_LOG = [
  "Sep 14 02:11:03 lab sshd[2231]: Failed password for invalid user admin from 203.0.113.45 port 51122 ssh2",
  "Sep 14 02:11:05 lab sshd[2233]: Failed password for root from 203.0.113.45 port 51130 ssh2",
  "Sep 14 02:11:06 lab sshd[2235]: Failed password for invalid user test from 203.0.113.45 port 51137 ssh2",
  "Sep 14 02:11:09 lab sshd[2240]: Failed password for root from 203.0.113.45 port 51150 ssh2",
  "Sep 14 08:30:12 lab sshd[3102]: Accepted password for student from 198.51.100.7 port 40022 ssh2",
  "Sep 14 09:02:44 lab sshd[3188]: Failed password for student from 198.51.100.7 port 40110 ssh2",
  "Sep 14 09:02:51 lab sshd[3190]: Accepted password for student from 198.51.100.7 port 40112 ssh2",
  "Sep 14 13:45:20 lab sudo: student : TTY=pts/0 ; PWD=/home/student ; COMMAND=/usr/bin/apt update",
  "Sep 14 22:17:31 lab sshd[4410]: Failed password for root from 203.0.113.45 port 52001 ssh2",
  "Sep 14 22:17:33 lab sshd[4412]: Failed password for root from 203.0.113.45 port 52009 ssh2",
];
export const FAILED_LOGINS = AUTH_LOG.filter((line) => line.includes("Failed")).length;

const file = (content: string, mode = "-rw-r--r--"): FileNode => ({ kind: "file", content, mode });
const dir = (children: Record<string, Node>, mode = "drwxr-xr-x"): DirNode => ({ kind: "dir", children, mode });

export function createShell(): Shell {
  const home = dir({
    "readme.txt": file(
      [
        "Welcome to the practice lab.",
        "",
        "This is a pretend Linux system that lives in your browser tab.",
        "Nothing you type here can break anything, so try things.",
        "Folders end with a slash when you list them.",
      ].join("\n"),
    ),
    ".hidden_note": file(HIDDEN_NOTE),
    logs: dir({
      "auth.log": file(AUTH_LOG.join("\n")),
      "web.log": file(
        [
          '198.51.100.7 - - [14/Sep/2026:08:31:02] "GET / HTTP/1.1" 200 5120',
          '198.51.100.7 - - [14/Sep/2026:08:31:04] "GET /events HTTP/1.1" 200 8841',
          '203.0.113.45 - - [14/Sep/2026:22:18:10] "GET /admin HTTP/1.1" 404 312',
          '203.0.113.45 - - [14/Sep/2026:22:18:11] "GET /login HTTP/1.1" 200 2207',
        ].join("\n"),
      ),
    }),
    projects: dir({
      "ideas.txt": file("1. Read a log and explain what happened.\n2. Write a script that counts failed logins.\n3. Build a home lab."),
      vault: dir({ "club.flag": file(FLAG) }),
    }),
  });
  const root = dir({
    home: dir({ [USER]: home }),
    etc: dir({
      hostname: file(HOST),
      "os-release": file('NAME="Practice Lab"\nPRETTY_NAME="Practice Lab (simulated in your browser)"'),
    }),
    tmp: dir({}, "drwxrwxrwt"),
  });
  return { root, cwd: [...HOME], history: [] };
}

// Paths ------------------------------------------------------------------------

const toPath = (segments: string[]) => `/${segments.join("/")}`;

function tilde(segments: string[]) {
  const inHome = HOME.every((part, index) => segments[index] === part);
  return inHome ? ["~", ...segments.slice(HOME.length)].join("/") : toPath(segments);
}

export function promptOf(shell: Shell) {
  return `${USER}@${HOST}:${tilde(shell.cwd)}$`;
}

function resolve(shell: Shell, path: string): string[] {
  const base = path.startsWith("/") ? [] : path === "~" || path.startsWith("~/") ? [...HOME] : [...shell.cwd];
  const rest = path.startsWith("~") ? path.slice(1) : path;
  for (const part of rest.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") base.pop();
    else base.push(part);
  }
  return base;
}

function lookup(root: DirNode, segments: string[]): Node | undefined {
  let node: Node = root;
  for (const part of segments) {
    if (node.kind !== "dir" || !Object.hasOwn(node.children, part)) return undefined;
    node = node.children[part];
  }
  return node;
}

/** A copy of the tree, plus the parent folder of `segments` inside that copy. */
function edit(shell: Shell, segments: string[]) {
  const root = structuredClone(shell.root);
  const parent = lookup(root, segments.slice(0, -1));
  return { root, parent: parent?.kind === "dir" ? parent : undefined, name: segments[segments.length - 1] };
}

const lines = (content: string) => (content === "" ? [] : content.split("\n"));
const names = (node: DirNode) => Object.keys(node.children).sort((a, b) => a.localeCompare(b));

// Parsing ----------------------------------------------------------------------

type Token = { text: string; quoted: boolean; operator: boolean };
const OPERATORS = ["&&", ">>", "|", ";", ">"];

function tokenize(line: string): Token[] | null {
  const tokens: Token[] = [];
  let text = "";
  let quoted = false;
  let open: string | null = null;
  let started = false;
  const push = () => {
    if (started) tokens.push({ text, quoted, operator: false });
    text = "";
    quoted = false;
    started = false;
  };
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (open) {
      if (char === open) open = null;
      else text += char;
      continue;
    }
    if (char === '"' || char === "'") {
      open = char;
      quoted = true;
      started = true;
      continue;
    }
    if (/\s/.test(char)) {
      push();
      continue;
    }
    const operator = OPERATORS.find((candidate) => line.startsWith(candidate, i));
    if (operator) {
      push();
      tokens.push({ text: operator, quoted: false, operator: true });
      i += operator.length - 1;
      continue;
    }
    text += char;
    started = true;
  }
  if (open) return null;
  push();
  return tokens;
}

/** The command names on a line, in order. Used to check what a learner ran. */
export function commandNames(line: string): string[] {
  const tokens = tokenize(line) ?? [];
  return tokens.filter((token, index) => !token.operator && (index === 0 || ["|", "&&", ";"].includes(tokens[index - 1].operator ? tokens[index - 1].text : ""))).map((token) => token.text);
}

function globToRegExp(pattern: string) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`);
}

/** Expands `*` and `?` in the last part of a path, the way a shell does before a command runs. */
function expand(shell: Shell, token: Token): string[] {
  if (token.quoted || !/[*?]/.test(token.text)) return [token.text];
  const cut = token.text.lastIndexOf("/");
  const head = cut === -1 ? "" : token.text.slice(0, cut + 1);
  const pattern = token.text.slice(cut + 1);
  const folder = lookup(shell.root, resolve(shell, head || "."));
  if (folder?.kind !== "dir") return [token.text];
  const matcher = globToRegExp(pattern);
  const matches = names(folder).filter((name) => matcher.test(name) && (pattern.startsWith(".") || !name.startsWith(".")));
  // No match: the pattern is passed through unchanged, as bash does.
  return matches.length ? matches.map((name) => head + name) : [token.text];
}

// Commands ---------------------------------------------------------------------

type Context = { shell: Shell; args: string[]; stdin: string[] | null };
type Outcome = { out?: string[]; err?: string[]; shell?: Shell; clear?: boolean };
type Command = (context: Context) => Outcome;

/** Splits `-la` style flags from the other arguments. */
function flags(args: string[], known: string) {
  const set = new Set<string>();
  const rest: string[] = [];
  for (const arg of args) {
    if (/^-[a-zA-Z]+$/.test(arg) && [...arg.slice(1)].every((flag) => known.includes(flag))) for (const flag of arg.slice(1)) set.add(flag);
    else rest.push(arg);
  }
  return { set, rest };
}

/** Reads each named file, or standard input when no file is named. */
function inputs(context: Context, command: string, paths: string[]): { sources: { name: string; text: string[] }[]; err: string[] } {
  if (!paths.length) return { sources: [{ name: "", text: context.stdin ?? [] }], err: [] };
  const sources: { name: string; text: string[] }[] = [];
  const err: string[] = [];
  for (const path of paths) {
    const node = lookup(context.shell.root, resolve(context.shell, path));
    if (!node) err.push(`${command}: ${path}: No such file or directory`);
    else if (node.kind === "dir") err.push(`${command}: ${path}: Is a directory`);
    else sources.push({ name: path, text: lines(node.content) });
  }
  return { sources, err };
}

function count(args: string[], fallback: number): { n: number; rest: string[] } {
  const rest = [...args];
  let n = fallback;
  const at = rest.indexOf("-n");
  if (at !== -1 && /^\d+$/.test(rest[at + 1] ?? "")) n = Number(rest.splice(at, 2)[1]);
  const short = rest.findIndex((arg) => /^-\d+$/.test(arg));
  if (short !== -1) n = Number(rest.splice(short, 1)[0].slice(1));
  return { n, rest };
}

function walk(node: Node, path: string, visit: (node: Node, path: string) => void) {
  visit(node, path);
  if (node.kind === "dir") for (const name of names(node)) walk(node.children[name], `${path === "/" ? "" : path}/${name}`, visit);
}

function applyMode(current: string, change: string): string | null {
  const kind = current[0];
  if (/^[0-7]{3}$/.test(change)) {
    const bits = [...change].map((digit) => {
      const value = Number(digit);
      return `${value & 4 ? "r" : "-"}${value & 2 ? "w" : "-"}${value & 1 ? "x" : "-"}`;
    });
    return kind + bits.join("");
  }
  const symbolic = /^([ugoa]*)([+-])([rwx]+)$/.exec(change);
  if (!symbolic) return null;
  const who = symbolic[1] === "" || symbolic[1].includes("a") ? "ugo" : symbolic[1];
  const chars = [...current];
  for (const group of who) {
    const offset = 1 + "ugo".indexOf(group) * 3;
    for (const bit of symbolic[3]) {
      const position = offset + "rwx".indexOf(bit);
      // Without a named group, `+w` only reaches the owner, as the default umask would allow.
      if (symbolic[1] === "" && bit === "w" && group !== "u") continue;
      chars[position] = symbolic[2] === "+" ? bit : "-";
    }
  }
  return chars.join("");
}

const MANUAL: Record<string, { summary: string; usage: string; example: string }> = {
  pwd: { summary: "print the folder you are in", usage: "pwd", example: "pwd" },
  ls: { summary: "list what is in a folder", usage: "ls [-a] [-l] [folder...]", example: "ls -la logs" },
  cd: { summary: "move to another folder", usage: "cd [folder]", example: "cd logs     (cd .. goes up, cd alone goes home)" },
  cat: { summary: "print a file", usage: "cat file...", example: "cat readme.txt" },
  less: { summary: "read a file (here it prints the whole file)", usage: "less file", example: "less logs/auth.log" },
  head: { summary: "print the first lines of a file", usage: "head [-n count] [file]", example: "head -n 3 logs/auth.log" },
  tail: { summary: "print the last lines of a file", usage: "tail [-n count] [file]", example: "tail -n 2 logs/auth.log" },
  grep: { summary: "print the lines that match a pattern", usage: "grep [-i] [-n] [-c] [-v] [-r] pattern [file...]", example: "grep Failed logs/auth.log" },
  find: { summary: "search a folder tree for files by name", usage: "find [folder] [-name pattern] [-type f|d]", example: 'find . -name "*.log"' },
  wc: { summary: "count lines, words and characters", usage: "wc [-l] [-w] [-c] [file...]", example: "grep Failed logs/auth.log | wc -l" },
  sort: { summary: "sort lines", usage: "sort [-r] [-n] [file]", example: "sort names.txt" },
  uniq: { summary: "collapse repeated lines that sit next to each other", usage: "uniq [-c] [file]", example: "sort names.txt | uniq -c" },
  echo: { summary: "print text", usage: "echo text...", example: "echo hello > note.txt" },
  mkdir: { summary: "make a folder", usage: "mkdir [-p] folder...", example: "mkdir notes" },
  touch: { summary: "make an empty file", usage: "touch file...", example: "touch notes/today.txt" },
  cp: { summary: "copy a file", usage: "cp source destination", example: "cp readme.txt backup.txt" },
  mv: { summary: "move or rename", usage: "mv source destination", example: "mv backup.txt notes" },
  rm: { summary: "remove a file, or a folder with -r", usage: "rm [-r] path...", example: "rm backup.txt" },
  chmod: { summary: "change who may read, write or run a file", usage: "chmod mode file...", example: "chmod 600 note.txt     (or chmod +x run.sh)" },
  whoami: { summary: "print your user name", usage: "whoami", example: "whoami" },
  hostname: { summary: "print the name of this machine", usage: "hostname", example: "hostname" },
  history: { summary: "list the commands you have run", usage: "history", example: "history" },
  clear: { summary: "clear the screen", usage: "clear", example: "clear" },
  man: { summary: "show the manual page for a command", usage: "man command", example: "man grep" },
  help: { summary: "list the commands this lab understands", usage: "help", example: "help" },
};

function manual(name: string): string[] {
  const page = MANUAL[name];
  return [`${name} - ${page.summary}`, "", `usage:   ${page.usage}`, `example: ${page.example}`];
}

/** Real tools that make no sense inside a pretend system. */
const UNAVAILABLE = ["ssh", "apt", "apt-get", "nano", "vim", "vi", "python", "python3", "curl", "wget", "ping", "nmap", "top", "ps", "ip", "ss", "git", "su"];

const COMMANDS: Record<string, Command> = {
  pwd: ({ shell }) => ({ out: [toPath(shell.cwd)] }),
  whoami: () => ({ out: [USER] }),
  hostname: () => ({ out: [HOST] }),
  clear: () => ({ clear: true }),
  echo: ({ args }) => ({ out: [args.join(" ")] }),
  history: ({ shell }) => ({ out: shell.history.map((line, index) => `${String(index + 1).padStart(5)}  ${line}`) }),

  help: () => ({
    out: [
      "Commands in the practice lab:",
      ...Object.entries(MANUAL).map(([name, page]) => `  ${name.padEnd(9)}${page.summary}`),
      "",
      "Join commands with a pipe:  grep Failed logs/auth.log | wc -l",
      "Press Tab to finish a name, and the up arrow to bring back a command.",
    ],
  }),

  man: ({ args }) => {
    if (!args.length) return { err: ["What manual page do you want? For example: man ls"] };
    return MANUAL[args[0]] ? { out: manual(args[0]) } : { err: [`No manual entry for ${args[0]}`] };
  },

  cd: ({ shell, args }) => {
    const target = args[0] ?? "~";
    const segments = resolve(shell, target);
    const node = lookup(shell.root, segments);
    if (!node) return { err: [`bash: cd: ${target}: No such file or directory`] };
    if (node.kind !== "dir") return { err: [`bash: cd: ${target}: Not a directory`] };
    return { shell: { ...shell, cwd: segments } };
  },

  ls: ({ shell, args }) => {
    const { set, rest } = flags(args, "la");
    const out: string[] = [];
    const err: string[] = [];
    const row = (name: string, node: Node) => {
      const size = node.kind === "dir" ? 4096 : node.content.length;
      return `${node.mode} 1 ${USER} ${USER} ${String(size).padStart(5)} Sep 14 09:00 ${name}`;
    };
    const label = (name: string, node: Node) => (node.kind === "dir" ? `${name}/` : name);
    const targets = rest.length ? rest : ["."];
    for (const target of targets) {
      const node = lookup(shell.root, resolve(shell, target));
      if (!node) {
        err.push(`ls: cannot access '${target}': No such file or directory`);
        continue;
      }
      if (targets.length > 1 && node.kind === "dir") out.push(`${target}:`);
      if (node.kind === "file") {
        out.push(set.has("l") ? row(target, node) : target);
        continue;
      }
      const shown = names(node).filter((name) => set.has("a") || !name.startsWith("."));
      if (set.has("l")) out.push(...shown.map((name) => row(name, node.children[name])));
      else if (shown.length) out.push(shown.map((name) => label(name, node.children[name])).join("  "));
    }
    return { out, err };
  },

  cat: (context) => {
    const { sources, err } = inputs(context, "cat", context.args);
    return { out: sources.flatMap((source) => source.text), err };
  },

  head: (context) => {
    const { n, rest } = count(context.args, 10);
    const { sources, err } = inputs(context, "head", rest);
    return { out: sources.flatMap((source) => source.text.slice(0, n)), err };
  },

  tail: (context) => {
    const { n, rest } = count(context.args, 10);
    const { sources, err } = inputs(context, "tail", rest);
    return { out: sources.flatMap((source) => (n === 0 ? [] : source.text.slice(-n))), err };
  },

  grep: (context) => {
    const { set, rest } = flags(context.args, "incvr");
    const [pattern, ...paths] = rest;
    if (pattern === undefined) return { err: ["usage: grep [-i] [-n] [-c] [-v] [-r] pattern [file...]"] };
    let matcher: RegExp;
    try {
      matcher = new RegExp(pattern, set.has("i") ? "i" : "");
    } catch {
      matcher = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), set.has("i") ? "i" : "");
    }
    const sources: { name: string; text: string[] }[] = [];
    const err: string[] = [];
    if (!paths.length && !set.has("r")) sources.push({ name: "", text: context.stdin ?? [] });
    for (const path of paths.length ? paths : set.has("r") ? ["."] : []) {
      const node = lookup(context.shell.root, resolve(context.shell, path));
      if (!node) err.push(`grep: ${path}: No such file or directory`);
      else if (node.kind === "file") sources.push({ name: path, text: lines(node.content) });
      else if (!set.has("r")) err.push(`grep: ${path}: Is a directory`);
      else walk(node, path, (child, childPath) => child.kind === "file" && sources.push({ name: childPath, text: lines(child.content) }));
    }
    const named = sources.length > 1 || set.has("r");
    const out: string[] = [];
    for (const source of sources) {
      const hits = source.text.map((text, index) => ({ text, number: index + 1 })).filter((line) => matcher.test(line.text) !== set.has("v"));
      const prefix = named && source.name ? `${source.name}:` : "";
      if (set.has("c")) out.push(`${prefix}${hits.length}`);
      else out.push(...hits.map((hit) => `${prefix}${set.has("n") ? `${hit.number}:` : ""}${hit.text}`));
    }
    return { out, err };
  },

  wc: (context) => {
    const { set, rest } = flags(context.args, "lwc");
    const { sources, err } = inputs(context, "wc", rest);
    const all = set.size === 0;
    const out = sources.map((source) => {
      const text = source.text.join("\n");
      const counts = [
        all || set.has("l") ? source.text.length : null,
        all || set.has("w") ? text.split(/\s+/).filter(Boolean).length : null,
        all || set.has("c") ? text.length + (source.text.length ? 1 : 0) : null,
      ].filter((value) => value !== null);
      return [...counts, source.name].filter((part) => part !== "").join(" ");
    });
    return { out, err };
  },

  sort: (context) => {
    const { set, rest } = flags(context.args, "rn");
    const { sources, err } = inputs(context, "sort", rest);
    const sorted = sources.flatMap((source) => source.text).sort((a, b) => (set.has("n") ? Number.parseFloat(a) - Number.parseFloat(b) || a.localeCompare(b) : a.localeCompare(b)));
    return { out: set.has("r") ? sorted.reverse() : sorted, err };
  },

  uniq: (context) => {
    const { set, rest } = flags(context.args, "c");
    const { sources, err } = inputs(context, "uniq", rest);
    const groups: { text: string; times: number }[] = [];
    for (const text of sources.flatMap((source) => source.text)) {
      const last = groups[groups.length - 1];
      if (last?.text === text) last.times += 1;
      else groups.push({ text, times: 1 });
    }
    return { out: groups.map((group) => (set.has("c") ? `${String(group.times).padStart(7)} ${group.text}` : group.text)), err };
  },

  find: ({ shell, args }) => {
    const start = args[0] && !args[0].startsWith("-") ? args[0] : ".";
    const option = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
    const pattern = option("-name");
    const type = option("-type");
    const node = lookup(shell.root, resolve(shell, start));
    if (!node) return { err: [`find: '${start}': No such file or directory`] };
    const matcher = pattern ? globToRegExp(pattern) : null;
    const out: string[] = [];
    walk(node, start.replace(/\/$/, "") || "/", (child, path) => {
      const name = path.split("/").pop() ?? "";
      if (matcher && !matcher.test(name)) return;
      if (type && (type === "d") !== (child.kind === "dir")) return;
      out.push(path);
    });
    return { out };
  },

  mkdir: ({ shell, args }) => {
    const { set, rest } = flags(args, "p");
    if (!rest.length) return { err: ["mkdir: missing operand"] };
    let current = shell;
    const err: string[] = [];
    for (const path of rest) {
      const segments = resolve(current, path);
      const root = structuredClone(current.root);
      let folder: DirNode = root;
      let failed = false;
      segments.forEach((part, index) => {
        if (failed) return;
        const last = index === segments.length - 1;
        const existing = folder.children[part];
        if (existing?.kind === "dir" && (!last || set.has("p"))) folder = existing;
        else if (existing) {
          err.push(`mkdir: cannot create directory '${path}': File exists`);
          failed = true;
        } else if (last || set.has("p")) {
          folder.children[part] = dir({});
          folder = folder.children[part] as DirNode;
        } else {
          err.push(`mkdir: cannot create directory '${path}': No such file or directory`);
          failed = true;
        }
      });
      if (!failed) current = { ...current, root };
    }
    return { shell: current, err };
  },

  touch: ({ shell, args }) => {
    if (!args.length) return { err: ["touch: missing file operand"] };
    let current = shell;
    const err: string[] = [];
    for (const path of args) {
      const { root, parent, name } = edit(current, resolve(current, path));
      if (!parent || !name) err.push(`touch: cannot touch '${path}': No such file or directory`);
      else {
        parent.children[name] ??= file("");
        current = { ...current, root };
      }
    }
    return { shell: current, err };
  },

  cp: ({ shell, args }) => transfer(shell, args, "cp"),
  mv: ({ shell, args }) => transfer(shell, args, "mv"),

  rm: ({ shell, args }) => {
    const { set, rest } = flags(args, "rf");
    if (!rest.length) return { err: ["rm: missing operand"] };
    let current = shell;
    const err: string[] = [];
    for (const path of rest) {
      const segments = resolve(current, path);
      const { root, parent, name } = edit(current, segments);
      const node = parent && name ? parent.children[name] : undefined;
      if (!parent || !node) err.push(`rm: cannot remove '${path}': No such file or directory`);
      else if (node.kind === "dir" && !set.has("r")) err.push(`rm: cannot remove '${path}': Is a directory`);
      else {
        delete parent.children[name];
        // Removing the folder you are standing in, or one above it, would strand the prompt.
        const inside = segments.every((part, index) => current.cwd[index] === part);
        current = { ...current, root, cwd: inside ? segments.slice(0, -1) : current.cwd };
      }
    }
    return { shell: current, err };
  },

  chmod: ({ shell, args }) => {
    const [change, ...paths] = args;
    if (!change || !paths.length) return { err: ["chmod: missing operand"] };
    let current = shell;
    const err: string[] = [];
    for (const path of paths) {
      const root = structuredClone(current.root);
      const node = lookup(root, resolve(current, path));
      const mode = node ? applyMode(node.mode, change) : null;
      if (!node) err.push(`chmod: cannot access '${path}': No such file or directory`);
      else if (!mode) err.push(`chmod: invalid mode: '${change}'`);
      else {
        node.mode = mode;
        current = { ...current, root };
      }
    }
    return { shell: current, err };
  },
};
COMMANDS.less = COMMANDS.cat;
COMMANDS.more = COMMANDS.cat;

function transfer(shell: Shell, args: string[], command: "cp" | "mv"): Outcome {
  const rest = args.filter((arg) => arg !== "-r");
  if (rest.length < 2) return { err: [`${command}: missing file operand`] };
  const [from, to] = rest;
  const source = resolve(shell, from);
  const root = structuredClone(shell.root);
  const node = lookup(root, source);
  if (!node) return { err: [`${command}: cannot stat '${from}': No such file or directory`] };
  if (command === "cp" && node.kind === "dir" && !args.includes("-r")) return { err: [`cp: -r not specified; omitting directory '${from}'`] };

  let target = resolve(shell, to);
  // Copying or moving into an existing folder keeps the original name.
  if (lookup(root, target)?.kind === "dir") target = [...target, source[source.length - 1]];
  const parent = lookup(root, target.slice(0, -1));
  if (parent?.kind !== "dir" || !target.length) return { err: [`${command}: cannot create '${to}': No such file or directory`] };

  parent.children[target[target.length - 1]] = structuredClone(node);
  if (command === "mv") {
    const old = lookup(root, source.slice(0, -1));
    if (old?.kind === "dir" && toPath(source) !== toPath(target)) delete old.children[source[source.length - 1]];
  }
  return { shell: { ...shell, root } };
}

// Running a line ---------------------------------------------------------------

function runCommand(shell: Shell, argv: string[], stdin: string[] | null): Outcome {
  const [name, ...args] = argv;
  if (name === "sudo") return { err: ["sudo is switched off in the practice lab. Nothing here needs it."] };
  if (name === "exit" || name === "logout") return { err: ["There is nowhere to exit to. Use Reset to start over."] };
  if (UNAVAILABLE.includes(name)) return { err: [`${name} is not available in the practice lab. It needs a real system, and this one is pretend.`] };
  const command = COMMANDS[name];
  if (!command) return { err: [`bash: ${name}: command not found. Type help to see what works here.`] };
  if (args.includes("--help") && MANUAL[name]) return { out: manual(name) };
  return command({ shell, args, stdin });
}

export function run(shell: Shell, line: string): RunResult {
  const trimmed = line.trim();
  if (!trimmed) return { shell, output: [], clear: false };
  let current: Shell = { ...shell, history: [...shell.history, trimmed] };
  const tokens = tokenize(trimmed);
  if (!tokens) return { shell: current, output: ["bash: unexpected end of line while looking for a closing quote"], clear: false };

  const output: string[] = [];
  let clear = false;
  let failed = false;

  // Split on `;` and `&&`, remembering which one came before each part.
  const parts: { joiner: string; tokens: Token[] }[] = [{ joiner: ";", tokens: [] }];
  for (const token of tokens) {
    if (token.operator && (token.text === ";" || token.text === "&&")) parts.push({ joiner: token.text, tokens: [] });
    else parts[parts.length - 1].tokens.push(token);
  }

  for (const part of parts) {
    if (part.joiner === "&&" && failed) break;
    if (!part.tokens.length) continue;
    failed = false;

    // A trailing `> file` or `>> file` sends the result to a file instead of the screen.
    let redirect: { append: boolean; path: string } | null = null;
    const body = [...part.tokens];
    const arrow = body.findIndex((token) => token.operator && (token.text === ">" || token.text === ">>"));
    if (arrow !== -1) {
      const target = body[arrow + 1];
      if (!target || target.operator || arrow + 2 !== body.length) {
        output.push("bash: syntax error near unexpected token `newline'");
        failed = true;
        continue;
      }
      redirect = { append: body[arrow].text === ">>", path: target.text };
      body.splice(arrow);
    }

    const stages: Token[][] = [[]];
    for (const token of body) {
      if (token.operator && token.text === "|") stages.push([]);
      else stages[stages.length - 1].push(token);
    }
    if (stages.some((stage) => !stage.length)) {
      output.push("bash: syntax error near unexpected token `|'");
      failed = true;
      continue;
    }

    let stdin: string[] | null = null;
    for (const stage of stages) {
      const argv = stage.flatMap((token) => expand(current, token));
      const outcome = runCommand(current, argv, stdin);
      if (outcome.err?.length) {
        output.push(...outcome.err);
        failed = true;
      }
      if (outcome.shell) current = { ...outcome.shell, history: current.history };
      if (outcome.clear) clear = true;
      stdin = outcome.out ?? [];
    }

    if (redirect && stdin) {
      const { root, parent, name } = edit(current, resolve(current, redirect.path));
      const existing = parent && name ? parent.children[name] : undefined;
      if (!parent || !name) output.push(`bash: ${redirect.path}: No such file or directory`);
      else if (existing?.kind === "dir") output.push(`bash: ${redirect.path}: Is a directory`);
      else {
        const before = redirect.append && existing ? lines(existing.content) : [];
        parent.children[name] = file([...before, ...stdin].join("\n"), existing?.mode);
        current = { ...current, root };
      }
    } else if (stdin) output.push(...stdin);
  }

  return { shell: current, output: clear ? [] : output, clear };
}

// Completion -------------------------------------------------------------------

function commonPrefix(values: string[]) {
  let prefix = values[0] ?? "";
  for (const value of values) while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  return prefix;
}

/** What Tab does: finish the command or path being typed, as far as it is unambiguous. */
export function complete(shell: Shell, line: string): string {
  const cut = line.lastIndexOf(" ") + 1;
  const word = line.slice(cut);
  if (!word) return line;
  const before = line.slice(0, cut);

  if (!before.trim() || /[|;&]\s*$/.test(before)) {
    const matches = Object.keys(MANUAL).filter((name) => name.startsWith(word));
    if (!matches.length) return line;
    return matches.length === 1 ? `${before}${matches[0]} ` : before + commonPrefix(matches);
  }

  const slash = word.lastIndexOf("/") + 1;
  const head = word.slice(0, slash);
  const partial = word.slice(slash);
  const folder = lookup(shell.root, resolve(shell, head || "."));
  if (folder?.kind !== "dir") return line;
  const matches = names(folder).filter((name) => name.startsWith(partial) && (partial.startsWith(".") || !name.startsWith(".")));
  if (!matches.length) return line;
  if (matches.length > 1) return before + head + commonPrefix(matches);
  const only = matches[0];
  return `${before}${head}${only}${folder.children[only].kind === "dir" ? "/" : " "}`;
}

/** Whether a folder exists and holds at least one file. Used by the missions. */
export function folderHasFile(shell: Shell, path: string): boolean {
  const node = lookup(shell.root, resolve(shell, path));
  return node?.kind === "dir" && Object.values(node.children).some((child) => child.kind === "file");
}

export const homePath = (...parts: string[]) => toPath([...HOME, ...parts]);
export const cwdPath = (shell: Shell) => toPath(shell.cwd);
