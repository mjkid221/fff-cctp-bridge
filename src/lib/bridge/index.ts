/**
 * Bridge module exports
 * Central export point for all bridge-related functionality
 */

// Core service
export { getBridgeService, CCTPBridgeService } from "./service";
export type { BridgeServiceConfig } from "./service";

// Event manager
export { BridgeEventManager } from "./event-manager";

// Adapter factory
export { getAdapterFactory, AdapterFactory } from "./adapters/factory";
export type { IAdapterCreator } from "./adapters/factory";

// Balance service
export { getBalanceService, BalanceService } from "./balance/service";

// Storage
export { BridgeStorage } from "./storage";

// Window utilities
export {
  constrainToViewport,
  isWithinViewport,
  validateOrResetPosition,
  getWindowDimensions,
  DEFAULT_WINDOW_POSITIONS,
  NAVBAR_HEIGHT,
  NAVBAR_SAFE_ZONE,
} from "./window-utils";
export type {
  WindowDimensions,
  WindowPosition,
  WindowType,
} from "./window-utils";

// Hooks
export {
  useBridgeInit,
  useBridgeEstimate,
  useBridge,
  useRetryBridge,
  useTransactionHistory,
  useNetworkAutoSwitch,
  useWalletBalance,
  useWalletForNetwork,
  useWalletSelection,
  useWalletsByType,
} from "./hooks";

// Query keys for React Query cache management
export { bridgeKeys } from "./query-keys";
export type {
  BridgeQueryKey,
  BalanceQueryKey,
  EstimateQueryKey,
  RouteQueryKey,
} from "./query-keys";

// Address validation
export {
  isValidEVMAddress,
  isValidSolanaAddress,
  isValidSuiAddress,
  validateAddressForNetwork,
  getAddressFormatDescription,
} from "./address-validation";

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
  useUserAddress,
  useFromChain,
  useToChain,
  useSetFromChain,
  useSetToChain,
  useSwapChains,
  useCurrentTransaction,
  useActiveWindow,
  useSetActiveWindow,
  useWindowPositions,
  useSetWindowPosition,
  useWindowZIndexes,
  useFocusWindow,
  useHasHydrated,
  // Multi-window transaction support
  useOpenTransactionWindows,
  useOpenTransactionWindow,
  useCloseTransactionWindow,
  useFocusTransactionWindow,
  useUpdateTransactionWindowPosition,
  useUpdateTransactionInWindow,
  useMinimizeTransactionWindow,
  useCancelTransaction,
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
  IBridgeService,
  Adapter,
  AdapterCapabilities,
  WalletOption,
} from "./types";

// Networks
export {
  NETWORK_CONFIGS,
  getNetworksByEnvironment,
  isRouteSupported,
  getExplorerTxUrl,
} from "./networks";
export type {
  NetworkEnvironment,
  SupportedChainId,
  NetworkType,
  NetworkConfig,
} from "./networks";
