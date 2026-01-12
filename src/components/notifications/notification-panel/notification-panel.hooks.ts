"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  useNotifications,
  useIsNotificationPanelOpen,
  useSetNotificationPanelOpen,
  useClearAllNotifications,
  type Notification,
} from "~/lib/notifications";
import { BridgeStorage } from "~/lib/bridge/storage";
import { useBridgeStore } from "~/lib/bridge";
import type { NotificationPanelProps } from "./notification-panel.types";

export function useNotificationPanelState({
  onNotificationAction,
}: NotificationPanelProps) {
  const notifications = useNotifications();
  const isOpen = useIsNotificationPanelOpen();
  const setIsOpen = useSetNotificationPanelOpen();
  const clearAll = useClearAllNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't close if clicking the notification bell button
      if (target.closest('[data-notification-bell="true"]')) {
        return;
      }

      if (panelRef.current && !panelRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      // If it's a bridge notification with a transaction ID, open transaction window
      if (notification.bridgeTransactionId) {
        // Skip temporary pending IDs (created before real transaction exists)
        if (!notification.bridgeTransactionId.startsWith("pending_")) {
          // Load transaction from IndexedDB
          const transaction = await BridgeStorage.getTransaction(
            notification.bridgeTransactionId,
          );

          if (transaction) {
            // Open a new transaction window (or focus existing one)
            useBridgeStore.getState().openTransactionWindow(transaction);
          }
        }

        // Close notification panel
        setIsOpen(false);
      }

      onNotificationAction?.(notification);
    },
    [onNotificationAction, setIsOpen],
  );

  const handleClearAll = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  return {
    isOpen,
    panelRef,
    notifications,
    onClose: handleClose,
    onNotificationClick: handleNotificationClick,
    onClearAll: handleClearAll,
  };
}
