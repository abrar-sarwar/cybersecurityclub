export type Point = readonly [x: number, y: number];

/** Clockwise from the top-left ring, which is also the keyboard order. */
export const BRANCH_IDS = ["north-west", "north-east", "east", "south-east", "south-west", "west"] as const;
export type BranchId = (typeof BRANCH_IDS)[number];

const NODE_ROLES = ["junction", "branch", "outer", "tip"] as const;
type NodeRole = (typeof NODE_ROLES)[number];

const PARENT_ROLE: Record<NodeRole, NodeRole | null> = {
  junction: null,
  branch: "junction",
  outer: "junction",
  tip: "outer",
};

export const NODE_IDS: readonly string[] = BRANCH_IDS.flatMap((branch) =>
  NODE_ROLES.map((role) => `${branch}-${role}`),
);

export const NODE_BRANCHES: Readonly<Record<string, BranchId>> = Object.fromEntries(
  BRANCH_IDS.flatMap((branch) => NODE_ROLES.map((role) => [`${branch}-${role}`, branch])),
);

const EAST_OF = { "north-west": "north-east", west: "east", "south-west": "south-east" } as const;
type WestBranchId = keyof typeof EAST_OF;

/**
 * Measured from public/assets/observatory/gsuicon-transparent.png (760 × 542).
 * The mark is drawn 7.5px right of the image centre, so layouts centre on `axis`.
 */
const LOGO = {
  width: 760,
  height: 542,
  axis: 387.5,
  ringRadius: 61.5,
  shield: [387.5, 268] satisfies Point,
  rings: {
    "north-west": [194.4, 66.6],
    west: [114.2, 259.6],
    "south-west": [194.4, 452.4],
  } satisfies Record<WestBranchId, Point>,
};

type BranchSpec = {
  /** Leaves the logo ring in this direction and stops at `exitTo` on that axis. */
  exit: "up" | "down" | "left";
  exitTo: number;
  /** Each route lists the corners after its parent node; the last point is the node. */
  junction: Point[];
  branch: Point[];
  outer: Point[];
  tip: Point[];
};

export type LayoutSpec = {
  width: number;
  height: number;
  logo: { top: number; width: number };
  copyTop: number;
  corner: number;
  /** Radius of each node's invisible pointer target. */
  hitRadius: number;
  branches: Record<WestBranchId, BranchSpec>;
};

export type NetworkNode = { id: string; branch: BranchId; role: NodeRole; x: number; y: number };

export type NetworkLayout = {
  width: number;
  height: number;
  viewBox: string;
  /** Percentages of the stage, so the raster logo lines up with the SVG. */
  logo: { left: number; top: number; width: number };
  copyTop: number;
  hitRadius: number;
  /** Centre of the shield body, where the completion impact lands. */
  shield: { x: number; y: number; r: number };
  rings: { branch: BranchId; x: number; y: number; r: number }[];
  nodes: NetworkNode[];
  /** One trace per node, drawn from its parent towards the node. */
  segments: { id: string; points: Point[]; d: string }[];
  /** Trace ids from a node back to its logo ring. */
  routeSegments: Record<string, string[]>;
  /** Path from a node inward to the edge of its logo ring. */
  inwardRoutes: Record<string, { d: string; length: number }>;
  /** Path from each ring out to its tip, used by the idle pulses. */
  outwardRoutes: { branch: BranchId; d: string }[];
};

const round = (value: number) => Math.round(value * 100) / 100;

/** Ring centres are fractional, so authored corners within a unit of an axis are snapped onto it. */
function snapToAxes(points: readonly Point[]): Point[] {
  const snapped: Point[] = [points[0]];
  for (const [x, y] of points.slice(1)) {
    const [px, py] = snapped[snapped.length - 1];
    snapped.push([Math.abs(x - px) < 1.5 ? px : x, Math.abs(y - py) < 1.5 ? py : y]);
  }
  return snapped;
}

function pointsToPath(points: readonly Point[], radius: number) {
  const path = [`M${round(points[0][0])} ${round(points[0][1])}`];
  for (let index = 1; index < points.length - 1; index++) {
    const [px, py] = points[index - 1];
    const [cx, cy] = points[index];
    const [nx, ny] = points[index + 1];
    const inLength = Math.hypot(cx - px, cy - py);
    const outLength = Math.hypot(nx - cx, ny - cy);
    const cross = (cx - px) * (ny - cy) - (cy - py) * (nx - cx);
    if (!inLength || !outLength || Math.abs(cross) < 1e-6) {
      path.push(`L${round(cx)} ${round(cy)}`);
      continue;
    }
    const r = Math.min(radius, inLength / 2, outLength / 2);
    const ax = cx - ((cx - px) / inLength) * r;
    const ay = cy - ((cy - py) / inLength) * r;
    const bx = cx + ((nx - cx) / outLength) * r;
    const by = cy + ((ny - cy) / outLength) * r;
    path.push(`L${round(ax)} ${round(ay)}`, `Q${round(cx)} ${round(cy)} ${round(bx)} ${round(by)}`);
  }
  const [lx, ly] = points[points.length - 1];
  path.push(`L${round(lx)} ${round(ly)}`);
  return path.join(" ");
}

export function buildNetworkLayout(spec: LayoutSpec): NetworkLayout {
  const scale = spec.logo.width / LOGO.width;
  const logoLeft = spec.width / 2 - LOGO.axis * scale;
  const ringRadius = LOGO.ringRadius * scale;
  const mirror = ([x, y]: Point): Point => [spec.width - x, y];

  const rings: NetworkLayout["rings"] = [];
  const nodes: NetworkNode[] = [];
  const segments = new Map<string, Point[]>();

  for (const [westId, branchSpec] of Object.entries(spec.branches) as [WestBranchId, BranchSpec][]) {
    const [rx, ry] = LOGO.rings[westId];
    const ring: Point = [logoLeft + rx * scale, spec.logo.top + ry * scale];
    const exitStart: Point =
      branchSpec.exit === "up" ? [ring[0], ring[1] - ringRadius]
        : branchSpec.exit === "down" ? [ring[0], ring[1] + ringRadius]
          : [ring[0] - ringRadius, ring[1]];
    const exitEnd: Point = branchSpec.exit === "left" ? [branchSpec.exitTo, ring[1]] : [ring[0], branchSpec.exitTo];

    for (const [branch, place] of [[westId, (point: Point) => point], [EAST_OF[westId], mirror]] as const) {
      rings.push({ branch, x: place(ring)[0], y: place(ring)[1], r: ringRadius });
      const positions = {} as Record<NodeRole, Point>;
      for (const role of NODE_ROLES) {
        const parentRole = PARENT_ROLE[role];
        const points = snapToAxes(
          parentRole
            ? [positions[parentRole], ...branchSpec[role].map(place)]
            : [exitStart, exitEnd, ...branchSpec.junction].map(place),
        );
        positions[role] = points[points.length - 1];
        const id = `${branch}-${role}`;
        segments.set(id, points);
        nodes.push({ id, branch, role, x: positions[role][0], y: positions[role][1] });
      }
    }
  }

  const routeSegments: Record<string, string[]> = {};
  const inwardRoutes: NetworkLayout["inwardRoutes"] = {};
  for (const node of nodes) {
    const ids: string[] = [];
    let role: NodeRole | null = node.role;
    while (role) {
      ids.push(`${node.branch}-${role}`);
      role = PARENT_ROLE[role];
    }
    routeSegments[node.id] = ids;
    const inward = ids.flatMap((id, index) => {
      const reversed = [...segments.get(id)!].reverse();
      return index === 0 ? reversed : reversed.slice(1);
    });
    inwardRoutes[node.id] = {
      d: pointsToPath(inward, spec.corner),
      length: inward.slice(1).reduce((total, [x, y], index) => total + Math.hypot(x - inward[index][0], y - inward[index][1]), 0),
    };
  }

  const order = new Map(NODE_IDS.map((id, index) => [id, index]));
  nodes.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

  return {
    width: spec.width,
    height: spec.height,
    viewBox: `0 0 ${spec.width} ${spec.height}`,
    logo: {
      left: (logoLeft / spec.width) * 100,
      top: (spec.logo.top / spec.height) * 100,
      width: (spec.logo.width / spec.width) * 100,
    },
    copyTop: (spec.copyTop / spec.height) * 100,
    hitRadius: spec.hitRadius,
    shield: {
      x: spec.width / 2,
      y: spec.logo.top + LOGO.shield[1] * scale,
      r: spec.logo.width * 0.36,
    },
    rings,
    nodes,
    segments: [...segments].map(([id, points]) => ({ id, points, d: pointsToPath(points, spec.corner) })),
    routeSegments,
    inwardRoutes,
    outwardRoutes: BRANCH_IDS.map((branch) => ({
      branch,
      d: pointsToPath(
        routeSegments[`${branch}-tip`].toReversed().flatMap((id, index) => {
          const points = segments.get(id)!;
          return index === 0 ? points : points.slice(1);
        }),
        spec.corner,
      ),
    })),
  };
}

export const DESKTOP_LAYOUT = buildNetworkLayout({
  width: 1200,
  height: 500,
  logo: { top: 70, width: 360 },
  copyTop: 356,
  corner: 8,
  hitRadius: 21,
  branches: {
    "north-west": {
      exit: "up",
      exitTo: 52,
      junction: [[404, 52]],
      branch: [[346, 52], [346, 112]],
      outer: [[404, 30], [292, 30]],
      tip: [[236, 30], [236, 80], [180, 80]],
    },
    west: {
      exit: "left",
      exitTo: 382,
      junction: [],
      branch: [[382, 230], [300, 230]],
      outer: [[382, 162], [268, 162]],
      tip: [[204, 162], [204, 204], [132, 204]],
    },
    "south-west": {
      exit: "left",
      exitTo: 404,
      junction: [],
      branch: [[404, 316], [330, 316]],
      outer: [[244, 284], [244, 352]],
      tip: [[244, 430], [150, 430]],
    },
  },
});

export const MOBILE_LAYOUT = buildNetworkLayout({
  width: 390,
  height: 520,
  logo: { top: 140, width: 196 },
  copyTop: 370,
  corner: 6,
  hitRadius: 20,
  branches: {
    "north-west": {
      exit: "up",
      exitTo: 104,
      junction: [],
      branch: [[98, 104]],
      outer: [[145, 60]],
      tip: [[145, 28], [62, 28]],
    },
    west: {
      exit: "left",
      exitTo: 80,
      junction: [],
      branch: [[34, 207]],
      outer: [[80, 162], [34, 162]],
      tip: [[34, 120]],
    },
    "south-west": {
      exit: "down",
      exitTo: 300,
      junction: [[104, 300]],
      branch: [[104, 326], [150, 326]],
      outer: [[58, 300]],
      tip: [[58, 254]],
    },
  },
});
