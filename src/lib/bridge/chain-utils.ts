/**
 * Chain utilities for viem chain resolution
 *
 * Provides mapping between SupportedChainId and viem Chain objects
 * for use with wallet_addEthereumChain
 */

import { type Chain } from "viem";
import {
  hyperEvm,
  hyperliquidEvmTestnet,
  monad,
  monadTestnet,
  mainnet,
  sepolia,
  base,
  baseSepolia,
  arbitrum,
  arbitrumSepolia,
} from "viem/chains";
import { NETWORK_CONFIGS, type SupportedChainId } from "./networks";

/**
 * Map SupportedChainId to viem chain objects
 * Using viem's built-in chain definitions ensures correct RPC URLs and metadata
 */
const VIEM_CHAIN_MAP: Partial<Record<SupportedChainId, Chain>> = {
  // Mainnet chains
  Ethereum: mainnet,
  Base: base,
  Arbitrum: arbitrum,
  HyperEVM: hyperEvm,
  Monad: monad,
  // Testnet chains
  Ethereum_Sepolia: sepolia,
  Base_Sepolia: baseSepolia,
  Arbitrum_Sepolia: arbitrumSepolia,
  HyperEVM_Testnet: hyperliquidEvmTestnet,
  Monad_Testnet: monadTestnet,
};

/**
 * Get a viem Chain object for the given SupportedChainId
 *
 * Tries viem's built-in chain definitions first for accurate RPC URLs,
 * falls back to building from network config if not available.
 *
 * @param chainId - The supported chain identifier
 * @returns The viem Chain object, or null if not an EVM chain
 */
export function getViemChain(chainId: SupportedChainId): Chain | null {
  // Try viem chains first (preferred for accurate RPC URLs)
  const viemChain = VIEM_CHAIN_MAP[chainId];
  if (viemChain) return viemChain;

  // Fall back to building from network config
  const config = NETWORK_CONFIGS[chainId];
  if (!config?.evmChainId || config.type !== "evm") return null;

  // Build a minimal chain object from network config
  // Note: RPC URLs may need to be provided by the wallet
  return {
    id: config.evmChainId,
    name: config.name,
    nativeCurrency: config.nativeCurrency,
    rpcUrls: {
      default: { http: [] }, // Empty - wallet will use its default or prompt user
    },
    blockExplorers: {
      default: { name: "Explorer", url: config.explorerUrl },
    },
  } as Chain;
}

/**
 * Get a viem Chain object by numeric EVM chain ID
 *
 * Used when we only have the numeric ID (e.g., from Bridge Kit internal calls)
 * that need to add a chain before switching.
 *
 * @param evmChainId - The numeric EVM chain ID
 * @returns The viem Chain object, or null if not found
 */
export function getViemChainByEvmId(evmChainId: number): Chain | null {
  // Check viem chain map first (they have .id property matching evmChainId)
  for (const chain of Object.values(VIEM_CHAIN_MAP)) {
    if (chain && chain.id === evmChainId) {
      return chain;
    }
  }

  // Fall back to network config lookup and build chain from config
  for (const [chainId, config] of Object.entries(NETWORK_CONFIGS)) {
    if (config.evmChainId === evmChainId && config.type === "evm") {
      return getViemChain(chainId as SupportedChainId);
    }
  }

  return null;
}
