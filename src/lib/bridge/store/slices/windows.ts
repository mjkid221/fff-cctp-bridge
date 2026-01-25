import type { StateCreator } from "zustand";
import { DEFAULT_WINDOW_POSITIONS } from "../../window-utils";
import type { BridgeState, WindowsSlice } from "../types";

export const createWindowsSlice: StateCreator<
  BridgeState,
  [],
  [],
  WindowsSlice
> = (set, get) => ({
  activeWindow: null,
  windowPositions: { ...DEFAULT_WINDOW_POSITIONS },
  windowZIndexes: {
    "fee-details": 100,
    "transaction-history": 100,
    "bridge-progress": 100,
    disclaimer: 100,
    pong: 100,
    stats: 100,
  },

  setActiveWindow: (window) => set({ activeWindow: window }),

  setWindowPosition: (window, position) =>
    set((state) => ({
      windowPositions: {
        ...state.windowPositions,
        [window]: position,
      },
    })),

  focusWindow: (window) => {
    const { nextZIndex } = get();
    set((state) => ({
      activeWindow: window,
      windowZIndexes: {
        ...state.windowZIndexes,
        [window]: nextZIndex,
      },
      nextZIndex: nextZIndex + 1,
    }));
  },
});
