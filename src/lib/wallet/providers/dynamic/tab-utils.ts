/**
 * Tab Index Utilities for Dynamic Labs Wallet Modal
 *
 * These indices must match the tab order defined in:
 * src/components/providers/dynamic-provider.tsx → overrides.views.tabs.items
 */

/**
 * Tab indices matching the order in dynamic-provider.tsx overrides.views config
 */
const NETWORK_TAB_INDEX = {
  all: 0, // "All chains" tab
  evm: 1, // EthereumIcon tab - FilterChain("EVM")
  solana: 2, // SolanaIcon tab - FilterChain("SOL")
  sui: 0, // Fallback to "All chains" until SUI tab is added
} as const;

/**
 * Get the wallet modal tab index for a given network type
 *
 * @param networkType - The network type ("evm", "solana", "sui", or null)
 * @returns The tab index to select in the wallet modal
 */
export function getTabIndexForNetwork(
  networkType: "evm" | "solana" | "sui" | null,
): number {
  if (!networkType) return NETWORK_TAB_INDEX.all;
  return NETWORK_TAB_INDEX[networkType] ?? NETWORK_TAB_INDEX.all;
}
