type Point = readonly [number, number];
type Shape = "pad" | "diamond" | "ring";
type Trace = { points: Point[]; nodes: { at: Point; shape: Shape; label?: string }[]; signal?: number };

/** Panel coordinates: 480 wide, 560 tall, drawn from the screen edge inward. */
const WIDTH = 480;
const HEIGHT = 560;

/**
 * Circuit traces for the left edge of a page hero; the right edge mirrors the
 * routing with its own port labels. Nodes stay in the outer 340 units so the
 * centered heading and copy remain clear, as on the homepage.
 */
const TRACES: Trace[] = [
  { points: [[-10, 92], [152, 92], [152, 146], [318, 146]], nodes: [{ at: [152, 92], shape: "diamond" }, { at: [318, 146], shape: "ring" }], signal: 0 },
  { points: [[236, -10], [236, 44], [392, 44]], nodes: [{ at: [392, 44], shape: "pad" }], signal: 2.6 },
  { points: [[-10, 232], [98, 232], [98, 288], [246, 288]], nodes: [{ at: [98, 232], shape: "pad" }, { at: [246, 288], shape: "diamond" }] },
  { points: [[-10, 368], [194, 368]], nodes: [{ at: [194, 368], shape: "ring" }], signal: 1.3 },
  { points: [[124, 368], [124, 436], [300, 436]], nodes: [{ at: [300, 436], shape: "pad" }] },
  { points: [[-10, 512], [58, 512], [58, 470]], nodes: [{ at: [58, 470], shape: "diamond" }], signal: 3.9 },
];

const LABELS = {
  left: { "318,146": ":443", "392,44": ":22", "246,288": ":8080", "194,368": ":53", "300,436": ":3389", "58,470": ":1337" },
  right: { "318,146": ":6379", "392,44": ":25", "246,288": ":993", "194,368": ":161", "300,436": ":8443", "58,470": ":31337" },
} as const;

function path(points: readonly Point[], radius = 12) {
  const out = [`M${points[0][0]} ${points[0][1]}`];
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const inLength = Math.hypot(cx - px, cy - py);
    const outLength = Math.hypot(nx - cx, ny - cy);
    const r = Math.min(radius, inLength / 2, outLength / 2);
    out.push(`L${cx - ((cx - px) / inLength) * r} ${cy - ((cy - py) / inLength) * r}`, `L${cx + ((nx - cx) / outLength) * r} ${cy + ((ny - cy) / outLength) * r}`);
  }
  const last = points[points.length - 1];
  out.push(`L${last[0]} ${last[1]}`);
  return out.join(" ");
}

function Node({ x, y, shape }: { x: number; y: number; shape: Shape }) {
  return (
    <g className="circuit-node">
      {shape === "pad" ? <rect x={x - 5} y={y - 5} width="10" height="10" rx="1" /> : null}
      {shape === "diamond" ? <path d={`M${x} ${y - 7}L${x + 7} ${y}L${x} ${y + 7}L${x - 7} ${y}Z`} /> : null}
      {shape === "ring" ? <circle cx={x} cy={y} r="5.5" /> : null}
      <circle className="circuit-node-core" cx={x} cy={y} r="2" />
    </g>
  );
}

function Panel({ side }: { side: "left" | "right" }) {
  const flip = (point: Point): Point => (side === "left" ? point : [WIDTH - point[0], point[1]]);
  const labels = LABELS[side] as Record<string, string>;
  return (
    <svg className={`hero-circuit-panel hero-circuit-${side}`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio={side === "left" ? "xMinYMid meet" : "xMaxYMid meet"} aria-hidden="true" focusable="false">
      <g className="circuit-traces">
        {TRACES.map((trace, index) => (
          <path key={index} d={path(trace.points.map(flip))} />
        ))}
      </g>
      <g className="circuit-signals">
        {TRACES.filter((trace) => trace.signal !== undefined).map((trace, index) => (
          <path
            key={index}
            d={path(trace.points.map(flip))}
            pathLength={1}
            style={{ animationDelay: `${(trace.signal ?? 0) + (side === "right" ? 1.7 : 0)}s` }}
          />
        ))}
      </g>
      {TRACES.flatMap((trace) =>
        trace.nodes.map((node) => {
          const [x, y] = flip(node.at);
          const label = labels[`${node.at[0]},${node.at[1]}`];
          return (
            <g key={`${node.at}`}>
              <Node x={x} y={y} shape={node.shape} />
              {label ? (
                <text className="circuit-label" x={side === "left" ? x + 12 : x - 12} y={y - 11} textAnchor={side === "left" ? "start" : "end"}>
                  {label}
                </text>
              ) : null}
            </g>
          );
        }),
      )}
    </svg>
  );
}

/** Decorative circuit edges for page heroes, echoing the homepage network. */
export function HeroCircuit() {
  return (
    <div className="hero-circuit" aria-hidden="true">
      <Panel side="left" />
      <Panel side="right" />
    </div>
  );
}
