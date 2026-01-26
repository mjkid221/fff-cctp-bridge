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
  useTransferMethod,
  useSetTransferMethod,
  useNetworkAutoSwitch,
  useWalletForNetwork,
  useWalletSelection,
  useWalletsByType,
  useCurrentTransaction,
  parseTransactionError,
  useBridgeStore,
  hasWalletForNetworkType,
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

  // Transfer method from store
  const transferMethod = useTransferMethod();
  const setTransferMethod = useSetTransferMethod();

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

  // Source network wallet prompt (for connecting wallet when missing)
  const fromNetworkType = fromChain ? NETWORK_CONFIGS[fromChain]?.type : null;
  const { promptWalletConnection: promptSourceWalletConnection } =
    useWalletForNetwork(fromNetworkType);

  // Get all connected wallets by type for minting wallet check
  const walletsByType = useWalletsByType();

  // Check if user has a wallet for the destination network type
  // This is needed when using custom addresses - user still needs a wallet to sign mint tx
  const hasWalletForDestNetwork = hasWalletForNetworkType(
    toNetworkType,
    walletsByType,
  );

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
  const { data: estimateData, isLoading: isEstimating } = useBridgeEstimate({
    fromChain,
    toChain,
    amount,
    recipientAddress: useCustomAddress ? customAddress : undefined,
    transferMethod,
  });
  // React Query returns undefined when no data, but component expects null
  const estimate = estimateData ?? null;
  const { balance } = useWalletBalance(fromChain);

  // Refs
  const bridgeCardRef = useRef<HTMLDivElement>(null);
  const beamContainerRef = useRef<HTMLDivElement>(null);
  const pendingNotificationRef = useRef<string | null>(null);
  // Track transaction IDs that were initiated by user in this session (not loaded from storage)
  const initiatedTransactionIdRef = useRef<string | null>(null);
  // Track when user is actively initiating a bridge (set before executeBridge, cleared after)
  // This allows the effect to open the window immediately when currentTransaction is set
  const isInitiatingBridgeRef = useRef(false);

  // Open transaction window ONLY for transactions initiated by user in this session
  // This prevents auto-opening windows for transactions loaded from storage on page refresh
  useEffect(() => {
    if (!currentTransaction) return;

    // Only auto-open if:
    // 1. User is currently initiating a bridge (flag set before executeBridge), OR
    // 2. This transaction was initiated by user in this session (for status updates after bridge starts)
    const shouldAutoOpen =
      isInitiatingBridgeRef.current ||
      currentTransaction.id === initiatedTransactionIdRef.current;

    if (!shouldAutoOpen) return;

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

  // Link pending notification to real transaction ID as soon as transaction is created
  // This ensures the notification can open the transaction window even if user closes it mid-bridge
  useEffect(() => {
    if (!currentTransaction?.id || !pendingNotificationRef.current) return;

    const notificationId = pendingNotificationRef.current;

    void updateNotification(notificationId, {
      bridgeTransactionId: currentTransaction.id,
    });
    updateTransactionInStore(currentTransaction.id, { notificationId });
    pendingNotificationRef.current = null;
  }, [currentTransaction?.id, updateNotification, updateTransactionInStore]);

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
      notificationId = await addNotification({
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

      // Store notification ID in ref so the effect can link it to real transaction ID
      // as soon as the transaction is created (before bridge completes)
      pendingNotificationRef.current = notificationId;

      // Set flag BEFORE executeBridge so the effect knows to auto-open the window
      // when currentTransaction is set (which happens early in service.bridge())
      isInitiatingBridgeRef.current = true;

      // Reset amount input for concurrent bridges - user can start entering new amount
      setAmount("");

      const result = await executeBridge({
        fromChain,
        toChain,
        amount,
        recipientAddress: useCustomAddress ? customAddress : undefined,
        transferMethod,
        // Pass explicit wallet references for cross-chain network switching
        sourceWallet: selectedSourceWalletFull,
        destWallet: selectedDestWalletFull,
      });

      // Clear the initiating flag now that executeBridge has completed
      isInitiatingBridgeRef.current = false;

      if (result) {
        // Mark this as a user-initiated transaction (not loaded from storage)
        initiatedTransactionIdRef.current = result.id;

        if (notificationId) {
          result.notificationId = notificationId;
          updateTransactionInStore(result.id, { notificationId });
        }
        useBridgeStore.getState().openTransactionWindow(result);
      }

      if (result && notificationId) {
        if (result.status === "completed") {
          void updateNotification(notificationId, {
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

          void updateNotification(notificationId, {
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
      // Clear the initiating flag on error
      isInitiatingBridgeRef.current = false;

      const parsed = parseTransactionError(error);

      if (notificationId) {
        void updateNotification(notificationId, {
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
    transferMethod,
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

  // Check if selected source wallet is valid for the current source chain
  // This handles the case where user switches chains and the previously selected
  // wallet is no longer compatible with the new chain type
  const hasValidSourceWallet = sourceWallets.some(
    (w) => w.id === selectedSourceWalletId,
  );
  const needsSourceWallet = Boolean(fromChain && !hasValidSourceWallet);

  const canBridge = Boolean(
    isInitialized &&
    fromChain &&
    toChain &&
    isValidAmount &&
    !isEstimating &&
    hasValidSourceWallet &&
    (useCustomAddress
      ? isAddressValid && hasWalletForDestNetwork
      : hasDestWallet && selectedDestWalletId),
  );

  const needsDestinationWallet = Boolean(
    toChain && (!hasDestWallet || !selectedDestWalletId) && !useCustomAddress,
  );

  // Show warning when using custom address but no wallet to sign mint tx
  const needsWalletForMinting = Boolean(
    useCustomAddress && toChain && isAddressValid && !hasWalletForDestNetwork,
  );

  // Get destination network display name for warning message
  const destNetworkName = toChain ? NETWORK_CONFIGS[toChain]?.name : undefined;

  return {
    isInitialized,
    transferMethod,
    onTransferMethodChange: setTransferMethod,
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
    needsSourceWallet,
    needsDestinationWallet,
    needsWalletForMinting,
    destNetworkName,
    onBridge: handleBridge,
    onPromptDestWallet: promptDestWalletConnection,
    onPromptSourceWallet: promptSourceWalletConnection,
    fromNetworkType,
    bridgeCardRef,
    beamContainerRef,
  };
}
