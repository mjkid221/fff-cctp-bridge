"use client";

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "~/lib/utils";

export type TransactionStatus = "pending" | "success" | "error" | null;

interface TransactionStatusProps {
  status: TransactionStatus;
  txHash?: string;
  onClose?: () => void;
}

export function TransactionStatusModal({
  status,
  txHash,
  onClose,
}: TransactionStatusProps) {
  if (!status) return null;

  const statusConfig = {
    pending: {
      icon: Clock,
      title: "Transaction Pending",
      description: "Your bridge transaction is being processed...",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    success: {
      icon: CheckCircle2,
      title: "Transaction Successful",
      description: "Your USDC has been bridged successfully!",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    error: {
      icon: AlertCircle,
      title: "Transaction Failed",
      description: "There was an error processing your transaction.",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/50 bg-card/95 p-8 shadow-2xl backdrop-blur-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />

          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
              className={cn(
                "mb-6 flex size-20 items-center justify-center rounded-full",
                config.bgColor,
              )}
            >
              <Icon className={cn("size-10", config.color)} />
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-2 text-2xl font-bold text-foreground"
            >
              {config.title}
            </motion.h3>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 text-sm text-muted-foreground"
            >
              {config.description}
            </motion.p>

            {/* Transaction Hash */}
            {txHash && (
              <motion.a
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "mb-6 flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 text-sm font-medium text-foreground transition-colors",
                  "hover:bg-muted",
                )}
              >
                <span className="truncate">View on Explorer</span>
                <ExternalLink className="size-4" />
              </motion.a>
            )}

            {/* Close button */}
            {status !== "pending" && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={onClose}
                className={cn(
                  "w-full rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all",
                  "hover:bg-primary/90",
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

