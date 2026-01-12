"use client";

import { useDisclaimerWindowState } from "./disclaimer-window.hooks";
import { DisclaimerWindowView } from "./disclaimer-window.view";
import { DisclaimerDrawerView } from "./disclaimer-drawer.view";
import type { DisclaimerWindowProps } from "./disclaimer.types";

export function DraggableDisclaimerWindow(props: DisclaimerWindowProps) {
  const state = useDisclaimerWindowState(props);
  return <DisclaimerWindowView {...state} />;
}

export function MobileDisclaimerDrawer(props: DisclaimerWindowProps) {
  return <DisclaimerDrawerView {...props} />;
}

export type { DisclaimerWindowProps } from "./disclaimer.types";
