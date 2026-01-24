"use client";

import { motion } from "motion/react";
import {
  TrendingUp,
  Zap,
  Clock,
  PiggyBank,
  ArrowRightLeft,
} from "lucide-react";
import { WindowPortal } from "~/components/ui/window-portal";
import type { StatsWindowViewProps } from "./stats-window.types";

export function StatsWindowView({
  panelRef,
  onClose,
  stats,
  isLoading,
}: StatsWindowViewProps) {
  return (
    <WindowPortal>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0"
        style={{ zIndex: 199 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        ref={panelRef as React.RefObject<HTMLDivElement>}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
        }}
        className="fixed top-14 right-4 hidden w-full max-w-md lg:block"
        style={{ zIndex: 200 }}
      >
        {/* Theme-aware glassmorphic container */}
        <div className="border-border/50 bg-card/95 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="border-border/30 bg-muted/40 border-b px-4 py-3">
            <h3 className="text-foreground text-sm font-medium">
              Bridge Stats
            </h3>
          </div>

          {/* Content */}
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground text-sm">
                  Loading stats...
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Total Bridged */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-muted/30 rounded-lg p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="bg-primary/10 rounded-full p-1.5">
                      <TrendingUp className="text-primary size-4" />
                    </div>
                    <span className="text-muted-foreground text-xs font-medium">
                      Total Bridged
                    </span>
                  </div>
                  <div className="text-foreground text-2xl font-bold">
                    ${stats.totalBridged}
                    <span className="text-muted-foreground ml-1 text-sm font-normal">
                      USDC
                    </span>
                  </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-2 gap-3"
                >
                  {/* Transactions */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <ArrowRightLeft className="text-muted-foreground size-3.5" />
                      <span className="text-muted-foreground text-[10px] font-medium">
                        Transactions
                      </span>
                    </div>
                    <div className="text-foreground text-lg font-semibold">
                      {stats.totalTransactions}
                    </div>
                    <div className="text-muted-foreground mt-1 text-[10px]">
                      <span className="text-amber-500">
                        {stats.fastTransactions} fast
                      </span>
                      {" / "}
                      <span>{stats.standardTransactions} standard</span>
                    </div>
                  </div>

                  {/* Fees Paid */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Zap className="size-3.5 text-amber-500" />
                      <span className="text-muted-foreground text-[10px] font-medium">
                        Fees Paid
                      </span>
                    </div>
                    <div className="text-foreground text-lg font-semibold">
                      ${stats.totalFeesPaid}
                    </div>
                    <div className="text-muted-foreground mt-1 text-[10px]">
                      USDC (fast mode)
                    </div>
                  </div>
                </motion.div>

                {/* Estimated Savings */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-lg border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-green-500/10 p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="rounded-full bg-emerald-500/20 p-1.5">
                      <PiggyBank className="size-4 text-emerald-500" />
                    </div>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Estimated Savings
                    </span>
                  </div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    ~${stats.estimatedSavings}
                    <span className="ml-1 text-xs font-normal text-emerald-600/70 dark:text-emerald-400/70">
                      USDC
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-[10px] leading-relaxed">
                    vs third-party bridges (est. 0.2% fee)
                  </p>
                </motion.div>

                {/* Info footer */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-start gap-2 pt-2"
                >
                  <Clock className="text-muted-foreground mt-0.5 size-3 shrink-0" />
                  <p className="text-muted-foreground text-[10px] leading-relaxed">
                    Standard transfers are free. Fast transfers pay a small USDC
                    fee for instant settlement.
                  </p>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </WindowPortal>
  );
}
