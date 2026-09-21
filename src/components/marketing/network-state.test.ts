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
    autoplay: false,
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
    autoplay: false,
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
    autoplay: false,
  });
});

test("the opening sequence lights every star, charges, then hands the network back", () => {
  const intro = networkReducer(createNetworkState(), { type: "intro" }, nodeIds);
  assert.deepEqual(intro, { selected: nodeIds, phase: "intro", cycle: 0, autoplay: true });
  assert.strictEqual(toggle(intro, "south"), intro, "stars are locked during the opening");

  const charging = networkReducer(intro, { type: "intro-charge" }, nodeIds);
  assert.equal(charging.phase, "charging");
  const fading = networkReducer(charging, { type: "begin-fade" }, nodeIds);
  const reset = networkReducer(fading, { type: "reset" }, nodeIds);
  assert.deepEqual(reset, { selected: [], phase: "idle", cycle: 1, autoplay: true });

  const touched = toggle(reset, "north-west");
  assert.equal(touched.autoplay, false);
  assert.strictEqual(networkReducer(reset, { type: "intro" }, nodeIds), reset, "the opening plays once");
});

test("the opening sequence does not interrupt a visitor who already started", () => {
  const started = toggle(createNetworkState(), "north-west");
  assert.strictEqual(networkReducer(started, { type: "intro" }, nodeIds), started);
  assert.strictEqual(networkReducer(started, { type: "intro-charge" }, nodeIds), started);
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
