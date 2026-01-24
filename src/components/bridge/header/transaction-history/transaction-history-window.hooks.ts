"use client";

import { useWindowState } from "~/lib/bridge";
import type { TransactionHistoryWindowProps } from "./transaction-history.types";

export function useTransactionHistoryWindowState({
  onClose,
}: TransactionHistoryWindowProps) {
  return useWindowState({
    windowType: "transaction-history",
    onClose,
    defaultPosition: { x: 100, y: 150 },
    supportsMaximize: true,
  });
}
