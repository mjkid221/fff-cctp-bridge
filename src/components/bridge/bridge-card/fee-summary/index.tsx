"use client";

import { useFeeSummaryState } from "./fee-summary.hooks";
import { FeeSummaryView } from "./fee-summary.view";
import type { FeeSummaryProps } from "./fee-summary.types";

export type { FeeSummaryProps };

export function DraggableFeeSummary(props: FeeSummaryProps) {
  const state = useFeeSummaryState(props);

  return (
    <FeeSummaryView
      {...state}
      estimate={props.estimate}
      isEstimating={props.isEstimating}
      fromChain={props.fromChain}
      toChain={props.toChain}
      amount={props.amount}
    />
  );
}
