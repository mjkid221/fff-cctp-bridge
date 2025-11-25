"use client";

import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

export type Chain = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

const SUPPORTED_CHAINS: Chain[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "⟠",
    color: "from-blue-500/20 to-blue-600/20",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    icon: "◆",
    color: "from-cyan-500/20 to-blue-500/20",
  },
  {
    id: "optimism",
    name: "Optimism",
    icon: "◉",
    color: "from-red-500/20 to-pink-500/20",
  },
  {
    id: "polygon",
    name: "Polygon",
    icon: "⬡",
    color: "from-purple-500/20 to-violet-600/20",
  },
  {
    id: "base",
    name: "Base",
    icon: "◐",
    color: "from-blue-600/20 to-indigo-600/20",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    icon: "▲",
    color: "from-red-600/20 to-orange-500/20",
  },
];

interface ChainSelectorProps {
  selectedChain: Chain;
  onSelectChain: (chain: Chain) => void;
  label: string;
  excludeChainId?: string;
}

export function ChainSelector({
  selectedChain,
  onSelectChain,
  label,
  excludeChainId,
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableChains = SUPPORTED_CHAINS.filter(
    (chain) => chain.id !== excludeChainId,
  );

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl transition-all",
          "hover:border-border hover:bg-card/80",
          "focus:outline-none focus:ring-2 focus:ring-ring/20",
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3 p-4">
          <motion.div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-xl font-bold",
              selectedChain.color,
            )}
            whileHover={{ rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {selectedChain.icon}
          </motion.div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-foreground">
              {selectedChain.name}
            </div>
            <div className="text-xs text-muted-foreground">
              USDC on {selectedChain.name}
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="size-5 text-muted-foreground" />
          </motion.div>
        </div>
      </motion.button>

      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border/50 bg-card/95 p-2 shadow-2xl backdrop-blur-2xl"
          >
            <div className="space-y-1">
              {availableChains.map((chain, index) => (
                <motion.button
                  key={chain.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onSelectChain(chain);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl p-3 transition-all",
                    "hover:bg-accent/50",
                    selectedChain.id === chain.id && "bg-accent/30",
                  )}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-xl font-bold",
                      chain.color,
                    )}
                  >
                    {chain.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-foreground">
                      {chain.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      USDC on {chain.name}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

export { SUPPORTED_CHAINS };

