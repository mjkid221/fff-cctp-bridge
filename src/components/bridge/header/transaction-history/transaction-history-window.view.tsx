"use client";

import { motion } from "motion/react";
import { cn } from "~/lib/utils";
import { WindowPortal } from "~/components/ui/window-portal";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  RecentTransactions,
  RecentTransactionsHeader,
} from "../../recent-transactions";
import type { TransactionHistoryWindowViewProps } from "./transaction-history.types";

export function TransactionHistoryWindowView({
  windowRef,
  isMinimized,
  isMaximized,
  currentPosition,
  initialPosition,
  zIndex,
  dragControls,
  onDragStart,
  onDragEnd,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
}: TransactionHistoryWindowViewProps) {
  return (
    <WindowPortal>
      <motion.div
        ref={windowRef}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        initial={{
          opacity: 0,
          scale: 0.95,
          x: initialPosition.x,
          y: initialPosition.y,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          x: currentPosition.x,
          y: currentPosition.y,
        }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
        }}
        className="fixed top-0 left-0 hidden lg:block"
        style={{
          touchAction: "none",
          zIndex,
        }}
        onPointerDown={onFocus}
      >
        <div
          className={cn(
            "border-border/50 bg-card/95 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl transition-all duration-300",
            isMaximized ? "w-[800px]" : "w-[600px]",
          )}
        >
          {/* macOS-style title bar */}
          <div
            className="bg-muted/40 group border-border/30 flex cursor-grab items-center justify-between border-b px-3 py-2.5 active:cursor-grabbing"
            onPointerDown={(e) => dragControls.start(e)}
            onDoubleClick={onMaximize}
          >
            {/* Traffic light buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="group/btn relative size-3 rounded-full bg-red-500 transition-all hover:bg-red-600"
                aria-label="Close window"
              >
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-red-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                  ×
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize();
                }}
                className="group/btn relative size-3 rounded-full bg-yellow-500 transition-all hover:bg-yellow-600"
                aria-label="Minimize window"
              >
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-yellow-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                  −
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onMaximize();
                }}
                className="group/btn relative size-3 rounded-full bg-green-500 transition-all hover:bg-green-600"
                aria-label={isMaximized ? "Restore window" : "Maximize window"}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                  {isMaximized ? "−" : "+"}
                </span>
              </motion.button>
            </div>

            {/* Window title */}
            <div className="text-muted-foreground pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-medium">
              Transaction History
            </div>

            {/* Spacer for centering */}
            <div className="w-[52px]" />
          </div>

          {/* Window content */}
          <motion.div
            animate={{
              height: isMinimized ? 0 : "auto",
              opacity: isMinimized ? 0 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Fixed header */}
            <div className="border-border/30 border-b px-4 pt-4 pb-2">
              <RecentTransactionsHeader />
            </div>
            {/* Scrollable transaction list */}
            <ScrollArea className="macos-window-scrollbar max-h-[520px]">
              <div className="p-4">
                <RecentTransactions hideHeader />
              </div>
            </ScrollArea>
          </motion.div>
        </div>
      </motion.div>
    </WindowPortal>
  );
}
