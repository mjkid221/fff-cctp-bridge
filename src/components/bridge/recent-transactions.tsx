"use client";

import { motion } from "motion/react";
import { ExternalLink, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  status: "pending" | "completed";
  timestamp: string;
  txHash: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    from: "Ethereum",
    to: "Arbitrum",
    amount: "1,000.00",
    status: "completed",
    timestamp: "2 hours ago",
    txHash: "0x1234...5678",
  },
  {
    id: "2",
    from: "Polygon",
    to: "Optimism",
    amount: "500.50",
    status: "completed",
    timestamp: "5 hours ago",
    txHash: "0xabcd...efgh",
  },
  {
    id: "3",
    from: "Base",
    to: "Ethereum",
    amount: "2,500.00",
    status: "pending",
    timestamp: "Just now",
    txHash: "0x9876...5432",
  },
];

export function RecentTransactions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="w-full max-w-4xl"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-foreground">
          Recent Transactions
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your latest bridge activity
        </p>
      </div>

      <div className="space-y-3">
        {mockTransactions.map((tx, index) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.01, x: 4 }}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-xl transition-all",
              "hover:border-border hover:bg-card/80 hover:shadow-lg",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    tx.status === "completed"
                      ? "bg-green-500/10"
                      : "bg-blue-500/10",
                  )}
                >
                  {tx.status === "completed" ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <Clock className="size-5 animate-pulse text-blue-500" />
                  )}
                </div>

                {/* Transaction Details */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span>{tx.from}</span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <span>{tx.to}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{tx.amount} USDC</span>
                    <span>•</span>
                    <span>{tx.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* View Link */}
              <motion.a
                href={`https://etherscan.io/tx/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors",
                  "hover:bg-muted/50 hover:text-foreground",
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="hidden sm:inline">View</span>
                <ExternalLink className="size-4" />
              </motion.a>
            </div>

            {/* Gradient effect on hover */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

