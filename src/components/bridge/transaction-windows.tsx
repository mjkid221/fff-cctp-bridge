"use client";

import { motion, AnimatePresence, useDragControls } from "motion/react";
import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import {
  useOpenTransactionWindows,
  useCloseTransactionWindow,
  useFocusTransactionWindow,
  useUpdateTransactionWindowPosition,
  constrainToViewport,
  NETWORK_CONFIGS,
  parseStepError,
  type TransactionWindow,
  type BridgeStep,
} from "~/lib/bridge";
import { useRetryBridge } from "~/lib/bridge/hooks";
import { useUpdateNotification, useNotifications } from "~/lib/notifications";
import { parseTransactionError, useBridgeStore } from "~/lib/bridge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

// Container component that renders all open transaction windows
export function TransactionWindows() {
  const openTransactionWindows = useOpenTransactionWindows();
  const closeTransactionWindow = useCloseTransactionWindow();
  const focusTransactionWindow = useFocusTransactionWindow();
  const updateWindowPosition = useUpdateTransactionWindowPosition();

  // Convert Map to array for rendering
  const windows = Array.from(openTransactionWindows.values());

  if (windows.length === 0) return null;

  return (
    <AnimatePresence>
      {windows.map((window) => (
        <MultiWindowBridgeProgress
          key={window.transactionId}
          transactionWindow={window}
          onClose={() => closeTransactionWindow(window.transactionId)}
          onFocus={() => focusTransactionWindow(window.transactionId)}
          onPositionChange={(position) =>
            updateWindowPosition(window.transactionId, position)
          }
        />
      ))}
    </AnimatePresence>
  );
}

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function StepIcon({ step }: { step: BridgeStep }) {
  switch (step.status) {
    case "completed":
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-green-500/10 ring-2 ring-green-500/20">
          <CheckCircle2 className="size-4 text-green-500" />
        </div>
      );
    case "failed":
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-red-500/10 ring-2 ring-red-500/20">
          <AlertCircle className="size-4 text-red-500" />
        </div>
      );
    case "in_progress":
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-gray-500/10 ring-2 ring-gray-500/20">
          <Loader2 className="size-4 animate-spin text-gray-600 dark:text-gray-400" />
        </div>
      );
    case "pending":
    default:
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-gray-500/5 ring-2 ring-gray-500/10">
          <Clock className="size-4 text-gray-400" />
        </div>
      );
  }
}

// Multi-window version of BridgeProgressWindow with per-window position/zIndex
function MultiWindowBridgeProgress({
  transactionWindow,
  onClose,
  onFocus,
  onPositionChange,
}: {
  transactionWindow: TransactionWindow;
  onClose: () => void;
  onFocus: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
}) {
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

  const handleDragStart = () => {
    setIsDragging(true);
    onFocus();
  };

  const handleDragEnd = () => {
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
  };

  const handleClose = () => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      onPositionChange({ x: rect.left, y: rect.top });
    }
    onClose();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle step retry - retries the entire transaction
  const handleRetryStep = async () => {
    if (!transaction) return;

    try {
      // Use notification ID from transaction if available, otherwise search for it
      const notificationId =
        transaction.notificationId ??
        notifications.find((n) => n.bridgeTransactionId === transaction.id)?.id;

      // Retry using Bridge Kit's retry API (reuses same transaction ID)
      const retryTransaction = await retryBridge(transaction.id);

      // Transaction ID is the same, so this window automatically receives updates
      // via the EventManager callbacks. Just update current transaction for reactivity.
      setCurrentTransaction(retryTransaction);

      // Update notification based on retry transaction status
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
        // Still in progress
        return {
          status: "in_progress" as const,
          title: "Bridge Retry Started",
          message: `Retrying bridge transaction for ${transaction.amount} USDC`,
          actionLabel: "View Progress",
          actionType: "view" as const,
        };
      };

      const notificationUpdate = getNotificationUpdate();

      // Update existing notification or create new one
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
    } catch (err: unknown) {
      console.error("Retry failed:", err);
    }
  };

  if (!transaction) return null;

  const fromNetwork = NETWORK_CONFIGS[transaction.fromChain];
  const toNetwork = NETWORK_CONFIGS[transaction.toChain];

  const isCompleted = transaction.status === "completed";
  const isFailed = transaction.status === "failed";
  const isInProgress =
    transaction.status === "pending" || transaction.status === "bridging";

  return (
    <motion.div
      ref={windowRef}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{
        opacity: 0,
        scale: 0.95,
        x: position.x,
        y: position.y,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        x: currentPosition.x,
        y: currentPosition.y,
      }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 300,
      }}
      className="fixed top-0 left-0"
      style={{
        touchAction: "none",
        zIndex: zIndex,
      }}
      onPointerDown={onFocus}
    >
      <div
        className={cn(
          "border-border/50 overflow-hidden rounded-[20px] border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition-all duration-300",
          "bg-card/95",
          isMaximized ? "w-[650px]" : "w-[540px]",
        )}
      >
        {/* macOS-style title bar */}
        <div
          className="group border-border/30 bg-muted/40 flex cursor-grab items-center justify-between border-b px-3 py-2.5 active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
          onDoubleClick={() => setIsMaximized(!isMaximized)}
        >
          {/* Traffic light buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="group/btn relative size-3 rounded-full bg-red-500 transition-all hover:bg-red-600"
              aria-label="Close window"
            >
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-red-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                ×
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="group/btn relative size-3 rounded-full bg-yellow-500 transition-all hover:bg-yellow-600"
              aria-label="Minimize window"
            >
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-yellow-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                −
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsMaximized(!isMaximized);
              }}
              className="group/btn relative size-3 rounded-full bg-green-500 transition-all hover:bg-green-600"
              aria-label={isMaximized ? "Restore window" : "Maximize window"}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                {isMaximized ? "−" : "+"}
              </span>
            </motion.button>
          </div>

          {/* Window title */}
          <div className="text-muted-foreground pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-medium">
            Bridge Progress - {transaction.amount} USDC
          </div>

          {/* Spacer */}
          <div className="w-[52px]" />
        </div>

        {/* Window content */}
        <motion.div
          animate={{
            height: isMinimized ? 0 : "auto",
            opacity: isMinimized ? 0 : 1,
          }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 max-h-[70vh] space-y-3 overflow-y-auto p-5">
            {/* Transaction header */}
            <div className="space-y-2">
              {/* Amount and route */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                    <div className="bg-muted/50 flex items-center gap-1 rounded-full px-2 py-0.5">
                      <span className="text-foreground text-xs font-semibold">
                        {fromNetwork?.displayName}
                      </span>
                    </div>
                    <ArrowRight className="size-3" />
                    <div className="bg-muted/50 flex items-center gap-1 rounded-full px-2 py-0.5">
                      <span className="text-foreground text-xs font-semibold">
                        {toNetwork?.displayName}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <h3 className="text-foreground text-2xl font-bold tracking-tight">
                      {transaction.amount}
                    </h3>
                    <span className="text-muted-foreground text-sm font-semibold">
                      USDC
                    </span>
                  </div>
                </div>
                {transaction.estimatedTime && isInProgress && (
                  <div className="bg-muted/50 flex items-center gap-1 rounded-full px-2 py-1">
                    <Clock className="text-muted-foreground size-3" />
                    <span className="text-muted-foreground text-[10px] font-semibold">
                      ~{formatTime(transaction.estimatedTime)}
                    </span>
                  </div>
                )}
              </div>

              {/* Overall status */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-3",
                  isCompleted && "border-green-500/30 bg-green-500/10",
                  isFailed && "border-red-500/30 bg-red-500/10",
                  isInProgress && "border-border/50 bg-muted/30",
                )}
              >
                <div className="relative z-10 flex items-center gap-2.5">
                  {isCompleted && (
                    <>
                      <div className="flex size-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
                        <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                          Transfer Completed!
                        </p>
                        <p className="text-[10px] text-green-600/80 dark:text-green-400/80">
                          Your funds have arrived successfully
                        </p>
                      </div>
                    </>
                  )}
                  {isFailed && (
                    <>
                      <div className="flex size-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                        <AlertCircle className="size-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                          Transfer Failed
                        </p>
                        <p className="text-[10px] text-red-600/80 dark:text-red-400/80">
                          Click retry below to try again
                        </p>
                      </div>
                    </>
                  )}
                  {isInProgress && (
                    <>
                      <div className="flex size-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/50">
                        <Loader2 className="size-5 animate-spin text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Transfer In Progress
                        </p>
                        <p className="text-[10px] text-gray-600/80 dark:text-gray-400/80">
                          Please wait while we process your transfer
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <h4 className="text-muted-foreground px-1 text-[10px] font-semibold tracking-wider uppercase">
                Transaction Steps
              </h4>
              <div className="relative space-y-2">
                {transaction.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "group relative overflow-hidden rounded-lg border backdrop-blur-sm transition-all duration-300",
                      step.status === "completed" &&
                        "border-green-500/30 bg-green-500/10",
                      step.status === "failed" &&
                        "border-red-500/30 bg-red-500/10",
                      step.status === "in_progress" &&
                        "border-border/50 bg-muted/30 ring-border/50 shadow-lg ring-2",
                      step.status === "pending" &&
                        "border-border/30 bg-muted/20",
                    )}
                  >
                    <div className="flex items-start gap-3 p-3">
                      <StepIcon step={step} />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-foreground text-sm font-semibold">
                            {step.name}
                          </p>
                          {step.status === "failed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleRetryStep}
                              disabled={isRetrying}
                              className="h-6 gap-1 rounded-full bg-red-100 px-2 text-[10px] font-semibold text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30"
                            >
                              {isRetrying ? (
                                <>
                                  <Loader2 className="size-3 animate-spin" />
                                  Retrying...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="size-3" />
                                  Retry
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {step.id === "attestation" &&
                          step.status === "in_progress" && (
                            <p className="text-muted-foreground text-[10px]">
                              Waiting for Circle&apos;s attestation service (may take
                              a few minutes)
                            </p>
                          )}

                        {step.error && (
                          <div className="rounded-lg border border-red-500/30 bg-red-500/20 px-2 py-1.5">
                            <p className="text-[10px] font-medium text-red-600 dark:text-red-400">
                              {parseStepError(step.name, step.error)}
                            </p>
                          </div>
                        )}

                        {step.txHash && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => copyToClipboard(step.txHash!)}
                              className="group/copy bg-muted/50 text-foreground hover:bg-muted/80 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all"
                            >
                              {copiedHash === step.txHash ? (
                                <>
                                  <Check className="size-3 text-green-500" />
                                  <span className="text-green-500">
                                    Copied!
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" />
                                  <span className="font-mono">
                                    {step.txHash.slice(0, 6)}...
                                    {step.txHash.slice(-4)}
                                  </span>
                                </>
                              )}
                            </button>
                            <a
                              href={`${step.id === "mint" ? toNetwork?.explorerUrl : fromNetwork?.explorerUrl}/tx/${step.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-muted/50 text-foreground hover:bg-muted/80 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all"
                            >
                              <ExternalLink className="size-3" />
                              Explorer
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
