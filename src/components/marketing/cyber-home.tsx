"use client";

import Image from "next/image";
import Link from "next/link";
import { branding } from "@config/branding";
import { PUBLIC_NAV } from "@/components/layout/nav-config";
import {
  useEffect,
  useReducer,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {
  BRANCH_IDS,
  DESKTOP_LAYOUT,
  MOBILE_LAYOUT,
  NODE_BRANCHES,
  NODE_IDS,
  type BranchId,
  type NetworkLayout,
} from "./network-layout";
import type { loadObservatory } from "@/content/observatory";
import { StarField } from "./star-field";
import {
  createNetworkState,
  networkReducer,
  type NetworkAction,
  type NetworkState,
} from "./network-state";

/**
 * Timelines in milliseconds. The opening waits `introDelay` after load and
 * lights the stars outward over `cascade`. Then the charge runs: `travel` is
 * when the pulses reach the shield, `charge` is how long the network stays
 * red, and `fade` is the return to blue.
 */
const SEQUENCE = {
  motion: { introDelay: 450, cascade: 1150, travel: 520, charge: 1300, fade: 650 },
  reduced: { introDelay: 0, cascade: 0, travel: 0, charge: 900, fade: 280 },
} as const;

/** The opening plays once per browser session. */
const INTRO_STORAGE_KEY = "cyber-home-intro-played";

/** Opening cascade: each step outward from the shield, plus a clockwise offset per branch. */
const INTRO_DELAYS: Record<string, number> = Object.fromEntries(
  DESKTOP_LAYOUT.nodes.map((node) => [node.id, (node.depth - 1) * 170 + BRANCH_IDS.indexOf(node.branch) * 30]),
);

const delayStyle = (ms: number) => ({ "--intro-delay": `${ms}ms` }) as CSSProperties;

/**
 * Idle signals: a short dash with a fainter trail travels a route, then rests.
 * Durations follow the route length so every signal moves at the same speed,
 * and golden-ratio offsets keep them from arriving in step. Lengths are
 * fractions of the route (paths use pathLength 1).
 */
function signalStyle(length: number, speed: number, index: number) {
  const travel = length / speed;
  const cycle = travel / 0.55 + (index % 3) * 0.9;
  const head = 18 / length;
  const trail = 84 / length;
  // Offset at which the head has moved past the route's end for the whole rest.
  const end = -cycle / travel;
  return {
    "--signal-cycle": `${cycle.toFixed(2)}s`,
    "--signal-delay": `${(-((index * 0.618) % 1) * cycle).toFixed(2)}s`,
    "--signal-head": head.toFixed(4),
    "--signal-trail": trail.toFixed(4),
    "--signal-head-end": end.toFixed(4),
    "--signal-trail-end": (end + trail - head).toFixed(4),
  } as CSSProperties;
}

const BRANCH_LABELS: Record<BranchId, string> = {
  "north-west": "North-west",
  "north-east": "North-east",
  east: "East",
  "south-east": "South-east",
  "south-west": "South-west",
  west: "West",
};

const LOGO_SRC = "/assets/observatory/gsuicon-transparent.png";
const LOGO_SIZES = "(max-width: 820px) 50vw, 360px";



function layoutStyle(layout: NetworkLayout, prefix: string) {
  return {
    [`--${prefix}-logo-left`]: `${layout.logo.left}%`,
    [`--${prefix}-logo-top`]: `${layout.logo.top}%`,
    [`--${prefix}-logo-width`]: `${layout.logo.width}%`,
    [`--${prefix}-copy-offset`]: `${layout.copyOffset}%`,
    // The stage shape comes from the layout so the logo and copy stay aligned with the SVG.
    [`--${prefix}-aspect`]: `${layout.width} / ${layout.height}`,
    [`--${prefix}-ratio`]: layout.width / layout.height,
  };
}

const LAYOUT_STYLE = {
  ...layoutStyle(DESKTOP_LAYOUT, "desktop"),
  ...layoutStyle(MOBILE_LAYOUT, "mobile"),
};

const CLUB_NAME = "Cybersecurity Club at GSU";

export type Employer = ReturnType<typeof loadObservatory>["employers"][number];

/**
 * Horizontally scrolling logos. The second copy of the list only exists to
 * make the loop seamless, so it is hidden from assistive technology.
 */
function InternshipStrip({ employers }: { employers: Employer[] }) {
  if (!employers.length) return null;
  const items = (decorative: boolean) =>
    employers.map((employer) => {
      if (!employer.logo) {
        return (
          <li key={employer.name} className="internship-item">
            <span className="internship-wordmark">{employer.name}</span>
          </li>
        );
      }
      const { src, width, height, treatment } = employer.logo;
      // Optical sizing: compact marks render taller than long wordmarks.
      const scale = Math.min(1.3, Math.max(0.8, Math.sqrt(4.5 / (width / height))));
      return (
        <li key={employer.name} className="internship-item" style={{ "--logo-scale": scale } as CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element -- small local SVG and PNG marks */}
          <img
            src={src}
            alt={decorative ? "" : employer.name}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            className="internship-logo"
            data-treatment={treatment}
          />
        </li>
      );
    });

  return (
    <section className="internship-strip" aria-labelledby="internships-heading">
      <h2 id="internships-heading">Our members got internships at</h2>
      <div className="internship-window">
        <div className="internship-track">
          <ul className="internship-list">{items(false)}</ul>
          <ul className="internship-list internship-list-copy" aria-hidden="true">{items(true)}</ul>
        </div>
      </div>
    </section>
  );
}


function InteractiveNetwork({
  className,
  idPrefix,
  layout,
  state,
  travel,
  activeNode,
  hoveredNode,
  onActivate,
  onHover,
  onToggle,
}: {
  className: string;
  idPrefix: string;
  layout: NetworkLayout;
  state: NetworkState;
  travel: number;
  activeNode: string;
  hoveredNode: string | null;
  onActivate: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  onToggle: (nodeId: string) => void;
}) {
  const locked = state.phase !== "idle";
  // Phones leave out some stars, so only stars this layout draws take part.
  const nodeIds = layout.nodes.map((node) => node.id);
  const selected = state.selected.filter((nodeId) => nodeId in layout.routeSegments);
  const tabStop = nodeIds.includes(activeNode) ? activeNode : nodeIds[0];
  const nearSegments = new Set(hoveredNode && !locked ? layout.routeSegments[hoveredNode] : []);
  const selectedSegments = new Set(selected.flatMap((nodeId) => layout.routeSegments[nodeId]));
  const connectedBranches = new Set(state.selected.map((nodeId) => NODE_BRANCHES[nodeId]));
  const charging = state.phase === "charging" || state.phase === "fading";
  // Pulses start only from the outermost selected stars; a star whose route is
  // already travelled by a selected star further out adds nothing new.
  const covered = new Set(selected.flatMap((nodeId) => layout.routeSegments[nodeId].slice(1)));
  const pulseSources = charging ? selected.filter((nodeId) => !covered.has(nodeId)) : [];
  const [fadeFrom, fadeTo] = layout.feederFade;
  const fadeBounds = { x: fadeFrom, y: -layout.height, width: layout.width - 2 * fadeFrom, height: layout.height * 3 };
  const fadeMask = `url(#${idPrefix}-feeder-fade)`;
  const longestRoute = Math.max(1, ...pulseSources.map((nodeId) => layout.inwardRoutes[nodeId].length));

  function handleKeyDown(event: KeyboardEvent<SVGGElement>, nodeId: string) {
    const index = nodeIds.indexOf(nodeId);
    const target: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: nodeIds.length - 1,
    };
    if (event.key in target) {
      event.preventDefault();
      const next = nodeIds[(target[event.key] + nodeIds.length) % nodeIds.length];
      event.currentTarget.ownerSVGElement
        ?.querySelector<SVGGElement>(`[data-node="${next}"]`)
        ?.focus();
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
      event.preventDefault();
      onToggle(nodeId);
    }
  }

  return (
    <svg
      className={className}
      viewBox={layout.viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label="Shield network"
      aria-describedby="network-instructions"
      aria-busy={state.phase === "intro"}
    >
      <defs>
        {/* Feeder lines come in from beyond the stage and fade towards the screen edges. */}
        <linearGradient
          id={`${idPrefix}-feeder-gradient`}
          gradientUnits="userSpaceOnUse"
          x1={fadeFrom}
          x2={layout.width - fadeFrom}
          y1="0"
          y2="0"
        >
          <stop offset="0" stopColor="#000" />
          <stop offset={(fadeTo - fadeFrom) / fadeBounds.width} stopColor="#fff" />
          <stop offset={1 - (fadeTo - fadeFrom) / fadeBounds.width} stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${idPrefix}-feeder-fade`} maskUnits="userSpaceOnUse" {...fadeBounds}>
          <rect {...fadeBounds} fill={`url(#${idPrefix}-feeder-gradient)`} />
        </mask>
      </defs>
      <g aria-hidden="true">
        <circle
          className="impact-ring"
          cx={layout.shield.x}
          cy={layout.shield.y}
          r={layout.shield.r}
        />
        <g className="network-feeders" mask={fadeMask}>
          {layout.feeders.map((feeder) => (
            <path
              key={feeder.id}
              d={feeder.d}
              className="network-feeder"
              style={delayStyle(INTRO_DELAYS[feeder.from])}
            />
          ))}
        </g>
        <g className="network-traces">
          {layout.segments.map((segment) => (
            <path
              key={segment.id}
              d={segment.d}
              className="network-trace"
              data-near={nearSegments.has(segment.id)}
              data-selected={selectedSegments.has(segment.id)}
              style={delayStyle(INTRO_DELAYS[segment.id])}
            />
          ))}
        </g>
        {state.phase === "intro" && (
          <g className="intro-traces">
            {layout.segments.map((segment) => (
              <path key={segment.id} d={segment.d} pathLength={1} style={delayStyle(INTRO_DELAYS[segment.id])} />
            ))}
          </g>
        )}
        {layout.rings.map((ring) => (
          <circle
            key={ring.branch}
            className="network-ring"
            cx={ring.x}
            cy={ring.y}
            r={ring.r + layout.hitRadius * 0.24}
            data-near={Boolean(hoveredNode && !locked && NODE_BRANCHES[hoveredNode] === ring.branch)}
            data-connected={connectedBranches.has(ring.branch)}
            style={delayStyle(BRANCH_IDS.indexOf(ring.branch) * 30)}
          />
        ))}
        <g className="ambient-pulses" mask={fadeMask}>
          {layout.feeders.map((feeder, index) => (
            <g key={feeder.id} className="signal" style={signalStyle(feeder.route.length, layout.signalSpeed, index)}>
              <path className="signal-trail" d={feeder.route.d} pathLength={1} />
              <path className="signal-head" d={feeder.route.d} pathLength={1} />
            </g>
          ))}
          {layout.outwardRoutes.map((route, index) => (
            <path
              key={route.id}
              className="signal-outward"
              d={route.d}
              pathLength={1}
              style={{ animationDelay: `${(index * 1.1 + (index % 2) * 0.35).toFixed(2)}s` }}
            />
          ))}
        </g>
        {charging && (
          <g className="charge" key={state.cycle}>
            {pulseSources.map((nodeId) => {
              const route = layout.inwardRoutes[nodeId];
              // Every pulse leaves at the same speed and they all reach the shield together.
              const duration = Math.max(travel * 0.3, (travel * route.length) / longestRoute);
              const timing = {
                "--route-duration": `${Math.round(duration)}ms`,
                "--route-delay": `${Math.round(travel - duration)}ms`,
                "--head-length": Math.min(0.4, 18 / route.length),
              } as CSSProperties;
              return (
                <g key={nodeId} style={timing}>
                  <path className="charge-trail" d={route.d} pathLength={1} />
                  <path className="charge-head" d={route.d} pathLength={1} />
                </g>
              );
            })}
            {layout.rings
              .filter((ring) => connectedBranches.has(ring.branch))
              .map((ring) => (
                <circle
                  key={ring.branch}
                  className="ring-ripple"
                  cx={ring.x}
                  cy={ring.y}
                  r={ring.r + layout.hitRadius * 0.24}
                />
              ))}
          </g>
        )}
      </g>
      <g className="network-nodes">
        {layout.nodes.map((node) => {
          const isSelected = selected.includes(node.id);
          return (
            <g
              key={node.id}
              className="network-node"
              data-node={node.id}
              data-selected={isSelected}
              data-hovered={hoveredNode === node.id}
              role="button"
              tabIndex={node.id === tabStop ? 0 : -1}
              aria-label={`${BRANCH_LABELS[node.branch]} branch, star ${branchIndex(layout, node)} of ${nodeIds.length / BRANCH_IDS.length}`}
              aria-pressed={isSelected}
              aria-disabled={locked}
              onClick={() => onToggle(node.id)}
              onKeyDown={(event) => handleKeyDown(event, node.id)}
              onPointerEnter={() => onHover(node.id)}
              onPointerLeave={() => onHover(null)}
              onFocus={() => {
                onActivate(node.id);
                onHover(node.id);
              }}
              onBlur={() => onHover(null)}
              style={delayStyle(INTRO_DELAYS[node.id])}
            >
              <circle className="node-hit" cx={node.x} cy={node.y} r={layout.hitRadius} />
              <circle className="node-halo" cx={node.x} cy={node.y} r="11" />
              <NodeShape shape={node.shape} x={node.x} y={node.y} />
              {/* Target lock: corner brackets that close in on hover, focus and selection. */}
              <path className="node-glint" d={bracketPath(node.x, node.y)} />
              <circle className="node-visible" cx={node.x} cy={node.y} r="2" />
              {node.label && (
                <text
                  className="node-label"
                  x={node.label.x}
                  y={node.label.y}
                  textAnchor={node.label.anchor}
                  fontSize={layout.labelSize}
                  aria-hidden="true"
                >
                  {node.label.text}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function NodeShape({ shape, x, y }: { shape: NetworkLayout["nodes"][number]["shape"]; x: number; y: number }) {
  if (shape === "pad") return <rect className="node-ring" x={x - 5} y={y - 5} width="10" height="10" rx="1" />;
  if (shape === "diamond") return <path className="node-ring" d={`M${x} ${y - 7}L${x + 7} ${y}L${x} ${y + 7}L${x - 7} ${y}Z`} />;
  return <circle className="node-ring" cx={x} cy={y} r="5.5" />;
}

function bracketPath(x: number, y: number, size = 10, arm = 3.5) {
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]
    .map(([sx, sy]) => `M${x + sx * size} ${y + sy * (size - arm)}V${y + sy * size}H${x + sx * (size - arm)}`)
    .join("");
}

function branchIndex(layout: NetworkLayout, node: NetworkLayout["nodes"][number]) {
  return layout.nodes.filter((other) => other.branch === node.branch).indexOf(node) + 1;
}

function statusMessage(state: NetworkState) {
  // The opening sequence is decoration; only announce what the visitor does.
  if (state.autoplay) return "";
  if (state.phase === "charging") return "All six branches connected. The shield is charged.";
  if (state.phase === "fading") return "";
  const connected = new Set(state.selected.map((nodeId) => NODE_BRANCHES[nodeId])).size;
  if (connected > 0) return `${connected} of ${BRANCH_IDS.length} branches connected.`;
  return state.cycle > 0 ? "Network reset." : "";
}

export function CyberHome({ employers }: { employers: Employer[] }) {
  const [state, dispatch] = useReducer(
    (current: NetworkState, action: NetworkAction) =>
      networkReducer(current, action, NODE_IDS, NODE_BRANCHES),
    undefined,
    createNetworkState,
  );
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState(NODE_IDS[0]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timing = SEQUENCE[reducedMotion ? "reduced" : "motion"];

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  // Opening sequence: once per browser session, never with reduced motion, and
  // only if the visitor has not started clicking yet (the reducer checks that).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (window.sessionStorage.getItem(INTRO_STORAGE_KEY)) return;
    } catch {
      // Storage unavailable: play the opening anyway.
    }
    const timer = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
      } catch {
        // Ignore: the opening simply plays again next time.
      }
      dispatch({ type: "intro" });
    }, SEQUENCE.motion.introDelay);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (state.phase === "idle") return;
    const next = {
      intro: { action: "intro-charge", after: timing.cascade },
      charging: { action: "begin-fade", after: timing.charge },
      fading: { action: "reset", after: timing.fade },
    } as const;
    const step = next[state.phase];
    const timer = window.setTimeout(() => dispatch({ type: step.action }), step.after);
    return () => window.clearTimeout(timer);
  }, [state.phase, timing]);

  function toggleNode(nodeId: string) {
    dispatch({ type: "toggle", nodeId });
  }

  const networkProps = {
    state,
    travel: timing.travel,
    activeNode,
    hoveredNode,
    onActivate: setActiveNode,
    onHover: setHoveredNode,
    onToggle: toggleNode,
  };

  return (
    <section className="cyber-home" aria-labelledby="cyber-home-heading">
      <StarField />
      <nav className="cyber-home-nav" aria-label="Main navigation">
        {PUBLIC_NAV.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="cyber-home-stage">
        <div
          className="network-experience"
          data-phase={state.phase}
          data-cycle={state.cycle}
          data-autoplay={state.autoplay}
          style={{
            ...LAYOUT_STYLE,
            "--travel": `${timing.travel}ms`,
            "--fade": `${timing.fade}ms`,
          } as CSSProperties}
        >
          <div className="cyber-home-copy">
            <h1 id="cyber-home-heading" className="glitch-heading">
              <span className="glitch-text">{CLUB_NAME}</span>
              <span className="glitch-layer glitch-layer-red" aria-hidden="true">{CLUB_NAME}</span>
              <span className="glitch-layer glitch-layer-cyan" aria-hidden="true">{CLUB_NAME}</span>
            </h1>
            <p className="cyber-home-description">
              Georgia State students who learn, build, and compete in security.
            </p>
            <div className="cyber-home-actions">
              <Link className="cyber-primary-action" href="/careers">
                Explore Career Paths
              </Link>
              <a className="cyber-secondary-action" href={branding.links.discordInvite} target="_blank" rel="noopener noreferrer">
                Join Discord
              </a>
            </div>
          </div>

          <div className="network-art">
            <InteractiveNetwork
              className="network-canvas network-canvas-desktop"
              idPrefix="desktop"
              layout={DESKTOP_LAYOUT}
              {...networkProps}
            />
            <InteractiveNetwork
              className="network-canvas network-canvas-mobile"
              idPrefix="mobile"
              layout={MOBILE_LAYOUT}
              {...networkProps}
            />

            <div className="shield-logo">
              <Image
                className="shield-logo-mark"
                src={LOGO_SRC}
                alt="Cybersecurity Club at GSU shield"
                width={760}
                height={542}
                sizes={LOGO_SIZES}
                preload
              />
              <Image
                className="shield-logo-mark shield-logo-alert"
                src={LOGO_SRC}
                alt=""
                aria-hidden="true"
                width={760}
                height={542}
                sizes={LOGO_SIZES}
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>

      <InternshipStrip employers={employers} />
      <div className="cyber-horizon" aria-hidden="true" />
      <p id="network-instructions" className="sr-only">
        Select one star in each of the six branches to charge the shield. Use the arrow keys to move between stars.
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {statusMessage(state)}
      </p>
    </section>
  );
}
