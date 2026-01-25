"use client";

import { useCallback } from "react";
import {
  useNotifications,
  useSetNotificationPanelOpen,
  useClearAllNotifications,
  type Notification,
} from "~/lib/notifications";
import { BridgeStorage } from "~/lib/bridge/storage";
import { useBridgeStore } from "~/lib/bridge";
import type { MobileNotificationDrawerProps } from "./mobile-notification-drawer.types";

export function useMobileNotificationDrawerState({
  onNotificationAction,
}: MobileNotificationDrawerProps) {
  const notifications = useNotifications();
  const setIsOpen = useSetNotificationPanelOpen();
  const clearAll = useClearAllNotifications();

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      // If it's a bridge notification with a transaction ID, open transaction window
      if (notification.bridgeTransactionId) {
        // Skip temporary pending IDs (created before real transaction exists)
        if (!notification.bridgeTransactionId.startsWith("pending_")) {
          // First try to get from in-memory store (faster, always up-to-date)
          const storeState = useBridgeStore.getState();
          let transaction = storeState.transactions.find(
            (tx) => tx.id === notification.bridgeTransactionId,
          );

          // Fall back to IndexedDB if not found in store
          if (!transaction) {
            transaction = await BridgeStorage.getTransaction(
              notification.bridgeTransactionId,
            );
          }

          if (transaction) {
            // Open a new transaction window (or focus existing one)
            storeState.openTransactionWindow(transaction);
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
    void clearAll();
  }, [clearAll]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  return {
    notifications,
    onClose: handleClose,
    onNotificationClick: handleNotificationClick,
    onClearAll: handleClearAll,
  };
}
