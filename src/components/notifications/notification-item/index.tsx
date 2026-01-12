"use client";

import { useNotificationItemState } from "./notification-item.hooks";
import { NotificationItemView } from "./notification-item.view";
import type { NotificationItemProps } from "./notification-item.types";

export type { NotificationItemProps };

export function NotificationItem(props: NotificationItemProps) {
  const { formattedTimestamp, statusIcon, onItemClick, onDismiss } =
    useNotificationItemState(props);

  return (
    <NotificationItemView
      notification={props.notification}
      formattedTimestamp={formattedTimestamp}
      statusIcon={statusIcon}
      onItemClick={onItemClick}
      onDismiss={onDismiss}
    />
  );
}
