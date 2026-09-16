"use client";

import Image from "next/image";
import Link from "next/link";
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
import {
  createNetworkState,
  networkReducer,
  type NetworkAction,
  type NetworkState,
} from "./network-state";

/**
 * Completion timeline in milliseconds. `travel` is when the pulses reach the shield,
 * `charge` is how long the network stays red, and `fade` is the return to blue.
 */
const SEQUENCE = {
  motion: { travel: 520, charge: 1300, fade: 650 },
  reduced: { travel: 0, charge: 900, fade: 280 },
} as const;

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

type Star = { x: number; y: number; r: number; opacity: number; twinkle: boolean; tint: boolean };

/** Deterministic, so the server and client render the same sky. */
function createStars(count: number): Star[] {
  let seed = 20260916;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const tenth = (value: number) => Math.round(value * 10) / 10;
  return Array.from({ length: count }, (_, index) => {
    const bright = random() > 0.93;
    return {
      x: tenth(random() * 1440),
      y: tenth(random() * 900),
      r: tenth(bright ? 1 + random() * 0.5 : 0.35 + random() * 0.5),
      opacity: tenth(bright ? 0.65 + random() * 0.25 : 0.2 + random() * 0.4),
      twinkle: index % 11 === 0,
      tint: random() > 0.62,
    };
  });
}

const STARS = createStars(170);

function layoutStyle(layout: NetworkLayout, prefix: string) {
  return {
    [`--${prefix}-logo-left`]: `${layout.logo.left}%`,
    [`--${prefix}-logo-top`]: `${layout.logo.top}%`,
    [`--${prefix}-logo-width`]: `${layout.logo.width}%`,
    [`--${prefix}-copy-top`]: `${layout.copyTop}%`,
  };
}

const LAYOUT_STYLE = {
  ...layoutStyle(DESKTOP_LAYOUT, "desktop"),
  ...layoutStyle(MOBILE_LAYOUT, "mobile"),
};

function StarField() {
  return (
    <svg className="cyber-stars" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {STARS.map((star, index) => (
        <circle
          key={index}
          cx={star.x}
          cy={star.y}
          r={star.r}
          className={star.twinkle ? "star is-twinkling" : "star"}
          fill={star.tint ? "#8fb8ff" : "#e3edff"}
          opacity={star.opacity}
          style={star.twinkle ? { animationDelay: `${-(index % 7) * 0.9}s` } : undefined}
        />
      ))}
    </svg>
  );
}

function InteractiveNetwork({
  className,
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
  const nearSegments = new Set(hoveredNode && !locked ? layout.routeSegments[hoveredNode] : []);
  const selectedSegments = new Set(state.selected.flatMap((nodeId) => layout.routeSegments[nodeId]));
  const connectedBranches = new Set(state.selected.map((nodeId) => NODE_BRANCHES[nodeId]));
  const longestRoute = locked
    ? Math.max(...state.selected.map((nodeId) => layout.inwardRoutes[nodeId].length))
    : 0;

  function handleKeyDown(event: KeyboardEvent<SVGGElement>, nodeId: string) {
    const index = NODE_IDS.indexOf(nodeId);
    const target: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: NODE_IDS.length - 1,
    };
    if (event.key in target) {
      event.preventDefault();
      const next = NODE_IDS[(target[event.key] + NODE_IDS.length) % NODE_IDS.length];
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
    >
      <g aria-hidden="true">
        <circle
          className="impact-ring"
          cx={layout.shield.x}
          cy={layout.shield.y}
          r={layout.shield.r}
        />
        <g className="network-traces">
          {layout.segments.map((segment) => (
            <path
              key={segment.id}
              d={segment.d}
              className="network-trace"
              data-near={nearSegments.has(segment.id)}
              data-selected={selectedSegments.has(segment.id)}
            />
          ))}
        </g>
        {layout.rings.map((ring) => (
          <circle
            key={ring.branch}
            className="network-ring"
            cx={ring.x}
            cy={ring.y}
            r={ring.r + layout.hitRadius * 0.24}
            data-near={Boolean(hoveredNode && !locked && NODE_BRANCHES[hoveredNode] === ring.branch)}
            data-connected={connectedBranches.has(ring.branch)}
          />
        ))}
        <g className="ambient-pulses">
          {layout.outwardRoutes.map((route, index) => (
            <path
              key={route.branch}
              d={route.d}
              pathLength={1}
              style={{ animationDelay: `${index * 1.55 + (index % 2) * 0.4}s` }}
            />
          ))}
        </g>
        {locked && (
          <g className="charge" key={state.cycle}>
            {state.selected.map((nodeId) => {
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
          const isSelected = state.selected.includes(node.id);
          const position = NODE_IDS.indexOf(node.id) % 4;
          return (
            <g
              key={node.id}
              className="network-node"
              data-node={node.id}
              data-selected={isSelected}
              data-hovered={hoveredNode === node.id}
              role="button"
              tabIndex={node.id === activeNode ? 0 : -1}
              aria-label={`${BRANCH_LABELS[node.branch]} branch, star ${position + 1} of 4`}
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
            >
              <circle className="node-hit" cx={node.x} cy={node.y} r={layout.hitRadius} />
              <circle className="node-halo" cx={node.x} cy={node.y} r="11" />
              <circle className="node-ring" cx={node.x} cy={node.y} r="6" />
              <path
                className="node-glint"
                d={`M${node.x - 7} ${node.y}H${node.x + 7}M${node.x} ${node.y - 7}V${node.y + 7}`}
              />
              <circle className="node-visible" cx={node.x} cy={node.y} r="2.6" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function statusMessage(state: NetworkState) {
  if (state.phase === "charging") return "All six branches connected. The shield is charged.";
  if (state.phase === "fading") return "";
  const connected = new Set(state.selected.map((nodeId) => NODE_BRANCHES[nodeId])).size;
  if (connected > 0) return `${connected} of ${BRANCH_IDS.length} branches connected.`;
  return state.cycle > 0 ? "Network reset." : "";
}

export function CyberHome() {
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

  useEffect(() => {
    if (state.phase === "idle") return;
    const timer = window.setTimeout(
      () => dispatch({ type: state.phase === "charging" ? "begin-fade" : "reset" }),
      state.phase === "charging" ? timing.charge : timing.fade,
    );
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
        <Link href="/about">About</Link>
        <Link href="/events">Events</Link>
        <Link href="/community">Community</Link>
      </nav>

      <div className="cyber-home-stage">
        <div
          className="network-experience"
          data-phase={state.phase}
          data-cycle={state.cycle}
          style={{
            ...LAYOUT_STYLE,
            "--travel": `${timing.travel}ms`,
            "--fade": `${timing.fade}ms`,
          } as CSSProperties}
        >
          <div className="cyber-home-copy">
            <h1 id="cyber-home-heading">Cybersecurity Club at GSU</h1>
            <div className="cyber-home-actions">
              <Link className="cyber-primary-action" href="/join">
                Register Now
              </Link>
              <Link className="cyber-secondary-action" href="/sign-in" prefetch={false}>
                Log In
              </Link>
            </div>
          </div>

          <InteractiveNetwork
            className="network-canvas network-canvas-desktop"
            layout={DESKTOP_LAYOUT}
            {...networkProps}
          />
          <InteractiveNetwork
            className="network-canvas network-canvas-mobile"
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
