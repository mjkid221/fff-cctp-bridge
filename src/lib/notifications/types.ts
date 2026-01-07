/**
 * Notification types for bridge operations
 */

export type NotificationType = "bridge" | "system" | "warning";

export type NotificationStatus =
  | "pending"
  | "in_progress"
  | "success"
  | "failed"
  | "info";

export interface Notification {
  id: string; // nanoid
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;

  // Bridge-specific data
  bridgeTransactionId?: string; // Link to bridge transaction
  fromChain?: string;
  toChain?: string;
  amount?: string;
  token?: string;

  // Actions
  actionLabel?: string; // e.g., "Retry", "View Details"
  actionType?: "retry" | "view" | "dismiss";

  // Auto-dismiss after duration (ms), null = manual dismiss only
  autoDismissAfter?: number | null;
}

export interface NotificationAction {
  type: "add" | "remove" | "markAsRead" | "markAllAsRead" | "clear";
  notification?: Notification;
  notificationId?: string;
}
