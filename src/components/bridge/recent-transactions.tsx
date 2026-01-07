"use client";

import { motion } from "motion/react";
import {
  ExternalLink,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "~/lib/utils";
import {
  useTransactionHistory,
  NETWORK_CONFIGS,
  useEnvironment,
  useBridgeStore,
} from "~/lib/bridge";
import { Skeleton } from "~/components/ui/skeleton";

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function RecentTransactions() {
  const { transactions, isLoading } = useTransactionHistory();
  const environment = useEnvironment();
  const openTransactionWindow = useBridgeStore((state) => state.openTransactionWindow);

  const handleOpenTransaction = (transaction: typeof transactions[0]) => {
    openTransactionWindow(transaction);
  };

  // Filter transactions by current environment
  const filteredTransactions = transactions.filter((tx) => {
    const fromNetwork = NETWORK_CONFIGS[tx.fromChain];
    return fromNetwork?.environment === environment;
  });

  if (isLoading && filteredTransactions.length === 0) {
    return (
      <div className="w-full max-w-4xl space-y-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-muted-foreground w-full max-w-4xl text-center"
      >
        No {environment} transactions yet
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="w-full max-w-4xl"
    >
      <div className="mb-6">
        <h3 className="text-foreground text-2xl font-bold">
          Recent Transactions
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Your latest {environment} bridge activity
        </p>
      </div>

      <div className="space-y-3">
        {filteredTransactions.map((tx, index) => {
          const fromNetwork = NETWORK_CONFIGS[tx.fromChain];
          const toNetwork = NETWORK_CONFIGS[tx.toChain];
          const isPending = tx.status === "pending" || tx.status === "bridging";
          const isFailed = tx.status === "failed";
          const isCompleted = tx.status === "completed";

          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.01, x: 4 }}
              onClick={() => handleOpenTransaction(tx)}
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
                    )}
                  >
                    {isCompleted && (
                      <CheckCircle2 className="size-5 text-green-500" />
                    )}
                    {isPending && (
                      <Clock className="size-5 animate-pulse text-blue-500" />
                    )}
                    {isFailed && (
                      <AlertCircle className="size-5 text-red-500" />
                    )}
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
                    )}
                  >
                    {isCompleted && "Completed"}
                    {isPending && "In Progress"}
                    {isFailed && "Failed"}
                  </span>
                  <ExternalLink className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>

              {/* Gradient effect on hover */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
