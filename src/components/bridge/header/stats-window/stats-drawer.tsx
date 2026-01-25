"use client";

import { useStatsWindowState } from "./stats-window.hooks";
import { StatsDrawerView } from "./stats-drawer.view";
import type { StatsWindowProps } from "./stats-window.types";

export function MobileStatsDrawer(props: StatsWindowProps) {
  const state = useStatsWindowState(props);
  return (
    <StatsDrawerView
      onClose={props.onClose}
      stats={state.stats}
      isLoading={state.isLoading}
    />
  );
}
