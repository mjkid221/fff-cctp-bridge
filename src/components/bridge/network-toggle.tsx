"use client";

import { motion } from "motion/react";
import { useEnvironment, useSetEnvironment } from "~/lib/bridge";
import { Circle } from "lucide-react";

export function NetworkToggle() {
  const environment = useEnvironment();
  const setEnvironment = useSetEnvironment();

  const isMainnet = environment === "mainnet";

  return (
    <motion.button
      whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setEnvironment(isMainnet ? "testnet" : "mainnet")}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/50"
    >
      <Circle
        className={`size-2 ${isMainnet ? "fill-blue-500 text-blue-500" : "fill-amber-500 text-amber-500"}`}
      />
      <span className="text-foreground">
        {isMainnet ? "Mainnet" : "Testnet"}
      </span>
    </motion.button>
  );
}


