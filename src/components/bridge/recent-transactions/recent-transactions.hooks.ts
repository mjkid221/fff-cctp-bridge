"use client";

import { useMemo, useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  useTransactionHistoryInfinite,
  NETWORK_CONFIGS,
  useEnvironment,
  useBridgeStore,
  type BridgeTransaction,
} from "~/lib/bridge";

export function useRecentTransactionsState() {
  const {
    transactions,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTransactionHistoryInfinite();

  const environment = useEnvironment();
  const openTransactionWindow = useBridgeStore(
    (state) => state.openTransactionWindow,
  );

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: "100px",
  });

  // Fetch next page when scrolled into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
    isFetchingNextPage,
    hasNextPage,
    environment,
    onOpenTransaction: handleOpenTransaction,
    loadMoreRef,
  };
}
