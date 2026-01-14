"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDragControls } from "motion/react";
import {
  useOpenTransactionWindows,
  useCloseTransactionWindow,
  useFocusTransactionWindow,
  useUpdateTransactionWindowPosition,
  useCancelTransaction,
  constrainToViewport,
  NETWORK_CONFIGS,
} from "~/lib/bridge";
import { useRetryBridge } from "~/lib/bridge/hooks";
import { useUpdateNotification, useNotifications } from "~/lib/notifications";
import { parseTransactionError, useBridgeStore } from "~/lib/bridge";
import type { TransactionWindowProps } from "./transaction-windows.types";

export function useTransactionWindowsState() {
  const openTransactionWindows = useOpenTransactionWindows();
  const closeTransactionWindow = useCloseTransactionWindow();
  const focusTransactionWindow = useFocusTransactionWindow();
  const updateWindowPosition = useUpdateTransactionWindowPosition();

  // Convert Map to array for rendering
  const windows = Array.from(openTransactionWindows.values());

  return {
    windows,
    closeTransactionWindow,
    focusTransactionWindow,
    updateWindowPosition,
  };
}

export function useMultiWindowBridgeProgressState({
  transactionWindow,
  onClose,
  onFocus,
  onPositionChange,
}: TransactionWindowProps) {
  const [isMinimized, setIsMinimized] = useState(transactionWindow.isMinimized);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Retry functionality
  const { retryBridge, isRetrying } = useRetryBridge();
  const updateNotification = useUpdateNotification();
  const notifications = useNotifications();
  const setCurrentTransaction = useBridgeStore(
    (state) => state.setCurrentTransaction,
  );
  const cancelTransaction = useCancelTransaction();

  const { transaction, position, zIndex } = transactionWindow;

  // Track current position for spring-back animation
  const [currentPosition, setCurrentPosition] = useState(position);

  // Update position when it changes from store
  useEffect(() => {
    setCurrentPosition(position);
  }, [position.x, position.y]);

  // Prevent text selection during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    onFocus();
  }, [onFocus]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const draggedPosition = {
        x: rect.left,
        y: rect.top,
      };

      const dimensions = { width: 500, height: 400 };
      const constrainedPosition = constrainToViewport(
        draggedPosition,
        dimensions,
      );

      setCurrentPosition(draggedPosition);

      if (
        draggedPosition.x !== constrainedPosition.x ||
        draggedPosition.y !== constrainedPosition.y
      ) {
        setTimeout(() => {
          setCurrentPosition(constrainedPosition);
        }, 0);
      }

      onPositionChange(constrainedPosition);
    }
  }, [onPositionChange]);

  const handleClose = useCallback(() => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      onPositionChange({ x: rect.left, y: rect.top });
    }
    onClose();
  }, [onClose, onPositionChange]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      // Clipboard API may fail silently
    }
  }, []);

  const handleRetryStep = useCallback(async () => {
    if (!transaction) return;

    try {
      const notificationId =
        transaction.notificationId ??
        notifications.find((n) => n.bridgeTransactionId === transaction.id)?.id;

      const retryTransaction = await retryBridge(transaction.id);
      setCurrentTransaction(retryTransaction);

      const getNotificationUpdate = () => {
        if (retryTransaction.status === "completed") {
          return {
            status: "success" as const,
            title: "Bridge Completed",
            message: `Successfully transferred ${transaction.amount} USDC`,
            actionLabel: undefined,
            actionType: undefined,
          };
        } else if (
          retryTransaction.status === "failed" ||
          retryTransaction.status === "cancelled"
        ) {
          const parsed = parseTransactionError(
            retryTransaction.error ?? "Transaction failed",
          );
          return {
            status: "failed" as const,
            title: parsed.isUserRejection
              ? "Transaction Rejected"
              : "Retry Failed",
            message: parsed.userMessage,
            actionLabel: "Open Bridge Status",
            actionType: "view" as const,
          };
        }
        return {
          status: "in_progress" as const,
          title: "Bridge Retry Started",
          message: `Retrying bridge transaction for ${transaction.amount} USDC`,
          actionLabel: "View Progress",
          actionType: "view" as const,
        };
      };

      const notificationUpdate = getNotificationUpdate();

      if (notificationId) {
        updateNotification(notificationId, {
          ...notificationUpdate,
          bridgeTransactionId: retryTransaction.id,
          fromChain: NETWORK_CONFIGS[transaction.fromChain]?.displayName,
          toChain: NETWORK_CONFIGS[transaction.toChain]?.displayName,
          amount: transaction.amount,
          token: "USDC",
        });
      }
    } catch {
      // Error handled by notification system
    }
  }, [
    transaction,
    notifications,
    retryBridge,
    setCurrentTransaction,
    updateNotification,
  ]);

  // Dismiss stuck transaction permanently (marks as cancelled in storage)
  const handleDismiss = useCallback(async () => {
    if (!transaction) return;

    // Find the notification linked to this transaction
    const notificationId =
      transaction.notificationId ??
      notifications.find((n) => n.bridgeTransactionId === transaction.id)?.id;

    // Cancel the transaction
    await cancelTransaction(transaction.id);

    // Update the notification to show cancelled status
    if (notificationId) {
      updateNotification(notificationId, {
        status: "failed",
        title: "Transfer Cancelled",
        message: `Cancelled bridge transfer of ${transaction.amount} USDC`,
        actionLabel: undefined,
        actionType: undefined,
      });
    }
  }, [transaction, cancelTransaction, notifications, updateNotification]);

  const fromNetwork = transaction
    ? NETWORK_CONFIGS[transaction.fromChain]
    : null;
  const toNetwork = transaction ? NETWORK_CONFIGS[transaction.toChain] : null;

  const isCompleted = transaction?.status === "completed";
  const isFailed = transaction?.status === "failed";
  const isInProgress =
    transaction?.status === "pending" || transaction?.status === "bridging";
  const isCancelled = transaction?.status === "cancelled";

  return {
    windowRef,
    transaction,
    position,
    currentPosition,
    zIndex,
    isMinimized,
    isMaximized,
    copiedHash,
    isRetrying,
    isCompleted,
    isFailed,
    isInProgress,
    isCancelled,
    fromNetworkDisplayName: fromNetwork?.displayName ?? "",
    toNetworkDisplayName: toNetwork?.displayName ?? "",
    fromNetworkExplorerUrl: fromNetwork?.explorerUrl ?? "",
    toNetworkExplorerUrl: toNetwork?.explorerUrl ?? "",
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onClose: handleClose,
    onFocus,
    onMinimize: () => setIsMinimized(!isMinimized),
    onMaximize: () => setIsMaximized(!isMaximized),
    onCopyToClipboard: copyToClipboard,
    onRetryStep: handleRetryStep,
    onDismiss: handleDismiss,
    dragControls,
  };
}

export function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
