"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  useNetworkAutoSwitch,
  useWalletForNetwork,
  useWalletSelection,
  useCurrentTransaction,
  parseTransactionError,
  useBridgeStore,
} from "~/lib/bridge";
import { useAddNotification, useUpdateNotification } from "~/lib/notifications";
import { NETWORK_CONFIGS } from "~/lib/bridge/networks";

export function useBridgeCardState() {
  // Initialize bridge with wallet
  const { isInitialized } = useBridgeInit();

  // Auto-switch network when chain changes
  const { switchError } = useNetworkAutoSwitch();

  // Notification system
  const addNotification = useAddNotification();
  const updateNotification = useUpdateNotification();

  // Transaction update from store
  const updateTransactionInStore = useBridgeStore(
    (state) => state.updateTransaction,
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
    // Full wallet objects for bridge service (needed for network switching)
    selectedSourceWalletFull,
    selectedDestWalletFull,
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

  // Refs
  const bridgeCardRef = useRef<HTMLDivElement>(null);
  const beamContainerRef = useRef<HTMLDivElement>(null);

  // Open transaction window when a new bridge transaction starts
  useEffect(() => {
    if (!currentTransaction) return;

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

  const handleBridge = useCallback(async () => {
    if (!fromChain || !toChain || !amount) return;

    if (!useCustomAddress && !hasDestWallet) {
      const chainName = NETWORK_CONFIGS[toChain]?.name;
      promptDestWalletConnection(chainName);
      return;
    }

    if (useCustomAddress && !isAddressValid) {
      return;
    }

    let notificationId: string | undefined;

    try {
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
        // Pass explicit wallet references for cross-chain network switching
        sourceWallet: selectedSourceWalletFull,
        destWallet: selectedDestWalletFull,
      });

      if (result && notificationId) {
        result.notificationId = notificationId;
        updateTransactionInStore(result.id, { notificationId });
        useBridgeStore.getState().openTransactionWindow(result);
      }

      if (result && notificationId) {
        if (result.status === "completed") {
          updateNotification(notificationId, {
            status: "success",
            title: "Bridge Completed",
            message: `Successfully transferred ${amount} USDC from ${NETWORK_CONFIGS[fromChain]?.displayName} to ${NETWORK_CONFIGS[toChain]?.displayName}`,
            bridgeTransactionId: result.id,
            actionLabel: undefined,
            actionType: undefined,
          });
        } else if (
          result.status === "failed" ||
          result.status === "cancelled"
        ) {
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
      }
    } catch (error: unknown) {
      console.error("Bridge failed:", error);

      const parsed = parseTransactionError(error);

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
    }
  }, [
    fromChain,
    toChain,
    amount,
    useCustomAddress,
    customAddress,
    isAddressValid,
    hasDestWallet,
    promptDestWalletConnection,
    addNotification,
    executeBridge,
    updateNotification,
    updateTransactionInStore,
    currentTransaction?.id,
    selectedSourceWalletFull,
    selectedDestWalletFull,
  ]);

  const isValidAmount = Boolean(amount && parseFloat(amount) > 0);

  const canBridge = Boolean(
    isInitialized &&
      fromChain &&
      toChain &&
      isValidAmount &&
      !isBridging &&
      (useCustomAddress ? isAddressValid : hasDestWallet),
  );

  const needsDestinationWallet = Boolean(
    toChain && !hasDestWallet && !useCustomAddress,
  );

  return {
    isInitialized,
    fromChain,
    toChain,
    onFromChainChange: setFromChain,
    onToChainChange: setToChain,
    onSwapChains: swapChains,
    sourceWallets,
    selectedSourceWalletId,
    onSelectSourceWallet: handleSelectSourceWallet,
    destWallets,
    selectedDestWalletId,
    onSelectDestWallet: handleSelectDestWallet,
    selectedDestWalletAddress: selectedDestWallet?.address,
    destWalletAddress: destWallet?.address,
    toNetworkType,
    amount,
    onAmountChange: setAmount,
    balance,
    isValidAmount,
    useCustomAddress,
    customAddress,
    isAddressValid,
    onUseCustomAddressChange: setUseCustomAddress,
    onCustomAddressChange: setCustomAddress,
    onAddressValidationChange: setIsAddressValid,
    showFeeDetails,
    onToggleFeeDetails: () => setShowFeeDetails(!showFeeDetails),
    estimate,
    isEstimating,
    switchError,
    bridgeError,
    isBridging,
    canBridge,
    needsDestinationWallet,
    onBridge: handleBridge,
    onPromptDestWallet: promptDestWalletConnection,
    bridgeCardRef,
    beamContainerRef,
  };
}
