"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AppWindow, Cable, ExternalLink, Laptop, Microscope, MonitorSmartphone, Radar, X, type LucideIcon } from "lucide-react";
import { VideoEmbed } from "@/components/resources/video-embed";
import { withCode } from "@/components/resources/with-code";
import type { Tool, ToolZone } from "@/content/resources/tools";

type Zone = { name: string; node: string; blurb: string; at: readonly [row: number, column: number] };
type Flow = readonly [from: ToolZone, to: ToolZone, carries: string];

const ICONS: Record<ToolZone, LucideIcon> = {
  outside: Laptop,
  web: AppWindow,
  wire: Cable,
  endpoint: MonitorSmartphone,
  soc: Radar,
  bench: Microscope,
};

/** Which way a wire leaves its zone, from the two cells it joins. */
function direction(from: Zone, to: Zone) {
  if (to.at[0] > from.at[0]) return "down";
  return to.at[1] > from.at[1] ? "right" : "left";
}

/**
 * A small company's network drawn as six parts, with each tool placed in the
 * part where it is used and wires showing what passes between them. Choosing
 * a tool opens it in a window over the page.
 */
export function ToolMap({ tools, zones, flows }: { tools: readonly Tool[]; zones: Record<ToolZone, Zone>; flows: readonly Flow[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [pointed, setPointed] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const find = (id: string | null) => tools.find((tool) => tool.id === id);
  const tool = find(open);
  // A tool being read in the window outranks one the pointer happens to be over.
  const leads = (tool ?? find(pointed))?.next ?? [];

  // The element is always mounted; this keeps its open state in step with the chosen tool.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <div className="tool-map-frame">
      <ol className="tool-map">
        {(Object.keys(zones) as ToolZone[]).map((id) => {
          const zone = zones[id];
          const Icon = ICONS[id];
          return (
            <li key={id} className="tool-zone" data-zone={id} style={{ "--row": zone.at[0] + 1, "--column": zone.at[1] + 1 } as CSSProperties}>
              <div className="tool-zone-head">
                <span className="tool-zone-icon">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="tool-zone-name">{zone.name}</h3>
                  <p className="tool-zone-node">{zone.node}</p>
                </div>
              </div>
              <p className="tool-zone-blurb">{zone.blurb}</p>
              <ul className="tool-chips">
                {tools
                  .filter((candidate) => candidate.zone === id)
                  .map((candidate) => (
                    <li key={candidate.id}>
                      <button
                        type="button"
                        className="tool-chip"
                        data-next={leads.includes(candidate.id) ? "true" : undefined}
                        onClick={() => setOpen(candidate.id)}
                        onMouseEnter={() => setPointed(candidate.id)}
                        onMouseLeave={() => setPointed(null)}
                        onFocus={() => setPointed(candidate.id)}
                        onBlur={() => setPointed(null)}
                      >
                        {candidate.name}
                      </button>
                    </li>
                  ))}
              </ul>
              {flows
                .filter(([from]) => from === id)
                .map(([, to, carries], position) => (
                  <span key={to} className="tool-wire" data-direction={direction(zone, zones[to])} style={{ "--delay": `${position * 1.4 + zone.at[1] * 0.7}s` } as CSSProperties} aria-hidden="true">
                    <span className="tool-wire-label">{carries}</span>
                    <i />
                  </span>
                ))}
            </li>
          );
        })}
      </ol>

      <dialog
        ref={dialog}
        className="tool-window"
        aria-labelledby="tool-window-title"
        onClose={() => setOpen(null)}
        // A click that lands on the dialog itself, not its contents, is a click on the backdrop.
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(null);
        }}
      >
        {tool ? (
          <div className="tool-window-frame">
            <div className="tool-window-bar">
              <span className="terminal-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <p className="tool-window-path">
                tools / {zones[tool.zone].name.toLowerCase()} / {tool.id}
              </p>
              <button type="button" className="tool-window-close" onClick={() => setOpen(null)} aria-label="Close">
                <X className="size-4" aria-hidden />
              </button>
            </div>

            {/* Keyed by tool, so moving to the next one starts at the top with its video unplayed. */}
            <div key={tool.id} className="tool-window-body">
              <p className="careers-label">{zones[tool.zone].name}</p>
              <h3 id="tool-window-title" className="tool-name">
                {tool.name}
              </h3>
              <p className="tool-what">{tool.what}</p>

              {tool.depth ? (
                <>
                  <h4 className="tool-heading">Why it matters</h4>
                  <p className="tool-text">{tool.depth.why}</p>
                  <h4 className="tool-heading">How it works</h4>
                  <ol className="careers-numbered tool-how">
                    {tool.depth.how.map((step) => (
                      <li key={step}>{withCode(step)}</li>
                    ))}
                  </ol>
                  <h4 className="tool-heading">Run it step by step</h4>
                  <ol className="careers-numbered tool-run">
                    {tool.depth.run.map((step) => (
                      <li key={step}>{withCode(step)}</li>
                    ))}
                  </ol>
                  <h4 className="tool-heading">Watch it used</h4>
                  <VideoEmbed video={tool.depth.video} />
                </>
              ) : null}

              <h4 className="tool-heading">Try this first</h4>
              <p className="tool-text">{withCode(tool.first)}</p>

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
              <ul className="tool-chips tool-next">
                {tool.next.map((id) => (
                  <li key={id}>
                    <button type="button" className="tool-chip" data-next="true" onClick={() => setOpen(id)}>
                      {find(id)?.name ?? id}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
