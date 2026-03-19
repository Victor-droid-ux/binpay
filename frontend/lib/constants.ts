import { NIGERIAN_STATES } from "./states-data";

// Example: Map centers for each state (replace with real data as needed)
export const STATE_MAP_CENTERS: Record<string, [number, number]> = {
  lagos: [6.5244, 3.3792],
  fct: [9.0579, 7.4951],
  enugu: [6.5244, 7.5086],
  // ...add more as needed
};

// Helper to get LGAs for the current state (replace with real logic as needed)
export function getCurrentStateLGAs(stateCode?: string) {
  if (!stateCode) return [];
  const state = NIGERIAN_STATES[stateCode.toLowerCase()];
  if (!state) return [];
  return state.lgas.map((lga) => ({
    name: lga,
    center: STATE_MAP_CENTERS[stateCode.toLowerCase()] || [0, 0],
    color: "#2563eb",
  }));
}

export { NIGERIAN_STATES };
