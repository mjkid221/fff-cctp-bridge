"use client";

import { motion } from "motion/react";
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
  X,
  Zap,
  Wallet,
} from "lucide-react";
import {
  parseStepError,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  getTransactionDisplayAddress,
  formatAddressShort,
} from "~/lib/bridge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { ScrollArea } from "~/components/ui/scroll-area";
import { StepIcon } from "./components/step-icon";
import { formatTime } from "./transaction-windows.hooks";
import type { TransactionWindowViewProps } from "./transaction-windows.types";

export function TransactionWindowView({
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
  fromNetworkDisplayName,
  toNetworkDisplayName,
  fromNetworkExplorerUrl,
  toNetworkExplorerUrl,

  onDragStart,
  onDragEnd,
  onClose,
  onFocus,
  onMinimize,
  onMaximize,
  onCopyToClipboard,
  onRetryStep,
  onDismiss,
  dragControls,
}: TransactionWindowViewProps) {
  return (
    <motion.div
      ref={windowRef}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
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
          onDoubleClick={onMaximize}
        >
          {/* Traffic light buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
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
                onMinimize();
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
                onMaximize();
              }}
              className="group/btn relative size-3 rounded-full bg-green-500 transition-all hover:bg-green-600"
              aria-label={isMaximized ? "Restore window" : "Maximize window"}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                {isMaximized ? "−" : "+"}
              </span>
            </motion.button>
          </div>

          {/* Window title with transfer method badge */}
          <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              Bridge Progress - {transaction.amount} USDC
            </span>
            {transaction.transferMethod === "fast" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                <Zap className="size-3" />
                Fast
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
                Standard
              </span>
            )}
          </div>

          {/* Spacer for centering */}
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
          <ScrollArea className="macos-window-scrollbar max-h-[70vh]">
            <div className="space-y-3 p-5">
              {/* Transaction header */}
              <div className="space-y-2">
                {/* Amount and route */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                      <div className="bg-muted/50 flex items-center gap-1 rounded-full px-2 py-0.5">
                        <span className="text-foreground text-xs font-semibold">
                          {fromNetworkDisplayName}
                        </span>
                      </div>
                      <ArrowRight className="size-3" />
                      <div className="bg-muted/50 flex items-center gap-1 rounded-full px-2 py-0.5">
                        <span className="text-foreground text-xs font-semibold">
                          {toNetworkDisplayName}
                        </span>
                      </div>
                    </div>
                    {/* Amount, fee, and addresses on same line */}
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <h3 className="text-foreground text-2xl font-bold tracking-tight">
                        {transaction.amount}
                      </h3>
                      <span className="text-muted-foreground text-sm font-semibold">
                        USDC
                      </span>
                      {transaction.transferMethod === "fast" &&
                        transaction.providerFeeUsdc &&
                        parseFloat(transaction.providerFeeUsdc) > 0 && (
                          <span className="text-muted-foreground text-[10px]">
                            (fee:{" "}
                            <span className="text-amber-500">
                              {parseFloat(transaction.providerFeeUsdc).toFixed(
                                6,
                              )}
                            </span>
                            )
                          </span>
                        )}
                      <span className="text-muted-foreground mx-1 text-[10px]">
                        |
                      </span>
                      <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
                        <a
                          href={getExplorerAddressUrl(
                            transaction.fromChain,
                            transaction.sourceAddress ??
                              transaction.userAddress,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary font-mono transition-colors"
                        >
                          {formatAddressShort(
                            transaction.sourceAddress ??
                              transaction.userAddress,
                          )}
                        </a>
                        <ArrowRight className="size-2.5" />
                        <a
                          href={getExplorerAddressUrl(
                            transaction.toChain,
                            getTransactionDisplayAddress(transaction),
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary font-mono transition-colors"
                        >
                          {formatAddressShort(
                            getTransactionDisplayAddress(transaction),
                          )}
                        </a>
                      </div>
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
                    isCancelled && "border-gray-500/30 bg-gray-500/10",
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
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Transfer In Progress
                          </p>
                          <p className="text-[10px] text-gray-600/80 dark:text-gray-400/80">
                            Please wait while we process your transfer
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={onDismiss}
                          className="h-7 gap-1 rounded-full bg-gray-100 px-2.5 text-[10px] font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <X className="size-3" />
                          Dismiss
                        </Button>
                      </>
                    )}
                    {isCancelled && (
                      <>
                        <div className="flex size-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/50">
                          <X className="size-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Transfer Cancelled
                          </p>
                          <p className="text-[10px] text-gray-600/80 dark:text-gray-400/80">
                            This transfer was dismissed by user
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
                                onClick={onRetryStep}
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
                                Waiting for Circle&apos;s attestation service
                                (may take a few minutes)
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
                                onClick={() => onCopyToClipboard(step.txHash!)}
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
                                href={getExplorerTxUrl(
                                  step.id === "mint"
                                    ? transaction.toChain
                                    : transaction.fromChain,
                                  step.txHash,
                                )}
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
          </ScrollArea>
        </motion.div>
      </div>
    </motion.div>
  );
}
