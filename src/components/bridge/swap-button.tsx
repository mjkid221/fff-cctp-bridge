"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowDownUp } from "lucide-react";
import { cn } from "~/lib/utils";

interface SwapButtonProps {
  onSwap: () => void;
}

export function SwapButton({ onSwap }: SwapButtonProps) {
  const [rotation, setRotation] = useState(0);

  const handleClick = () => {
    setRotation((prev) => prev + 180);
    onSwap();
  };

  return (
    <div className="relative flex justify-center">
      <div className="via-border absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent to-transparent" />
      <motion.button
        onClick={handleClick}
        className={cn(
          "border-border/50 bg-card/80 relative z-10 flex size-12 items-center justify-center rounded-xl border backdrop-blur-xl transition-all",
          "hover:border-border hover:bg-card hover:shadow-lg",
          "focus:ring-ring/20 focus:ring-2 focus:outline-none",
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: rotation }}
        transition={{
          type: "tween",
          duration: 0.15,
          ease: "easeOut",
        }}
      >
        <ArrowDownUp className="text-foreground size-5" />
      </motion.button>
    </div>
  );
}
