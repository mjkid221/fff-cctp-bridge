"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "~/lib/utils";
import type { BridgeTransaction } from "~/lib/bridge/types";
import { NETWORK_CONFIGS, getExplorerTxUrl } from "~/lib/bridge/networks";

interface BridgeProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: BridgeTransaction | null;
}

export function BridgeProgressModal({
  isOpen,
  onClose,
  transaction,
}: BridgeProgressModalProps) {
  if (!isOpen || !transaction) return null;

  const fromNetwork = NETWORK_CONFIGS[transaction.fromChain];
  const toNetwork = NETWORK_CONFIGS[transaction.toChain];

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <CheckCircle2 className="size-6 text-green-500 drop-shadow-lg" />
        );
      case "in_progress":
        return <Loader2 className="size-6 animate-spin text-blue-500" />;
      case "failed":
        return <AlertCircle className="size-6 text-red-500" />;
      default:
        return (
          <div className="size-6 rounded-full border-2 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800" />
        );
    }
  };

  const canClose =
    transaction.status === "completed" || transaction.status === "failed";

  // Simplified step names for users
  const stepDisplayNames: Record<string, string> = {
    Approve: "1. Approve",
    Burn: "2. Send from source",
    Attest: "3. Processing",
    Mint: "4. Receive on destination",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
        onClick={canClose ? onClose : undefined}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
          }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20" />

          {/* Close button - only when can close */}
          {canClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="size-5" />
            </button>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-8 text-center">
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-2 text-2xl font-semibold text-slate-900 dark:text-white"
              >
                {transaction.status === "completed"
                  ? "Transfer Complete!"
                  : transaction.status === "failed"
                    ? "Transfer Failed"
                    : "Processing Transfer"}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-slate-600 dark:text-slate-400"
              >
                {transaction.amount} USDC • {fromNetwork?.name} →{" "}
                {toNetwork?.name}
              </motion.p>
            </div>

            {/* Progress Steps - Horizontal */}
            <div className="mb-8">
              <div className="relative">
                {/* Progress line */}
                <div className="absolute left-0 right-0 top-6 h-1 bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    className="h-full bg-slate-900 dark:bg-slate-100"
                    initial={{ width: "0%" }}
                    animate={{
                      width: `${
                        (transaction.steps.filter((s) => s.status === "completed").length /
                          transaction.steps.length) *
                        100
                      }%`,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                {/* Steps */}
                <div className="relative flex justify-between">
                  {transaction.steps.map((step, index) => {
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        className="flex flex-col items-center"
                        style={{ width: `${100 / transaction.steps.length}%` }}
                      >
                        {/* Step icon */}
                        <div
                          className={cn(
                            "relative z-10 flex size-12 items-center justify-center rounded-full border-2 backdrop-blur-xl transition-all",
                            step.status === "completed" &&
                              "border-green-500/50 bg-green-50/50 dark:border-green-500/30 dark:bg-green-950/30",
                            step.status === "in_progress" &&
                              "border-blue-500/50 bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-950/30",
                            step.status === "failed" &&
                              "border-red-500/50 bg-red-50/50 dark:border-red-500/30 dark:bg-red-950/30",
                            step.status === "pending" &&
                              "border-border/50 bg-muted/30",
                          )}
                        >
                          {getStepIcon(step.status)}
                        </div>

                        {/* Step label */}
                        <div className="mt-3 text-center">
                          <p
                            className={cn(
                              "text-xs font-medium transition-colors",
                              step.status === "completed" && "text-green-600 dark:text-green-400",
                              step.status === "in_progress" && "text-blue-600 dark:text-blue-400",
                              step.status === "failed" && "text-red-600 dark:text-red-400",
                              step.status === "pending" && "text-slate-500 dark:text-slate-400",
                            )}
                          >
                            {stepDisplayNames[step.name] ?? step.name}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Current Status Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-6 rounded-2xl border border-white/20 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/60"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  {transaction.status === "completed" && (
                    <>
                      <p className="mb-2 font-semibold text-green-600 dark:text-green-400">
                        Your USDC has arrived!
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {transaction.amount} USDC is now available in your{" "}
                        {toNetwork?.name} wallet.
                      </p>
                    </>
                  )}

                  {transaction.status === "failed" && (
                    <>
                      <p className="mb-2 font-semibold text-red-600 dark:text-red-400">
                        Something went wrong
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {transaction.error ??
                          "The transfer couldn't be completed. Please try again."}
                      </p>
                    </>
                  )}

                  {(transaction.status === "bridging" ||
                    transaction.status === "pending") && (
                    <>
                      <p className="mb-2 font-semibold text-blue-600 dark:text-blue-400">
                        Processing your transfer...
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        This usually takes around{" "}
                        {transaction.estimatedTime
                          ? `${Math.round(transaction.estimatedTime / 1000 / 60)} minutes`
                          : "13 minutes"}
                        . You can close this and check back later.
                      </p>
                    </>
                  )}
                </div>

                {transaction.status === "completed" && (
                  <CheckCircle2 className="size-8 flex-shrink-0 text-green-500" />
                )}
                {transaction.status === "failed" && (
                  <AlertCircle className="size-8 flex-shrink-0 text-red-500" />
                )}
                {(transaction.status === "bridging" ||
                  transaction.status === "pending") && (
                  <Loader2 className="size-8 flex-shrink-0 animate-spin text-blue-500" />
                )}
              </div>

              {/* Transaction link */}
              {transaction.destinationTxHash && transaction.status === "completed" && (
                <a
                  href={getExplorerTxUrl(transaction.toChain, transaction.destinationTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View on block explorer
                  <ExternalLink className="size-4" />
                </a>
              )}
            </motion.div>

            {/* Action button */}
            {canClose && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onClose}
                className="w-full rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 hover:shadow-xl dark:from-white dark:via-slate-50 dark:to-white dark:text-slate-900 dark:hover:from-slate-50 dark:hover:via-white dark:hover:to-slate-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {transaction.status === "completed" ? "Done" : "Close"}
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
