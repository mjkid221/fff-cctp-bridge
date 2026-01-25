/**
 * Bridge store with Zustand slice pattern
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BridgeState } from "./types";
import {
  createHydrationSlice,
  createEnvironmentSlice,
  createTransferSlice,
  createUserSlice,
  createChainsSlice,
  createTransactionSlice,
  createWindowsSlice,
  createTransactionWindowsSlice,
  createUISlice,
} from "./slices";

// Re-export types
export type { BridgeState, TransactionWindow } from "./types";

/**
 * Combined bridge store with persistence
 */
export const useBridgeStore = create<BridgeState>()(
  persist(
    (...args) => ({
      ...createHydrationSlice(...args),
      ...createEnvironmentSlice(...args),
      ...createTransferSlice(...args),
      ...createUserSlice(...args),
      ...createChainsSlice(...args),
      ...createTransactionSlice(...args),
      ...createWindowsSlice(...args),
      ...createTransactionWindowsSlice(...args),
      ...createUISlice(...args),
    }),
    {
      name: "cctp-bridge-storage",
      partialize: (state) => ({
        environment: state.environment,
        transferMethod: state.transferMethod,
        fromChain: state.fromChain,
        toChain: state.toChain,
        windowPositions: state.windowPositions,
        hasSeenCCTPExplainer: state.hasSeenCCTPExplainer,
        headerControlOrder: state.headerControlOrder,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

/**
 * Selector hooks for better performance
 */

// Hydration
export const useHasHydrated = () =>
  useBridgeStore((state) => state._hasHydrated);

// Environment
export const useEnvironment = () =>
  useBridgeStore((state) => state.environment);
export const useSetEnvironment = () =>
  useBridgeStore((state) => state.setEnvironment);

// Transfer method
export const useTransferMethod = () =>
  useBridgeStore((state) => state.transferMethod);
export const useSetTransferMethod = () =>
  useBridgeStore((state) => state.setTransferMethod);

// User
export const useUserAddress = () =>
  useBridgeStore((state) => state.userAddress);

// Chains
export const useFromChain = () => useBridgeStore((state) => state.fromChain);
export const useToChain = () => useBridgeStore((state) => state.toChain);
export const useSetFromChain = () =>
  useBridgeStore((state) => state.setFromChain);
export const useSetToChain = () => useBridgeStore((state) => state.setToChain);
export const useSwapChains = () => useBridgeStore((state) => state.swapChains);

// Current transaction
export const useCurrentTransaction = () =>
  useBridgeStore((state) => state.currentTransaction);

// Window management (non-transaction windows)
export const useActiveWindow = () =>
  useBridgeStore((state) => state.activeWindow);
export const useSetActiveWindow = () =>
  useBridgeStore((state) => state.setActiveWindow);
export const useWindowPositions = () =>
  useBridgeStore((state) => state.windowPositions);
export const useSetWindowPosition = () =>
  useBridgeStore((state) => state.setWindowPosition);
export const useWindowZIndexes = () =>
  useBridgeStore((state) => state.windowZIndexes);
export const useFocusWindow = () =>
  useBridgeStore((state) => state.focusWindow);

// Multi-window transaction hooks
export const useOpenTransactionWindows = () =>
  useBridgeStore((state) => state.openTransactionWindows);
export const useOpenTransactionWindow = () =>
  useBridgeStore((state) => state.openTransactionWindow);
export const useCloseTransactionWindow = () =>
  useBridgeStore((state) => state.closeTransactionWindow);
export const useFocusTransactionWindow = () =>
  useBridgeStore((state) => state.focusTransactionWindow);
export const useUpdateTransactionWindowPosition = () =>
  useBridgeStore((state) => state.updateTransactionWindowPosition);
export const useUpdateTransactionInWindow = () =>
  useBridgeStore((state) => state.updateTransactionInWindow);
export const useMinimizeTransactionWindow = () =>
  useBridgeStore((state) => state.minimizeTransactionWindow);
export const useCancelTransaction = () =>
  useBridgeStore((state) => state.cancelTransaction);

// CCTP Explainer
export const useHasSeenCCTPExplainer = () =>
  useBridgeStore((state) => state.hasSeenCCTPExplainer);
export const useSetHasSeenCCTPExplainer = () =>
  useBridgeStore((state) => state.setHasSeenCCTPExplainer);
export const useShowCCTPExplainer = () =>
  useBridgeStore((state) => state.showCCTPExplainer);
export const useSetShowCCTPExplainer = () =>
  useBridgeStore((state) => state.setShowCCTPExplainer);

// Header control order
export const useHeaderControlOrder = () =>
  useBridgeStore((state) => state.headerControlOrder);
export const useSetHeaderControlOrder = () =>
  useBridgeStore((state) => state.setHeaderControlOrder);
