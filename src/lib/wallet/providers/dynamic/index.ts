/**
 * Dynamic Labs wallet provider implementation
 *
 * This module provides the Dynamic Labs implementation of the wallet abstraction layer.
 */

// Adapter for converting Dynamic wallets to IWallet
export { DynamicWalletAdapter } from "./adapter";

// Context hook for bridging Dynamic to IWalletContext
export { useDynamicWalletContext } from "./context";
