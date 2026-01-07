"use client";

import { motion } from "motion/react";
import { useEnvironment, useSetEnvironment } from "~/lib/bridge";
import { Circle } from "lucide-react";
import { cn } from "~/lib/utils";

export function NetworkToggle() {
  const environment = useEnvironment();
  const setEnvironment = useSetEnvironment();

  const isMainnet = environment === "mainnet";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setEnvironment(isMainnet ? "testnet" : "mainnet")}
      className={cn(
        "relative flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all",
        "hover:bg-muted/50"
      )}
      aria-label={`Switch to ${isMainnet ? "testnet" : "mainnet"}`}
    >
      <Circle
        className={cn(
          "size-2.5 transition-colors",
          isMainnet ? "fill-blue-500 text-blue-500" : "fill-amber-500 text-amber-500"
        )}
      />
      <span className="text-foreground">
        {isMainnet ? "Mainnet" : "Testnet"}
      </span>
    </motion.button>
  );
}


