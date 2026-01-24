"use client";

import { useStatsWindowState } from "./stats-window.hooks";
import { StatsWindowView } from "./stats-window.view";
import type { StatsWindowProps } from "./stats-window.types";

export function StatsWindow(props: StatsWindowProps) {
  const state = useStatsWindowState(props);

  return <StatsWindowView {...state} />;
}

export type { StatsWindowProps, BridgeStats } from "./stats-window.types";
