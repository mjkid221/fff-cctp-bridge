"use client";

import { motion } from "motion/react";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  RecentTransactions,
  RecentTransactionsHeader,
} from "../../recent-transactions";
import type { TransactionHistoryDrawerProps } from "./transaction-history.types";

export function TransactionHistoryDrawerView({
  onClose,
}: TransactionHistoryDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
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
            Transaction History
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

        {/* Fixed header description */}
        <div className="border-border/30 border-b px-4 pb-3">
          <RecentTransactionsHeader />
        </div>

        {/* Content */}
        <ScrollArea className="macos-window-scrollbar flex-1">
          <div className="p-4">
            <RecentTransactions hideHeader />
          </div>
        </ScrollArea>
      </motion.div>
    </>
  );
}
