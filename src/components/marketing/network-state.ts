export type NetworkPhase = "idle" | "intro" | "charging" | "fading";

export type NetworkState = {
  selected: string[];
  phase: NetworkPhase;
  cycle: number;
  /** True while the opening sequence (not the visitor) drove the network. */
  autoplay: boolean;
};

export type NetworkAction =
  | { type: "toggle"; nodeId: string }
  | { type: "intro" }
  | { type: "intro-charge" }
  | { type: "begin-fade" }
  | { type: "reset" };

export function createNetworkState(): NetworkState {
  return { selected: [], phase: "idle", cycle: 0, autoplay: false };
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
      autoplay: false,
    };
  }

  // The opening sequence lights every star, but only on a fresh, untouched network.
  if (action.type === "intro") {
    if (state.phase !== "idle" || state.cycle > 0 || state.selected.length) return state;
    return { ...state, selected: [...nodeIds], phase: "intro", autoplay: true };
  }

  if (action.type === "intro-charge") {
    return state.phase === "intro" ? { ...state, phase: "charging" } : state;
  }

  if (action.type === "begin-fade") {
    return state.phase === "charging" ? { ...state, phase: "fading" } : state;
  }

  if (action.type === "reset" && state.phase === "fading") {
    return { selected: [], phase: "idle", cycle: state.cycle + 1, autoplay: state.autoplay };
  }

  return state;
}
