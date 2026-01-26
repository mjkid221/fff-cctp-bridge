"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useWalletContext } from "~/lib/wallet/wallet-context";
import { useDynamicLinkWalletModal } from "~/lib/wallet/providers/dynamic/context";
import { getTabIndexForNetwork } from "~/lib/wallet/providers/dynamic/tab-utils";
import type { IWallet } from "~/lib/wallet/types";
import { getBridgeService } from "./service";
import { BridgeStorage, type TransactionPage } from "./storage";
import { useBridgeStore } from "./store";
import type { BridgeParams, BridgeTransaction, WalletOption } from "./types";
import type { SupportedChainId } from "./networks";
import { NETWORK_CONFIGS } from "./networks";
import { bridgeKeys } from "./query-keys";
import { ms } from "ms-extended";
import { getWalletsForNetworkType } from "./utils";

/**
 * Custom hook that provides wallets filtered by type
 * Uses the provider-agnostic wallet context
 */
export function useWalletsByType() {
  const { evmWallets, solanaWallets, suiWallets, allWallets } =
    useWalletContext();

  const walletsByType = useMemo(() => {
    return {
      ethereum: evmWallets,
      solana: solanaWallets,
      sui: suiWallets,
      all: allWallets,
    };
  }, [evmWallets, solanaWallets, suiWallets, allWallets]);

  return walletsByType;
}

/**
 * Hook to initialize bridge service with wallet
 */
export function useBridgeInit() {
  const { primaryWallet, allWallets } = useWalletContext();
  const setUserAddress = useBridgeStore((state) => state.setUserAddress);
  const loadTransactions = useBridgeStore((state) => state.loadTransactions);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasAutoLoadedRef = useRef(false);

  useEffect(() => {
    const initBridge = async () => {
      if (primaryWallet?.address) {
        const service = getBridgeService();

        await service.initialize(primaryWallet, allWallets);
        setUserAddress(primaryWallet.address);
        await loadTransactions();
        setIsInitialized(true);
      } else {
        setUserAddress(null);
        setIsInitialized(false);
        hasAutoLoadedRef.current = false;
      }
    };

    void initBridge();
  }, [primaryWallet, allWallets, setUserAddress, loadTransactions]);

  // Auto-load in-progress transaction after page refresh (runs only once)
  // Note: We load the transaction into state but do NOT auto-open the window
  // User can access it via transaction history or notifications
  useEffect(() => {
    if (!isInitialized || hasAutoLoadedRef.current) return;

    const autoLoadInProgressTx = async () => {
      const service = getBridgeService();
      const transactions = await service.getTransactions();

      const inProgressTx = transactions
        .filter(
          (tx) =>
            tx.status === "bridging" ||
            tx.status === "pending" ||
            tx.status === "approving" ||
            tx.status === "approved" ||
            tx.status === "confirming",
        )
        .sort((a, b) => b.createdAt - a.createdAt)[0];

      if (inProgressTx) {
        hasAutoLoadedRef.current = true;

        const setCurrentTransaction =
          useBridgeStore.getState().setCurrentTransaction;

        setCurrentTransaction(inProgressTx);
      } else {
        hasAutoLoadedRef.current = true;
      }
    };

    void autoLoadInProgressTx();
  }, [isInitialized]);

  return { isInitialized, address: primaryWallet?.address };
}

/**
 * Hook for bridge estimation with React Query caching
 * Caches estimates for 10 seconds to avoid redundant API calls on chain switching
 */
export function useBridgeEstimate(params: {
  fromChain: SupportedChainId | null;
  toChain: SupportedChainId | null;
  amount: string;
  recipientAddress?: string;
  transferMethod?: string;
}) {
  const userAddress = useBridgeStore((state) => state.userAddress);

  const { fromChain, toChain, amount, recipientAddress, transferMethod } =
    params;
  const hasValidParams =
    !!fromChain && !!toChain && !!amount && parseFloat(amount) > 0;

  return useQuery({
    queryKey: hasValidParams
      ? bridgeKeys.estimate({
          fromChain: fromChain,
          toChain: toChain,
          amount,
          recipientAddress,
          transferMethod: transferMethod as BridgeParams["transferMethod"],
        })
      : bridgeKeys.estimates(), // Fallback key when params invalid
    queryFn: async () => {
      const service = getBridgeService();
      return service.estimate({
        fromChain: fromChain!,
        toChain: toChain!,
        amount,
        recipientAddress,
        transferMethod: transferMethod as BridgeParams["transferMethod"],
      });
    },
    enabled: !!userAddress && hasValidParams,
    staleTime: ms("10s"), // Circle fees are fixed, no need for frequent refetch
    gcTime: ms("1m"), // Keep in cache for 1 minute
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/**
 * Hook for executing bridge transactions
 */
export function useBridge() {
  const queryClient = useQueryClient();
  const userAddress = useBridgeStore((state) => state.userAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setCurrentTransaction = useBridgeStore(
    (state) => state.setCurrentTransaction,
  );

  const executeBridge = useCallback(
    async (params: BridgeParams): Promise<BridgeTransaction> => {
      setIsLoading(true);
      setError(null);

      try {
        const service = getBridgeService();
        const transaction = await service.bridge(params);

        // Note: addTransaction is now called in service.bridge() for stats tracking
        setCurrentTransaction(transaction);

        void queryClient.invalidateQueries({
          queryKey: bridgeKeys.balance(params.fromChain, userAddress),
        });
        void queryClient.invalidateQueries({
          queryKey: bridgeKeys.balance(params.toChain, userAddress),
        });

        return transaction;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Bridge failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setCurrentTransaction, userAddress, queryClient],
  );

  return { executeBridge, isLoading, error };
}

/**
 * Hook for retrying failed transactions
 */
export function useRetryBridge() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addTransaction = useBridgeStore((state) => state.addTransaction);

  const retryBridge = useCallback(
    async (transactionId: string): Promise<BridgeTransaction> => {
      setIsRetrying(true);
      setError(null);

      try {
        const service = getBridgeService();
        const transaction = await service.retry(transactionId);

        addTransaction(transaction);

        return transaction;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Retry failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsRetrying(false);
      }
    },
    [addTransaction],
  );

  return { retryBridge, isRetrying, error };
}

/**
 * Hook for resuming in-progress transactions after page refresh.
 * This is used to continue attestation polling when the user
 * refreshes the page or reopens a transaction window.
 */
export function useResumeBridge() {
  const [isResuming, setIsResuming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateTransaction = useBridgeStore((state) => state.updateTransaction);

  const resumeBridge = useCallback(
    async (transactionId: string): Promise<BridgeTransaction> => {
      setIsResuming(true);
      setError(null);

      try {
        const service = getBridgeService();
        const transaction = await service.resume(transactionId);

        updateTransaction(transaction.id, transaction);

        return transaction;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Resume failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsResuming(false);
      }
    },
    [updateTransaction],
  );

  return { resumeBridge, isResuming, error };
}

/**
 * Hook for recovering stuck transactions without bridgeResult.
 * This handles the case where user refreshes during attestation polling
 * and bridgeResult was never saved. Uses reconstructed BridgeResult to retry.
 */
export function useRecoverBridge() {
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateTransaction = useBridgeStore((state) => state.updateTransaction);

  const recoverBridge = useCallback(
    async (transactionId: string): Promise<BridgeTransaction> => {
      setIsRecovering(true);
      setError(null);

      try {
        const service = getBridgeService();
        const transaction = await service.recover(transactionId);

        updateTransaction(transaction.id, transaction);

        return transaction;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Recovery failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsRecovering(false);
      }
    },
    [updateTransaction],
  );

  return { recoverBridge, isRecovering, error };
}

/**
 * Hook for wallet balance using React Query
 * Automatically waits for service initialization via the enabled option
 */
export function useWalletBalance(chainId: SupportedChainId | null) {
  // userAddress is set AFTER service.initialize() completes in useBridgeInit
  // So userAddress !== null means the service is ready
  const userAddress = useBridgeStore((state) => state.userAddress);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: bridgeKeys.balance(chainId, userAddress),
    queryFn: async () => {
      const service = getBridgeService();
      return service.getBalance(chainId!);
    },
    // Only fetch when service is initialized (userAddress set) otherwise throws errors
    enabled: !!userAddress && !!chainId,
    staleTime: ms("30s"),
    gcTime: ms("5m"),
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    balance: data?.formatted ?? "0.00",
    rawBalance: data?.balance ?? "0",
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

/**
 * Hook for transaction history
 */
export function useTransactionHistory() {
  const transactions = useBridgeStore((state) => state.transactions);
  const loadTransactions = useBridgeStore((state) => state.loadTransactions);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadTransactions();
    } finally {
      setIsLoading(false);
    }
  }, [loadTransactions]);

  return { transactions, isLoading, refresh };
}

/**
 * Hook for paginated transaction history using useInfiniteQuery
 * Used by the transaction history UI for infinite scroll
 */
export function useTransactionHistoryInfinite() {
  const userAddress = useBridgeStore((state) => state.userAddress);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: bridgeKeys.transactionHistory(userAddress),
    queryFn: async ({ pageParam }): Promise<TransactionPage> => {
      if (!userAddress) {
        return { transactions: [], nextCursor: null };
      }
      return BridgeStorage.getTransactionPage(userAddress, 10, pageParam);
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: TransactionPage) =>
      lastPage.nextCursor ?? undefined,
    enabled: !!userAddress,
  });

  // Flatten pages into single array
  const transactions: BridgeTransaction[] = useMemo(
    () => data?.pages.flatMap((page) => page.transactions) ?? [],
    [data],
  );

  return {
    transactions,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    refetch,
  };
}

/**
 * Hook to automatically switch wallet network when chain selection changes
 * This ensures the wallet's active network matches the selected bridge chain
 */
export function useNetworkAutoSwitch() {
  const fromChain = useBridgeStore((state) => state.fromChain);
  const { primaryWallet } = useWalletContext();
  const { solana: solanaWallets } = useWalletsByType();
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  useEffect(() => {
    const switchNetworkIfNeeded = async () => {
      if (!fromChain || !primaryWallet) return;

      const network = NETWORK_CONFIGS[fromChain];
      if (!network) return;

      // Only auto-switch for Solana (EVM wallets handle network switching themselves)
      if (network.type !== "solana") return;

      // Get the first available Solana wallet
      const solanaWallet = solanaWallets[0];

      if (!solanaWallet) return;

      try {
        setIsSwitching(true);
        setSwitchError(null);

        if (!solanaWallet.getSolanaConnection) return;

        const currentConnection = await solanaWallet.getSolanaConnection();
        const currentRpc: string = currentConnection.rpcEndpoint;

        const isMainnet = currentRpc.includes("mainnet");
        const isDevnet = currentRpc.includes("devnet");

        const needsSwitch =
          (network.environment === "mainnet" && !isMainnet) ||
          (network.environment === "testnet" && !isDevnet);

        if (!needsSwitch) return;

        if (typeof solanaWallet.switchNetwork === "function") {
          await solanaWallet.switchNetwork(network.dynamicChainId || fromChain);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        setSwitchError(message);
      } finally {
        setIsSwitching(false);
      }
    };

    void switchNetworkIfNeeded();
  }, [fromChain, primaryWallet, solanaWallets]);

  return { isSwitching, switchError };
}

/**
 * Hook for managing wallet connection for specific network types
 * Note: Dynamic SDK automatically handles multi-wallet support when users
 * connect additional wallets through the modal
 */
export function useWalletForNetwork(
  networkType: "evm" | "solana" | "sui" | null,
) {
  const { showLinkWalletModal } = useDynamicLinkWalletModal();
  const { setSelectedTabIndex, setShowAuthFlow } = useDynamicContext();
  const walletsByType = useWalletsByType();
  const { allWallets } = useWalletContext();
  const [compatibleWallet, setCompatibleWallet] = useState<IWallet | null>(
    null,
  );

  // Check if user is logged in (has any wallets connected)
  const isLoggedIn = allWallets.length > 0;

  useEffect(() => {
    if (!networkType) {
      setCompatibleWallet(null);
      return;
    }

    // Get the first compatible wallet for the network type
    if (networkType === "evm") {
      setCompatibleWallet(walletsByType.ethereum[0] ?? null);
    } else if (networkType === "solana") {
      setCompatibleWallet(walletsByType.solana[0] ?? null);
    } else if (networkType === "sui") {
      setCompatibleWallet(walletsByType.sui[0] ?? null);
    }
  }, [walletsByType, networkType]);

  const promptWalletConnection = useCallback(
    (_chainName?: string) => {
      // Set the correct tab based on network type before showing modal
      const tabIndex = getTabIndexForNetwork(networkType);
      setSelectedTabIndex(tabIndex);

      if (isLoggedIn) {
        // User is logged in but needs a different wallet type - show link wallet modal
        showLinkWalletModal();
      } else {
        // User is not logged in - show the main auth/connect flow
        setShowAuthFlow(true);
      }
    },
    [
      showLinkWalletModal,
      setSelectedTabIndex,
      setShowAuthFlow,
      networkType,
      isLoggedIn,
    ],
  );

  return {
    compatibleWallet,
    hasCompatibleWallet: !!compatibleWallet,
    promptWalletConnection,
  };
}

/**
 * Hook for managing source and destination wallet selection
 */
export function useWalletSelection(
  fromChain: SupportedChainId | null,
  toChain: SupportedChainId | null,
): {
  sourceWallets: WalletOption[];
  selectedSourceWallet: WalletOption | undefined;
  selectedSourceWalletId: string | null;
  handleSelectSourceWallet: (walletId: string) => void;
  destWallets: WalletOption[];
  selectedDestWallet: WalletOption | undefined;
  selectedDestWalletId: string | null;
  handleSelectDestWallet: (walletId: string) => void;
  hasCompatibleSourceWallet: boolean;
  hasCompatibleDestWallet: boolean;
  // Full wallet objects for bridge service
  selectedSourceWalletFull: IWallet | undefined;
  selectedDestWalletFull: IWallet | undefined;
} {
  const walletsByType = useWalletsByType();
  const walletContext = useWalletContext();
  const { primaryWallet } = walletContext;

  // Wrap switchWallet to avoid "this" binding issues
  const switchWallet = useCallback(
    (walletId: string) => walletContext.switchWallet(walletId),
    [walletContext],
  );
  const [selectedSourceWalletId, setSelectedSourceWalletId] = useState<
    string | null
  >(null);
  const [selectedDestWalletId, setSelectedDestWalletId] = useState<
    string | null
  >(null);

  // Get network types
  const fromNetworkType: "evm" | "solana" | "sui" | null = fromChain
    ? (NETWORK_CONFIGS[fromChain]?.type ?? null)
    : null;
  const toNetworkType: "evm" | "solana" | "sui" | null = toChain
    ? (NETWORK_CONFIGS[toChain]?.type ?? null)
    : null;

  // Get compatible wallets for each network type
  const sourceWallets = useMemo(
    () => getWalletsForNetworkType(fromNetworkType, walletsByType),
    [fromNetworkType, walletsByType],
  );

  const destWallets = useMemo(
    () => getWalletsForNetworkType(toNetworkType, walletsByType),
    [toNetworkType, walletsByType],
  );

  // Auto-select source wallet: prefer primary wallet if compatible, else first available
  useEffect(() => {
    if (sourceWallets.length === 0) {
      setSelectedSourceWalletId(null);
      return;
    }

    // Check if current selection is still valid
    const currentSelectionValid = sourceWallets.some(
      (w) => w.id === selectedSourceWalletId,
    );
    if (currentSelectionValid) return;

    // Prefer primary wallet if compatible
    if (primaryWallet && sourceWallets.some((w) => w.id === primaryWallet.id)) {
      setSelectedSourceWalletId(primaryWallet.id);
      return;
    }

    // Fall back to first available wallet
    const firstWallet = sourceWallets[0];
    if (firstWallet) {
      setSelectedSourceWalletId(firstWallet.id);
    }
  }, [primaryWallet, sourceWallets, selectedSourceWalletId]);

  // Auto-select destination wallet: prefer different wallet from source, else first available
  useEffect(() => {
    if (destWallets.length === 0) {
      setSelectedDestWalletId(null);
      return;
    }

    // Check if current selection is still valid
    const currentSelectionValid = destWallets.some(
      (w) => w.id === selectedDestWalletId,
    );
    if (currentSelectionValid) return;

    // Prefer a different wallet from source if available
    const differentWallet = destWallets.find(
      (w) => w.id !== selectedSourceWalletId,
    );
    const walletToSelect = differentWallet ?? destWallets[0];
    if (walletToSelect) {
      setSelectedDestWalletId(walletToSelect.id);
    }
  }, [destWallets, selectedSourceWalletId, selectedDestWalletId]);

  const handleSelectSourceWallet = useCallback(
    (walletId: string) => {
      setSelectedSourceWalletId(walletId);
      // Switch to this wallet as primary
      void switchWallet(walletId);
    },
    [switchWallet],
  );

  const handleSelectDestWallet = useCallback((walletId: string) => {
    setSelectedDestWalletId(walletId);
  }, []);

  const selectedSourceWallet = sourceWallets.find(
    (w) => w.id === selectedSourceWalletId,
  );
  const selectedDestWallet = destWallets.find(
    (w) => w.id === selectedDestWalletId,
  );

  // Convert IWallet to WalletOption for UI consumption
  const toWalletOption = (wallet: IWallet): WalletOption => ({
    id: wallet.id,
    address: wallet.address,
    connector: {
      key: wallet.connectorKey,
      name: wallet.connectorName,
    },
  });

  const sourceWalletsAsOptions = sourceWallets.map(toWalletOption);
  const destWalletsAsOptions = destWallets.map(toWalletOption);

  return {
    // Source wallet
    sourceWallets: sourceWalletsAsOptions,
    selectedSourceWallet: selectedSourceWallet
      ? toWalletOption(selectedSourceWallet)
      : undefined,
    selectedSourceWalletId,
    handleSelectSourceWallet,

    // Destination wallet
    destWallets: destWalletsAsOptions,
    selectedDestWallet: selectedDestWallet
      ? toWalletOption(selectedDestWallet)
      : undefined,
    selectedDestWalletId,
    handleSelectDestWallet,

    // Compatibility checks
    hasCompatibleSourceWallet: sourceWallets.length > 0,
    hasCompatibleDestWallet: destWallets.length > 0,

    // Full wallet objects for bridge service (needed for network switching)
    selectedSourceWalletFull: selectedSourceWallet,
    selectedDestWalletFull: selectedDestWallet,
  };
}
