/**
 * CCTP Bridge Service - Refactored with best practices
 *
 * Architecture Principles:
 * 1. Dependency Injection - Services are injected, not hardcoded
 * 2. Single Responsibility - Each class has one job
 * 3. Open/Closed - Open for extension (new chains), closed for modification
 * 4. Proper typing - No type assertions or shortcuts
 * 5. Error handling - Comprehensive error messages and recovery
 */

import { BridgeKit, type BridgeResult } from "@circle-fin/bridge-kit";
import type { AdapterContext } from "@circle-fin/bridge-kit";
import { nanoid } from "nanoid";
import type {
  Wallet,
  WalletConnectorCore,
} from "@dynamic-labs/wallet-connector-core";
import type {
  BridgeEstimate,
  BridgeParams,
  BridgeTransaction,
  IBridgeService,
} from "./types";
import { BridgeStorage } from "./storage";
import { NETWORK_CONFIGS, isRouteSupported } from "./networks";
import type { SupportedChainId } from "./networks";
import { getAdapterFactory, type AdapterFactory } from "./adapters/factory";
import { getBalanceService, type BalanceService } from "./balance/service";
import type { TokenBalance } from "./balance/service";
import { getAttestationTime } from "./attestation-times";

/**
 * Bridge service configuration
 */
export interface BridgeServiceConfig {
  adapterFactory?: AdapterFactory;
  balanceService?: BalanceService;
  storage?: typeof BridgeStorage;
}

/**
 * Bridge operation context
 * Contains all information needed for a bridge operation
 */
interface BridgeOperationContext {
  transactionId: string;
  userAddress: string;
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  amount: string;
  token: string;
  recipientAddress?: string;
  fromAdapter: AdapterContext["adapter"];
  toAdapter: AdapterContext["adapter"];
}

/**
 * CCTP Bridge Service Implementation
 * Orchestrates cross-chain USDC transfers using Circle's CCTP protocol
 */
export class CCTPBridgeService implements IBridgeService {
  private readonly kit: BridgeKit;
  private readonly adapterFactory: AdapterFactory;
  private readonly balanceService: BalanceService;
  private readonly storage: typeof BridgeStorage;

  private userAddress: string | null = null;
  private wallet: Wallet<WalletConnectorCore.WalletConnector> | null = null;
  private wallets: Wallet<WalletConnectorCore.WalletConnector>[] = [];

  constructor(config: BridgeServiceConfig = {}) {
    this.kit = new BridgeKit();
    this.adapterFactory = config.adapterFactory ?? getAdapterFactory();
    this.balanceService = config.balanceService ?? getBalanceService();
    this.storage = config.storage ?? BridgeStorage;
  }

  /**
   * Initialize the bridge service with user wallet
   */
  async initialize(
    wallet?: Wallet<WalletConnectorCore.WalletConnector>,
    allWallets?: Wallet<WalletConnectorCore.WalletConnector>[],
  ): Promise<void> {
    if (!wallet?.address) {
      throw new Error("Address is required");
    }

    this.userAddress = wallet?.address;
    this.wallet = wallet ?? null;
    this.wallets = allWallets ?? (wallet ? [wallet] : []);

    // Clear adapter cache for previous wallet
    this.adapterFactory.clearCache();

    console.log(
      `Bridge service initialized for ${this.userAddress} with ${this.wallets.length} wallet(s)`,
    );
  }

  /**
   * Get adapter for a specific chain
   * Uses the adapter factory for extensible chain support
   * Finds the correct wallet from all connected wallets based on network type
   */
  private async getAdapterForChain(
    chain: SupportedChainId,
  ): Promise<AdapterContext["adapter"]> {
    const network = NETWORK_CONFIGS[chain];
    if (!network) {
      throw new Error(`Invalid chain: ${chain}`);
    }

    // Find a compatible wallet for this network type
    const compatibleWallet = this.wallets.find((w) => {
      try {
        // Check if this wallet can handle this network type
        const creator = this.adapterFactory.getCreator(network.type);
        return creator?.canHandle(w) ?? false;
      } catch {
        return false;
      }
    });

    if (!compatibleWallet) {
      throw new Error(
        `No compatible wallet connected for ${network.type} network. Please connect a ${network.type.toUpperCase()} wallet first.`,
      );
    }

    try {
      return await this.adapterFactory.getAdapter(
        compatibleWallet,
        network.type,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get adapter for ${chain}: ${message}`);
    }
  }

  /**
   * Get USDC balance for a specific chain
   */
  async getBalance(chain: SupportedChainId): Promise<TokenBalance> {
    if (!this.userAddress) {
      throw new Error("Service not initialized");
    }

    const adapter = await this.getAdapterForChain(chain);
    return this.balanceService.getUSDCBalance(adapter, chain, this.userAddress);
  }

  /**
   * Estimate bridge costs and fees
   */
  async estimate(params: BridgeParams): Promise<BridgeEstimate> {
    this.validateBridgeParams(params);

    if (!this.userAddress) {
      throw new Error("Bridge service not initialized");
    }

    const fromAdapter = await this.getAdapterForChain(params.fromChain);
    const toAdapter = await this.getAdapterForChain(params.toChain);

    try {
      const estimate = await this.kit.estimate({
        from: { adapter: fromAdapter, chain: params.fromChain },
        to: {
          adapter: toAdapter,
          chain: params.toChain,
          ...(params.recipientAddress && {
            recipientAddress: params.recipientAddress,
          }),
        },
        amount: params.amount,
      });

      console.log("ESTIMATE--------; ", estimate);

      // Process the estimate result
      const gasFees = estimate.gasFees ?? [];
      const providerFees = estimate.fees ?? [];

      // Calculate total gas fees
      const totalGasFee = gasFees
        .reduce((sum, fee) => {
          const feeAmount = parseFloat(fee?.fees?.fee ?? "0");
          return sum + feeAmount;
        }, 0)
        .toFixed(9);

      // Calculate total provider fees
      const totalProviderFee = providerFees
        .reduce((sum, fee) => {
          const feeAmount = parseFloat(fee?.amount ?? "0");
          return sum + feeAmount;
        }, 0)
        .toFixed(6);

      // Get first gas fee for network info
      const firstGasFee = gasFees[0];

      return {
        fees: {
          network: firstGasFee?.blockchain ?? "unknown",
          bridge: "0", // CCTP has no bridge fees
          total: totalGasFee,
        },
        gasFees: {
          source: gasFees.find((f) => f.name === "Burn")?.fees?.fee ?? "0",
          destination: gasFees.find((f) => f.name === "Mint")?.fees?.fee,
        },
        estimatedTime: getAttestationTime(params.fromChain), // Chain-specific attestation time
        receiveAmount: (
          parseFloat(params.amount) - parseFloat(totalProviderFee)
        ).toString(), // Subtract provider fees
        // Add detailed breakdown
        detailedGasFees: gasFees.map((fee) => ({
          name: fee.name,
          token: fee.token,
          blockchain: fee.blockchain,
          fees: {
            gas: fee.fees?.gas ?? 0n,
            gasPrice: fee.fees?.gasPrice ?? 0n,
            fee: fee.fees?.fee ?? "0",
          },
        })),
        providerFees: providerFees.map((fee) => ({
          type: fee.type,
          token: fee.token,
          amount: fee.amount ?? "0",
        })),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to estimate bridge costs: ${message}`);
    }
  }

  /**
   * Execute a bridge transaction
   */
  async bridge(params: BridgeParams): Promise<BridgeTransaction> {
    this.validateBridgeParams(params);

    if (!this.userAddress) {
      throw new Error("Bridge service not initialized");
    }

    // Validate the route
    if (!isRouteSupported(params.fromChain, params.toChain)) {
      throw new Error(
        `Route not supported: ${params.fromChain} -> ${params.toChain}`,
      );
    }

    // Create operation context
    const context = await this.createOperationContext(params);

    // Create initial transaction record
    const transaction = this.createInitialTransaction(context);

    // Save to storage
    await this.storage.saveTransaction(transaction);

    try {
      // Execute the bridge operation
      await this.executeBridgeOperation(context, transaction);
    } catch (error) {
      // Handle bridge execution errors
      await this.handleBridgeError(transaction, error);
    }

    // Save final state
    transaction.updatedAt = Date.now();
    await this.storage.saveTransaction(transaction);

    return transaction;
  }

  /**
   * Retry a failed transaction
   */
  async retry(transactionId: string): Promise<BridgeTransaction> {
    if (!this.userAddress) {
      throw new Error("Bridge service not initialized");
    }

    const originalTx = await this.storage.getTransaction(transactionId);
    if (!originalTx) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    if (originalTx.userAddress !== this.userAddress) {
      throw new Error("Transaction does not belong to current user");
    }

    if (originalTx.status !== "failed") {
      throw new Error(
        `Only failed transactions can be retried. Current status: ${originalTx.status}`,
      );
    }

    // Create new transaction with same parameters
    return this.bridge({
      fromChain: originalTx.fromChain,
      toChain: originalTx.toChain,
      amount: originalTx.amount,
      token: originalTx.token,
      recipientAddress: originalTx.destinationTxHash?.split(":")[1], // Extract if available
    });
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(
    transactionId: string,
  ): Promise<BridgeTransaction | null> {
    const tx = await this.storage.getTransaction(transactionId);
    return tx ?? null;
  }

  /**
   * Get all transactions for current user
   */
  async getTransactions(): Promise<BridgeTransaction[]> {
    if (!this.userAddress) {
      return [];
    }

    return this.storage.getTransactionsByUser(this.userAddress);
  }

  /**
   * Check if a route is supported
   */
  async supportsRoute(
    from: SupportedChainId,
    to: SupportedChainId,
    _token = "USDC",
  ): Promise<boolean> {
    try {
      return isRouteSupported(from, to);
    } catch {
      return false;
    }
  }

  /**
   * Reset the service (useful when switching accounts)
   */
  reset(): void {
    this.adapterFactory.clearCache(this.userAddress ?? undefined);
    this.userAddress = null;
    this.wallet = null;
    this.wallets = [];
    console.log("Bridge service reset");
  }

  // ==================== Private Helper Methods ====================

  /**
   * Validate bridge parameters
   */
  private validateBridgeParams(params: BridgeParams): void {
    if (!params.fromChain) {
      throw new Error("Source chain is required");
    }

    if (!params.toChain) {
      throw new Error("Destination chain is required");
    }

    if (params.fromChain === params.toChain) {
      throw new Error("Source and destination chains must be different");
    }

    if (!params.amount || parseFloat(params.amount) <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Validate amount format
    const amountNum = parseFloat(params.amount);
    if (isNaN(amountNum)) {
      throw new Error("Invalid amount format");
    }

    // USDC has 6 decimals, validate decimal places
    const decimals = params.amount.split(".")[1]?.length ?? 0;
    if (decimals > 6) {
      throw new Error("Amount has too many decimal places (max 6 for USDC)");
    }
  }

  /**
   * Create operation context with adapters
   */
  private async createOperationContext(
    params: BridgeParams,
  ): Promise<BridgeOperationContext> {
    const fromAdapter = await this.getAdapterForChain(params.fromChain);
    const toAdapter = await this.getAdapterForChain(params.toChain);

    return {
      transactionId: nanoid(),
      userAddress: this.userAddress!,
      fromChain: params.fromChain,
      toChain: params.toChain,
      amount: params.amount,
      token: params.token ?? "USDC",
      recipientAddress: params.recipientAddress,
      fromAdapter,
      toAdapter,
    };
  }

  /**
   * Create initial transaction record
   */
  private createInitialTransaction(
    context: BridgeOperationContext,
  ): BridgeTransaction {
    return {
      id: context.transactionId,
      userAddress: context.userAddress,
      fromChain: context.fromChain,
      toChain: context.toChain,
      amount: context.amount,
      token: context.token,
      status: "pending",
      steps: [
        {
          id: "approve",
          name: "Approve USDC",
          status: "pending",
          timestamp: Date.now(),
        },
        {
          id: "burn",
          name: "Burn on source chain",
          status: "pending",
          timestamp: Date.now(),
        },
        {
          id: "attest",
          name: "Attestation",
          status: "pending",
          timestamp: Date.now(),
        },
        {
          id: "mint",
          name: "Mint on destination chain",
          status: "pending",
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedTime: getAttestationTime(context.fromChain), // Chain-specific attestation time
    };
  }

  /**
   * Execute the bridge operation
   */
  private async executeBridgeOperation(
    context: BridgeOperationContext,
    transaction: BridgeTransaction,
  ): Promise<void> {
    // Update status to bridging
    transaction.status = "bridging";
    const firstStep = transaction.steps[0];
    if (firstStep) {
      firstStep.status = "in_progress";
    }
    await this.storage.saveTransaction(transaction);

    // Execute bridge through Circle's Bridge Kit
    const result: BridgeResult = await this.kit.bridge({
      from: { adapter: context.fromAdapter, chain: context.fromChain },
      to: {
        adapter: context.toAdapter,
        chain: context.toChain,
        ...(context.recipientAddress && {
          recipientAddress: context.recipientAddress,
        }),
      },
      amount: context.amount,
      token: "USDC",
    });

    // Process the result
    await this.processBridgeResult(transaction, result);
  }

  /**
   * Process bridge result and update transaction
   */
  private async processBridgeResult(
    transaction: BridgeTransaction,
    result: BridgeResult,
  ): Promise<void> {
    if (result.state === "success") {
      transaction.status = "completed";
      transaction.completedAt = Date.now();

      // Mark all steps as completed
      transaction.steps.forEach((step) => {
        step.status = "completed";
      });

      // Extract transaction hashes
      this.extractTransactionHashes(transaction, result);
    } else {
      transaction.status = "failed";

      // Extract error information
      const errorMessage = this.extractErrorMessage(result);
      transaction.error = errorMessage;

      // Update steps based on result
      this.updateStepsFromResult(transaction, result);
    }
  }

  /**
   * Extract transaction hashes from bridge result
   */
  private extractTransactionHashes(
    transaction: BridgeTransaction,
    result: BridgeResult,
  ): void {
    if (!result.steps || result.steps.length === 0) return;

    // Find burn step
    const burnStep = result.steps.find((s) =>
      s.name?.toLowerCase().includes("burn"),
    );
    if (burnStep && "txHash" in burnStep && burnStep.txHash) {
      transaction.sourceTxHash = String(burnStep.txHash);
    }

    // Find mint step
    const mintStep = result.steps.find((s) =>
      s.name?.toLowerCase().includes("mint"),
    );
    if (mintStep && "txHash" in mintStep && mintStep.txHash) {
      transaction.destinationTxHash = String(mintStep.txHash);
    }
  }

  /**
   * Extract error message from result
   */
  private extractErrorMessage(result: BridgeResult): string {
    const errorStep = result.steps.find((s) => s.state === "error");

    if (errorStep && "errorMessage" in errorStep && errorStep.errorMessage) {
      return String(errorStep.errorMessage);
    }

    if (errorStep && "error" in errorStep && errorStep.error instanceof Error) {
      return errorStep.error.message;
    }

    return "Bridge transaction failed";
  }

  /**
   * Update transaction steps from result
   */
  private updateStepsFromResult(
    transaction: BridgeTransaction,
    result: BridgeResult,
  ): void {
    if (!result.steps) return;

    result.steps.forEach((resultStep, index) => {
      const step = transaction.steps[index];
      if (!step) return;

      // Update step status
      step.status =
        resultStep.state === "success"
          ? "completed"
          : resultStep.state === "error"
            ? "failed"
            : "pending";

      // Extract transaction hash if available
      if ("txHash" in resultStep && resultStep.txHash) {
        step.txHash = String(resultStep.txHash);
      }

      // Extract error if step failed
      if (resultStep.state === "error") {
        if ("errorMessage" in resultStep && resultStep.errorMessage) {
          step.error = String(resultStep.errorMessage);
        } else if ("error" in resultStep && resultStep.error instanceof Error) {
          step.error = resultStep.error.message;
        }
      }
    });
  }

  /**
   * Handle bridge execution errors
   */
  private async handleBridgeError(
    transaction: BridgeTransaction,
    error: unknown,
  ): Promise<void> {
    transaction.status = "failed";
    transaction.error =
      error instanceof Error ? error.message : "Unknown bridge error";

    // Mark first step as failed
    const firstStep = transaction.steps[0];
    if (firstStep) {
      firstStep.status = "failed";
      firstStep.error = transaction.error;
    }

    console.error("Bridge execution failed:", error);
  }
}

// Singleton instance
let bridgeServiceInstance: CCTPBridgeService | null = null;

/**
 * Get bridge service instance
 */
export function getBridgeService(): CCTPBridgeService {
  if (!bridgeServiceInstance) {
    bridgeServiceInstance = new CCTPBridgeService();
  }
  return bridgeServiceInstance;
}

/**
 * Reset bridge service instance (useful for testing or account switching)
 */
export function resetBridgeService(): void {
  if (bridgeServiceInstance) {
    bridgeServiceInstance.reset();
  }
  bridgeServiceInstance = null;
}
