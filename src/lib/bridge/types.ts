import type { AdapterContext, ChainDefinition } from "@circle-fin/bridge-kit";
import type { SupportedChainId } from "./networks";
import type { Wallet } from "node_modules/@dynamic-labs/sdk-react-core/src/lib/shared/types/wallets";
import type { WalletConnectorCore } from "@dynamic-labs/wallet-connector-core";

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
 * Gas fee for a specific step
 */
export interface StepGasFee {
  name: string; // e.g., "Approve", "Burn", "Mint"
  token: string; // e.g., "ETH", "SOL"
  blockchain: string; // e.g., "Base_Sepolia", "Arbitrum_Sepolia"
  fees: {
    gas: bigint;
    gasPrice: bigint;
    fee: string; // Formatted fee amount
  };
}

/**
 * Bridge provider fee
 */
export interface ProviderFee {
  type: string; // e.g., "provider"
  token: string; // e.g., "USDC"
  amount: string; // e.g., "0.000001"
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
  // Detailed breakdown
  detailedGasFees?: StepGasFee[];
  providerFees?: ProviderFee[];
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
  initialize(
    wallet?: Wallet<WalletConnectorCore.WalletConnector>,
    allWallets?: Wallet<WalletConnectorCore.WalletConnector>[],
  ): Promise<void>;
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
