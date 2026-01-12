"use client";

import { motion, AnimatePresence } from "motion/react";
import { ChainSelector } from "../chain-selector";
import { AmountInput } from "../amount-input";
import { SwapButton } from "../swap-button";
import { DestinationAddressInput } from "../destination-address-input";
import { WalletSelector } from "../wallet-selector";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Skeleton } from "~/components/ui/skeleton";
import { ArrowRight, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { NETWORK_CONFIGS } from "~/lib/bridge/networks";
import { DraggableFeeSummary } from "./fee-summary";
import type { BridgeCardViewProps } from "./bridge-card.types";

export function BridgeCardView({
  isInitialized,
  fromChain,
  toChain,
  onFromChainChange,
  onToChainChange,
  onSwapChains,
  sourceWallets,
  selectedSourceWalletId,
  onSelectSourceWallet,
  destWallets,
  selectedDestWalletId,
  onSelectDestWallet,
  selectedDestWalletAddress,
  destWalletAddress,
  toNetworkType,
  amount,
  onAmountChange,
  balance,
  isValidAmount,
  useCustomAddress,
  customAddress,
  isAddressValid: _isAddressValid,
  onUseCustomAddressChange,
  onCustomAddressChange,
  onAddressValidationChange,
  showFeeDetails,
  onToggleFeeDetails,
  estimate,
  isEstimating,
  switchError,
  bridgeError,
  isBridging,
  canBridge,
  needsDestinationWallet,
  onBridge,
  onPromptDestWallet,
  bridgeCardRef,
  beamContainerRef,
}: BridgeCardViewProps) {
  return (
    <>
      <div ref={beamContainerRef} className="relative">
        <motion.div
          ref={bridgeCardRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto w-full max-w-[95vw] sm:max-w-md md:max-w-lg"
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-sky-500/20 opacity-50 blur-2xl sm:rounded-3xl" />

          <div className="border-border/50 bg-card/80 relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl sm:rounded-3xl sm:p-6">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-foreground text-xl font-bold sm:text-2xl">
                Bridge USDC
              </h2>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                Transfer USDC across chains instantly with Circle CCTP
              </p>
            </div>

            {/* Network Switch Error */}
            <AnimatePresence>
              {switchError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-3 backdrop-blur-xl"
                >
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-yellow-600 dark:text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-600 dark:text-yellow-500">
                        Network switch failed
                      </p>
                      <p className="mt-1 text-xs text-yellow-600/80 dark:text-yellow-500/80">
                        {switchError}. You may need to manually switch networks
                        in your wallet.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* From Chain */}
            <div className="space-y-4">
              <ChainSelector
                selectedChain={fromChain}
                onSelectChain={onFromChainChange}
                label="From"
                excludeChainId={toChain}
              />

              {/* Source Wallet Selector */}
              {fromChain && sourceWallets.length > 0 && (
                <WalletSelector
                  wallets={sourceWallets}
                  selectedWalletId={selectedSourceWalletId}
                  onSelectWallet={onSelectSourceWallet}
                  label="Source Wallet"
                  networkType={NETWORK_CONFIGS[fromChain]?.type ?? "evm"}
                />
              )}

              {/* Amount Input */}
              <AmountInput
                value={amount}
                onChange={onAmountChange}
                balance={balance}
                label="Amount"
              />
            </div>

            {/* Swap Button */}
            <div className="my-3 sm:my-4">
              <SwapButton onSwap={onSwapChains} />
            </div>

            {/* To Chain */}
            <div className="space-y-4">
              <ChainSelector
                selectedChain={toChain}
                onSelectChain={onToChainChange}
                label="To"
                excludeChainId={fromChain}
              />

              {/* Unified Destination Wallet/Address Component */}
              {toChain && toNetworkType && (
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-muted-foreground text-sm font-medium">
                      Destination Wallet
                    </label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="custom-address"
                        checked={useCustomAddress}
                        onCheckedChange={(checked) =>
                          onUseCustomAddressChange(checked === true)
                        }
                      />
                      <label
                        htmlFor="custom-address"
                        className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium leading-none transition-colors"
                      >
                        Use custom address
                      </label>
                    </div>
                  </div>

                  <div className="relative" style={{ perspective: "1000px" }}>
                    <motion.div
                      key={
                        useCustomAddress ? "custom-input" : "wallet-selector"
                      }
                      initial={{
                        rotateY: -90,
                        opacity: 0,
                        scale: 0.9,
                      }}
                      animate={{
                        rotateY: 0,
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{
                        rotateY: 90,
                        opacity: 0,
                        scale: 0.9,
                      }}
                      transition={{
                        duration: 0.4,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                      style={{
                        transformStyle: "preserve-3d",
                      }}
                    >
                      {useCustomAddress ? (
                        <DestinationAddressInput
                          networkType={toNetworkType}
                          value={customAddress}
                          onChange={onCustomAddressChange}
                          onValidationChange={onAddressValidationChange}
                          useCustomAddress={useCustomAddress}
                          onToggleCustomAddress={onUseCustomAddressChange}
                          connectedWalletAddress={
                            selectedDestWalletAddress ?? destWalletAddress
                          }
                        />
                      ) : (
                        <WalletSelector
                          wallets={destWallets}
                          selectedWalletId={selectedDestWalletId}
                          onSelectWallet={onSelectDestWallet}
                          label=""
                          networkType={NETWORK_CONFIGS[toChain]?.type ?? "evm"}
                          placeholder="Select destination wallet"
                        />
                      )}
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Destination Wallet Warning */}
              {needsDestinationWallet && toChain && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-border/50 bg-muted/30 rounded-xl border p-3 backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-3">
                    <div className="text-muted-foreground flex items-start gap-2 text-sm">
                      <AlertCircle className="mt-0.5 size-4 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <p className="text-foreground font-medium">
                          Connect {NETWORK_CONFIGS[toChain]?.name} wallet
                        </p>
                        <p className="text-xs">
                          You need a{" "}
                          {NETWORK_CONFIGS[toChain]?.type === "evm"
                            ? "EVM"
                            : "Solana"}{" "}
                          wallet to receive USDC, or enable &quot;Send to a
                          different address&quot; option above.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        onPromptDestWallet(NETWORK_CONFIGS[toChain]?.name)
                      }
                      variant="outline"
                      className="border-border/50 bg-card/50 hover:bg-card/80 w-full backdrop-blur-xl"
                    >
                      Connect{" "}
                      {NETWORK_CONFIGS[toChain]?.type === "evm"
                        ? "EVM"
                        : "Solana"}{" "}
                      Wallet
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Simple Fee Summary */}
              <motion.div
                className="border-border/30 bg-muted/30 rounded-xl border p-3 backdrop-blur-xl sm:rounded-2xl sm:p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">
                      You&apos;ll receive
                    </span>
                    {isEstimating ? (
                      <Skeleton className="h-3 w-20 sm:h-4 sm:w-24" />
                    ) : (
                      <span className="text-foreground font-medium">
                        {Number(estimate?.receiveAmount ?? 0).toFixed(6)} USDC
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Bridge fee</span>
                    <span className="font-medium text-green-600 dark:text-green-500">
                      FREE (0%)
                    </span>
                  </div>
                  <button
                    onClick={onToggleFeeDetails}
                    className="border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground hidden w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors lg:flex"
                  >
                    <span>{showFeeDetails ? "Hide" : "View"} fee details</span>
                    <ChevronRight
                      className={cn(
                        "size-3.5 transition-transform",
                        showFeeDetails && "rotate-90",
                      )}
                    />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Error Display */}
            {bridgeError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500"
              >
                {bridgeError}
              </motion.div>
            )}

            {/* Bridge Button */}
            <motion.div
              className="mt-4 sm:mt-6"
              whileHover={{ scale: canBridge ? 1.02 : 1 }}
              whileTap={{ scale: canBridge ? 0.98 : 1 }}
            >
              <Button
                onClick={onBridge}
                disabled={!canBridge}
                className={cn(
                  "group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-sm font-semibold text-white shadow-lg transition-all sm:h-14 sm:text-base",
                  "hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 hover:shadow-xl hover:shadow-slate-500/20",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "dark:from-slate-100 dark:via-slate-50 dark:to-slate-100 dark:text-slate-900",
                  "dark:hover:from-slate-50 dark:hover:via-white dark:hover:to-slate-50",
                )}
              >
                {isBridging ? (
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Loader2 className="size-4 animate-spin sm:size-5" />
                    <span>Processing...</span>
                  </motion.div>
                ) : !isInitialized ? (
                  <span>Connect Wallet</span>
                ) : !fromChain || !toChain ? (
                  <span>Select Networks</span>
                ) : needsDestinationWallet ? (
                  <span>Select Destination Wallet</span>
                ) : !isValidAmount ? (
                  <span>Enter Amount</span>
                ) : (
                  <motion.div className="flex items-center gap-2">
                    <span>Bridge USDC</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 sm:size-5" />
                  </motion.div>
                )}
              </Button>
            </motion.div>

            {/* Powered by */}
            <motion.div
              className="text-muted-foreground mt-3 text-center text-[10px] sm:mt-4 sm:text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Powered by Circle CCTP
            </motion.div>
          </div>
        </motion.div>

        {/* Fee Summary Card - Desktop only */}
        <AnimatePresence>
          {showFeeDetails && fromChain && toChain && (
            <DraggableFeeSummary
              estimate={estimate}
              isEstimating={isEstimating}
              fromChain={fromChain}
              toChain={toChain}
              amount={amount || "0.00"}
              onClose={onToggleFeeDetails}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
