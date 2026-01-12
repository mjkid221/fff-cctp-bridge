import type { Notification } from "~/lib/notifications";

export interface NotificationItemProps {
  notification: Notification;
  onAction?: (notification: Notification) => void;
}

export interface NotificationItemViewProps {
  notification: Notification;
  formattedTimestamp: string;
  statusIcon: React.ReactNode;
  onItemClick: () => void;
  onDismiss: (e: React.MouseEvent) => void;
}
