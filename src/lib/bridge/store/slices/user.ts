import type { StateCreator } from "zustand";
import type { BridgeState, UserSlice } from "../types";

export const createUserSlice: StateCreator<BridgeState, [], [], UserSlice> = (
  set,
  get,
) => ({
  userAddress: null,
  setUserAddress: (address) => {
    set({ userAddress: address ?? null });
    if (address) {
      void get().loadTransactions();
    } else {
      set({ transactions: [] });
    }
  },
});
