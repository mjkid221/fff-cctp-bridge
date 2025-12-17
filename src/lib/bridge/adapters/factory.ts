/**
 * Adapter Factory - Extensible pattern for creating blockchain adapters
 * This design allows easy addition of new chains without modifying core service logic
 */

import { createAdapterFromProvider as createEvmAdapter } from "@circle-fin/adapter-viem-v2";
import { createAdapterFromProvider as createSolanaAdapter } from "@circle-fin/adapter-solana";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { isSolanaWallet } from "@dynamic-labs/solana";
import type {
  Wallet,
  WalletConnectorCore,
} from "@dynamic-labs/wallet-connector-core";
import type { AdapterContext } from "@circle-fin/bridge-kit";
import type { NetworkType } from "../networks";
import { DynamicSolanaWalletAdapter } from "~/lib/solana/provider";
import { Connection } from "@solana/web3.js";

// Use the adapter type from Circle's bridge-kit
type BridgeAdapter = AdapterContext["adapter"];

/**
 * Base adapter creator interface
 * Implement this for each blockchain type
 */
export interface IAdapterCreator {
  readonly networkType: NetworkType;
  canHandle(wallet: Wallet<WalletConnectorCore.WalletConnector>): boolean;
  createAdapter(
    wallet: Wallet<WalletConnectorCore.WalletConnector>,
  ): Promise<BridgeAdapter>;
}

/**
 * EVM Adapter Creator
 * Handles all Ethereum-compatible chains
 */
export class EVMAdapterCreator implements IAdapterCreator {
  readonly networkType: NetworkType = "evm";

  canHandle(wallet: Wallet<WalletConnectorCore.WalletConnector>): boolean {
    return isEthereumWallet(wallet);
  }

  async createAdapter(
    wallet: Wallet<WalletConnectorCore.WalletConnector>,
  ): Promise<BridgeAdapter> {
    if (!isEthereumWallet(wallet)) {
      throw new Error("Wallet is not an Ethereum wallet");
    }

    const providerResult = await wallet.getWalletClient();

    if (!providerResult) {
      throw new Error("Failed to get EVM wallet client");
    }

    // Create EVM adapter using Circle's factory
    // Dynamic's wallet client is EIP-1193 compatible but types don't match exactly
    // Using type assertion for compatibility
    return await createEvmAdapter({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      provider: providerResult as any,
    });
  }
}

/**
 * Solana Adapter Creator
 * Handles Solana and Solana Devnet
 */
export class SolanaAdapterCreator implements IAdapterCreator {
  readonly networkType: NetworkType = "solana";

  canHandle(wallet: Wallet<WalletConnectorCore.WalletConnector>): boolean {
    return isSolanaWallet(wallet);
  }

  async createAdapter(
    wallet: Wallet<WalletConnectorCore.WalletConnector>,
  ): Promise<BridgeAdapter> {
    if (!isSolanaWallet(wallet)) {
      throw new Error("Wallet is not a Solana wallet");
    }
    // Create wrapper for Solana Wallet Provider class (for Dynamic)
    const solanaProvider = new DynamicSolanaWalletAdapter(wallet);

    const connection = new Connection(
      (await wallet.getConnection()).rpcEndpoint,
    );

    // Create Solana adapter using Circle's factory
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
   */
  async getAdapter(
    wallet: Wallet<WalletConnectorCore.WalletConnector>,
    networkType: NetworkType,
  ): Promise<BridgeAdapter> {
    // Check cache first
    const cacheKey = `${wallet.address}-${networkType}`;
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
        `Wallet ${wallet.connector.key} is not compatible with ${networkType}`,
      );
    }

    // Create and cache the adapter
    const adapter = await creator.createAdapter(wallet);
    this.adapterCache.set(cacheKey, adapter);

    return adapter;
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

/**
 * Reset the adapter factory (useful for testing or account switching)
 */
export function resetAdapterFactory(): void {
  if (factoryInstance) {
    factoryInstance.clearCache();
  }
  factoryInstance = null;
}
