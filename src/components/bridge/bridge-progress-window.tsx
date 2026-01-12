"use client";

import { motion, useDragControls } from "motion/react";
import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import {
  useSetActiveWindow,
  useActiveWindow,
  useWindowPositions,
  useSetWindowPosition,
  useHasHydrated,
  validateOrResetPosition,
  getWindowDimensions,
  constrainToViewport,
  NETWORK_CONFIGS,
  parseStepError,
  getExplorerTxUrl,
  type BridgeTransaction,
  type BridgeStep,
} from "~/lib/bridge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface BridgeProgressWindowProps {
  transaction: BridgeTransaction | null;
  onClose: () => void;
  onRetryStep?: (step: BridgeStep) => void;
  isRetrying?: boolean;
}

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function StepIcon({ step }: { step: BridgeStep }) {
  switch (step.status) {
    case "completed":
      return <CheckCircle2 className="size-5 text-green-500" />;
    case "failed":
      return <AlertCircle className="size-5 text-red-500" />;
    case "in_progress":
      return <Loader2 className="size-5 animate-spin text-blue-500" />;
    case "pending":
    default:
      return <Clock className="size-5 text-gray-400" />;
  }
}

export function BridgeProgressWindow({
  transaction,
  onClose,
  onRetryStep,
  isRetrying = false,
}: BridgeProgressWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const activeWindow = useActiveWindow();
  const setActiveWindow = useSetActiveWindow();
  const windowPositions = useWindowPositions();
  const setWindowPosition = useSetWindowPosition();
  const hasHydrated = useHasHydrated();

  const isActive = activeWindow === "bridge-progress";
  const zIndex = isActive ? "z-20" : "z-10";

  // Get saved position and validate it's within viewport
  const defaultPosition = { x: 400, y: 150 };
  const dimensions = getWindowDimensions("fee-details", isMaximized); // Reuse dimensions

  const savedPosition = hasHydrated
    ? windowPositions["bridge-progress"]
    : defaultPosition;
  const initialPosition = validateOrResetPosition(
    savedPosition,
    dimensions,
    defaultPosition,
  );

  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  useEffect(() => {
    setCurrentPosition(initialPosition);
  }, [initialPosition, initialPosition.x, initialPosition.y]);

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
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const draggedPosition = {
        x: rect.left,
        y: rect.top,
      };

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

      setWindowPosition("bridge-progress", constrainedPosition);
    }
  };

  const handleClose = () => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const newPosition = {
        x: rect.left,
        y: rect.top,
      };
      setWindowPosition("bridge-progress", newPosition);
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
        x: initialPosition.x,
        y: initialPosition.y,
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
      className={cn("fixed top-0 left-0", zIndex)}
      style={{
        touchAction: "none",
      }}
      onPointerDown={() => setActiveWindow("bridge-progress")}
    >
      <div
        className={cn(
          "border-border/50 bg-card/95 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl transition-all duration-300",
          isMaximized ? "w-[600px]" : "w-[500px]",
        )}
      >
        {/* macOS-style title bar */}
        <div
          className="bg-muted/40 group border-border/30 flex cursor-grab items-center justify-between border-b px-3 py-2.5 active:cursor-grabbing"
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
            Bridge Progress
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
          <div className="space-y-6 p-6">
            {/* Transaction header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-foreground text-lg font-semibold">
                    Bridge Transaction
                  </h3>
                  <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                    <span>{fromNetwork?.displayName}</span>
                    <span>→</span>
                    <span>{toNetwork?.displayName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-foreground text-lg font-bold">
                    {transaction.amount} USDC
                  </div>
                  {transaction.estimatedTime && isInProgress && (
                    <div className="text-muted-foreground text-xs">
                      ~{formatTime(transaction.estimatedTime)}
                    </div>
                  )}
                </div>
              </div>

              {/* Overall status */}
              <div
                className={cn(
                  "rounded-lg border p-3",
                  isCompleted && "border-green-500/20 bg-green-500/10",
                  isFailed && "border-red-500/20 bg-red-500/10",
                  isInProgress && "border-blue-500/20 bg-blue-500/10",
                )}
              >
                <div className="flex items-center gap-2">
                  {isCompleted && (
                    <>
                      <CheckCircle2 className="size-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        Transfer completed!
                      </span>
                    </>
                  )}
                  {isFailed && (
                    <>
                      <AlertCircle className="size-5 text-red-500" />
                      <span className="text-sm font-medium text-red-600">
                        Transfer failed
                      </span>
                    </>
                  )}
                  {isInProgress && (
                    <>
                      <Loader2 className="size-5 animate-spin text-blue-500" />
                      <span className="text-sm font-medium text-blue-600">
                        Transfer in progress...
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h4 className="text-foreground text-sm font-semibold">
                Progress
              </h4>
              <div className="space-y-2">
                {transaction.steps.map((step, index) => (
                  <div
                    key={index}
                    className={cn(
                      "rounded-lg border p-3 transition-all",
                      step.status === "completed" &&
                        "border-green-500/20 bg-green-500/5",
                      step.status === "failed" &&
                        "border-red-500/20 bg-red-500/5",
                      step.status === "in_progress" &&
                        "border-blue-500/20 bg-blue-500/5 ring-2 ring-blue-500/20",
                      step.status === "pending" &&
                        "bg-muted/20 border-border/30",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <StepIcon step={step} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-foreground text-sm font-medium">
                              {step.name}
                            </p>
                            {step.id === "attestation" && step.status === "in_progress" && (
                              <p className="text-muted-foreground mt-1 text-xs">
                                Waiting for Circle&apos;s attestation service (may take a few minutes)
                              </p>
                            )}
                          </div>
                          {step.status === "failed" && onRetryStep && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRetryStep(step)}
                              disabled={isRetrying}
                              className="h-7 gap-1.5 text-xs"
                            >
                              {isRetrying ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin" />
                                  Retrying...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="size-3.5" />
                                  Retry
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {step.error && (
                          <p className="mt-2 text-xs text-red-600">
                            {parseStepError(step.name, step.error)}
                          </p>
                        )}

                        {step.txHash && (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(step.txHash!)}
                              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
                            >
                              {copiedHash === step.txHash ? (
                                <>
                                  <Check className="size-3.5 text-green-500" />
                                  <span className="text-green-600">
                                    Copied!
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3.5" />
                                  <span className="font-mono">
                                    {step.txHash.slice(0, 6)}...
                                    {step.txHash.slice(-4)}
                                  </span>
                                </>
                              )}
                            </button>
                            <a
                              href={getExplorerTxUrl(
                                step.id === "mint" ? transaction.toChain : transaction.fromChain,
                                step.txHash,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                            >
                              <ExternalLink className="size-3.5" />
                              View
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="border-border/50 flex items-center justify-between border-t pt-4">
              {transaction.sourceTxHash && (
                <a
                  href={getExplorerTxUrl(transaction.fromChain, transaction.sourceTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs transition-colors"
                >
                  <ExternalLink className="size-4" />
                  View on Explorer
                </a>
              )}
              {isCompleted && (
                <Button onClick={handleClose} className="ml-auto">
                  Done
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
