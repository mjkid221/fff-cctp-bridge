"use client";

import { useMemo, useRef } from "react";
import { useTransactionHistory } from "~/lib/bridge/hooks";
import type { StatsWindowProps, BridgeStats } from "./stats-window.types";

export function useStatsWindowState({ onClose }: StatsWindowProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Get transaction history for stats calculation
  const { transactions, isLoading } = useTransactionHistory();

  // Calculate stats from transactions
  const stats = useMemo<BridgeStats>(() => {
    const completedTxs = transactions.filter((tx) => tx.status === "completed");

    // Total USDC bridged
    const totalBridged = completedTxs.reduce(
      (sum, tx) => sum + parseFloat(tx.amount || "0"),
      0,
    );

    // Total USDC fees paid (fast mode only)
    const totalFeesPaid = completedTxs.reduce((sum, tx) => {
      if (tx.transferMethod === "fast" && tx.providerFeeUsdc) {
        return sum + parseFloat(tx.providerFeeUsdc);
      }
      return sum;
    }, 0);

    // Count fast vs standard transactions
    const fastTxs = completedTxs.filter(
      (tx) => tx.transferMethod === "fast",
    ).length;
    const standardTxs = completedTxs.filter(
      (tx) => tx.transferMethod === "standard" || !tx.transferMethod,
    ).length;

    // Estimated savings vs third-party bridges (typically 0.15-0.2% of volume or even higher depending on amount)
    // We use 0.2% as conservative estimate
    const thirdPartyFeeRate = 0.002;
    const wouldHavePaid = totalBridged * thirdPartyFeeRate;
    const estimatedSavings = Math.max(0, wouldHavePaid - totalFeesPaid);

    return {
      totalBridged: totalBridged.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalTransactions: completedTxs.length,
      totalFeesPaid: totalFeesPaid.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }),
      estimatedSavings: estimatedSavings.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      fastTransactions: fastTxs,
      standardTransactions: standardTxs,
    };
  }, [transactions]);

  return {
    panelRef,
    onClose,
    stats,
    isLoading,
  };
}
