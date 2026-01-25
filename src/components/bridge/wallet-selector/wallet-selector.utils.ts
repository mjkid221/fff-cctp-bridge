import type { WalletOption } from "./wallet-selector.types";

/**
 * Format a wallet address to display abbreviated form
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get the display name for a wallet
 */
export function getWalletName(wallet: WalletOption): string {
  return wallet.connector.name || wallet.connector.key;
}
