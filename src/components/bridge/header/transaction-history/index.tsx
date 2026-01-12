"use client";

import { useTransactionHistoryWindowState } from "./transaction-history-window.hooks";
import { TransactionHistoryWindowView } from "./transaction-history-window.view";
import { TransactionHistoryDrawerView } from "./transaction-history-drawer.view";
import type { TransactionHistoryWindowProps } from "./transaction-history.types";

export function DraggableTransactionHistory(
  props: TransactionHistoryWindowProps,
) {
  const state = useTransactionHistoryWindowState(props);
  return <TransactionHistoryWindowView {...state} />;
}

export function MobileTransactionHistoryDrawer(
  props: TransactionHistoryWindowProps,
) {
  return <TransactionHistoryDrawerView {...props} />;
}

export type { TransactionHistoryWindowProps } from "./transaction-history.types";
