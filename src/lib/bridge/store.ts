import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NetworkEnvironment, SupportedChainId } from "./networks";
import type { BridgeTransaction } from "./types";
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
  openTransactionWindow: (transaction: BridgeTransaction, position?: WindowPosition) => void;
  closeTransactionWindow: (transactionId: string) => void;
  focusTransactionWindow: (transactionId: string) => void;
  updateTransactionWindowPosition: (transactionId: string, position: WindowPosition) => void;
  updateTransactionInWindow: (transactionId: string, updates: Partial<BridgeTransaction>) => void;
  minimizeTransactionWindow: (transactionId: string, isMinimized: boolean) => void;

  // Transaction history (in-memory cache)
  transactions: BridgeTransaction[];
  setTransactions: (transactions: BridgeTransaction[]) => void;
  addTransaction: (transaction: BridgeTransaction) => void;
  updateTransaction: (id: string, updates: Partial<BridgeTransaction>) => void;

  // Window management (for non-transaction windows like fee-details)
  activeWindow: WindowType | null;
  setActiveWindow: (window: WindowType | null) => void;
  windowPositions: Record<WindowType, WindowPosition>;
  setWindowPosition: (
    window: WindowType,
    position: WindowPosition
  ) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;

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
      environment: "testnet",
      userAddress: null,
      fromChain: null,
      toChain: null,
      currentTransaction: null,
      transactions: [],
      activeWindow: null,
      isLoading: false,
      error: null,
      windowPositions: { ...DEFAULT_WINDOW_POSITIONS },

      // Multi-window transaction state
      openTransactionWindows: new Map(),
      nextZIndex: 100,

      // Hydration
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),

      // Environment
      setEnvironment: (environment) => {
        set({ environment, fromChain: null, toChain: null });
      },

      // User
      setUserAddress: (address) => {
        // Normalize address to lowercase for consistency
        const normalizedAddress = address?.toLowerCase() ?? null;
        set({ userAddress: normalizedAddress });
        if (normalizedAddress) {
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

      // Multi-window transaction management
      openTransactionWindow: (transaction, position) => {
        const { openTransactionWindows, nextZIndex } = get();

        // If window already open, just focus it
        if (openTransactionWindows.has(transaction.id)) {
          get().focusTransactionWindow(transaction.id);
          // Update transaction data in case it changed
          get().updateTransactionInWindow(transaction.id, transaction);
          return;
        }

        // Calculate offset position based on number of open windows
        const windowCount = openTransactionWindows.size;
        const offset = windowCount * 30; // Cascade windows
        const defaultPosition = {
          x: 400 + offset,
          y: 150 + offset
        };

        const newWindow: TransactionWindow = {
          transactionId: transaction.id,
          transaction,
          position: position ?? defaultPosition,
          zIndex: nextZIndex,
          isMinimized: false,
        };

        const newMap = new Map(openTransactionWindows);
        newMap.set(transaction.id, newWindow);

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

          // Add new transaction to the beginning of the list
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

        // Update in IndexedDB
        const transaction = get().transactions.find((tx) => tx.id === id);
        if (transaction) {
          void BridgeStorage.saveTransaction({
            ...transaction,
            ...updates,
            updatedAt: Date.now(),
          });
        }
      },

      // Loading
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Error
      setError: (error) => set({ error }),

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
        fromChain: state.fromChain,
        toChain: state.toChain,
        windowPositions: state.windowPositions,
      }),
      onRehydrateStorage: () => (state) => {
        // Called after store is rehydrated from localStorage
        console.log('[Store] Rehydrated from localStorage:', state?.windowPositions);
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

export const useUserAddress = () =>
  useBridgeStore((state) => state.userAddress);
export const useSetUserAddress = () =>
  useBridgeStore((state) => state.setUserAddress);

export const useFromChain = () => useBridgeStore((state) => state.fromChain);
export const useToChain = () => useBridgeStore((state) => state.toChain);
export const useSetFromChain = () =>
  useBridgeStore((state) => state.setFromChain);
export const useSetToChain = () => useBridgeStore((state) => state.setToChain);
export const useSwapChains = () => useBridgeStore((state) => state.swapChains);

export const useCurrentTransaction = () =>
  useBridgeStore((state) => state.currentTransaction);
export const useTransactions = () =>
  useBridgeStore((state) => state.transactions);

export const useIsLoading = () => useBridgeStore((state) => state.isLoading);
export const useError = () => useBridgeStore((state) => state.error);

export const useActiveWindow = () =>
  useBridgeStore((state) => state.activeWindow);
export const useSetActiveWindow = () =>
  useBridgeStore((state) => state.setActiveWindow);

export const useWindowPositions = () =>
  useBridgeStore((state) => state.windowPositions);
export const useSetWindowPosition = () =>
  useBridgeStore((state) => state.setWindowPosition);

export const useHasHydrated = () =>
  useBridgeStore((state) => state._hasHydrated);

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
