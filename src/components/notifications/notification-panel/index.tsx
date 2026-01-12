"use client";

import { useNotificationPanelState } from "./notification-panel.hooks";
import { NotificationPanelView } from "./notification-panel.view";
import type { NotificationPanelProps } from "./notification-panel.types";

export type { NotificationPanelProps };

export function NotificationPanel(props: NotificationPanelProps) {
  const state = useNotificationPanelState(props);

  return <NotificationPanelView {...state} />;
}
