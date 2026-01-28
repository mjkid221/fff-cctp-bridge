import type { NetworkEnvironment } from "./networks";
import type { SupportedChainId } from "./networks";
import type { TransferMethod } from "./types";

/**
 * Parameters for estimate query keys (excludes non-serializable wallet objects)
 */
export interface EstimateKeyParams {
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  amount: string;
  recipientAddress?: string;
  transferMethod?: TransferMethod;
}

/**
 * Query key factory for bridge-related queries
 * Inspired by TanStack Query best practices for key management
 * @see https://github.com/lukemorales/query-key-factory
 */
export const bridgeKeys = {
  // Root key for all bridge queries
  all: ["bridge"] as const,

  // Balance queries
  balances: () => [...bridgeKeys.all, "balance"] as const,
  balance: (chainId: SupportedChainId | null, userAddress: string | null) =>
    [...bridgeKeys.balances(), { chainId, userAddress }] as const,

  // Estimate queries
  estimates: () => [...bridgeKeys.all, "estimate"] as const,
  estimate: (params: EstimateKeyParams) =>
    [...bridgeKeys.estimates(), params] as const,

  // Route queries
  routes: () => [...bridgeKeys.all, "route"] as const,
  route: (from: SupportedChainId | null, to: SupportedChainId | null) =>
    [...bridgeKeys.routes(), { from, to }] as const,

  // Transaction history queries
  transactionHistories: () =>
    [...bridgeKeys.all, "transactionHistory"] as const,
  transactionHistory: (userAddress: string | null) =>
    [...bridgeKeys.transactionHistories(), userAddress] as const,

  // Stats queries
  stats: () => ["userStats"] as const,
  userStats: (
    userAddress: string | null,
    environment: NetworkEnvironment | null,
  ) => [...bridgeKeys.stats(), userAddress, environment] as const,
} as const;

// Type helpers for query keys
export type BalanceQueryKey = ReturnType<typeof bridgeKeys.balance>;
export type EstimateQueryKey = ReturnType<typeof bridgeKeys.estimate>;
export type RouteQueryKey = ReturnType<typeof bridgeKeys.route>;
export type TransactionHistoryQueryKey = ReturnType<
  typeof bridgeKeys.transactionHistory
>;
export type StatsQueryKey = ReturnType<typeof bridgeKeys.userStats>;
export type BridgeQueryKey =
  | BalanceQueryKey
  | EstimateQueryKey
  | RouteQueryKey
  | TransactionHistoryQueryKey
  | StatsQueryKey;
