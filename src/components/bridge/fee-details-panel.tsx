"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Info, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";
import type { BridgeEstimate } from "~/lib/bridge/types";
import { getAttestationTimeDisplay } from "~/lib/bridge/attestation-times";
import type { SupportedChainId } from "~/lib/bridge/networks";
import { NETWORK_CONFIGS } from "~/lib/bridge/networks";
import { Skeleton } from "~/components/ui/skeleton";

interface FeeDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  estimate: BridgeEstimate | null;
  isEstimating: boolean;
  fromChain: SupportedChainId | null;
  toChain: SupportedChainId | null;
  amount: string;
}

export function FeeDetailsPanel({
  isOpen,
  onClose,
  estimate,
  isEstimating,
  fromChain,
  toChain,
  amount,
}: FeeDetailsPanelProps) {
  const fromNetwork = fromChain ? NETWORK_CONFIGS[fromChain] : null;
  const toNetwork = toChain ? NETWORK_CONFIGS[toChain] : null;

  // Calculate total fees
  const calculateTotalGasFee = () => {
    if (!estimate?.detailedGasFees) return "0";
    return estimate.detailedGasFees
      .reduce((sum, fee) => sum + parseFloat(fee.fees.fee), 0)
      .toFixed(6);
  };

  const totalGasFee = estimate ? calculateTotalGasFee() : "0";
  const gasToken = estimate?.detailedGasFees?.[0]?.token ?? "ETH";

  return (
    <>
      {/* Backdrop overlay - only on mobile/tablet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Slide-out panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className={cn(
              "fixed right-0 top-0 z-50 h-full w-full",
              "lg:w-[400px]",
              "overflow-y-auto",
              // Frosted glass effect
              "border-l border-white/20 bg-white/70 backdrop-blur-2xl",
              "dark:border-white/10 dark:bg-slate-900/70",
              "shadow-2xl",
            )}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-white/20 bg-white/50 px-6 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Fee Details
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Transfer Summary */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <Info className="size-4" />
                  <span>Transfer Summary</span>
                </div>

                {/* From -> To */}
                <div className="relative rounded-2xl bg-gradient-to-br from-white/80 to-white/40 p-4 shadow-lg backdrop-blur-xl dark:from-slate-800/80 dark:to-slate-800/40">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        From
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {fromNetwork?.name ?? "Select chain"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {amount || "0.00"} USDC
                      </p>
                    </div>

                    <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                      <ChevronRight className="size-5 text-white" />
                    </div>

                    <div className="flex-1 text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        To
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {toNetwork?.name ?? "Select chain"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {(estimate?.receiveAmount ?? amount) || "0.00"} USDC
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transfer time */}
                <div className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3 backdrop-blur-xl dark:bg-slate-800/60">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Estimated time
                  </span>
                  {isEstimating ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <span className="font-medium text-slate-900 dark:text-white">
                      {fromChain ? getAttestationTimeDisplay(fromChain) : "~13 min"}
                    </span>
                  )}
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <span>Cost Breakdown</span>
                </div>

                {/* Network Fees */}
                {estimate?.detailedGasFees && estimate.detailedGasFees.length > 0 ? (
                  <div className="space-y-3">
                    {estimate.detailedGasFees.map((fee, index) => {
                      const network = NETWORK_CONFIGS[fee.blockchain as SupportedChainId];

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white/80 to-white/40 p-4 shadow-lg backdrop-blur-xl transition-all hover:shadow-xl dark:from-slate-800/80 dark:to-slate-800/40"
                        >
                          {/* Subtle gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 opacity-0 transition-opacity group-hover:opacity-10" />

                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex size-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg",
                                  index === 0 && "bg-gradient-to-br from-blue-500 to-blue-600",
                                  index === 1 && "bg-gradient-to-br from-purple-500 to-purple-600",
                                  index === 2 && "bg-gradient-to-br from-green-500 to-green-600",
                                )}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {fee.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  on {network?.name ?? fee.blockchain}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {parseFloat(fee.fees.fee).toFixed(6)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {fee.token}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl bg-white/60 px-4 py-8 text-center backdrop-blur-xl dark:bg-slate-800/60">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isEstimating ? "Calculating fees..." : "Enter amount to see fees"}
                    </p>
                  </div>
                )}

                {/* Total */}
                <div className="mt-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-2xl dark:from-white dark:to-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white dark:text-slate-900">
                      Total Network Fees
                    </span>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white dark:text-slate-900">
                        {parseFloat(totalGasFee).toFixed(6)} {gasToken}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bridge Fee - Always Free */}
                <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-3 backdrop-blur-xl dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-900 dark:text-green-400">
                      Bridge Fee
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      FREE (0%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 backdrop-blur-xl dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex gap-3">
                  <Info className="mt-0.5 size-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="space-y-2 text-sm text-blue-900 dark:text-blue-300">
                    <p>
                      Network fees are paid to validators for processing your
                      transaction. Actual costs may vary based on network
                      activity.
                    </p>
                    <p className="font-medium">
                      Circle CCTP charges no bridge fees - you receive USDC 1:1
                      on the destination chain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
