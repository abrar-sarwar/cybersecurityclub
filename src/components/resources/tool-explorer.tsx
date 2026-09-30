"use client";

import { useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { withCode } from "@/components/resources/with-code";
import type { Tool, ToolCategory } from "@/content/resources/tools";

/**
 * Pick a tool, read what it is for, then follow "learn next" to another one.
 * The tools it leads to are marked among the chips, so the next step is
 * visible before it is taken.
 */
export function ToolExplorer({ tools, categories }: { tools: readonly Tool[]; categories: Record<ToolCategory, string> }) {
  const [selected, setSelected] = useState(tools[0].id);
  const panel = useRef<HTMLDivElement>(null);
  const tool = tools.find((candidate) => candidate.id === selected) ?? tools[0];
  const nameOf = (id: string) => tools.find((candidate) => candidate.id === id)?.name ?? id;

  function open(id: string) {
    setSelected(id);
    // On a phone the panel sits below the chips; bring it into view if it is not.
    requestAnimationFrame(() => panel.current?.scrollIntoView({ block: "nearest" }));
  }

  return (
    <div className="tool-explorer">
      <div className="tool-chips">
        {(Object.keys(categories) as ToolCategory[]).map((category) => (
          <div key={category} className="tool-group">
            <p className="tool-group-label">{categories[category]}</p>
            <ul>
              {tools
                .filter((candidate) => candidate.category === category)
                .map((candidate) => (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      className="tool-chip"
                      aria-pressed={candidate.id === tool.id}
                      data-next={tool.next.includes(candidate.id) ? "true" : undefined}
                      onClick={() => open(candidate.id)}
                    >
                      {candidate.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="tool-panel" ref={panel} aria-live="polite">
        <p className="careers-label">{categories[tool.category]}</p>
        <h3 className="tool-name">{tool.name}</h3>
        <p className="tool-what">{tool.what}</p>
        <h4 className="tool-heading">Try this first</h4>
        <p className="tool-first">{withCode(tool.first)}</p>
        <p className="tool-links">
          <a href={tool.href} target="_blank" rel="noopener noreferrer" className="careers-inline-link">
            Official site
            <ExternalLink className="ml-1 inline size-3.5" aria-hidden />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {tool.watch ? (
            <a href={tool.watch} target="_blank" rel="noopener noreferrer" className="careers-inline-link">
              Watch a walkthrough
              <ExternalLink className="ml-1 inline size-3.5" aria-hidden />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </p>
        <h4 className="tool-heading">Learn next</h4>
        <ul className="tool-next">
          {tool.next.map((id) => (
            <li key={id}>
              <button type="button" className="tool-chip" data-next="true" onClick={() => open(id)}>
                {nameOf(id)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
