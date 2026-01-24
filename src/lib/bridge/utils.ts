import type { NetworkType } from "./networks";
import type { BridgeTransaction } from "./types";

/**
 * Network type display labels for UI
 */
export const NETWORK_TYPE_LABELS: Record<NetworkType, string> = {
  evm: "EVM",
  solana: "Solana",
  sui: "SUI",
};

/**
 * Get the display label for a network type
 */
export function getNetworkTypeLabel(networkType: NetworkType | null): string {
  if (!networkType) return "Unknown";
  return NETWORK_TYPE_LABELS[networkType];
}

/**
 * Wallet key mapping for network types
 */
type WalletKey = "ethereum" | "solana" | "sui";

/**
 * Get the wallet key for a network type
 */
export function getWalletKeyForNetworkType(
  networkType: NetworkType,
): WalletKey {
  switch (networkType) {
    case "evm":
      return "ethereum";
    case "solana":
      return "solana";
    case "sui":
      return "sui";
  }
}

/**
 * Wallets by type structure
 */
interface WalletsByType<T = unknown> {
  ethereum: T[];
  solana: T[];
  sui: T[];
  all?: T[];
}

/**
 * Check if user has a wallet for the given network type
 */
export function hasWalletForNetworkType(
  networkType: NetworkType | null,
  walletsByType: WalletsByType,
): boolean {
  if (!networkType) return false;
  const key = getWalletKeyForNetworkType(networkType);
  return walletsByType[key].length > 0;
}

/**
 * Get wallets for a specific network type
 */
export function getWalletsForNetworkType<T>(
  networkType: NetworkType | null,
  walletsByType: WalletsByType<T> & { all: T[] },
): T[] {
  if (!networkType) return walletsByType.all;
  const key = getWalletKeyForNetworkType(networkType);
  return walletsByType[key];
}

/**
 * Get the display address for a transaction
 * Falls back through: destinationAddress -> recipientAddress -> userAddress
 */
export function getTransactionDisplayAddress(
  transaction: Pick<
    BridgeTransaction,
    "destinationAddress" | "recipientAddress" | "userAddress"
  >,
): string {
  return (
    transaction.destinationAddress ??
    transaction.recipientAddress ??
    transaction.userAddress
  );
}

/**
 * Format an address for display (truncated with ellipsis)
 */
export function formatAddressShort(address: string): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
