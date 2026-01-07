/**
 * Bridge module exports
 * Central export point for all bridge-related functionality
 */

// Core service
export {
  getBridgeService,
  resetBridgeService,
  CCTPBridgeService,
} from "./service";
export type { BridgeServiceConfig } from "./service";

// Event manager
export { BridgeEventManager } from "./event-manager";

// Adapter factory
export {
  getAdapterFactory,
  resetAdapterFactory,
  AdapterFactory,
} from "./adapters/factory";
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
} from "./window-utils";
export type { WindowDimensions, WindowPosition, WindowType } from "./window-utils";

// Hooks
export {
  useBridgeInit,
  useBridgeEstimate,
  useBridge,
  useRetryBridge,
  useRouteSupport,
  useWalletBalance,
  useTransactionHistory,
  useNetworkAutoSwitch,
  useWalletForNetwork,
  useWalletSelection,
  useWalletsByType,
} from "./hooks";
export type { WalletOption } from "./hooks";

// Address validation
export {
  isValidEVMAddress,
  isValidSolanaAddress,
  isValidSuiAddress,
  validateAddressForNetwork,
  getAddressFormatDescription,
} from "./address-validation";

// Error parsing
export {
  parseTransactionError,
  parseStepError,
  isUserRejectionError,
} from "./error-parser";
export type { ParsedError } from "./error-parser";

// Store
export { useBridgeStore } from "./store";
export {
  useEnvironment,
  useSetEnvironment,
  useUserAddress,
  useSetUserAddress,
  useFromChain,
  useToChain,
  useSetFromChain,
  useSetToChain,
  useSwapChains,
  useCurrentTransaction,
  useTransactions,
  useIsLoading,
  useError,
  useActiveWindow,
  useSetActiveWindow,
  useWindowPositions,
  useSetWindowPosition,
  useHasHydrated,
  // Multi-window transaction support
  useOpenTransactionWindows,
  useOpenTransactionWindow,
  useCloseTransactionWindow,
  useFocusTransactionWindow,
  useUpdateTransactionWindowPosition,
  useUpdateTransactionInWindow,
  useMinimizeTransactionWindow,
} from "./store";
export type { TransactionWindow } from "./store";

// Types
export type {
  TransactionStatus,
  BridgeStep,
  BridgeTransaction,
  BridgeEstimate,
  BridgeParams,
  TokenBalance,
  IBridgeService,
  Adapter,
  AdapterCapabilities,
} from "./types";

// Networks
export {
  NETWORK_CONFIGS,
  getNetworksByEnvironment,
  getNetworkCounterpart,
  isRouteSupported,
} from "./networks";
export type {
  NetworkEnvironment,
  SupportedChainId,
  NetworkType,
  NetworkConfig,
} from "./networks";


