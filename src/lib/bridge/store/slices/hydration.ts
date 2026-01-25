import type { StateCreator } from "zustand";
import type { BridgeState, HydrationSlice } from "../types";

export const createHydrationSlice: StateCreator<
  BridgeState,
  [],
  [],
  HydrationSlice
> = (set) => ({
  _hasHydrated: false,
  setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
});
