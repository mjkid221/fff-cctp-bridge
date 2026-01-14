"use client";

import { motion } from "motion/react";
import {
  ExternalLink,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { NETWORK_CONFIGS } from "~/lib/bridge";
import { formatTimestamp } from "./recent-transactions.hooks";
import type { TransactionRowProps } from "./recent-transactions.types";

export function TransactionRow({
  transaction: tx,
  index,
  onOpenTransaction,
}: TransactionRowProps) {
  const fromNetwork = NETWORK_CONFIGS[tx.fromChain];
  const toNetwork = NETWORK_CONFIGS[tx.toChain];
  const isPending = tx.status === "pending" || tx.status === "bridging";
  const isFailed = tx.status === "failed";
  const isCompleted = tx.status === "completed";
  const isCancelled = tx.status === "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.01, x: 4 }}
      onClick={() => onOpenTransaction(tx)}
      className={cn(
        "group border-border/50 bg-card/50 relative cursor-pointer overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all",
        "hover:border-border hover:bg-card/80 hover:shadow-lg",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Status Icon */}
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              isCompleted && "bg-green-500/10",
              isPending && "bg-blue-500/10",
              isFailed && "bg-red-500/10",
              isCancelled && "bg-gray-500/10",
            )}
          >
            {isCompleted && <CheckCircle2 className="size-5 text-green-500" />}
            {isPending && (
              <Clock className="size-5 animate-pulse text-blue-500" />
            )}
            {isFailed && <AlertCircle className="size-5 text-red-500" />}
            {isCancelled && <X className="size-5 text-gray-500" />}
          </div>

          {/* Transaction Details */}
          <div>
            <div className="text-foreground flex items-center gap-2 text-sm font-medium">
              <span>{fromNetwork?.displayName}</span>
              <ArrowRight className="text-muted-foreground size-4" />
              <span>{toNetwork?.displayName}</span>
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
              <span>{tx.amount} USDC</span>
              <span>•</span>
              <span>{formatTimestamp(tx.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-semibold",
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
          <ExternalLink className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>

      {/* Gradient effect on hover */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}
