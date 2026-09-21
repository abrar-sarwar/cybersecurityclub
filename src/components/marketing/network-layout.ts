export type Point = readonly [x: number, y: number];

/** Clockwise from the top-left ring, which is also the keyboard order. */
export const BRANCH_IDS = ["north-west", "north-east", "east", "south-east", "south-west", "west"] as const;
export type BranchId = (typeof BRANCH_IDS)[number];

/** Roles within a branch, nearest the shield first. */
export const NODE_ROLES = ["junction", "branch", "spur", "fork", "outer", "tip", "relay", "beacon"] as const;
export type NodeRole = (typeof NODE_ROLES)[number];

const PARENT_ROLE: Record<NodeRole, NodeRole | null> = {
  junction: null,
  branch: "junction",
  spur: "branch",
  fork: "spur",
  outer: "junction",
  tip: "outer",
  relay: "tip",
  beacon: "relay",
};

/** Roles a layout may leave out where there is no room (phones). */
export const OPTIONAL_ROLES = ["fork", "beacon"] as const;
type OptionalRole = (typeof OPTIONAL_ROLES)[number];

/** Steps from the logo ring: junctions are 1, beacons are 5. */
export function roleDepth(role: NodeRole) {
  let depth = 0;
  for (let current: NodeRole | null = role; current; current = PARENT_ROLE[current]) depth++;
  return depth;
}

export const NODE_IDS: readonly string[] = BRANCH_IDS.flatMap((branch) =>
  NODE_ROLES.map((role) => `${branch}-${role}`),
);

export const NODE_BRANCHES: Readonly<Record<string, BranchId>> = Object.fromEntries(
  BRANCH_IDS.flatMap((branch) => NODE_ROLES.map((role) => [`${branch}-${role}`, branch])),
);

/** Stars are drawn like devices on a network map, so neighbours differ in shape. */
export type NodeShape = "pad" | "diamond" | "ring";
const ROLE_SHAPES: Record<NodeRole, NodeShape> = {
  junction: "pad",
  branch: "diamond",
  spur: "ring",
  fork: "diamond",
  outer: "ring",
  tip: "pad",
  relay: "diamond",
  beacon: "ring",
};

/** The service port printed beside each star, in NODE_IDS order. East and west differ on purpose. */
const PORTS = [
  22, 443, 53, 8080, 3389, 1337, 25, 6379,
  80, 445, 21, 5432, 993, 31337, 161, 8443,
  3306, 389, 123, 9200, 4444, 110, 2049, 27017,
  88, 636, 5900, 1433, 69, 6443, 514, 143,
  135, 8888, 179, 5985, 1194, 11211, 500, 2375,
  139, 1812, 873, 9090, 67, 5060, 1521, 8000,
];

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
} & Record<Exclude<NodeRole, OptionalRole>, Point[]> & Partial<Record<OptionalRole, Point[]>> & {
  /**
   * Decorative lines that carry signals in from beyond the network. Each starts
   * at a star and lists its corners; the last point lies outside the stage.
   */
  feeders?: { from: NodeRole; points: Point[] }[];
};

export type LayoutSpec = {
  width: number;
  height: number;
  logo: { top: number; width: number };
  copyTop: number;
  corner: number;
  /** Radius of each node's invisible pointer target. */
  hitRadius: number;
  /** Port label font size, in layout units. */
  labelSize: number;
  /** Feeder lines fade out between these x positions (west side, mirrored east). */
  feederFade: [transparentAt: number, opaqueAt: number];
  /** Speed of the idle signals, in layout units per second. */
  signalSpeed: number;
  branches: Record<WestBranchId, BranchSpec>;
};

export type NodeLabel = { text: string; x: number; y: number; anchor: "start" | "end"; box: Box };
export type NetworkNode = {
  id: string;
  branch: BranchId;
  role: NodeRole;
  depth: number;
  x: number;
  y: number;
  shape: NodeShape;
  /** Placed in whichever diagonal corner around the star is clearest, or left out where none is. */
  label: NodeLabel | null;
};

/** Axis-aligned box: left, top, right, bottom. */
export type Box = readonly [x1: number, y1: number, x2: number, y2: number];

export type NetworkLayout = {
  width: number;
  height: number;
  viewBox: string;
  /** Percentages of the stage, so the raster logo lines up with the SVG. */
  logo: { left: number; top: number; width: number };
  copyTop: number;
  /** Where the heading starts, as a percentage of the stage width (for CSS margins). */
  copyOffset: number;
  hitRadius: number;
  labelSize: number;
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
  /** Path from each ring out to every outermost star, used by the idle signals. */
  outwardRoutes: { id: string; branch: BranchId; d: string }[];
  /**
   * Decorative lines from beyond the stage to a star. `d` is the line itself;
   * `route` continues through the star to its logo ring, for the idle signals.
   */
  feeders: { id: string; branch: BranchId; from: string; points: Point[]; d: string; route: { d: string; length: number } }[];
  feederFade: LayoutSpec["feederFade"];
  signalSpeed: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

/** Gap between two boxes (0 when they overlap). */
export function boxGap(a: Box, b: Box) {
  return Math.hypot(Math.max(0, a[0] - b[2], b[0] - a[2]), Math.max(0, a[1] - b[3], b[1] - a[3]));
}

const polylineLength = (points: readonly Point[]) =>
  points.slice(1).reduce((total, [x, y], index) => total + Math.hypot(x - points[index][0], y - points[index][1]), 0);

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
    // Corners are cut at 45 degrees, the way circuit boards route copper.
    const r = Math.min(radius, inLength / 2, outLength / 2);
    const ax = cx - ((cx - px) / inLength) * r;
    const ay = cy - ((cy - py) / inLength) * r;
    const bx = cx + ((nx - cx) / outLength) * r;
    const by = cy + ((ny - cy) / outLength) * r;
    path.push(`L${round(ax)} ${round(ay)}`, `L${round(bx)} ${round(by)}`);
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
  const feederLines: { id: string; branch: BranchId; from: string; points: Point[] }[] = [];

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
        const corners = branchSpec[role];
        if (!corners || (parentRole && !positions[parentRole])) continue;
        const points = snapToAxes(
          parentRole
            ? [positions[parentRole], ...corners.map(place)]
            : [exitStart, exitEnd, ...branchSpec.junction].map(place),
        );
        positions[role] = points[points.length - 1];
        const id = `${branch}-${role}`;
        segments.set(id, points);
        nodes.push({
          id,
          branch,
          role,
          depth: roleDepth(role),
          x: positions[role][0],
          y: positions[role][1],
          shape: ROLE_SHAPES[role],
          label: null,
        });
      }
      for (const [index, feeder] of (branchSpec.feeders ?? []).entries()) {
        const start = positions[feeder.from];
        if (!start) continue;
        const points = snapToAxes([start, ...feeder.points.map(place)]).reverse();
        feederLines.push({ id: `${branch}-feeder-${index}`, branch, from: `${branch}-${feeder.from}`, points });
      }
    }
  }

  const routeSegments: Record<string, string[]> = {};
  const inwardRoutes: NetworkLayout["inwardRoutes"] = {};
  const inwardPoints: Record<string, Point[]> = {};
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
    inwardPoints[node.id] = inward;
    inwardRoutes[node.id] = { d: pointsToPath(inward, spec.corner), length: polylineLength(inward) };
  }

  const order = new Map(NODE_IDS.map((id, index) => [id, index]));
  nodes.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

  // Port labels: try the four diagonal corners around each star and keep the
  // one furthest from traces, feeders, other stars, earlier labels, the logo
  // and the copy. Diagonals never sit on the star's own orthogonal traces.
  const logoBox: Box = [logoLeft, spec.logo.top, logoLeft + spec.logo.width, spec.logo.top + (spec.logo.width * LOGO.height) / LOGO.width];
  const copyBox: Box = spec.width > 600
    ? [spec.width / 2 - 290, spec.copyTop - 12, spec.width / 2 + 290, spec.height + 60]
    : [-20, spec.copyTop - 24, spec.width + 20, spec.height + 60];
  const lineBoxes: Box[] = [...segments.values(), ...feederLines.map((feeder) => feeder.points)].flatMap((points) =>
    points.slice(1).map(([x, y], index): Box => {
      const [px, py] = points[index];
      return [Math.min(x, px), Math.min(y, py), Math.max(x, px), Math.max(y, py)];
    }),
  );
  const starBoxes: Box[] = nodes.map((node) => [node.x - 7, node.y - 7, node.x + 7, node.y + 7]);
  const labelBoxes: Box[] = [];
  // Outside the hover brackets, which reach 10 units from the star.
  const gap = 11;
  for (const node of nodes) {
    const text = `:${PORTS[order.get(node.id)!]}`;
    const width = text.length * spec.labelSize * 0.6;
    const height = spec.labelSize * 0.72;
    let best: { label: NodeLabel; clearance: number } | null = null;
    for (const [sx, sy] of [[1, -1], [-1, -1], [1, 1], [-1, 1]] as const) {
      const x1 = sx > 0 ? node.x + gap : node.x - gap - width;
      const y1 = sy < 0 ? node.y - gap - height : node.y + gap;
      const box: Box = [x1, y1, x1 + width, y1 + height];
      if (box[0] < 2 || box[2] > spec.width - 2 || box[1] < 0) continue;
      if (boxGap(box, logoBox) === 0 || boxGap(box, copyBox) === 0) continue;
      const clearance = Math.min(
        ...lineBoxes.map((line) => boxGap(box, line)),
        ...starBoxes.map((star, index) => (nodes[index] === node ? Infinity : boxGap(box, star))),
        ...labelBoxes.map((other) => boxGap(box, other) - 2),
      );
      if (!best || clearance > best.clearance + 0.5) {
        best = {
          clearance,
          label: { text, x: sx > 0 ? box[0] : box[2], y: box[3], anchor: sx > 0 ? "start" : "end", box },
        };
      }
    }
    if (best && best.clearance >= 4) {
      node.label = best.label;
      labelBoxes.push(best.label.box);
    }
  }

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
    copyOffset: (spec.copyTop / spec.width) * 100,
    hitRadius: spec.hitRadius,
    labelSize: spec.labelSize,
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
    outwardRoutes: nodes
      .filter((node) => !nodes.some((other) => other.branch === node.branch && PARENT_ROLE[other.role] === node.role))
      .map((leaf) => ({
        id: leaf.id,
        branch: leaf.branch,
        d: pointsToPath(
          routeSegments[leaf.id].toReversed().flatMap((id, index) => {
            const points = segments.get(id)!;
            return index === 0 ? points : points.slice(1);
          }),
          spec.corner,
        ),
      })),
    feeders: feederLines.map((feeder) => {
      const route = [...feeder.points, ...inwardPoints[feeder.from].slice(1)];
      return {
        ...feeder,
        d: pointsToPath(feeder.points, spec.corner),
        route: { d: pointsToPath(route, spec.corner), length: polylineLength(route) },
      };
    }),
    feederFade: spec.feederFade,
    signalSpeed: spec.signalSpeed,
  };
}

export const DESKTOP_LAYOUT = buildNetworkLayout({
  width: 1200,
  height: 500,
  logo: { top: 70, width: 360 },
  copyTop: 356,
  corner: 9,
  hitRadius: 21,
  labelSize: 10,
  feederFade: [-300, 10],
  signalSpeed: 300,
  branches: {
    "north-west": {
      exit: "up",
      exitTo: 52,
      junction: [[404, 52]],
      branch: [[346, 52], [346, 112]],
      spur: [[290, 112]],
      fork: [[236, 112]],
      outer: [[404, 30], [292, 30]],
      tip: [[252, 30], [252, 80], [180, 80]],
      relay: [[180, 124], [120, 124]],
      beacon: [[64, 124], [64, 70]],
      feeders: [
        { from: "beacon", points: [[-480, 70]] },
        { from: "outer", points: [[160, 30], [160, -8], [-480, -8]] },
      ],
    },
    west: {
      exit: "left",
      exitTo: 382,
      junction: [],
      branch: [[382, 230], [300, 230]],
      spur: [[236, 230]],
      fork: [[176, 230], [176, 284]],
      outer: [[382, 162], [268, 162]],
      tip: [[204, 162], [204, 204], [132, 204]],
      relay: [[72, 204], [72, 256]],
      beacon: [[28, 256], [28, 150]],
      feeders: [
        { from: "beacon", points: [[28, 112], [-480, 112]] },
        { from: "relay", points: [[72, 316], [-480, 316]] },
      ],
    },
    "south-west": {
      exit: "left",
      exitTo: 404,
      junction: [],
      branch: [[404, 316], [330, 316]],
      spur: [[290, 316], [290, 384]],
      fork: [[290, 444]],
      outer: [[244, 284], [244, 352]],
      tip: [[244, 430], [150, 430]],
      relay: [[80, 430], [80, 370]],
      beacon: [[28, 370], [28, 448]],
      feeders: [
        { from: "beacon", points: [[28, 484], [-480, 484]] },
        { from: "fork", points: [[290, 520], [-480, 520]] },
      ],
    },
  },
});

/** Phones keep the six core stars per branch, packed around the logo so the copy sits higher. */
export const MOBILE_LAYOUT = buildNetworkLayout({
  width: 390,
  height: 500,
  logo: { top: 110, width: 196 },
  copyTop: 356,
  corner: 6,
  hitRadius: 20,
  labelSize: 8.5,
  feederFade: [-2, 20],
  signalSpeed: 150,
  branches: {
    "north-west": {
      exit: "up",
      exitTo: 68,
      junction: [],
      branch: [[100, 68]],
      spur: [[56, 68]],
      outer: [[145, 24]],
      tip: [[100, 24]],
      relay: [[56, 24]],
      feeders: [{ from: "relay", points: [[-60, 24]] }],
    },
    west: {
      exit: "left",
      exitTo: 68,
      junction: [],
      branch: [[68, 221]],
      spur: [[24, 221]],
      outer: [[68, 133]],
      tip: [[24, 133]],
      relay: [[24, 177]],
      feeders: [
        { from: "tip", points: [[-60, 133]] },
        { from: "spur", points: [[-60, 221]] },
      ],
    },
    "south-west": {
      exit: "down",
      exitTo: 270,
      junction: [],
      branch: [[100, 270]],
      spur: [[56, 270]],
      outer: [[145, 314]],
      tip: [[100, 314]],
      relay: [[56, 314]],
      feeders: [{ from: "relay", points: [[-60, 314]] }],
    },
  },
});
