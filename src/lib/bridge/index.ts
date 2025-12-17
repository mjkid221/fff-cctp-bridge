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

// Hooks
export {
  useBridgeInit,
  useBridgeEstimate,
  useBridge,
  useRetryBridge,
  useRouteSupport,
  useWalletBalance,
  useTransactionHistory,
  useWalletForNetwork,
  useWalletSelection,
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
} from "./store";

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


