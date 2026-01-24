"use client";

import { useWindowState } from "~/lib/bridge";
import type { DisclaimerWindowProps } from "./disclaimer.types";

export function useDisclaimerWindowState({ onClose }: DisclaimerWindowProps) {
  return useWindowState({
    windowType: "disclaimer",
    onClose,
  });
}
