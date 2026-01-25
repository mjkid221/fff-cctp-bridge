import type { StateCreator } from "zustand";
import type { BridgeState, EnvironmentSlice } from "../types";

export const createEnvironmentSlice: StateCreator<
  BridgeState,
  [],
  [],
  EnvironmentSlice
> = (set) => ({
  environment: "mainnet",
  setEnvironment: (environment) => {
    set({ environment, fromChain: null, toChain: null });
  },
});
