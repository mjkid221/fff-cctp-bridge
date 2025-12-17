"use client";

import { motion } from "motion/react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import type { BridgeEstimate } from "~/lib/bridge/types";
import { getAttestationTimeDisplay } from "~/lib/bridge/attestation-times";
import type { SupportedChainId } from "~/lib/bridge/networks";
import { NETWORK_CONFIGS } from "~/lib/bridge/networks";
import { Skeleton } from "~/components/ui/skeleton";

interface FeeBreakdownProps {
  estimate: BridgeEstimate | null;
  isEstimating: boolean;
  fromChain: SupportedChainId | null;
  amount: string;
}

export function FeeBreakdown({
  estimate,
  isEstimating,
  fromChain,
  amount,
}: FeeBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate totals
  const calculateTotalGasFee = () => {
    if (!estimate?.detailedGasFees) return "0";
    return estimate.detailedGasFees
      .reduce((sum, fee) => sum + parseFloat(fee.fees.fee), 0)
      .toFixed(9);
  };

  const calculateTotalProviderFee = () => {
    if (!estimate?.providerFees) return "0";
    return estimate.providerFees
      .reduce((sum, fee) => sum + parseFloat(fee.amount), 0)
      .toFixed(6);
  };

  const totalGasFee = estimate ? calculateTotalGasFee() : "0";
  const totalProviderFee = estimate ? calculateTotalProviderFee() : "0";
  const grandTotal = (
    parseFloat(totalGasFee) + parseFloat(totalProviderFee)
  ).toFixed(9);

  return (
    <div className="space-y-2">
      {/* Summary Section */}
      <motion.div
        className="rounded-2xl border border-border/30 bg-muted/30 p-4 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transfer time</span>
            {isEstimating ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <span className="font-medium text-foreground">
                {fromChain ? getAttestationTimeDisplay(fromChain) : "~13 minutes"}
              </span>
            )}
          </div>

          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">You will receive</span>
              <Info className="size-3 text-muted-foreground" />
            </div>
            {isEstimating ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span className="font-medium text-foreground">
                {estimate?.receiveAmount ?? amount} USDC
              </span>
            )}
          </div>

          <div className="my-2 border-t border-border/30" />

          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Total network fees</span>
            </div>
            {isEstimating ? (
              <Skeleton className="h-4 w-28" />
            ) : (
              <span className="font-medium text-foreground">
                {`${parseFloat(totalGasFee).toFixed(6)} ${estimate?.detailedGasFees?.[0]?.token ?? "ETH"}`}
              </span>
            )}
          </div>

          {parseFloat(totalProviderFee) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Provider fee</span>
              {isEstimating ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <span className="font-medium text-foreground">
                  {`${totalProviderFee} USDC`}
                </span>
              )}
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bridge fee</span>
            <span className="font-medium text-green-600 dark:text-green-500">
              FREE (0%)
            </span>
          </div>
        </div>

        {/* Expand/Collapse button */}
        {estimate?.detailedGasFees && estimate.detailedGasFees.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>
              {isExpanded ? "Hide fee details" : "Show fee details"}
            </span>
            {isExpanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>
        )}
      </motion.div>

      {/* Detailed Breakdown - Expandable */}
      {isExpanded && estimate?.detailedGasFees && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden rounded-2xl border border-border/30 bg-muted/20 p-4 backdrop-blur-xl"
        >
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Fee Breakdown by Step
          </h4>

          <div className="space-y-3">
            {estimate.detailedGasFees.map((fee, index) => {
              const network = NETWORK_CONFIGS[fee.blockchain as SupportedChainId];

              return (
                <div
                  key={index}
                  className="rounded-lg border border-border/20 bg-card/50 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full text-xs font-bold text-white",
                          index === 0 && "bg-blue-500",
                          index === 1 && "bg-purple-500",
                          index === 2 && "bg-green-500",
                        )}
                      >
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {fee.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {parseFloat(fee.fees.fee).toFixed(6)} {fee.token}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Network:</span>
                      <span className="font-medium">
                        {network?.name ?? fee.blockchain}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas units:</span>
                      <span className="font-mono">
                        {fee.fees.gas.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas price:</span>
                      <span className="font-mono">
                        {(Number(fee.fees.gasPrice) / 1e9).toFixed(2)} Gwei
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Provider fees if any */}
          {estimate.providerFees && estimate.providerFees.length > 0 && (
            <div className="mt-3 rounded-lg border border-border/20 bg-card/50 p-3">
              <h5 className="mb-2 text-xs font-semibold text-foreground">
                Provider Fees
              </h5>
              {estimate.providerFees.map((fee, index) => (
                <div
                  key={index}
                  className="flex justify-between text-xs text-muted-foreground"
                >
                  <span className="capitalize">{fee.type}:</span>
                  <span className="font-medium">
                    {fee.amount} {fee.token}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="mt-3 border-t border-border/30 pt-3">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-foreground">Total Estimated Cost:</span>
              <span className="text-foreground">
                {parseFloat(grandTotal).toFixed(6)}{" "}
                {estimate.detailedGasFees[0]?.token ?? "ETH"}
              </span>
            </div>
          </div>

          {/* Info note */}
          <div className="mt-3 flex gap-2 rounded-lg bg-blue-500/10 p-2">
            <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
            <p className="text-xs text-muted-foreground">
              Gas fees are estimates and may vary based on network congestion.
              The bridge fee is 0% - you receive 1:1 USDC on the destination
              chain.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
