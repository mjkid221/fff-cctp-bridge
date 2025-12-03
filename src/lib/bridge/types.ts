import type { AdapterContext, ChainDefinition } from "@circle-fin/bridge-kit";
import type { SupportedChainId } from "./networks";

/**
 * Transaction status types
 */
export type TransactionStatus =
  | "pending"
  | "approving"
  | "approved"
  | "bridging"
  | "confirming"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Bridge transaction step
 */
export interface BridgeStep {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  txHash?: string;
  error?: string;
  timestamp: number;
}

/**
 * Bridge transaction record
 */
export interface BridgeTransaction {
  id: string;
  userAddress: string;
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  amount: string;
  token: string;
  status: TransactionStatus;
  steps: BridgeStep[];
  sourceTxHash?: string;
  destinationTxHash?: string;
  attestationHash?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  estimatedTime?: number;
  fees?: {
    network: string;
    bridge: string;
    total: string;
  };
}

/**
 * Bridge estimate result
 */
export interface BridgeEstimate {
  fees: {
    network: string;
    bridge: string;
    total: string;
  };
  gasFees: {
    source: string;
    destination?: string;
  };
  estimatedTime: number;
  receiveAmount: string;
}

/**
 * Bridge operation parameters
 */
export interface BridgeParams {
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  amount: string;
  token?: string;
  recipientAddress?: string;
}

/**
 * Token balance information
 */
export interface TokenBalance {
  balance: string; // Raw balance string
  formatted: string; // Human-readable formatted balance
  decimals: number;
  symbol: string;
}

/**
 * Bridge service interface
 */
export interface IBridgeService {
  /**
   * Initialize the bridge service with user wallet
   */
  initialize(address: string): Promise<void>;
  /**
   * Get token balance for a specific chain
   */
  getBalance(chain: SupportedChainId): Promise<TokenBalance>;

  /**
   * Get token balance for a specific chain
   */
  getBalance(chain: SupportedChainId): Promise<TokenBalance>;
  /**
   * Estimate bridge costs
   */
  estimate(params: BridgeParams): Promise<BridgeEstimate>;

  /**
   * Execute bridge transaction
   */
  bridge(params: BridgeParams): Promise<BridgeTransaction>;

  /**
   * Retry a failed transaction
   */
  retry(transactionId: string): Promise<BridgeTransaction>;

  /**
   * Get transaction by ID
   */
  getTransaction(transactionId: string): Promise<BridgeTransaction | null>;

  /**
   * Get all transactions for current user
   */
  getTransactions(): Promise<BridgeTransaction[]>;

  /**
   * Check if a route is supported
   */
  supportsRoute(
    from: SupportedChainId,
    to: SupportedChainId,
    token?: string,
  ): Promise<boolean>;
}

export interface AdapterCapabilities {
  addressContext: "user-controlled" | "developer-controlled";
  supportedChains: ChainDefinition[];
}

export type Adapter = AdapterContext<AdapterCapabilities>["adapter"];
