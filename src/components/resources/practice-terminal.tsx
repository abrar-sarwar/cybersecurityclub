"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, RotateCcw } from "lucide-react";
import { MISSIONS } from "@/lib/terminal/missions";
import { complete, createShell, promptOf, run, type Shell } from "@/lib/terminal/shell";

type Line = { id: number; kind: "command" | "output" | "note"; text: string; prompt?: string };

const WELCOME = ["Practice lab. This is a pretend system in your browser, so nothing you type can break anything.", "Type help to see the commands, or follow the mission above."];
/** Enough to scroll back through, without the page growing forever. */
const KEEP = 300;

/**
 * A pretend Linux terminal with ten short missions. Everything runs in the
 * page: the shell is a set of functions over an in-memory folder tree, so
 * there is nothing to install and nothing to damage.
 */
export function PracticeTerminal() {
  const [shell, setShell] = useState<Shell>(createShell);
  const [lines, setLines] = useState<Line[]>(() => WELCOME.map((text, id) => ({ id, kind: "note", text })));
  const [value, setValue] = useState("");
  const [mission, setMission] = useState(0);
  /** Position when stepping back through earlier commands; null while typing a new one. */
  const [recall, setRecall] = useState<number | null>(null);
  const nextId = useRef(WELCOME.length);
  const screen = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // Keep the newest line in view, the way a terminal does.
  useEffect(() => {
    screen.current?.scrollTo({ top: screen.current.scrollHeight });
  }, [lines]);

  const current = MISSIONS[mission];
  const make = (kind: Line["kind"], text: string, prompt?: string): Line => ({ id: nextId.current++, kind, text, prompt });

  function submit() {
    const result = run(shell, value);
    const added = [make("command", value, promptOf(shell)), ...result.output.map((text) => make("output", text))];
    let reached = mission;
    if (current?.done({ before: shell, after: result.shell, line: value, output: result.output })) {
      reached = mission + 1;
      added.push(make("note", reached === MISSIONS.length ? `Mission ${reached} done. That was the last one.` : `Mission ${reached} done: ${current.title.toLowerCase()}.`));
    }
    // `clear` wipes the screen, including the command that asked for it.
    setLines((previous) => (result.clear ? [] : [...previous, ...added].slice(-KEEP)));
    setShell(result.shell);
    setMission(reached);
    setValue("");
    setRecall(null);
  }

  function reset() {
    setShell(createShell());
    setLines(WELCOME.map((text) => make("note", text)));
    setValue("");
    setMission(0);
    setRecall(null);
    input.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const past = shell.history;
    if (event.key === "ArrowUp" && past.length) {
      event.preventDefault();
      const position = recall === null ? past.length - 1 : Math.max(0, recall - 1);
      setRecall(position);
      setValue(past[position]);
    } else if (event.key === "ArrowDown" && recall !== null) {
      event.preventDefault();
      const position = recall + 1;
      setRecall(position < past.length ? position : null);
      setValue(position < past.length ? past[position] : "");
    } else if (event.key === "Tab" && !event.shiftKey) {
      // Only hold on to Tab when it finishes a name; otherwise it moves focus on as usual.
      const completed = complete(shell, value);
      if (completed !== value) {
        event.preventDefault();
        setValue(completed);
      }
    }
  }

  return (
    <div className="practice-terminal">
      <div className="terminal-mission">
        <div className="terminal-mission-head">
          <p className="careers-label">{current ? `Mission ${mission + 1} of ${MISSIONS.length}` : "All missions done"}</p>
          <ol className="terminal-ticks" aria-label={`${mission} of ${MISSIONS.length} missions done`}>
            {MISSIONS.map((item, index) => (
              <li key={item.id} data-state={index < mission ? "done" : index === mission ? "current" : "todo"} title={item.title}>
                {index < mission ? <Check className="size-3" aria-hidden /> : null}
              </li>
            ))}
          </ol>
        </div>
        {current ? (
          <>
            <p className="terminal-mission-title">{current.title}</p>
            <p className="terminal-mission-goal">{current.goal}</p>
            {/* Keyed by mission, so a new one starts with its hint closed. */}
            <details key={current.id} className="terminal-hint">
              <summary>Show a hint</summary>
              <pre>{current.hint.join("\n")}</pre>
            </details>
          </>
        ) : (
          <>
            <p className="terminal-mission-title">You have used the terminal for real work</p>
            <p className="terminal-mission-goal">
              You listed, read, searched, counted, found and created. Keep exploring here, or take the same skills to a real server with OverTheWire Bandit below.
            </p>
          </>
        )}
      </div>

      <div className="terminal-window">
        <div className="terminal-bar">
          <span className="terminal-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="terminal-title">{promptOf(shell).replace(/\$$/, "")}</span>
          <button type="button" className="terminal-reset" onClick={reset}>
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </button>
        </div>
        {/* Clicking anywhere on the screen puts the cursor in the prompt, as in a real terminal. */}
        <div className="terminal-screen" ref={screen} onClick={() => input.current?.focus()}>
          <div role="log" aria-label="Terminal output">
            {lines.map((line) => (
              <p key={line.id} className="terminal-line" data-kind={line.kind}>
                {line.kind === "command" ? <span className="terminal-prompt">{line.prompt} </span> : null}
                {line.text || " "}
              </p>
            ))}
          </div>
          <form
            className="terminal-entry"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label htmlFor="terminal-input" className="terminal-prompt">
              <span className="sr-only">Terminal input. Current folder: </span>
              {promptOf(shell)}
            </label>
            <input
              id="terminal-input"
              ref={input}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setRecall(null);
              }}
              onKeyDown={onKeyDown}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="send"
            />
          </form>
        </div>
      </div>
      <p className="terminal-tips">Enter runs a command. Tab finishes a name. The up arrow brings back the last command.</p>
    </div>
  );
}
