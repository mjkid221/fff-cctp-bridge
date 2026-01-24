import type { ComponentType } from "react";
import type { BridgeHeaderViewProps } from "../bridge-header.types";

export type HeaderControlType =
  | "component" // Renders a component (NetworkToggle, ThemeToggle, etc.)
  | "icon-button" // Icon button with optional badge (Search)
  | "wallet" // Special wallet button (connected/disconnected states)
  | "divider"; // Visual separator

export interface HeaderControlItem {
  id: string;
  type: HeaderControlType;

  // For "component" type
  component?: ComponentType;

  // For "icon-button" type
  icon?: ComponentType<{ className?: string }>;
  iconClassName?: string; // Additional classes for the icon (e.g., positioning adjustments)
  badge?: string | ((props: BridgeHeaderViewProps) => string);
  onClick?: (props: BridgeHeaderViewProps) => void;
  ariaLabel?: string;

  // Visibility
  visible?: (props: BridgeHeaderViewProps) => boolean;
  /**
   * Controls responsive visibility:
   * - "mobile": Only visible on mobile (lg:hidden)
   * - "desktop": Only visible on desktop (hidden lg:block)
   * - "all": Always visible (default)
   */
  visibleBreakpoint?: "mobile" | "desktop" | "all";
}
