import { History, Search, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "../../theme-toggle";
import { NetworkToggle } from "../../network-toggle";
import { NotificationBell } from "~/components/notifications";
import type { HeaderControlItem } from "./header-controls.types";

export const HEADER_CONTROLS_CONFIG: HeaderControlItem[] = [
  // Transaction History button - Mobile only (hidden in header, shown in hamburger menu)
  {
    id: "transaction-history-mobile",
    type: "icon-button",
    icon: History,
    label: "Transaction History",
    onClick: (props) => props.onToggleTransactionHistory(),
    ariaLabel: "Transaction History",
    visibleBreakpoint: "mobile",
    showInMobileMenu: true,
  },

  // Network toggle - Shown directly in header, not in hamburger menu
  {
    id: "network-toggle",
    type: "component",
    component: NetworkToggle,
    label: "Network",
    showInMobileMenu: false,
  },

  // Theme toggle - In hamburger menu on mobile
  {
    id: "theme-toggle",
    type: "component",
    component: ThemeToggle,
    label: "Theme",
    showInMobileMenu: true,
  },

  // Search / Command Palette - In hamburger menu on mobile
  {
    id: "search",
    type: "icon-button",
    icon: Search,
    label: "Search",
    onClick: (props) => props.onOpenCommandPalette(),
    ariaLabel: "Open command palette",
    badge: "⌘K",
    showInMobileMenu: true,
  },

  // Stats - In hamburger menu on mobile
  {
    id: "stats",
    type: "icon-button",
    icon: LayoutDashboard,
    label: "My Bridge Stats",
    onClick: (props) => props.onToggleStats(),
    ariaLabel: "My Bridge Stats",
    showInMobileMenu: true,
  },

  // Notifications - In hamburger menu on mobile
  {
    id: "notifications",
    type: "component",
    component: NotificationBell,
    label: "Notifications",
    showInMobileMenu: true,
  },

  // Wallet button - Shown directly in header, not in hamburger menu
  {
    id: "wallet",
    type: "wallet",
    label: "Wallet",
    showInMobileMenu: false,
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

// Get controls that should appear in mobile hamburger menu
export function getMobileMenuItems(): HeaderControlItem[] {
  return HEADER_CONTROLS_CONFIG.filter((c) => c.showInMobileMenu === true);
}
