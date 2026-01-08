"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useDynamicContext,
  useDynamicModals,
  useUserWallets,
  useSwitchWallet,
} from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { isSolanaWallet } from "@dynamic-labs/solana";
import { isSuiWallet } from "@dynamic-labs/sui";
import { getBridgeService } from "./service";
import { useBridgeStore } from "./store";
import type { BridgeParams, BridgeEstimate, BridgeTransaction } from "./types";
import type { SupportedChainId } from "./networks";
import { NETWORK_CONFIGS } from "./networks";
import { bridgeKeys } from "./query-keys";

/**
 * Custom hook that provides wallets filtered by type with proper type guards
 * This avoids the need for `any` types and eslint-disable comments
 */
export function useWalletsByType() {
  const rawWallets = useUserWallets();

  const walletsByType = useMemo(() => {
    return {
      ethereum: rawWallets.filter(isEthereumWallet),
      solana: rawWallets.filter(isSolanaWallet),
      sui: rawWallets.filter(isSuiWallet),
      all: rawWallets,
    };
  }, [rawWallets]);

  return walletsByType;
}

/**
 * Hook to initialize bridge service with wallet
 */
export function useBridgeInit() {
  const { primaryWallet } = useDynamicContext();
  const { all: allWallets } = useWalletsByType();
  const setUserAddress = useBridgeStore((state) => state.setUserAddress);
  const loadTransactions = useBridgeStore((state) => state.loadTransactions);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasAutoLoadedRef = useRef(false);

  useEffect(() => {
    const initBridge = async () => {
      if (primaryWallet?.address) {
        const service = getBridgeService();

        // Pass the primary wallet and all connected wallets to the service
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
  useEffect(() => {
    if (!isInitialized || hasAutoLoadedRef.current) return;

    const autoLoadInProgressTx = async () => {
      const service = getBridgeService();
      const transactions = await service.getTransactions();

      // Find the most recent in-progress transaction
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
        // Mark as auto-loaded to prevent running again
        hasAutoLoadedRef.current = true;

        const setCurrentTransaction = useBridgeStore.getState().setCurrentTransaction;
        const setActiveWindow = useBridgeStore.getState().setActiveWindow;

        // Set as current transaction and show progress window
        setCurrentTransaction(inProgressTx);
        setActiveWindow("bridge-progress");

        // No polling needed - event manager handles real-time updates
      } else {
        // No in-progress transaction found, mark as checked
        hasAutoLoadedRef.current = true;
      }
    };

    void autoLoadInProgressTx();
  }, [isInitialized]);

  return { isInitialized, address: primaryWallet?.address };
}

/**
 * Hook for bridge estimation
 */
export function useBridgeEstimate() {
  const [estimate, setEstimate] = useState<BridgeEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimateBridge = useCallback(async (params: BridgeParams) => {
    setIsEstimating(true);
    setError(null);

    try {
      const service = getBridgeService();
      const result = await service.estimate(params);
      setEstimate(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to estimate";
      setError(errorMessage);
      throw err;
    } finally {
      setIsEstimating(false);
    }
  }, []);

  return { estimate, isEstimating, error, estimateBridge };
}

/**
 * Hook for executing bridge transactions
 */
export function useBridge() {
  const queryClient = useQueryClient();
  const userAddress = useBridgeStore((state) => state.userAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addTransaction = useBridgeStore((state) => state.addTransaction);
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

        // Add to store and set as current
        addTransaction(transaction);
        setCurrentTransaction(transaction);

        // Invalidate balance caches for both chains after bridge
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
    [addTransaction, setCurrentTransaction, userAddress, queryClient],
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

        // Add new transaction to store
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
 * Hook for checking route support
 */
export function useRouteSupport(
  from: SupportedChainId | null,
  to: SupportedChainId | null,
) {
  const [isSupported, setIsSupported] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      if (!from || !to) {
        setIsSupported(false);
        return;
      }

      setIsChecking(true);
      try {
        const service = getBridgeService();
        const supported = await service.supportsRoute(from, to);
        setIsSupported(supported);
      } catch {
        setIsSupported(false);
      } finally {
        setIsChecking(false);
      }
    };

    void checkSupport();
  }, [from, to]);

  return { isSupported, isChecking };
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
    // CRITICAL: Only fetch when service is initialized (userAddress set)
    enabled: !!userAddress && !!chainId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
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
 * Hook to automatically switch wallet network when chain selection changes
 * This ensures the wallet's active network matches the selected bridge chain
 */
export function useNetworkAutoSwitch() {
  const fromChain = useBridgeStore((state) => state.fromChain);
  const { primaryWallet } = useDynamicContext();
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

      if (!solanaWallet) {
        console.warn("No Solana wallet connected for network switch");
        return;
      }

      try {
        setIsSwitching(true);
        setSwitchError(null);

        // Get current network - solanaWallet is properly typed as SolanaWallet
        const currentConnection = await solanaWallet.getConnection();
        const currentRpc: string = currentConnection.rpcEndpoint;

        console.log("[Network Switch] Current RPC:", currentRpc);
        console.log("[Network Switch] Target chain:", fromChain);

        // Check if we need to switch
        const isMainnet = currentRpc.includes("mainnet");
        const isDevnet = currentRpc.includes("devnet");

        const needsSwitch =
          (network.environment === "mainnet" && !isMainnet) ||
          (network.environment === "testnet" && !isDevnet);

        if (!needsSwitch) {
          console.log("[Network Switch] Already on correct network");
          return;
        }

        console.log(
          `[Network Switch] Switching to ${fromChain} (environment: ${network.environment})`,
        );

        // Switch network using Dynamic's API
        // SolanaWallet has switchNetwork method that takes chainId as string/number
        if (typeof solanaWallet.switchNetwork === "function") {
          await solanaWallet.switchNetwork(
            network.dynamicChainId || fromChain,
          );
          console.log("[Network Switch] Successfully switched to:", fromChain);

          // Small delay to let network switch propagate
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          console.warn(
            "[Network Switch] Wallet does not support switchNetwork",
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[Network Switch] Failed to switch network:", message);
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
  const { setSelectedTabIndex } = useDynamicContext();
  const { setShowLinkNewWalletModal } = useDynamicModals();
  const walletsByType = useWalletsByType();
  const [compatibleWallet, setCompatibleWallet] = useState<ReturnType<
    typeof useUserWallets
  >[number] | null>(null);

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
    (chainName?: string) => {
      // Log for better UX feedback
      if (chainName && networkType) {
        console.log(
          `Prompting user to connect ${networkType.toUpperCase()} wallet for ${chainName}`,
        );
      }

      // Set the tab index based on network type before opening modal
      // Tab indices from dynamic-provider.tsx:
      // 0: All chains
      // 1: Ethereum (EVM)
      // 2: Solana
      // 3: Arbitrum (EVM)
      // 4: SUI
      let tabIndex = 0;
      if (networkType === "evm") {
        tabIndex = 1; // Ethereum tab
      } else if (networkType === "solana") {
        tabIndex = 2; // Solana tab
      } else if (networkType === "sui") {
        tabIndex = 4; // SUI tab
      }

      setSelectedTabIndex(tabIndex);
      setShowLinkNewWalletModal(true);
    },
    [networkType, setSelectedTabIndex, setShowLinkNewWalletModal],
  );

  return {
    compatibleWallet,
    hasCompatibleWallet: !!compatibleWallet,
    promptWalletConnection,
  };
}

export interface WalletOption {
  id: string;
  address: string;
  connector: {
    key: string;
    name?: string;
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
} {
  const walletsByType = useWalletsByType();
  const { primaryWallet } = useDynamicContext();
  const switchWallet = useSwitchWallet();
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

  // Get compatible wallets for each network type using proper type guards
  const sourceWallets = useMemo(() => {
    if (!fromNetworkType) return walletsByType.all;
    if (fromNetworkType === "evm") return walletsByType.ethereum;
    if (fromNetworkType === "solana") return walletsByType.solana;
    if (fromNetworkType === "sui") return walletsByType.sui;
    return [];
  }, [fromNetworkType, walletsByType]);

  const destWallets = useMemo(() => {
    if (!toNetworkType) return walletsByType.all;
    if (toNetworkType === "evm") return walletsByType.ethereum;
    if (toNetworkType === "solana") return walletsByType.solana;
    if (toNetworkType === "sui") return walletsByType.sui;
    return [];
  }, [toNetworkType, walletsByType]);

  // Auto-select primary wallet as source if compatible
  useEffect(() => {
    if (primaryWallet && sourceWallets.some((w) => w.id === primaryWallet.id)) {
      setSelectedSourceWalletId(primaryWallet.id);
    }
  }, [primaryWallet, sourceWallets]);

  // Auto-select first compatible wallet as destination
  useEffect(() => {
    if (toNetworkType && destWallets.length > 0 && !selectedDestWalletId) {
      // Prefer a different wallet from source if available, but allow same wallet if it's the only option
      const differentWallet = destWallets.find(
        (w) => w.id !== selectedSourceWalletId,
      );
      const walletToSelect = differentWallet ?? destWallets[0];
      if (walletToSelect) {
        setSelectedDestWalletId(walletToSelect.id);
      }
    }
  }, [
    toNetworkType,
    destWallets,
    selectedSourceWalletId,
    selectedDestWalletId,
  ]);

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

  return {
    // Source wallet
    sourceWallets: sourceWallets as WalletOption[],
    selectedSourceWallet: selectedSourceWallet as WalletOption | undefined,
    selectedSourceWalletId,
    handleSelectSourceWallet,

    // Destination wallet
    destWallets: destWallets as WalletOption[],
    selectedDestWallet: selectedDestWallet as WalletOption | undefined,
    selectedDestWalletId,
    handleSelectDestWallet,

    // Compatibility checks
    hasCompatibleSourceWallet: sourceWallets.length > 0,
    hasCompatibleDestWallet: destWallets.length > 0,
  };
}
