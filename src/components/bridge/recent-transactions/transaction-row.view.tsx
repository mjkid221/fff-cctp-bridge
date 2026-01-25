"use client";

import { motion } from "motion/react";
import {
  ExternalLink,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  Wallet,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { NETWORK_CONFIGS, getExplorerAddressUrl } from "~/lib/bridge";
import { formatTimestamp } from "./recent-transactions.utils";
import type { TransactionRowProps } from "./recent-transactions.types";

/** Truncate address for display (0x1234...5678) */
function truncateAddress(address: string): string {
  if (!address) return "";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function TransactionRow({
  transaction: tx,
  index,
  onOpenTransaction,
  disableClick = false,
}: TransactionRowProps) {
  const fromNetwork = NETWORK_CONFIGS[tx.fromChain];
  const toNetwork = NETWORK_CONFIGS[tx.toChain];
  const isPending = tx.status === "pending" || tx.status === "bridging";
  const isFailed = tx.status === "failed";
  const isCompleted = tx.status === "completed";
  const isCancelled = tx.status === "cancelled";
  const isFastMode = tx.transferMethod === "fast";

  // Get addresses with fallbacks for older transactions
  const sourceAddress = tx.sourceAddress ?? tx.userAddress;
  const destAddress =
    tx.destinationAddress ?? tx.recipientAddress ?? tx.userAddress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.2 + index * 0.08 }}
      whileHover={disableClick ? undefined : { scale: 1.01, x: 4 }}
      onClick={disableClick ? undefined : () => onOpenTransaction(tx)}
      className={cn(
        "group border-border/50 bg-card/50 relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all",
        disableClick
          ? "p-3"
          : "hover:border-border hover:bg-card/80 cursor-pointer p-4 hover:shadow-lg",
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn("flex items-center", disableClick ? "gap-3" : "gap-4")}
        >
          {/* Status Icon */}
          <div
            className={cn(
              "flex items-center justify-center rounded-xl",
              disableClick ? "size-8" : "size-10",
              isCompleted && "bg-green-500/10",
              isPending && "bg-blue-500/10",
              isFailed && "bg-red-500/10",
              isCancelled && "bg-gray-500/10",
            )}
          >
            {isCompleted && (
              <CheckCircle2
                className={cn(
                  disableClick ? "size-4" : "size-5",
                  "text-green-500",
                )}
              />
            )}
            {isPending && (
              <Clock
                className={cn(
                  disableClick ? "size-4" : "size-5",
                  "animate-pulse text-blue-500",
                )}
              />
            )}
            {isFailed && (
              <AlertCircle
                className={cn(
                  disableClick ? "size-4" : "size-5",
                  "text-red-500",
                )}
              />
            )}
            {isCancelled && (
              <X
                className={cn(
                  disableClick ? "size-4" : "size-5",
                  "text-gray-500",
                )}
              />
            )}
          </div>

          {/* Transaction Details */}
          <div>
            <div
              className={cn(
                "text-foreground flex items-center gap-2 font-medium",
                disableClick ? "text-xs" : "text-sm",
              )}
            >
              <span>{fromNetwork?.displayName}</span>
              <ArrowRight
                className={cn(
                  "text-muted-foreground",
                  disableClick ? "size-3" : "size-4",
                )}
              />
              <span>{toNetwork?.displayName}</span>
              {/* Transfer method badge (hide on mobile) */}
              {!disableClick && isFastMode && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-500">
                  <Zap className="size-2.5" />
                  Fast
                </span>
              )}
            </div>
            <div
              className={cn(
                "text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1",
                disableClick ? "text-[10px]" : "text-xs",
              )}
            >
              <span>{tx.amount} USDC</span>
              <span>•</span>
              <span>{formatTimestamp(tx.createdAt)}</span>
              {/* Show provider fee for completed fast transactions (hide on mobile) */}
              {!disableClick &&
                isCompleted &&
                isFastMode &&
                tx.providerFeeUsdc &&
                parseFloat(tx.providerFeeUsdc) > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-500">
                      Fee: {parseFloat(tx.providerFeeUsdc).toFixed(6)} USDC
                    </span>
                  </>
                )}
            </div>
            {/* Wallet addresses (hide on mobile) */}
            {!disableClick && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                <Wallet className="text-muted-foreground size-3" />
                <a
                  href={getExplorerAddressUrl(tx.fromChain, sourceAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground font-mono transition-colors"
                >
                  {truncateAddress(sourceAddress)}
                </a>
                <ArrowRight className="text-muted-foreground size-2.5" />
                <a
                  href={getExplorerAddressUrl(tx.toChain, destAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground font-mono transition-colors"
                >
                  {truncateAddress(destAddress)}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full font-semibold",
              disableClick
                ? "px-2 py-0.5 text-[9px]"
                : "px-2.5 py-1 text-[10px]",
              isCompleted && "bg-green-500/10 text-green-500",
              isPending && "bg-blue-500/10 text-blue-500",
              isFailed && "bg-red-500/10 text-red-500",
              isCancelled && "bg-gray-500/10 text-gray-500",
            )}
          >
            {isCompleted && "Completed"}
            {isPending && "In Progress"}
            {isFailed && "Failed"}
            {isCancelled && "Cancelled"}
          </span>
          {!disableClick && (
            <ExternalLink className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
      </div>

      {/* Gradient effect on hover (hide on mobile) */}
      {!disableClick && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </motion.div>
  );
}
