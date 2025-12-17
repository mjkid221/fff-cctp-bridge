"use client";

import { motion, AnimatePresence, useDragControls } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { ChainSelector } from "./chain-selector";
import { AmountInput } from "./amount-input";
import { SwapButton } from "./swap-button";
import { DestinationAddressInput } from "./destination-address-input";
import { WalletSelector } from "./wallet-selector";
import { BridgeProgressModal } from "./bridge-progress-modal";
import { FeeSummaryCard } from "./fee-summary-card";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Skeleton } from "~/components/ui/skeleton";
import { ArrowRight, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  useBridgeInit,
  useBridge,
  useBridgeEstimate,
  useWalletBalance,
  useFromChain,
  useToChain,
  useSetFromChain,
  useSetToChain,
  useSwapChains,
  useWalletForNetwork,
  useWalletSelection,
  useCurrentTransaction,
  useActiveWindow,
  useSetActiveWindow,
} from "~/lib/bridge";
import { NETWORK_CONFIGS, type SupportedChainId } from "~/lib/bridge/networks";
import type { BridgeEstimate } from "~/lib/bridge/types";

export function BridgeCard() {
  // Initialize bridge with wallet
  const { isInitialized } = useBridgeInit();

  // Chain selection from store
  const fromChain = useFromChain();
  const toChain = useToChain();
  const setFromChain = useSetFromChain();
  const setToChain = useSetToChain();
  const swapChains = useSwapChains();

  // Wallet selection with multiple wallet support
  const walletSelection = useWalletSelection(fromChain, toChain);
  const {
    sourceWallets,
    selectedSourceWalletId,
    handleSelectSourceWallet,
    destWallets,
    selectedDestWallet,
    selectedDestWalletId,
    handleSelectDestWallet,
  } = walletSelection;

  // Legacy compatibility check for destination wallet
  const toNetworkType = toChain ? NETWORK_CONFIGS[toChain]?.type : null;
  const {
    compatibleWallet: destWallet,
    hasCompatibleWallet: hasDestWallet,
    promptWalletConnection: promptDestWalletConnection,
  } = useWalletForNetwork(toNetworkType);

  // Local state
  const [amount, setAmount] = useState("");
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showFeeDetails, setShowFeeDetails] = useState(false);

  // Current transaction from store
  const currentTransaction = useCurrentTransaction();

  // Bridge operations
  const {
    executeBridge,
    isLoading: isBridging,
    error: bridgeError,
  } = useBridge();
  const { estimateBridge, estimate, isEstimating } = useBridgeEstimate();
  const { balance } = useWalletBalance(fromChain);

  // Estimate on amount/chain change
  useEffect(() => {
    if (fromChain && toChain && amount && parseFloat(amount) > 0) {
      void estimateBridge({
        fromChain,
        toChain,
        amount,
        recipientAddress: useCustomAddress ? customAddress : undefined,
      });
    }
  }, [
    fromChain,
    toChain,
    amount,
    useCustomAddress,
    customAddress,
    estimateBridge,
  ]);

  const handleBridge = async () => {
    if (!fromChain || !toChain || !amount) return;

    // Check if we need destination wallet and don't have one
    if (!useCustomAddress && !hasDestWallet) {
      // Prompt user to connect destination wallet using the hook's prompt function
      const chainName = NETWORK_CONFIGS[toChain]?.name;
      promptDestWalletConnection(chainName);
      return;
    }

    // If using custom address, verify it's valid
    if (useCustomAddress && !isAddressValid) {
      return;
    }

    try {
      // Show progress modal immediately
      setShowProgressModal(true);

      await executeBridge({
        fromChain,
        toChain,
        amount,
        recipientAddress: useCustomAddress ? customAddress : undefined,
      });

      // Don't reset form or close modal here - let user see completion
      // Modal will show "Done" button when complete
    } catch (error) {
      console.error("Bridge failed:", error);
      // Keep modal open to show error
    }
  };

  const isValidAmount = amount && parseFloat(amount) > 0;

  // Can bridge if:
  // - Service is initialized
  // - Has from/to chains and valid amount
  // - Either has compatible dest wallet OR has valid custom address
  // - Not currently bridging
  const canBridge =
    isInitialized &&
    fromChain &&
    toChain &&
    isValidAmount &&
    !isBridging &&
    (useCustomAddress ? isAddressValid : hasDestWallet);

  // Check if we need to prompt for destination wallet
  const needsDestinationWallet = toChain && !hasDestWallet && !useCustomAddress;

  // Refs for bridge card and animated beam container
  const bridgeCardRef = useRef<HTMLDivElement>(null);
  const beamContainerRef = useRef<HTMLDivElement>(null);
  const beamFromRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {/* Container for animated beam */}
      <div ref={beamContainerRef} className="relative">
        {/* Main Bridge Card - Always Centered */}
        <motion.div
          ref={bridgeCardRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto w-full max-w-lg"
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-sky-500/20 opacity-50 blur-2xl" />

          <div className="border-border/50 bg-card/80 relative overflow-hidden rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-foreground text-2xl font-bold">
                Bridge USDC
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Transfer USDC across chains instantly with Circle CCTP
              </p>
            </div>

            {/* From Chain */}
            <div className="space-y-4">
              <ChainSelector
                selectedChain={fromChain}
                onSelectChain={setFromChain}
                label="From"
                excludeChainId={toChain}
              />

              {/* Source Wallet Selector */}
              {fromChain && sourceWallets.length > 0 && (
                <WalletSelector
                  wallets={sourceWallets}
                  selectedWalletId={selectedSourceWalletId}
                  onSelectWallet={handleSelectSourceWallet}
                  label="Source Wallet"
                  networkType={NETWORK_CONFIGS[fromChain]?.type ?? "evm"}
                />
              )}

              {/* Amount Input */}
              <AmountInput
                value={amount}
                onChange={setAmount}
                balance={balance}
                label="Amount"
              />
            </div>

            {/* Swap Button */}
            <div className="my-4">
              <SwapButton onSwap={swapChains} />
            </div>

            {/* To Chain */}
            <div className="space-y-4">
              <ChainSelector
                selectedChain={toChain}
                onSelectChain={setToChain}
                label="To"
                excludeChainId={fromChain}
              />

              {/* Unified Destination Wallet/Address Component */}
              {toChain && toNetworkType && (
                <div className="relative z-10 space-y-2">
                  {/* Label with checkbox toggle */}
                  <div className="flex items-center justify-between">
                    <label className="text-muted-foreground text-sm font-medium">
                      Destination Wallet
                    </label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="custom-address"
                        checked={useCustomAddress}
                        onCheckedChange={(checked) =>
                          setUseCustomAddress(checked === true)
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

                  {/* Stacked cards animation wrapper */}
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
                          onChange={setCustomAddress}
                          onValidationChange={setIsAddressValid}
                          useCustomAddress={useCustomAddress}
                          onToggleCustomAddress={setUseCustomAddress}
                          connectedWalletAddress={
                            selectedDestWallet?.address ?? destWallet?.address
                          }
                        />
                      ) : (
                        <WalletSelector
                          wallets={destWallets}
                          selectedWalletId={selectedDestWalletId}
                          onSelectWallet={handleSelectDestWallet}
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
              {needsDestinationWallet && (
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
                        promptDestWalletConnection(
                          NETWORK_CONFIGS[toChain]?.name,
                        )
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

              {/* Simple Fee Summary - All screen sizes */}
              <motion.div
                className="border-border/30 bg-muted/30 rounded-2xl border p-4 backdrop-blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      You&apos;ll receive
                    </span>
                    {isEstimating ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span className="text-foreground font-medium">
                        {(estimate?.receiveAmount ?? amount) || "0.00"} USDC
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bridge fee</span>
                    <span className="font-medium text-green-600 dark:text-green-500">
                      FREE (0%)
                    </span>
                  </div>
                  {/* View Details button - Desktop only */}
                  <button
                    ref={beamFromRef}
                    onClick={() => setShowFeeDetails(!showFeeDetails)}
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
              className="mt-6"
              whileHover={{ scale: canBridge ? 1.02 : 1 }}
              whileTap={{ scale: canBridge ? 0.98 : 1 }}
            >
              <Button
                onClick={handleBridge}
                disabled={!canBridge && !needsDestinationWallet}
                className={cn(
                  "group relative h-14 w-full overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-base font-semibold text-white shadow-lg transition-all",
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
                    <Loader2 className="size-5 animate-spin" />
                    <span>Processing...</span>
                  </motion.div>
                ) : !isInitialized ? (
                  <span>Connect Wallet</span>
                ) : !fromChain || !toChain ? (
                  <span>Select Networks</span>
                ) : needsDestinationWallet ? (
                  <span>
                    Connect{" "}
                    {NETWORK_CONFIGS[toChain]?.type === "evm"
                      ? "EVM"
                      : "Solana"}{" "}
                    Wallet
                  </span>
                ) : !isValidAmount ? (
                  <span>Enter Amount</span>
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
              className="text-muted-foreground mt-4 text-center text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Powered by Circle CCTP
            </motion.div>
          </div>

          {/* Bridge Progress Modal */}
          <BridgeProgressModal
            isOpen={showProgressModal}
            onClose={() => {
              setShowProgressModal(false);
              // Reset form when modal is closed after completion
              if (
                currentTransaction?.status === "completed" ||
                currentTransaction?.status === "failed"
              ) {
                setAmount("");
                setCustomAddress("");
                setUseCustomAddress(false);
              }
            }}
            transaction={currentTransaction}
          />
        </motion.div>

        {/* Fee Summary Card - Desktop only, draggable macOS-style window */}
        <AnimatePresence>
          {showFeeDetails && fromChain && toChain && (
            <DraggableFeeSummary
              estimate={estimate}
              isEstimating={isEstimating}
              fromChain={fromChain}
              toChain={toChain}
              amount={amount || "0.00"}
              onClose={() => setShowFeeDetails(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// Draggable macOS-style window component
function DraggableFeeSummary({
  estimate,
  isEstimating,
  fromChain,
  toChain,
  amount,
  onClose,
}: {
  estimate: BridgeEstimate | null;
  isEstimating: boolean;
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  amount: string;
  onClose: () => void;
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const activeWindow = useActiveWindow();
  const setActiveWindow = useSetActiveWindow();

  const isActive = activeWindow === "fee-details";
  const zIndex = isActive ? "z-20" : "z-10";

  return (
    <>
      {/* Draggable window */}
      <motion.div
        ref={windowRef}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragElastic={0}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.95, x: 350, y: 100 }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
        }}
        className={cn("fixed left-0 top-0 hidden lg:block", zIndex)}
        style={{
          touchAction: "none",
        }}
        onPointerDown={() => setActiveWindow("fee-details")}
      >
        <div
          className={cn(
            "border-border/50 bg-card/95 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl transition-all duration-300",
            isMaximized ? "w-96" : "w-72",
          )}
        >
          {/* macOS-style title bar - Only this part is draggable */}
          <div
            className="bg-muted/40 group flex cursor-grab items-center justify-between border-b border-border/30 px-3 py-2.5 active:cursor-grabbing"
            onPointerDown={(e) => dragControls.start(e)}
            onDoubleClick={() => setIsMaximized(!isMaximized)}
          >
            {/* Traffic light buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="group/btn relative size-3 rounded-full bg-red-500 transition-all hover:bg-red-600"
                aria-label="Close window"
              >
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-red-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                  ×
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="group/btn relative size-3 rounded-full bg-yellow-500 transition-all hover:bg-yellow-600"
                aria-label="Minimize window"
              >
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-yellow-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                  −
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMaximized(!isMaximized);
                }}
                className="group/btn relative size-3 rounded-full bg-green-500 transition-all hover:bg-green-600"
                aria-label={isMaximized ? "Restore window" : "Maximize window"}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                  {isMaximized ? "−" : "+"}
                </span>
              </motion.button>
            </div>

            {/* Window title */}
            <div className="text-muted-foreground pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-medium">
              Fee Breakdown
            </div>

            {/* Spacer for centering */}
            <div className="w-[52px]" />
          </div>

          {/* Window content - Not draggable */}
          <motion.div
            animate={{
              height: isMinimized ? 0 : "auto",
              opacity: isMinimized ? 0 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <FeeSummaryCard
              estimate={estimate}
              isEstimating={isEstimating}
              fromChain={fromChain}
              toChain={toChain}
              amount={amount}
            />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
