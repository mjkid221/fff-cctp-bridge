/**
 * Bridge module exports
 * Central export point for all bridge-related functionality
 */

// Window utilities (constrainToViewport used by transaction windows)
export { constrainToViewport } from "./window-utils";
export type { WindowPosition, WindowType } from "./window-utils";

// Hooks
export {
  useBridgeInit,
  useBridgeEstimate,
  useBridge,
  useTransactionHistoryInfinite,
  useNetworkAutoSwitch,
  useWalletBalance,
  useWalletForNetwork,
  useWalletSelection,
  useWalletsByType,
} from "./hooks";

// Shared window state hook
export { useWindowState } from "./useWindowState";

// Address validation
export {
  isValidEVMAddress,
  isValidSolanaAddress,
  isValidSuiAddress,
  validateAddressForNetwork,
  getAddressFormatDescription,
} from "./address-validation";

// Utility functions
export {
  NETWORK_TYPE_LABELS,
  getNetworkTypeLabel,
  getWalletKeyForNetworkType,
  hasWalletForNetworkType,
  getWalletsForNetworkType,
  getTransactionDisplayAddress,
  formatAddressShort,
} from "./utils";

// Error parsing
export { parseTransactionError, parseStepError } from "./error-parser";
export type { ParsedError } from "./error-parser";

// Store
export { useBridgeStore } from "./store";
export {
  useEnvironment,
  useSetEnvironment,
  useTransferMethod,
  useSetTransferMethod,
  useFromChain,
  useToChain,
  useSetFromChain,
  useSetToChain,
  useSwapChains,
  useCurrentTransaction,
  // Multi-window transaction support
  useOpenTransactionWindows,
  useCloseTransactionWindow,
  useFocusTransactionWindow,
  useUpdateTransactionWindowPosition,
  useCancelTransaction,
  // Header control order
  useHeaderControlOrder,
  useSetHeaderControlOrder,
} from "./store";
export type { TransactionWindow } from "./store";

// Types
export type {
  TransferMethod,
  TransactionStatus,
  BridgeStep,
  BridgeTransaction,
  BridgeEstimate,
  BridgeParams,
  TokenBalance,
  WalletOption,
} from "./types";

// Networks
export {
  NETWORK_CONFIGS,
  getNetworksByEnvironment,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from "./networks";
export type {
  NetworkEnvironment,
  SupportedChainId,
  NetworkType,
  NetworkConfig,
} from "./networks";
