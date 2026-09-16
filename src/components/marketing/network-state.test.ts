import assert from "node:assert/strict";
import test from "node:test";
import {
  createNetworkState,
  networkReducer,
  type NetworkState,
} from "./network-state";

const nodeIds = ["north-west", "north-east", "south"];

const groupedNodeIds = [
  "north-west-a",
  "north-west-b",
  "north-east-a",
  "north-east-b",
  "west-a",
  "west-b",
  "east-a",
  "east-b",
  "south-west-a",
  "south-west-b",
  "south-east-a",
  "south-east-b",
];

const nodeBranches = Object.fromEntries(
  groupedNodeIds.map((nodeId) => [nodeId, nodeId.replace(/-[ab]$/, "")]),
);

function toggle(state: NetworkState, nodeId: string) {
  return networkReducer(state, { type: "toggle", nodeId }, nodeIds);
}

test("clicking a node selects it and clicking it again clears it", () => {
  const initial = createNetworkState();
  const selected = toggle(initial, "north-west");

  assert.deepEqual(selected, {
    selected: ["north-west"],
    phase: "idle",
    cycle: 0,
  });
  assert.deepEqual(toggle(selected, "north-west"), initial);
});

test("selecting the final node starts one locked completion sequence", () => {
  const first = toggle(createNetworkState(), "north-west");
  const second = toggle(first, "north-east");
  const charging = toggle(second, "south");

  assert.equal(charging.phase, "charging");
  assert.deepEqual(charging.selected, nodeIds);
  assert.strictEqual(toggle(charging, "south"), charging);
});

test("one selected node from every branch completes without selecting every node", () => {
  const selectedIds = [
    "north-west-a",
    "north-east-b",
    "west-a",
    "east-b",
    "south-west-a",
    "south-east-b",
  ];
  const charging = selectedIds.reduce(
    (state, nodeId) =>
      networkReducer(state, { type: "toggle", nodeId }, groupedNodeIds, nodeBranches),
    createNetworkState(),
  );

  assert.equal(charging.phase, "charging");
  assert.deepEqual(charging.selected, selectedIds);
  assert.ok(charging.selected.length < groupedNodeIds.length);
});

test("several stars in one branch do not stand in for a missing branch", () => {
  const selectedIds = [
    "north-west-a",
    "north-west-b",
    "north-east-a",
    "north-east-b",
    "west-a",
    "west-b",
    "east-a",
    "south-west-a",
    "south-west-b",
  ];
  const state = selectedIds.reduce(
    (current, nodeId) =>
      networkReducer(current, { type: "toggle", nodeId }, groupedNodeIds, nodeBranches),
    createNetworkState(),
  );

  assert.equal(state.phase, "idle");
  assert.equal(
    networkReducer(state, { type: "toggle", nodeId: "south-east-b" }, groupedNodeIds, nodeBranches).phase,
    "charging",
  );
});

test("completion fades once and resets every node for another cycle", () => {
  const charging: NetworkState = {
    selected: [...nodeIds],
    phase: "charging",
    cycle: 4,
  };
  const fading = networkReducer(charging, { type: "begin-fade" }, nodeIds);

  assert.equal(fading.phase, "fading");
  assert.strictEqual(
    networkReducer(fading, { type: "begin-fade" }, nodeIds),
    fading,
  );
  assert.deepEqual(networkReducer(fading, { type: "reset" }, nodeIds), {
    selected: [],
    phase: "idle",
    cycle: 5,
  });
});

test("unknown nodes and out-of-order sequence events do nothing", () => {
  const initial = createNetworkState();

  assert.strictEqual(toggle(initial, "not-a-node"), initial);
  assert.strictEqual(
    networkReducer(initial, { type: "begin-fade" }, nodeIds),
    initial,
  );
  assert.strictEqual(networkReducer(initial, { type: "reset" }, nodeIds), initial);
});
