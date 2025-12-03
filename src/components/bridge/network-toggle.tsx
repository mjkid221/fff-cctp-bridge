"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEnvironment, useSetEnvironment } from "~/lib/bridge";
import { cn } from "~/lib/utils";
import { Rocket, TestTube } from "lucide-react";

export function NetworkToggle() {
  const environment = useEnvironment();
  const setEnvironment = useSetEnvironment();

  const isMainnet = environment === "mainnet";

  return (
    <motion.button
      onClick={() => setEnvironment(isMainnet ? "testnet" : "mainnet")}
      className={cn(
        "group relative flex h-10 items-center gap-2 overflow-hidden rounded-xl border px-3 transition-all",
        isMainnet
          ? "border-blue-500/50 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-blue-600/10"
          : "border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-600/10",
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-50"
        animate={{
          background: isMainnet
            ? [
                "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
              ]
            : [
                "radial-gradient(circle at 20% 50%, rgba(251, 191, 36, 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(249, 115, 22, 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(251, 191, 36, 0.3) 0%, transparent 50%)",
              ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Icon */}
      <AnimatePresence mode="wait">
        {isMainnet ? (
          <motion.div
            key="rocket"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <Rocket className="size-4 text-blue-500" />
          </motion.div>
        ) : (
          <motion.div
            key="testtube"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <TestTube className="size-4 text-amber-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text */}
      <motion.span
        className={cn(
          "relative z-10 text-sm font-semibold",
          isMainnet ? "text-blue-500" : "text-amber-500",
        )}
        layout
      >
        {isMainnet ? "Mainnet" : "Testnet"}
      </motion.span>

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  );
}
