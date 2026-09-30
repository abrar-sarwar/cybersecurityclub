import assert from "node:assert/strict";
import test from "node:test";
import { MISSIONS } from "./missions";
import { FAILED_LOGINS, FLAG, commandNames, complete, createShell, promptOf, run, type Shell } from "./shell";

/** Runs commands in order and returns the last result. */
function session(lines: string[], start: Shell = createShell()) {
  let shell = start;
  let output: string[] = [];
  let clear = false;
  for (const line of lines) ({ shell, output, clear } = run(shell, line));
  return { shell, output, clear };
}
const out = (...lines: string[]) => session(lines).output;

test("the shell starts in the home folder and can say where it is", () => {
  const shell = createShell();
  assert.equal(promptOf(shell), "student@lab:~$");
  assert.deepEqual(out("pwd"), ["/home/student"]);
  assert.deepEqual(out("whoami"), ["student"]);
  assert.equal(promptOf(session(["cd logs"]).shell), "student@lab:~/logs$");
  assert.equal(promptOf(session(["cd /etc"]).shell), "student@lab:/etc$");
});

test("ls hides dotfiles until asked, and -l shows permissions", () => {
  const plain = out("ls").join(" ");
  assert.match(plain, /readme\.txt/);
  assert.match(plain, /logs\//, "folders are marked");
  assert.doesNotMatch(plain, /\.hidden_note/);
  assert.match(out("ls -a").join(" "), /\.hidden_note/);
  const long = out("ls -la");
  assert.ok(long.some((line) => /^drwx/.test(line) && line.endsWith("logs")), "a folder row");
  assert.ok(long.some((line) => /^-rw/.test(line) && line.endsWith("readme.txt")), "a file row");
  assert.deepEqual(out("ls nope"), ["ls: cannot access 'nope': No such file or directory"]);
  assert.match(out("ls logs").join(" "), /auth\.log/);
});

test("cd moves around and refuses what is not a folder", () => {
  assert.deepEqual(out("cd logs", "pwd"), ["/home/student/logs"]);
  assert.deepEqual(out("cd logs", "cd ..", "pwd"), ["/home/student"]);
  assert.deepEqual(out("cd /etc", "cd", "pwd"), ["/home/student"], "bare cd goes home");
  assert.deepEqual(out("cd ~/projects/vault", "pwd"), ["/home/student/projects/vault"]);
  assert.deepEqual(out("cd nope"), ["bash: cd: nope: No such file or directory"]);
  assert.deepEqual(out("cd readme.txt"), ["bash: cd: readme.txt: Not a directory"]);
  assert.deepEqual(out("cd /", "cd ..", "pwd"), ["/"], "the root is the top");
});

test("cat, head and tail read files", () => {
  assert.ok(out("cat readme.txt").length > 1);
  assert.deepEqual(out("cat nope.txt"), ["cat: nope.txt: No such file or directory"]);
  assert.deepEqual(out("cat logs"), ["cat: logs: Is a directory"]);
  const all = out("cat logs/auth.log");
  assert.deepEqual(out("head -n 2 logs/auth.log"), all.slice(0, 2));
  assert.deepEqual(out("tail -n 1 logs/auth.log"), all.slice(-1));
  assert.deepEqual(out("head -3 logs/auth.log"), all.slice(0, 3));
});

test("grep finds lines, counts them, and takes input from a pipe", () => {
  const failed = out("grep Failed logs/auth.log");
  assert.equal(failed.length, FAILED_LOGINS);
  assert.ok(failed.every((line) => line.includes("Failed")));
  assert.deepEqual(out("grep -c Failed logs/auth.log"), [String(FAILED_LOGINS)]);
  assert.deepEqual(out("grep Failed logs/auth.log | wc -l"), [String(FAILED_LOGINS)]);
  assert.deepEqual(out("cat logs/auth.log | grep Failed | wc -l"), [String(FAILED_LOGINS)]);
  assert.equal(out("grep -i failed logs/auth.log").length, FAILED_LOGINS);
  assert.deepEqual(out("grep failed logs/auth.log"), [], "case matters unless -i");
  assert.match(out("grep -n Accepted logs/auth.log")[0], /^\d+:/);
  assert.equal(out("grep -v Failed logs/auth.log").length, out("cat logs/auth.log").length - FAILED_LOGINS);
  assert.ok(out("grep -r Failed .").every((line) => line.startsWith("./logs/auth.log:")));
  assert.deepEqual(out("grep Failed logs"), ["grep: logs: Is a directory"]);
  assert.deepEqual(out("grep"), ["usage: grep [-i] [-n] [-c] [-v] [-r] pattern [file...]"]);
});

test("sort, uniq and wc work on piped text", () => {
  assert.deepEqual(out("echo b > f", "echo a >> f", "echo b >> f", "sort f"), ["a", "b", "b"]);
  assert.deepEqual(out("echo b > f", "echo a >> f", "echo b >> f", "sort f | uniq -c"), ["      1 a", "      2 b"]);
  assert.deepEqual(out("echo one two three | wc -w"), ["3"]);
});

test("find walks the tree and matches names", () => {
  assert.deepEqual(out('find . -name "*.flag"'), ["./projects/vault/club.flag"]);
  assert.deepEqual(out("find . -name *.flag"), ["./projects/vault/club.flag"], "an unquoted pattern with no local match passes through");
  assert.ok(out("find logs").includes("logs/auth.log"));
  assert.ok(out("find . -type d").every((path) => !path.endsWith(".log")));
  assert.deepEqual(out("cat projects/vault/club.flag"), [FLAG]);
  assert.deepEqual(out("find nope"), ["find: 'nope': No such file or directory"]);
});

test("files and folders can be made, copied, moved and removed", () => {
  assert.match(out("mkdir notes", "ls").join(" "), /notes\//);
  assert.deepEqual(out("mkdir notes", "touch notes/today.txt", "ls notes"), ["today.txt"]);
  assert.deepEqual(out("mkdir logs"), ["mkdir: cannot create directory 'logs': File exists"]);
  assert.deepEqual(out("mkdir -p a/b/c", "cd a/b/c", "pwd"), ["/home/student/a/b/c"]);
  assert.deepEqual(out("cp readme.txt copy.txt", "cat copy.txt"), out("cat readme.txt"));
  assert.doesNotMatch(out("mv readme.txt hello.txt", "ls").join(" "), /readme\.txt/);
  assert.match(out("mv readme.txt logs", "ls logs").join(" "), /readme\.txt/, "moving into a folder keeps the name");
  assert.deepEqual(out("rm logs"), ["rm: cannot remove 'logs': Is a directory"]);
  assert.doesNotMatch(out("rm -r logs", "ls").join(" "), /logs/);
  assert.deepEqual(out("rm nope"), ["rm: cannot remove 'nope': No such file or directory"]);
  assert.deepEqual(out("echo hello > note.txt", "cat note.txt"), ["hello"]);
  assert.deepEqual(out("echo one > n", "echo two >> n", "cat n"), ["one", "two"]);
  assert.match(out("chmod 600 readme.txt", "ls -l readme.txt")[0], /^-rw-------/);
  assert.match(out("touch run.sh", "chmod +x run.sh", "ls -l run.sh")[0], /^-rwxr-xr-x/);
});

test("running a command never changes the shell it was given", () => {
  const shell = createShell();
  const before = JSON.stringify(shell);
  const after = run(shell, "mkdir notes && cd notes && touch a").shell;
  assert.equal(JSON.stringify(shell), before);
  assert.notEqual(JSON.stringify(after), before);
  assert.deepEqual(after.history, ["mkdir notes && cd notes && touch a"]);
});

test("several commands can share a line", () => {
  assert.deepEqual(out("cd logs && pwd"), ["/home/student/logs"]);
  assert.deepEqual(out("cd nope && pwd"), ["bash: cd: nope: No such file or directory"], "&& stops at the first failure");
  assert.deepEqual(out("cd nope; pwd"), ["bash: cd: nope: No such file or directory", "/home/student"]);
  assert.deepEqual(commandNames("cat a | grep b && wc -l; pwd"), ["cat", "grep", "wc", "pwd"]);
});

test("help, man and the manual for a missing page", () => {
  assert.ok(out("help").join("\n").includes("grep"));
  assert.ok(out("man grep").join("\n").includes("grep"));
  assert.ok(out("man grep").length > 2);
  assert.deepEqual(out("man"), ["What manual page do you want? For example: man ls"]);
  assert.deepEqual(out("man nope"), ["No manual entry for nope"]);
  assert.deepEqual(out("ls --help"), out("man ls"));
});

test("things the lab does not have are explained instead of failing silently", () => {
  assert.deepEqual(out("frobnicate"), ["bash: frobnicate: command not found. Type help to see what works here."]);
  assert.match(out("sudo rm -rf /")[0], /sudo is switched off/);
  assert.match(out("ssh bandit0@bandit.labs.overthewire.org")[0], /not available in the practice lab/);
  assert.deepEqual(out(""), []);
  assert.deepEqual(out("   "), []);
  assert.deepEqual(out('echo "unfinished'), ["bash: unexpected end of line while looking for a closing quote"]);
  assert.deepEqual(out("| grep a"), ["bash: syntax error near unexpected token `|'"]);
  assert.deepEqual(out("echo 'a | b'"), ["a | b"], "quotes keep a pipe as text");
  assert.equal(session(["clear"]).clear, true);
  assert.deepEqual(out("pwd", "ls", "history"), ["    1  pwd", "    2  ls", "    3  history"]);
});

test("tab completion fills in commands and paths", () => {
  const shell = createShell();
  assert.equal(complete(shell, "cat re"), "cat readme.txt ");
  assert.equal(complete(shell, "cd lo"), "cd logs/");
  assert.equal(complete(shell, "cat logs/a"), "cat logs/auth.log ");
  assert.equal(complete(shell, "cat .h"), "cat .hidden_note ");
  assert.equal(complete(shell, "who"), "whoami ");
  assert.equal(complete(shell, "cat zzz"), "cat zzz", "nothing to add");
  assert.equal(complete(shell, ""), "");
});

test("following the hints in order finishes every mission", () => {
  assert.equal(MISSIONS.length, 10);
  let shell = createShell();
  for (const mission of MISSIONS) {
    let done = false;
    for (const line of mission.hint) {
      const result = run(shell, line);
      done ||= mission.done({ before: shell, after: result.shell, line, output: result.output });
      shell = result.shell;
    }
    assert.ok(done, `${mission.id} is finished by its own hint`);
    assert.ok(mission.title.length > 5 && mission.goal.length > 20, `${mission.id} explains itself`);
  }
  // A mission is not finished by an unrelated command.
  const fresh = createShell();
  const unrelated = run(fresh, "whoami");
  for (const mission of MISSIONS) {
    assert.equal(mission.done({ before: fresh, after: unrelated.shell, line: "whoami", output: unrelated.output }), false, `${mission.id} needs its own command`);
  }
});
