"use client";

import { motion } from "motion/react";
import {
  TrendingUp,
  Zap,
  Clock,
  PiggyBank,
  ArrowRightLeft,
} from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { BridgeStats } from "./stats-window.types";

interface StatsDrawerViewProps {
  onClose: () => void;
  stats: BridgeStats;
  isLoading: boolean;
}

export function StatsDrawerView({
  onClose,
  stats,
  isLoading,
}: StatsDrawerViewProps) {
  return (
    <>
      {/* Backdrop - mobile only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Drawer - mobile only */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
        }}
        className="border-border/50 bg-card/95 fixed right-0 bottom-0 left-0 z-40 flex max-h-[85vh] flex-col rounded-t-3xl border-t backdrop-blur-2xl lg:hidden"
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center py-3">
          <div className="bg-muted-foreground/30 h-1.5 w-12 rounded-full" />
        </div>

        {/* Header */}
        <div className="border-border/30 flex items-center justify-between border-b px-4 pb-3">
          <h3 className="text-foreground text-lg font-semibold">
            My Bridge Stats
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground -mr-2 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1">
          <ScrollArea className="h-full">
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
                  <div className="bg-muted/30 rounded-lg p-4">
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
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>

                  {/* Estimated Savings */}
                  <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-green-500/10 p-4">
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
                  </div>

                  {/* Info footer */}
                  <div className="flex items-start gap-2 pt-2">
                    <Clock className="text-muted-foreground mt-0.5 size-3 shrink-0" />
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Standard transfers are free. Fast transfers pay a small
                      USDC fee for instant settlement.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </motion.div>
    </>
  );
}
