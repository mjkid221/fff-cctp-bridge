import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NetworkEnvironment, SupportedChainId } from "./networks";
import type { BridgeTransaction } from "./types";
import { BridgeStorage } from "./storage";

/**
 * Bridge store state
 */
interface BridgeState {
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

  // Transaction state
  currentTransaction: BridgeTransaction | null;
  setCurrentTransaction: (transaction: BridgeTransaction | null) => void;

  // Transaction history (in-memory cache)
  transactions: BridgeTransaction[];
  setTransactions: (transactions: BridgeTransaction[]) => void;
  addTransaction: (transaction: BridgeTransaction) => void;
  updateTransaction: (id: string, updates: Partial<BridgeTransaction>) => void;

  // Window management
  activeWindow: "fee-details" | "transaction-history" | null;
  setActiveWindow: (window: "fee-details" | "transaction-history" | null) => void;

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
      environment: "testnet",
      userAddress: null,
      fromChain: null,
      toChain: null,
      currentTransaction: null,
      transactions: [],
      activeWindow: null,
      isLoading: false,
      error: null,

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
      }),
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
