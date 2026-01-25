import type { Notification } from "~/lib/notifications";

export interface MobileNotificationDrawerProps {
  onNotificationAction?: (notification: Notification) => void;
}

export interface MobileNotificationDrawerViewProps {
  notifications: Notification[];
  onClose: () => void;
  onClearAll: () => void;
  onNotificationClick: (notification: Notification) => void;
}
