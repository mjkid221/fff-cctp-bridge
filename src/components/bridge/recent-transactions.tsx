"use client";

import { motion } from "motion/react";
import {
  ExternalLink,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "~/lib/utils";
import {
  useTransactionHistory,
  useRetryBridge,
  NETWORK_CONFIGS,
  useEnvironment,
} from "~/lib/bridge";
import { Button } from "~/components/ui/button";

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
  const { transactions, isLoading, refresh } = useTransactionHistory();
  const { retryBridge, isRetrying } = useRetryBridge();
  const environment = useEnvironment();

  const handleRetry = async (txId: string) => {
    try {
      await retryBridge(txId);
    } catch (error) {
      console.error("Retry failed:", error);
    }
  };

  // Filter transactions by current environment
  const filteredTransactions = transactions.filter((tx) => {
    const fromNetwork = NETWORK_CONFIGS[tx.fromChain];
    return fromNetwork?.environment === environment;
  });

  if (isLoading && filteredTransactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-muted-foreground w-full max-w-4xl text-center"
      >
        Loading transactions...
      </motion.div>
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-foreground text-2xl font-bold">
            Recent Transactions
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Your latest {environment} bridge activity
          </p>
        </div>
        <Button
          onClick={() => void refresh()}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
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
              className={cn(
                "group border-border/50 bg-card/50 relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all",
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

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isFailed && (
                    <Button
                      onClick={() => void handleRetry(tx.id)}
                      disabled={isRetrying}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <RefreshCw className="size-4" />
                      Retry
                    </Button>
                  )}
                  {tx.sourceTxHash && (
                    <motion.a
                      href={`${fromNetwork?.explorerUrl}/tx/${tx.sourceTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                        "hover:bg-muted/50 hover:text-foreground",
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="hidden sm:inline">View</span>
                      <ExternalLink className="size-4" />
                    </motion.a>
                  )}
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
