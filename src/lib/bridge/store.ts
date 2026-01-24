import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NetworkEnvironment, SupportedChainId } from "./networks";
import type { BridgeTransaction, TransferMethod } from "./types";
import { BridgeStorage } from "./storage";
import type { WindowPosition, WindowType } from "./window-utils";
import { DEFAULT_WINDOW_POSITIONS } from "./window-utils";

/**
 * Transaction window state for multi-window support
 */
export interface TransactionWindow {
  transactionId: string;
  transaction: BridgeTransaction;
  position: WindowPosition;
  zIndex: number;
  isMinimized: boolean;
}

/**
 * Bridge store state
 */
export interface BridgeState {
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;

  // Network environment
  environment: NetworkEnvironment;
  setEnvironment: (environment: NetworkEnvironment) => void;

  // Transfer method (standard = slow/cheap, fast = quick/higher fees)
  transferMethod: TransferMethod;
  setTransferMethod: (method: TransferMethod) => void;

  // User state
  userAddress: string | null;
  setUserAddress: (address: string | null) => void;

  // Selected chains
  fromChain: SupportedChainId | null;
  toChain: SupportedChainId | null;
  setFromChain: (chain: SupportedChainId) => void;
  setToChain: (chain: SupportedChainId) => void;
  swapChains: () => void;

  // Transaction state (for active bridge operation)
  currentTransaction: BridgeTransaction | null;
  setCurrentTransaction: (transaction: BridgeTransaction | null) => void;

  // Multi-window transaction panels
  openTransactionWindows: Map<string, TransactionWindow>;
  nextZIndex: number;
  openTransactionWindow: (
    transaction: BridgeTransaction,
    position?: WindowPosition,
  ) => void;
  closeTransactionWindow: (transactionId: string) => void;
  focusTransactionWindow: (transactionId: string) => void;
  updateTransactionWindowPosition: (
    transactionId: string,
    position: WindowPosition,
  ) => void;
  updateTransactionInWindow: (
    transactionId: string,
    updates: Partial<BridgeTransaction>,
  ) => void;
  minimizeTransactionWindow: (
    transactionId: string,
    isMinimized: boolean,
  ) => void;

  // Transaction history (in-memory cache)
  transactions: BridgeTransaction[];
  setTransactions: (transactions: BridgeTransaction[]) => void;
  addTransaction: (transaction: BridgeTransaction) => void;
  updateTransaction: (id: string, updates: Partial<BridgeTransaction>) => void;
  cancelTransaction: (id: string) => Promise<void>;

  // Window management (for non-transaction windows like fee-details)
  activeWindow: WindowType | null;
  setActiveWindow: (window: WindowType | null) => void;
  windowPositions: Record<WindowType, WindowPosition>;
  setWindowPosition: (window: WindowType, position: WindowPosition) => void;
  // Unified z-index management for all windows
  windowZIndexes: Record<WindowType, number>;
  focusWindow: (window: WindowType) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;

  // CCTP Explainer (one-time modal for new users + manual open)
  hasSeenCCTPExplainer: boolean;
  setHasSeenCCTPExplainer: (seen: boolean) => void;
  showCCTPExplainer: boolean;
  setShowCCTPExplainer: (show: boolean) => void;

  // Header control order (for drag-to-reorder)
  headerControlOrder: string[];
  setHeaderControlOrder: (order: string[]) => void;

  // Actions
  loadTransactions: () => Promise<void>;
  clearTransactions: () => Promise<void>;
}

/**
 * Bridge store with persistence
 */
export const useBridgeStore = create<BridgeState>()(
  persist(
    (set, get) => ({
      // Initial state
      _hasHydrated: false,
      environment: "mainnet",
      transferMethod: "standard",
      userAddress: null,
      fromChain: null,
      toChain: null,
      currentTransaction: null,
      transactions: [],
      activeWindow: null,
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
      windowPositions: { ...DEFAULT_WINDOW_POSITIONS },
      windowZIndexes: {
        "fee-details": 100,
        "transaction-history": 100,
        "bridge-progress": 100,
        disclaimer: 100,
        pong: 100,
        stats: 100,
      },

      // Multi-window transaction state
      openTransactionWindows: new Map(),
      nextZIndex: 100,

      // Hydration
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),

      // Environment
      setEnvironment: (environment) => {
        set({ environment, fromChain: null, toChain: null });
      },

      // Transfer method
      setTransferMethod: (transferMethod) => set({ transferMethod }),

      // User
      setUserAddress: (address) => {
        set({ userAddress: address ?? null });
        if (address) {
          void get().loadTransactions();
        } else {
          set({ transactions: [] });
        }
      },

      // Chain selection
      setFromChain: (chain) => set({ fromChain: chain }),
      setToChain: (chain) => set({ toChain: chain }),
      swapChains: () => {
        const { fromChain, toChain } = get();
        set({ fromChain: toChain, toChain: fromChain });
      },

      // Transaction
      setCurrentTransaction: (transaction) =>
        set({ currentTransaction: transaction }),

      // Window management
      setActiveWindow: (window) => set({ activeWindow: window }),
      setWindowPosition: (window, position) =>
        set((state) => ({
          windowPositions: {
            ...state.windowPositions,
            [window]: position,
          },
        })),

      // Unified z-index focus for non-transaction windows
      // Uses the same nextZIndex counter as transaction windows
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

      // Multi-window transaction management
      openTransactionWindow: (transaction, position) => {
        const { openTransactionWindows, nextZIndex, transactions } = get();

        // Always use the latest transaction data from the store
        // This ensures cancelled/completed status is shown correctly
        const latestTransaction =
          transactions.find((tx) => tx.id === transaction.id) ?? transaction;

        // If window already open, just focus it
        if (openTransactionWindows.has(transaction.id)) {
          get().focusTransactionWindow(transaction.id);
          // Update transaction data with latest from store
          get().updateTransactionInWindow(transaction.id, latestTransaction);
          return;
        }

        // Calculate offset position based on number of open windows
        const windowCount = openTransactionWindows.size;
        const offset = windowCount * 30; // Cascade windows
        const defaultPosition = {
          x: 400 + offset,
          y: 150 + offset,
        };

        const newWindow: TransactionWindow = {
          transactionId: latestTransaction.id,
          transaction: latestTransaction,
          position: position ?? defaultPosition,
          zIndex: nextZIndex,
          isMinimized: false,
        };

        const newMap = new Map(openTransactionWindows);
        newMap.set(latestTransaction.id, newWindow);

        set({
          openTransactionWindows: newMap,
          nextZIndex: nextZIndex + 1,
        });
      },

      closeTransactionWindow: (transactionId) => {
        const { openTransactionWindows } = get();
        const newMap = new Map(openTransactionWindows);
        newMap.delete(transactionId);
        set({ openTransactionWindows: newMap });
      },

      focusTransactionWindow: (transactionId) => {
        const { openTransactionWindows, nextZIndex } = get();
        const window = openTransactionWindows.get(transactionId);
        if (!window) return;

        const newMap = new Map(openTransactionWindows);
        newMap.set(transactionId, {
          ...window,
          zIndex: nextZIndex,
        });

        set({
          openTransactionWindows: newMap,
          nextZIndex: nextZIndex + 1,
        });
      },

      updateTransactionWindowPosition: (transactionId, position) => {
        const { openTransactionWindows } = get();
        const window = openTransactionWindows.get(transactionId);
        if (!window) return;

        const newMap = new Map(openTransactionWindows);
        newMap.set(transactionId, {
          ...window,
          position,
        });

        set({ openTransactionWindows: newMap });
      },

      updateTransactionInWindow: (transactionId, updates) => {
        const { openTransactionWindows } = get();
        const window = openTransactionWindows.get(transactionId);
        if (!window) return;

        const newMap = new Map(openTransactionWindows);
        newMap.set(transactionId, {
          ...window,
          transaction: { ...window.transaction, ...updates },
        });

        set({ openTransactionWindows: newMap });
      },

      minimizeTransactionWindow: (transactionId, isMinimized) => {
        const { openTransactionWindows } = get();
        const window = openTransactionWindows.get(transactionId);
        if (!window) return;

        const newMap = new Map(openTransactionWindows);
        newMap.set(transactionId, {
          ...window,
          isMinimized,
        });

        set({ openTransactionWindows: newMap });
      },

      // Transaction history
      setTransactions: (transactions) => set({ transactions }),

      addTransaction: (transaction) => {
        set((state) => {
          // Check if transaction already exists (prevent duplicates)
          const existingIndex = state.transactions.findIndex(
            (tx) => tx.id === transaction.id,
          );

          if (existingIndex !== -1) {
            // Update existing transaction instead of adding duplicate
            const updated = state.transactions.map((tx) =>
              tx.id === transaction.id ? transaction : tx,
            );
            return { transactions: updated };
          }

          return {
            transactions: [transaction, ...state.transactions],
          };
        });
        void BridgeStorage.saveTransaction(transaction);
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates, updatedAt: Date.now() } : tx,
          ),
        }));

        const transaction = get().transactions.find((tx) => tx.id === id);
        if (transaction) {
          void BridgeStorage.saveTransaction({
            ...transaction,
            ...updates,
            updatedAt: Date.now(),
          });
        }
      },

      cancelTransaction: async (id) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id
              ? { ...tx, status: "cancelled" as const, updatedAt: Date.now() }
              : tx,
          ),
          // Clear currentTransaction if it matches
          currentTransaction:
            state.currentTransaction?.id === id
              ? null
              : state.currentTransaction,
        }));

        get().closeTransactionWindow(id);

        const transaction = get().transactions.find((tx) => tx.id === id);
        if (transaction) {
          await BridgeStorage.saveTransaction({
            ...transaction,
            status: "cancelled",
            updatedAt: Date.now(),
          });
        }
      },

      // Loading
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Error
      setError: (error) => set({ error }),

      // CCTP Explainer
      setHasSeenCCTPExplainer: (seen) => set({ hasSeenCCTPExplainer: seen }),
      setShowCCTPExplainer: (show) => set({ showCCTPExplainer: show }),

      // Header control order
      setHeaderControlOrder: (order) => set({ headerControlOrder: order }),

      // Actions
      loadTransactions: async () => {
        const { userAddress } = get();
        if (!userAddress) return;

        try {
          const transactions =
            await BridgeStorage.getRecentTransactions(userAddress);
          set({ transactions });
        } catch (error) {
          console.error("Failed to load transactions:", error);
        }
      },

      clearTransactions: async () => {
        const { userAddress } = get();
        if (!userAddress) return;

        try {
          await BridgeStorage.clearUserTransactions(userAddress);
          set({ transactions: [] });
        } catch (error) {
          console.error("Failed to clear transactions:", error);
        }
      },
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
export const useEnvironment = () =>
  useBridgeStore((state) => state.environment);
export const useSetEnvironment = () =>
  useBridgeStore((state) => state.setEnvironment);

export const useTransferMethod = () =>
  useBridgeStore((state) => state.transferMethod);
export const useSetTransferMethod = () =>
  useBridgeStore((state) => state.setTransferMethod);

export const useUserAddress = () =>
  useBridgeStore((state) => state.userAddress);

export const useFromChain = () => useBridgeStore((state) => state.fromChain);
export const useToChain = () => useBridgeStore((state) => state.toChain);
export const useSetFromChain = () =>
  useBridgeStore((state) => state.setFromChain);
export const useSetToChain = () => useBridgeStore((state) => state.setToChain);
export const useSwapChains = () => useBridgeStore((state) => state.swapChains);

export const useCurrentTransaction = () =>
  useBridgeStore((state) => state.currentTransaction);

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

export const useHasHydrated = () =>
  useBridgeStore((state) => state._hasHydrated);

export const useHasSeenCCTPExplainer = () =>
  useBridgeStore((state) => state.hasSeenCCTPExplainer);
export const useSetHasSeenCCTPExplainer = () =>
  useBridgeStore((state) => state.setHasSeenCCTPExplainer);
export const useShowCCTPExplainer = () =>
  useBridgeStore((state) => state.showCCTPExplainer);
export const useSetShowCCTPExplainer = () =>
  useBridgeStore((state) => state.setShowCCTPExplainer);

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

// Header control order hooks
export const useHeaderControlOrder = () =>
  useBridgeStore((state) => state.headerControlOrder);
export const useSetHeaderControlOrder = () =>
  useBridgeStore((state) => state.setHeaderControlOrder);
