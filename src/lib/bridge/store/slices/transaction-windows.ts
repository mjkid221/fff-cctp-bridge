import type { StateCreator } from "zustand";
import type {
  BridgeState,
  TransactionWindowsSlice,
  TransactionWindow,
} from "../types";

export const createTransactionWindowsSlice: StateCreator<
  BridgeState,
  [],
  [],
  TransactionWindowsSlice
> = (set, get) => ({
  openTransactionWindows: new Map(),
  nextZIndex: 100,

  openTransactionWindow: (transaction, position) => {
    const { openTransactionWindows, nextZIndex, transactions } = get();

    // Always use the latest transaction data from the store
    const latestTransaction =
      transactions.find((tx) => tx.id === transaction.id) ?? transaction;

    // If window already open, just focus it
    if (openTransactionWindows.has(transaction.id)) {
      get().focusTransactionWindow(transaction.id);
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
});
