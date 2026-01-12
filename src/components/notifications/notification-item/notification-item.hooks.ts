"use client";

import { useCallback, useMemo } from "react";
import { useRemoveNotification, useMarkAsRead } from "~/lib/notifications";
import { formatTimestamp, getStatusIcon } from "./utils";
import type { NotificationItemProps } from "./notification-item.types";

export function useNotificationItemState({
  notification,
  onAction,
}: NotificationItemProps) {
  const removeNotification = useRemoveNotification();
  const markAsRead = useMarkAsRead();

  const handleItemClick = useCallback(() => {
    markAsRead(notification.id);
    if (onAction) {
      onAction(notification);
    }
  }, [markAsRead, notification, onAction]);

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeNotification(notification.id);
    },
    [removeNotification, notification.id],
  );

  const formattedTimestamp = useMemo(
    () => formatTimestamp(notification.timestamp),
    [notification.timestamp],
  );

  const statusIcon = useMemo(
    () => getStatusIcon(notification.status),
    [notification.status],
  );

  return {
    formattedTimestamp,
    statusIcon,
    onItemClick: handleItemClick,
    onDismiss: handleDismiss,
  };
}
