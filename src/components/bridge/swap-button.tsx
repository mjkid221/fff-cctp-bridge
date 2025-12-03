"use client";

import { motion } from "motion/react";
import { ArrowDownUp } from "lucide-react";
import { cn } from "~/lib/utils";

interface SwapButtonProps {
  onSwap: () => void;
}

export function SwapButton({ onSwap }: SwapButtonProps) {
  return (
    <div className="relative flex justify-center">
      <div className="via-border absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent to-transparent" />
      <motion.button
        onClick={onSwap}
        className={cn(
          "border-border/50 bg-card/80 relative z-10 flex size-12 items-center justify-center rounded-xl border backdrop-blur-xl transition-all",
          "hover:border-border hover:bg-card hover:shadow-lg",
          "focus:ring-ring/20 focus:ring-2 focus:outline-none",
        )}
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <ArrowDownUp className="text-foreground size-5" />
      </motion.button>
    </div>
  );
}
