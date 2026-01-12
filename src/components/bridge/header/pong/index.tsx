"use client";

import { usePongWindowState } from "./pong-window.hooks";
import { PongWindowView } from "./pong-window.view";
import { PongDrawerView } from "./pong-drawer.view";
import type { PongWindowProps } from "./pong.types";

export function DraggablePongWindow(props: PongWindowProps) {
  const state = usePongWindowState(props);
  return <PongWindowView {...state} />;
}

export function MobilePongDrawer(props: PongWindowProps) {
  return <PongDrawerView {...props} />;
}

export { PongGame } from "./pong-game";
export type { PongWindowProps } from "./pong.types";
