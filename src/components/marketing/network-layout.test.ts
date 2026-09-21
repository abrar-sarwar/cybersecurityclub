import assert from "node:assert/strict";
import test from "node:test";
import {
  BRANCH_IDS,
  DESKTOP_LAYOUT,
  MOBILE_LAYOUT,
  NODE_BRANCHES,
  NODE_IDS,
  NODE_ROLES,
  OPTIONAL_ROLES,
  boxGap,
  type Box,
  type NetworkLayout,
  type Point,
} from "./network-layout";

const layouts: [string, NetworkLayout][] = [
  ["desktop", DESKTOP_LAYOUT],
  ["mobile", MOBILE_LAYOUT],
];

function endpoints(d: string) {
  const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  return {
    start: [numbers[0], numbers[1]],
    end: [numbers[numbers.length - 2], numbers[numbers.length - 1]],
  };
}

const allLines = (layout: NetworkLayout): { id: string; points: readonly Point[] }[] => [
  ...layout.segments,
  ...layout.feeders,
];

test("desktop draws 48 stars; phones keep the six core stars of every branch", () => {
  assert.equal(NODE_IDS.length, 48);
  for (const branch of BRANCH_IDS) {
    assert.equal(NODE_IDS.filter((id) => NODE_BRANCHES[id] === branch).length, NODE_ROLES.length);
  }
  assert.deepEqual(DESKTOP_LAYOUT.nodes.map((node) => node.id), NODE_IDS);
  assert.deepEqual(
    MOBILE_LAYOUT.nodes.map((node) => node.id),
    NODE_IDS.filter((id) => !OPTIONAL_ROLES.some((role) => id.endsWith(`-${role}`))),
  );
  for (const [, layout] of layouts) {
    assert.equal(layout.segments.length, layout.nodes.length);
    assert.equal(layout.rings.length, BRANCH_IDS.length);
    assert.equal(layout.outwardRoutes.length, 2 * BRANCH_IDS.length);
  }
});

test("every star routes inward to the edge of its own logo ring", () => {
  for (const [name, layout] of layouts) {
    for (const node of layout.nodes) {
      const ring = layout.rings.find((candidate) => candidate.branch === node.branch)!;
      const { start, end } = endpoints(layout.inwardRoutes[node.id].d);
      assert.deepEqual(start.map(Math.round), [node.x, node.y].map(Math.round), `${name} ${node.id}`);
      assert.ok(Math.abs(Math.hypot(end[0] - ring.x, end[1] - ring.y) - ring.r) < 0.1, `${name} ${node.id}`);
      assert.ok(layout.inwardRoutes[node.id].length > 0);
      assert.ok(layout.routeSegments[node.id].every((id) => NODE_BRANCHES[id] === node.branch));
    }
  }
});

test("feeder lines start beyond the stage and carry signals through a star to its ring", () => {
  for (const [name, layout] of layouts) {
    assert.ok(layout.feeders.length >= BRANCH_IDS.length, name);
    for (const feeder of layout.feeders) {
      const [x, y] = feeder.points[0];
      assert.ok(x < 0 || x > layout.width || y < 0 || y > layout.height, `${name} ${feeder.id} starts off stage`);
      const star = layout.nodes.find((node) => node.id === feeder.from)!;
      assert.equal(star.branch, feeder.branch);
      assert.deepEqual(feeder.points.at(-1)!.map(Math.round), [star.x, star.y].map(Math.round), `${name} ${feeder.id}`);
      const ring = layout.rings.find((candidate) => candidate.branch === feeder.branch)!;
      const { end } = endpoints(feeder.route.d);
      assert.ok(Math.abs(Math.hypot(end[0] - ring.x, end[1] - ring.y) - ring.r) < 0.1, `${name} ${feeder.id} route`);
      assert.ok(feeder.route.length > layout.inwardRoutes[feeder.from].length);
    }
  }
});

test("traces and feeders run horizontally or vertically", () => {
  for (const [name, layout] of layouts) {
    for (const line of allLines(layout)) {
      line.points.slice(1).forEach(([x, y], index) => {
        const [px, py] = line.points[index];
        assert.ok(x === px || y === py, `${name} ${line.id} corner ${index + 1}`);
      });
    }
  }
});

test("east branches mirror the west branches", () => {
  for (const [name, layout] of layouts) {
    for (const [west, east] of [["north-west", "north-east"], ["west", "east"], ["south-west", "south-east"]]) {
      for (const role of NODE_ROLES) {
        const a = layout.nodes.find((node) => node.id === `${west}-${role}`);
        const b = layout.nodes.find((node) => node.id === `${east}-${role}`);
        assert.equal(Boolean(a), Boolean(b), `${name} ${role}`);
        if (a && b) assert.ok(Math.abs(a.x + b.x - layout.width) < 0.01 && a.y === b.y, `${name} ${role}`);
      }
    }
  }
});

test("hit areas do not overlap, leave the stage, or cover the logo rings", () => {
  for (const [name, layout] of layouts) {
    const r = layout.hitRadius;
    for (const [index, node] of layout.nodes.entries()) {
      assert.ok(node.x - r >= 0 && node.x + r <= layout.width && node.y - r >= 0, `${name} ${node.id} inside stage`);
      for (const other of layout.nodes.slice(index + 1)) {
        assert.ok(Math.hypot(node.x - other.x, node.y - other.y) >= r * 2, `${name} ${node.id} / ${other.id}`);
      }
      for (const ring of layout.rings) {
        assert.ok(Math.hypot(node.x - ring.x, node.y - ring.y) >= ring.r + r, `${name} ${node.id} / ${ring.branch} ring`);
      }
    }
  }
});

test("lines pass beside stars rather than through them", () => {
  for (const [name, layout] of layouts) {
    for (const line of allLines(layout)) {
      const own = new Set([line.id, "from" in line ? line.from : ""]);
      for (const node of layout.nodes) {
        // A trace touches its own star and its parent; a feeder touches its star.
        if (own.has(node.id)) continue;
        const touchesEnd = [line.points[0], line.points.at(-1)!].some(([x, y]) => x === node.x && y === node.y);
        if (touchesEnd) continue;
        line.points.slice(1).forEach(([x, y], index) => {
          const [px, py] = line.points[index];
          const cx = Math.max(Math.min(px, x), Math.min(node.x, Math.max(px, x)));
          const cy = Math.max(Math.min(py, y), Math.min(node.y, Math.max(py, y)));
          assert.ok(Math.hypot(node.x - cx, node.y - cy) >= 12, `${name} ${line.id} crosses ${node.id}`);
        });
      }
    }
  }
});

test("stars and lines stay clear of the heading and buttons", () => {
  const copyTop = (layout: NetworkLayout) => (layout.copyTop / 100) * layout.height;
  const points = (layout: NetworkLayout) => [
    ...layout.nodes.map((node) => ({ id: node.id, x: node.x, y: node.y, margin: layout.hitRadius })),
    ...allLines(layout).flatMap((line) =>
      line.points.flatMap(([x, y], index) => {
        // Sample along each straight run so long feeders are checked end to end.
        if (index === 0) return [{ id: line.id, x, y, margin: 10 }];
        const [px, py] = line.points[index - 1];
        return Array.from({ length: 20 }, (_, step) => ({
          id: line.id,
          x: px + ((x - px) * (step + 1)) / 20,
          y: py + ((y - py) * (step + 1)) / 20,
          margin: 10,
        }));
      }),
    ),
  ];

  // The desktop heading and description are at most about 530 units wide, so
  // anything level with them keeps to the sides.
  for (const point of points(DESKTOP_LAYOUT)) {
    if (point.y + point.margin > copyTop(DESKTOP_LAYOUT) - 8) {
      assert.ok(Math.abs(point.x - DESKTOP_LAYOUT.width / 2) - point.margin >= 280, `desktop ${point.id}`);
    }
  }
  // Mobile copy can span the full width, so the network sits entirely above it.
  for (const point of points(MOBILE_LAYOUT)) {
    assert.ok(point.y + point.margin <= copyTop(MOBILE_LAYOUT) - 20, `mobile ${point.id}`);
  }
});

test("port labels sit clear of lines, stars, each other, the logo and the copy", () => {
  for (const [name, layout] of layouts) {
    const labelled = layout.nodes.filter((node) => node.label);
    assert.ok(labelled.length >= layout.nodes.length - 2, `${name} labels most stars`);
    assert.equal(new Set(labelled.map((node) => node.label!.text)).size, labelled.length, `${name} ports are unique`);

    const lines: Box[] = allLines(layout).flatMap((line) =>
      line.points.slice(1).map(([x, y], index): Box => {
        const [px, py] = line.points[index];
        return [Math.min(x, px), Math.min(y, py), Math.max(x, px), Math.max(y, py)];
      }),
    );
    const logoTop = (layout.logo.top / 100) * layout.height;
    const logoLeft = (layout.logo.left / 100) * layout.width;
    const logoWidth = (layout.logo.width / 100) * layout.width;
    const logo: Box = [logoLeft, logoTop, logoLeft + logoWidth, logoTop + (logoWidth * 542) / 760];
    const copyTop = (layout.copyTop / 100) * layout.height;

    for (const [index, node] of labelled.entries()) {
      const box = node.label!.box;
      assert.ok(box[0] >= 0 && box[2] <= layout.width && box[1] >= 0, `${name} ${node.id} label inside stage`);
      assert.ok(boxGap(box, logo) > 0, `${name} ${node.id} label clear of logo`);
      if (name === "mobile") assert.ok(box[3] <= copyTop - 20, `${name} ${node.id} label above copy`);
      else if (box[3] > copyTop - 8) assert.ok(Math.abs((box[0] + box[2]) / 2 - layout.width / 2) - (box[2] - box[0]) / 2 >= 280, `desktop ${node.id} label beside copy`);
      // Hover brackets reach 10 units from the star.
      assert.ok(boxGap(box, [node.x - 10, node.y - 10, node.x + 10, node.y + 10]) > 0, `${name} ${node.id} label outside brackets`);
      for (const line of lines) assert.ok(boxGap(box, line) >= 4, `${name} ${node.id} label on a line`);
      for (const other of layout.nodes) {
        if (other !== node) assert.ok(boxGap(box, [other.x - 7, other.y - 7, other.x + 7, other.y + 7]) >= 4, `${name} ${node.id} label on ${other.id}`);
      }
      for (const other of labelled.slice(index + 1)) {
        assert.ok(boxGap(box, other.label!.box) > 0, `${name} ${node.id} label on ${other.id} label`);
      }
    }
  }
});

test("stars are drawn in three device shapes", () => {
  for (const [name, layout] of layouts) {
    assert.deepEqual(new Set(layout.nodes.map((node) => node.shape)), new Set(["pad", "diamond", "ring"]), name);
  }
});
