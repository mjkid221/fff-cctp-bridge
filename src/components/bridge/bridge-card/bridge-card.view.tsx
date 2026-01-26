"use client";

import { motion, AnimatePresence } from "motion/react";
import { ChainSelector } from "../chain-selector";
import { AmountInput } from "../amount-input";
import { SwapButton } from "../swap-button";
import { DestinationAddressInput } from "../destination-address-input";
import { WalletSelector } from "../wallet-selector";
import { TransferMethodToggle } from "../transfer-method-toggle";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Skeleton } from "~/components/ui/skeleton";
import {
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { NETWORK_CONFIGS } from "~/lib/bridge/networks";
import { getAttestationTimeDisplay } from "~/lib/bridge/attestation-times";
import { getNetworkTypeLabel } from "~/lib/bridge/utils";
import { DraggableFeeSummary } from "./fee-summary";
import { WindowPortal } from "~/components/ui/window-portal";
import type { BridgeCardViewProps } from "./bridge-card.types";
import type { SupportedChainId } from "~/lib/bridge/networks";

interface BridgeButtonState {
  isBridging: boolean;
  isInitialized: boolean;
  fromChain: SupportedChainId | null;
  toChain: SupportedChainId | null;
  needsSourceWallet: boolean;
  needsDestinationWallet: boolean;
  needsWalletForMinting: boolean;
  destNetworkName: string | undefined;
  isValidAmount: boolean;
}

function getBridgeButtonContent(state: BridgeButtonState): React.ReactNode {
  // Form state checks first - prompt user for missing input
  // This ensures after amount reset, user sees "Enter Amount" not "Processing..."
  if (!state.isInitialized) return <span>Connect Wallet</span>;
  if (!state.fromChain || !state.toChain) return <span>Select Networks</span>;
  if (state.needsSourceWallet) return <span>Select Source Wallet</span>;
  if (state.needsDestinationWallet)
    return <span>Select Destination Wallet</span>;
  if (state.needsWalletForMinting) {
    return <span>Connect {state.destNetworkName} Wallet</span>;
  }
  if (!state.isValidAmount) return <span>Enter Amount</span>;

  return (
    <motion.div className="flex items-center gap-2">
      <span>Bridge USDC</span>
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 sm:size-5" />
    </motion.div>
  );
}

export function BridgeCardView({
  isInitialized,
  transferMethod,
  onTransferMethodChange,
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
  needsSourceWallet,
  needsDestinationWallet,
  needsWalletForMinting,
  destNetworkName,
  onBridge,
  onPromptDestWallet,
  onPromptSourceWallet,
  fromNetworkType,
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

            {/* Transfer Method Toggle */}
            <div className="mb-4">
              <TransferMethodToggle
                value={transferMethod}
                onChange={onTransferMethodChange}
              />
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
                containerRef={bridgeCardRef}
              />

              {/* Source Wallet Selector or Warning */}
              <AnimatePresence mode="wait">
                {fromChain && sourceWallets.length > 0 ? (
                  <motion.div
                    key="source-wallet-selector"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <WalletSelector
                      wallets={sourceWallets}
                      selectedWalletId={selectedSourceWalletId}
                      onSelectWallet={onSelectSourceWallet}
                      label="Source Wallet"
                      networkType={NETWORK_CONFIGS[fromChain]?.type ?? "evm"}
                    />
                  </motion.div>
                ) : needsSourceWallet && fromChain ? (
                  <motion.div
                    key="source-wallet-warning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="bg-muted/30 overflow-hidden rounded-xl p-1 backdrop-blur-xl"
                  >
                    <div className="bg-card/80 border-border/50 flex items-center gap-3 rounded-lg border p-3 shadow-sm">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                        <AlertCircle className="size-4 text-blue-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground text-sm font-medium">
                          Connect {getNetworkTypeLabel(fromNetworkType)} wallet
                        </p>
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                          Required to send USDC from{" "}
                          {NETWORK_CONFIGS[fromChain]?.name}
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          onPromptSourceWallet(NETWORK_CONFIGS[fromChain]?.name)
                        }
                        size="sm"
                        className="h-8 shrink-0 border-0 bg-blue-500/10 px-3 text-xs font-medium text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
                      >
                        Connect
                      </Button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

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
                containerRef={bridgeCardRef}
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
                        className="text-muted-foreground hover:text-foreground cursor-pointer text-xs leading-none font-medium transition-colors"
                      >
                        Use custom address
                      </label>
                    </div>
                  </div>

                  <div className="relative" style={{ perspective: "1000px" }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={
                          useCustomAddress ? "custom-input" : "wallet-selector"
                        }
                        initial={{ rotateY: -90, opacity: 0, scale: 0.9 }}
                        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                        exit={{ rotateY: 90, opacity: 0, scale: 0.9 }}
                        transition={{
                          duration: 0.2,
                          ease: [0.34, 1.56, 0.64, 1],
                        }}
                        style={{ transformStyle: "preserve-3d" }}
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
                            networkType={
                              NETWORK_CONFIGS[toChain]?.type ?? "evm"
                            }
                            placeholder="Select destination wallet"
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Destination Wallet Warnings */}
              <AnimatePresence mode="wait">
                {needsWalletForMinting && toChain ? (
                  <motion.div
                    key="minting-wallet-warning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="bg-muted/30 overflow-hidden rounded-xl p-1 backdrop-blur-xl"
                  >
                    <div className="bg-card/80 border-border/50 flex items-center gap-3 rounded-lg border p-3 shadow-sm">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                        <AlertTriangle className="size-4 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground text-sm font-medium">
                          {destNetworkName} wallet required
                        </p>
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                          Connect a wallet to pay gas fees on the destination
                          chain. Your funds will be deposited to{" "}
                          {customAddress.slice(0, 8)}...
                        </p>
                      </div>
                      <Button
                        onClick={() => onPromptDestWallet(destNetworkName)}
                        size="sm"
                        className="h-8 shrink-0 border-0 bg-amber-500/10 px-3 text-xs font-medium text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                      >
                        Connect
                      </Button>
                    </div>
                  </motion.div>
                ) : needsDestinationWallet && toChain ? (
                  <motion.div
                    key="destination-wallet-warning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="bg-muted/30 overflow-hidden rounded-xl p-1 backdrop-blur-xl"
                  >
                    <div className="bg-card/80 border-border/50 flex items-center gap-3 rounded-lg border p-3 shadow-sm">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                        <AlertCircle className="size-4 text-blue-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground text-sm font-medium">
                          Connect{" "}
                          {getNetworkTypeLabel(
                            NETWORK_CONFIGS[toChain]?.type ?? null,
                          )}{" "}
                          wallet
                        </p>
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                          Required to receive USDC on{" "}
                          {NETWORK_CONFIGS[toChain]?.name}
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          onPromptDestWallet(NETWORK_CONFIGS[toChain]?.name)
                        }
                        size="sm"
                        className="h-8 shrink-0 border-0 bg-blue-500/10 px-3 text-xs font-medium text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
                      >
                        Connect
                      </Button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

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
                    <span className="text-muted-foreground">
                      {transferMethod === "fast" ? "CCTP fee" : "Bridge fee"}
                    </span>
                    {isEstimating ? (
                      <Skeleton className="h-3 w-20 sm:h-4 sm:w-24" />
                    ) : transferMethod === "fast" &&
                      estimate?.providerFees &&
                      estimate.providerFees.length > 0 ? (
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        ~0.1% (
                        {estimate.providerFees
                          .reduce((sum, fee) => sum + parseFloat(fee.amount), 0)
                          .toFixed(6)}{" "}
                        USDC)
                      </span>
                    ) : (
                      <span className="font-medium text-green-600 dark:text-green-500">
                        FREE (0%)
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      Est. time
                    </span>
                    {isEstimating ? (
                      <Skeleton className="h-3 w-16 sm:h-4 sm:w-20" />
                    ) : (
                      <span className="text-foreground font-medium">
                        {fromChain
                          ? getAttestationTimeDisplay(
                              fromChain,
                              transferMethod === "fast",
                            )
                          : "~13 min"}
                      </span>
                    )}
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
                {getBridgeButtonContent({
                  isBridging,
                  isInitialized,
                  fromChain,
                  toChain,
                  needsSourceWallet,
                  needsDestinationWallet,
                  needsWalletForMinting,
                  destNetworkName,
                  isValidAmount,
                })}
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

        {/* Fee Summary Card. TODO: refactor to move into a shared root with other windows */}
        <WindowPortal>
          <AnimatePresence>
            {showFeeDetails && fromChain && toChain && (
              <DraggableFeeSummary
                estimate={estimate}
                isEstimating={isEstimating}
                fromChain={fromChain}
                toChain={toChain}
                amount={amount || "0.00"}
                transferMethod={transferMethod}
                onClose={onToggleFeeDetails}
              />
            )}
          </AnimatePresence>
        </WindowPortal>
      </div>
    </>
  );
}
