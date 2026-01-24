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
import {
  useRetryBridge,
  useResumeBridge,
  useRecoverBridge,
} from "~/lib/bridge/hooks";
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

  // Retry, resume, and recover functionality
  const { retryBridge, isRetrying } = useRetryBridge();
  const { resumeBridge, isResuming } = useResumeBridge();
  const { recoverBridge, isRecovering } = useRecoverBridge();
  const updateNotification = useUpdateNotification();
  const notifications = useNotifications();
  const setCurrentTransaction = useBridgeStore(
    (state) => state.setCurrentTransaction,
  );
  const cancelTransaction = useCancelTransaction();

  // Track whether we've attempted to resume this transaction
  const hasAttemptedResumeRef = useRef(false);

  // Track if notification was already updated for current terminal state
  const hasUpdatedNotificationRef = useRef(false);

  // Refs for stable function references (prevents dependency churn in useEffect)
  const resumeBridgeRef = useRef(resumeBridge);
  const recoverBridgeRef = useRef(recoverBridge);
  const notificationsRef = useRef(notifications);
  const updateNotificationRef = useRef(updateNotification);

  // Keep refs updated with latest function references
  useEffect(() => {
    resumeBridgeRef.current = resumeBridge;
    recoverBridgeRef.current = recoverBridge;
    notificationsRef.current = notifications;
    updateNotificationRef.current = updateNotification;
  });

  const { transaction, position, zIndex } = transactionWindow;

  // Reset notification update flag when transaction changes
  useEffect(() => {
    hasUpdatedNotificationRef.current = false;
  }, [transaction?.id]);

  // Track current position for spring-back animation
  const [currentPosition, setCurrentPosition] = useState(position);

  // Update position when it changes from store
  useEffect(() => {
    setCurrentPosition(position);
  }, [position.x, position.y]);

  // Auto-resume in-progress transactions when window opens
  // This handles the case where user refreshes the page during a bridge operation
  // and then opens the transaction from history/notifications
  useEffect(() => {
    if (!transaction || hasAttemptedResumeRef.current) return;

    // Early exit for terminal states - prevents re-triggering after completion
    if (
      transaction.status === "completed" ||
      transaction.status === "failed" ||
      transaction.status === "cancelled"
    ) {
      return;
    }

    // Only resume if transaction is in-progress
    const isResumable =
      transaction.status === "bridging" ||
      transaction.status === "confirming" ||
      transaction.status === "pending" ||
      transaction.status === "approving" ||
      transaction.status === "approved";

    if (!isResumable) return;

    // Check if transaction has bridgeResult (required for resume)
    const hasBridgeResult = !!transaction.bridgeResult;

    // Check if burn step completed (required for recovery when bridgeResult is missing)
    const burnStep = transaction.steps.find((s) => s.id === "burn");
    const hasBurnCompleted =
      burnStep?.status === "completed" && !!burnStep?.txHash;

    // If neither condition is met, transaction is too early to recover
    if (!hasBridgeResult && !hasBurnCompleted) return;

    // Set ref BEFORE async call - NEVER reset on error to prevent infinite loops
    hasAttemptedResumeRef.current = true;

    console.log("Auto-resume/recover triggered", {
      isResumable,
      hasBridgeResult,
      hasBurnCompleted,
      status: transaction.status,
      transactionId: transaction.id,
    });

    if (hasBridgeResult) {
      // Normal resume path - bridgeResult exists, use kit.retry() directly
      void resumeBridgeRef.current(transaction.id).catch((err) => {
        console.error("[Auto-Resume] Failed:", err);
        // DO NOT reset hasAttemptedResumeRef - prevents infinite retry loop
      });
    } else if (hasBurnCompleted) {
      // Recovery path - bridgeResult is missing (page refresh during attestation)
      // Reconstruct bridgeResult from captured events and retry
      void recoverBridgeRef.current(transaction.id).catch((err) => {
        console.error("[Auto-Recover] Failed:", err);
        // DO NOT reset hasAttemptedResumeRef - prevents infinite retry loop
      });
    }
  }, [transaction?.id]); // Only depend on transaction ID to prevent re-render loops

  // Update notification when transaction reaches terminal state
  // This handles notifications for recovery/resume operations
  useEffect(() => {
    if (!transaction || hasUpdatedNotificationRef.current) return;

    // Only update notification for terminal states
    if (
      transaction.status !== "completed" &&
      transaction.status !== "failed" &&
      transaction.status !== "cancelled"
    ) {
      return;
    }

    // Mark as updated BEFORE the async call to prevent re-entry
    hasUpdatedNotificationRef.current = true;

    // Find the notification linked to this transaction
    const notificationId =
      transaction.notificationId ??
      notificationsRef.current.find(
        (n) => n.bridgeTransactionId === transaction.id,
      )?.id;

    if (!notificationId) return;

    const fromNetwork = NETWORK_CONFIGS[transaction.fromChain];
    const toNetwork = NETWORK_CONFIGS[transaction.toChain];

    if (transaction.status === "completed") {
      void updateNotificationRef.current(notificationId, {
        status: "success",
        title: "Bridge Completed",
        message: `Successfully transferred ${transaction.amount} USDC from ${fromNetwork?.displayName} to ${toNetwork?.displayName}`,
        actionLabel: undefined,
        actionType: undefined,
      });
    } else if (
      transaction.status === "failed" ||
      transaction.status === "cancelled"
    ) {
      const parsed = parseTransactionError(
        transaction.error ?? "Transaction failed",
      );
      void updateNotificationRef.current(notificationId, {
        status: "failed",
        title: parsed.isUserRejection
          ? "Transaction Rejected"
          : "Bridge Failed",
        message: parsed.userMessage,
        actionLabel: "Open Bridge Status",
        actionType: "view",
      });
    }
  }, [transaction?.id, transaction?.status]); // Only depend on ID and status to prevent re-render loops

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
        void updateNotification(notificationId, {
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
      void updateNotification(notificationId, {
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
    isResuming,
    isRecovering,
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
