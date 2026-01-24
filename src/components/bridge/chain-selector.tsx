"use client";

import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "~/lib/utils";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  NETWORK_CONFIGS,
  getNetworksByEnvironment,
  useEnvironment,
  type SupportedChainId,
} from "~/lib/bridge";

interface ChainSelectorProps {
  selectedChain: SupportedChainId | null;
  onSelectChain: (chain: SupportedChainId) => void;
  label: string;
  excludeChainId?: SupportedChainId | null;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function ChainSelector({
  selectedChain,
  onSelectChain,
  label,
  excludeChainId,
  containerRef,
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const environment = useEnvironment();

  const availableChains = getNetworksByEnvironment(environment).filter(
    (chain) => chain.id !== excludeChainId,
  );

  const selected = selectedChain ? NETWORK_CONFIGS[selectedChain] : null;

  const calculateMaxHeight = useCallback(() => {
    if (!dropdownRef.current || !containerRef?.current) {
      setMaxHeight(undefined);
      return;
    }

    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate available space from dropdown top to container bottom
    // Subtract padding (16px) to keep some space from the edge
    const availableSpace = containerRect.bottom - dropdownRect.top - 16;

    // Only set max-height if content would overflow
    // Each network item is roughly 64px (p-3 + icon + text)
    const estimatedContentHeight = availableChains.length * 64 + 16; // +16 for padding

    if (estimatedContentHeight > availableSpace && availableSpace > 100) {
      setMaxHeight(availableSpace);
    } else {
      setMaxHeight(undefined);
    }
  }, [containerRef, availableChains.length]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure dropdown is rendered
      requestAnimationFrame(() => {
        calculateMaxHeight();
      });
    }
  }, [isOpen, calculateMaxHeight]);

  return (
    <div className="relative">
      <label className="text-muted-foreground mb-2 block text-sm font-medium">
        {label}
      </label>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group border-border/50 bg-card/50 relative w-full overflow-hidden rounded-2xl border backdrop-blur-xl transition-all",
          "hover:border-border hover:bg-card/80",
          "focus:ring-ring/20 focus:ring-2 focus:outline-none",
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3 p-4">
          {selected ? (
            <>
              <motion.div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-xl font-bold",
                  selected.color,
                )}
                whileHover={{ rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {selected.icon}
              </motion.div>
              <div className="flex-1 text-left">
                <div className="text-foreground text-sm font-medium">
                  {selected.displayName}
                </div>
                <div className="text-muted-foreground text-xs">
                  USDC on {selected.name}
                </div>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground flex-1 text-left text-sm">
              Select network
            </div>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="text-muted-foreground size-5" />
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
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="border-border/50 bg-card/95 absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl"
          >
            {maxHeight ? (
              <ScrollArea style={{ maxHeight }}>
                <div className="space-y-1 p-2">
                  {availableChains.map((chain, index) => (
                    <motion.button
                      key={chain.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        onSelectChain(chain.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl p-3 transition-all",
                        "hover:bg-accent/50",
                        selectedChain === chain.id && "bg-accent/30",
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
                        <div className="text-foreground text-sm font-medium">
                          {chain.displayName}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          USDC on {chain.name}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="space-y-1 p-2">
                {availableChains.map((chain, index) => (
                  <motion.button
                    key={chain.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      onSelectChain(chain.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-3 transition-all",
                      "hover:bg-accent/50",
                      selectedChain === chain.id && "bg-accent/30",
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
                      <div className="text-foreground text-sm font-medium">
                        {chain.displayName}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        USDC on {chain.name}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
