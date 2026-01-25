import type { StateCreator } from "zustand";
import type { BridgeState, UISlice } from "../types";

export const createUISlice: StateCreator<BridgeState, [], [], UISlice> = (
  set,
) => ({
  isLoading: false,
  error: null,
  hasSeenCCTPExplainer: false,
  showCCTPExplainer: false,
  headerControlOrder: [
    "transaction-history-mobile",
    "network-toggle",
    "theme-toggle",
    "search",
    "stats",
    "notifications",
    "wallet",
  ],

  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setHasSeenCCTPExplainer: (seen) => set({ hasSeenCCTPExplainer: seen }),
  setShowCCTPExplainer: (show) => set({ showCCTPExplainer: show }),
  setHeaderControlOrder: (order) => set({ headerControlOrder: order }),
});
