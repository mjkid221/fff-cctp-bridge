import type { StateCreator } from "zustand";
import type { BridgeState, ChainsSlice } from "../types";

export const createChainsSlice: StateCreator<
  BridgeState,
  [],
  [],
  ChainsSlice
> = (set, get) => ({
  fromChain: null,
  toChain: null,
  setFromChain: (chain) => set({ fromChain: chain }),
  setToChain: (chain) => set({ toChain: chain }),
  swapChains: () => {
    const { fromChain, toChain } = get();
    set({ fromChain: toChain, toChain: fromChain });
  },
});
