/**
 * Adapter Factory - Extensible pattern for creating blockchain adapters
 * This design allows easy addition of new chains without modifying core service logic
 */

import { createViemAdapterFromProvider as createEvmAdapter } from "@circle-fin/adapter-viem-v2";
import { createSolanaAdapterFromProvider as createSolanaAdapter } from "@circle-fin/adapter-solana";
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

// Use union of actual adapter return types to avoid type mismatch between SDK packages
// The individual adapter packages have slightly different type definitions than bridge-kit's AdapterContext
export type EvmAdapter = Awaited<ReturnType<typeof createEvmAdapter>>;
export type SolanaAdapter = Awaited<ReturnType<typeof createSolanaAdapter>>;
export type BridgeAdapter = EvmAdapter | SolanaAdapter;

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

  /**
   * Switch Solana wallet to target network before creating adapter
   * Uses Dynamic's chain ID for network switching (e.g., "101" for mainnet, "103" for devnet)
   *
   * This is critical when Solana is the destination chain - the wallet may still be
   * connected to devnet from previous testing, causing network mismatch errors during mint.
   *
   * @param wallet - The Solana wallet to switch networks on
   * @param chainId - The SupportedChainId (e.g., "Solana" or "Solana_Devnet")
   */
  static async switchNetwork(
    wallet: IWallet,
    chainId: SupportedChainId,
  ): Promise<void> {
    if (wallet.chainType !== "solana") {
      console.warn(
        "[SolanaAdapter] Cannot switch network: wallet is not a Solana wallet",
      );
      return;
    }

    if (!wallet.switchNetwork) {
      console.warn("[SolanaAdapter] Wallet does not support network switching");
      return;
    }

    const network = NETWORK_CONFIGS[chainId];
    if (network?.type !== "solana") {
      console.warn(`[SolanaAdapter] Invalid Solana chain: ${chainId}`);
      return;
    }

    // Dynamic uses string chain IDs for Solana: "101" (mainnet), "103" (devnet)
    const dynamicChainId = network.dynamicChainId;
    if (!dynamicChainId) {
      console.warn(`[SolanaAdapter] No dynamicChainId for ${chainId}`);
      return;
    }

    try {
      await wallet.switchNetwork(dynamicChainId);
      // Wait for wallet to update its connection
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[SolanaAdapter] Failed to switch network:`, error);
      // Re-throw - we need the switch to succeed for correct RPC on mainnet
      throw error;
    }
  }

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

    // Determine environment from chainId
    const network = chainId ? NETWORK_CONFIGS[chainId] : null;
    const isTestnet = network?.environment === "testnet";

    let connection: Connection;

    if (isTestnet) {
      // Testnet: Always use default devnet RPC
      connection = new Connection(SOLANA_RPC_ENDPOINTS.testnet);
    } else if (wallet.getSolanaConnection) {
      // Mainnet with wallet connection: Use wallet's RPC (respects user's configuration)
      connection = await wallet.getSolanaConnection();
    } else {
      // Default to mainnet RPC (TODO: this RPC is very unreliable, must remove)
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
