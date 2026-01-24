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
 * Following TanStack Query best practices for key management
 * @see https://tanstack.com/query/latest/docs/framework/react/community/lukemorales-query-key-factory
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
} as const;

// Type helpers for query keys
export type BalanceQueryKey = ReturnType<typeof bridgeKeys.balance>;
export type EstimateQueryKey = ReturnType<typeof bridgeKeys.estimate>;
export type RouteQueryKey = ReturnType<typeof bridgeKeys.route>;
export type BridgeQueryKey = BalanceQueryKey | EstimateQueryKey | RouteQueryKey;
