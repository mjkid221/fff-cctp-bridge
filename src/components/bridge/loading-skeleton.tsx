"use client";

import { motion } from "motion/react";
import { cn } from "~/lib/utils";

export function LoadingSkeleton() {
  return (
    <div className="w-full max-w-lg space-y-4">
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className={cn(
            "border-border/50 bg-card/50 h-24 overflow-hidden rounded-2xl border backdrop-blur-xl",
          )}
        >
          <motion.div
            className="via-muted/20 h-full w-full bg-gradient-to-r from-transparent to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}


