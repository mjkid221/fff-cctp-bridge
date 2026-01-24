"use client";

import { useWindowState } from "~/lib/bridge";
import type { FeeSummaryProps } from "./fee-summary.types";

export function useFeeSummaryState({ onClose }: FeeSummaryProps) {
  return useWindowState({
    windowType: "fee-details",
    onClose,
    supportsMaximize: true,
  });
}
