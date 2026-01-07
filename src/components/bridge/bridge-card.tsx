"use client";

import { motion, AnimatePresence, useDragControls } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { ChainSelector } from "./chain-selector";
import { AmountInput } from "./amount-input";
import { SwapButton } from "./swap-button";
import { DestinationAddressInput } from "./destination-address-input";
import { WalletSelector } from "./wallet-selector";
import { FeeSummaryCard } from "./fee-summary-card";
import {
  useAddNotification,
  useUpdateNotification,
  useNotifications,
} from "~/lib/notifications";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Skeleton } from "~/components/ui/skeleton";
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "~/lib/utils";
import {
  useBridgeInit,
  useBridge,
  useBridgeEstimate,
  useRetryBridge,
  useWalletBalance,
  useFromChain,
  useToChain,
  useSetFromChain,
  useSetToChain,
  useSwapChains,
  useNetworkAutoSwitch,
  useWalletForNetwork,
  useWalletSelection,
  useCurrentTransaction,
  useActiveWindow,
  useSetActiveWindow,
  useWindowPositions,
  useSetWindowPosition,
  useHasHydrated,
  validateOrResetPosition,
  getWindowDimensions,
  constrainToViewport,
  parseTransactionError,
  useBridgeStore,
} from "~/lib/bridge";
import { NETWORK_CONFIGS, type SupportedChainId } from "~/lib/bridge/networks";
import type { BridgeEstimate } from "~/lib/bridge/types";

export function BridgeCard() {
  // Initialize bridge with wallet
  const { isInitialized } = useBridgeInit();

  // Auto-switch network when chain changes
  const { isSwitching, switchError } = useNetworkAutoSwitch();

  // Notification system
  const addNotification = useAddNotification();
  const updateNotification = useUpdateNotification();
  const notifications = useNotifications();

  // Transaction update from store
  const updateTransactionInStore = useBridgeStore(
    (state) => state.updateTransaction,
  );
  const setCurrentTransaction = useBridgeStore(
    (state) => state.setCurrentTransaction,
  );

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
  const [showFeeDetails, setShowFeeDetails] = useState(false);

  // Window state from store (for fee details)
  const activeWindow = useActiveWindow();
  const setActiveWindow = useSetActiveWindow();

  // Current transaction from store
  const currentTransaction = useCurrentTransaction();

  // Bridge operations
  const {
    executeBridge,
    isLoading: isBridging,
    error: bridgeError,
  } = useBridge();
  const { retryBridge, isRetrying } = useRetryBridge();
  const { estimateBridge, estimate, isEstimating } = useBridgeEstimate();
  const { balance } = useWalletBalance(fromChain);

  // Open transaction window when a new bridge transaction starts
  // This ensures the window exists BEFORE the bridge operation begins,
  // allowing EventManager callbacks to update the UI in real-time
  useEffect(() => {
    if (!currentTransaction) return;

    // Only open window for active transactions that don't have a window yet
    const isActive =
      currentTransaction.status === "pending" ||
      currentTransaction.status === "bridging";
    const windowExists = useBridgeStore
      .getState()
      .openTransactionWindows.has(currentTransaction.id);

    if (isActive && !windowExists) {
      useBridgeStore.getState().openTransactionWindow(currentTransaction);
    }
  }, [currentTransaction]);

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

    // Declare notificationId outside try-catch so it's accessible in both blocks
    let notificationId: string | undefined;

    try {
      // Create in-progress notification when bridge starts
      notificationId = addNotification({
        type: "bridge",
        status: "in_progress",
        title: "Bridge Started",
        message: `Transferring ${amount} USDC from ${NETWORK_CONFIGS[fromChain]?.displayName} to ${NETWORK_CONFIGS[toChain]?.displayName}`,
        bridgeTransactionId: `pending_${Date.now()}`,
        fromChain: NETWORK_CONFIGS[fromChain]?.displayName,
        toChain: NETWORK_CONFIGS[toChain]?.displayName,
        amount,
        token: "USDC",
        actionLabel: "View Progress",
        actionType: "view",
      });

      const result = await executeBridge({
        fromChain,
        toChain,
        amount,
        recipientAddress: useCustomAddress ? customAddress : undefined,
      });

      // Store notification ID in transaction for future reference
      if (result && notificationId) {
        result.notificationId = notificationId;
        // Update the transaction in store with notification ID
        updateTransactionInStore(result.id, { notificationId });

        // Open transaction window in multi-window system
        useBridgeStore.getState().openTransactionWindow(result);
      }

      // Update existing notification to success only if transaction actually succeeded
      // executeBridge returns a transaction object even for failed transactions
      if (result && notificationId) {
        if (result.status === "completed") {
          updateNotification(notificationId, {
            status: "success",
            title: "Bridge Completed",
            message: `Successfully transferred ${amount} USDC from ${NETWORK_CONFIGS[fromChain]?.displayName} to ${NETWORK_CONFIGS[toChain]?.displayName}`,
            bridgeTransactionId: result.id,
            actionLabel: undefined, // Remove action button on success
            actionType: undefined,
          });
        } else if (
          result.status === "failed" ||
          result.status === "cancelled"
        ) {
          // Transaction was created but failed/cancelled during execution
          const errorToDisplay: unknown = result.error ?? "Transaction failed";
          const parsed = parseTransactionError(errorToDisplay);

          updateNotification(notificationId, {
            status: "failed",
            title: parsed.isUserRejection
              ? "Transaction Rejected"
              : "Bridge Failed",
            message: parsed.userMessage,
            bridgeTransactionId: result.id,
            actionLabel: "Open Bridge Status",
            actionType: "view",
          });
        }
        // If status is still pending/bridging, leave notification as is (in_progress)
      }

      // Don't reset form or close modal here - let user see completion
      // Modal will show "Done" button when complete
    } catch (error: unknown) {
      console.error("Bridge failed:", error);

      // Update existing notification to failed (don't create new one)
      const parsed = parseTransactionError(error);

      // Use notificationId directly instead of currentNotificationId to avoid async state issues
      if (notificationId) {
        updateNotification(notificationId, {
          status: "failed",
          title: parsed.isUserRejection
            ? "Transaction Rejected"
            : "Bridge Failed",
          message: parsed.userMessage,
          bridgeTransactionId: currentTransaction?.id,
          actionLabel: "Open Bridge Status",
          actionType: "view",
        });
      }

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
            <div className="my-3 sm:my-4">
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
                        {(estimate?.receiveAmount ?? amount) || "0.00"} USDC
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
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
              className="mt-4 sm:mt-6"
              whileHover={{ scale: canBridge ? 1.02 : 1 }}
              whileTap={{ scale: canBridge ? 0.98 : 1 }}
            >
              <Button
                onClick={handleBridge}
                disabled={!canBridge && !needsDestinationWallet}
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
                  <span>
                    Connect {NETWORK_CONFIGS[toChain]?.name}
                    Wallet
                  </span>
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
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const activeWindow = useActiveWindow();
  const setActiveWindow = useSetActiveWindow();
  const windowPositions = useWindowPositions();
  const setWindowPosition = useSetWindowPosition();
  const hasHydrated = useHasHydrated();

  const isActive = activeWindow === "fee-details";
  const zIndex = isActive ? "z-20" : "z-10";

  // Get saved position and validate it's within viewport
  const defaultPosition = { x: 350, y: 100 };
  const dimensions = getWindowDimensions("fee-details", isMaximized);

  // Only use saved position after store has been hydrated from localStorage
  // Otherwise we'll get stale default values
  const savedPosition = hasHydrated
    ? windowPositions["fee-details"]
    : defaultPosition;
  const initialPosition = validateOrResetPosition(
    savedPosition,
    dimensions,
    defaultPosition,
  );

  // Track current position for spring-back animation
  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  // Update current position when initial position changes (e.g., on reopen)
  useEffect(() => {
    setCurrentPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  // Log position for debugging
  useEffect(() => {
    console.log(
      "[Fee Details] Component mounted - hasHydrated:",
      hasHydrated,
      "savedPosition:",
      savedPosition,
      "initialPosition:",
      initialPosition,
    );
    console.log("[Fee Details] Full windowPositions:", windowPositions);
  }, []); // Only log on mount

  // Prevent text selection and background interactions during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  // Handle drag start - prevent text selection
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handle drag end - constrain position and spring back if needed
  const handleDragEnd = () => {
    setIsDragging(false);
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const draggedPosition = {
        x: rect.left,
        y: rect.top,
      };

      // Constrain position to keep window partially visible
      const constrainedPosition = constrainToViewport(
        draggedPosition,
        dimensions,
      );

      console.log(
        "[Fee Details] Drag end - dragged:",
        draggedPosition,
        "constrained:",
        constrainedPosition,
      );

      // Always update to dragged position first to reset Motion's animation target
      setCurrentPosition(draggedPosition);

      // If position needs to be constrained, spring back after a tick
      if (
        draggedPosition.x !== constrainedPosition.x ||
        draggedPosition.y !== constrainedPosition.y
      ) {
        // Use setTimeout to ensure state update happens after currentPosition is set to draggedPosition
        setTimeout(() => {
          setCurrentPosition(constrainedPosition);
        }, 0);
      }

      // Save the constrained position
      setWindowPosition("fee-details", constrainedPosition);
    }
  };

  // Save position when closing
  const handleClose = () => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const newPosition = {
        x: rect.left,
        y: rect.top,
      };
      console.log("[Fee Details] Saving position on close:", newPosition);
      setWindowPosition("fee-details", newPosition);
    }
    onClose();
  };

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
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        initial={{
          opacity: 0,
          scale: 0.95,
          x: initialPosition.x,
          y: initialPosition.y,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          x: currentPosition.x,
          y: currentPosition.y,
        }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
        }}
        className={cn("fixed top-0 left-0 hidden lg:block", zIndex)}
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
            className="bg-muted/40 group border-border/30 flex cursor-grab items-center justify-between border-b px-3 py-2.5 active:cursor-grabbing"
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
                  handleClose();
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
