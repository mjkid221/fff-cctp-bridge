"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useDynamicContext,
  useDynamicModals,
  useUserWallets,
  useSwitchWallet,
} from "@dynamic-labs/sdk-react-core";
import { getBridgeService } from "./service";
import { useBridgeStore } from "./store";
import type { BridgeParams, BridgeEstimate, BridgeTransaction } from "./types";
import type { SupportedChainId } from "./networks";
import { NETWORK_CONFIGS } from "./networks";
/**
 * Hook to initialize bridge service with wallet
 */
export function useBridgeInit() {
  const { primaryWallet } = useDynamicContext();
  const userWallets = useUserWallets();
  const setUserAddress = useBridgeStore((state) => state.setUserAddress);
  const loadTransactions = useBridgeStore((state) => state.loadTransactions);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initBridge = async () => {
      if (primaryWallet?.address) {
        const service = getBridgeService();

        // Pass the primary wallet and all connected wallets to the service
        await service.initialize(primaryWallet, userWallets);
        setUserAddress(primaryWallet.address);
        await loadTransactions();
        setIsInitialized(true);
      } else {
        setUserAddress(null);
        setIsInitialized(false);
      }
    };

    void initBridge();
  }, [primaryWallet, userWallets, setUserAddress, loadTransactions]);

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addTransaction = useBridgeStore((state) => state.addTransaction);
  const updateTransaction = useBridgeStore((state) => state.updateTransaction);
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

        // Poll for updates while transaction is in progress
        const pollInterval = setInterval(() => {
          void (async () => {
            const updated = await service.getTransaction(transaction.id);
            if (updated) {
              updateTransaction(transaction.id, updated);
              setCurrentTransaction(updated);

              // Stop polling when transaction is complete or failed
              if (
                updated.status === "completed" ||
                updated.status === "failed" ||
                updated.status === "cancelled"
              ) {
                clearInterval(pollInterval);
              }
            }
          })();
        }, 2000); // Poll every 2 seconds

        // Cleanup interval after 15 minutes (max attestation time)
        setTimeout(() => clearInterval(pollInterval), 15 * 60 * 1000);

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
    [addTransaction, setCurrentTransaction, updateTransaction],
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
 * Hook for wallet balance
 */
export function useWalletBalance(chainId: SupportedChainId | null) {
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { primaryWallet } = useDynamicContext();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!primaryWallet?.address || !chainId) {
        setBalance("0.00");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const service = getBridgeService();
        const tokenBalance = await service.getBalance(chainId);
        setBalance(tokenBalance.formatted);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch balance";
        console.error("Failed to fetch balance:", err);
        setError(errorMessage);
        setBalance("0.00");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchBalance();
  }, [primaryWallet, chainId]);

  return { balance, isLoading, error };
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
 * Hook for managing wallet connection for specific network types
 * Note: Dynamic SDK automatically handles multi-wallet support when users
 * connect additional wallets through the modal
 */
export function useWalletForNetwork(
  networkType: "evm" | "solana" | "sui" | null,
) {
  const { setSelectedTabIndex } = useDynamicContext();
  const { setShowLinkNewWalletModal } = useDynamicModals();
  const userWallets = useUserWallets();
  const [compatibleWallet, setCompatibleWallet] = useState<
    (typeof userWallets)[number] | null
  >(null);

  useEffect(() => {
    if (!networkType) {
      setCompatibleWallet(null);
      return;
    }

    // Check all connected wallets for compatibility
    const compatible = userWallets.find((wallet) =>
      checkWalletCompatibility(wallet, networkType),
    );

    setCompatibleWallet(compatible ?? null);
  }, [userWallets, networkType]);

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

/**
 * Check if wallet is compatible with network type using Dynamic's chain property
 */
function checkWalletCompatibility(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any,
  networkType: "evm" | "solana" | "sui",
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!wallet?.chain) return false;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const chainName = String(wallet.chain).toLowerCase();

  switch (networkType) {
    case "evm":
      // Check if the wallet's chain is an EVM chain
      return (
        chainName.includes("eth") ||
        chainName.includes("arbitrum") ||
        chainName.includes("base") ||
        chainName.includes("optimism") ||
        chainName.includes("polygon") ||
        chainName.includes("avalanche") ||
        chainName.includes("bnb") ||
        chainName.includes("evm")
      );

    case "solana":
      // Check if the wallet's chain is Solana
      return chainName.includes("solana") || chainName.includes("sol");

    case "sui":
      // Check if the wallet's chain is SUI
      return chainName.includes("sui");

    default:
      return false;
  }
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
  const userWallets = useUserWallets();
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

  // Filter compatible wallets for each chain
  const sourceWallets = userWallets.filter((wallet) =>
    fromNetworkType ? checkWalletCompatibility(wallet, fromNetworkType) : true,
  );

  const destWallets = userWallets.filter((wallet) => {
    // Only filter by network compatibility, allow same wallet if it supports destination network
    return toNetworkType
      ? checkWalletCompatibility(wallet, toNetworkType)
      : true;
  });

  // Auto-select primary wallet as source if compatible
  useEffect(() => {
    if (
      primaryWallet &&
      fromNetworkType &&
      checkWalletCompatibility(primaryWallet, fromNetworkType)
    ) {
      setSelectedSourceWalletId(primaryWallet.id);
    }
  }, [primaryWallet, fromNetworkType]);

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
