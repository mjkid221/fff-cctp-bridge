import type { StateCreator } from "zustand";
import { BridgeStorage } from "../../storage";
import { StatsStorage } from "../../stats-storage";
import { NETWORK_CONFIGS } from "../../networks";
import type { BridgeState, TransactionSlice } from "../types";

export const createTransactionSlice: StateCreator<
  BridgeState,
  [],
  [],
  TransactionSlice
> = (set, get) => ({
  currentTransaction: null,
  transactions: [],

  setCurrentTransaction: (transaction) =>
    set({ currentTransaction: transaction }),

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

    // Prune old transactions in background (keeps last 100)
    const { userAddress } = get();
    if (userAddress) {
      void BridgeStorage.pruneOldTransactions(userAddress, 100);
    }
  },

  updateTransaction: (id, updates) => {
    const previousTx = get().transactions.find((tx) => tx.id === id);
    const wasCompleted = previousTx?.status === "completed";

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

      // Update aggregate stats only when mint step is confirmed complete
      // This prevents premature stats updates if the user cancels
      // or the transaction fails before mint is verified on-chain
      if (updates.status === "completed" && !wasCompleted) {
        const mintStep = transaction.steps?.find((s) => s.id === "mint");
        if (mintStep?.status === "completed") {
          const amount = parseFloat(transaction.amount || "0");
          const isFast = transaction.transferMethod === "fast";
          const providerFee = parseFloat(transaction.providerFeeUsdc || "0");
          const environment =
            NETWORK_CONFIGS[transaction.fromChain]?.environment ?? "mainnet";

          void StatsStorage.incrementOnComplete(
            transaction.userAddress,
            environment,
            amount,
            isFast,
            providerFee,
          );
        }
      }
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
        state.currentTransaction?.id === id ? null : state.currentTransaction,
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
});
