"use client";

import { useMemo, useCallback } from "react";
import {
  useTransactionHistory,
  NETWORK_CONFIGS,
  useEnvironment,
  useBridgeStore,
  type BridgeTransaction,
} from "~/lib/bridge";

export function useRecentTransactionsState() {
  const { transactions, isLoading } = useTransactionHistory();
  const environment = useEnvironment();
  const openTransactionWindow = useBridgeStore(
    (state) => state.openTransactionWindow,
  );

  const handleOpenTransaction = useCallback(
    (transaction: BridgeTransaction) => {
      openTransactionWindow(transaction);
    },
    [openTransactionWindow],
  );

  // Filter transactions by current environment
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const fromNetwork = NETWORK_CONFIGS[tx.fromChain];
      return fromNetwork?.environment === environment;
    });
  }, [transactions, environment]);

  return {
    filteredTransactions,
    isLoading,
    environment,
    onOpenTransaction: handleOpenTransaction,
  };
}

export function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
