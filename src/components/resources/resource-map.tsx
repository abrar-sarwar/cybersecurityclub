"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, FlaskConical, Globe, MessagesSquare, Network, Radar, ShieldCheck, Terminal, Wrench, type LucideIcon } from "lucide-react";
import type { GuideGroup } from "@/content/resources";

export type MapNode = { slug: string; title: string; card: string; group: GuideGroup };

const ICONS: Record<string, LucideIcon> = {
  "network-plus": Network,
  "security-plus": ShieldCheck,
  "interview-prep": MessagesSquare,
  "home-lab": FlaskConical,
  "security-tools": Wrench,
  "soc-practice": Radar,
  "linux-basics": Terminal,
  ctf: Flag,
  "web-security": Globe,
};

/** The boxes sit three to a row, so a link runs across, down, or diagonally through one gap. */
const COLUMNS = 3;
type Direction = "right" | "down" | "down-right" | "down-left";
type Wire = { from: string; to: string; direction: Direction };

function wires(nodes: readonly MapNode[], links: readonly (readonly [string, string])[]): Wire[] {
  const index = new Map(nodes.map((node, position) => [node.slug, position]));
  return links.flatMap(([a, b]) => {
    const first = index.get(a);
    const second = index.get(b);
    if (first === undefined || second === undefined) return [];
    // Drawn from whichever box comes first, so every wire runs rightward or downward.
    const [from, to] = first < second ? [first, second] : [second, first];
    const columns = (to % COLUMNS) - (from % COLUMNS);
    const rows = Math.floor(to / COLUMNS) - Math.floor(from / COLUMNS);
    const direction: Direction = rows === 0 ? "right" : columns === 0 ? "down" : columns > 0 ? "down-right" : "down-left";
    return [{ from: nodes[from].slug, to: nodes[to].slug, direction }];
  });
}

/**
 * The resources as a small network: boxes joined by wires, with a signal
 * running along each one. Pointing at a box, or focusing it, lights what it
 * connects to; the group buttons do the same for one kind of resource, which
 * is what a touch screen gets in place of hover.
 */
export function ResourceMap({
  nodes,
  links,
  groups,
}: {
  nodes: readonly MapNode[];
  links: readonly (readonly [string, string])[];
  groups: Record<GuideGroup, string>;
}) {
  const [pointed, setPointed] = useState<string | null>(null);
  const [group, setGroup] = useState<GuideGroup | null>(null);
  const all = wires(nodes, links);

  const groupOf = (slug: string) => nodes.find((node) => node.slug === slug)?.group;
  const touches = (wire: Wire, slug: string) => wire.from === slug || wire.to === slug;
  const tracing = pointed !== null || group !== null;
  const nodeLit = (slug: string) =>
    pointed !== null ? slug === pointed || all.some((wire) => touches(wire, pointed) && touches(wire, slug)) : groupOf(slug) === group;
  const wireLit = (wire: Wire) => (pointed !== null ? touches(wire, pointed) : groupOf(wire.from) === group && groupOf(wire.to) === group);

  return (
    <div className="resource-map-frame">
      <div className="resource-groups" role="group" aria-label="Trace one kind of guide">
        {(Object.keys(groups) as GuideGroup[]).map((id) => (
          <button key={id} type="button" className="resource-group" data-group={id} aria-pressed={group === id} onClick={() => setGroup(group === id ? null : id)}>
            <span className="resource-group-mark" aria-hidden="true" />
            {groups[id]}
          </button>
        ))}
      </div>

      <ul className="resource-map" data-tracing={tracing ? "" : undefined}>
        {nodes.map((node) => {
          const Icon = ICONS[node.slug] ?? Wrench;
          return (
            <li
              key={node.slug}
              className="resource-node"
              data-slug={node.slug}
              data-group={node.group}
              data-lit={tracing ? nodeLit(node.slug) : undefined}
              onMouseEnter={() => setPointed(node.slug)}
              onMouseLeave={() => setPointed(null)}
              onFocus={() => setPointed(node.slug)}
              onBlur={() => setPointed(null)}
            >
              <span className="resource-node-icon">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="resource-node-title">
                <Link href={`/resources/${node.slug}`} className="resource-node-link">
                  {node.title}
                </Link>
              </h3>
              {/* The group is shown as the icon's colour; this says it in words. */}
              <p className="sr-only">{groups[node.group]}</p>
              <p className="resource-node-card">{node.card}</p>
              {all
                .filter((wire) => wire.from === node.slug)
                .map((wire, position) => (
                  <span
                    key={wire.to}
                    className="resource-link"
                    data-direction={wire.direction}
                    data-lit={tracing ? wireLit(wire) : undefined}
                    style={{ ["--delay" as string]: `${(nodes.indexOf(node) * 1.9 + position * 4.1) % 9}s` }}
                    aria-hidden="true"
                  >
                    <i />
                  </span>
                ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
