/**
 * CCTP Attestation Times
 * Based on Circle's official documentation
 * https://developers.circle.com/cctp/required-block-confirmations
 */

import type { SupportedChainId } from "./networks";

/**
 * Attestation time in seconds for each chain
 * Uses Fast Message times when available, falls back to Standard times
 */
export const CCTP_ATTESTATION_TIMES: Record<SupportedChainId, number> = {
  // Mainnet - Fast Message Times (prioritized)
  Ethereum: 20, // ~20 seconds (Fast: 2 blocks)
  Arbitrum: 8, // ~8 seconds (Fast: 1 block)
  Base: 8, // ~8 seconds (Fast: 1 block)
  Monad: 5, // ~5 seconds (Fast: sub-second finality)
  HyperEVM: 5, // ~5 seconds (Fast: sub-second finality)
  Solana: 8, // ~8 seconds (Fast: 2-3 blocks)

  // Testnet - Using same times as mainnet equivalents
  Ethereum_Sepolia: 20, // ~20 seconds (Fast: 2 blocks)
  Arbitrum_Sepolia: 8, // ~8 seconds (Fast: 1 block)
  Base_Sepolia: 8, // ~8 seconds (Fast: 1 block)
  Monad_Testnet: 5, // ~5 seconds (Fast: sub-second finality)
  HyperEVM_Testnet: 5, // ~5 seconds (Fast: sub-second finality)
  Solana_Devnet: 8, // ~8 seconds (Fast: 2-3 blocks)
};

/**
 * Standard attestation times (fallback) in seconds
 * Used when Fast Message is not available
 */
export const CCTP_STANDARD_ATTESTATION_TIMES: Record<SupportedChainId, number> =
  {
    // Mainnet - Standard Times
    Ethereum: 13 * 60, // ~13 minutes (~65 blocks)
    Arbitrum: 13 * 60, // ~13 minutes (~65 ETH blocks)
    Base: 13 * 60, // ~13 minutes (~65 ETH blocks)
    Monad: 5, // ~5 seconds (sub-second finality)
    HyperEVM: 5, // ~5 seconds (sub-second finality)
    Solana: 25, // ~25 seconds (32 blocks for finality)

    // Testnet - Using same times as mainnet equivalents
    Ethereum_Sepolia: 13 * 60, // ~13 minutes
    Arbitrum_Sepolia: 13 * 60, // ~13 minutes
    Base_Sepolia: 13 * 60, // ~13 minutes
    Monad_Testnet: 5, // ~5 seconds (sub-second finality)
    HyperEVM_Testnet: 5, // ~5 seconds (sub-second finality)
    Solana_Devnet: 25, // ~25 seconds
  };

/**
 * Get the estimated attestation time for a source chain
 * Returns time in milliseconds
 */
export function getAttestationTime(
  sourceChain: SupportedChainId,
  useFast = true,
): number {
  const seconds = useFast
    ? CCTP_ATTESTATION_TIMES[sourceChain]
    : CCTP_STANDARD_ATTESTATION_TIMES[sourceChain];

  return seconds * 1000; // Convert to milliseconds
}

/**
 * Get human-readable attestation time
 */
export function getAttestationTimeDisplay(
  sourceChain: SupportedChainId,
  useFast = true,
): string {
  const seconds = useFast
    ? CCTP_ATTESTATION_TIMES[sourceChain]
    : CCTP_STANDARD_ATTESTATION_TIMES[sourceChain];

  if (seconds < 60) {
    return `~${seconds} seconds`;
  }

  const minutes = Math.floor(seconds / 60);
  return `~${minutes} minute${minutes > 1 ? "s" : ""}`;
}
