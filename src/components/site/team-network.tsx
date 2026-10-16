import { BootReveal } from "@/components/site/boot-reveal";
import { MatrixRain } from "@/components/site/matrix-rain";
import { EXEC_BOARD, type BoardMember } from "@/content/club/board";

/**
 * The board as a pyramid: co-presidents at the apex, vice presidents under
 * them, officers along the base. A base of more than six officers is split
 * into two rows fed from one bus, so names and titles keep their room.
 * Signals cascade down the branches and light each node as they arrive.
 * Decorative, so the roster list carries the same names for anyone not
 * looking at the picture.
 */
const WIDTH = 1000;
/** Officers per base row before a second row is added. */
const BASE_ROW_MAX = 6;
const ROW_GAP = 150;
/** The second row's rail sits this far above its portraits, clear of the first row's titles. */
const RAIL_DROP = 52;
/** Where the bus to the second row runs, left of every label. */
const EDGE = 14;
/** Portrait radii: the two upper tiers sit larger than the base row. */
const APEX_R = 30;
const BASE_R = 24;
const TIER = { top: 92, middle: 258, base: 424 };
const SPINE_Y = 175;
const BRANCH_Y = 350;

type Node = BoardMember & { x: number; y: number; labelAbove: boolean; delay: number; row: number };

/** Long titles wrap onto two lines at their last space, so neighbours never collide. */
function titleLines(role: string): string[] {
  if (role.length <= 15) return [role];
  const at = role.lastIndexOf(" ");
  return at === -1 ? [role] : [role.slice(0, at), role.slice(at + 1)];
}

function layout() {
  const presidents = EXEC_BOARD.filter((m) => m.role.includes("President") && !m.role.includes("Vice"));
  const vices = EXEC_BOARD.filter((m) => m.role.includes("Vice"));
  const officers = EXEC_BOARD.filter((m) => m.group === "officers");

  const spread = (count: number, inset: number) =>
    count === 1
      ? [WIDTH / 2]
      : Array.from({ length: count }, (_, i) => inset + ((WIDTH - inset * 2) / (count - 1)) * i);

  const apexX = spread(presidents.length, 420);
  const middleX = spread(vices.length, 300);
  const half = Math.ceil(officers.length / 2);
  const rows = officers.length > BASE_ROW_MAX ? [officers.slice(0, half), officers.slice(half)] : [officers];

  return {
    apex: presidents.map((member, i): Node => ({ ...member, x: apexX[i], y: TIER.top, labelAbove: true, delay: 0.45, row: 0 })),
    middle: vices.map((member, i): Node => ({ ...member, x: middleX[i], y: TIER.middle, labelAbove: true, delay: 1.1, row: 0 })),
    base: rows.flatMap((row, r) => {
      const xs = spread(row.length, rows.length > 1 ? 110 : 96);
      return row.map((member, i): Node => ({
        ...member,
        x: xs[i],
        y: TIER.base + r * ROW_GAP,
        labelAbove: false,
        delay: 1.85 + (r * half + i) * 0.1,
        row: r,
      }));
    }),
    height: TIER.base + (rows.length - 1) * ROW_GAP + 96,
  };
}

/** Chamfered corners, the routing style used across the site. */
function trace(points: readonly [number, number][], radius = 18) {
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

export function TeamNetwork({ portraits = {} }: { portraits?: Record<string, string> }) {
  const { apex, middle, base, height } = layout();
  const apexMid = (apex[0].x + apex[apex.length - 1].x) / 2;

  // Apex bar, spine, then one branch per vice president.
  const branches = [
    { d: trace([[apex[0].x, TIER.top], [apex[apex.length - 1].x, TIER.top]]), delay: 0 },
    { d: trace([[apexMid, TIER.top], [apexMid, SPINE_Y]]), delay: 0.3 },
    ...middle.map((vice, index) => ({
      d: trace([[apexMid, SPINE_Y], [vice.x, SPINE_Y], [vice.x, TIER.middle]]),
      delay: 0.55 + index * 0.12,
    })),
  ];

  // Both vice presidents run to every officer, so each VP drops onto a shared
  // rail and every officer rises to meet it. A second row hangs off a bus
  // that leaves the rail at the left edge and runs below the first row.
  const firstRow = base.filter((officer) => officer.row === 0);
  const secondRow = base.filter((officer) => officer.row === 1);
  const RAIL_LEFT = secondRow.length ? EDGE : Math.min(...firstRow.map((officer) => officer.x));
  const RAIL_RIGHT = Math.max(...firstRow.map((officer) => officer.x));
  const RAIL2_Y = TIER.base + ROW_GAP - RAIL_DROP;
  const legs = [
    ...middle.map((vice, index) => ({
      d: trace([[vice.x, TIER.middle], [vice.x, BRANCH_Y]]),
      delay: 1.2 + index * 0.1,
    })),
    { d: `M${RAIL_LEFT} ${BRANCH_Y} H${RAIL_RIGHT}`, delay: 1.4 },
    ...firstRow.map((officer, index) => ({
      d: trace([[officer.x, BRANCH_Y], [officer.x, TIER.base]]),
      delay: 1.6 + index * 0.1,
    })),
    ...(secondRow.length
      ? [
          { d: trace([[EDGE, BRANCH_Y], [EDGE, RAIL2_Y], [Math.max(...secondRow.map((officer) => officer.x)), RAIL2_Y]]), delay: 1.5 },
          ...secondRow.map((officer, index) => ({
            d: trace([[officer.x, RAIL2_Y], [officer.x, officer.y]]),
            delay: 1.7 + (firstRow.length + index) * 0.1,
          })),
        ]
      : []),
  ];

  const lines = [...branches, ...legs];
  const nodes = [...apex, ...middle, ...base];

  return (
    <BootReveal className="team-network">
      <div className="team-stage">
        <MatrixRain className="team-rain" speed={1.35} />
        <svg viewBox={`0 0 ${WIDTH} ${height}`} preserveAspectRatio="xMidYMid meet" focusable="false">
          <defs>
            <linearGradient id="team-scan-fade" gradientUnits="userSpaceOnUse" x1="0" x2="120" y1="0" y2="0">
              <stop offset="0" stopColor="#8cc0ff" stopOpacity="0" />
              <stop offset="0.7" stopColor="#8cc0ff" stopOpacity="0.16" />
              <stop offset="1" stopColor="#8cc0ff" stopOpacity="0.5" />
            </linearGradient>
            {/* One clip per node, so a square photo reads as a round portrait. */}
            {nodes.map((node) => (
              <clipPath key={node.slug} id={`team-clip-${node.slug}`}>
                <circle cx={node.x} cy={node.y} r={node.labelAbove ? APEX_R : BASE_R} />
              </clipPath>
            ))}
          </defs>

          <text className="team-boot-label" x="4" y="22" aria-hidden="true">
            ESTABLISHING LINK
          </text>

          <g className="team-traces" aria-hidden="true">
            {lines.map((line, index) => (
              <path key={line.d} d={line.d} pathLength={1} style={{ ["--d" as string]: index < branches.length ? index * 0.08 : 0.3 + (index - branches.length) * 0.05 }} />
            ))}
          </g>
          <g className="team-signals" aria-hidden="true">
            {lines.map((line) => (
              <path key={line.d} d={line.d} pathLength={1} style={{ animationDelay: `${line.delay}s` }} />
            ))}
          </g>

          {nodes.map((node, index) => {
            const radius = node.labelAbove ? APEX_R : BASE_R;
            const nameY = node.y + radius + 22;
            const roleY = nameY + 15;
            const photo = portraits[node.slug];
            const marks = (
              <>
                <circle className="team-node-halo" cx={node.x} cy={node.y} r={radius + 9} />
                {photo ? (
                  <image
                    className="team-node-photo"
                    href={photo}
                    x={node.x - radius}
                    y={node.y - radius}
                    width={radius * 2}
                    height={radius * 2}
                    clipPath={`url(#team-clip-${node.slug})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                ) : (
                  <>
                    <circle className="team-node-blank" cx={node.x} cy={node.y} r={radius} />
                    <text className="team-node-initials" x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central">
                      {node.name.slice(0, 2).toUpperCase()}
                    </text>
                  </>
                )}
                <circle className="team-node-ring" cx={node.x} cy={node.y} r={radius} />
                <text className="team-node-name" x={node.x} y={nameY} textAnchor="middle">
                  {node.name}
                </text>
                <text className="team-node-role" x={node.x} y={roleY} textAnchor="middle">
                  {titleLines(node.role).map((line, lineIndex) => (
                    <tspan key={line} x={node.x} dy={lineIndex === 0 ? 0 : 13}>
                      {line}
                    </tspan>
                  ))}
                </text>
                {/* Generous hit area, so the whole label is clickable, not just the portrait. */}
                <rect className="team-node-hit" x={node.x - 66} y={node.y - radius - 8} width={132} height={radius * 2 + 62} />
              </>
            );
            return (
              <g
                key={node.name}
                className="team-node"
                data-linked={node.linkedin ? "true" : undefined}
                style={{ animationDelay: `${node.delay}s`, ["--i" as string]: index }}
              >
                {node.linkedin ? (
                  <a href={node.linkedin} target="_blank" rel="noopener noreferrer">
                    <title>{`${node.name}, ${node.role}. LinkedIn profile, opens in a new tab.`}</title>
                    {marks}
                  </a>
                ) : (
                  marks
                )}
              </g>
            );
          })}

          {/* One sweep across the diagram as it comes up. */}
          <rect className="team-scan" x={-120} y="0" width="120" height={height} fill="url(#team-scan-fade)" aria-hidden="true" />
        </svg>
      </div>
    </BootReveal>
  );
}
