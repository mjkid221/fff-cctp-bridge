"use client";

import { motion } from "motion/react";
import { Clock, ArrowRight } from "lucide-react";
import type { BridgeEstimate, TransferMethod } from "~/lib/bridge/types";
import { getAttestationTimeDisplay } from "~/lib/bridge/attestation-times";
import type { SupportedChainId } from "~/lib/bridge/networks";
import { NETWORK_CONFIGS } from "~/lib/bridge/networks";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

interface FeeSummaryCardProps {
  estimate: BridgeEstimate | null;
  isEstimating: boolean;
  fromChain: SupportedChainId | null;
  toChain: SupportedChainId | null;
  amount: string;
  transferMethod?: TransferMethod;
}

export function FeeSummaryCard({
  estimate,
  isEstimating,
  fromChain,
  toChain,
  amount,
  transferMethod = "standard",
}: FeeSummaryCardProps) {
  const fromNetwork = fromChain ? NETWORK_CONFIGS[fromChain] : null;
  const toNetwork = toChain ? NETWORK_CONFIGS[toChain] : null;
  const isFast = transferMethod === "fast";

  // Calculate CCTP provider fee (only for fast transfers)
  const calculateCctpFee = () => {
    if (!estimate?.providerFees) return "0";
    return estimate.providerFees
      .reduce((sum, fee) => sum + parseFloat(fee.amount), 0)
      .toFixed(6);
  };

  const cctpFee = estimate ? calculateCctpFee() : "0";
  const hasCctpFee = parseFloat(cctpFee) > 0;

  if (!fromChain || !toChain) return null;

  return (
    <div className="space-y-3 p-4">
      {/* Route & Amount */}
      <div className="border-border/30 bg-muted/20 rounded-lg border px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-muted-foreground flex items-center gap-1.5 text-[10px]">
            <span className="truncate">{fromNetwork?.name}</span>
            <ArrowRight className="size-3 shrink-0" />
            <span className="truncate">{toNetwork?.name}</span>
          </div>
          <span className="text-foreground font-mono text-xs font-medium">
            {amount || "0.00"}
          </span>
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5">
          <Clock className="text-muted-foreground size-3" />
          <span className="text-muted-foreground">Est. time</span>
        </div>
        {isEstimating ? (
          <Skeleton className="h-3 w-16" />
        ) : (
          <span className="text-foreground font-medium">
            {fromChain
              ? getAttestationTimeDisplay(fromChain, isFast)
              : "~13 min"}
          </span>
        )}
      </div>

      {/* Fee Breakdown */}
      {estimate?.detailedGasFees && estimate.detailedGasFees.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              Network Fees
            </span>
          </div>

          {estimate.detailedGasFees.map((fee, index) => {
            const network = NETWORK_CONFIGS[fee.blockchain as SupportedChainId];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="border-border/30 bg-muted/10 flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="flex items-start gap-2.5">
                  {/* Simple numbered badge */}
                  <div className="border-border/50 bg-background text-muted-foreground mt-0.5 flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-foreground text-xs font-medium">
                      {fee.name}
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-[10px]">
                      {network?.name ?? fee.blockchain}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-foreground font-mono text-xs font-medium">
                    {parseFloat(fee.fees.fee).toFixed(6)}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-[10px]">
                    {fee.token}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CCTP Fee Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            CCTP Fee
          </span>
        </div>
        <div
          className={cn(
            "flex items-center justify-between rounded-lg border px-3 py-2.5",
            isFast && hasCctpFee
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-green-500/30 bg-green-500/5",
          )}
        >
          <span className="text-muted-foreground text-xs font-medium">
            {isFast ? "Fast transfer fee" : "Standard transfer"}
          </span>
          <span
            className={cn(
              "font-mono text-xs font-semibold",
              isFast && hasCctpFee
                ? "text-amber-600 dark:text-amber-400"
                : "text-green-600 dark:text-green-500",
            )}
          >
            {isFast && hasCctpFee ? `${cctpFee} USDC` : "FREE (0%)"}
          </span>
        </div>
      </div>

      {/* Info note */}
      <div className="border-border/30 bg-muted/20 rounded-lg border px-3 py-2.5">
        <p className="text-muted-foreground text-[9px] leading-relaxed">
          {isFast
            ? "Network fees go to validators. Fast transfers include a small CCTP fee (~0.1%) for instant finality."
            : "Network fees go to validators. Standard transfers have no CCTP fees."}
        </p>
      </div>
    </div>
  );
}
