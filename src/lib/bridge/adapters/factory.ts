/**
 * Adapter Factory - Extensible pattern for creating blockchain adapters
 * This design allows easy addition of new chains without modifying core service logic
 */

import { createViemAdapterFromProvider as createEvmAdapter } from "@circle-fin/adapter-viem-v2";
import { createSolanaAdapterFromProvider as createSolanaAdapter } from "@circle-fin/adapter-solana";
import type { AdapterContext } from "@circle-fin/bridge-kit";
import { Connection } from "@solana/web3.js";
import type { IWallet } from "~/lib/wallet/types";
import {
  type NetworkType,
  NETWORK_CONFIGS,
  type SupportedChainId,
} from "../networks";
import { getViemChain } from "../chain-utils";

// Solana RPC endpoints
const SOLANA_RPC_ENDPOINTS = {
  mainnet: "https://api.mainnet-beta.solana.com/",
  testnet: "https://api.devnet.solana.com",
} as const;

// Use the adapter type from Circle's bridge-kit
type BridgeAdapter = AdapterContext["adapter"];

/**
 * Base adapter creator interface
 * Implement this for each blockchain type
 */
export interface IAdapterCreator {
  readonly networkType: NetworkType;
  canHandle(wallet: IWallet): boolean;
  createAdapter(
    wallet: IWallet,
    chainId?: SupportedChainId,
  ): Promise<BridgeAdapter>;
}

/**
 * EVM Adapter Creator
 * Handles all Ethereum-compatible chains
 */
export class EVMAdapterCreator implements IAdapterCreator {
  readonly networkType: NetworkType = "evm";

  canHandle(wallet: IWallet): boolean {
    return wallet.chainType === "evm";
  }

  /**
   * Switch EVM wallet to target network before creating adapter
   * This is critical for cross-chain bridges where the destination chain
   * may be different from the wallet's current network
   *
   * If the chain doesn't exist in the wallet, it will attempt to add it first
   * using wallet_addEthereumChain before switching.
   *
   * @param wallet - The wallet to switch networks on
   * @param targetChainId - The numeric EVM chain ID to switch to
   * @param chainId - Optional SupportedChainId for resolving viem chain config
   */
  static async switchNetwork(
    wallet: IWallet,
    targetChainId: number,
    chainId?: SupportedChainId,
  ): Promise<void> {
    if (wallet.chainType !== "evm") {
      console.warn(
        "[EVMAdapter] Cannot switch network: wallet is not an EVM wallet",
      );
      return;
    }

    if (!wallet.switchNetwork) {
      console.warn("[EVMAdapter] Wallet does not support network switching");
      return;
    }

    try {
      await wallet.switchNetwork(targetChainId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // Check if error is "unrecognized chain" - wallet doesn't have this chain configured
      const isUnrecognizedChain =
        message.includes("Unrecognized chain") ||
        message.includes("wallet_addEthereumChain") ||
        message.includes("chain has not been added") ||
        message.includes("Try adding the chain");

      if (isUnrecognizedChain && chainId && wallet.addChain) {
        const viemChain = getViemChain(chainId);
        if (!viemChain) {
          throw new Error(
            `Failed to add chain ${targetChainId}: chain config not available for ${chainId}`,
          );
        }

        await wallet.addChain(viemChain);
        await wallet.switchNetwork(targetChainId);
        return;
      }

      console.error(`[EVMAdapter] Failed to switch network:`, error);
      throw new Error(`Failed to switch to chain ${targetChainId}: ${message}`);
    }
  }

  async createAdapter(
    wallet: IWallet,
    _chainId?: SupportedChainId,
  ): Promise<BridgeAdapter> {
    if (wallet.chainType !== "evm") {
      throw new Error("Wallet is not an Ethereum wallet");
    }

    if (!wallet.getEVMProvider) {
      throw new Error("Wallet does not support EVM provider");
    }

    const providerResult = await wallet.getEVMProvider();

    if (!providerResult) {
      throw new Error("Failed to get EVM wallet client");
    }

    return await createEvmAdapter({
      provider: providerResult as unknown as Parameters<
        typeof createEvmAdapter
      >[0]["provider"],
    });
  }
}

/**
 * Solana Adapter Creator
 * Handles Solana and Solana Devnet
 */
export class SolanaAdapterCreator implements IAdapterCreator {
  readonly networkType: NetworkType = "solana";

  canHandle(wallet: IWallet): boolean {
    return wallet.chainType === "solana";
  }

  async createAdapter(
    wallet: IWallet,
    chainId?: SupportedChainId,
  ): Promise<BridgeAdapter> {
    if (wallet.chainType !== "solana") {
      throw new Error("Wallet is not a Solana wallet");
    }

    if (!wallet.getSolanaProvider) {
      throw new Error("Wallet does not support Solana provider");
    }

    const solanaProvider = await wallet.getSolanaProvider();

    let connection: Connection;

    if (wallet.getSolanaConnection) {
      // Use wallet's connection (preferred - respects user's RPC configuration)
      connection = await wallet.getSolanaConnection();
    } else if (chainId) {
      // Fall back to default RPC based on chain environment
      const network = NETWORK_CONFIGS[chainId];
      const rpcEndpoint =
        network?.environment === "mainnet"
          ? SOLANA_RPC_ENDPOINTS.mainnet
          : SOLANA_RPC_ENDPOINTS.testnet;
      connection = new Connection(rpcEndpoint);
    } else {
      // Default to mainnet if we can't determine (likely won't happen in practice)
      connection = new Connection(SOLANA_RPC_ENDPOINTS.mainnet);
    }

    return await createSolanaAdapter({
      provider: solanaProvider,
      connection,
    });
  }
}

/**
 * Adapter Factory
 * Central registry for adapter creators, extensible for future chains
 */
export class AdapterFactory {
  private readonly creators: Map<NetworkType, IAdapterCreator>;
  private readonly adapterCache: Map<string, BridgeAdapter>;

  constructor() {
    this.creators = new Map();
    this.adapterCache = new Map();

    // Register built-in adapter creators
    this.registerCreator(new EVMAdapterCreator());
    this.registerCreator(new SolanaAdapterCreator());
  }

  /**
   * Register a new adapter creator for a specific network type
   * This enables extension for future chains (SUI, etc.)
   */
  registerCreator(creator: IAdapterCreator): void {
    if (this.creators.has(creator.networkType)) {
      console.warn(
        `Overwriting existing adapter creator for ${creator.networkType}`,
      );
    }
    this.creators.set(creator.networkType, creator);
  }

  /**
   * Get or create an adapter for the given wallet and network type
   * @param wallet - The wallet to create an adapter for
   * @param networkType - The network type (evm, solana, etc.)
   * @param chainId - Optional chain ID for environment-specific RPC selection
   */
  async getAdapter(
    wallet: IWallet,
    networkType: NetworkType,
    chainId?: SupportedChainId,
  ): Promise<BridgeAdapter> {
    // Include chainId in cache key for environment differentiation
    const cacheKey = chainId
      ? `${wallet.address}-${networkType}-${chainId}`
      : `${wallet.address}-${networkType}`;

    const cached = this.adapterCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get the appropriate creator
    const creator = this.creators.get(networkType);
    if (!creator) {
      throw new Error(`No adapter creator registered for ${networkType}`);
    }

    // Verify wallet compatibility
    if (!creator.canHandle(wallet)) {
      throw new Error(
        `Wallet ${wallet.connectorKey} is not compatible with ${networkType}`,
      );
    }

    // Create and cache the adapter (pass chainId for environment-based RPC)
    const adapter = await creator.createAdapter(wallet, chainId);
    this.adapterCache.set(cacheKey, adapter);

    return adapter;
  }

  /**
   * Create a fresh adapter for a transaction (not cached)
   * Use this for bridge/retry/resume operations to avoid concurrent transaction conflicts
   * where multiple transactions sharing the same adapter can cause duplicate wallet popups
   *
   * @param wallet - The wallet to create an adapter for
   * @param networkType - The network type (evm, solana, etc.)
   * @param chainId - Optional chain ID for environment-specific RPC selection
   */
  async createTransactionAdapter(
    wallet: IWallet,
    networkType: NetworkType,
    chainId?: SupportedChainId,
  ): Promise<BridgeAdapter> {
    // Get the appropriate creator
    const creator = this.creators.get(networkType);
    if (!creator) {
      throw new Error(`No adapter creator registered for ${networkType}`);
    }

    // Verify wallet compatibility
    if (!creator.canHandle(wallet)) {
      throw new Error(
        `Wallet ${wallet.connectorKey} is not compatible with ${networkType}`,
      );
    }

    // Create fresh adapter without caching
    return creator.createAdapter(wallet, chainId);
  }

  /**
   * Clear adapter cache for a specific wallet or all wallets
   */
  clearCache(walletAddress?: string): void {
    if (walletAddress) {
      // Clear only adapters for this wallet
      const keysToDelete = Array.from(this.adapterCache.keys()).filter((key) =>
        key.startsWith(walletAddress),
      );
      keysToDelete.forEach((key) => this.adapterCache.delete(key));
    } else {
      // Clear all
      this.adapterCache.clear();
    }
  }

  /**
   * Get all supported network types
   */
  getSupportedNetworkTypes(): NetworkType[] {
    return Array.from(this.creators.keys());
  }

  /**
   * Check if a network type is supported
   */
  supports(networkType: NetworkType): boolean {
    return this.creators.has(networkType);
  }

  /**
   * Get creator for a network type
   */
  getCreator(networkType: NetworkType): IAdapterCreator | undefined {
    return this.creators.get(networkType);
  }
}

// Singleton instance
let factoryInstance: AdapterFactory | null = null;

/**
 * Get the global adapter factory instance
 */
export function getAdapterFactory(): AdapterFactory {
  if (!factoryInstance) {
    factoryInstance = new AdapterFactory();
  }
  return factoryInstance;
}
