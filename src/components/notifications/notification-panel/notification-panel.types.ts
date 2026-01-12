import type { Notification } from "~/lib/notifications";

export interface NotificationPanelProps {
  onNotificationAction?: (notification: Notification) => void;
}

export interface NotificationPanelViewProps {
  isOpen: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
  notifications: Notification[];
  onClose: () => void;
  onNotificationClick: (notification: Notification) => Promise<void>;
  onClearAll: () => void;
}
