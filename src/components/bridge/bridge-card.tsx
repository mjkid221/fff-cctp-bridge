"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ChainSelector, SUPPORTED_CHAINS, type Chain } from "./chain-selector";
import { AmountInput } from "./amount-input";
import { SwapButton } from "./swap-button";
import { Button } from "~/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

export function BridgeCard() {
  const [fromChain, setFromChain] = useState<Chain>(SUPPORTED_CHAINS[0]!);
  const [toChain, setToChain] = useState<Chain>(SUPPORTED_CHAINS[1]!);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSwapChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
  };

  const handleBridge = async () => {
    setIsLoading(true);
    // Simulate bridge transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  const isValidAmount = amount && parseFloat(amount) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-lg"
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 opacity-50 blur-2xl" />

      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 p-6 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Bridge USDC</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Transfer USDC across chains instantly with Circle CCTP
          </p>
        </div>

        {/* From Chain */}
        <div className="space-y-4">
          <ChainSelector
            selectedChain={fromChain}
            onSelectChain={setFromChain}
            label="From"
            excludeChainId={toChain.id}
          />

          {/* Amount Input */}
          <AmountInput
            value={amount}
            onChange={setAmount}
            balance="1,234.56"
            label="Amount"
          />
        </div>

        {/* Swap Button */}
        <div className="my-4">
          <SwapButton onSwap={handleSwapChains} />
        </div>

        {/* To Chain */}
        <div className="space-y-4">
          <ChainSelector
            selectedChain={toChain}
            onSelectChain={setToChain}
            label="To"
            excludeChainId={fromChain.id}
          />

          {/* Estimated Receive */}
          <motion.div
            className={cn(
              "rounded-2xl border border-border/30 bg-muted/30 p-4 backdrop-blur-xl",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                You will receive
              </span>
              <span className="text-lg font-semibold text-foreground">
                {amount || "0.00"} USDC
              </span>
            </div>
          </motion.div>
        </div>

        {/* Bridge Details */}
        <motion.div
          className="mt-4 space-y-2 rounded-xl bg-muted/20 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transfer time</span>
            <span className="font-medium text-foreground">~13 minutes</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network fee</span>
            <span className="font-medium text-foreground">~$2.50</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bridge fee</span>
            <span className="font-medium text-foreground">0%</span>
          </div>
        </motion.div>

        {/* Bridge Button */}
        <motion.div
          className="mt-6"
          whileHover={{ scale: isValidAmount ? 1.02 : 1 }}
          whileTap={{ scale: isValidAmount ? 0.98 : 1 }}
        >
          <Button
            onClick={handleBridge}
            disabled={!isValidAmount || isLoading}
            className={cn(
              "group relative h-14 w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-base font-semibold text-white shadow-lg transition-all",
              "hover:shadow-xl hover:shadow-primary/25",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {isLoading ? (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="size-5 animate-spin" />
                <span>Processing...</span>
              </motion.div>
            ) : (
              <motion.div className="flex items-center gap-2">
                <span>Bridge USDC</span>
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </motion.div>
            )}
          </Button>
        </motion.div>

        {/* Powered by */}
        <motion.div
          className="mt-4 text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Powered by Circle CCTP
        </motion.div>
      </div>
    </motion.div>
  );
}

