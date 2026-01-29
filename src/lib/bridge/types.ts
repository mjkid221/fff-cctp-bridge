import type { SupportedChainId } from "./networks";
import type { IWallet } from "~/lib/wallet/types";

/**
 * Transfer method for bridging
 * - 'standard': Lower fees (0% bridge fee), slower completion (~15-19 min finality)
 * - 'fast': Higher fees (1-14 bps), faster completion (seconds)
 */
export type TransferMethod = "standard" | "fast";

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
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
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
  notificationId?: string; // Link to notification for this transaction
  bridgeResult?: unknown; // Store Bridge Kit result for retry (as unknown since it's from external lib)
  recipientAddress?: string; // Store recipient address for retry

  // Wallet addresses for auditing
  sourceAddress?: string; // Source chain wallet address
  destinationAddress?: string; // Destination chain wallet address

  // Transfer method and USDC fee tracking
  transferMethod?: TransferMethod; // Which mode was used (standard/fast)
  providerFeeUsdc?: string; // CCTP provider fee in USDC (fast mode only)
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
  /** Transfer method: 'standard' (slow, low fees) or 'fast' (quick, higher fees) */
  transferMethod?: TransferMethod;
  /** Explicit source wallet for signing source chain transactions */
  sourceWallet?: IWallet;
  /** Explicit destination wallet for signing destination chain transactions */
  destWallet?: IWallet;
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
  initialize(wallet?: IWallet, allWallets?: IWallet[]): Promise<void>;
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
   * Resume an in-progress transaction after page refresh.
   * This continues attestation polling and bridge completion.
   */
  resume(transactionId: string): Promise<BridgeTransaction>;

  /**
   * Get transaction by ID
   */
  getTransaction(transactionId: string): Promise<BridgeTransaction | null>;

  /**
   * Get all transactions for current user
   */
  getTransactions(): Promise<BridgeTransaction[]>;
}

/**
 * Wallet option for UI selection dropdowns
 */
export interface WalletOption {
  id: string;
  address: string;
  connector: {
    key: string;
    name?: string;
  };
}
