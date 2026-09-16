export type NetworkPhase = "idle" | "charging" | "fading";

export type NetworkState = {
  selected: string[];
  phase: NetworkPhase;
  cycle: number;
};

export type NetworkAction =
  | { type: "toggle"; nodeId: string }
  | { type: "begin-fade" }
  | { type: "reset" };

export function createNetworkState(): NetworkState {
  return { selected: [], phase: "idle", cycle: 0 };
}

export function networkReducer(
  state: NetworkState,
  action: NetworkAction,
  nodeIds: readonly string[],
  nodeBranches?: Readonly<Record<string, string>>,
): NetworkState {
  if (action.type === "toggle") {
    if (state.phase !== "idle" || !nodeIds.includes(action.nodeId)) return state;

    const selected = state.selected.includes(action.nodeId)
      ? state.selected.filter((nodeId) => nodeId !== action.nodeId)
      : [...state.selected, action.nodeId];

    const selectedBranches = nodeBranches
      ? new Set(selected.map((nodeId) => nodeBranches[nodeId]).filter(Boolean))
      : null;
    const requiredBranches = nodeBranches
      ? new Set(Object.values(nodeBranches))
      : null;
    const isComplete = selectedBranches && requiredBranches
      ? selectedBranches.size === requiredBranches.size
      : selected.length === nodeIds.length;

    return {
      ...state,
      selected,
      phase: isComplete ? "charging" : "idle",
    };
  }

  if (action.type === "begin-fade") {
    return state.phase === "charging" ? { ...state, phase: "fading" } : state;
  }

  if (action.type === "reset" && state.phase === "fading") {
    return { selected: [], phase: "idle", cycle: state.cycle + 1 };
  }

  return state;
}
