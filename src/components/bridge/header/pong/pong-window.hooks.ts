"use client";

import { useWindowState } from "~/lib/bridge";
import type { PongWindowProps } from "./pong.types";

export function usePongWindowState({ onClose }: PongWindowProps) {
  return useWindowState({
    windowType: "pong",
    onClose,
  });
}
