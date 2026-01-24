/**
 * Provider-agnostic wallet abstraction layer
 *
 * This module defines interfaces that abstract away specific wallet provider implementations
 * (Dynamic Labs, RainbowKit, Privy, etc.) so the bridge logic remains provider-agnostic.
 */

import type { Connection } from "@solana/web3.js";
import type { Chain } from "viem";
import type { SolanaWalletProvider } from "../solana/provider";

/**
 * Supported wallet chain types
 */
export type WalletChainType = "evm" | "solana" | "sui";

/**
 * EIP-1193 compatible provider interface
 * Used by EVM wallets (Ethereum, Base, Arbitrum, etc.)
 */
export interface EVMProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

/**
 * Provider-agnostic wallet interface
 *
 * This interface abstracts the common functionality needed from any wallet,
 * regardless of which provider SDK is being used.
 */
export interface IWallet {
  /** Unique identifier for this wallet instance */
  readonly id: string;

  /** The wallet's public address */
  readonly address: string;

  /** The blockchain type this wallet supports */
  readonly chainType: WalletChainType;

  /** Identifier for the wallet connector (e.g., "metamask", "phantom") */
  readonly connectorKey: string;

  /** Human-readable name of the wallet connector */
  readonly connectorName?: string;

  /**
   * Get the EVM provider for transaction signing
   * Only available for EVM wallets (chainType === 'evm')
   */
  getEVMProvider?(): Promise<EVMProvider>;

  /**
   * Get the Solana provider for transaction signing
   * Only available for Solana wallets (chainType === 'solana')
   */
  getSolanaProvider?(): Promise<SolanaWalletProvider>;

  /**
   * Get the Solana RPC connection
   * Only available for Solana wallets (chainType === 'solana')
   */
  getSolanaConnection?(): Promise<Connection>;

  /**
   * Switch the wallet to a different network
   * @param chainId - The chain ID to switch to (number for EVM, string for others)
   */
  switchNetwork?(chainId: number | string): Promise<void>;

  /**
   * Add a new chain to the wallet
   * Only available for EVM wallets (chainType === 'evm')
   * Used when wallet_switchEthereumChain fails because the chain isn't configured
   * @param chain - Viem Chain object with chain configuration
   */
  addChain?(chain: Chain): Promise<void>;

  /**
   * Check if the wallet is currently connected
   */
  isConnected(): boolean;

  /**
   * Disconnect the wallet
   */
  disconnect(): Promise<void>;
}

/**
 * Wallet context interface for React components
 *
 * Provides access to wallet state and actions in a provider-agnostic way.
 */
export interface IWalletContext {
  /** Whether any wallet is currently connected */
  isConnected: boolean;

  /** The currently active/primary wallet */
  primaryWallet: IWallet | null;

  /** All connected wallets */
  allWallets: IWallet[];

  /** Connected EVM wallets (Ethereum, Base, Arbitrum, etc.) */
  evmWallets: IWallet[];

  /** Connected Solana wallets */
  solanaWallets: IWallet[];

  /** Connected SUI wallets */
  suiWallets: IWallet[];

  /**
   * Initiate wallet connection flow
   */
  connect(): void;

  /**
   * Disconnect all wallets
   */
  disconnect(): Promise<void>;

  /**
   * Switch the primary wallet to a different connected wallet
   * @param walletId - The ID of the wallet to switch to
   */
  switchWallet(walletId: string): Promise<void>;

  /**
   * Show the wallet connection modal
   */
  showConnectModal(): void;

  /**
   * Show the wallet manager UI (for managing connected wallets)
   */
  showWalletManager(): void;

  /**
   * Hide the wallet manager UI
   */
  hideWalletManager(): void;

  /** Whether the wallet manager is currently open */
  isWalletManagerOpen: boolean;
}

// Re-export SolanaWalletProvider for convenience
export type { SolanaWalletProvider };
