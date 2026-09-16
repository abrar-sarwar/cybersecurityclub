import assert from "node:assert/strict";
import test from "node:test";
import {
  BRANCH_IDS,
  DESKTOP_LAYOUT,
  MOBILE_LAYOUT,
  NODE_BRANCHES,
  NODE_IDS,
  type NetworkLayout,
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

test("24 stars split evenly across the six branches", () => {
  assert.equal(NODE_IDS.length, 24);
  for (const branch of BRANCH_IDS) {
    assert.equal(NODE_IDS.filter((id) => NODE_BRANCHES[id] === branch).length, 4);
  }
  for (const [, layout] of layouts) {
    assert.deepEqual(layout.nodes.map((node) => node.id), NODE_IDS);
    assert.equal(layout.segments.length, NODE_IDS.length);
    assert.equal(layout.rings.length, BRANCH_IDS.length);
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

test("traces run horizontally or vertically", () => {
  for (const [name, layout] of layouts) {
    for (const segment of layout.segments) {
      segment.points.slice(1).forEach(([x, y], index) => {
        const [px, py] = segment.points[index];
        assert.ok(x === px || y === py, `${name} ${segment.id} corner ${index + 1}`);
      });
    }
  }
});

test("east branches mirror the west branches", () => {
  for (const [name, layout] of layouts) {
    for (const [west, east] of [["north-west", "north-east"], ["west", "east"], ["south-west", "south-east"]]) {
      for (const role of ["junction", "branch", "outer", "tip"]) {
        const a = layout.nodes.find((node) => node.id === `${west}-${role}`)!;
        const b = layout.nodes.find((node) => node.id === `${east}-${role}`)!;
        assert.ok(Math.abs(a.x + b.x - layout.width) < 0.01 && a.y === b.y, `${name} ${role}`);
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

test("stars and traces stay clear of the heading and buttons", () => {
  const copyTop = (layout: NetworkLayout) => (layout.copyTop / 100) * layout.height;
  const points = (layout: NetworkLayout) => [
    ...layout.nodes.map((node) => ({ id: node.id, x: node.x, y: node.y, margin: layout.hitRadius })),
    ...layout.segments.flatMap((segment) => segment.points.map(([x, y]) => ({ id: segment.id, x, y, margin: 10 }))),
  ];

  // Desktop copy is at most 500 units wide, so anything level with it keeps to the sides.
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
