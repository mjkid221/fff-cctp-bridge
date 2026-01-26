"use client";

import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserAddress, useEnvironment } from "~/lib/bridge/store";
import { StatsStorage } from "~/lib/bridge/stats-storage";
import type { StatsWindowProps, BridgeStats } from "./stats-window.types";

export function useStatsWindowState({ onClose }: StatsWindowProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const userAddress = useUserAddress();
  const environment = useEnvironment();

  const { data: rawStats, isLoading } = useQuery({
    queryKey: ["userStats", userAddress, environment],
    queryFn: async () => {
      if (!userAddress) return null;
      return StatsStorage.getOrCreate(userAddress, environment);
    },
    enabled: !!userAddress,
  });

  const stats = useMemo<BridgeStats>(() => {
    if (!rawStats) {
      return {
        totalBridged: "0.00",
        totalTransactions: 0,
        totalFeesPaid: "0.00",
        estimatedSavings: "0.00",
        fastTransactions: 0,
        standardTransactions: 0,
      };
    }

    // Estimated savings vs third-party bridges (typically 0.15-0.2% of volume)
    // We use 0.2% as conservative estimate
    const thirdPartyFeeRate = 0.002;
    const wouldHavePaid = rawStats.totalBridged * thirdPartyFeeRate;
    const estimatedSavings = Math.max(
      0,
      wouldHavePaid - rawStats.totalFeesPaid,
    );

    return {
      totalBridged: rawStats.totalBridged.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      totalTransactions: rawStats.totalTransactions,
      totalFeesPaid: rawStats.totalFeesPaid.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }),
      estimatedSavings: estimatedSavings.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      fastTransactions: rawStats.fastTransactions,
      standardTransactions: rawStats.standardTransactions,
    };
  }, [rawStats]);

  return {
    panelRef,
    onClose,
    stats,
    isLoading,
  };
}
