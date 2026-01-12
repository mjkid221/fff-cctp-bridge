"use client";

import { useHeaderState } from "./bridge-header.hooks";
import { BridgeHeaderView } from "./bridge-header.view";

export function BridgeHeader() {
  const state = useHeaderState();
  return <BridgeHeaderView {...state} />;
}
