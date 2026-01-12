"use client";

import { useBridgeCardState } from "./bridge-card.hooks";
import { BridgeCardView } from "./bridge-card.view";

export function BridgeCard() {
  const state = useBridgeCardState();
  return <BridgeCardView {...state} />;
}
