"use client";

import { motion } from "motion/react";
import { Skeleton } from "~/components/ui/skeleton";
import { TransactionRow } from "./transaction-row.view";
import type { RecentTransactionsViewProps } from "./recent-transactions.types";

export function RecentTransactionsView({
  filteredTransactions,
  isLoading,
  environment,
  hideHeader,
  onOpenTransaction,
}: RecentTransactionsViewProps) {
  if (isLoading && filteredTransactions.length === 0) {
    return (
      <div className="w-full max-w-4xl space-y-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="border-border/50 bg-card/50 rounded-2xl border p-4 backdrop-blur-xl"
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
      {!hideHeader && (
        <div className="mb-6">
          <h3 className="text-foreground text-2xl font-bold">
            Recent Transactions
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Your latest {environment} bridge activity
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filteredTransactions.map((tx, index) => (
          <TransactionRow
            key={tx.id}
            transaction={tx}
            index={index}
            onOpenTransaction={onOpenTransaction}
          />
        ))}
      </div>
    </motion.div>
  );
}
