"use client";

import { useThemeToggle } from "./theme-toggle.hooks";
import { ThemeToggleView } from "./theme-toggle.view";

export function ThemeToggle() {
  const state = useThemeToggle();
  return <ThemeToggleView {...state} />;
}
