import { History, Search, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "../../theme-toggle";
import { NetworkToggle } from "../../network-toggle";
import { NotificationBell } from "~/components/notifications";
import type { HeaderControlItem } from "./header-controls.types";

export const HEADER_CONTROLS_CONFIG: HeaderControlItem[] = [
  // Transaction History button - Mobile only
  {
    id: "transaction-history-mobile",
    type: "icon-button",
    icon: History,
    onClick: (props) => props.onToggleTransactionHistory(),
    ariaLabel: "Transaction History",
    visibleBreakpoint: "mobile",
  },

  // Network toggle
  {
    id: "network-toggle",
    type: "component",
    component: NetworkToggle,
  },

  // Theme toggle
  {
    id: "theme-toggle",
    type: "component",
    component: ThemeToggle,
  },

  // Search / Command Palette
  {
    id: "search",
    type: "icon-button",
    icon: Search,
    onClick: (props) => props.onOpenCommandPalette(),
    ariaLabel: "Open command palette",
  },

  // Stats
  {
    id: "stats",
    type: "icon-button",
    icon: LayoutDashboard,
    onClick: (props) => props.onToggleStats(),
    ariaLabel: "Bridge Stats",
  },

  // Notifications
  {
    id: "notifications",
    type: "component",
    component: NotificationBell,
  },

  // Wallet button
  {
    id: "wallet",
    type: "wallet",
  },
];

// Map for O(1) lookup by ID
export const HEADER_CONTROLS_MAP = new Map<string, HeaderControlItem>(
  HEADER_CONTROLS_CONFIG.map((control) => [control.id, control]),
);

// Get control by ID
export function getHeaderControl(id: string): HeaderControlItem | undefined {
  return HEADER_CONTROLS_MAP.get(id);
}
