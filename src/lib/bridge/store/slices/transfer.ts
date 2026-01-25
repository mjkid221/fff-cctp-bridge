import type { StateCreator } from "zustand";
import type { BridgeState, TransferSlice } from "../types";

export const createTransferSlice: StateCreator<
  BridgeState,
  [],
  [],
  TransferSlice
> = (set) => ({
  transferMethod: "standard",
  setTransferMethod: (transferMethod) => set({ transferMethod }),
});
